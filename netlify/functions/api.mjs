// De studerendes API. Alt kræver en gyldig session, undtagen login selv.
//
// Feedback-endepunkterne gør to ting i ét kald: de giver den studerende sin
// feedback, og de gemmer trinvurderingen til underviserens overblik. Selve
// teksten gemmes ikke. Fejler lagringen, får den studerende stadig sin
// feedback – overblikket er et bihverv, ikke en forudsætning.

import { json, fejl, krop, klientIp, ruter } from "./lib/svar.mjs";
import * as auth from "./lib/auth.mjs";
import * as lager from "./lib/lager.mjs";
import * as trappe from "./lib/trappe.mjs";
import { spoerg, ClaudeFejl } from "./lib/claude.mjs";

const MAKS_LOGINFORSOEG = 10;
const LOGIN_VINDUE_MS = 10 * 60e3;

// Hvert kald til Claude koster. Grænsen er sat, så ingen studerende rammer
// den ved at arbejde – men så en, der holder knappen nede, ikke kan løbe
// regningen op.
const MAKS_AI_KALD_PR_TIME = 60;

const GYLDIGE_CASES = new Set(["let", "mellem", "svaer", "ai"]);

// Pakker session og stamdata ud, så hver handler ikke skal hente det samme.
async function medSession(req, handler) {
  const session = await auth.hentSession(req);
  if (!auth.erStuderende(session)) return fejl("Du er ikke logget ind.", 401);
  const studerende = await lager.hentStuderende(session.holdId, session.studId);
  if (!studerende) return fejl("Din bruger findes ikke længere.", 401, { "set-cookie": auth.ryddCookie() });
  return handler({ session, studerende });
}

// Samme indpakning for alt, der kalder Claude: grænse for antal kald, og
// modellens fejl oversat til en besked, den studerende kan handle på.
const medClaude = (req, handler) =>
  medSession(req, async ctx => {
    if ((await lager.taelForsoeg(`ai/${ctx.session.studId}`, 3600e3)) > MAKS_AI_KALD_PR_TIME)
      return fejl("Du har brugt mange AI-kald den seneste time. Hold en pause, og prøv igen senere.", 429);
    try {
      return await handler(ctx);
    } catch (e) {
      if (e instanceof ClaudeFejl) return fejl(e.message, 502);
      throw e;
    }
  });

// Logningen må aldrig vælte feedbacken. Den køres til ende, men en fejl
// skrives kun i Netlifys log.
async function stille(opgave) {
  try {
    await opgave();
  } catch (e) {
    console.error("Kunne ikke gemme til overblikket:", e);
  }
}

// Fælles udpakning af casekonteksten, som klienten sender med. Casene ligger i
// klienten, fordi der intet facit er at skjule – men serveren bestemmer selv,
// hvilke felter der bruges, og hvor lange de må være.
function caseKontekst(b) {
  return {
    caseId: String(b?.caseId ?? ""),
    virksomhed: String(b?.virksomhed ?? "").slice(0, 80),
    branche: String(b?.branche ?? "").slice(0, 80),
    forretningsmodel: String(b?.forretningsmodel ?? ""),
    beretning: String(b?.beretning ?? ""),
  };
}

/* ---------- Login ---------- */
async function login(req) {
  const b = await krop(req);
  if (!b?.kode) return fejl("Skriv din adgangskode.");

  // Uden en grænse kan koder gættes maskinelt. Grænsen følger afsenderen,
  // ikke koden, så en enkelt studerende ikke kan spærre for hele holdet.
  const spaerrenoegle = `ip/${klientIp(req)}`;
  if ((await lager.taelForsoeg(spaerrenoegle, LOGIN_VINDUE_MS)) > MAKS_LOGINFORSOEG)
    return fejl("For mange forsøg. Vent ti minutter, eller spørg underviseren om en ny kode.", 429);

  const indhold = await auth.loginMedKode(b.kode);
  if (!indhold) {
    // Skriver en underviser sin kode her i stedet for på /underviser, logges
    // vedkommende ind som underviser og sendes videre. Ellers ville beskeden
    // "den kode kender vi ikke" få en gyldig kode til at ligne en forkert.
    let underviser = null;
    try {
      underviser = auth.loginSomUnderviser(String(b.kode).trim());
    } catch {
      // Ingen underviserkoder sat – så er det bare en ukendt kode.
    }
    if (underviser) {
      await lager.nulstilForsoeg(spaerrenoegle);
      return json({ underviser: true }, 200, { "set-cookie": auth.saetCookie(await auth.lavSession(underviser)) });
    }
    return fejl("Den kode kender vi ikke. Tjek den efter, eller spørg underviseren.", 401);
  }
  await lager.nulstilForsoeg(spaerrenoegle);

  const studerende = await lager.hentStuderende(indhold.holdId, indhold.studId);
  await lager.gemStuderende({ ...studerende, sidstSet: new Date().toISOString() });
  await lager.noterHaendelse(indhold.holdId, { studId: indhold.studId, type: "login" });

  return json({ ok: true }, 200, { "set-cookie": auth.saetCookie(await auth.lavSession(indhold)) });
}

