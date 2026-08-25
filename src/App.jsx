import React, { useState, useMemo } from "react";

/*
  Regnskabsanalyse – interaktivt læringsværktøj
  Markedsføringsøkonom (AK), Forløb 3: Værdiskabelse i praksis
  Design følger Erhvervsakademi Danias Design Guide (Navy/Burgundy/Gold/Cream).
  Nøgletal/definitioner følger lærebogens Bilag 2 (28 nøgletal, 5 analyseområder).
  Analyseopgaven har 3 faste cases (let/mellem/svær) + AI-genereret 'nyt sæt'.
*/

const ACCENT = "#6B2737";

const GRUPPER = {
  rentabilitet: { navn: "Rentabilitetsanalyse", farve: ACCENT,
    kort: "Forrenter virksomheden den investerede kapital?",
    formaal: "Måler afkastet i forhold til den bundne kapital – samlet (afkastningsgrad), for ejerne (egenkapitalens forrentning) og effekten af at låne (gearing)." },
  indtjeningsevne: { navn: "Indtjeningsevne", farve: ACCENT,
    kort: "Hvor god er virksomheden til at tjene penge på omsætningen?",
    formaal: "Måler forholdet mellem indtægter og omkostninger – hvor meget af hver omsætningskrone der er tilbage, og hvor robust indtjeningen er over for fald i omsætningen." },
  kapital: { navn: "Kapitaltilpasning og pengestrømme", farve: ACCENT,
    kort: "Er kapitalen tilpasset aktiviteten, og skaber driften penge?",
    formaal: "Måler hvor effektivt aktiverne (anlæg, lager, debitorer) skaber omsætning, og hvor godt driften omsættes til faktiske pengestrømme." },
  soliditet: { navn: "Soliditet og likviditet", farve: ACCENT,
    kort: "Hvor finansielt robust er virksomheden?",
    formaal: "Soliditeten viser bufferen mod tab. Likviditeten viser evnen til at betale den gæld, der forfalder på kort sigt." },
  boers: { navn: "Børsrelaterede nøgletal", farve: ACCENT,
    kort: "Hvordan vurderer markedet aktien?",
    formaal: "Sætter indtjening og egenkapital pr. aktie i forhold til børskursen – altså investorernes vurdering af virksomhedens fremtidige værdi." },
};
const GRUPPE_NOEGLER = Object.keys(GRUPPER);

const NOEGLETAL = [
  { id: "ag", navn: "Afkastningsgrad", kort: "AG", gruppe: "rentabilitet",
    formel: "Resultat af primær drift × 100 / Gennemsnitlig balancesum",
    beskrivelse: "Virksomhedens evne til at forrente den samlede investerede kapital. Gennemsnitlig balancesum = gennemsnitlige aktiver.",
    note: "Kan dekomponeres: AG = Overskudsgrad × Aktivernes omsætningshastighed." },
  { id: "og", navn: "Overskudsgrad", kort: "OG", gruppe: "rentabilitet",
    formel: "Resultat af primær drift × 100 / Omsætning",
    beskrivelse: "Det aktuelle indtægts-/omkostningsforhold – virksomhedens evne til at tjene penge på omsætningen." },
  { id: "aoh", navn: "Aktivernes omsætningshastighed", kort: "AOH", gruppe: "rentabilitet",
    formel: "Omsætning / Gennemsnitlig balancesum",
    beskrivelse: "Virksomhedens evne til at tilpasse kapitalens størrelse til den aktivitet, der er i virksomheden." },
  { id: "ekf", navn: "Egenkapitalens forrentning", kort: "EKF", gruppe: "rentabilitet",
    formel: "Årets resultat × 100 / Gennemsnitlig egenkapital",
    beskrivelse: "Virksomhedens evne til at forrente den kapital, ejerne har indskudt.",
    note: "Kan også beregnes før skat (årets resultat før skat i tælleren)." },
  { id: "fkf", navn: "Fremmedkapitalens forrentning", gruppe: "rentabilitet",
    formel: "Renteomkostninger netto × 100 / Gennemsnitlig fremmedkapital",
    beskrivelse: "Virksomhedens gennemsnitlige lånerente af fremmedkapital (gæld)." },
  { id: "gearing", navn: "Finansiel gearing", gruppe: "rentabilitet",
    formel: "Gennemsnitlig fremmedkapital / Gennemsnitlig egenkapital",
    beskrivelse: "Hvor mange kroner fremmedkapital (gældsforpligtelser) der er pr. krone egenkapital." },

  { id: "bruttomargin", navn: "Bruttomargin / Bruttoavanceprocent", kort: "Bruttomargin", gruppe: "indtjeningsevne",
    formel: "Bruttoresultat × 100 / Omsætning",
    beskrivelse: "Hvor mange procent af omsætningen der er tilbage til at dække kapacitetsomkostninger, renter, skat og overskud.",
    note: "Bruttomargin og bruttofortjeneste bruges synonymt (bruttoavanceprocent = bruttofortjeneste × 100 / omsætning)." },
  { id: "indekstal", navn: "Indekstal", gruppe: "indtjeningsevne",
    formel: "Årets tal × 100 / Basisårets tal",
    beskrivelse: "Supplerer analysen med tallenes udviklingsretning og -hastighed over tid." },
  { id: "driftsgearing", navn: "Driftsmæssig gearing", gruppe: "indtjeningsevne",
    formel: "Kapacitetsomkostninger × 100 / Samlede driftsomkostninger",
    beskrivelse: "Kapacitetsomkostningernes andel af de samlede driftsomkostninger." },
  { id: "kapacitetsgrad", navn: "Kapacitetsgrad", gruppe: "indtjeningsevne",
    formel: "Bruttoresultat / Kapacitetsomkostninger",
    beskrivelse: "Hvor meget hver afholdt krone kapacitetsomkostning giver i bruttoresultat – altså 'overdækningen' på kapacitetsomkostningerne." },
  { id: "nulpunkt", navn: "Nulpunktsomsætning", gruppe: "indtjeningsevne",
    formel: "Kapacitetsomkostninger × 100 / Bruttomargin",
    beskrivelse: "Den omsætning, hvor bruttoresultatet netop kan dække kapacitetsomkostningerne (inkl. afskrivninger) – hverken over- eller underskud." },
  { id: "sikkerhedsmargin", navn: "Sikkerhedsmargin", gruppe: "indtjeningsevne",
    formel: "(Faktisk omsætning − Nulpunktsomsætning) × 100 / Faktisk omsætning",
    beskrivelse: "Hvor mange procent omsætningen kan falde, før man rammer nulpunktsomsætningen." },

  { id: "anlaeg-oh", navn: "Anlægsaktivernes omsætningshastighed", gruppe: "kapital",
    formel: "Omsætning / Samlede anlægsaktiver ultimo",
    beskrivelse: "Hvor god virksomheden er til at skabe omsætning i forhold til de indsatte anlægsaktiver." },
  { id: "immat-oh", navn: "Immaterielle anlægsaktivers omsætningshastighed", gruppe: "kapital",
    formel: "Omsætning / Immaterielle anlægsaktiver ultimo",
    beskrivelse: "Evnen til at skabe omsætning i forhold til de immaterielle anlægsaktiver." },
  { id: "mat-oh", navn: "Materielle omsætningshastighed", gruppe: "kapital",
    formel: "Omsætning / Materielle anlægsaktiver ultimo",
    beskrivelse: "Evnen til at skabe omsætning i forhold til de materielle anlægsaktiver." },
  { id: "lager-oh", navn: "Varelagerets omsætningshastighed", gruppe: "kapital",
    formel: "Vareforbrug / Varelagre ultimo",
    beskrivelse: "Hvor mange gange varelageret i gennemsnit omsættes. Ved funktionsopdelt resultatopgørelse anvendes produktionsomkostninger." },
  { id: "debitor-oh", navn: "Varedebitorernes omsætningshastighed", gruppe: "kapital",
    formel: "Omsætning / Varedebitorer ultimo",
    beskrivelse: "Hvor mange gange varedebitorerne i gennemsnit 'udskiftes' pr. år." },
  { id: "kreditor-oh", navn: "Varekreditorernes omsætningshastighed", gruppe: "kapital",
    formel: "Varekøb / Leverandørgæld ultimo",
    beskrivelse: "Virksomhedens evne til at skaffe kredit hos leverandører.",
    note: "Varekøb = Vareforbrug + (Lager ultimo − Lager primo). Kendes vareforbrug ikke, kan produktionsomkostninger anvendes." },
  { id: "pengestrom", navn: "Pengestrøm fra primær drift / omsætning", gruppe: "kapital",
    formel: "Pengestrøm fra primær drift / Omsætning",
    beskrivelse: "Hvor god virksomheden er til at skabe pengestrømme ud fra omsætningen." },

  { id: "soliditetsgrad", navn: "Soliditetsgrad", gruppe: "soliditet",
    formel: "Egenkapital ultimo × 100 / Aktiver i alt ultimo",
    beskrivelse: "Hvor mange procent af aktiverne der kan gå tabt, før kreditorerne lider tab." },
  { id: "anlaegsgrad", navn: "Anlægsgrad", gruppe: "soliditet",
    formel: "Anlægsaktiver ultimo × 100 / Samlede aktiver ultimo",
    beskrivelse: "Hvor stor en del af de samlede aktiver der er anlægsaktiver." },
  { id: "kapitalbinding", navn: "Kapitalbindingsgrad", gruppe: "soliditet",
    formel: "Anlægsaktiver ultimo / (Egenkapital ultimo + Langfristede forpligtelser ultimo)",
    beskrivelse: "Hvor stor en del anlægsaktiverne udgør af den langfristede kapital." },
  { id: "likv1", navn: "Likviditetsgrad I", gruppe: "soliditet",
    formel: "Omsætningsaktiver ekskl. varelager ultimo × 100 / Kortfristet gæld ultimo",
    beskrivelse: "Om virksomheden kan betale den gæld, der forfalder inden for et år. Skal helst være 100 eller derover.",
    note: "Bemærk: Likviditetsgrad I er her EKSKL. varelager (den strenge test)." },
  { id: "likv2", navn: "Likviditetsgrad II", gruppe: "soliditet",
    formel: "Omsætningsaktiver ultimo × 100 / Kortfristet gæld ultimo",
    beskrivelse: "Som likviditetsgrad I, men hele omsætningsformuen indgår i tælleren – altså også varelageret." },

  { id: "eps", navn: "Resultat pr. aktie", kort: "EPS", gruppe: "boers",
    formel: "Årets resultat / Antal stk. aktier",
    beskrivelse: "Hvor meget overskud der er til hver enkelt aktie i virksomheden." },
  { id: "pe", navn: "P/E-værdien", kort: "P/E", gruppe: "boers",
    formel: "Børskurs / Resultat pr. aktie",
    beskrivelse: "Hvor meget en investor betaler for 1 kr. resultat." },
  { id: "indrevaerdi", navn: "Indre værdi pr. aktie", gruppe: "boers",
    formel: "Egenkapital / Antal aktier",
    beskrivelse: "Hvor meget egenkapital der er knyttet til 1 stk. aktie." },
  { id: "ki", navn: "Kurs/Indre værdi", kort: "K/I", gruppe: "boers",
    formel: "Børskurs / Indre værdi",
    beskrivelse: "Hvor meget man skal betale for 1 kr. egenkapital.",
    note: "P/E og Kurs/Indre værdi viser tilsammen investorernes vurdering af virksomhedens fremtidige værdi." },
];

