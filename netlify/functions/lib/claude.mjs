// Kaldet til Claude. Ét sted, så model, effort og fejlhåndtering kun skal
// ændres her.
//
// Før lå der en åben proxy i netlify/functions/claude.mjs, der sendte en
// hvilken som helst besked videre med din nøgle. Enhver med adressen kunne
// bruge den. Nu bygger serveren selv prompten, og kun indloggede studerende
// kan kalde den.

import Anthropic from "@anthropic-ai/sdk";
import { Opsaetningsfejl } from "./svar.mjs";

// claude-opus-5, fordi det er vurdering af fagligt ræsonnement på dansk, hvor
// kvaliteten er hele pointen – samme valg som i Forretningsmodellen.
//
// Effort "low", fordi kaldet er synkront: den studerende sidder og venter, og
// en Netlify-funktion har en tidsgrænse. Svarene er korte og stramt formede,
// så modellen behøver ikke tænke længe. Timer feedback ud efter deploy, er det
// her, der skrues – eller funktionens tidsgrænse i Netlify, der hæves.
const MODEL = "claude-opus-5";
const EFFORT = "low";

// Tidsgrænsen skal ligge under Netlifys egen, så den studerende får en
// forståelig besked i stedet for en bar 502 fra platformen.
const TIDSGRAENSE_MS = 20_000;

export class ClaudeFejl extends Error {}

let klient = null;
function hentKlient() {
  if (!process.env.ANTHROPIC_API_KEY)
    throw new Opsaetningsfejl(
      "ANTHROPIC_API_KEY er ikke sat i Netlify (Environment variables). Tjek at dens scope omfatter Functions, og deploy igen."
    );
  // Ét forsøg mere ved overbelastning eller netværksfejl – ikke flere, for
  // hvert forsøg lægger sig oven i den tid, den studerende venter.
  klient ??= new Anthropic({ timeout: TIDSGRAENSE_MS, maxRetries: 1 });
  return klient;
}

export async function spoerg(prompt, { maxTokens = 16000 } = {}) {
  let svar;
  try {
    svar = await hentKlient().beta.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      output_config: { effort: EFFORT },
      // Afviser modellens sikkerhedsfiltre et kald, kører Anthropic det om på
      // den model, de anbefaler til netop den slags afvisning. Det er ikke
      // sandsynligt ved regnskabsanalyse, men det koster intet at have med.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: prompt }],
    });
  } catch (e) {
    if (e instanceof Opsaetningsfejl) throw e;
    if (e instanceof Anthropic.AuthenticationError)
      throw new Opsaetningsfejl("ANTHROPIC_API_KEY afvises af Anthropic. Tjek nøglen i Netlify, og deploy igen.");
    if (e instanceof Anthropic.RateLimitError)
      throw new ClaudeFejl("Der er travlt lige nu. Vent et øjeblik, og prøv igen.");
    if (e instanceof Anthropic.APIConnectionTimeoutError)
      throw new ClaudeFejl("Det tog for lang tid at få svar. Prøv igen.");
    if (e instanceof Anthropic.APIError) {
      console.error("Anthropic svarede", e.status, e.message);
      throw new ClaudeFejl("Kunne ikke få svar lige nu. Prøv igen om lidt.");
    }
    throw e;
  }

  if (svar.stop_reason === "refusal")
    throw new ClaudeFejl("Teksten kunne ikke vurderes. Omformulér den, og prøv igen.");

  const tekst = svar.content
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("\n")
    .trim();
  if (!tekst) throw new ClaudeFejl("Der kom ikke noget svar. Prøv igen.");
  return tekst;
}
