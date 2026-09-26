// Prøver af trappens logik uden server: tolkningen af modellens svar og
// sammentællingen til underviserens overblik.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as trappe from "../netlify/functions/lib/trappe.mjs";
import { trinNiveau, paaVej, studerendeBillede, holdBillede, skalTagesFatI } from "../netlify/functions/lib/overblik.mjs";
import { bedsteTrin } from "../netlify/functions/lib/lager.mjs";

const M = trappe.MARKOER;

test("vurderingen læses, også med fences og en ekstra linje efter JSON", () => {
  const r = trappe.tolkVurdering(`Prosa her.\n${M}\n\`\`\`json\n{"t1":"naaet","t2":"mangler","t3":"mangler","temaer":["manglende-aarsag"]}\n\`\`\`\nHåber det hjælper!`, trappe.OMRAADETRIN);
  assert.equal(r.prosa, "Prosa her.");
  assert.deepEqual(r.vurdering.trin, { t1: "naaet", t2: "mangler", t3: "mangler" });
  assert.deepEqual(r.vurdering.temaer, ["manglende-aarsag"]);
});

test("ugyldige niveauer og opdigtede temaer kastes væk – højst to temaer", () => {
  const r = trappe.tolkVurdering(`x\n${M}\n{"t1":"super","t2":"delvist","t3":"naaet","temaer":["opdigtet","kun-tal","ingen-maalestok","paastand-uden-tal"]}`, trappe.OMRAADETRIN);
  assert.deepEqual(r.vurdering.trin, { t2: "delvist", t3: "naaet" });
  assert.deepEqual(r.vurdering.temaer, ["kun-tal", "ingen-maalestok"]);
});

test("ødelagt JSON giver prosa uden vurdering – feedbacken fejler ikke", () => {
  assert.deepEqual(trappe.tolkVurdering(`Prosa.\n${M}\n{ikke json`, trappe.OMRAADETRIN), { prosa: "Prosa.", vurdering: null });
  assert.deepEqual(trappe.tolkVurdering(`Prosa.\n${M}\n{"t4":"naaet"}`, trappe.OMRAADETRIN), { prosa: "Prosa.", vurdering: null }, "trin 4 hører ikke til et område");
});

test("markøren står aldrig i det, den studerende ser", () => {
  assert.equal(trappe.rensProsa(`Feedback.\n${M}\n{}`), "Feedback.");
});

test("prompten til et område nævner kun trin 1-3, og konklusionens kun trin 4", () => {
  const omraade = trappe.findOmraade("rentabilitet");
  const p = trappe.feedbackPrompt({ omraade, virksomhed: "X", noegletal: [], trin: { t1: "a" } });
  assert.ok(p.includes("Trin 3 – Vurdering") && !p.includes("Trin 4"));
  const k = trappe.konklusionPrompt({ virksomhed: "X", omraadetekster: "", konklusion: "b" });
  assert.ok(k.includes("Trin 4 – Forretningsmodellen"));
});

test("en studerendes tekst kan ikke bryde ud af rammen", () => {
  const omraade = trappe.findOmraade("rentabilitet");
  const p = trappe.feedbackPrompt({ omraade, virksomhed: "X", noegletal: [], trin: { t1: "x".repeat(5000) } });
  assert.ok(!p.includes("x".repeat(trappe.MAKS_TRINTEGN + 1)), "teksten skæres ved grænsen");
});

test("trappen tæller kun trin i træk nedefra", () => {
  assert.equal(trinNiveau({ t1: "naaet", t2: "naaet", t3: "naaet" }), 3);
  assert.equal(trinNiveau({ t1: "delvist", t2: "naaet", t3: "naaet" }), 0);
  assert.equal(trinNiveau({ t1: "naaet", t2: "mangler", t3: "naaet" }), 1);
  assert.equal(paaVej({ t1: "naaet", t2: "delvist" }), true);
  assert.equal(paaVej({ t1: "naaet", t2: "mangler" }), false);
  assert.equal(paaVej({ t1: "naaet", t2: "naaet", t3: "naaet" }), false);
});

test("det bedste pr. trin huskes på tværs af forsøg", () => {
  assert.deepEqual(bedsteTrin({ t1: "naaet", t2: "delvist" }, { t1: "mangler", t2: "naaet", t3: "mangler" }), { t1: "naaet", t2: "naaet", t3: "mangler" });
});

const NU = Date.parse("2026-09-26T12:00:00Z");
const dage = n => new Date(NU - n * 24 * 3600e3).toISOString();
const post = (studId, omr, bedste, forsoeg = 1, temaer = []) => ({ studId, omr, caseId: "let", bedste, trin: bedste, forsoeg, temaer });

test("hvem der skal tages fat i", () => {
  const b = (s, trin = [], h = []) => studerendeBillede(s, trin, h, NU);
  assert.equal(skalTagesFatI(b({ id: "a", navn: "A", sidstSet: null })).grund, "aldrig");
  assert.equal(skalTagesFatI(b({ id: "b", navn: "B", sidstSet: dage(9) })).grund, "inaktiv");
  const fast = b({ id: "c", navn: "C", sidstSet: dage(0) }, [post("c", "kapital", { t1: "naaet", t2: "mangler", t3: "mangler" }, 4)]);
  assert.equal(skalTagesFatI(fast).grund, "fast");
  const paaVej = b({ id: "d", navn: "D", sidstSet: dage(0) }, [post("d", "kapital", { t1: "naaet", t2: "delvist", t3: "mangler" }, 4)]);
  assert.equal(skalTagesFatI(paaVej), null, "mange forsøg, men på vej op, er ikke at sidde fast");
});

test("et tema er først et mønster ved to studerende", () => {
  const s = [{ id: "a", navn: "A", sidstSet: dage(0) }, { id: "b", navn: "B", sidstSet: dage(0) }];
  const trin = [
    post("a", "kapital", { t1: "naaet" }, 1, ["ingen-maalestok", "kun-tal"]),
    post("b", "soliditet", { t1: "naaet" }, 1, ["ingen-maalestok"]),
  ];
  const h = holdBillede(s.map(x => studerendeBillede(x, trin, [], NU)), NU);
  assert.deepEqual(h.temaer.map(t => t.id), ["ingen-maalestok"]);
  assert.equal(h.temaer[0].studerende, 2);
});

test("et nyt AI-sæt uden alle fem områder afvises", () => {
  const fire = Object.fromEntries(trappe.OMRAADER.slice(0, 4).map(o => [o.id, [{ n: "a", a: "1", b: "2", udv: "↑" }]]));
  assert.equal(trappe.tolkNytSaet(JSON.stringify({ navn: "X", analyse: fire })), null);
});
