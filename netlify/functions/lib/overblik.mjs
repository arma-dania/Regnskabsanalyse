// Samler trinvurderinger og hændelser til underviserens overblik.
//
// Rene funktioner uden lager og uden netværk, så de kan afprøves direkte.
// admin.mjs henter data og kalder herind.

import { OMRAADER, OMRAADETRIN, TEMAER } from "./trappe.mjs";

const DAG_MS = 24 * 3600e3;

// Hvor langt op ad trappen den studerende er nået på et område: antallet af
// trin nedefra, der er nået i træk. Trappen er en trappe – et nået trin 3
// oven på et manglende trin 2 er ikke trin 3, men en vurdering uden fundament.
export function trinNiveau(bedste, trinIder = OMRAADETRIN) {
  let niveau = 0;
  for (const id of trinIder) {
    if (bedste?.[id] === "naaet") niveau += 1;
    else break;
  }
  return niveau;
}

// Er næste trin på vej? Et "delvist" på trinnet over niveauet er forskellen
// på en, der sidder fast, og en, der er ved at komme op.
export function paaVej(bedste, trinIder = OMRAADETRIN) {
  const naeste = trinIder[trinNiveau(bedste, trinIder)];
  return naeste ? bedste?.[naeste] === "delvist" : false;
}

const dato = iso => String(iso ?? "").slice(0, 10);

// Én studerendes samlede billede: aktivitet, niveau pr. område, trin 4 og de
// temaer, der er gået igen i vurderingerne.
export function studerendeBillede(s, trinPoster, haendelser, nu = Date.now()) {
  const mine = trinPoster.filter(t => t.studId === s.id);
  const mineH = haendelser.filter(h => h.studId === s.id);

  // Pr. område tages det bedste niveau på tværs af cases. Har den studerende
  // nået trin 3 på den lette case, har vedkommende vist, at trinnet kan nås.
  const omraader = {};
  for (const o of OMRAADER) {
    const poster = mine.filter(t => t.omr === o.id);
    const niveauer = poster.map(t => trinNiveau(t.bedste));
    omraader[o.id] = poster.length
      ? {
          niveau: Math.max(...niveauer),
          paaVej: poster.some(t => trinNiveau(t.bedste) === Math.max(...niveauer) && paaVej(t.bedste)),
          forsoeg: poster.reduce((a, t) => a + (t.forsoeg ?? 0), 0),
        }
      : null;
  }

  const konklusioner = mine.filter(t => t.omr === "konklusion");
  const t4 = konklusioner.length
    ? konklusioner.map(t => t.bedste?.t4).sort((a, b) => rang(b) - rang(a))[0] ?? null
    : null;

  // Temaerne tælles fra den SENESTE vurdering pr. område – ikke fra alle
  // forsøg. En studerende, der har rettet en fejl, skal ikke hænge fast i den.
  const temaer = {};
  for (const t of mine) for (const tema of t.temaer ?? []) temaer[tema] = (temaer[tema] ?? 0) + 1;

  const tider = mineH.map(h => h.tid).sort();
  const sidst = [s.sidstSet, tider[tider.length - 1]].filter(Boolean).sort().pop() ?? null;

  return {
    id: s.id,
    navn: s.navn,
    kode: s.kode,
    sidst,
    dageSidenSidst: sidst ? Math.floor((nu - Date.parse(sidst)) / DAG_MS) : null,
    dageAktiv: new Set(tider.map(dato)).size,
    feedbackKald: mineH.filter(h => h.type === "feedback" || h.type === "konklusion").length,
    vejledendeKald: mineH.filter(h => h.type === "vejledende").length,
    omraader,
    omraaderIGang: Object.values(omraader).filter(Boolean).length,
    t4,
    temaer: Object.entries(temaer).sort((a, b) => b[1] - a[1]).map(([id, antal]) => ({ id, antal })),
  };
}

const RANG = { mangler: 0, delvist: 1, naaet: 2 };
const rang = v => RANG[v] ?? -1;

// Hvem der bør tages fat i. Tre grunde, i den rækkefølge de er mest akutte:
// aldrig logget ind, inaktiv en uge, og sidder fast – mange forsøg på et
// område uden at komme over trin 1.
export const INAKTIV_DAGE = 7;
export const FAST_FORSOEG = 3;

export function skalTagesFatI(billede) {
  if (!billede.sidst) return { grund: "aldrig", tekst: "Har ikke logget ind" };
  if (billede.dageSidenSidst >= INAKTIV_DAGE)
    return { grund: "inaktiv", tekst: `Ikke aktiv i ${billede.dageSidenSidst} dage` };
  const fast = OMRAADER.filter(o => {
    const r = billede.omraader[o.id];
    return r && r.forsoeg >= FAST_FORSOEG && r.niveau <= 1 && !r.paaVej;
  });
  if (fast.length)
    return { grund: "fast", tekst: `Sidder fast på ${fast.map(o => o.navn.toLowerCase()).join(", ")}` };
  return null;
}

// Holdets samlede billede. Et tema vises først som et mønster, når mindst to
// studerende har det – ét tilfælde siger noget om den ene, ikke om holdet.
export const MINDST_FOR_MOENSTER = 2;

export function holdBillede(billeder, nu = Date.now()) {
  const aktive = n => billeder.filter(b => b.sidst && nu - Date.parse(b.sidst) < n * DAG_MS).length;

  const fordeling = {};
  for (const o of OMRAADER) {
    const i = billeder.map(b => b.omraader[o.id]).filter(Boolean);
    fordeling[o.id] = {
      igang: i.length,
      niveauer: [0, 1, 2, 3].map(n => i.filter(r => r.niveau === n).length),
      paaVej: i.filter(r => r.paaVej).length,
    };
  }

  const t4 = { naaet: 0, delvist: 0, mangler: 0 };
  for (const b of billeder) if (b.t4) t4[b.t4] += 1;

  const temaer = TEMAER.map(t => ({
    ...t,
    studerende: billeder.filter(b => b.temaer.some(x => x.id === t.id)).length,
  }))
    .filter(t => t.studerende >= MINDST_FOR_MOENSTER)
    .sort((a, b) => b.studerende - a.studerende);

  // Det trin, flest går i stå på. Det er det, næste lektion skal bruge tid på.
  const staaPaa = [0, 0, 0];
  for (const b of billeder) for (const r of Object.values(b.omraader)) if (r && r.niveau < 3) staaPaa[r.niveau] += 1;

  return {
    antal: billeder.length,
    loggetInd: billeder.filter(b => b.sidst).length,
    aktiveIDag: aktive(1),
    aktiveUge: aktive(7),
    fordeling,
    t4,
    temaer,
    staaPaa: staaPaa.map((antal, i) => ({ trin: i + 1, antal })),
    tagFatI: billeder
      .map(b => ({ id: b.id, navn: b.navn, ...skalTagesFatI(b) }))
      .filter(x => x.grund)
      .sort((a, b) => ["aldrig", "inaktiv", "fast"].indexOf(a.grund) - ["aldrig", "inaktiv", "fast"].indexOf(b.grund)),
  };
}