const logud = () => json({ ok: true }, 200, { "set-cookie": auth.ryddCookie() });

/* ---------- Hvem er jeg ---------- */
const mig = req =>
  medSession(req, async ({ session, studerende }) => {
    const hold = await lager.hentHold(session.holdId);
    // Et besøg tæller som aktivitet, også når cookien stadig er gyldig og
    // der ikke logges ind igen. Ellers ville en studerende, der arbejder hver
    // dag på samme cookie, se inaktiv ud.
    await stille(async () => {
      await lager.gemStuderende({ ...studerende, sidstSet: new Date().toISOString() });
      await lager.noterHaendelse(session.holdId, { studId: session.studId, type: "besoeg" });
    });
    return json({ navn: studerende.navn, hold: hold?.navn ?? "" });
  });

/* ---------- Den studerendes egne trin ---------- */
// Så trinmærkerne står der igen, når siden genindlæses.
const mineTrin = req =>
  medSession(req, async ({ session }) => {
    const alle = await lager.laesAlle(`trin/${session.holdId}/${session.studId}/`);
    return json({
      trin: alle.map(t => ({ caseId: t.caseId, omr: t.omr, trin: t.trin, bedste: t.bedste, paatvaers: t.paatvaers ?? null })),
    });
  });

/* ---------- Feedback på ét område (trin 1-3) ---------- */
const feedback = req =>
  medClaude(req, async ({ session }) => {
    const b = await krop(req);
    const kontekst = caseKontekst(b);
    if (!GYLDIGE_CASES.has(kontekst.caseId)) return fejl("Ukendt datasæt.");
    const omraade = trappe.findOmraade(b?.omr);
    if (!omraade) return fejl("Ukendt analyseområde.");

    const trin = Object.fromEntries(trappe.OMRAADETRIN.map(id => [id, String(b?.trin?.[id] ?? "")]));
    const samlet = Object.values(trin).join("").trim().length;
    if (samlet < 40) return fejl("Skriv lidt mere først – mindst et par sætninger – så kan du få brugbar feedback.");
    if (Object.values(trin).some(t => t.length > trappe.MAKS_TRINTEGN))
      return fejl(`Hvert trin må højst være ${trappe.MAKS_TRINTEGN} tegn.`);

    const raa = await spoerg(
      trappe.feedbackPrompt({ ...kontekst, omraade, noegletal: b?.noegletal, trin }),
      { maxTokens: 4000 }
    );
    const { prosa, vurdering } = trappe.tolkVurdering(raa, trappe.OMRAADETRIN);

    let bedste = null;
    await stille(() => lager.noterHaendelse(session.holdId, { studId: session.studId, type: "feedback", caseId: lager.rens(kontekst.caseId), omr: omraade.id }));
    if (vurdering)
      await stille(async () => { bedste = (await lager.gemTrin(session.holdId, session.studId, kontekst.caseId, omraade.id, vurdering)).bedste; });

    return json({ feedback: trappe.rensProsa(prosa), trin: vurdering?.trin ?? null, bedste });
  });

