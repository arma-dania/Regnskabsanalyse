# Regnskabsanalyse – undervisningsværktøj

Interaktivt værktøj til regnskabsanalyse for Markedsføringsøkonom (AK),
Forløb 3 "Værdiskabelse i praksis". De studerende logger ind med en personlig
kode, analyserer tre faste cases (eller et AI-genereret sæt) og skriver sig op
ad **formuleringstrappen**. Underviseren følger aktivitet, niveau og de
udfordringer, der går igen – men ikke de studerendes tekster.

## Formuleringstrappen

| Trin | Spørgsmål | Hvor |
| --- | --- | --- |
| 1 Konstatering | Hvad er der sket? | Pr. analyseområde |
| 2 Forklaring | Hvorfor er det sket? | Pr. analyseområde |
| 3 Vurdering | Er det godt eller skidt – målt mod hvad? | Pr. analyseområde |
| 4 Forretningsmodellen | Hvad betyder det for måden, virksomheden tjener penge på – og hvad skal ledelsen gøre? | Den samlede konklusion |

Trin 4 hører til konklusionen, fordi koblingen til forretningsmodellen først kan
laves, når alle fem områder er læst. Hver case har derfor en beskrivelse af sin
forretningsmodel. På den svære case er den skjult, til den studerende selv har
prøvet at læse den ud af tallene – samme bevægelse som i *Gæt
forretningsmodellen* fra Sprint 2.

Trin 3 og 4 er skåret, så de ikke glider sammen: trin 3 vurderer tallet mod en
**navngivet målestok** (sidste år, branchen, markedsrenten, en
tommelfingerregel); trin 4 drager **konsekvensen for forretningsmodellen** og
ender i en anbefaling.

Trinnene, deres hjælpetekster og kravene til hvert niveau står ét sted:
`netlify/functions/lib/trappe.mjs`. Både prompterne til Claude og
brugerfladen læser derfra.

## Sådan bruges det

**De studerende** går til forsiden og logger ind med koden fra dig. I
*Analyseopgave* skriver de trin 1–3 for hvert område i tre felter og får
feedback trin for trin, med et mærke pr. trin: *nået*, *delvist* eller
*mangler*. Hvert trin vurderes på sine egne betingelser – en konstatering
kritiseres ikke for at mangle en forklaring. Den samlede konklusion vurderes
på trin 4, og på om de fem områder hænger sammen.

**Underviseren** går til `/underviser` og logger ind med sin egen kode.

1. Opret et hold, og indsæt listen over studerende – ét navn pr. linje.
   Fornavn og forbogstav er nok.
2. Tryk *Udskriv kodeliste*. Kun navne og koder kommer med på udskriften.
3. Følg holdet på holdets side:

| Del | Hvad den viser |
| --- | --- |
| Tallene øverst | Studerende, hvor mange der har logget ind, aktive i dag og seneste 7 dage |
| Studerende i gang pr. dag | Aktivitet de seneste 28 dage |
| Tag fat i | Aldrig logget ind · inaktiv i 7 dage · sidder fast (mindst 3 forsøg på et område uden at komme over trin 1, og intet trin på vej) |
| Hvor langt op ad trappen | Pr. område: hvor mange der står på hvert niveau. Og for trin 4. Samt hvilket trin flest går i stå før |
| Udfordringer, der går igen | De temaer, mindst to studerende har – med et forslag til, hvad lektionen kan gøre |
| Studerende | Pr. person: sidst aktiv, dage aktiv, antal feedback, niveau pr. område, trin 4 og personens temaer. Sortérbar. Koderne er skjult, til du beder om dem |

`Hent CSV` giver samme tal i en fil til Excel – uden koder.

### Hvad "niveau" betyder

Niveauet på et område er antallet af trin **nedefra, der er nået i træk**, i
det bedste forsøg på tværs af cases. Et nået trin 3 oven på et manglende trin 2
tæller som niveau 1: det er en vurdering uden fundament. En halv søjle betyder,
at næste trin er *delvist* nået – den studerende er på vej.

### Hvad vurderingen er, og hvad den ikke er

Trinvurderingen og temaerne er Claudes skøn over et fagligt ræsonnement på
dansk. Det er et fingerpeg om, hvor lektionen skal bruge tid, ikke en karakter.
Derfor kun tre niveauer, og derfor vises et tema først på holdniveau, når
mindst to studerende har det – ét tilfælde siger noget om den ene, ikke om
holdet.

Temaerne er en **lukket liste** i `trappe.mjs` (fx *Vurderer uden at holde
tallet op mod noget*, *Bytter årsag og virkning om*, *Kobler ikke tallene til
forretningsmodellen*). Fri tekst kan ikke tælles sammen. Ser du en udfordring,
der mangler, så tilføj en linje – den er med ved næste feedback.

## Hvad der gemmes – og hvad der ikke gemmes

**Gemmes** (i Netlify Blobs): holdets navn; den studerendes navn og kode; for
hvert område det seneste og det bedste trinniveau, antal forsøg og højst to
temamærkater; en log over handlinger (login, feedback, vejledende besvarelse,
fanebesøg, afsluttet quiz) med tidspunkt.

**Gemmes ikke:** det, de studerende skriver. Teksten sendes til Claude for at
få feedback og forsvinder derefter. Det står også på login-siden, så de
studerende ved det. Prøverne i `proever/api.proeve.mjs` kontrollerer, at en
analysetekst aldrig lander i lageret.

Udkast gemmes i den studerendes egen browser (så en genindlæsning ikke sletter
en halv analyse), men aldrig på serveren. Det er en bekvemmelighed, ikke en
aflevering – rapporten downloades som Word.

