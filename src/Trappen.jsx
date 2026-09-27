import React, { useState } from "react";
import { TRIN, TEMANAVN } from "../netlify/functions/lib/trappe.mjs";

/*
  Formuleringstrappen forklaret – en side for sig.

  Siden er med vilje GENEREL: ingen formuleringer eller pointer fra opgavens
  cases, så de studerende ikke får analysen foræret. Eksemplerne bruger
  pladsholdere som [nøgletal] eller en tænkt virksomhed med opdigtede tal.

  Trinnenes navne, spørgsmål og krav hentes fra lib/trappe.mjs, og
  faldgruberne er de samme temaer, som feedbacken og underviserens overblik
  bruger. Siden og feedbacken taler derfor altid samme sprog.
*/

const INDHOLD = {
  t1: {
    formaal:
      "Før du kan forklare eller vurdere noget, skal læseren vide, hvad der er sket. Trin 1 er fundamentet: de centrale nøgletal, med tal, retning og størrelse. Ingen årsager og ingen vurderinger endnu – dem gemmer du til de næste trin.",
    startere: [
      "[Nøgletal] steg/faldt fra [x] i 2024 til [y] i 2025",
      "… svarende til en stigning på [z] procentpoint",
      "… mens [nøgletal] stort set var uændret",
      "Mest markant er udviklingen i [nøgletal], som …",
    ],
    svag: "Overskudsgraden er steget, og virksomheden klarer sig godt.",
    svagHvorfor: "Ingen tal, og \"klarer sig godt\" er en vurdering, der hører til trin 3.",
    staerk:
      "Overskudsgraden steg fra 6,0 % i 2024 til 7,6 % i 2025, en stigning på 1,6 procentpoint, mens aktivernes omsætningshastighed var uændret på 1,50.",
    staerkHvorfor: "Konkrete tal for begge år, retning og størrelse – og ingen vurdering endnu.",
    tip: "Procent eller procentpoint? Går overskudsgraden fra 6,0 % til 7,6 %, er det en stigning på 1,6 procentpoint – men på ca. 27 procent. Skriv det, du mener.",
    faldgruber: ["kun-tal", "paastand-uden-tal"],
  },
  t2: {
    formaal:
      "Nu spørger du hvorfor. En forklaring fører udviklingen tilbage til en årsag, der kan belægges – i områdets egne nøgletal, i regnskabet eller i ledelsesberetningen. Det er her, sammenhængene mellem nøgletallene gør arbejdet for dig.",
    startere: [
      "Det skyldes, at …",
      "Da [AG] = [OG] × [AOH], og [AOH] er uændret, må stigningen komme fra …",
      "… fordi [forklaring], hvilket ses af, at [nøgletal] …",
      "Ledelsen forklarer det med …, hvilket tallene [bekræfter / ikke bekræfter]",
      "Hvorfor [nøgletal] ændrer sig, undersøger jeg under [område]",
    ],
    svag: "Afkastningsgraden steg, fordi virksomheden har haft et godt år.",
    svagHvorfor: "\"Et godt år\" er ikke en årsag – det er udviklingen sagt med andre ord.",
    staerk:
      "Da AG = OG × AOH, og omsætningshastigheden er uændret, skyldes hele stigningen i afkastningsgraden, at virksomheden tjener mere pr. omsætningskrone. Hvorfor overskudsgraden steg, undersøger jeg under indtjeningsevne.",
    staerkHvorfor: "Bruger sammenhængen mellem nøgletallene til at finde årsagen – og peger frem, hvor kæden fortsætter.",
    tip: null,
    faldgruber: ["manglende-aarsag", "aarsag-forvekslet", "sammenhaeng-ubrugt", "beretning-ukritisk"],
  },
  t3: {
    formaal:
      "Er udviklingen god eller dårlig? Det kan du kun sige, hvis du måler den mod noget. Trin 3 er at vælge en målestok, sige den højt – og så vurdere. \"Det er lavt\" er ikke en vurdering; \"det er lavt sammenlignet med …\" er.",
    startere: [
      "Sammenlignet med [målestok] er [nøgletal] …",
      "Set i forhold til en markedsrente på ca. [x] % er …",
      "[Nøgletal] ligger [over/under] tommelfingerreglen på [x], hvilket …",
      "Det er [tilfredsstillende/utilfredsstillende], fordi …",
      "For en virksomhed, der tjener penge på [volumen/avance], er det …",
    ],
    svag: "En afkastningsgrad på 11,4 % er rigtig flot.",
    svagHvorfor: "Flot sammenlignet med hvad? Uden målestok er det en mening, ikke en vurdering.",
    staerk:
      "Set i forhold til fremmedkapitalens forrentning på 4,2 % er en afkastningsgrad på 11,4 % tilfredsstillende: hver lånt krone forrentes med over 7 procentpoint mere, end den koster.",
    staerkHvorfor: "Navngiver målestokken, sammenligner og drager en klar konklusion.",
    tip: null,
    faldgruber: ["ingen-maalestok", "tommelfingerregel", "noegletal-misforstaaet"],
  },
  t4: {
    formaal:
      "Trappens øverste trin skrives i den samlede konklusion – ikke i de enkelte områder. Her binder du de fem områder sammen til ét billede og spørger: Hvad betyder det for måden, virksomheden tjener penge på? Holder forretningsmodellen, presses den, eller er den ved at skifte? Til sidst en anbefaling, der følger af tallene.",
    startere: [
      "Samlet set viser analysen, at …",
      "Det hænger sammen med …, som jeg viste under [område]",
      "For forretningsmodellen betyder det, at …",
      "Modellen [holder / presses / er ved at skifte], fordi …",
      "Jeg anbefaler derfor, at ledelsen …, fordi …",
    ],
    svag: "Virksomheden er sund, og den bør fortsætte som hidtil.",
    svagHvorfor: "Hverken tal, forretningsmodel eller en begrundet anbefaling.",
    staerk:
      "Samlet set tjener virksomheden mere pr. omsætningskrone, mens kapitalen arbejder lige så hårdt som før. For en model, der bygger på avance frem for volumen, er det et tegn på, at modellen holder. Den øgede gearing gør dog resultatet mere sårbart, så jeg anbefaler, at ledelsen bruger det højere overskud til at nedbringe gælden, før den udvider.",
    staerkHvorfor: "Binder områderne sammen, holder dem op mod modellen og ender i en anbefaling med begrundelse.",
    tip: null,
    faldgruber: ["forretningsmodel-ubrugt", "beretning-ukritisk", "paastand-uden-tal"],
  },
};

