import React, { useState, useRef, useEffect } from "react";

/*
  DuPont-pyramiden – interaktiv.

  Pyramiden har fem niveauer, som lærebogens figur: afkastningsgraden øverst,
  derunder overskudsgrad × aktivernes omsætningshastighed, og så videre ned
  til omsætning, vareforbrug og de enkelte aktivposter i bunden.

  Skyderne sidder i de kasser, der ikke beregnes af noget andet – pyramidens
  "rødder". Den studerende trækker i bunden og ser ændringen flyde op: kasserne
  på vejen lyser kort op, og nøgletallene viser ændringen fra udgangspunktet.

  Udgangstallene er opdigtede og hører ikke til nogen af opgavens cases.
*/

// Udgangspunkt i 1.000 kr. Bruttomargin 40 %, overskudsgrad 7,5 %,
// omsætningshastighed 1,67, afkastningsgrad 12,5 %.
const DEF = { O: 40000, VF: 24000, KAP: 13000, A1: 12000, LG: 6000, DB: 5000, LK: 1000, G: 14000, r: 5 };

// Kanvas i pixels. Bredden passer ind i sidens indholdsbredde; på smalle
// skærme kan pyramiden rulles sidelæns inden for sin egen ramme.
const W = 920;
const BW = 142;
const RAEKKE = [0, 118, 236, 362, 488]; // top for hvert niveau
const HOEJDE = [80, 80, 88, 88, 88];
const H = RAEKKE[4] + HOEJDE[4];

// Kassernes placering: x = midte, n = niveau (0 = toppen).
const KASSER = {
  ag: { x: 460, n: 0 },
  og: { x: 364, n: 1 },
  aoh: { x: 556, n: 1 },
  res: { x: 262, n: 2 },
  oms: { x: 460, n: 2 },
  gnsa: { x: 658, n: 2 },
  brutto: { x: 166, n: 3 },
  kap: { x: 356, n: 3 },
  anl: { x: 564, n: 3 },
  omsa: { x: 754, n: 3 },
  oms5: { x: 71, n: 4 },
  vf: { x: 262, n: 4 },
  varer: { x: 460, n: 4 },
  tilg: { x: 654, n: 4 },
  likv: { x: 849, n: 4 },
};

const top = id => RAEKKE[KASSER[id].n];
const bund = id => RAEKKE[KASSER[id].n] + HOEJDE[KASSER[id].n];

// Forbindelserne som i figuren: fra forældrenes bund ned til en vandret
// skinne og derfra ned til hvert barn.
const GRENE = [
  { foraeldre: ["ag"], boern: ["og", "aoh"] },
  { foraeldre: ["og", "aoh"], boern: ["res", "oms", "gnsa"] },
  { foraeldre: ["res"], boern: ["brutto", "kap"] },
  { foraeldre: ["gnsa"], boern: ["anl", "omsa"] },
  { foraeldre: ["brutto"], boern: ["oms5", "vf"] },
  { foraeldre: ["omsa"], boern: ["varer", "tilg", "likv"] },
];

// Tegnene mellem søskende.
const OPERATORER = [
  { mellem: ["og", "aoh"], tegn: "×" },
  { mellem: ["res", "oms"], tegn: "/" },
  { mellem: ["oms", "gnsa"], tegn: "/" },
  { mellem: ["brutto", "kap"], tegn: "−" },
  { mellem: ["anl", "omsa"], tegn: "+" },
  { mellem: ["oms5", "vf"], tegn: "−" },
  { mellem: ["varer", "tilg"], tegn: "+" },
  { mellem: ["tilg", "likv"], tegn: "+" },
];

// Vejen op gennem pyramiden fra hver skyder. Omsætningen står to steder og
// påvirker både overskudsgraden og omsætningshastigheden.
const VEJ = {
  O: ["oms", "oms5", "brutto", "res", "og", "aoh", "ag"],
  VF: ["vf", "brutto", "res", "og", "ag"],
  KAP: ["kap", "res", "og", "ag"],
  A1: ["anl", "gnsa", "aoh", "ag"],
  LG: ["varer", "omsa", "gnsa", "aoh", "ag"],
  DB: ["tilg", "omsa", "gnsa", "aoh", "ag"],
  LK: ["likv", "omsa", "gnsa", "aoh", "ag"],
};