const CASES = [
  {
    id: "let", navn: "Klar Webshop ApS", niveau: "Let", branche: "E-handel (B2C)",
    beskrivelse: "En lille, veldrevet webshop i fremgang. Tallene viser en tydelig og entydig udvikling — god til at træne den grundlæggende argumentation.",
    ledelsesberetning: `Regnskabsåret 2025 blev endnu et godt år for Klar Webshop ApS. Nettoomsætningen steg fra 12,0 til 15,0 mio. kr., svarende til en vækst på 25 %. Væksten er drevet af et udvidet sortiment og en målrettet investering i online markedsføring, der har øget både besøgstal og konverteringsrate.

Bruttomarginen steg fra 40 % til 42 % som følge af bedre indkøbsaftaler med vores leverandører og en gunstig produktsammensætning. Sammen med en disciplineret styring af kapacitetsomkostningerne løftede det resultatet af primær drift med 50 % til 2,7 mio. kr.

Selskabets likviditet og soliditet er fortsat meget stærk, og den rentebærende gæld er nedbragt i løbet af året. Ledelsen ser positivt på det kommende år og forventer fortsat lønsom vækst.`,
    regnskab: {
      resultat: [
        ["Nettoomsætning", "12.000", "15.000"],
        ["Vareforbrug", "7.200", "8.700"],
        ["Bruttoresultat", "4.800", "6.300"],
        ["Kapacitetsomkostninger", "3.000", "3.600"],
        ["Resultat af primær drift", "1.800", "2.700"],
        ["Renteomkostninger, netto", "150", "120"],
        ["Resultat før skat", "1.650", "2.580"],
        ["Skat (22 %)", "363", "568"],
        ["Årets resultat", "1.287", "2.012"]
      ],
      aktiver: [
        ["Immaterielle anlægsaktiver", "200", "300"],
        ["Materielle anlægsaktiver", "2.100", "2.200"],
        ["Anlægsaktiver i alt", "2.300", "2.500"],
        ["Varelager", "1.100", "1.200"],
        ["Varedebitorer", "1.300", "1.400"],
        ["Likvide beholdninger", "2.300", "3.900"],
        ["Omsætningsaktiver i alt", "4.700", "6.500"],
        ["Aktiver i alt", "7.000", "9.000"]
      ],
      passiver: [
        ["Egenkapital", "4.500", "6.000"],
        ["Langfristede forpligtelser", "1.100", "1.300"],
        ["Kortfristet gæld", "1.400", "1.700"],
        ["– heraf leverandørgæld", "700", "900"],
        ["Passiver i alt", "7.000", "9.000"]
      ],
      supplerende: [
        ["Gennemsnitlig balancesum", "6.500", "8.000"],
        ["Gennemsnitlig egenkapital", "4.050", "5.250"],
        ["Gennemsnitlig fremmedkapital", "2.450", "2.750"],
        ["Varekøb", "7.300", "8.800"],
        ["Pengestrøm fra primær drift", "1.500", "2.600"],
        ["Antal aktier (stk.)", "200.000", "200.000"],
        ["Børskurs ultimo (kr.)", "30", "45"]
      ]
    },
    analyse: {
    rentabilitet: { noegletal: [
      { n: "Afkastningsgrad", a: "27,7 %", b: "33,8 %", udv: "↑ 6,1 pct.point" },
      { n: "Overskudsgrad", a: "15,0 %", b: "18,0 %", udv: "↑ 3,0 pct.point" },
      { n: "Aktivernes omsætningshastighed", a: "1,85", b: "1,88", udv: "≈ uændret" },
      { n: "Egenkapitalens forrentning", a: "31,8 %", b: "38,3 %", udv: "↑ 6,6 pct.point" },
      { n: "Fremmedkapitalens forrentning", a: "6,1 %", b: "4,4 %", udv: "↓ 1,8 pct.point" },
      { n: "Finansiel gearing", a: "0,60", b: "0,52", udv: "↓ faldende" }
    ] },
    indtjeningsevne: { noegletal: [
      { n: "Bruttomargin", a: "40,0 %", b: "42,0 %", udv: "↑ 2,0 pct.point" },
      { n: "Indekstal – omsætning (2024=100)", a: "100", b: "125,0", udv: "↑ vækst" },
      { n: "Indekstal – primært resultat (2024=100)", a: "100", b: "150,0", udv: "↑ vækst" },
      { n: "Driftsmæssig gearing", a: "29,4 %", b: "29,3 %", udv: "≈ uændret" },
      { n: "Kapacitetsgrad", a: "1,60", b: "1,75", udv: "↑ stigende" },
      { n: "Nulpunktsomsætning (1.000 kr.)", a: "7.500", b: "8.571", udv: "↑ stiger" },
      { n: "Sikkerhedsmargin", a: "37,5 %", b: "42,9 %", udv: "↑ 5,4 pct.point" }
    ] },
    kapital: { noegletal: [
      { n: "Anlægsaktivernes omsætningshastighed", a: "5,22", b: "6,00", udv: "↑ stigende" },
      { n: "Immaterielle anlægsaktivers oms.hastighed", a: "60,00", b: "50,00", udv: "↓ faldende" },
      { n: "Materielle omsætningshastighed", a: "5,71", b: "6,82", udv: "↑ stigende" },
      { n: "Varelagerets omsætningshastighed", a: "6,5 (56 dage)", b: "7,2 (50 dage)", udv: "↑ hurtigere" },
      { n: "Varedebitorernes oms.hastighed", a: "9,2 (40 dage)", b: "10,7 (34 dage)", udv: "↑ hurtigere" },
      { n: "Varekreditorernes oms.hastighed", a: "10,4 (35 dage)", b: "9,8 (37 dage)", udv: "↓ langsommere" },
      { n: "Pengestrøm fra primær drift / omsætning", a: "12,5 %", b: "17,3 %", udv: "↑ 4,8 pct.point" }
    ] },
    soliditet: { noegletal: [
      { n: "Soliditetsgrad", a: "64,3 %", b: "66,7 %", udv: "↑ 2,4 pct.point" },
      { n: "Anlægsgrad", a: "32,9 %", b: "27,8 %", udv: "↓ 5,1 pct.point" },
      { n: "Kapitalbindingsgrad", a: "0,41", b: "0,34", udv: "↓ faldende" },
      { n: "Likviditetsgrad I (ekskl. varelager)", a: "257,1 %", b: "311,8 %", udv: "↑ 54,6 pct.point" },
      { n: "Likviditetsgrad II (inkl. varelager)", a: "335,7 %", b: "382,4 %", udv: "↑ 46,6 pct.point" }
    ] },
    boers: { noegletal: [
      { n: "Resultat pr. aktie", a: "6,43 kr.", b: "10,06 kr.", udv: "↑ stigende" },
      { n: "P/E-værdien", a: "4,7", b: "4,5", udv: "↓ faldende" },
      { n: "Indre værdi pr. aktie", a: "22,50 kr.", b: "30,00 kr.", udv: "↑ stigende" },
      { n: "Kurs/Indre værdi", a: "1,33", b: "1,50", udv: "↑ stigende" }
    ] }
    }
  },
  {
    id: "mellem", navn: "Fjordby Møbler A/S", niveau: "Mellem", branche: "Møbeldesign (B2B + B2C)",
    beskrivelse: "En SMV i vækst, men med pres på lønsomhed og likviditet. Signalerne peger ikke alle samme vej — der skal vejes og nuanceres.",
    ledelsesberetning: `2025 var et år med solid vækst for Fjordby Møbler A/S. Nettoomsætningen steg 12,5 % til 54,0 mio. kr., båret af lanceringen af vores nye B2C-webshop og en udvidelse af showroomet, der har styrket mærket over for privatkunderne.

For at sikre leveringsevnen i en periode med lange leveringstider hos vores leverandører har vi bevidst opbygget varelageret. Årets indtjening er påvirket af stigende priser på træ og metal, som vi af konkurrencehensyn kun delvist har kunnet sende videre til kunderne. Vi betragter marginpresset som midlertidigt og forventer, at de igangsatte effektiviseringer i indkøb og produktion slår igennem i 2026.

Ledelsen er overordnet tilfreds med årets udvikling og fastholder en ambitiøs vækststrategi for de kommende år.`,
    regnskab: {
      resultat: [
        ["Nettoomsætning", "48.000", "54.000"],
        ["Vareforbrug", "28.800", "34.020"],
        ["Bruttoresultat", "19.200", "19.980"],
        ["Kapacitetsomkostninger", "14.400", "16.000"],
        ["Resultat af primær drift", "4.800", "3.980"],
        ["Renteomkostninger, netto", "800", "1.000"],
        ["Resultat før skat", "4.000", "2.980"],
        ["Skat (22 %)", "880", "656"],
        ["Årets resultat", "3.120", "2.324"]
      ],
      aktiver: [
        ["Immaterielle anlægsaktiver", "2.000", "2.400"],
        ["Materielle anlægsaktiver", "12.000", "13.500"],
        ["Anlægsaktiver i alt", "14.000", "15.900"],
        ["Varelager", "8.000", "11.000"],
        ["Varedebitorer", "6.000", "7.500"],
        ["Likvide beholdninger", "2.000", "1.100"],
        ["Omsætningsaktiver i alt", "16.000", "19.600"],
        ["Aktiver i alt", "30.000", "35.500"]
      ],
      passiver: [
        ["Egenkapital", "13.500", "15.000"],
        ["Langfristede forpligtelser", "8.000", "9.000"],
        ["Kortfristet gæld", "8.500", "11.500"],
        ["– heraf leverandørgæld", "4.000", "5.500"],
        ["Passiver i alt", "30.000", "35.500"]
      ],
      supplerende: [
        ["Gennemsnitlig balancesum", "28.500", "32.750"],
        ["Gennemsnitlig egenkapital", "12.750", "14.250"],
        ["Gennemsnitlig fremmedkapital", "15.750", "18.500"],
        ["Varekøb", "29.800", "37.020"],
        ["Pengestrøm fra primær drift", "5.200", "2.500"],
        ["Antal aktier (stk.)", "1.000.000", "1.000.000"],
        ["Børskurs ultimo (kr.)", "47", "42"]
      ]
    },
    analyse: {
    rentabilitet: { noegletal: [
      { n: "Afkastningsgrad", a: "16,8 %", b: "12,2 %", udv: "↓ 4,7 pct.point" },
      { n: "Overskudsgrad", a: "10,0 %", b: "7,4 %", udv: "↓ 2,6 pct.point" },
      { n: "Aktivernes omsætningshastighed", a: "1,68", b: "1,65", udv: "↓ faldende" },
      { n: "Egenkapitalens forrentning", a: "24,5 %", b: "16,3 %", udv: "↓ 8,2 pct.point" },
      { n: "Fremmedkapitalens forrentning", a: "5,1 %", b: "5,4 %", udv: "↑ 0,3 pct.point" },
      { n: "Finansiel gearing", a: "1,24", b: "1,30", udv: "↑ stigende" }
    ] },
    indtjeningsevne: { noegletal: [
      { n: "Bruttomargin", a: "40,0 %", b: "37,0 %", udv: "↓ 3,0 pct.point" },
      { n: "Indekstal – omsætning (2024=100)", a: "100", b: "112,5", udv: "↑ vækst" },
      { n: "Indekstal – primært resultat (2024=100)", a: "100", b: "82,9", udv: "↓ fald" },
      { n: "Driftsmæssig gearing", a: "33,3 %", b: "32,0 %", udv: "↓ 1,3 pct.point" },
      { n: "Kapacitetsgrad", a: "1,33", b: "1,25", udv: "↓ faldende" },
      { n: "Nulpunktsomsætning (1.000 kr.)", a: "36.000", b: "43.243", udv: "↑ stiger" },
      { n: "Sikkerhedsmargin", a: "25,0 %", b: "19,9 %", udv: "↓ 5,1 pct.point" }
    ] },
    kapital: { noegletal: [
      { n: "Anlægsaktivernes omsætningshastighed", a: "3,43", b: "3,40", udv: "≈ uændret" },
      { n: "Immaterielle anlægsaktivers oms.hastighed", a: "24,00", b: "22,50", udv: "↓ faldende" },
      { n: "Materielle omsætningshastighed", a: "4,00", b: "4,00", udv: "≈ uændret" },
      { n: "Varelagerets omsætningshastighed", a: "3,6 (101 dage)", b: "3,1 (118 dage)", udv: "↓ langsommere" },
      { n: "Varedebitorernes oms.hastighed", a: "8,0 (46 dage)", b: "7,2 (51 dage)", udv: "↓ langsommere" },
      { n: "Varekreditorernes oms.hastighed", a: "7,5 (49 dage)", b: "6,7 (54 dage)", udv: "↓ langsommere" },
      { n: "Pengestrøm fra primær drift / omsætning", a: "10,8 %", b: "4,6 %", udv: "↓ 6,2 pct.point" }
    ] },
    soliditet: { noegletal: [
      { n: "Soliditetsgrad", a: "45,0 %", b: "42,3 %", udv: "↓ 2,7 pct.point" },
      { n: "Anlægsgrad", a: "46,7 %", b: "44,8 %", udv: "↓ 1,9 pct.point" },
      { n: "Kapitalbindingsgrad", a: "0,65", b: "0,66", udv: "≈ uændret" },
      { n: "Likviditetsgrad I (ekskl. varelager)", a: "94,1 %", b: "74,8 %", udv: "↓ 19,3 pct.point" },
      { n: "Likviditetsgrad II (inkl. varelager)", a: "188,2 %", b: "170,4 %", udv: "↓ 17,8 pct.point" }
    ] },
    boers: { noegletal: [
      { n: "Resultat pr. aktie", a: "3,12 kr.", b: "2,32 kr.", udv: "↓ faldende" },
      { n: "P/E-værdien", a: "15,1", b: "18,1", udv: "↑ stigende" },
      { n: "Indre værdi pr. aktie", a: "13,50 kr.", b: "15,00 kr.", udv: "↑ stigende" },
      { n: "Kurs/Indre værdi", a: "3,48", b: "2,80", udv: "↓ faldende" }
    ] }
    }
  },
  {
    id: "svaer", navn: "NordVind Production A/S", niveau: "Svær", branche: "Industriel produktion (B2B)",
    beskrivelse: "En kapitaltung producent midt i en turnaround. Faldende omsætning, men stigende marginer — og modstridende signaler i gearing, soliditet og marked. Kræver en nuanceret vurdering.",
    ledelsesberetning: `2025 markerer det første år i den turnaround, bestyrelsen iværksatte i 2024. Vi har bevidst nedprioriteret lavmargin-ordrer og koncentreret produktionen om de mest rentable kundesegmenter. Det forklarer faldet i nettoomsætningen fra 60,0 til 52,0 mio. kr. — et fald, vi betragter som planlagt og sundt.

Strategien aflæses i indtjeningen: bruttomarginen er løftet fra 25 % til 28 %, og resultatet af primær drift er steget trods den lavere omsætning. Vi har samtidig nedbragt den langfristede gæld og styrket soliditeten, og afkastningsgraden overstiger nu igen selskabets gennemsnitlige låneomkostning.

Med en mere fokuseret forretning og en forbedret pengestrøm fra driften ser ledelsen frem til 2026 med fornyet tillid.`,
    regnskab: {
      resultat: [
        ["Nettoomsætning", "60.000", "52.000"],
        ["Vareforbrug", "45.000", "37.440"],
        ["Bruttoresultat", "15.000", "14.560"],
        ["Kapacitetsomkostninger", "12.000", "11.000"],
        ["Resultat af primær drift", "3.000", "3.560"],
        ["Renteomkostninger, netto", "2.400", "2.300"],
        ["Resultat før skat", "600", "1.260"],
        ["Skat (22 %)", "132", "277"],
        ["Årets resultat", "468", "983"]
      ],
      aktiver: [
        ["Immaterielle anlægsaktiver", "1.000", "1.000"],
        ["Materielle anlægsaktiver", "36.000", "34.000"],
        ["Anlægsaktiver i alt", "37.000", "35.000"],
        ["Varelager", "12.000", "9.000"],
        ["Varedebitorer", "9.500", "9.000"],
        ["Likvide beholdninger", "1.500", "3.000"],
        ["Omsætningsaktiver i alt", "23.000", "21.000"],
        ["Aktiver i alt", "60.000", "56.000"]
      ],
      passiver: [
        ["Egenkapital", "16.500", "17.000"],
        ["Langfristede forpligtelser", "28.000", "26.000"],
        ["Kortfristet gæld", "15.500", "13.000"],
        ["– heraf leverandørgæld", "8.000", "6.500"],
        ["Passiver i alt", "60.000", "56.000"]
      ],
      supplerende: [
        ["Gennemsnitlig balancesum", "62.000", "58.000"],
        ["Gennemsnitlig egenkapital", "16.250", "16.750"],
        ["Gennemsnitlig fremmedkapital", "45.750", "41.250"],
        ["Varekøb", "43.000", "34.440"],
        ["Pengestrøm fra primær drift", "4.000", "5.500"],
        ["Antal aktier (stk.)", "1.000.000", "1.000.000"],
        ["Børskurs ultimo (kr.)", "12", "14"]
      ]
    },
    analyse: {
    rentabilitet: { noegletal: [
      { n: "Afkastningsgrad", a: "4,8 %", b: "6,1 %", udv: "↑ 1,3 pct.point" },
      { n: "Overskudsgrad", a: "5,0 %", b: "6,8 %", udv: "↑ 1,8 pct.point" },
      { n: "Aktivernes omsætningshastighed", a: "0,97", b: "0,90", udv: "↓ faldende" },
      { n: "Egenkapitalens forrentning", a: "2,9 %", b: "5,9 %", udv: "↑ 3,0 pct.point" },
      { n: "Fremmedkapitalens forrentning", a: "5,2 %", b: "5,6 %", udv: "↑ 0,3 pct.point" },
      { n: "Finansiel gearing", a: "2,82", b: "2,46", udv: "↓ faldende" }
    ] },
    indtjeningsevne: { noegletal: [
      { n: "Bruttomargin", a: "25,0 %", b: "28,0 %", udv: "↑ 3,0 pct.point" },
      { n: "Indekstal – omsætning (2024=100)", a: "100", b: "86,7", udv: "↓ fald" },
      { n: "Indekstal – primært resultat (2024=100)", a: "100", b: "118,7", udv: "↑ vækst" },
      { n: "Driftsmæssig gearing", a: "21,1 %", b: "22,7 %", udv: "↑ 1,7 pct.point" },
      { n: "Kapacitetsgrad", a: "1,25", b: "1,32", udv: "↑ stigende" },
      { n: "Nulpunktsomsætning (1.000 kr.)", a: "48.000", b: "39.286", udv: "↓ falder" },
      { n: "Sikkerhedsmargin", a: "20,0 %", b: "24,5 %", udv: "↑ 4,5 pct.point" }
    ] },
    kapital: { noegletal: [
      { n: "Anlægsaktivernes omsætningshastighed", a: "1,62", b: "1,49", udv: "↓ faldende" },
      { n: "Immaterielle anlægsaktivers oms.hastighed", a: "60,00", b: "52,00", udv: "↓ faldende" },
      { n: "Materielle omsætningshastighed", a: "1,67", b: "1,53", udv: "↓ faldende" },
      { n: "Varelagerets omsætningshastighed", a: "3,8 (97 dage)", b: "4,2 (88 dage)", udv: "↑ hurtigere" },
      { n: "Varedebitorernes oms.hastighed", a: "6,3 (58 dage)", b: "5,8 (63 dage)", udv: "↓ langsommere" },
      { n: "Varekreditorernes oms.hastighed", a: "5,4 (68 dage)", b: "5,3 (69 dage)", udv: "≈ uændret" },
      { n: "Pengestrøm fra primær drift / omsætning", a: "6,7 %", b: "10,6 %", udv: "↑ 3,9 pct.point" }
    ] },
    soliditet: { noegletal: [
      { n: "Soliditetsgrad", a: "27,5 %", b: "30,4 %", udv: "↑ 2,9 pct.point" },
      { n: "Anlægsgrad", a: "61,7 %", b: "62,5 %", udv: "↑ 0,8 pct.point" },
      { n: "Kapitalbindingsgrad", a: "0,83", b: "0,81", udv: "↓ faldende" },
      { n: "Likviditetsgrad I (ekskl. varelager)", a: "71,0 %", b: "92,3 %", udv: "↑ 21,3 pct.point" },
      { n: "Likviditetsgrad II (inkl. varelager)", a: "148,4 %", b: "161,5 %", udv: "↑ 13,2 pct.point" }
    ] },
    boers: { noegletal: [
      { n: "Resultat pr. aktie", a: "0,47 kr.", b: "0,98 kr.", udv: "↑ stigende" },
      { n: "P/E-værdien", a: "25,6", b: "14,2", udv: "↓ faldende" },
      { n: "Indre værdi pr. aktie", a: "16,50 kr.", b: "17,00 kr.", udv: "↑ stigende" },
      { n: "Kurs/Indre værdi", a: "0,73", b: "0,82", udv: "↑ stigende" }
    ] }
    }
  },
];