// Målestokkene til trin 3. Hver med et eksempel på, hvornår den er god.
const MAALESTOKKE = [
  { navn: "Sidste år", tekst: "Er det bedre eller dårligere end før? Den enkleste målestok – men siger ikke, om niveauet er godt." },
  { navn: "Branchen", tekst: "Hvordan klarer lignende virksomheder sig? Kræver, at du kender eller finder branchetal." },
  { navn: "Markedsrenten", tekst: "Til rentabilitet: tjener kapitalen mere, end den kunne have tjent – eller mere, end lånene koster?" },
  { navn: "Tommelfingerregler", tekst: "Fx likviditetsgrad I omkring 100 %. Brug dem – men forklar, hvorfor grænsen ligger der." },
  { navn: "Forretningsmodellen", tekst: "Hvad er normalt for sådan en virksomhed? En lav bruttomargin er ikke et problem i en volumenforretning." },
];

// Det gennemgåede eksempel. Tænkt virksomhed, opdigtede tal – hvert stykke
// tekst er mærket med sin funktion, så de studerende kan se byggestenene.
const EKSEMPEL = {
  noegletal: [
    ["Afkastningsgrad", "9,0 %", "11,4 %"],
    ["Overskudsgrad", "6,0 %", "7,6 %"],
    ["Aktivernes omsætningshastighed", "1,50", "1,50"],
    ["Egenkapitalens forrentning", "11,3 %", "16,2 %"],
    ["Fremmedkapitalens forrentning", "4,0 %", "4,2 %"],
    ["Finansiel gearing", "1,1", "1,3"],
  ],
  trin: {
    t1: [
      ["Afkastningsgraden steg fra "], ["9,0 % i 2024 til 11,4 % i 2025", "tal"], [". Overskudsgraden steg fra "],
      ["6,0 % til 7,6 %", "tal"], [", mens aktivernes omsætningshastighed var "], ["uændret på 1,50", "tal"],
      [". Egenkapitalens forrentning steg markant fra "], ["11,3 % til 16,2 %", "tal"],
      [", og den finansielle gearing steg fra "], ["1,1 til 1,3", "tal"], ["."],
    ],
    t2: [
      ["Da "], ["AG = OG × AOH, og omsætningshastigheden er uændret", "aarsag"],
      [", skyldes hele stigningen i afkastningsgraden, at virksomheden tjener mere pr. omsætningskrone. "],
      ["Hvorfor overskudsgraden steg, undersøger jeg under indtjeningsevne.", "henvisning"],
      [" At egenkapitalens forrentning stiger mere end afkastningsgraden, skyldes "],
      ["den positive gearingseffekt", "aarsag"], [": afkastningsgraden ligger over fremmedkapitalens forrentning, og gearingen er øget."],
    ],
    t3: [
      ["Set i forhold til "], ["fremmedkapitalens forrentning på 4,2 %", "maalestok"],
      [" er en afkastningsgrad på 11,4 % tilfredsstillende, og "], ["sammenlignet med 2024", "maalestok"],
      [" er udviklingen positiv. Den højere gearing øger dog risikoen: falder afkastningsgraden under lånerenten, vender effekten. "],
      ["Om gældsniveauet er forsvarligt, vurderer jeg under soliditet.", "henvisning"],
    ],
  },
};