function beregn({ O, VF, KAP, A1, LG, DB, LK, G, r }) {
  const BR = O - VF;
  const R = BR - KAP;
  const A2 = LG + DB + LK;
  const A = A1 + A2;
  const OG = O > 0 ? (R / O) * 100 : 0;
  const AOH = A > 0 ? O / A : 0;
  const AG = A > 0 ? (R / A) * 100 : 0;
  const E = A - G;
  const gearing = E > 0 ? G / E : 0;
  const loft = E > 0 ? (AG - r) * gearing : 0;
  return { BR, R, A2, A, OG, AOH, AG, E, gearing, loft, EKF: E > 0 ? AG + loft : null };
}

const f1 = x => x.toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f2 = x => x.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const kr = x => Math.round(x).toLocaleString("da-DK");
const pct = x => f1(x) + " %";

function Aendring({ nu, foer, enhed, dec = 1 }) {
  const d = nu - foer;
  if (Math.abs(d) < (dec === 1 ? 0.05 : 0.005)) return <span className="pd-delta nul">som udgangspunktet</span>;
  const tal = dec === 1 ? f1(Math.abs(d)) : f2(Math.abs(d));
  return <span className={"pd-delta " + (d > 0 ? "op" : "ned")}>{d > 0 ? "▲" : "▼"} {tal}{enhed} fra udgangspunktet</span>;
}

function Kasse({ id, titel, vaerdi, type, lyser, children }) {
  const k = KASSER[id];
  return (
    <div className={`pd-kasse pd-${type}${lyser ? " lyser" : ""}`}
      style={{ left: k.x - BW / 2, top: RAEKKE[k.n], width: BW, height: HOEJDE[k.n] }}>
      <div className="titel">{titel}</div>
      {vaerdi !== undefined && <div className="vaerdi">{vaerdi}</div>}
      {children}
    </div>
  );
}

function Skyder({ k, label, v, saet, min, max, step }) {
  return (
    <input type="range" aria-label={label} min={min} max={max} step={step} value={v[k]}
      onChange={e => saet(k, Number(e.target.value))} />
  );
}

/* ---------------- Pyramiden fortsætter: EKF ---------------- */

