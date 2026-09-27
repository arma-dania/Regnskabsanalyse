// Står i stedet for @anthropic-ai/sdk under afprøvning. Svarer i samme form
// som modellen skal, ud fra hvilken prompt der kommer ind – så hele kæden fra
// knap til underviserens overblik kan afprøves uden nøgle og uden forbrug.
//
// Den sidste prompt gemmes, så prøverne kan se, hvad der faktisk blev sendt.
export let sidstePrompt = null;
export const kald = [];

class APIError extends Error { constructor(status, m) { super(m); this.status = status; } }
class AuthenticationError extends APIError {}
class RateLimitError extends APIError {}
class APIConnectionTimeoutError extends APIError {}

function svarPaa(prompt) {
  if (prompt.includes("Opfind en realistisk")) {
    const omr = ["rentabilitet", "indtjeningsevne", "kapital", "soliditet", "boers"];
    return JSON.stringify({
      navn: "Prøve Handel ApS", branche: "Grossist", beskrivelse: "En prøve.",
      forretningsmodel: "Køber stort ind og sælger videre på kredit.",
      ledelsesberetning: "Et godt år.",
      analyse: Object.fromEntries(omr.map(o => [o, [{ n: "Nøgletal", a: "1", b: "2", udv: "↑" }]])),
    });
  }
  if (prompt.includes("SAMLEDE KONKLUSION"))
    return "Hænger det sammen på tværs: delvist – to områder står alene.\nTrin 4 – Forretningsmodellen: delvist – modellen nævnes, men anbefalingen mangler.\nNæste skridt: slut med en anbefaling.\n\n---VURDERING---\n{\"t4\":\"delvist\",\"paatvaers\":\"delvist\",\"temaer\":[\"forretningsmodel-ubrugt\"]}";
  if (prompt.includes("eksemplarisk"))
    return "Trin 1 – Konstatering: AG steg fra 27,7 % til 33,8 %.\nTrin 2 – Forklaring: Overskudsgraden trak.\nTrin 3 – Vurdering: Højt mod markedsrenten.";
  // Feedback pr. område. Står ordet UDEN-MARKOER i den studerendes tekst,
  // svarer attrappen uden den strukturerede del – så det kan afprøves, at
  // feedbacken stadig kommer frem.
  if (prompt.includes("UDEN-MARKOER")) return "Trin 1 – Konstatering: nået – fint.";
  const niveau = prompt.includes("GODT-SVAR") ? "naaet" : "delvist";
  return `Trin 1 – Konstatering: nået – tallene er med.\nTrin 2 – Forklaring: ${niveau} – årsagen er antydet.\nTrin 3 – Vurdering: mangler – ingen målestok.\nNæste skridt: nævn markedsrenten.\n\n---VURDERING---\n{"t1":"naaet","t2":"${niveau}","t3":"${niveau === "naaet" ? "naaet" : "mangler"}","temaer":["ingen-maalestok"]}`;
}

export default class Anthropic {
  static APIError = APIError;
  static AuthenticationError = AuthenticationError;
  static RateLimitError = RateLimitError;
  static APIConnectionTimeoutError = APIConnectionTimeoutError;
  constructor(opts) { this.opts = opts; }
  beta = {
    messages: {
      create: async params => {
        sidstePrompt = params.messages[0].content;
        kald.push(params);
        return { stop_reason: "end_turn", content: [{ type: "text", text: svarPaa(sidstePrompt) }] };
      },
    },
  };
}
