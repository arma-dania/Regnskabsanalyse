// Underviserens API. Alt herunder kræver underviser-session.

import { json, fejl, krop, klientIp, ruter } from "./lib/svar.mjs";
import * as auth from "./lib/auth.mjs";
import * as lager from "./lib/lager.mjs";
import { OMRAADER, TEMAER, TEMANAVN, NIVEAUNAVN } from "./lib/trappe.mjs";
import { studerendeBillede, holdBillede } from "./lib/overblik.mjs";

const MAKS_FORSOEG = 8;
const VINDUE_MS = 15 * 60e3;

async function medUnderviser(req, handler) {
  const session = await auth.hentSession(req);
  if (!auth.erUnderviser(session)) return fejl("Log ind som underviser.", 401);
  return handler(session);
}

// Henter holdet og tjekker, at det er den indloggede undervisers.
//
// Uden dette tjek på hvert endepunkt kunne en underviser nå en kollegas hold
// ved at kende dets id – og id'et står i adressen, så snart man har set det
// én gang. Et fremmed hold svares som "findes ikke" og ikke "ingen adgang",
// så svaret ikke bekræfter, at holdet findes.
const medHold = (req, ctx, handler) =>
  medUnderviser(req, async session => {
    const hold = await lager.hentHold(ctx.params.holdId);
    if (!hold || hold.underviser !== session.underviser) return fejl("Holdet findes ikke.", 404);
    return handler(hold, session);
  });

/* ---------- Login ---------- */
async function login(req) {
  const b = await krop(req);
  const spaerrenoegle = `admin/${klientIp(req)}`;
  if ((await lager.taelForsoeg(spaerrenoegle, VINDUE_MS)) > MAKS_FORSOEG)
    return fejl("For mange forsøg. Vent et kvarter.", 429);

  // En manglende miljøvariabel kastes videre og bliver til en forklarende
  // 500'er i ruteren. Den må ikke ende som et bart 500 uden besked.
  const indhold = auth.loginSomUnderviser(b?.kode ?? "");
  if (!indhold) return fejl("Forkert kode.", 401);
  const cookie = auth.saetCookie(await auth.lavSession(indhold));
  await lager.nulstilForsoeg(spaerrenoegle);
  return json({ navn: indhold.navn }, 200, { "set-cookie": cookie });
}

const mig = req => medUnderviser(req, async session => json({ underviser: session.underviser, navn: session.navn }));
const logud = () => json({ ok: true }, 200, { "set-cookie": auth.ryddCookie() });

/* ---------- Hold ---------- */
const listHold = req =>
  medUnderviser(req, async session => {
    const hold = (await lager.alleHold()).filter(h => h.underviser === session.underviser);
    const beriget = await Promise.all(
      hold.map(async h => {
        const studerende = await lager.hentStuderendePaaHold(h.id);
        return { ...h, antalStuderende: studerende.length, antalLoggetInd: studerende.filter(s => s.sidstSet).length };
      })
    );
    return json({ hold: beriget.sort((a, b) => b.oprettet.localeCompare(a.oprettet)) });
  });

const opretHold = req =>
  medUnderviser(req, async session => {
    const b = await krop(req);
    const navn = String(b?.navn ?? "").trim().slice(0, 80);
    if (!navn) return fejl("Holdet skal have et navn.");
    const h = {
      id: lager.nytId("hold"),
      navn,
      underviser: session.underviser,
      underviserNavn: session.navn,
      oprettet: new Date().toISOString(),
    };
    await lager.gemHold(h);
    return json({ hold: h }, 201);
  });

const sletHold = (req, ctx) => medHold(req, ctx, async h => json({ slettet: await lager.sletHold(h.id), navn: h.navn }));

/* ---------- Oprettelse af studerende ---------- */
// Underviseren indsætter en liste – ét navn pr. linje. Formatet skal tåle et
// klip fra Excel, så adskilleren må være tab, semikolon eller komma, og kun
// det første felt, der ikke er et tal, bruges som navn. Systemet kender ikke
// studienumre, og et nummer forrest på en linje kastes væk.
export function laesListe(tekst) {
  const navne = [];
  for (const raa of String(tekst).split("\n")) {
    const felter = raa.split(/[\t;,]/).map(f => f.trim()).filter(Boolean);
    const navn = felter.find(f => !/^\d+$/.test(f));
    if (navn) navne.push(navn.slice(0, 80));
  }
  return navne;
}

const opretStuderende = (req, ctx) =>
  medHold(req, ctx, async hold => {
    const b = await krop(req);
    const navne = laesListe(b?.liste ?? "");
    if (!navne.length) return fejl("Listen gav ingen studerende. Skriv ét navn pr. linje.");
    if (navne.length > 300) return fejl("Højst 300 studerende ad gangen.");

    const eksisterende = await lager.hentStuderendePaaHold(hold.id);
    const oprettede = [], sprunget = [];
    for (const navn of navne) {
      // Navnet er den eneste identifikator, så to ens navne på samme hold
      // opfattes som en gentagelse. Står der virkelig to ens, må den ene
      // skelnes i listen, fx "Anne J." og "Anne K.".
      if (eksisterende.some(s => s.navn.toLowerCase() === navn.toLowerCase())) {
        sprunget.push({ navn, aarsag: "findes allerede" });
        continue;
      }
      const kode = auth.lavKode();
      const s = { id: lager.nytId("st"), holdId: hold.id, navn, kode, oprettet: new Date().toISOString(), sidstSet: null };
      await lager.gemStuderende(s);
      await lager.knytKode(kode, hold.id, s.id);
      eksisterende.push(s);
      oprettede.push(s);
    }
    return json({ oprettede, sprunget }, 201);
  });