const MAERKER = {
  tal: "Tal og retning",
  aarsag: "Årsag / sammenhæng",
  maalestok: "Målestok",
  henvisning: "Henvisning til andet område",
};

// "Hvilket trin?" – korte, generelle sætninger. "0" betyder: en påstand,
// der ikke er noget trin, fordi den mangler både tal og målestok.
const OEVELSE = [
  { s: "Varelagerets omsætningshastighed faldt fra 6,2 til 5,1.", svar: 1, hvorfor: "Tal og retning – intet om hvorfor, intet om godt eller skidt." },
  { s: "Overskudsgraden er god.", svar: 0, hvorfor: "En påstand: ingen tal og ingen målestok. Den mangler både trin 1 og trin 3." },
  { s: "Faldet skyldes, at varelageret er vokset hurtigere end vareforbruget.", svar: 2, hvorfor: "En årsag, der kan belægges i tallene." },
  { s: "Med en likviditetsgrad I på 85 % ligger virksomheden under tommelfingerreglen på 100 %, hvilket er et svaghedstegn.", svar: 3, hvorfor: "En navngivet målestok og en klar vurdering." },
  { s: "Hvorfor debitordagene stiger, undersøger jeg under kapitaltilpasning.", svar: 2, hvorfor: "En henvisning: årsagskæden fortsætter i et andet område. Det tæller som en god forklaring." },
  { s: "For en virksomhed, der tjener penge på volumen frem for avance, er en bruttomargin på 18 % ikke bekymrende.", svar: 3, hvorfor: "Forretningsmodellen brugt som målestok – hvad er normalt for sådan en virksomhed?" },
  { s: "Egenkapitalens forrentning stiger mere end afkastningsgraden, fordi gearingen er øget, og afkastningsgraden ligger over lånerenten.", svar: 2, hvorfor: "Forklarer en udvikling med sammenhængen mellem nøgletallene." },
  { s: "Det er rigtig flot, at omsætningen er steget.", svar: 0, hvorfor: "\"Rigtig flot\" er en følelse. Hvor meget steg den – og flot sammenlignet med hvad?" },
  { s: "Samlet set presses modellen: den bygger på høj avance, men marginen falder, mens kapitalen bindes i lager. Jeg anbefaler, at ledelsen prioriterer marginen frem for vækst.", svar: 4, hvorfor: "Binder områderne sammen, siger noget om forretningsmodellen og ender i en anbefaling." },
  { s: "Soliditetsgraden på 28 % er lav sammenlignet med branchens gennemsnit på 35 %.", svar: 3, hvorfor: "Målestokken er branchen – og den er sagt højt." },
];

const svarNavn = n => (n === 0 ? "En påstand – intet trin" : `Trin ${n} – ${TRIN[n - 1].navn}`);

function Trappe({ til }) {
  return (
    <div className="tp-trappe" role="list">
      {TRIN.map(t => (
        <button key={t.id} role="listitem" className={"tp-trin tp-trin-" + t.nr} onClick={() => til(t.id)}>
          <span className="nr">{t.nr}</span>
          <span className="navn">{t.navn}</span>
          <span className="spm">{t.spoergsmaal}</span>
          <span className="hvor">{t.nr < 4 ? "pr. analyseområde" : "i den samlede konklusion"}</span>
        </button>
      ))}
    </div>
  );
}