function EkfSektion({ v, c, saet }) {
  const ok = c.E > 0;
  const rm = c.AG - v.r;
  const renter = (v.G * v.r) / 100;
  const efterRenter = c.R - renter;
  const foelsomhed = 1 + c.gearing;
  const fortegn = x => (x >= 0 ? "+" : "−") + f1(Math.abs(x));

  return (
    <section className="pd-ekf">
      <p className="ra-eyebrow" style={{ margin: "0 0 6px" }}>Pyramiden fortsætter</p>
      <h3>Fra afkastningsgrad til egenkapitalens forrentning</h3>
      <p className="pd-tekst">
        Afkastningsgraden ser på al kapital i virksomheden – den er driftens afkast. Ejerne interesserer sig for
        deres egen del, og den afhænger også af, hvordan virksomheden er finansieret. Formlen nedenfor – ofte
        kaldt <b>gearingsformlen</b> – deler egenkapitalens forrentning op i to bidrag: det, driften giver, og det,
        finansieringen lægger til eller trækker fra.
      </p>

      <div className="pd-ligning">
        <div className="pd-gruppe"><div className="pd-led top"><span>EKF</span><b>{ok ? pct(c.EKF) : "–"}</b></div><small>ejernes afkast</small></div>
        <span className="pd-lig">=</span>
        <div className="pd-gruppe"><div className="pd-led nt"><span>AG</span><b>{pct(c.AG)}</b></div><small>driftens bidrag</small></div>
        <span className="pd-lig">+</span>
        <div className="pd-gruppe bue">
          <div className="pd-raekke">
            <span className="pd-lig">(</span>
            <div className="pd-led nt"><span>AG</span><b>{pct(c.AG)}</b></div>
            <span className="pd-lig">−</span>
            <div className="pd-led sk"><span>Lånerente</span><b>{pct(v.r)}</b></div>
            <span className="pd-lig">)</span>
          </div>
          <small>rentemarginal = {fortegn(rm)} pct.point</small>
        </div>
        <span className="pd-lig">×</span>
        <div className="pd-gruppe"><div className="pd-led bl"><span>Gearing</span><b>{ok ? f2(c.gearing) : "–"}</b></div><small>gæld / egenkapital</small></div>
      </div>
      <p className="pd-bidrag">
        {ok ? <>Gearingseffekt = rentemarginal × gearing = {fortegn(rm)} × {f2(c.gearing)} = <b>{fortegn(c.loft)} pct.point</b> oven i afkastningsgraden.</> : "Egenkapitalen er nul eller negativ – sæt gælden lavere end aktiverne."}
      </p>

      <div className="pd-ekf-skydere">
        <label>
          <span>Gns. gæld (fremmedkapital) <b>{kr(v.G)}</b></span>
          <input type="range" min={0} max={60000} step={1000} value={v.G} onChange={e => saet("G", Number(e.target.value))} />
        </label>
        <label>
          <span>Lånerente <b>{pct(v.r)}</b></span>
          <input type="range" min={0} max={15} step={0.5} value={v.r} onChange={e => saet("r", Number(e.target.value))} />
        </label>
      </div>

      {ok && (
        <div className="ra-callout" style={{ marginTop: 14 }}>
          {c.AG > v.r ? (
            <span><b>Rentemarginalen er positiv</b> ({fortegn(rm)} pct.point), så gearingen <b>løfter</b> egenkapitalens forrentning over afkastningsgraden. Mere gæld giver et større løft – men også mere risiko.</span>
          ) : c.AG < v.r ? (
            <span><b>Rentemarginalen er negativ</b> ({fortegn(rm)} pct.point), så gearingen <b>trækker</b> egenkapitalens forrentning ned under afkastningsgraden. Her koster gælden mere, end den tjener i driften – og jo mere gæld, jo værre.</span>
          ) : (
            <span>Rentemarginalen er nul, så gearingen hverken løfter eller sænker egenkapitalens forrentning.</span>
          )}{" "}
          <b>Følsomhed:</b> falder afkastningsgraden 1 procentpoint, falder egenkapitalens forrentning{" "}
          <b>{f1(foelsomhed)} procentpoint</b> (1 + gearing). Det er risikoen ved gearing, sagt i ét tal.
        </div>
      )}

      <h4 className="pd-h4">Formlen led for led</h4>
      <div className="pd-led3">
        <div>
          <span className="nr">1</span>
          <b>Afkastningsgraden – driftens bidrag</b>
          <p>
            Hvad al kapitalen i virksomheden forrentes med, uanset hvem der har skudt den ind. Havde virksomheden
            ingen gæld, ville ejerne få præcis dette: EKF = AG. Alt, hvad der står efter plusset, skyldes altså
            finansieringen – ikke driften.
          </p>
        </div>
        <div>
          <span className="nr">2</span>
          <b>Rentemarginalen – hvad hver lånt krone tjener</b>
          <p>
            En lånt krone bliver sat i arbejde i driften og forrentes dér med afkastningsgraden ({pct(c.AG)}).
            Men den koster lånerenten ({pct(v.r)}). Forskellen – {fortegn(rm)} procentpoint – er, hvad hver lånt
            krone efterlader til ejerne. Er den positiv, tjener ejerne på at låne; er den negativ, betaler de for
            det.
          </p>
        </div>
        <div>
          <span className="nr">3</span>
          <b>Gearingen – hvor mange gange effekten tæller</b>
          <p>
            Gearingen er antallet af lånte kroner pr. krone egenkapital ({ok ? f2(c.gearing) : "–"}). Rentemarginalen
            ganges med den, fordi gevinsten (eller tabet) fra alle de lånte kroner lander hos en mindre gruppe
            kroner: ejernes. Jo mere gæld pr. ejerkrone, jo kraftigere virker rentemarginalen – i begge retninger.
          </p>
        </div>
      </div>

      {ok && (
        <>
          <h4 className="pd-h4">Regn efter – formlen er ikke magi</h4>
          <div className="pd-regn">
            <div><span>Resultat af primær drift</span><b>{kr(c.R)}</b><small>AG × gns. aktiver = {pct(c.AG)} × {kr(c.A)}</small></div>
            <div><span>− renter til långiverne</span><b>{kr(renter)}</b><small>lånerente × gæld = {pct(v.r)} × {kr(v.G)}</small></div>
            <div className="sum"><span>= resultat til ejerne</span><b>{kr(efterRenter)}</b><small>før skat</small></div>
            <div className="sum"><span>÷ egenkapital</span><b>{kr(c.E)}</b><small>gns. aktiver − gæld</small></div>
            <div className="res"><span>= egenkapitalens forrentning</span><b>{pct((efterRenter / c.E) * 100)}</b><small>samme tal som formlen giver</small></div>
          </div>
          <p className="pd-lille">
            Formlen og udregningen i kroner giver altid samme resultat. Formlen er bare den samme udregning skrevet om, så man kan se,
            hvor meget af ejernes afkast der kommer fra driften, og hvor meget der kommer fra finansieringen.
          </p>
        </>
      )}

      <h4 className="pd-h4">Hvad bruger du formlen til?</h4>
      <div className="pd-brug">
        <div>
          <b>Forklare, hvorfor EKF afviger fra AG</b>
          <p>
            Ligger egenkapitalens forrentning langt over afkastningsgraden, skyldes forskellen gearingseffekten – ikke
            driften. Det er en forklaring på trin 2: <i>"EKF stiger mere end AG, fordi rentemarginalen er positiv, og
            gearingen er øget."</i>
          </p>
        </div>
        <div>
          <b>Finde årsagen til en udvikling</b>
          <p>
            Er EKF steget fra det ene år til det andet? Formlen viser, om det skyldes bedre drift (AG steg), billigere
            lån (renten faldt) eller mere gæld (gearingen steg). De tre har meget forskellig betydning for, hvor sund
            forbedringen er.
          </p>
        </div>
        <div>
          <b>Vurdere, om det kan betale sig at låne</b>
          <p>
            Rentemarginalen er målestokken: kun når afkastningsgraden er højere end lånerenten, tjener ejerne på
            gælden. Det er en vurdering på trin 3 – med lånerenten som navngiven målestok.
          </p>
        </div>
        <div>
          <b>Vurdere risikoen</b>
          <p>
            En lille rentemarginal og en høj gearing er en sårbar kombination: falder driften lidt, eller stiger
            renten, vender effekten. Følsomheden (1 + gearing) og soliditetsgraden fortæller, hvor lidt der skal til.
          </p>
        </div>
      </div>

      <div className="pd-husk">
        <b>Husk i et rigtigt regnskab</b>
        <ul>
          <li>Brug <b>fremmedkapitalens forrentning</b> som lånerente. Den er et gennemsnit over al gæld – også den rentefri leverandørgæld – så den er lavere end bankens rente.</li>
          <li>Formlen gælder <b>før skat</b>. Egenkapitalens forrentning efter skat er tilnærmelsesvis formlens resultat × (1 − skatteprocenten).</li>
          <li>Andre poster – fx finansielle indtægter eller særlige poster – gør, at formlen og regnskabets tal ikke rammer præcis ens. Formlen forklarer <i>mekanikken</i>; tallene skal stadig komme fra regnskabet.</li>
        </ul>
      </div>
    </section>
  );
}