/* ---------- Vejledende besvarelse ---------- */
const vejledende = req =>
  medClaude(req, async ({ session }) => {
    const b = await krop(req);
    const kontekst = caseKontekst(b);
    if (!GYLDIGE_CASES.has(kontekst.caseId)) return fejl("Ukendt datasæt.");
    const omraade = trappe.findOmraade(b?.omr);
    if (!omraade) return fejl("Ukendt analyseområde.");

    const tekst = await spoerg(trappe.vejledendePrompt({ ...kontekst, omraade, noegletal: b?.noegletal }), { maxTokens: 4000 });
    // At den studerende henter den vejledende besvarelse, er en oplysning,
    // underviseren kan bruge: henter de den før eller efter, de har skrevet?
    await stille(() =>
      lager.noterHaendelse(session.holdId, { studId: session.studId, type: "vejledende", caseId: lager.rens(kontekst.caseId), omr: omraade.id })
    );
    return json({ tekst: trappe.rensProsa(tekst) });
  });

/* ---------- Feedback på den samlede konklusion (trin 4) ---------- */
const konklusion = req =>
  medClaude(req, async ({ session }) => {
    const b = await krop(req);
    const kontekst = caseKontekst(b);
    if (!GYLDIGE_CASES.has(kontekst.caseId)) return fejl("Ukendt datasæt.");
    const tekst = String(b?.konklusion ?? "");
    if (tekst.trim().length < 40) return fejl("Skriv lidt mere på den samlede konklusion først – mindst et par sætninger.");
    if (tekst.length > trappe.MAKS_KONKLUSIONSTEGN)
      return fejl(`Konklusionen må højst være ${trappe.MAKS_KONKLUSIONSTEGN} tegn.`);

    const raa = await spoerg(
      trappe.konklusionPrompt({ ...kontekst, omraadetekster: String(b?.omraadetekster ?? ""), konklusion: tekst }),
      { maxTokens: 4000 }
    );
    const { prosa, vurdering } = trappe.tolkVurdering(raa, trappe.KONKLUSIONSTRIN);

    let bedste = null;
    await stille(() => lager.noterHaendelse(session.holdId, { studId: session.studId, type: "konklusion", caseId: lager.rens(kontekst.caseId) }));
    if (vurdering)
      await stille(async () => { bedste = (await lager.gemTrin(session.holdId, session.studId, kontekst.caseId, "konklusion", vurdering)).bedste; });

    return json({
      feedback: trappe.rensProsa(prosa),
      trin: vurdering?.trin ?? null,
      paatvaers: vurdering?.paatvaers ?? null,
      bedste,
    });
  });

/* ---------- Nyt datasæt ---------- */
const nytSaet = req =>
  medClaude(req, async ({ session }) => {
    const raa = await spoerg(trappe.nytSaetPrompt(trappe.nytSaetStruktur()), { maxTokens: 8000 });
    const saet = trappe.tolkNytSaet(raa);
    if (!saet) return fejl("Kunne ikke lave et nyt sæt lige nu. Prøv igen.", 502);
    await stille(() => lager.noterHaendelse(session.holdId, { studId: session.studId, type: "nyt-saet" }));
    return json({ saet });
  });

/* ---------- Hændelser fra klienten ---------- */
// Kun en lukket liste, så klienten ikke kan fylde overblikket med opdigtede
// hændelsestyper.
const TILLADTE_HAENDELSER = new Set(["fane", "quiz-faerdig", "rapport", "tips", "model-vist"]);

const haendelse = req =>
  medSession(req, async ({ session }) => {
    const b = await krop(req);
    if (!TILLADTE_HAENDELSER.has(b?.type)) return fejl("Ukendt hændelse.");
    await lager.noterHaendelse(session.holdId, {
      studId: session.studId,
      type: b.type,
      ...(b.detalje ? { detalje: String(b.detalje).slice(0, 40) } : {}),
    });
    return json({ ok: true });
  });

export default ruter({
  "POST /api/login": login,
  "POST /api/logud": logud,
  "GET /api/mig": mig,
  "GET /api/mine-trin": mineTrin,
  "POST /api/feedback": feedback,
  "POST /api/vejledende": vejledende,
  "POST /api/konklusion": konklusion,
  "POST /api/nyt-saet": nytSaet,
  "POST /api/haendelse": haendelse,
});

export const config = { path: "/api/*" };
