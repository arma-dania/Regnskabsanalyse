import React, { useState, useEffect, useMemo } from "react";
import { api } from "./api.js";
import { TRIN, NIVEAUNAVN } from "../netlify/functions/lib/trappe.mjs";

/*
  Underviserens overblik. Viser aktivitet, hvor langt op ad formuleringstrappen
  hver studerende er nået, og de udfordringer, der går igen – men ikke de
  studerendes tekster. De gemmes ikke, og er derfor heller ikke her.

  Trinniveau er en ordnet størrelse (0 → 3), så det vises i én farvetone fra
  lys til mørk og ikke i fire forskellige farver. De lyse trin har lav
  kontrast mod hvid; derfor står antallet altid som tal på segmentet, og
  tabellen nederst viser det samme pr. person.
*/

const NIVEAUFARVE = ["#C9D4E0", "#8DA2B9", "#4F6B8A", "#1C2B3A"];
const NIVEAUTEKST = ["#1C2B3A", "#1C2B3A", "#F7F4EE", "#F7F4EE"];
const NIVEAUNAVNE = ["Ikke over trin 1", "Trin 1", "Trin 2", "Trin 3"];
const T4_RAEKKE = ["mangler", "delvist", "naaet"];

const dansk = (iso) => new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });
function sidstTekst(dage) {
  if (dage === null || dage === undefined) return "aldrig";
  if (dage === 0) return "i dag";
  if (dage === 1) return "i går";
  return `${dage} dage siden`;
}

/* ---------- Hover ---------- */
// Én tooltip for hele siden, der følger musen. Søjlerne sætter indholdet.
function useTip() {
  const [tip, setTip] = useState(null);
  const vis = (e, indhold) => setTip({ x: e.clientX, y: e.clientY, indhold });
  const skjul = () => setTip(null);
  const Tip = () =>
    tip ? (
      <div className="ud-tip" style={{ left: Math.min(tip.x + 14, window.innerWidth - 230), top: tip.y + 14 }}>{tip.indhold}</div>
    ) : null;
  return { vis, skjul, Tip };
}

/* ---------- Små byggesten ---------- */
function Tal({ vaerdi, tekst, note }) {
  return (
    <div className="ud-tal">
      <div className="v">{vaerdi}</div>
      <div className="t">{tekst}</div>
      {note && <div className="n">{note}</div>}
    </div>
  );
}

function MiniTrappe({ niveau, paaVej }) {
  if (niveau === null || niveau === undefined) return <span className="ud-tom">–</span>;
  return (
    <span className="ud-mini" title={`${NIVEAUNAVNE[niveau]}${paaVej ? " – næste trin på vej" : ""}`}>
      {[1, 2, 3].map((n) => (
        <i key={n} className={n <= niveau ? "fuld" : n === niveau + 1 && paaVej ? "halv" : ""} style={{ height: 4 + n * 4 }} />
      ))}
    </span>
  );
}

function Maerke({ niveau }) {
  if (!niveau) return <span className="ud-tom">–</span>;
  return <span className={"ud-maerke " + niveau}>{NIVEAUNAVN[niveau]}</span>;
}

// Stablet søjle: antal studerende pr. niveau. 2px mellemrum mellem segmenter,
// tal direkte på segmentet, hover med den fulde forklaring.
function Stabel({ taelling, farver, tekstfarver, navne, tip, titel }) {
  const ialt = taelling.reduce((a, b) => a + b, 0);
  if (!ialt) return <div className="ud-stabel tom">Ingen har fået feedback her endnu</div>;
  return (
    <div className="ud-stabel" role="img" aria-label={`${titel}: ` + taelling.map((n, i) => `${navne[i]} ${n}`).join(", ")}>
      {taelling.map((n, i) =>
        n ? (
          <div key={i} className="seg" style={{ flexGrow: n, background: farver[i], color: tekstfarver[i] }}
            onMouseMove={(e) => tip.vis(e, <><b>{titel}</b><br />{navne[i]}: {n} af {ialt} ({Math.round((n / ialt) * 100)} %)</>)}
            onMouseLeave={tip.skjul}>
            {n / ialt >= 0.08 ? n : ""}
          </div>
        ) : null
      )}
    </div>
  );
}