const nyKode = (req, ctx) =>
  medHold(req, ctx, async hold => {
    const s = await lager.hentStuderende(hold.id, ctx.params.id);
    if (!s) return fejl("Den studerende findes ikke.", 404);
    await lager.frigivKode(s.kode);
    const kode = auth.lavKode();
    await lager.gemStuderende({ ...s, kode });
    await lager.knytKode(kode, s.holdId, s.id);
    return json({ kode });
  });

// Sletter den studerende med alt, hvad der er gemt om vedkommende.
const sletStuderende = (req, ctx) =>
  medHold(req, ctx, async hold => {
    const s = await lager.hentStuderende(hold.id, ctx.params.id);
    if (!s) return fejl("Den studerende findes ikke.", 404);
    await lager.sletStuderendeHelt(s);
    return json({ ok: true });
  });

/* ---------- Overblik ---------- */
async function hentHoldData(holdId) {
  const [studerende, trin, haendelser] = await Promise.all([
    lager.hentStuderendePaaHold(holdId),
    lager.hentTrinPaaHold(holdId),
    lager.hentHaendelserPaaHold(holdId),
  ]);
  const nu = Date.now();
  const billeder = studerende
    .map(s => studerendeBillede(s, trin, haendelser, nu))
    .sort((a, b) => a.navn.localeCompare(b.navn, "da"));
  return { studerende: billeder, hold: holdBillede(billeder, nu), haendelser };
}

const oversigt = (req, ctx) =>
  medHold(req, ctx, async hold => {
    const { studerende, hold: samlet, haendelser } = await hentHoldData(hold.id);
    return json({
      hold,
      samlet,
      studerende,
      omraader: OMRAADER,
      temaer: TEMAER,
      // Aktivitet dag for dag de seneste fire uger, til søjlerne øverst.
      aktivitet: aktivitetPrDag(haendelser, 28),
    });
  });

function aktivitetPrDag(haendelser, dage) {
  const ud = [];
  const idag = new Date();
  idag.setUTCHours(0, 0, 0, 0);
  for (let i = dage - 1; i >= 0; i--) {
    const d = new Date(idag.getTime() - i * 24 * 3600e3).toISOString().slice(0, 10);
    const dagens = haendelser.filter(h => h.tid.slice(0, 10) === d && h.type !== "besoeg");
    ud.push({ dato: d, handlinger: dagens.length, studerende: new Set(dagens.map(h => h.studId)).size });
  }
  return ud;
}

/* ---------- Eksport ---------- */
const csvFelt = v => `"${String(v ?? "").replace(/"/g, '""')}"`;

const eksport = (req, ctx) =>
  medHold(req, ctx, async hold => {
    const { studerende } = await hentHoldData(hold.id);
    const hoved = [
      "hold", "navn", "sidst_aktiv", "dage_aktiv", "feedback_kald", "vejledende_kald",
      ...OMRAADER.map(o => `trin_${o.id}`),
      "trin4_konklusion", "temaer",
    ];
    const linjer = [hoved.map(csvFelt).join(";")];
    for (const s of studerende) {
      linjer.push(
        [
          hold.navn, s.navn, s.sidst ?? "", s.dageAktiv, s.feedbackKald, s.vejledendeKald,
          ...OMRAADER.map(o => (s.omraader[o.id] ? s.omraader[o.id].niveau : "")),
          s.t4 ? NIVEAUNAVN[s.t4] : "",
          s.temaer.map(t => `${TEMANAVN[t.id] ?? t.id} (${t.antal})`).join(", "),
        ].map(csvFelt).join(";")
      );
    }
    const filnavn = `regnskabsanalyse-${hold.navn.replace(/[^\wæøåÆØÅ-]+/g, "-").toLowerCase()}.csv`;
    // BOM foran, så Excel på dansk opfatter filen som UTF-8.
    return new Response("﻿" + linjer.join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filnavn}"`,
        "cache-control": "no-store",
      },
    });
  });

export default ruter({
  "POST /admin-api/login": login,
  "POST /admin-api/logud": logud,
  "GET /admin-api/mig": mig,
  "GET /admin-api/hold": listHold,
  "POST /admin-api/hold": opretHold,
  "DELETE /admin-api/hold/:holdId": sletHold,
  "POST /admin-api/hold/:holdId/studerende": opretStuderende,
  "GET /admin-api/hold/:holdId/oversigt": oversigt,
  "GET /admin-api/hold/:holdId/eksport": eksport,
  "POST /admin-api/hold/:holdId/studerende/:id/nykode": nyKode,
  "DELETE /admin-api/hold/:holdId/studerende/:id": sletStuderende,
});

export const config = { path: "/admin-api/*" };