export default function DuPontView() {
  const [v, setV] = useState(DEF);
  const [lyser, setLyser] = useState([]);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const saet = (k, x) => {
    setV(s => ({ ...s, [k]: x }));
    if (VEJ[k]) {
      setLyser(VEJ[k]);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setLyser([]), 900);
    }
  };

  const c = beregn(v);
  const c0 = beregn(DEF);
  const L = id => lyser.includes(id);
  const sk = (k, min, max, step, label) => <Skyder k={k} label={label} v={v} saet={saet} min={min} max={max} step={step} />;

  return (
    <div className="ra-fade pd">
      <PyramideStil />
      <p className="ra-lead" style={{ marginTop: 0, marginBottom: 14 }}>
        DuPont-pyramiden viser, at <b>rentabiliteten har to drivkræfter</b>: hvor meget
        virksomheden tjener pr. omsætningskrone (overskudsgrad), og hvor effektivt den
        udnytter sin kapital (aktivernes omsætningshastighed). Nederst i pyramiden står
        de poster fra regnskabet, som bestemmer dem.
      </p>

      <div className="pd-forklaring">
        <span><i className="nt" /> Nøgletal</span>
        <span><i className="bl" /> Beregnes af kasserne under</span>
        <span><i className="sk" /> Træk i skyderen</span>
        <span className="pd-lille">Beløb i 1.000 kr. · opdigtede tal</span>
      </div>

      <div className="pd-ramme">
        <div className="pd-kanvas" style={{ width: W, height: H }}>
          <svg className="pd-linjer" width={W} height={H} aria-hidden="true">
            {GRENE.map((g, i) => {
              const fraY = Math.max(...g.foraeldre.map(bund));
              const tilY = Math.min(...g.boern.map(top));
              const y = (fraY + tilY) / 2;
              const xs = [...g.foraeldre, ...g.boern].map(id => KASSER[id].x);
              return (
                <g key={i}>
                  <line x1={Math.min(...xs)} x2={Math.max(...xs)} y1={y} y2={y} />
                  {g.foraeldre.map(id => <line key={id} x1={KASSER[id].x} x2={KASSER[id].x} y1={bund(id)} y2={y} />)}
                  {g.boern.map(id => <line key={id} x1={KASSER[id].x} x2={KASSER[id].x} y1={y} y2={top(id)} />)}
                </g>
              );
            })}
          </svg>
          {OPERATORER.map(({ mellem: [a, b], tegn }) => (
            <span key={a + b} className="pd-op"
              style={{ left: (KASSER[a].x + KASSER[b].x) / 2, top: top(a) + HOEJDE[KASSER[a].n] / 2 }}>{tegn}</span>
          ))}

          <Kasse id="ag" type="top" titel="Afkastningsgrad" vaerdi={pct(c.AG)} lyser={L("ag")}>
            <Aendring nu={c.AG} foer={c0.AG} enhed=" pct.point" />
          </Kasse>
          <Kasse id="og" type="nt" titel="Overskudsgrad" vaerdi={pct(c.OG)} lyser={L("og")}>
            <Aendring nu={c.OG} foer={c0.OG} enhed=" pct.point" />
          </Kasse>
          <Kasse id="aoh" type="nt" titel="Aktivernes oms.hastighed" vaerdi={f2(c.AOH)} lyser={L("aoh")}>
            <Aendring nu={c.AOH} foer={c0.AOH} enhed="" dec={2} />
          </Kasse>

          <Kasse id="res" type="bl" titel="Resultat af primær drift" vaerdi={kr(c.R)} lyser={L("res")} />
          <Kasse id="oms" type="sk" titel="Omsætning" vaerdi={kr(v.O)} lyser={L("oms")}>{sk("O", 10000, 100000, 1000, "Omsætning")}</Kasse>
          <Kasse id="gnsa" type="bl" titel="Gns. aktiver" vaerdi={kr(c.A)} lyser={L("gnsa")} />

          <Kasse id="brutto" type="bl" titel="Bruttoresultat" vaerdi={kr(c.BR)} lyser={L("brutto")} />
          <Kasse id="kap" type="sk" titel={"Kapacitets\u00ADomkostninger"} vaerdi={kr(v.KAP)} lyser={L("kap")}>{sk("KAP", 0, 40000, 500, "Kapacitetsomkostninger")}</Kasse>
          <Kasse id="anl" type="sk" titel={"Gns. anlægs\u00ADaktiver"} vaerdi={kr(v.A1)} lyser={L("anl")}>{sk("A1", 0, 60000, 1000, "Gennemsnitlige anlægsaktiver")}</Kasse>
          <Kasse id="omsa" type="bl" titel={"Gns. omsætnings\u00ADaktiver"} vaerdi={kr(c.A2)} lyser={L("omsa")} />

          <Kasse id="oms5" type="bl" titel="Omsætning" vaerdi={kr(v.O)} lyser={L("oms5")}><span className="pd-note">samme som ovenfor</span></Kasse>
          <Kasse id="vf" type="sk" titel="Vareforbrug" vaerdi={kr(v.VF)} lyser={L("vf")}>{sk("VF", 0, 80000, 500, "Vareforbrug")}</Kasse>
          <Kasse id="varer" type="sk" titel={"Gns. vare\u00ADbeholdninger"} vaerdi={kr(v.LG)} lyser={L("varer")}>{sk("LG", 0, 40000, 500, "Gennemsnitlige varebeholdninger")}</Kasse>
          <Kasse id="tilg" type="sk" titel={"Gns. tilgode\u00ADhavender"} vaerdi={kr(v.DB)} lyser={L("tilg")}>{sk("DB", 0, 40000, 500, "Gennemsnitlige tilgodehavender")}</Kasse>
          <Kasse id="likv" type="sk" titel="Gns. likvid beholdning" vaerdi={kr(v.LK)} lyser={L("likv")}>{sk("LK", 0, 20000, 500, "Gennemsnitlig likvid beholdning")}</Kasse>
        </div>
      </div>
      <p className="pd-rul">Stryg sidelæns for at se hele pyramiden.</p>

      <div className="pd-knapper">
        <button className="ra-btn sec sm" onClick={() => setV(DEF)}>Nulstil til udgangspunktet</button>
      </div>

      <div className="ra-callout">
        <b>Prøv selv – og læg mærke til:</b> Afkastningsgraden kan forbedres ad to veje.
        Skær i vareforbruget eller kapacitetsomkostningerne i venstre side, og se
        overskudsgraden stige. Eller bind mindre kapital i højre side – fx et mindre
        varelager eller kortere kredit til kunderne – og se omsætningshastigheden stige.
        Omsætningen står i midten, fordi den påvirker <i>begge</i> sider. Prøv også at
        øge den likvide beholdning: afkastningsgraden falder, selvom driften er uændret.
      </div>

      <EkfSektion v={v} c={c} saet={saet} />

      <div style={{ marginTop: 16, fontSize: 12, color: "var(--slate)", fontStyle: "italic" }}>
        Simuleringen bruger den sammenhæng før skat, der ligger til grund for DuPont-modellen, og illustrerer mekanikken.
        I et rigtigt regnskab beregnes egenkapitalens forrentning som årets resultat efter renter og skat i forhold til
        egenkapitalen, så tallet kan afvige.
      </div>

      <p className="ra-eyebrow" style={{ margin: "34px 0 10px" }}>Uddybende forklaring</p>
      <div className="ra-callout">
        <b>Om afkastningsgraden.</b> Afkastningsgraden er rentabilitetsanalysens vigtigste nøgletal. Den måler,
        hvor godt virksomheden forrenter <i>al</i> den kapital, der er bundet i virksomheden – uanset om kapitalen
        kommer fra ejerne eller fra långivere. Pyramiden viser, at den kan forbedres ad to veje – ved at tjene mere
        pr. omsætningskrone (venstre side) eller ved at skabe mere omsætning med den samme kapital (højre side). De to
        kan udveksles: et supermarked har lav overskudsgrad, men høj omsætningshastighed, mens en guldsmed har høj
        overskudsgrad og lav hastighed. Afkastningsgraden kan ende det samme sted ad to helt forskellige veje.
      </div>
    </div>
  );
}