function Kaede() {
  return (
    <div className="tp-kaede" aria-label="Sammenhængen mellem de fem analyseområder">
      <div className="top">
        <b>Rentabilitet</b>
        <span className="ra-mono">AG = OG × AOH</span>
      </div>
      <div className="grene">
        <div><i>Hvorfor ændrer OG sig?</i><b>Indtjeningsevne</b><span>bruttomargin, omkostninger, nulpunkt</span></div>
        <div><i>Hvorfor ændrer AOH sig?</i><b>Kapitaltilpasning</b><span>lager, debitorer, anlæg, pengestrøm</span></div>
      </div>
      <div className="bund">
        <div><b>Soliditet og likviditet</b><span>gearingen og kapitalbindingen slår igennem her</span></div>
        <div><b>Børsrelaterede nøgletal</b><span>markedets syn på det hele</span></div>
      </div>
    </div>
  );
}

function Markeret({ dele }) {
  return (
    <p className="tp-markeret">
      {dele.map(([tekst, type], i) =>
        type ? <mark key={i} className={"m-" + type} title={MAERKER[type]}>{tekst}</mark> : <span key={i}>{tekst}</span>
      )}
    </p>
  );
}

function Oevelse() {
  const [valg, setValg] = useState({});
  const rigtige = OEVELSE.filter((o, i) => valg[i] === o.svar).length;
  const besvaret = Object.keys(valg).length;
  return (
    <div className="tp-oevelse">
      {OEVELSE.map((o, i) => {
        const v = valg[i];
        const svaret = v !== undefined;
        return (
          <div key={i} className={"tp-opg" + (svaret ? (v === o.svar ? " ok" : " fejl") : "")}>
            <p className="s">“{o.s}”</p>
            <div className="valg">
              {[1, 2, 3, 4, 0].map(n => (
                <button key={n} disabled={svaret}
                  className={svaret && n === o.svar ? "rigtig" : svaret && n === v ? "forkert" : ""}
                  onClick={() => setValg(x => ({ ...x, [i]: n }))}>
                  {n === 0 ? "Påstand" : `Trin ${n}`}
                </button>
              ))}
            </div>
            {svaret && (
              <p className="hvorfor">
                <b>{v === o.svar ? "Rigtigt. " : `Det er ${svarNavn(o.svar).toLowerCase()}. `}</b>{o.hvorfor}
              </p>
            )}
          </div>
        );
      })}
      <div className="tp-resultat">
        {besvaret < OEVELSE.length
          ? `${besvaret} af ${OEVELSE.length} besvaret`
          : <>Du ramte <b>{rigtige} af {OEVELSE.length}</b>. <button className="ra-link" onClick={() => setValg({})}>Prøv igen</button></>}
      </div>
    </div>
  );
}