function Forklaring({ farver, navne }) {
  return (
    <div className="ud-forklaring">
      {navne.map((n, i) => (<span key={n}><i style={{ background: farver[i] }} />{n}</span>))}
    </div>
  );
}

// Aktivitet dag for dag: én serie, så ingen forklaringsboks – titlen siger,
// hvad søjlerne er.
function Aktivitet({ dage, antal, tip }) {
  const maks = Math.max(1, ...dage.map((d) => d.studerende));
  return (
    <div className="ud-kort">
      <h3>Studerende i gang pr. dag <span>seneste 28 dage</span></h3>
      <div className="ud-akt">
        <div className="ud-akt-y"><span>{maks}</span><span>0</span></div>
        <div className="ud-akt-soejler">
          {dage.map((d) => (
            <div key={d.dato} className="kol"
              onMouseMove={(e) => tip.vis(e, <><b>{dansk(d.dato)}</b><br />{d.studerende} af {antal} studerende i gang<br />{d.handlinger} handlinger</>)}
              onMouseLeave={tip.skjul}>
              <div className="bar" style={{ height: `${(d.studerende / maks) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="ud-akt-x">
        <span>{dansk(dage[0].dato)}</span><span>{dansk(dage[13].dato)}</span><span>i dag</span>
      </div>
    </div>
  );
}

/* ---------- Holdets side ---------- */
function HoldSide({ holdId, tilbage, opdateret }) {
  const [d, setD] = useState(null);
  const [fejl, setFejl] = useState("");
  const [liste, setListe] = useState("");
  const [nye, setNye] = useState(null);
  const [visKoder, setVisKoder] = useState(false);
  const [sortering, setSortering] = useState("navn");
  const [sletNavn, setSletNavn] = useState("");
  const [visSlet, setVisSlet] = useState(false);
  const tip = useTip();

  async function hent() {
    try { setD(await api("GET", `/admin-api/hold/${holdId}/oversigt`)); setFejl(""); }
    catch (e) { setFejl(e.message); }
  }
  useEffect(() => { hent(); }, [holdId]);

  const temanavn = useMemo(() => Object.fromEntries((d?.temaer || []).map((t) => [t.id, t.navn])), [d]);

  const sorterede = useMemo(() => {
    if (!d) return [];
    const samletNiveau = (s) => Object.values(s.omraader).reduce((a, r) => a + (r ? r.niveau : 0), 0);
    const kopi = [...d.studerende];
    if (sortering === "sidst") kopi.sort((a, b) => (a.dageSidenSidst ?? 1e9) - (b.dageSidenSidst ?? 1e9));
    if (sortering === "niveau") kopi.sort((a, b) => samletNiveau(a) - samletNiveau(b));
    if (sortering === "temaer") kopi.sort((a, b) => b.temaer.length - a.temaer.length);
    return kopi;
  }, [d, sortering]);

  async function tilfoej() {
    try {
      const r = await api("POST", `/admin-api/hold/${holdId}/studerende`, { liste });
      setNye(r); setListe(""); hent(); opdateret();
    } catch (e) { setFejl(e.message); }
  }

  async function nyKode(s) {
    if (!confirm(`Lav en ny kode til ${s.navn}? Den gamle holder op med at virke.`)) return;
    try { await api("POST", `/admin-api/hold/${holdId}/studerende/${s.id}/nykode`); setVisKoder(true); hent(); }
    catch (e) { setFejl(e.message); }
  }

  async function sletStuderende(s) {
    if (!confirm(`Slet ${s.navn} og alt, der er gemt om vedkommende? Det kan ikke fortrydes.`)) return;
    try { await api("DELETE", `/admin-api/hold/${holdId}/studerende/${s.id}`); hent(); opdateret(); }
    catch (e) { setFejl(e.message); }
  }

  async function sletHold() {
    try { await api("DELETE", `/admin-api/hold/${holdId}`); opdateret(); tilbage(); }
    catch (e) { setFejl(e.message); }
  }

  if (!d) return fejl ? <div className="ud-fejl">{fejl}</div> : <p className="ud-sub">Henter holdet…</p>;
  const s = d.samlet;
  const flestFast = [...s.staaPaa].sort((a, b) => b.antal - a.antal)[0];

  return (
    <div>
      <tip.Tip />
      <button className="ud-link" onClick={tilbage}>← Alle hold</button>
      <div className="ud-holdtop">
        <h2>{d.hold.navn}</h2>
        <div className="ud-knapper">
          <button className="ud-btn sec" onClick={hent}>↻ Opdatér</button>
          <a className="ud-btn sec" href={`/admin-api/hold/${holdId}/eksport`}>Hent CSV</a>
          <button className="ud-btn sec" onClick={() => window.print()}>Udskriv kodeliste</button>
        </div>
      </div>
      {fejl && <div className="ud-fejl">{fejl}</div>}

      {d.studerende.length === 0 ? (
        <p className="ud-sub">Holdet har ingen studerende endnu. Tilføj dem nederst på siden.</p>
      ) : (
        <>
          <div className="ud-tallinje">
            <Tal vaerdi={s.antal} tekst="studerende" />
            <Tal vaerdi={s.loggetInd} tekst="har logget ind" note={s.antal - s.loggetInd ? `${s.antal - s.loggetInd} mangler` : "alle"} />
            <Tal vaerdi={s.aktiveIDag} tekst="aktive i dag" />
            <Tal vaerdi={s.aktiveUge} tekst="aktive seneste 7 dage" />
          </div>

          <div className="ud-to">
            <Aktivitet dage={d.aktivitet} antal={s.antal} tip={tip} />
            <div className="ud-kort">
              <h3>Tag fat i <span>{s.tagFatI.length ? `${s.tagFatI.length} studerende` : "ingen lige nu"}</span></h3>
              {s.tagFatI.length ? (
                <ul className="ud-fatliste">
                  {s.tagFatI.map((x) => (<li key={x.id}><span className={"ud-grund " + x.grund}>{x.grund === "aldrig" ? "Aldrig" : x.grund === "inaktiv" ? "Inaktiv" : "Fast"}</span><b>{x.navn}</b> <span>{x.tekst}</span></li>))}
                </ul>
              ) : <p className="ud-sub">Alle har været i gang den seneste uge, og ingen sidder fast.</p>}
              <p className="ud-fodnote">Inaktiv: ingen aktivitet i 7 dage. Fast: mindst 3 forsøg på et område uden at komme over trin 1, og intet trin på vej.</p>
            </div>
          </div>

          <div className="ud-kort">
            <h3>Hvor langt op ad trappen <span>bedste niveau pr. studerende på tværs af cases</span></h3>
            <Forklaring farver={NIVEAUFARVE} navne={NIVEAUNAVNE} />
            <div className="ud-stabler">
              {d.omraader.map((o) => {
                const f = s.fordeling[o.id];
                return (
                  <div key={o.id} className="ud-stabelraekke">
                    <div className="navn">{o.navn}<span>{f.igang} af {s.antal} i gang{f.paaVej ? ` · ${f.paaVej} på vej op` : ""}</span></div>
                    <Stabel taelling={f.niveauer} farver={NIVEAUFARVE} tekstfarver={NIVEAUTEKST} navne={NIVEAUNAVNE} tip={tip} titel={o.navn} />
                  </div>
                );
              })}
              <div className="ud-stabelraekke t4">
                <div className="navn">Trin 4 – forretningsmodellen<span>{s.t4.naaet + s.t4.delvist + s.t4.mangler} af {s.antal} har skrevet en konklusion</span></div>
                <Stabel taelling={T4_RAEKKE.map((k) => s.t4[k])} farver={[NIVEAUFARVE[0], NIVEAUFARVE[2], NIVEAUFARVE[3]]}
                  tekstfarver={[NIVEAUTEKST[0], NIVEAUTEKST[2], NIVEAUTEKST[3]]} navne={T4_RAEKKE.map((k) => NIVEAUNAVN[k])} tip={tip} titel="Trin 4" />
              </div>
              <div className="ud-stabelraekke"><div />
                <Forklaring farver={[NIVEAUFARVE[0], NIVEAUFARVE[2], NIVEAUFARVE[3]]} navne={T4_RAEKKE.map((k) => NIVEAUNAVN[k])} />
              </div>
            </div>
            {flestFast && flestFast.antal > 0 && (
              <p className="ud-pointe">
                Flest går i stå <b>før trin {flestFast.trin} – {TRIN[flestFast.trin - 1].navn.toLowerCase()}</b>
                {" "}({flestFast.antal} områder på tværs af holdet). Det er der, næste lektion har mest at hente.
              </p>
            )}
          </div>

          <div className="ud-kort">
            <h3>Udfordringer, der går igen <span>mindst 2 studerende – ét tilfælde er ikke et mønster</span></h3>
            {s.temaer.length ? (
              <ul className="ud-temaer">
                {s.temaer.map((t) => (
                  <li key={t.id}>
                    <div className="tt"><b>{t.navn}</b><span>{t.studerende} af {s.antal} studerende</span></div>
                    <div className="bar"><i style={{ width: `${(t.studerende / s.antal) * 100}%` }} /></div>
                    <p>{t.handling}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="ud-sub">Ingen mønstre endnu. De dukker op, når flere har fået feedback.</p>}
            <p className="ud-fodnote">Temaerne er Claudes vurdering af den seneste feedback pr. område og er et fingerpeg, ikke en måling.</p>
          </div>

          <div className="ud-kort">
            <div className="ud-tabeltop">
              <h3>Studerende</h3>
              <div className="ud-knapper">
                <label className="ud-sub">Sortér{" "}
                  <select value={sortering} onChange={(e) => setSortering(e.target.value)}>
                    <option value="navn">navn</option>
                    <option value="sidst">sidst aktiv</option>
                    <option value="niveau">laveste niveau først</option>
                    <option value="temaer">flest udfordringer først</option>
                  </select>
                </label>
                <button className="ud-link" onClick={() => setVisKoder((v) => !v)}>{visKoder ? "Skjul koder" : "Vis koder"}</button>
              </div>
            </div>
            <div className="ud-tabelwrap">
              <table className="ud-tabel">
                <thead>
                  <tr>
                    <th>Navn</th><th>Sidst aktiv</th><th className="num">Dage</th><th className="num">Feedback</th>
                    {d.omraader.map((o) => <th key={o.id} className="c" title={o.navn}>{o.navn.split(" ")[0].slice(0, 7)}</th>)}
                    <th className="c">Trin 4</th><th>Udfordringer</th>{visKoder && <th>Kode</th>}<th />
                  </tr>
                </thead>
                <tbody>
                  {sorterede.map((st) => (
                    <tr key={st.id}>
                      <td><b>{st.navn}</b></td>
                      <td className={st.dageSidenSidst === null || st.dageSidenSidst >= 7 ? "advar" : ""}>{sidstTekst(st.dageSidenSidst)}</td>
                      <td className="num">{st.dageAktiv}</td>
                      <td className="num">{st.feedbackKald}</td>
                      {d.omraader.map((o) => <td key={o.id} className="c"><MiniTrappe niveau={st.omraader[o.id]?.niveau} paaVej={st.omraader[o.id]?.paaVej} /></td>)}
                      <td className="c"><Maerke niveau={st.t4} /></td>
                      <td className="ud-temacelle">{st.temaer.map((t) => <span key={t.id} title={temanavn[t.id]}>{temanavn[t.id] || t.id}{t.antal > 1 ? ` ×${t.antal}` : ""}</span>)}</td>
                      {visKoder && <td className="ud-kode">{st.kode}</td>}
                      <td className="ud-handlinger">
                        <button className="ud-link" onClick={() => nyKode(st)}>Ny kode</button>
                        <button className="ud-link fare" onClick={() => sletStuderende(st)}>Slet</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="ud-fodnote">Trappen pr. område viser, hvor mange trin nedefra der er nået i træk (bedste forsøg). En halv søjle betyder, at næste trin er delvist nået.</p>
          </div>
        </>
      )}

      <div className="ud-kort">
        <h3>Tilføj studerende</h3>
        <p className="ud-sub">Ét navn pr. linje. Fornavn og forbogstav er nok. Et studienummer forrest på linjen kastes væk – systemet gemmer ingen studienumre.</p>
        <textarea className="ud-ta" value={liste} onChange={(e) => setListe(e.target.value)} placeholder={"Anne J.\nBo H.\nCecilie M."} />
        <button className="ud-btn" onClick={tilfoej} disabled={!liste.trim()}>Opret og lav koder</button>
        {nye && (
          <div className="ud-nye">
            <b>{nye.oprettede.length} oprettet.</b>
            {nye.sprunget.length > 0 && <> Sprunget over (findes allerede): {nye.sprunget.map((x) => x.navn).join(", ")}.</>}
            {" "}Koderne står i tabellen under “Vis koder” og på kodelisten.
          </div>
        )}
      </div>

      <div className="ud-kort ud-farezone">
        <h3>Semesterslut</h3>
        {!visSlet ? (
          <button className="ud-link fare" onClick={() => setVisSlet(true)}>Slet holdet og alle data…</button>
        ) : (
          <>
            <p className="ud-sub">Sletter studerende, koder, trinvurderinger og aktivitetslog. Skriv holdets navn for at bekræfte.</p>
            <input className="ud-input" value={sletNavn} onChange={(e) => setSletNavn(e.target.value)} placeholder={d.hold.navn} />
            <button className="ud-btn fare" disabled={sletNavn !== d.hold.navn} onClick={sletHold}>Slet {d.hold.navn}</button>
          </>
        )}
      </div>

      {/* Kun den her kommer med, når siden udskrives. */}
      <div className="ud-kodeliste">
        <h2>{d.hold.navn} – adgangskoder</h2>
        <p>Gå til siden, og log ind med din kode. Koden er personlig.</p>
        <table>
          <tbody>{[...d.studerende].sort((a, b) => a.navn.localeCompare(b.navn, "da")).map((st) => (
            <tr key={st.id}><td>{st.navn}</td><td className="ud-kode">{st.kode}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Hold og login ---------- */
function HoldListe({ vaelg, noegle }) {
  const [hold, setHold] = useState(null);
  const [navn, setNavn] = useState("");
  const [fejl, setFejl] = useState("");
  useEffect(() => { api("GET", "/admin-api/hold").then((d) => setHold(d.hold)).catch((e) => setFejl(e.message)); }, [noegle]);

  async function opret() {
    try { const d = await api("POST", "/admin-api/hold", { navn }); setNavn(""); vaelg(d.hold.id); }
    catch (e) { setFejl(e.message); }
  }

  return (
    <div>
      <div className="ud-kort">
        <h3>Opret hold</h3>
        <div className="ud-raekke">
          <input className="ud-input" value={navn} onChange={(e) => setNavn(e.target.value)} placeholder="Fx MØK 2026 efterår" onKeyDown={(e) => e.key === "Enter" && navn.trim() && opret()} />
          <button className="ud-btn" onClick={opret} disabled={!navn.trim()}>Opret</button>
        </div>
      </div>
      {fejl && <div className="ud-fejl">{fejl}</div>}
      {hold === null ? <p className="ud-sub">Henter…</p> : hold.length === 0 ? <p className="ud-sub">Du har ingen hold endnu.</p> : (
        <div className="ud-holdliste">
          {hold.map((h) => (
            <button key={h.id} className="ud-holdkort" onClick={() => vaelg(h.id)}>
              <b>{h.navn}</b>
              <span>{h.antalStuderende} studerende · {h.antalLoggetInd} har logget ind</span>
              <span>Oprettet {dansk(h.oprettet)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Underviser() {
  const [mig, setMig] = useState(undefined);
  const [kode, setKode] = useState("");
  const [fejl, setFejl] = useState("");
  // Holdets id står i adressen, så en genindlæsning bliver på holdet.
  const [holdId, setHoldId] = useState(() => new URLSearchParams(location.search).get("hold"));
  const [noegle, setNoegle] = useState(0);

  useEffect(() => { api("GET", "/admin-api/mig").then(setMig).catch(() => setMig(null)); }, []);
  useEffect(() => {
    const url = holdId ? `?hold=${encodeURIComponent(holdId)}` : location.pathname;
    history.replaceState(null, "", url);
  }, [holdId]);

  async function logInd(e) {
    e.preventDefault(); setFejl("");
    try { await api("POST", "/admin-api/login", { kode }); setMig(await api("GET", "/admin-api/mig")); setKode(""); }
    catch (err) { setFejl(err.message); }
  }
  async function logUd() { await api("POST", "/admin-api/logud").catch(() => {}); setMig(null); setHoldId(null); }

  return (
    <div className="ud-rod">
      <Stil />
      <div className="ud-wrap">
        <header className="ud-top">
          <div>
            <p className="ud-eyebrow">Regnskabsanalyse · underviser</p>
            <h1>Overblik</h1>
          </div>
          {mig && <span className="ud-sub">{mig.navn} · <button className="ud-link" onClick={logUd}>Log ud</button></span>}
        </header>
        {mig === undefined && <p className="ud-sub">Henter…</p>}
        {mig === null && (
          <form className="ud-kort ud-login" onSubmit={logInd}>
            <h3>Log ind som underviser</h3>
            <input className="ud-input" type="password" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Underviserkode" autoFocus />
            <button className="ud-btn" type="submit">Log ind</button>
            {fejl && <div className="ud-fejl">{fejl}</div>}
          </form>
        )}
        {mig && (holdId
          ? <HoldSide holdId={holdId} tilbage={() => setHoldId(null)} opdateret={() => setNoegle((n) => n + 1)} />
          : <HoldListe vaelg={setHoldId} noegle={noegle} />)}
      </div>
    </div>
  );
}

const Stil = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');
    .ud-rod { --cream: #F7F4EE; --neutral: #EDE8DE; --navy: #1C2B3A; --slate: #2D4257; --muted: #5A6B7C;
      --burgundy: #6B2737; --gold: #8B6914; --ok: #3B6D11; --ok-bg: #EAF3DE; --err: #993C1D; --err-bg: #FAECE7;
      --line: rgba(28,43,58,0.14); font-family: 'Hanken Grotesk', sans-serif; color: var(--navy); background: var(--cream); min-height: 100vh; }
    .ud-rod *, .ud-rod *::before, .ud-rod *::after { box-sizing: border-box; }
    body { margin: 0; background: #F7F4EE; }
    .ud-wrap { max-width: 1180px; margin: 0 auto; padding: 26px 16px 80px; }
    .ud-top { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
    .ud-top h1 { font-family: 'Fraunces', serif; font-weight: 800; font-size: clamp(30px, 5vw, 44px); margin: 4px 0 0; }
    .ud-eyebrow { font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: var(--slate); font-weight: 600; margin: 0; }
    .ud-sub { color: var(--slate); font-size: 14px; line-height: 1.55; }
    .ud-fodnote { color: var(--muted); font-size: 12px; font-style: italic; margin: 12px 0 0; line-height: 1.5; }
    .ud-kort { background: #fff; border: 1.5px solid var(--line); border-top: 3px solid var(--burgundy); border-radius: 10px; padding: 18px 20px; margin-bottom: 16px; }
    .ud-kort h3 { font-family: 'Fraunces', serif; font-size: 19px; margin: 0 0 12px; display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; }
    .ud-kort h3 span { font-family: 'Hanken Grotesk', sans-serif; font-size: 12.5px; font-weight: 500; color: var(--muted); }
    .ud-btn { border: none; background: var(--navy); color: var(--cream); border-radius: 8px; padding: 10px 18px; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit; text-decoration: none; display: inline-block; }
    .ud-btn:disabled { opacity: .5; cursor: default; }
    .ud-btn.sec { background: #fff; color: var(--navy); border: 1.5px solid var(--navy); }
    .ud-btn.fare { background: var(--err); }
    .ud-link { background: none; border: none; color: var(--burgundy); font-weight: 700; cursor: pointer; font-size: 13px; padding: 0; text-decoration: underline; font-family: inherit; }
    .ud-link.fare { color: var(--err); }
    .ud-input, .ud-ta, .ud-rod select { border: 1.5px solid var(--line); border-radius: 8px; background: #fff; padding: 9px 12px; font-family: inherit; font-size: 14.5px; color: var(--navy); }
    .ud-rod select { padding: 5px 8px; font-size: 13px; }
    .ud-ta { width: 100%; min-height: 110px; margin: 8px 0 10px; resize: vertical; }
    .ud-raekke { display: flex; gap: 10px; flex-wrap: wrap; } .ud-raekke .ud-input { flex: 1 1 240px; }
    .ud-login { max-width: 420px; display: flex; flex-direction: column; gap: 10px; }
    .ud-fejl { color: var(--err); font-weight: 600; font-size: 14px; margin: 8px 0; }
    .ud-holdliste { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
    .ud-holdkort { text-align: left; background: #fff; border: 1.5px solid var(--line); border-radius: 10px; padding: 16px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; font-family: inherit; color: var(--navy); }
    .ud-holdkort:hover { border-color: var(--navy); }
    .ud-holdkort b { font-family: 'Fraunces', serif; font-size: 18px; }
    .ud-holdkort span { font-size: 13px; color: var(--slate); }
    .ud-holdtop { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin: 8px 0 16px; }
    .ud-holdtop h2 { font-family: 'Fraunces', serif; font-size: 28px; margin: 0; }
    .ud-knapper { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .ud-tallinje { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .ud-tal { background: #fff; border: 1.5px solid var(--line); border-radius: 10px; padding: 14px 16px; }
    .ud-tal .v { font-family: 'Fraunces', serif; font-size: 34px; font-weight: 800; line-height: 1; }
    .ud-tal .t { font-size: 13px; color: var(--slate); margin-top: 6px; font-weight: 600; }
    .ud-tal .n { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .ud-to { display: grid; gap: 16px; grid-template-columns: 1fr; margin-bottom: 16px; }
    @media (min-width: 900px) { .ud-to { grid-template-columns: 3fr 2fr; } }
    .ud-to .ud-kort { margin-bottom: 0; }
    .ud-akt { display: flex; gap: 8px; height: 130px; }
    .ud-akt-y { display: flex; flex-direction: column; justify-content: space-between; font-size: 11px; color: var(--muted); font-family: 'Spline Sans Mono', monospace; }
    .ud-akt-soejler { flex: 1; display: flex; align-items: flex-end; gap: 2px; border-bottom: 1px solid var(--line); background: repeating-linear-gradient(to top, transparent 0 calc(50% - 1px), rgba(28,43,58,.06) calc(50% - 1px) 50%); }
    .ud-akt-soejler .kol { flex: 1; height: 100%; display: flex; align-items: flex-end; cursor: default; }
    .ud-akt-soejler .kol:hover .bar { background: var(--burgundy); }
    .ud-akt-soejler .bar { width: 100%; background: var(--navy); border-radius: 4px 4px 0 0; min-height: 0; }
    .ud-akt-x { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin: 4px 0 0 22px; }
    .ud-fatliste { list-style: none; margin: 0; padding: 0; max-height: 170px; overflow: auto; }
    .ud-fatliste li { display: flex; gap: 8px; align-items: baseline; font-size: 13.5px; padding: 5px 0; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
    .ud-fatliste li span:last-child { color: var(--slate); }
    .ud-grund { font-size: 10.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; }
    .ud-grund.aldrig { background: var(--err-bg); color: var(--err); }
    .ud-grund.inaktiv { background: #FBF3DC; color: var(--gold); }
    .ud-grund.fast { background: var(--neutral); color: var(--navy); }
    .ud-forklaring { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12.5px; color: var(--slate); margin-bottom: 12px; }
    .ud-forklaring i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
    .ud-stabler { display: grid; gap: 10px; }
    .ud-stabelraekke { display: grid; grid-template-columns: 1fr; gap: 4px; }
    @media (min-width: 700px) { .ud-stabelraekke { grid-template-columns: 260px 1fr; align-items: center; gap: 14px; } }
    .ud-stabelraekke .navn { font-weight: 600; font-size: 14px; display: flex; flex-direction: column; }
    .ud-stabelraekke .navn span { font-weight: 400; font-size: 12px; color: var(--muted); }
    .ud-stabelraekke.t4 { border-top: 1px dashed var(--line); padding-top: 10px; }
    .ud-stabel { display: flex; gap: 2px; height: 26px; }
    .ud-stabel.tom { font-size: 12.5px; color: var(--muted); font-style: italic; align-items: center; }
    .ud-stabel .seg { display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; font-family: 'Spline Sans Mono', monospace; min-width: 4px; }
    .ud-stabel .seg:first-child { border-radius: 4px 0 0 4px; } .ud-stabel .seg:last-child { border-radius: 0 4px 4px 0; }
    .ud-stabel .seg:only-child { border-radius: 4px; }
    .ud-stabel .seg:hover { outline: 2px solid var(--burgundy); outline-offset: 1px; }
    .ud-pointe { margin: 14px 0 0; font-size: 14px; background: var(--neutral); border-left: 4px solid var(--gold); padding: 10px 14px; border-radius: 0 8px 8px 0; }
    .ud-temaer { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
    .ud-temaer .tt { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 14px; }
    .ud-temaer .tt span { color: var(--slate); font-size: 13px; }
    .ud-temaer .bar { height: 8px; background: var(--neutral); border-radius: 4px; margin: 5px 0 4px; }
    .ud-temaer .bar i { display: block; height: 100%; background: var(--burgundy); border-radius: 4px; }
    .ud-temaer p { margin: 0; font-size: 13px; color: var(--slate); font-style: italic; }
    .ud-tabeltop { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .ud-tabeltop h3 { margin: 0; }
    .ud-tabelwrap { overflow-x: auto; margin-top: 10px; }
    .ud-tabel { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .ud-tabel th { text-align: left; font-size: 11px; letter-spacing: .05em; text-transform: uppercase; color: var(--slate); padding: 8px 8px; border-bottom: 1.5px solid var(--line); white-space: nowrap; }
    .ud-tabel td { padding: 8px; border-bottom: 1px solid var(--line); vertical-align: middle; }
    .ud-tabel .num { text-align: right; font-family: 'Spline Sans Mono', monospace; }
    .ud-tabel .c { text-align: center; }
    .ud-tabel td.advar { color: var(--err); font-weight: 600; }
    .ud-tabel tbody tr:hover { background: #FBFAF7; }
    .ud-tom { color: var(--muted); }
    .ud-mini { display: inline-flex; align-items: flex-end; gap: 2px; }
    .ud-mini i { width: 7px; border-radius: 2px; background: #E3E8EE; }
    .ud-mini i.fuld { background: var(--navy); }
    .ud-mini i.halv { background: #8DA2B9; }
    .ud-maerke { font-size: 10.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; padding: 3px 7px; border-radius: 4px; white-space: nowrap; }
    .ud-maerke.naaet { background: var(--ok-bg); color: var(--ok); }
    .ud-maerke.delvist { background: #FBF3DC; color: var(--gold); }
    .ud-maerke.mangler { background: var(--err-bg); color: var(--err); }
    .ud-temacelle { min-width: 180px; }
    .ud-temacelle span { display: inline-block; font-size: 11.5px; background: var(--neutral); border-radius: 4px; padding: 2px 6px; margin: 1px 3px 1px 0; }
    .ud-kode { font-family: 'Spline Sans Mono', monospace; letter-spacing: .04em; white-space: nowrap; }
    .ud-handlinger { white-space: nowrap; } .ud-handlinger .ud-link { margin-left: 10px; }
    .ud-nye { margin-top: 12px; font-size: 14px; background: var(--ok-bg); color: var(--ok); padding: 10px 14px; border-radius: 8px; }
    .ud-farezone { border-top-color: var(--err); }
    .ud-farezone .ud-input { margin: 6px 10px 6px 0; }
    .ud-tip { position: fixed; z-index: 10; pointer-events: none; background: var(--navy); color: var(--cream); font-size: 12.5px; line-height: 1.45; padding: 8px 10px; border-radius: 6px; max-width: 220px; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
    .ud-kodeliste { display: none; }
    @media print {
      .ud-rod { background: #fff; }
      .ud-wrap > *:not(div), .ud-wrap > div > *:not(.ud-kodeliste) { display: none !important; }
      .ud-kodeliste { display: block !important; }
      .ud-kodeliste h2 { font-family: 'Fraunces', serif; }
      .ud-kodeliste table { border-collapse: collapse; width: 100%; font-size: 13pt; }
      .ud-kodeliste td { border-bottom: 1px solid #ccc; padding: 8pt 6pt; }
    }
  `}</style>
);
