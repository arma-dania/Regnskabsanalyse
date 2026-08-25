# Regnskabsanalyse – undervisningsværktøj

Interaktivt værktøj til regnskabsanalyse for Markedsføringsøkonom (AK),
Forløb 3 "Værdiskabelse i praksis". AI-funktionerne (feedback, vejledende
besvarelse, nyt sæt, feedback på konklusion) kaldes gennem en Netlify-funktion,
så din Anthropic-nøgle holdes hemmelig på serveren og de studerende **ikke**
skal logge ind nogen steder.

## Sådan sætter du det op

### 1. Læg projektet på GitHub
Enten med Git:
```
git init
git add .
git commit -m "Regnskabsanalyse-værktøj"
git branch -M main
git remote add origin https://github.com/<dit-brugernavn>/<dit-repo>.git
git push -u origin main
```
… eller via GitHub i browseren: opret et nyt, tomt repository, vælg
**Add file → Upload files**, og træk alle filerne herfra ind (behold mappe-
strukturen `src/` og `netlify/functions/`). Undlad at uploade `node_modules`
og `dist` — de bygges automatisk.

### 2. Kobl Netlify til repoet
1. Log ind på netlify.com → **Add new site → Import an existing project**.
2. Vælg GitHub og dit repository.
3. Byggeindstillingerne læses automatisk fra `netlify.toml`
   (build-kommando `npm run build`, publish-mappe `dist`,
   funktioner i `netlify/functions`). Tryk **Deploy**.

### 3. Læg din API-nøgle ind
1. I Netlify: **Site configuration → Environment variables → Add a variable**.
2. Key: `ANTHROPIC_API_KEY` — Value: din nøgle fra console.anthropic.com.
3. Gå til **Deploys → Trigger deploy → Deploy site** (ændringer i
   miljøvariabler kræver en ny deploy for at slå igennem).

Færdig. Dit offentlige link står øverst i Netlify.

## Godt at vide
- **Nøglen må aldrig i GitHub.** Den ligger kun som miljøvariabel i Netlify.
  `.env` er med i `.gitignore`.
- **Forbrug koster.** Hvert AI-kald (feedback, vejledende, nyt sæt) trækker på
  dit Anthropic-forbrug. De rene dele (nøgletal, DuPont, cases, quiz, Word-
  rapport) er gratis og kræver ingen nøgle.
- **Skift model:** i `src/App.jsx`, funktionen `callClaude`, står
  `model: "claude-sonnet-4-20250514"`. Den kan ændres til fx
  `claude-sonnet-4-6`.

## Kør lokalt (valgfrit)
```
npm install
npm run dev
```
De rene dele virker med det samme. Skal AI-funktionerne også virke lokalt,
kræver det Netlify CLI (`npm i -g netlify-cli`) og `netlify dev`, så
funktionen og miljøvariablen kører med.