export default function TrappenView({ tilAnalyse }) {
  const til = id => document.getElementById("tp-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="ra-fade tp">
      <TrappeStil />

      <section className="tp-hero">
        <p className="ra-eyebrow">Fra tal til forretning</p>
        <h2>Formuleringstrappen</h2>
        <p className="lead">
          En regnskabsanalyse er ikke en liste af nøgletal. Den er et argument, der bygges op
          trin for trin – fra det, der er sket, til det, det betyder for virksomheden. Trappen
          giver dig fire spørgsmål at besvare i rækkefølge. Hvert trin står på det forrige.
        </p>
        <Trappe til={til} />
      </section>

      <section className="tp-principper">
        <div><b>Ét spørgsmål pr. trin</b><p>Hvert trin besvarer ét spørgsmål. Blander du dem, bliver argumentet uklart – og feedbacken vurderer hvert trin for sig.</p></div>
        <div><b>Hvert trin bygger på det forrige</b><p>En forklaring uden tal hænger i luften. En vurdering uden forklaring er en mening. Derfor tæller trappen nedefra.</p></div>
        <div><b>Trin 1–3 pr. område, trin 4 til sidst</b><p>De tre første trin skriver du for hvert af de fem analyseområder. Trin 4 hører til den samlede konklusion.</p></div>
      </section>

      {TRIN.map(t => {
        const c = INDHOLD[t.id];
        return (
          <section key={t.id} id={"tp-" + t.id} className={"tp-sektion tp-s" + t.nr}>
            <header>
              <span className="nr">{t.nr}</span>
              <div>
                <h3>{t.navn}</h3>
                <p className="spm">{t.spoergsmaal}</p>
              </div>
            </header>
            <p className="formaal">{c.formaal}</p>

            <div className="tp-krav"><b>Trinnet er nået, når …</b> {t.krav.replace(/^Trinnet er nået, når /, "")}</div>

            {t.id === "t2" && (
              <div className="tp-boks">
                <h4>Når årsagen ligger i et andet område</h4>
                <p>
                  De fem analyseområder hænger sammen som en kæde. Du skal ikke hente et andet
                  områdes nøgletal ind for at forklare – peg frem i stedet: <i>“Hvorfor …,
                  undersøger jeg under …”</i>. Det tæller som en god forklaring, og kæden samler
                  du i den samlede konklusion.
                </p>
                <Kaede />
              </div>
            )}

            {t.id === "t3" && (
              <div className="tp-boks">
                <h4>Vælg en målestok – og sig den højt</h4>
                <div className="tp-maalestokke">
                  {MAALESTOKKE.map(m => <div key={m.navn}><b>{m.navn}</b><p>{m.tekst}</p></div>)}
                </div>
              </div>
            )}

            {t.id === "t4" && (
              <div className="tp-boks">
                <h4>Tre spørgsmål til forretningsmodellen</h4>
                <div className="tp-tre">
                  <div><span>1</span>Tjener virksomheden penge på <b>avance eller volumen</b>?</div>
                  <div><span>2</span>Hvor er <b>kapitalen bundet</b> – i anlæg, lager eller tilgodehavender?</div>
                  <div><span>3</span>Hvordan <b>betaler kunderne</b>, og hvor tunge er de faste omkostninger?</div>
                </div>
                <p className="lille">Svarene er de samme, som afslørede modellen i <i>Gæt forretningsmodellen</i>. Nu bruger du dem den anden vej: Hvad betyder årets tal for modellen?</p>
              </div>
            )}

            <h4 className="tp-h4">Sætningsstartere</h4>
            <div className="tp-startere">{c.startere.map(s => <span key={s}>{s}</span>)}</div>

            <h4 className="tp-h4">Svag og stærk formulering <em>tænkt virksomhed, opdigtede tal</em></h4>
            <div className="tp-sammenlign">
              <div className="svag"><span className="lbl">Svag</span><p>“{c.svag}”</p><small>{c.svagHvorfor}</small></div>
              <div className="staerk"><span className="lbl">Stærk</span><p>“{c.staerk}”</p><small>{c.staerkHvorfor}</small></div>
            </div>

            {c.tip && <p className="tp-tip"><b>Husk:</b> {c.tip}</p>}

            <h4 className="tp-h4">Typiske faldgruber</h4>
            <ul className="tp-faldgruber">{c.faldgruber.map(id => <li key={id}>{TEMANAVN[id]}</li>)}</ul>
          </section>
        );
      })}

      <section className="tp-sektion tp-eksempel">
        <header><div>
          <p className="ra-eyebrow">Hele vejen op – ét område</p>
          <h3>Et gennemgået eksempel</h3>
          <p className="spm">Rentabilitet for en tænkt virksomhed. Tallene er opdigtede og hører ikke til nogen af opgavens cases.</p>
        </div></header>

        <div className="tp-eks-tabel">
          <table className="ra-table">
            <thead><tr><th>Nøgletal</th><th className="num">2024</th><th className="num">2025</th></tr></thead>
            <tbody>{EKSEMPEL.noegletal.map(r => <tr key={r[0]}><td>{r[0]}</td><td className="num">{r[1]}</td><td className="num">{r[2]}</td></tr>)}</tbody>
          </table>
        </div>

        <div className="tp-forklaring">
          {Object.entries(MAERKER).map(([k, v]) => <span key={k}><mark className={"m-" + k}>{v}</mark></span>)}
        </div>

        {["t1", "t2", "t3"].map(id => {
          const t = TRIN.find(x => x.id === id);
          return (
            <div key={id} className="tp-eks-trin">
              <div className="hoved"><span className="nr">{t.nr}</span><b>{t.navn}</b></div>
              <Markeret dele={EKSEMPEL.trin[id]} />
            </div>
          );
        })}
        <p className="lille">
          Læg mærke til, at trin 2 ikke forklarer, <i>hvorfor</i> overskudsgraden steg – den peger frem
          til indtjeningsevne. Og at trin 3 lader gælden ligge til soliditet. Hvert område passer sit.
        </p>
      </section>

      <section className="tp-sektion tp-oev">
        <header><div>
          <p className="ra-eyebrow">Øv dig</p>
          <h3>Hvilket trin er sætningen?</h3>
          <p className="spm">Nogle sætninger er slet ikke et trin – de er påstande.</p>
        </div></header>
        <Oevelse />
      </section>

      <section className="tp-sektion tp-feedback">
        <header><div>
          <p className="ra-eyebrow">Når du får feedback</p>
          <h3>Sådan læses din trappe</h3>
        </div></header>
        <div className="tp-niveauer">
          <div><span className="ra-maerke naaet">nået</span><p>Trinnet opfylder kravet ovenfor.</p></div>
          <div><span className="ra-maerke delvist">delvist</span><p>På vej – der mangler et tal, en årsag eller en målestok.</p></div>
          <div><span className="ra-maerke mangler">mangler</span><p>Trinnet er ikke skrevet endnu, eller det besvarer et andet spørgsmål.</p></div>
        </div>
        <p className="formaal">
          Dit niveau på et område er antallet af trin nedefra, der er nået i træk. En stærk vurdering
          oven på en manglende forklaring tæller derfor ikke som trin 3 – den mangler sit fundament.
          Feedbacken giver dig ét forslag pr. trin: det, der flytter dig ét trin op.
        </p>
        {tilAnalyse && <button className="ra-btn accent" onClick={tilAnalyse}>Gå til analyseopgaven →</button>}
      </section>
    </div>
  );
}