Navne og aktivitet er personoplysninger, og akademiet er dataansvarlig. Afklar
med IT eller jeres DPO, om en selvbygget løsning på en privat Netlify-konto
må bruges, før den tages i brug på rigtige hold – samme forbehold som for
*Gæt forretningsmodellen*. Det, der begrænser omfanget:

- **Ingen studienumre.** Et nummer forrest på en linje kastes væk.
- **Ingen analysetekster** på serveren.
- **Slet holdet ved semesterslut.** Knappen nederst på holdets side fjerner
  studerende, koder, trinvurderinger og aktivitet i ét greb og kræver, at du
  skriver holdets navn. En enkelt studerende kan også slettes med alt, hvad
  der er gemt om vedkommende.

## Sådan sætter du det op

### 1. Kobl Netlify til repoet
1. netlify.com → **Add new site → Import an existing project** → GitHub → dette repo.
2. Byggeindstillingerne læses fra `netlify.toml`. Byggekommandoen kører først
   prøverne og stopper deployet, hvis de fejler.

### 2. Miljøvariabler
**Site configuration → Environment variables**. Scope skal omfatte
**Functions**.

| Variabel | Værdi |
| --- | --- |
| `ANTHROPIC_API_KEY` | Nøglen fra console.anthropic.com |
| `SESSION_HEMMELIGHED` | En tilfældig streng på mindst 32 tegn. Underskriver login-cookien |
| `UNDERVISER_ARNE` | Arnes kode |
| `UNDERVISER_HELLE` | Helles kode |
| `UNDERVISER_RASMUS` | Rasmus' kode |

Alle koder og hemmeligheden skal være tilfældige. Nemmest: åbn Chrome →
højreklik → **Undersøg** → **Console** → skriv `crypto.randomUUID()` og tryk
Enter; gentag for hver variabel. Er en underviserkode ikke sat, kan den
underviser ikke logge ind; de øvrige er upåvirkede. Kan du genbruge værdierne
fra *Gæt forretningsmodellen*? Ja for underviserkoderne, hvis du vil – men giv
`SESSION_HEMMELIGHED` sin egen værdi.

Deploy derefter igen (**Deploys → Trigger deploy**) – ændringer i
miljøvariabler slår først igennem ved en ny deploy.

### 3. Netlify Blobs
Hold, studerende og trin gemmes i Netlify Blobs. Er det ikke slået til, siger
første kald til; det tændes under **Site configuration → Blobs**.

## Model, pris og svartid

AI-kaldene bruger `claude-opus-5` – samme model som *Gæt forretningsmodellen*,
fordi det er vurdering af fagligt ræsonnement på dansk. Modellen, effort og
tidsgrænsen står ét sted: `netlify/functions/lib/claude.mjs`.

**Svartid.** Feedback kaldes, mens den studerende venter, og en Netlify-funktion
har en tidsgrænse. Effort står derfor på `low`, og svarene er korte og stramt
formede. Får de studerende beskeden *"Det tog for lang tid at få svar"*, så hæv
funktionens tidsgrænse i Netlify, eller skift `MODEL` i `claude.mjs` til en
hurtigere model.

**Pris** (overslag): et feedbackkald er omkring 15–20 øre. En studerende, der
gennemarbejder én case med et par feedbackrunder pr. område, en konklusion og
nogle vejledende besvarelser, koster i størrelsesordenen 2–3 kr. Hver
studerende kan højst foretage 60 AI-kald i timen, så en fejl eller en knap, der
holdes nede, ikke kan løbe regningen op.

**Sikkerhed.** Tidligere lå der en åben proxy (`netlify/functions/claude.mjs`),
der sendte en hvilken som helst besked videre med nøglen – enhver med adressen
kunne bruge den. Den er fjernet. Nu bygger serveren selv prompterne, og kun
indloggede studerende kan kalde dem. De studerendes tekst rammes ind i prompten
som data, så "glem alle tidligere instruktioner" bliver vurderet, ikke adlydt.

## Kør og afprøv lokalt

```
npm install
npm run proeve     # prøverne: login, ejertjek, trinlogning, sletning, trappens logik
npm run server     # hele siden på http://localhost:8787 – underviser på /underviser
```

`npm run server` kører de rigtige funktionsfiler, men med et lager i
hukommelsen og en attrap i stedet for Claude. Der kræves hverken nøgle,
Netlify-konto eller deploy. Underviserkoden lokalt er `kun-lokal-proeve-arne`
(den virker kun på din egen maskine). Kræver Node 22.

## Filer

| Fil | Indhold |
| --- | --- |
| `src/App.jsx` | Værktøjet til de studerende: nøgletal, DuPont, analyseopgaven, quiz |
| `src/underviser.jsx` | Underviserens overblik |
| `src/api.js` | Klientens forbindelse til serveren |
| `netlify/functions/api.mjs` | De studerendes API |
| `netlify/functions/admin.mjs` | Underviserens API |
| `netlify/functions/lib/trappe.mjs` | **Trappen, temaerne og prompterne** |
| `netlify/functions/lib/overblik.mjs` | Sammentællingen til overblikket |
| `netlify/functions/lib/claude.mjs` | Kaldet til Claude: model, effort, fejl |
| `netlify/functions/lib/lager.mjs` | Lagring i Netlify Blobs |
| `netlify/functions/lib/auth.mjs` | Login: koder, sessioner |
| `netlify/functions/lib/undervisere.mjs` | Underviserne og deres miljøvariabler |
| `proever/` | Prøver og prøveserver |

Login, lagring og underviserkoder følger samme opbygning som *Gæt
forretningsmodellen*, så de to værktøjer vedligeholdes ens. Skal værktøjet
senere logge ind gennem Moodle (LTI), er det `lib/auth.mjs` og `src/api.js`,
der skiftes ud.