const OMR_NOEGLETAL = {
  rentabilitet: ["Afkastningsgrad","Overskudsgrad","Aktivernes omsætningshastighed","Egenkapitalens forrentning","Fremmedkapitalens forrentning","Finansiel gearing"],
  indtjeningsevne: ["Bruttomargin","Indekstal – omsætning (2024=100)","Indekstal – primært resultat (2024=100)","Driftsmæssig gearing","Kapacitetsgrad","Nulpunktsomsætning (1.000 kr.)","Sikkerhedsmargin"],
  kapital: ["Anlægsaktivernes omsætningshastighed","Immaterielle anlægsaktivers oms.hastighed","Materielle omsætningshastighed","Varelagerets omsætningshastighed","Varedebitorernes oms.hastighed","Varekreditorernes oms.hastighed","Pengestrøm fra primær drift / omsætning"],
  soliditet: ["Soliditetsgrad","Anlægsgrad","Kapitalbindingsgrad","Likviditetsgrad I (ekskl. varelager)","Likviditetsgrad II (inkl. varelager)"],
  boers: ["Resultat pr. aktie","P/E-værdien","Indre værdi pr. aktie","Kurs/Indre værdi"],
};

const TIPS = {
  rentabilitet: [
    "Start med afkastningsgraden – sammenlign de to år og hold den op mod markedsrenten.",
    "Brug dekomponeringen AG = overskudsgrad × aktivernes omsætningshastighed til at forklare ÅRSAGEN til udviklingen.",
    "Forklar hvorfor egenkapitalens forrentning afviger fra afkastningsgraden ved hjælp af gearing og fremmedkapitalens forrentning (positiv gearing kræver AG > lånerente).",
    "Slut med en samlet vurdering: er rentabiliteten tilfredsstillende, og hvilken vej går det?",
  ],
  indtjeningsevne: [
    "Sammenhold omsætningens udvikling (indeks) med det primære resultats udvikling – vokser indtjeningen i takt med salget?",
    "Brug bruttomargin og kapacitetsgrad til at forklare, hvor presset eller styrken opstår.",
    "Forklar hvad sikkerhedsmargin og nulpunktsomsætning betyder for virksomhedens robusthed.",
    "Foreslå hvor der kan sættes ind: salgspriser, vareforbrug eller kapacitetsomkostninger.",
  ],
  kapital: [
    "Skel mellem anlægsaktiver og arbejdskapital (lager + debitorer) – hvor bindes eller frigøres kapitalen?",
    "Omregn gerne omsætningshastighederne til dage, så det bliver konkret.",
    "Kæd kapitalbindingen sammen med pengestrømmen fra driften.",
    "Kom med en konkret anbefaling til at frigøre bunden kapital.",
  ],
  soliditet: [
    "Hold soliditet (langt sigt) og likviditet (kort sigt) adskilt i din argumentation.",
    "Vurder likviditetsgrad I op mod tommelfingergrænsen på 100 %.",
    "Vær kritisk over for likviditetsgrad II – hvad gemmer den høje værdi på (varelageret)?",
    "Konkludér: er virksomheden robust, og hvad er det største risikopunkt?",
  ],
  boers: [
    "Forklar hvorfor resultat pr. aktie og indre værdi pr. aktie kan bevæge sig hver sin vej.",
    "Vær kritisk: en ændring i P/E er ikke nødvendigvis et godt/dårligt tegn – hvad skyldes den?",
    "Brug Kurs/Indre værdi til at vurdere markedets forventninger (over/under 1).",
    "Kæd nøgletallene sammen med virksomhedens faktiske indtjeningsudvikling.",
  ],
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* --------------------------- WORD-RAPPORT --------------------------- */

function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function par(t) {
  if (!t || !t.trim()) return '<p style="color:#8a8270;font-style:italic">(Ingen tekst endnu.)</p>';
  return t.trim().split(/\n{2,}/).map((b) => "<p>" + esc(b).replace(/\n/g, "<br>") + "</p>").join("");
}
function regnTabel(titel, rows) {
  const body = rows.map((r) => `<tr><td>${esc(r[0])}</td><td class="num">${esc(r[1])}</td><td class="num">${esc(r[2])}</td></tr>`).join("");
  return `<h3>${esc(titel)}</h3><table><tr><th>Post</th><th class="num">2024</th><th class="num">2025</th></tr>${body}</table>`;
}
function nogTabel(rows) {
  const body = rows.map((x) => `<tr><td>${esc(x.n)}</td><td class="num">${esc(x.a)}</td><td class="num">${esc(x.b)}</td><td>${esc(x.udv)}</td></tr>`).join("");
  return `<table><tr><th>Nøgletal</th><th class="num">2024</th><th class="num">2025</th><th>Udvikling</th></tr>${body}</table>`;
}
function buildReportHTML(c, svar, fb, model, meta) {
  meta = meta || {};
  const dato = new Date().toLocaleDateString("da-DK", { year: "numeric", month: "long", day: "numeric" });
  let secs = "";
  if (c.regnskab) {
    secs += "<h2>Regnskab</h2>";
    secs += regnTabel("Resultatopgørelse (1.000 kr.)", c.regnskab.resultat);
    secs += regnTabel("Balance – Aktiver (1.000 kr.)", c.regnskab.aktiver);
    secs += regnTabel("Balance – Passiver (1.000 kr.)", c.regnskab.passiver);
    secs += regnTabel("Supplerende oplysninger", c.regnskab.supplerende);
  } else {
    secs += '<h2>Regnskab</h2><p style="color:#8a8270;font-style:italic">Detaljerede regnskabstal er ikke tilgængelige for AI-genererede sæt.</p>';
  }
  if ((c.ledelsesberetning || "").trim()) {
    secs += "<h2>Ledelsesberetning (uddrag)</h2>" + par(c.ledelsesberetning);
  }
  secs += "<h2>Analyse pr. område</h2>";
  GRUPPE_NOEGLER.forEach((k) => {
    const g = GRUPPER[k]; const key = c.id + ":" + k;
    secs += `<h3>${esc(g.navn)}</h3>`;
    secs += nogTabel(c.analyse[k].noegletal);
    secs += `<h4>Analyse</h4>${par(svar[key])}`;
    if (fb[key]) secs += `<h4>Feedback</h4>${par(fb[key])}`;
    if (model[key]) secs += `<h4>Vejledende besvarelse</h4>${par(model[key])}`;
  });
  if ((meta.konklusion || "").trim() || (meta.konkFb || "").trim()) {
    secs += "<h2>Samlet konklusion på tværs af de fem områder</h2>";
    secs += par(meta.konklusion);
    if ((meta.konkFb || "").trim()) secs += `<h4>Feedback på den samlede konklusion</h4>${par(meta.konkFb)}`;
  }
  const css = `body{font-family:Calibri,Arial,sans-serif;color:#1C2B3A;font-size:11pt;line-height:1.5;}
h1{font-size:24pt;color:#1C2B3A;margin:0 0 4pt;border-bottom:2.25pt solid #6B2737;padding-bottom:6pt;}
h2{font-size:15pt;color:#6B2737;margin:22pt 0 6pt;}
h3{font-size:12.5pt;color:#1C2B3A;margin:14pt 0 4pt;}
h4{font-size:10.5pt;color:#6B2737;margin:10pt 0 2pt;text-transform:uppercase;letter-spacing:.04em;}
.sub{color:#2D4257;font-size:10.5pt;margin:2pt 0;}
table{border-collapse:collapse;width:100%;margin:4pt 0 10pt;font-size:10.5pt;}
th,td{border:0.75pt solid #c9c0ae;padding:4pt 8pt;text-align:left;}
th{background:#EDE8DE;color:#1C2B3A;}
td.num,th.num{text-align:right;}
p{margin:4pt 0;}`;
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Regnskabsanalyse – ${esc(c.navn)}</title><style>${css}</style></head><body>`
    + `<h1>Regnskabsanalyse</h1>`
    + `<p class="sub"><b>${esc(c.navn)}</b> · ${esc(c.branche)}${c.niveau ? (" · niveau: " + esc(c.niveau)) : ""}</p>`
    + `<p class="sub">${esc(c.beskrivelse)}</p>`
    + ((meta.elevNavn || meta.hold) ? `<p class="sub">Udarbejdet af: <b>${esc(meta.elevNavn || "–")}</b>${meta.hold ? (" · hold: " + esc(meta.hold)) : ""}</p>` : "")
    + `<p class="sub">Udskrevet ${esc(dato)} · Erhvervsakademi Dania · Markedsføringsøkonom AK</p>`
    + secs
    + `<p class="sub" style="margin-top:18pt;border-top:0.75pt solid #c9c0ae;padding-top:6pt;">Nøgletal og definitioner følger lærebogens Bilag 2. Feedback og vejledende besvarelser er udarbejdet med AI og er vejledende.</p>`
    + `</body></html>`;
}

async function callClaude(prompt, maxTokens) {
  const res = await fetch("/.netlify/functions/claude", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  const d = await res.json();
  return (d.content || []).filter((i) => i.type === "text").map((i) => i.text).join("\n").trim();
}

/* --------------------------- STYLES (Dania Design Guide) --------------------------- */

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');
    .ra-root {
      --cream: #F7F4EE; --neutral: #EDE8DE; --navy: #1C2B3A; --slate: #2D4257;
      --burgundy: #6B2737; --gold: #8B6914;
      --ok: #3B6D11; --ok-bg: #EAF3DE; --err: #993C1D; --err-bg: #FAECE7;
      --ink: #1C2B3A; --ink-soft: #2D4257; --line: rgba(28,43,58,0.14);
      font-family: 'Hanken Grotesk', sans-serif; color: var(--ink);
      background: var(--cream); min-height: 100vh; width: 100%; box-sizing: border-box;
    }
    .ra-root *, .ra-root *::before, .ra-root *::after { box-sizing: border-box; }
    .ra-wrap { max-width: 980px; margin: 0 auto; padding: 30px 22px 80px; }
    .ra-mono { font-family: 'Spline Sans Mono', monospace; }
    .ra-eyebrow { font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--slate); font-weight: 600; }
    .ra-h1 { font-family: 'Fraunces', serif; font-weight: 800; font-size: clamp(34px, 7vw, 58px); line-height: 1.02; margin: 10px 0 0; letter-spacing: -0.02em; color: var(--navy); }
    .ra-lead { color: var(--slate); font-size: clamp(15px, 2.4vw, 18px); max-width: 60ch; margin-top: 14px; line-height: 1.55; }
    .ra-tabs { display: flex; flex-wrap: wrap; gap: 4px; margin: 28px 0 26px; border-bottom: 1.5px solid var(--line); }
    .ra-tab { border: none; background: none; cursor: pointer; font-family: inherit; font-weight: 600; font-size: 15px; color: var(--slate); padding: 10px 13px; position: relative; transition: color .2s; }
    .ra-tab:hover { color: var(--navy); } .ra-tab.active { color: var(--navy); }
    .ra-tab.active::after { content: ''; position: absolute; left: 8px; right: 8px; bottom: -1.5px; height: 3px; background: var(--burgundy); border-radius: 3px 3px 0 0; }
    .ra-fade { animation: raFade .4s ease both; }
    @keyframes raFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .ra-grid { display: grid; gap: 14px; }
    @media (min-width: 640px) { .ra-grid-2 { grid-template-columns: 1fr 1fr; } }
    .ra-gcard { border: 1.5px solid var(--line); border-top: 3px solid var(--burgundy); border-radius: 10px; padding: 16px 18px; background: #fff; animation: raFade .4s ease both; }
    .ra-gcard h3 { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; margin: 0 0 4px; color: var(--navy); }
    .ra-gcard .q { font-weight: 600; color: var(--navy); font-size: 14px; }
    .ra-gcard p { margin: 6px 0 0; color: var(--slate); font-size: 13.5px; line-height: 1.5; }
    .ra-gcard .count { font-size: 12px; font-weight: 700; letter-spacing: .04em; margin-top: 10px; display: inline-block; color: var(--burgundy); }
    .ra-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; align-items: center; }
    .ra-chip { border: 1.5px solid var(--line); background: #fff; border-radius: 8px; padding: 7px 14px; cursor: pointer; font-weight: 600; font-size: 13px; color: var(--slate); transition: all .15s; font-family: inherit; }
    .ra-chip:hover { border-color: var(--navy); color: var(--navy); }
    .ra-chip.active { color: var(--cream); border-color: var(--burgundy); background: var(--burgundy); }
    .ra-card { border: 1.5px solid var(--line); border-top: 3px solid var(--burgundy); border-radius: 10px; background: #fff; overflow: hidden; transition: border-color .15s; animation: raFade .4s ease both; }
    .ra-card:hover { border-color: var(--navy); border-top-color: var(--burgundy); }
    .ra-card-head { display: flex; align-items: center; gap: 13px; padding: 16px 18px; cursor: pointer; }
    .ra-tag { font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--cream); background: var(--burgundy); padding: 4px 9px; border-radius: 5px; white-space: nowrap; flex-shrink: 0; }
    .ra-card-head h4 { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.2; color: var(--navy); }
    .ra-card-head .kort { font-size: 13px; color: var(--slate); font-weight: 600; }
    .ra-plus { margin-left: auto; font-size: 22px; color: var(--slate); transition: transform .2s; flex-shrink: 0; }
    .ra-card.open .ra-plus { transform: rotate(45deg); }
    .ra-formel { font-family: 'Spline Sans Mono', monospace; font-size: 13.5px; background: var(--neutral); border: 1px solid var(--line); border-radius: 7px; padding: 11px 13px; margin: 0 18px 4px; color: var(--navy); line-height: 1.5; }
    .ra-body { padding: 4px 18px 18px; }
    .ra-row { display: flex; gap: 10px; padding: 9px 0; border-top: 1px solid var(--line); font-size: 14px; line-height: 1.5; }
    .ra-row:first-child { border-top: none; }
    .ra-row .lab { flex: 0 0 80px; font-weight: 700; color: var(--burgundy); font-size: 12px; letter-spacing: .03em; text-transform: uppercase; padding-top: 1px; }
    .ra-tip { font-size: 13px; font-style: italic; color: var(--slate); }
    .ra-panel { border: 1.5px solid var(--line); border-top: 3px solid var(--burgundy); border-radius: 10px; background: #fff; padding: 26px 22px; text-align: center; }
    .ra-prompt { font-family: 'Fraunces', serif; font-size: clamp(21px, 4.4vw, 30px); font-weight: 700; margin: 6px 0 4px; line-height: 1.2; color: var(--navy); }
    .ra-sub { color: var(--slate); font-size: 14px; }
    .ra-opts { display: grid; gap: 10px; margin-top: 22px; }
    .ra-opt { border: 1.5px solid var(--line); background: #fff; border-radius: 8px; padding: 14px; cursor: pointer; font-weight: 600; font-size: 14.5px; color: var(--navy); transition: all .12s; text-align: left; line-height: 1.4; font-family: inherit; }
    .ra-opt:hover:not(:disabled) { border-color: var(--navy); }
    .ra-opt:disabled { cursor: default; }
    .ra-opt.correct { background: var(--ok-bg); border-color: var(--ok); color: var(--ok); }
    .ra-opt.wrong { background: var(--err-bg); border-color: var(--err); color: var(--err); }
    .ra-btn { border: none; background: var(--navy); color: var(--cream); border-radius: 8px; padding: 12px 24px; font-weight: 700; font-size: 15px; cursor: pointer; font-family: inherit; transition: opacity .15s; }
    .ra-btn:hover:not(:disabled) { opacity: .9; } .ra-btn:disabled { opacity: .55; cursor: default; }
    .ra-btn.accent { background: var(--burgundy); }
    .ra-btn.sec { background: none; color: var(--navy); border: 1.5px solid var(--navy); }
    .ra-btn.sm { padding: 9px 16px; font-size: 13.5px; }
    .ra-score { display: flex; gap: 22px; justify-content: center; margin-bottom: 18px; }
    .ra-score .item { text-align: center; }
    .ra-score .num { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 800; line-height: 1; color: var(--navy); }
    .ra-score .cap { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--slate); margin-top: 4px; }
    .ra-callout { border-left: 4px solid var(--gold); background: var(--neutral); border-radius: 0 8px 8px 0; padding: 14px 16px; margin-top: 16px; font-size: 14px; line-height: 1.55; color: var(--slate); text-align: left; }
    .ra-callout b { color: var(--navy); } .ra-callout .ra-mono { color: var(--navy); }
    .ra-footer { margin-top: 40px; padding-top: 18px; border-top: 1.5px solid var(--line); font-size: 12px; color: var(--slate); }
    .ra-company { border: 1.5px solid var(--line); border-top: 3px solid var(--burgundy); border-radius: 10px; background: #fff; padding: 18px 20px; margin-bottom: 18px; }
    .ra-company .top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .ra-company h3 { font-family: 'Fraunces', serif; font-size: 22px; margin: 0; color: var(--navy); }
    .ra-company .branche { font-size: 13px; color: var(--slate); font-weight: 600; }
    .ra-company p { margin: 8px 0 0; color: var(--slate); font-size: 14px; line-height: 1.55; }
    .ra-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 12px; }
    .ra-link { background: none; border: none; color: var(--burgundy); font-weight: 700; cursor: pointer; font-size: 13px; padding: 0; text-decoration: underline; font-family: inherit; }
    .ra-hint { font-size: 12px; color: var(--slate); }
    .ra-table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin: 6px 0 2px; }
    .ra-table th, .ra-table td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--line); }
    .ra-table th { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--slate); }
    .ra-table td.num, .ra-table th.num { text-align: right; font-family: 'Spline Sans Mono', monospace; }
    .ra-table td.udv { color: var(--slate); font-size: 12.5px; }
    .ra-tablewrap { border: 1.5px solid var(--line); border-radius: 10px; overflow: hidden; background: #fff; margin-bottom: 18px; }
    .ra-tablewrap h5 { font-family: 'Fraunces', serif; font-size: 16px; margin: 0; padding: 12px 14px 4px; color: var(--navy); }
    .ra-ta { width: 100%; min-height: 180px; resize: vertical; border: 1.5px solid var(--line); border-radius: 8px; background: #fff; padding: 14px 15px; font-family: inherit; font-size: 15px; line-height: 1.55; color: var(--navy); outline: none; }
    .ra-ta:focus { border-color: var(--navy); }
    .ra-konk { min-height: 120px; }
    .ra-idrow { display: flex; flex-wrap: wrap; gap: 12px; margin: 4px 0 14px; }
    .ra-field { display: flex; flex-direction: column; gap: 5px; flex: 1 1 200px; }
    .ra-field label { font-size: 12px; letter-spacing: .04em; text-transform: uppercase; color: var(--slate); font-weight: 600; }
    .ra-input { border: 1.5px solid var(--line); border-radius: 8px; background: #fff; padding: 9px 12px; font-family: inherit; font-size: 14.5px; color: var(--navy); outline: none; }
    .ra-input:focus { border-color: var(--navy); }
    .ra-btnrow { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
    .ra-fbbox { background: #fff; border: 1.5px solid var(--line); border-left: 4px solid var(--navy); border-radius: 0 8px 8px 0; padding: 16px 18px; margin-top: 16px; white-space: pre-wrap; font-size: 14.5px; line-height: 1.6; color: var(--ink); }
    .ra-fbbox h5 { font-family: 'Fraunces', serif; font-size: 17px; margin: 0 0 8px; color: var(--navy); }
    .ra-err { color: var(--err); font-weight: 600; font-size: 14px; margin-top: 12px; }
    .ra-spinner { display: inline-block; width: 15px; height: 15px; border: 2.5px solid rgba(247,244,238,0.4); border-top-color: var(--cream); border-radius: 50%; animation: raSpin .7s linear infinite; vertical-align: -2px; margin-right: 8px; }
    .ra-spinner.dark { border-color: rgba(28,43,58,0.25); border-top-color: var(--navy); }
    @keyframes raSpin { to { transform: rotate(360deg); } }
    .ra-modelbox { border: 1.5px solid var(--line); border-left: 4px solid var(--gold); border-radius: 0 8px 8px 0; background: var(--neutral); padding: 16px 18px; margin-top: 16px; font-size: 14.5px; line-height: 1.6; color: var(--ink); white-space: pre-wrap; }
    .ra-modelbox h5 { font-family: 'Fraunces', serif; font-size: 17px; margin: 0 0 8px; color: var(--navy); }
    .ra-tips { border: 1.5px solid var(--line); border-left: 4px solid var(--gold); border-radius: 0 8px 8px 0; background: #fff; padding: 14px 16px 14px 18px; margin-top: 16px; }
    .ra-tips h5 { font-family: 'Fraunces', serif; font-size: 16px; margin: 0 0 8px; color: var(--navy); }
    .ra-tips ul { margin: 0; padding-left: 18px; }
    .ra-tips li { font-size: 14px; line-height: 1.55; color: var(--slate); margin-bottom: 6px; }
    .ra-beretning { margin-top: 14px; border: 1.5px solid var(--line); border-left: 4px solid var(--gold); border-radius: 0 8px 8px 0; background: var(--neutral); padding: 14px 18px; }
    .ra-beretning h5 { font-family: 'Fraunces', serif; font-size: 16px; margin: 0 0 8px; color: var(--navy); }
    .ra-beretning p { font-size: 14px; line-height: 1.6; color: var(--ink); margin: 0 0 9px; }
    .ra-beretning p.note { font-size: 12.5px; font-style: italic; color: var(--slate); margin: 10px 0 0; border-top: 1px solid var(--line); padding-top: 9px; }
    .dp-controls { display: grid; gap: 12px 22px; }
    @media (min-width: 640px) { .dp-controls { grid-template-columns: 1fr 1fr; } }
    .dp-slider .row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--navy); margin-bottom: 3px; }
    .dp-slider .row .val { font-family: 'Spline Sans Mono', monospace; color: var(--burgundy); }
    .dp-slider input[type=range] { width: 100%; accent-color: var(--burgundy); height: 22px; }
    .dp-box { border: 1.5px solid var(--line); border-top: 3px solid var(--burgundy); border-radius: 10px; background: #fff; padding: 14px 16px; text-align: center; }
    .dp-box .lab { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--slate); font-weight: 700; }
    .dp-box .big { font-family: 'Fraunces', serif; font-weight: 800; font-size: clamp(22px, 4vw, 30px); color: var(--navy); line-height: 1.1; margin-top: 2px; }
    .dp-box .formel { font-family: 'Spline Sans Mono', monospace; font-size: 12px; color: var(--slate); margin-top: 6px; }
    .dp-result { background: var(--burgundy); border: 1.5px solid var(--burgundy); }
    .dp-result .lab { color: rgba(247,244,238,.8); }
    .dp-result .big { color: var(--cream); }
    .dp-result .formel { color: rgba(247,244,238,.85); }
    .dp-op { text-align: center; font-family: 'Fraunces', serif; font-weight: 800; font-size: 26px; color: var(--burgundy); }
    .dp-eq { text-align: center; font-family: 'Spline Sans Mono', monospace; font-size: 13px; color: var(--slate); margin: 12px 0; }
    .dp-branches { display: grid; gap: 12px; margin-top: 4px; }
    @media (min-width: 560px) { .dp-branches { grid-template-columns: 1fr 40px 1fr; align-items: center; } }
    .dp-conn { width: 2px; height: 16px; background: var(--line); margin: 8px auto; }
    .dp-layout { display: grid; gap: 22px; align-items: start; margin-top: 16px; }
    @media (min-width: 860px) {
      .dp-layout { grid-template-columns: 1fr 300px; }
      .dp-side { position: sticky; top: 14px; align-self: start; max-height: calc(100vh - 28px); overflow: auto; }
    }
    .dp-side-sliders { display: grid; gap: 11px; }
  `}</style>
);

