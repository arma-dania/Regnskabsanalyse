// Hvert nøgletal i fanen Nøgletal skal have en uddybning, og henvisningerne
// mellem dem skal pege på nøgletal, der findes. Ellers ville et nyt nøgletal
// kunne lægges ind uden forklaring, eller et klik føre ingen steder hen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { UDDYBNING } from "../src/noegletal-uddybning.js";

const app = await readFile(path.join(import.meta.dirname, "../src/App.jsx"), "utf8");
const liste = app.slice(app.indexOf("const NOEGLETAL = ["), app.indexOf("];", app.indexOf("const NOEGLETAL = [")));
const ider = [...liste.matchAll(/\{ id: "([a-z0-9-]+)"/g)].map(m => m[1]);

test("alle 28 nøgletal har en fuld uddybning", () => {
  assert.equal(ider.length, 28);
  const felter = ["kortSagt", "eksempel", "forklaring", "hoej", "lav", "vigtigt", "faldgrube", "relateret"];
  for (const id of ider) {
    assert.ok(UDDYBNING[id], `${id} mangler uddybning`);
    for (const f of felter) assert.ok(UDDYBNING[id][f]?.length, `${id}.${f} er tom`);
  }
  assert.deepEqual(Object.keys(UDDYBNING).filter(k => !ider.includes(k)), [], "uddybning til ukendt nøgletal");
});

test("henvisningerne peger på nøgletal, der findes", () => {
  for (const [id, u] of Object.entries(UDDYBNING))
    for (const r of u.relateret) {
      assert.ok(ider.includes(r), `${id} henviser til ukendt ${r}`);
      assert.notEqual(r, id, `${id} henviser til sig selv`);
    }
});
