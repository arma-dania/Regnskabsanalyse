// Lagringslag. Alt, der rører Netlify Blobs, ligger her, så lagringen kan
// skiftes uden at røre endepunkterne: de kender kun funktionerne herunder.
//
// Nøgler:
//   hold/<holdId>                              et hold (fx "MØK 2026 forår")
//   studerende/<holdId>/<studId>               en studerende: navn og kode
//   kode/<kode>                                opslag fra adgangskode til studerende
//   trin/<holdId>/<studId>/<case>__<omr>       seneste trinvurdering for ét område
//   haendelse/<holdId>/<tid>-<studId>-<tilf>   én logget handling
//   spaerre/<noegle>                           tæller til begrænsning af loginforsøg
//
// Bemærk, at de studerendes analysetekster IKKE står på listen. De sendes til
// Claude for at få feedback og forsvinder derefter. Kun trinvurderingen og de
// faste temamærkater gemmes, fordi det er dem, underviseren skal handle på.

import { getStore } from "@netlify/blobs";

const store = () => getStore({ name: "regnskabsanalyse", consistency: "strong" });

export const laes = async noegle => (await store().get(noegle, { type: "json" })) ?? null;
export const skriv = (noegle, vaerdi) => store().setJSON(noegle, vaerdi);
export const slet = noegle => store().delete(noegle);

// Henter alle værdier under et præfiks. Blobs har ingen samlet hent, så
// nøglerne listes og hentes parallelt.
export async function laesAlle(praefiks) {
  const { blobs } = await store().list({ prefix: praefiks });
  const vaerdier = await Promise.all(blobs.map(b => laes(b.key)));
  return vaerdier.filter(Boolean);
}

export async function sletAlle(praefiks) {
  const { blobs } = await store().list({ prefix: praefiks });
  await Promise.all(blobs.map(b => slet(b.key)));
  return blobs.length;
}