/* --------------------------- VIEWS ------------------------------ */

function IntroView() {
  return (
    <div className="ra-fade">
      <p className="ra-lead" style={{ marginTop: 0, marginBottom: 26 }}>
        AI kan i dag lave en hurtig og korrekt regnskabsanalyse. Derfor er det
        ikke selve <i>beregningen</i>, der er den vigtige kompetence – det er at
        kende <b>de enkelte nøgletal</b>, forstå <b>hvad hvert analyseområde
        søger at sige noget om</b>, og kunne <b>argumentere ud fra tallene</b>.
      </p>
      <div className="ra-callout" style={{ marginBottom: 30 }}>
        <b>Sådan bruger du siden:</b> Lær nøgletallene i <b>Nøgletal</b> og test
        din forståelse af, hvad de siger noget om, og de fem områder i <b>Quiz</b>.
        I <b>Analyseopgave</b> vælger du en
        virksomhed (let, mellem eller svær – eller få et helt nyt sæt tal),
        skriver din analyse, får tips, live-feedback og en vejledende besvarelse
        – og kan downloade det hele som en samlet Word-rapport.
      </div>
      <p className="ra-eyebrow" style={{ marginBottom: 14 }}>De fem analyseområder</p>
      <div className="ra-grid ra-grid-2">
        {GRUPPE_NOEGLER.map((key, i) => {
          const g = GRUPPER[key];
          const antal = NOEGLETAL.filter((n) => n.gruppe === key).length;
          return (
            <div className="ra-gcard" key={key} style={{ animationDelay: `${i * 50}ms` }}>
              <h3>{g.navn}</h3>
              <div className="q">{g.kort}</div>
              <p>{g.formaal}</p>
              <span className="count">{antal} nøgletal</span>
            </div>
          );
        })}
      </div>
      <p className="ra-eyebrow" style={{ margin: "34px 0 12px" }}>Vigtige sammenhænge</p>
      <div className="ra-callout">
        Nøgletal står ikke alene – flere af dem hænger sammen:
        <br /><span className="ra-mono">Afkastningsgrad = Overskudsgrad × Aktivernes omsætningshastighed</span><br />
        Rentabiliteten kan forbedres enten ved at tjene mere pr. omsætningskrone (indtjeningsevne) eller ved at binde mindre kapital (kapitaltilpasning).
        <br /><br /><span className="ra-mono">EKF = AG + (AG − fremmedkapitalens forrentning) × finansiel gearing</span><br />
        Når afkastningsgraden er højere end lånerenten, løfter gearingen ejernes forrentning – men den forstærker også tabet, hvis det går galt.
      </div>
    </div>
  );
}