const TrappeStil = () => (
  <style>{`
    .tp { --t1: #C9D4E0; --t2: #8DA2B9; --t3: #4F6B8A; --t4: #1C2B3A; }
    .tp section { margin-bottom: 26px; }
    .tp-hero h2 { font-family: 'Fraunces', serif; font-weight: 800; font-size: clamp(30px, 6vw, 46px); margin: 6px 0 8px; color: var(--navy); letter-spacing: -0.01em; }
    .tp-hero .lead { color: var(--slate); font-size: 16px; line-height: 1.6; max-width: 62ch; margin: 0 0 22px; }

    .tp-trappe { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; align-items: end; }
    .tp-trin { font-family: inherit; text-align: left; border: none; cursor: pointer; border-radius: 10px 10px 4px 4px; padding: 14px 14px 16px; display: flex; flex-direction: column; gap: 3px; justify-content: flex-end; transition: transform .15s, box-shadow .15s; }
    .tp-trin:hover { transform: translateY(-3px); box-shadow: 0 8px 18px rgba(28,43,58,.15); }
    .tp-trin .nr { font-family: 'Fraunces', serif; font-size: 34px; font-weight: 800; line-height: 1; }
    .tp-trin .navn { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; }
    .tp-trin .spm { font-size: 13px; line-height: 1.35; opacity: .9; }
    .tp-trin .hvor { font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; font-weight: 700; opacity: .75; margin-top: 6px; }
    .tp-trin-1 { min-height: 150px; background: var(--t1); color: var(--navy); }
    .tp-trin-2 { min-height: 190px; background: var(--t2); color: var(--navy); }
    .tp-trin-3 { min-height: 230px; background: var(--t3); color: var(--cream); }
    .tp-trin-4 { min-height: 270px; background: var(--t4); color: var(--cream); border-top: 5px solid var(--gold); }
    @media (max-width: 640px) {
      .tp-trappe { grid-template-columns: 1fr; }
      .tp-trin { min-height: 0 !important; border-radius: 10px; }
      .tp-trin-2 { margin-left: 6%; } .tp-trin-3 { margin-left: 12%; } .tp-trin-4 { margin-left: 18%; }
    }

    .tp-principper { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .tp-principper div { background: #fff; border: 1.5px solid var(--line); border-radius: 10px; padding: 14px 16px; }
    .tp-principper b { font-family: 'Fraunces', serif; font-size: 16px; color: var(--navy); }
    .tp-principper p { margin: 6px 0 0; font-size: 13.5px; color: var(--slate); line-height: 1.55; }

    .tp-sektion { background: #fff; border: 1.5px solid var(--line); border-radius: 12px; padding: 22px 22px 20px; border-left: 6px solid var(--t2); scroll-margin-top: 16px; }
    .tp-s1 { border-left-color: var(--t1); } .tp-s2 { border-left-color: var(--t2); } .tp-s3 { border-left-color: var(--t3); } .tp-s4 { border-left-color: var(--gold); }
    .tp-eksempel, .tp-oev, .tp-feedback { border-left-color: var(--burgundy); }
    .tp-sektion header { display: flex; gap: 14px; align-items: center; margin-bottom: 10px; }
    .tp-sektion header .nr { flex: 0 0 48px; height: 48px; border-radius: 50%; background: var(--navy); color: var(--cream); display: inline-flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-size: 24px; font-weight: 800; }
    .tp-s4 header .nr { background: var(--gold); }
    .tp-sektion h3 { font-family: 'Fraunces', serif; font-size: 26px; margin: 0; color: var(--navy); }
    .tp-sektion .spm { margin: 2px 0 0; color: var(--slate); font-size: 15px; }
    .tp .formaal { font-size: 15px; line-height: 1.65; color: var(--ink); margin: 6px 0 14px; max-width: 70ch; }
    .tp-krav { background: var(--neutral); border-radius: 8px; padding: 11px 14px; font-size: 14px; line-height: 1.55; color: var(--ink); margin-bottom: 16px; }
    .tp-krav b { color: var(--navy); }
    .tp-h4 { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--slate); margin: 18px 0 8px; font-weight: 700; }
    .tp-h4 em { font-style: italic; text-transform: none; letter-spacing: 0; font-weight: 500; color: var(--slate); opacity: .8; margin-left: 6px; }

    .tp-startere { display: flex; flex-wrap: wrap; gap: 8px; }
    .tp-startere span { font-size: 13.5px; background: #fff; border: 1.5px dashed var(--t2); border-radius: 8px; padding: 7px 11px; color: var(--navy); }

    .tp-sammenlign { display: grid; gap: 12px; grid-template-columns: 1fr; }
    @media (min-width: 700px) { .tp-sammenlign { grid-template-columns: 1fr 1fr; } }
    .tp-sammenlign > div { border-radius: 10px; padding: 14px 16px; position: relative; }
    .tp-sammenlign .svag { background: var(--err-bg); }
    .tp-sammenlign .staerk { background: var(--ok-bg); }
    .tp-sammenlign .lbl { font-size: 10.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
    .tp-sammenlign .svag .lbl { color: var(--err); } .tp-sammenlign .staerk .lbl { color: var(--ok); }
    .tp-sammenlign p { margin: 6px 0 8px; font-size: 14.5px; line-height: 1.55; color: var(--ink); font-style: italic; }
    .tp-sammenlign small { font-size: 12.5px; color: var(--slate); line-height: 1.45; display: block; }
    .tp-tip { font-size: 13.5px; color: var(--slate); background: #FBF3DC; border-radius: 8px; padding: 10px 14px; margin: 14px 0 0; line-height: 1.5; }

    .tp-faldgruber { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
    .tp-faldgruber li { font-size: 13px; background: var(--neutral); border-radius: 6px; padding: 5px 10px; color: var(--navy); }
    .tp-faldgruber li::before { content: "⚠ "; color: var(--gold); }

    .tp-boks { border: 1.5px solid var(--line); border-radius: 10px; padding: 14px 16px; margin: 0 0 6px; background: #FDFCFA; }
    .tp-boks h4 { font-family: 'Fraunces', serif; font-size: 17px; margin: 0 0 6px; color: var(--navy); }
    .tp-boks p { font-size: 14px; line-height: 1.55; color: var(--ink); margin: 0 0 12px; }
    .tp .lille { font-size: 13px; color: var(--slate); line-height: 1.55; margin: 12px 0 0; }

    .tp-kaede { display: grid; gap: 10px; }
    .tp-kaede b { display: block; font-family: 'Fraunces', serif; font-size: 15.5px; color: var(--navy); }
    .tp-kaede span { font-size: 12.5px; color: var(--slate); }
    .tp-kaede i { display: block; font-size: 12px; color: var(--burgundy); font-style: normal; font-weight: 700; margin-bottom: 2px; }
    .tp-kaede .top { justify-self: center; text-align: center; background: var(--navy); border-radius: 10px; padding: 10px 22px; }
    .tp-kaede .top b { color: var(--cream); } .tp-kaede .top span { color: #E8C872; font-size: 13px; }
    .tp-kaede .grene, .tp-kaede .bund { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; position: relative; }
    .tp-kaede .grene > div { background: #fff; border: 1.5px solid var(--t3); border-radius: 10px; padding: 10px 12px; text-align: center; position: relative; }
    .tp-kaede .grene > div::before { content: ""; position: absolute; top: -11px; left: 50%; width: 2px; height: 10px; background: var(--t3); }
    .tp-kaede .bund > div { background: var(--neutral); border-radius: 10px; padding: 9px 12px; text-align: center; }

    .tp-maalestokke { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
    .tp-maalestokke div { background: #fff; border: 1.5px solid var(--line); border-top: 3px solid var(--t3); border-radius: 8px; padding: 10px 12px; }
    .tp-maalestokke b { font-size: 14px; color: var(--navy); }
    .tp-maalestokke p { margin: 4px 0 0; font-size: 12.5px; color: var(--slate); line-height: 1.45; }

    .tp-tre { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
    .tp-tre div { background: #fff; border: 1.5px solid var(--line); border-radius: 8px; padding: 10px 12px; font-size: 14px; line-height: 1.5; color: var(--ink); display: flex; gap: 10px; align-items: flex-start; }
    .tp-tre span { flex: 0 0 24px; height: 24px; border-radius: 50%; background: var(--gold); color: #fff; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; }

    .tp-eks-tabel { border: 1.5px solid var(--line); border-radius: 10px; overflow: hidden; max-width: 520px; margin: 4px 0 14px; }
    .tp-forklaring { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; font-size: 12.5px; }
    .tp mark { border-radius: 4px; padding: 1px 3px; color: var(--ink); }
    .tp mark.m-tal { background: #DCE4EE; box-shadow: inset 0 -2px 0 var(--t3); }
    .tp mark.m-aarsag { background: #F3E3E6; box-shadow: inset 0 -2px 0 var(--burgundy); }
    .tp mark.m-maalestok { background: #FBF0D2; box-shadow: inset 0 -2px 0 var(--gold); }
    .tp mark.m-henvisning { background: #E4EEDC; box-shadow: inset 0 -2px 0 var(--ok); }
    .tp-eks-trin { display: grid; grid-template-columns: 150px 1fr; gap: 14px; padding: 12px 0; border-top: 1px solid var(--line); }
    @media (max-width: 640px) { .tp-eks-trin { grid-template-columns: 1fr; gap: 4px; } }
    .tp-eks-trin .hoved { display: flex; gap: 8px; align-items: center; }
    .tp-eks-trin .hoved .nr { flex: 0 0 28px; height: 28px; border-radius: 50%; background: var(--navy); color: var(--cream); display: inline-flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-weight: 800; }
    .tp-eks-trin .hoved b { font-family: 'Fraunces', serif; font-size: 16px; color: var(--navy); }
    .tp-markeret { margin: 0; font-size: 15px; line-height: 1.85; color: var(--ink); }

    .tp-oevelse { display: grid; gap: 10px; }
    .tp-opg { border: 1.5px solid var(--line); border-radius: 10px; padding: 12px 14px; background: #fff; transition: border-color .2s; }
    .tp-opg.ok { border-color: var(--ok); } .tp-opg.fejl { border-color: var(--err); }
    .tp-opg .s { margin: 0 0 10px; font-size: 14.5px; line-height: 1.5; color: var(--ink); font-style: italic; }
    .tp-opg .valg { display: flex; flex-wrap: wrap; gap: 6px; }
    .tp-opg .valg button { font-family: inherit; font-size: 13px; font-weight: 600; border: 1.5px solid var(--line); background: #fff; color: var(--navy); border-radius: 7px; padding: 6px 12px; cursor: pointer; }
    .tp-opg .valg button:hover:not(:disabled) { border-color: var(--navy); }
    .tp-opg .valg button:disabled { cursor: default; opacity: .55; }
    .tp-opg .valg button.rigtig { opacity: 1; background: var(--ok-bg); border-color: var(--ok); color: var(--ok); }
    .tp-opg .valg button.forkert { opacity: 1; background: var(--err-bg); border-color: var(--err); color: var(--err); }
    .tp-opg .hvorfor { margin: 10px 0 0; font-size: 13.5px; color: var(--slate); line-height: 1.5; }
    .tp-resultat { font-size: 14px; color: var(--slate); text-align: right; }

    .tp-niveauer { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 10px; }
    .tp-niveauer div { display: flex; gap: 10px; align-items: flex-start; }
    .tp-niveauer p { margin: 0; font-size: 13.5px; color: var(--slate); line-height: 1.45; }
  `}</style>
);