export const nytId = praefiks =>
  `${praefiks}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// Case- og områdenavne kommer fra klienten og bliver del af en nøgle. Uden
// rensning kunne en skråstreg lave nye niveauer i nøglerummet og skrive uden
// for den studerendes eget område.
export const rens = s => String(s ?? "").toLowerCase().replace(/[^a-z0-9æøå-]+/g, "-").slice(0, 40);

/* ---------- Hold ---------- */
export const hentHold = id => laes(`hold/${id}`);
export const gemHold = h => skriv(`hold/${h.id}`, h);
export const alleHold = () => laesAlle("hold/");

// Sletter et hold med alt, hvad der hænger på det. Bruges ved semesterslut,
// så de studerendes data ikke ligger længere end nødvendigt.
export async function sletHold(holdId) {
  const studerende = await hentStuderendePaaHold(holdId);
  await Promise.all(studerende.flatMap(s => [slet(`kode/${s.kode}`), slet(`spaerre/ai/${s.id}`)]));
  const antal = {
    studerende: studerende.length,
    trin: await sletAlle(`trin/${holdId}/`),
    haendelser: await sletAlle(`haendelse/${holdId}/`),
  };
  await sletAlle(`studerende/${holdId}/`);
  await slet(`hold/${holdId}`);
  return antal;
}

/* ---------- Studerende ---------- */
export const hentStuderende = (holdId, id) => laes(`studerende/${holdId}/${id}`);
export const gemStuderende = s => skriv(`studerende/${s.holdId}/${s.id}`, s);
export const hentStuderendePaaHold = holdId => laesAlle(`studerende/${holdId}/`);

// Adgangskoden er en henvisning til den studerende, ikke en adgangskode i
// gængs forstand: den gælder kun dette værktøj og udskiftes frit.
export async function findVedKode(kode) {
  const henvisning = await laes(`kode/${String(kode).toLowerCase()}`);
  if (!henvisning) return null;
  return hentStuderende(henvisning.holdId, henvisning.studId);
}
export const knytKode = (kode, holdId, studId) => skriv(`kode/${kode.toLowerCase()}`, { holdId, studId });
export const frigivKode = kode => slet(`kode/${String(kode).toLowerCase()}`);

/* ---------- Trinvurderinger ---------- */
// Én nøgle pr. studerende pr. område pr. case, og den overskrives ved næste
// forsøg. Underviseren skal se, hvor langt de er NÅET – ikke hver mellemstation
// undervejs. Antallet af forsøg tælles med, fordi det er forskellen på en, der
// ramte trin 3 i første hug, og en, der arbejdede sig derhen.
const trinNoegle = (holdId, studId, caseId, omr) =>
  `trin/${holdId}/${studId}/${rens(caseId)}__${rens(omr)}`;

export const hentTrin = (holdId, studId, caseId, omr) => laes(trinNoegle(holdId, studId, caseId, omr));
export const hentTrinPaaHold = holdId => laesAlle(`trin/${holdId}/`);

export async function gemTrin(holdId, studId, caseId, omr, vurdering) {
  const noegle = trinNoegle(holdId, studId, caseId, omr);
  const nu = new Date().toISOString();
  const gammel = await laes(noegle);
  const post = {
    holdId,
    studId,
    caseId: rens(caseId),
    omr: rens(omr),
    ...vurdering,
    forsoeg: (gammel?.forsoeg ?? 0) + 1,
    foerste: gammel?.foerste ?? nu,
    sidst: nu,
    // Det højeste, de har nået på dette område, uanset om et senere forsøg
    // faldt tilbage. Ellers ville en studerende, der prøver en kortere
    // formulering af, se ud som en, der er gået tilbage i læring.
    bedste: bedsteTrin(gammel?.bedste, vurdering.trin),
  };
  await skriv(noegle, post);
  return post;
}

const RANG = { mangler: 0, delvist: 1, naaet: 2 };

// Sammenfletter to trinvurderinger og beholder det højeste pr. trin.
export function bedsteTrin(gammel, ny) {
  const ud = { ...(gammel ?? {}) };
  for (const [trin, vaerdi] of Object.entries(ny ?? {})) {
    if ((RANG[vaerdi] ?? 0) >= (RANG[ud[trin]] ?? -1)) ud[trin] = vaerdi;
  }
  return ud;
}

/* ---------- Hændelser ---------- */
// Hver hændelse får sin egen nøgle, så to samtidige skrivninger ikke kan
// overskrive hinanden. Tidsstemplet forrest gør, at listen kommer sorteret.
// Den studerendes id står i nøglen, så alt om én studerende kan slettes uden
// at læse hændelserne igennem.
export function noterHaendelse(holdId, haendelse) {
  const tid = new Date().toISOString();
  const noegle = `haendelse/${holdId}/${tid}-${haendelse.studId ?? "ukendt"}-${Math.random().toString(36).slice(2, 8)}`;
  return skriv(noegle, { tid, ...haendelse });
}
export const hentHaendelserPaaHold = holdId => laesAlle(`haendelse/${holdId}/`);

// Sletter en studerende med alt, der er gemt om vedkommende: kode, trin og
// hændelser. Bruges, når en studerende forlader holdet.
export async function sletStuderendeHelt(s) {
  await frigivKode(s.kode);
  await sletAlle(`trin/${s.holdId}/${s.id}/`);
  const { blobs } = await store().list({ prefix: `haendelse/${s.holdId}/` });
  await Promise.all(blobs.filter(b => b.key.includes(`-${s.id}-`)).map(b => slet(b.key)));
  await slet(`spaerre/ai/${s.id}`);
  await slet(`studerende/${s.holdId}/${s.id}`);
}

/* ---------- Begrænsning af loginforsøg ---------- */
export async function taelForsoeg(noegle, vindueMs) {
  const nu = Date.now();
  const gemt = await laes(`spaerre/${noegle}`);
  const taeller = gemt && gemt.udloeber > nu ? gemt : { antal: 0, udloeber: nu + vindueMs };
  taeller.antal += 1;
  await skriv(`spaerre/${noegle}`, taeller);
  return taeller.antal;
}
export const nulstilForsoeg = noegle => slet(`spaerre/${noegle}`);