function ReferenceView() {
  const [filter, setFilter] = useState("alle");
  const [open, setOpen] = useState(null);
  const liste = useMemo(() => (filter === "alle" ? NOEGLETAL : NOEGLETAL.filter((n) => n.gruppe === filter)), [filter]);
  return (
    <div className="ra-fade">
      <div className="ra-chips">
        <button className={"ra-chip" + (filter === "alle" ? " active" : "")} onClick={() => setFilter("alle")}>Alle ({NOEGLETAL.length})</button>
        {GRUPPE_NOEGLER.map((key) => (
          <button key={key} className={"ra-chip" + (filter === key ? " active" : "")} onClick={() => setFilter(key)}>{GRUPPER[key].navn}</button>
        ))}
      </div>
      <div className="ra-grid">
        {liste.map((n, i) => {
          const g = GRUPPER[n.gruppe]; const isOpen = open === n.id;
          return (
            <div className={"ra-card" + (isOpen ? " open" : "")} key={n.id} style={{ animationDelay: `${i * 20}ms` }}>
              <div className="ra-card-head" onClick={() => setOpen(isOpen ? null : n.id)}>
                <span className="ra-tag">{g.navn}</span>
                <div><h4>{n.navn}</h4>{n.kort && <span className="kort">{n.kort}</span>}</div>
                <span className="ra-plus">+</span>
              </div>
              <div className="ra-formel">{n.formel}</div>
              {isOpen && (
                <div className="ra-body">
                  <div className="ra-row"><span className="lab">Viser</span><span>{n.beskrivelse}</span></div>
                  {n.note && <div className="ra-row"><span className="lab">Husk</span><span className="ra-tip">{n.note}</span></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegnskabTabel({ titel, rows }) {
  return (
    <div className="ra-tablewrap" style={{ marginBottom: 12 }}>
      <h5>{titel}</h5>
      <table className="ra-table">
        <thead><tr><th>Post</th><th className="num">2024</th><th className="num">2025</th></tr></thead>
        <tbody>{rows.map((r, i) => (<tr key={i}><td>{r[0]}</td><td className="num">{r[1]}</td><td className="num">{r[2]}</td></tr>))}</tbody>
      </table>
    </div>
  );
}

function AnalyseView() {
  const [caseId, setCaseId] = useState("let");
  const [aiCase, setAiCase] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [omr, setOmr] = useState("rentabilitet");
  const [svar, setSvar] = useState({});
  const [fb, setFb] = useState({});
  const [model, setModel] = useState({});
  const [fbLoading, setFbLoading] = useState(false);
  const [fbErr, setFbErr] = useState("");
  const [modelLoading, setModelLoading] = useState(false);
  const [modelErr, setModelErr] = useState("");
  const [visTips, setVisTips] = useState(false);
  const [visRegnskab, setVisRegnskab] = useState(false);
  const [visBeretning, setVisBeretning] = useState(false);
  const [elevNavn, setElevNavn] = useState("");
  const [hold, setHold] = useState("");
  const [konklusion, setKonklusion] = useState({});
  const [konkFb, setKonkFb] = useState({});
  const [konkFbLoading, setKonkFbLoading] = useState(false);
  const [konkFbErr, setKonkFbErr] = useState("");

  const activeCase = caseId === "ai" ? aiCase : CASES.find((c) => c.id === caseId);
  const g = GRUPPER[omr];
  const areaData = activeCase ? activeCase.analyse[omr] : null;
  const key = caseId + ":" + omr;
  const currentText = svar[key] || "";
  const antalAnalyseret = GRUPPE_NOEGLER.filter((k) => (svar[caseId + ":" + k] || "").trim().length > 0).length;
  const currentKonk = konklusion[caseId] || "";
  const currentKonkFb = konkFb[caseId] || "";

  function vaelgCase(id) { if (id === caseId) return; setCaseId(id); setFbErr(""); setModelErr(""); }
  function vaelgOmr(k) { if (k === omr) return; setOmr(k); setFbErr(""); setModelErr(""); }

  async function nytAiSaet() {
    setAiLoading(true); setAiErr("");
    const struktur = GRUPPE_NOEGLER.map((k) =>
      `  "${k}": [\n` + OMR_NOEGLETAL[k].map((n) => `    {"n":"${n}","a":"<2024>","b":"<2025>","udv":"<kort udvikling>"}`).join(",\n") + `\n  ]`
    ).join(",\n");
    const prompt = `Opfind en realistisk dansk SMV og lav et sæt regnskabsnøgletal til en undervisningsøvelse i regnskabsanalyse. Returnér KUN gyldig JSON (ingen markdown-fences, ingen forklaring) i præcis denne struktur:
{
 "navn": "<virksomhedsnavn A/S eller ApS>",
 "branche": "<kort branche>",
 "beskrivelse": "<1-2 sætninger om virksomhedens situation>",
 "ledelsesberetning": "<2-3 korte afsnit ledelsesberetning, adskilt med \\n\\n>",
 "analyse": {
${struktur}
 }
}
Krav: 'a' = 2024, 'b' = 2025. Brug dansk talformat (komma som decimal, "%", "kr.", samt "(NN dage)" for omsætningshastigheder på lager/debitorer/kreditorer; indekstal har a="100"). Tallene skal være indbyrdes konsistente og fortælle ÉN sammenhængende historie på tværs af alle fem områder. Udfyld ALLE nøgletal i strukturen, og hold 'udv' kort (fx "↑ 2,0 pct.point" eller "↓ faldende"). Ledelsesberetningen skal være skrevet i ledelsens egen, lidt positive stemme og forklare udviklingen — men den må gerne fremhæve det positive og være lidt tilbageholdende med svaghederne (fx undlade at nævne svag likviditet), så de studerende kan øve sig i kritisk at holde beretningen op mod nøgletallene.`;
    try {
      let txt = await callClaude(prompt, 1500);
      txt = txt.replace(/```json/gi, "").replace(/```/g, "").trim();
      const obj = JSON.parse(txt);
      if (!obj.analyse || !GRUPPE_NOEGLER.every((k) => Array.isArray(obj.analyse[k]))) throw new Error("format");
      const norm = { id: "ai", navn: obj.navn || "AI-virksomhed", niveau: "AI", branche: obj.branche || "", beskrivelse: obj.beskrivelse || "", ledelsesberetning: obj.ledelsesberetning || "", analyse: {} };
      GRUPPE_NOEGLER.forEach((k) => { norm.analyse[k] = { noegletal: obj.analyse[k] }; });
      setAiCase(norm); setCaseId("ai"); setFbErr(""); setModelErr("");
    } catch (e) {
      setAiErr("Kunne ikke lave et nyt sæt lige nu. Prøv igen.");
    } finally { setAiLoading(false); }
  }

  function noegletalTekst() { return areaData.noegletal.map((x) => `- ${x.n}: 2024 = ${x.a}, 2025 = ${x.b} (${x.udv})`).join("\n"); }

  function alleAnalyserTekst() {
    return GRUPPE_NOEGLER.map((k) => {
      const t = (svar[caseId + ":" + k] || "").trim();
      return `## ${GRUPPER[k].navn}\n${t || "(ikke skrevet endnu)"}`;
    }).join("\n\n");
  }

  function beretningTekst() { return ((activeCase && activeCase.ledelsesberetning) || "").trim(); }
  function beretningBlok() {
    const b = beretningTekst();
    return b ? `\n\nUddrag af ledelsesberetningen (ledelsens egen forklaring på udviklingen):\n"""\n${b}\n"""` : "";
  }

  async function faaFeedback() {
    if (!areaData) return;
    if (currentText.trim().length < 40) { setFbErr("Skriv lidt mere først – mindst et par sætninger – så kan du få brugbar feedback."); return; }
    setFbErr(""); setFbLoading(true);
    const prompt = `Du er en erfaren og venlig underviser i regnskabsanalyse på markedsføringsøkonomuddannelsen. En studerende analyserer analyseområdet "${g.navn}" for virksomheden ${activeCase.navn} ud fra disse nøgletal (2024 → 2025):

${noegletalTekst()}${beretningBlok()}

Den studerendes tekst:
"""
${currentText.trim()}
"""

Giv kort, konkret og formativ feedback på dansk. Ingen karakter. Brug korte afsnit med disse overskrifter:
Det fungerer godt:
Det kan styrkes:
Faglige fejl eller unøjagtigheder: (skriv kun hvis der er nogen)
Ledelsens forklaring: (kun hvis der er vedlagt en ledelsesberetning ovenfor — vurder, om den studerende kobler beretningens forklaring til tallene eller forholder sig kritisk til den, fx hvad beretningen fremhæver eller undlader at nævne)
Næste skridt: (ét konkret forslag)

Henvis til de konkrete nøgletal og tal, ros det rigtige, og vær specifik. Maks ca. 220 ord.`;
    try { const txt = await callClaude(prompt, 1000); if (txt) setFb((f) => ({ ...f, [key]: txt })); else setFbErr("Der kom ikke noget svar. Prøv igen om et øjeblik."); }
    catch (e) { setFbErr("Kunne ikke hente feedback lige nu. Tjek internetforbindelsen og prøv igen."); }
    finally { setFbLoading(false); }
  }

  async function visVejledende() {
    if (!areaData) return;
    if (model[key]) { setModel((m) => { const n = { ...m }; delete n[key]; return n; }); return; }
    setModelErr(""); setModelLoading(true);
    const prompt = `Skriv en kort, eksemplarisk vejledende besvarelse på dansk (ca. 150 ord) for analyseområdet "${g.navn}" for virksomheden ${activeCase.navn}, ud fra disse nøgletal (2024 → 2025):

${noegletalTekst()}${beretningBlok()}

Skriv som en dygtig studerende: brug de konkrete tal, sammenlign de to år, forklar årsagerne til udviklingen, og slut med en samlet vurdering. Hvis der indgår en ledelsesberetning, så inddrag kort, hvor nøgletallene be- eller afkræfter ledelsens forklaring. Sammenhængende prosa uden overskrifter.`;
    try { const txt = await callClaude(prompt, 700); if (txt) setModel((m) => ({ ...m, [key]: txt })); else setModelErr("Kunne ikke hente en besvarelse. Prøv igen."); }
    catch (e) { setModelErr("Kunne ikke hente en besvarelse lige nu. Prøv igen."); }
    finally { setModelLoading(false); }
  }

  async function faaKonkFeedback() {
    if (!activeCase) return;
    if (currentKonk.trim().length < 40) { setKonkFbErr("Skriv lidt mere på den samlede konklusion først – mindst et par sætninger."); return; }
    setKonkFbErr(""); setKonkFbLoading(true);
    const prompt = `Du er en erfaren og venlig underviser i regnskabsanalyse på markedsføringsøkonomuddannelsen. En studerende har analyseret de fem områder for virksomheden ${activeCase.navn} og skal nu skrive en SAMLET KONKLUSION på tværs af områderne.

Den studerendes analyser pr. område:
${alleAnalyserTekst()}${beretningBlok()}

Den studerendes samlede konklusion:
"""
${currentKonk.trim()}
"""

Giv kort, konkret og formativ feedback på dansk. Ingen karakter. Vurdér især, om konklusionen binder de fem områder sammen til ÉT samlet billede, om den bygger på de konkrete tal, og om den ender i en klar vurdering og anbefaling. Brug korte afsnit med disse overskrifter:
Det fungerer godt:
Det kan styrkes:
Hænger det sammen på tværs: (peg på modsætninger eller manglende sammenhæng mellem områderne, hvis nogen)
Ledelsens forklaring: (kun hvis der er vedlagt en ledelsesberetning ovenfor — vurder, om den studerende kritisk holder ledelsens fortælling op mod nøgletallene)
Næste skridt: (ét konkret forslag)

Maks ca. 220 ord.`;
    try { const txt = await callClaude(prompt, 1000); if (txt) setKonkFb((f) => ({ ...f, [caseId]: txt })); else setKonkFbErr("Der kom ikke noget svar. Prøv igen om et øjeblik."); }
    catch (e) { setKonkFbErr("Kunne ikke hente feedback lige nu. Tjek internetforbindelsen og prøv igen."); }
    finally { setKonkFbLoading(false); }
  }

  function downloadRapport() {
    if (!activeCase) return;
    const html = buildReportHTML(activeCase, svar, fb, model, { elevNavn, hold, konklusion: currentKonk, konkFb: currentKonkFb });
    const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const navn = activeCase.navn.replace(/[\/\\:*?"<>|]/g, "").trim();
    const filnavn = (elevNavn.trim() ? elevNavn.trim().replace(/[\/\\:*?"<>|]/g, "") + " - " : "") + navn + " - regnskabsanalyse.doc";
    a.href = url; a.download = filnavn;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="ra-fade">
      <p className="ra-eyebrow" style={{ marginBottom: 12 }}>Vælg datasæt</p>
      <div className="ra-chips">
        {CASES.map((c) => (
          <button key={c.id} className={"ra-chip" + (caseId === c.id ? " active" : "")} onClick={() => vaelgCase(c.id)}>
            {c.niveau} · {c.navn}
          </button>
        ))}
        {aiCase && (
          <button className={"ra-chip" + (caseId === "ai" ? " active" : "")} onClick={() => vaelgCase("ai")}>AI · {aiCase.navn}</button>
        )}
        <button className="ra-btn accent sm" onClick={nytAiSaet} disabled={aiLoading}>
          {aiLoading ? <><span className="ra-spinner" />Laver nyt sæt…</> : "↻ Nyt sæt (AI)"}
        </button>
      </div>
      {aiErr && <div className="ra-err" style={{ marginTop: -6, marginBottom: 12 }}>{aiErr}</div>}

      {activeCase && (
        <div className="ra-company">
          <div className="top">
            <span className="ra-tag">{activeCase.niveau}</span>
            <h3>{activeCase.navn}</h3>
            <span className="branche">· {activeCase.branche}</span>
          </div>
          <p>{activeCase.beskrivelse}</p>
          <div className="ra-actions">
            {activeCase.regnskab && (
              <button className="ra-link" onClick={() => setVisRegnskab((v) => !v)}>
                {visRegnskab ? "Skjul regnskabstal ▲" : "Se regnskabstal ▼"}
              </button>
            )}
            {activeCase.ledelsesberetning && (
              <button className="ra-link" onClick={() => setVisBeretning((v) => !v)}>
                {visBeretning ? "Skjul ledelsesberetning ▲" : "Se ledelsesberetning ▼"}
              </button>
            )}
          </div>
          {visRegnskab && activeCase.regnskab && (
            <div style={{ marginTop: 14 }}>
              <RegnskabTabel titel="Resultatopgørelse (1.000 kr.)" rows={activeCase.regnskab.resultat} />
              <RegnskabTabel titel="Balance – Aktiver (1.000 kr.)" rows={activeCase.regnskab.aktiver} />
              <RegnskabTabel titel="Balance – Passiver (1.000 kr.)" rows={activeCase.regnskab.passiver} />
              <RegnskabTabel titel="Supplerende oplysninger" rows={activeCase.regnskab.supplerende} />
            </div>
          )}
          {visBeretning && activeCase.ledelsesberetning && (
            <div className="ra-beretning">
              <h5>Ledelsesberetning (uddrag)</h5>
              {activeCase.ledelsesberetning.trim().split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
              <p className="note">Husk: beretningen er ledelsens egen forklaring. Hold den op mod nøgletallene — bekræfter, modsiger eller forholder den sig slet ikke til det, tallene viser?</p>
            </div>
          )}
        </div>
      )}

      <p className="ra-eyebrow" style={{ marginBottom: 12 }}>Vælg analyseområde</p>
      <div className="ra-chips">
        {GRUPPE_NOEGLER.map((k) => (
          <button key={k} className={"ra-chip" + (omr === k ? " active" : "")} onClick={() => vaelgOmr(k)}>{GRUPPER[k].navn}</button>
        ))}
      </div>

      {areaData && (
        <div className="ra-tablewrap">
          <h5>{g.navn} – nøgletal</h5>
          <table className="ra-table">
            <thead><tr><th>Nøgletal</th><th className="num">2024</th><th className="num">2025</th><th>Udvikling</th></tr></thead>
            <tbody>{areaData.noegletal.map((x, i) => (
              <tr key={i}><td>{x.n}</td><td className="num">{x.a}</td><td className="num">{x.b}</td><td className="udv">{x.udv}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <p className="ra-eyebrow" style={{ marginBottom: 8 }}>Din analyse og argumentation</p>
      <textarea className="ra-ta" value={currentText} onChange={(e) => setSvar((s) => ({ ...s, [key]: e.target.value }))}
        placeholder={activeCase ? `Skriv din analyse af ${g.navn.toLowerCase()} for ${activeCase.navn}. Brug de konkrete nøgletal, sammenlign de to år, forklar årsagerne – og slut med en samlet vurdering.` : ""} />

      <div className="ra-btnrow">
        <button className="ra-btn" onClick={faaFeedback} disabled={fbLoading || !areaData}>
          {fbLoading ? <><span className="ra-spinner" />Henter feedback…</> : "Få feedback"}
        </button>
        <button className="ra-btn sec" onClick={() => setVisTips((v) => !v)}>{visTips ? "Skjul tips" : "Tips"}</button>
        <button className="ra-btn sec" onClick={visVejledende} disabled={modelLoading || !areaData}>
          {modelLoading ? <><span className="ra-spinner dark" />Henter…</> : (model[key] ? "Skjul vejledende besvarelse" : "Vejledende besvarelse")}
        </button>
      </div>

      {fbErr && <div className="ra-err">{fbErr}</div>}
      {modelErr && <div className="ra-err">{modelErr}</div>}

      {visTips && (
        <div className="ra-tips">
          <h5>Tips til {g.navn.toLowerCase()}</h5>
          <ul>{TIPS[omr].map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}

      {fb[key] && (<div className="ra-fbbox"><h5>Feedback på din tekst</h5>{fb[key]}</div>)}

      {model[key] && (
        <div className="ra-modelbox">
          <h5>Vejledende besvarelse</h5>
          {model[key]}
          <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--slate)", fontStyle: "italic", whiteSpace: "normal" }}>
            Eksempel på en god besvarelse – ikke et facit. Sammenlign med din egen og se, hvad du kan tilføje.
          </div>
        </div>
      )}

      <div style={{ marginTop: 30, paddingTop: 18, borderTop: "1.5px solid var(--line)" }}>
        <p className="ra-eyebrow" style={{ marginBottom: 8 }}>Samlet konklusion på tværs</p>
        <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.6, margin: "0 0 12px" }}>
          Når du har analyseret de fem områder, så saml dem til ét billede: Hvad fortæller
          rentabilitet, indtjeningsevne, kapitaltilpasning, soliditet/likviditet og de
          børsrelaterede nøgletal <i>tilsammen</i>? Forhold dig til ledelsens forklaring –
          holder den, når du ser på tallene? – og slut med en klar vurdering og en anbefaling.
        </p>
        <textarea className="ra-ta ra-konk" value={currentKonk}
          onChange={(e) => setKonklusion((s) => ({ ...s, [caseId]: e.target.value }))}
          placeholder={activeCase ? `Skriv din samlede konklusion for ${activeCase.navn} på tværs af de fem analyseområder.` : "Vælg et datasæt ovenfor først."} />
        <div className="ra-btnrow">
          <button className="ra-btn" onClick={faaKonkFeedback} disabled={konkFbLoading || !activeCase}>
            {konkFbLoading ? <><span className="ra-spinner" />Henter feedback…</> : "Få feedback på konklusionen"}
          </button>
        </div>
        {konkFbErr && <div className="ra-err">{konkFbErr}</div>}
        {currentKonkFb && (<div className="ra-fbbox"><h5>Feedback på din samlede konklusion</h5>{currentKonkFb}</div>)}
      </div>

      <div style={{ marginTop: 30, paddingTop: 18, borderTop: "1.5px solid var(--line)" }}>
        <p className="ra-eyebrow" style={{ marginBottom: 10 }}>Samlet rapport</p>
        <div className="ra-idrow">
          <div className="ra-field">
            <label>Navn (valgfrit)</label>
            <input className="ra-input" value={elevNavn} onChange={(e) => setElevNavn(e.target.value)} placeholder="Dit navn" />
          </div>
          <div className="ra-field">
            <label>Hold (valgfrit)</label>
            <input className="ra-input" value={hold} onChange={(e) => setHold(e.target.value)} placeholder="Fx MØK24" />
          </div>
        </div>
        <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.6, margin: 0 }}>
          Rapporten samler virksomhedens regnskab, ledelsesberetningen, nøgletallene for
          alle fem analyseområder og de analyser, du har skrevet – samt din samlede
          konklusion og den feedback og de vejledende besvarelser, du har hentet – i ét
          Word-dokument.
          {" "}<b>Knappen bruges, når du har skrevet din analyse for alle fem
          områder</b>, så rapporten er fuldstændig og klar til aflevering eller til
          dit læringsresumé. Du kan godt downloade undervejs, men områder, du endnu
          ikke har analyseret, vil stå som tomme i dokumentet.
        </p>
        <p style={{ fontSize: 13.5, color: "var(--slate)", margin: "10px 0 4px" }}>
          Analyseret for {activeCase ? activeCase.navn : "denne virksomhed"}:{" "}
          <b style={{ color: antalAnalyseret === 5 ? "var(--ok)" : "var(--burgundy)" }}>{antalAnalyseret} af 5 områder</b>
          {antalAnalyseret === 5 ? " – rapporten er komplet." : "."}
        </p>
        <p style={{ fontSize: 13.5, color: "var(--slate)", margin: "0 0 14px" }}>
          Samlet konklusion:{" "}
          <b style={{ color: currentKonk.trim() ? "var(--ok)" : "var(--slate)" }}>{currentKonk.trim() ? "skrevet" : "mangler endnu"}</b>.
        </p>
        <button className="ra-btn" onClick={downloadRapport} disabled={!activeCase}>⬇ Download rapport (Word)</button>
      </div>
    </div>
  );
}

function DuPontView() {
  const DEF = { O: 48000, VF: 28800, KAP: 14400, A1: 14000, LG: 8000, DB: 6000, LK: 2000, G: 16500, r: 5 };
  const [v, setV] = useState(DEF);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: Number(e.target.value) }));

  const { O, VF, KAP, A1, LG, DB, LK, G, r } = v;
  const K = VF + KAP;
  const R = O - K;
  const A2 = LG + DB + LK;
  const A = A1 + A2;
  const OG = O > 0 ? (R / O) * 100 : 0;
  const AOH = A > 0 ? O / A : 0;
  const AG = A > 0 ? (R / A) * 100 : 0;
  const E = A - G;
  const gearing = E > 0 ? G / E : 0;
  const loft = E > 0 ? (AG - r) * gearing : 0;
  const EKF = E > 0 ? AG + loft : null;

  const f1 = (x) => x.toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const f2 = (x) => x.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const m = (x) => Math.round(x).toLocaleString("da-DK");
  const pct = (x) => f1(x) + " %";

  const sliders = [
    { k: "O", label: "Omsætning", min: 10000, max: 100000, step: 1000, fmt: m, suf: "" },
    { k: "VF", label: "Vareforbrug", min: 0, max: 80000, step: 500, fmt: m, suf: "" },
    { k: "KAP", label: "Kapacitetsomkostninger", min: 0, max: 40000, step: 500, fmt: m, suf: "" },
    { k: "A1", label: "Anlægsaktiver", min: 0, max: 60000, step: 1000, fmt: m, suf: "" },
    { k: "LG", label: "Varelager", min: 0, max: 40000, step: 500, fmt: m, suf: "" },
    { k: "DB", label: "Debitorer", min: 0, max: 40000, step: 500, fmt: m, suf: "" },
    { k: "LK", label: "Likvide beholdninger", min: 0, max: 20000, step: 500, fmt: m, suf: "" },
    { k: "G", label: "Gæld (fremmedkapital)", min: 0, max: 60000, step: 1000, fmt: m, suf: "" },
    { k: "r", label: "Lånerente", min: 0, max: 15, step: 0.5, fmt: f1, suf: " %" },
  ];

  return (
    <div className="ra-fade">
      <p className="ra-lead" style={{ marginTop: 0, marginBottom: 18 }}>
        DuPont-pyramiden viser, at <b>rentabiliteten har to drivkræfter</b>:
        hvor meget virksomheden tjener pr. omsætningskrone (overskudsgrad) og
        hvor effektivt den udnytter sin kapital (aktivernes omsætningshastighed).
        Den udvidede model kobler afkastningsgraden videre til <b>ejernes
        forrentning</b> via gearingen.
      </p>

      <div className="ra-callout">
        <b>Prøv selv – og læg mærke til:</b> Afkastningsgraden kan forbedres på to
        måder. (1) Skær i omkostningerne (vareforbrug eller kapacitetsomkostninger)
        og se overskudsgraden – og dermed afkastningsgraden – stige. (2) Reducér den
        bundne kapital (fx varelager eller debitorer) og se aktivernes
        omsætningshastighed stige. Bemærk, at en ændring i bunden af pyramiden
        flyder hele vejen op til afkastningsgraden og videre til ejernes forrentning.
        Prøv til sidst at sætte lånerenten <i>højere</i> end afkastningsgraden – så
        vender gearingens effekt fra at løfte EKF til at trække den ned.
      </div>

      <div className="dp-layout">
        <div className="dp-main">
          <p className="ra-eyebrow" style={{ margin: "4px 0 10px" }}>DuPont-pyramiden – afkastningsgraden</p>
          <div style={{ maxWidth: 320, margin: "0 auto" }}>
            <div className="dp-box dp-result">
              <div className="lab">Afkastningsgrad</div>
              <div className="big">{pct(AG)}</div>
              <div className="formel">Resultat af primær drift × 100 / Aktiver</div>
            </div>
          </div>
          <div className="dp-conn" />
          <div className="dp-eq">Afkastningsgrad = Overskudsgrad × Aktivernes omsætningshastighed</div>

          <div className="dp-branches">
            <div className="dp-box">
              <div className="lab">Overskudsgrad</div>
              <div className="big">{pct(OG)}</div>
              <div className="formel">Resultat × 100 / Omsætning</div>
              <div className="formel">{m(R)} × 100 / {m(O)}</div>
            </div>
            <div className="dp-op">×</div>
            <div className="dp-box">
              <div className="lab">Aktivernes omsætningshastighed</div>
              <div className="big">{f2(AOH)}</div>
              <div className="formel">Omsætning / Aktiver</div>
              <div className="formel">{m(O)} / {m(A)}</div>
            </div>
          </div>

          <div className="dp-branches" style={{ marginTop: 12 }}>
            <div className="dp-box">
              <div className="lab">Resultat af primær drift</div>
              <div className="big" style={{ fontSize: 20 }}>{m(R)}</div>
              <div className="formel">Omsætning − Omkostninger</div>
              <div className="formel">{m(O)} − {m(K)}</div>
            </div>
            <div className="dp-op" />
            <div className="dp-box">
              <div className="lab">Aktiver i alt</div>
              <div className="big" style={{ fontSize: 20 }}>{m(A)}</div>
              <div className="formel">Anlægsaktiver + Omsætningsaktiver</div>
              <div className="formel">{m(A1)} + {m(A2)}</div>
            </div>
          </div>

          <div className="dp-branches" style={{ marginTop: 12 }}>
            <div className="dp-box">
              <div className="lab">Omkostninger i alt</div>
              <div className="big" style={{ fontSize: 18 }}>{m(K)}</div>
              <div className="formel">Vareforbrug + Kapacitetsomkostninger</div>
              <div className="formel">{m(VF)} + {m(KAP)}</div>
            </div>
            <div className="dp-op" />
            <div className="dp-box">
              <div className="lab">Omsætningsaktiver</div>
              <div className="big" style={{ fontSize: 18 }}>{m(A2)}</div>
              <div className="formel">Varelager + Debitorer + Likvider</div>
              <div className="formel">{m(LG)} + {m(DB)} + {m(LK)}</div>
            </div>
          </div>

          <p className="ra-eyebrow" style={{ margin: "30px 0 10px" }}>Fra afkastningsgrad til egenkapitalens forrentning</p>
          <div className="dp-eq">EKF = Afkastningsgrad + (Afkastningsgrad − lånerente) × finansiel gearing</div>
          <div className="dp-branches" style={{ gridTemplateColumns: "1fr" }}>
            <div className="dp-box" style={{ textAlign: "left" }}>
              <div className="formel" style={{ fontSize: 13, color: "var(--navy)" }}>
                Afkastningsgrad = <b>{pct(AG)}</b><br />
                Lånerente = <b>{pct(r)}</b> &nbsp;→&nbsp; (AG − lånerente) = <b>{pct(AG - r)}</b><br />
                Finansiel gearing = Gæld / Egenkapital = {m(G)} / {m(E)} = <b>{E > 0 ? f2(gearing) : "–"}</b><br />
                Gearingens bidrag = (AG − lånerente) × gearing = <b>{E > 0 ? (loft >= 0 ? "+" : "") + pct(loft) : "–"}</b>
              </div>
            </div>
          </div>
          <div className="dp-conn" />
          <div style={{ maxWidth: 320, margin: "0 auto" }}>
            <div className="dp-box dp-result">
              <div className="lab">Egenkapitalens forrentning</div>
              <div className="big">{EKF === null ? "–" : pct(EKF)}</div>
              <div className="formel">Årets resultat × 100 / Egenkapital</div>
            </div>
          </div>
          <div className="ra-callout">
            {E <= 0 ? (
              <span>Egenkapitalen er nul eller negativ med de valgte tal, så egenkapitalens forrentning kan ikke beregnes meningsfuldt. Sæt gælden lavere end aktiverne.</span>
            ) : AG > r ? (
              <span><b>Afkastningsgraden ({pct(AG)}) er højere end lånerenten ({pct(r)})</b>, så gearingen <b>løfter</b> egenkapitalens forrentning over afkastningsgraden. Jo højere gearing, jo større løft – men også jo større risiko.</span>
            ) : AG < r ? (
              <span><b>Afkastningsgraden ({pct(AG)}) er lavere end lånerenten ({pct(r)})</b>, så gearingen <b>trækker</b> egenkapitalens forrentning ned under afkastningsgraden. Her koster gælden mere, end aktiverne forrenter.</span>
            ) : (
              <span>Afkastningsgraden er lig lånerenten, så gearingen hverken løfter eller sænker egenkapitalens forrentning.</span>
            )}
          </div>
        </div>

        <div className="dp-side">
          <p className="ra-eyebrow" style={{ margin: "4px 0 10px" }}>Juster tallene</p>
          <div className="ra-tablewrap" style={{ padding: "14px 16px", marginBottom: 0 }}>
            <div className="dp-side-sliders">
              {sliders.map((s) => (
                <div className="dp-slider" key={s.k}>
                  <div className="row"><span>{s.label}</span><span className="val">{s.fmt(v[s.k])}{s.suf}</span></div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={v[s.k]} onChange={set(s.k)} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--slate)" }}>
              Beløb i 1.000 kr. · Omk. = <b>{m(K)}</b> · Resultat = <b>{m(R)}</b> · Oms.aktiver = <b>{m(A2)}</b> · Aktiver = <b>{m(A)}</b> · Egenkapital = <b>{m(E)}</b>
            </div>
            <div style={{ marginTop: 10 }}>
              <button className="ra-btn sec sm" onClick={() => setV(DEF)}>Nulstil</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: "var(--slate)", fontStyle: "italic" }}>
        Simuleringen bruger den (før skat) sammenhæng, der ligger til grund for DuPont-modellen, og illustrerer mekanikken. I et rigtigt regnskab beregnes egenkapitalens forrentning som årets resultat efter renter og skat i forhold til egenkapitalen, så tallet kan afvige.
      </div>

      <p className="ra-eyebrow" style={{ margin: "34px 0 10px" }}>Uddybende forklaring</p>
      <div className="ra-callout">
        <b>Om afkastningsgraden.</b> Afkastningsgraden er rentabilitetsanalysens
        vigtigste nøgletal. Den måler, hvor godt virksomheden forrenter <i>al</i>
        {" "}den kapital, der er bundet i virksomheden – uanset om kapitalen kommer
        fra ejerne eller fra långivere. Derfor holdes den op mod markedsrenten:
        kan virksomheden ikke forrente kapitalen bedre, end pengene ville give i
        banken, er der et problem. Pyramiden viser, at afkastningsgraden kan
        forbedres ad to veje – enten ved at tjene mere pr. omsætningskrone (højere
        overskudsgrad) eller ved at skabe mere omsætning med den samme kapital
        (højere omsætningshastighed). De to kan udveksles: et supermarked har lav
        overskudsgrad, men høj omsætningshastighed, mens en guldsmed har høj
        overskudsgrad og lav hastighed. Skru på den ene og den anden i
        simuleringen – afkastningsgraden kan ende det samme sted ad to helt
        forskellige veje.
      </div>
      <div className="ra-callout">
        <b>Om egenkapitalens forrentning.</b> Hvor afkastningsgraden ser på hele
        den investerede kapital, viser egenkapitalens forrentning, hvad <i>ejerne</i>
        {" "}får ud af netop deres indskud – og det er derfor det nøgletal, en
        investor kigger mest på. Sammenhængen til afkastningsgraden går gennem
        gearingen: når virksomheden låner penge til en rente, der er lavere end
        afkastningsgraden, tjener den mere på de lånte penge, end de koster, og
        den ekstra gevinst tilfalder ejerne. Derfor ligger egenkapitalens
        forrentning over afkastningsgraden, når gearingen er positiv. Men
        løftestangen virker begge veje: falder afkastningsgraden under lånerenten,
        forstærker gearingen tabet, og forrentningen falder under
        afkastningsgraden. Høj gearing giver altså højere forventet forrentning,
        men også højere risiko – det er kernen i afvejningen mellem egenkapital og
        fremmedkapital.
      </div>
    </div>
  );
}

function lavSpoergsmaal() {
  const out = [];
  const pulje = shuffle(NOEGLETAL);
  let p = 0;
  const omraadeNavne = GRUPPE_NOEGLER.map((k) => GRUPPER[k].navn);

  // Type 1 – Hvad siger nøgletallet? (7): vælg den rigtige betydning
  for (let c = 0; c < 7 && p < pulje.length; c++, p++) {
    const n = pulje[p];
    const dist = shuffle(NOEGLETAL.filter((x) => x.id !== n.id && x.beskrivelse !== n.beskrivelse)).slice(0, 3);
    const valg = shuffle([n, ...dist]);
    out.push({
      type: "viser", eyebrow: "Hvad siger nøgletallet?",
      spm: `Hvad fortæller "${n.navn}"?`,
      valg: valg.map((x) => ({ tekst: x.beskrivelse, rigtig: x.id === n.id })),
      forklaring: `"${n.navn}" hører til ${GRUPPER[n.gruppe].navn}.${n.note ? " " + n.note : ""}`,
    });
  }

  // Type 2 – Find nøgletallet (5): fra betydning til navn
  for (let c = 0; c < 5 && p < pulje.length; c++, p++) {
    const n = pulje[p];
    const dist = shuffle(NOEGLETAL.filter((x) => x.id !== n.id && x.navn !== n.navn)).slice(0, 3);
    const valg = shuffle([n, ...dist]);
    out.push({
      type: "maaler", eyebrow: "Find nøgletallet",
      spm: "Hvilket nøgletal passer på beskrivelsen?",
      cue: n.beskrivelse,
      valg: valg.map((x) => ({ tekst: x.navn, rigtig: x.id === n.id })),
      forklaring: `Det er "${n.navn}" fra ${GRUPPER[n.gruppe].navn}.`,
    });
  }

  // Type 3 – Hvilket område hører nøgletallet til? (5)
  for (let c = 0; c < 5 && p < pulje.length; c++, p++) {
    const n = pulje[p];
    const korrekt = GRUPPER[n.gruppe].navn;
    const andre = shuffle(omraadeNavne.filter((nv) => nv !== korrekt)).slice(0, 3);
    const valg = shuffle([korrekt, ...andre]);
    out.push({
      type: "omraade", eyebrow: "De fem områder",
      spm: `Hvilket analyseområde hører "${n.navn}" til?`,
      valg: valg.map((nv) => ({ tekst: nv, rigtig: nv === korrekt })),
      forklaring: `"${n.navn}" er et nøgletal under ${korrekt} – ${GRUPPER[n.gruppe].kort}`,
    });
  }

  // Type 4 – Kernespørgsmålet i et område (3)
  shuffle(GRUPPE_NOEGLER).slice(0, 3).forEach((k) => {
    const andre = shuffle(GRUPPE_NOEGLER.filter((x) => x !== k)).slice(0, 3);
    const valg = shuffle([k, ...andre]);
    out.push({
      type: "omraadeFokus", eyebrow: "De fem områder",
      spm: `Hvad er kernespørgsmålet i analyseområdet "${GRUPPER[k].navn}"?`,
      valg: valg.map((x) => ({ tekst: GRUPPER[x].kort, rigtig: x === k })),
      forklaring: `${GRUPPER[k].navn}: ${GRUPPER[k].formaal}`,
    });
  });

  return shuffle(out);
}

function QuizView() {
  const [spm, setSpm] = useState(lavSpoergsmaal);
  const [idx, setIdx] = useState(0);
  const [valg, setValg] = useState(null);
  const [score, setScore] = useState(0);
  const [faerdig, setFaerdig] = useState(false);
  const aktuel = spm[idx];
  function svar(v, i) { if (valg !== null) return; setValg(i); if (v.rigtig) setScore((s) => s + 1); }
  function naeste() { setValg(null); if (idx + 1 >= spm.length) setFaerdig(true); else setIdx((i) => i + 1); }
  function genstart() { setSpm(lavSpoergsmaal()); setIdx(0); setValg(null); setScore(0); setFaerdig(false); }
  if (faerdig) {
    const pct = Math.round((score / spm.length) * 100);
    const ros = pct >= 90 ? "Fremragende – du har styr på nøgletallene!" : pct >= 70 ? "Flot – du er godt på vej." : pct >= 50 ? "Godt forsøg – repetér i Nøgletal-fanen." : "Brug lidt mere tid i Nøgletal-fanen og prøv igen.";
    return (
      <div className="ra-fade">
        <div className="ra-panel">
          <p className="ra-eyebrow">Resultat</p>
          <div className="ra-prompt">{score} / {spm.length}</div>
          <div className="ra-sub">{pct} % rigtige</div>
          <div className="ra-callout" style={{ textAlign: "center" }}>{ros}</div>
          <div style={{ marginTop: 20 }}><button className="ra-btn" onClick={genstart}>Prøv igen</button></div>
        </div>
      </div>
    );
  }
  return (
    <div className="ra-fade">
      <div className="ra-score">
        <div className="item"><div className="num">{idx + 1}/{spm.length}</div><div className="cap">Spørgsmål</div></div>
        <div className="item"><div className="num">{score}</div><div className="cap">Rigtige</div></div>
      </div>
      <div className="ra-panel">
        <p className="ra-eyebrow">{aktuel.eyebrow || "Spørgsmål"}</p>
        <div className="ra-prompt" style={{ fontSize: "clamp(19px,3.8vw,26px)" }}>{aktuel.spm}</div>
        {aktuel.kode && <div className="ra-sub ra-mono" style={{ marginTop: 8 }}>{aktuel.kode}</div>}
        {aktuel.cue && <div className="ra-sub" style={{ marginTop: 10, fontStyle: "italic" }}>«{aktuel.cue}»</div>}
        <div className="ra-opts">
          {aktuel.valg.map((v, i) => {
            let cls = "ra-opt";
            if (valg !== null) { if (v.rigtig) cls += " correct"; else if (i === valg) cls += " wrong"; }
            return <button key={i} className={cls} disabled={valg !== null} onClick={() => svar(v, i)}>{v.tekst}</button>;
          })}
        </div>
        {valg !== null && (<><div className="ra-callout">{aktuel.forklaring}</div>
          <div style={{ marginTop: 18 }}><button className="ra-btn" onClick={naeste}>{idx + 1 >= spm.length ? "Se resultat" : "Næste →"}</button></div></>)}
      </div>
    </div>
  );
}

const TABS = [
  { id: "intro", label: "Sådan virker det" },
  { id: "ref", label: "Nøgletal" },
  { id: "dupont", label: "DuPont" },
  { id: "analyse", label: "Analyseopgave" },
  { id: "quiz", label: "Quiz" },
];

export default function App() {
  const [tab, setTab] = useState("intro");
  return (
    <div className="ra-root">
      <Styles />
      <div className="ra-wrap">
        <header>
          <p className="ra-eyebrow">Erhvervsakademi Dania · Markedsføringsøkonom AK · Forløb 2</p>
          <h1 className="ra-h1">Regnskabsanalyse</h1>
          <p className="ra-lead">
            Et læringsværktøj til regnskabsanalyse. AI klarer beregningen – du
            lærer de 28 nøgletal, forstår de fem analyseområder og træner at
            argumentere ud fra rigtige virksomheders tal.
          </p>
        </header>
        <nav className="ra-tabs">
          {TABS.map((t) => (<button key={t.id} className={"ra-tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>{t.label}</button>))}
        </nav>
        <main key={tab}>
          {tab === "intro" && <IntroView />}
          {tab === "ref" && <ReferenceView />}
          {tab === "dupont" && <DuPontView />}
          {tab === "analyse" && <AnalyseView />}
          {tab === "quiz" && <QuizView />}
        </main>
        <footer className="ra-footer">
          28 nøgletal · 5 analyseområder · 3 cases (let/mellem/svær) + AI-genereret sæt. Nøgletal følger lærebogens Bilag 2. Feedback og vejledende besvarelser laves af Claude og er vejledende.
        </footer>
      </div>
    </div>
  );
}