const PyramideStil = () => (
  <style>{`
    .pd-forklaring { display: flex; flex-wrap: wrap; gap: 8px 18px; align-items: center; font-size: 12.5px; color: var(--slate); margin-bottom: 10px; }
    .pd-forklaring i { display: inline-block; width: 14px; height: 14px; border-radius: 3px; margin-right: 6px; vertical-align: -2px; }
    .pd-forklaring i.nt { background: var(--navy); }
    .pd-forklaring i.bl { background: #fff; border: 1.5px solid #7A9A7E; }
    .pd-forklaring i.sk { background: var(--neutral); border: 1.5px dashed var(--burgundy); }
    .pd-lille { font-size: 12px; color: var(--slate); }
    .pd-ramme { overflow-x: auto; overflow-y: hidden; background: #EDE6D6; border-radius: 14px; padding: 22px 8px; -webkit-overflow-scrolling: touch; }
    .pd-kanvas { position: relative; margin: 0 auto; }
    .pd-linjer { position: absolute; inset: 0; }
    .pd-linjer line { stroke: #2F4FB0; stroke-width: 2.5; stroke-linecap: square; }
    .pd-op { position: absolute; transform: translate(-50%, -50%); font-family: 'Fraunces', serif; font-size: 24px; font-weight: 800; color: #2F4FB0; line-height: 1; }
    .pd-kasse { position: absolute; box-sizing: border-box; border-radius: 6px; padding: 7px 8px 6px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; transition: box-shadow .25s, transform .25s, background .25s; }
    .pd-kasse .titel { max-width: 100%; overflow-wrap: break-word; font-size: 10.5px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; line-height: 1.2; }
    .pd-kasse .vaerdi { font-family: 'Spline Sans Mono', monospace; font-size: 15px; font-weight: 500; }
    .pd-kasse input[type=range] { width: 100%; margin: 3px 0 0; accent-color: var(--burgundy); height: 18px; cursor: pointer; }
    .pd-bl { background: #fff; border: 2px solid #7A9A7E; color: #2E3F33; }
    .pd-sk { background: #F7F4EE; border: 2px dashed var(--burgundy); color: #2E3F33; }
    .pd-nt { background: #fff; border: 2px solid var(--navy); color: var(--navy); }
    .pd-nt .vaerdi { font-family: 'Fraunces', serif; font-size: 21px; font-weight: 800; }
    .pd-top { background: var(--navy); border: 2px solid var(--navy); color: var(--cream); }
    .pd-top .vaerdi { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 800; }
    .pd-kasse.lyser { box-shadow: 0 0 0 3px #E8C872, 0 6px 16px rgba(28,43,58,.18); transform: translateY(-2px); }
    .pd-delta { font-size: 10.5px; font-weight: 600; line-height: 1.2; }
    .pd-delta.op { color: var(--ok); } .pd-delta.ned { color: var(--err); } .pd-delta.nul { opacity: .6; }
    .pd-top .pd-delta.op { color: #B9E08F; } .pd-top .pd-delta.ned { color: #F4B09A; } .pd-top .pd-delta.nul { color: var(--cream); }
    .pd-note { font-size: 10.5px; color: var(--slate); font-style: italic; }
    .pd-rul { display: none; font-size: 12px; color: var(--slate); font-style: italic; margin: 6px 0 0; }
    @media (max-width: 960px) { .pd-rul { display: block; } }
    .pd-knapper { margin: 12px 0 4px; }

    .pd-ekf { margin-top: 26px; background: #fff; border: 1.5px solid var(--line); border-top: 3px solid var(--burgundy); border-radius: 12px; padding: 20px; }
    .pd-ekf h3 { font-family: 'Fraunces', serif; font-size: 22px; margin: 0 0 6px; color: var(--navy); }
    .pd-tekst { font-size: 14px; color: var(--slate); line-height: 1.55; margin: 0 0 14px; }
    .pd-ligning { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .pd-led { border-radius: 8px; padding: 7px 12px; text-align: center; min-width: 92px; }
    .pd-led span { display: block; font-size: 10.5px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
    .pd-led b { font-family: 'Fraunces', serif; font-size: 19px; }
    .pd-led.top { background: var(--navy); color: var(--cream); }
    .pd-led.nt { border: 2px solid var(--navy); color: var(--navy); }
    .pd-led.sk { border: 2px dashed var(--burgundy); background: #F7F4EE; color: #2E3F33; }
    .pd-led.bl { border: 2px solid #7A9A7E; color: #2E3F33; }
    .pd-lig { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 800; color: #2F4FB0; }
    .pd-ekf-skydere { display: grid; gap: 10px 22px; margin-top: 16px; }
    @media (min-width: 640px) { .pd-ekf-skydere { grid-template-columns: 1fr 1fr; } .pd-ekf-skydere .pd-lille { grid-column: 1 / -1; } }
    .pd-ekf-skydere label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 600; color: var(--navy); }
    .pd-ekf-skydere label b { font-family: 'Spline Sans Mono', monospace; color: var(--burgundy); margin-left: 6px; }
    .pd-ekf-skydere input[type=range] { accent-color: var(--burgundy); }
    .pd-gruppe { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .pd-gruppe small { font-size: 11px; color: var(--slate); font-weight: 600; text-align: center; }
    .pd-gruppe.bue { border-bottom: 2px solid #2F4FB0; padding: 0 4px 4px; border-radius: 0 0 10px 10px; }
    .pd-gruppe.bue small { color: #2F4FB0; }
    .pd-raekke { display: flex; align-items: center; gap: 6px; }
    .pd-bidrag { font-size: 14px; color: var(--ink); margin: 12px 0 0; }
    .pd-h4 { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--slate); margin: 24px 0 10px; font-weight: 700; }
    .pd-led3 { display: grid; gap: 12px; grid-template-columns: 1fr; }
    @media (min-width: 760px) { .pd-led3 { grid-template-columns: repeat(3, 1fr); } }
    .pd-led3 > div { border: 1.5px solid var(--line); border-radius: 10px; padding: 14px 16px; background: #FDFCFA; }
    .pd-led3 .nr { display: inline-flex; width: 26px; height: 26px; border-radius: 50%; background: var(--navy); color: var(--cream); align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-weight: 800; margin-bottom: 6px; }
    .pd-led3 b { display: block; font-family: 'Fraunces', serif; font-size: 16px; color: var(--navy); margin-bottom: 4px; }
    .pd-led3 p { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--ink); }
    .pd-regn { display: grid; gap: 0; border: 1.5px solid var(--line); border-radius: 10px; overflow: hidden; max-width: 620px; }
    .pd-regn > div { display: grid; grid-template-columns: 1fr auto; column-gap: 12px; padding: 8px 14px; border-top: 1px solid var(--line); background: #fff; }
    .pd-regn > div:first-child { border-top: none; }
    .pd-regn span { font-size: 14px; color: var(--ink); }
    .pd-regn b { font-family: 'Spline Sans Mono', monospace; font-size: 14px; text-align: right; color: var(--navy); }
    .pd-regn small { grid-column: 1 / -1; font-size: 11.5px; color: var(--slate); font-family: 'Spline Sans Mono', monospace; }
    .pd-regn .sum { background: var(--neutral); }
    .pd-regn .res { background: var(--navy); } .pd-regn .res span, .pd-regn .res b { color: var(--cream); } .pd-regn .res small { color: rgba(247,244,238,.75); }
    .pd-brug { display: grid; gap: 12px; grid-template-columns: 1fr; }
    @media (min-width: 700px) { .pd-brug { grid-template-columns: 1fr 1fr; } }
    .pd-brug > div { border-left: 4px solid var(--burgundy); background: #FDFCFA; border-radius: 0 10px 10px 0; padding: 12px 14px; }
    .pd-brug b { font-size: 14.5px; color: var(--navy); }
    .pd-brug p { margin: 4px 0 0; font-size: 13.5px; line-height: 1.55; color: var(--ink); }
    .pd-husk { margin-top: 18px; background: #FBF3DC; border-radius: 10px; padding: 12px 16px; }
    .pd-husk b { color: var(--navy); }
    .pd-husk ul { margin: 6px 0 0; padding-left: 18px; }
    .pd-husk li { font-size: 13.5px; line-height: 1.55; color: var(--ink); margin-bottom: 4px; }
  `}</style>
);
