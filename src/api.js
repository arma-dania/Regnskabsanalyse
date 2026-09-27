// Klientens forbindelse til serveren. Alle kald går herigennem, så fejl
// behandles ens: serverens egen besked vises, og ellers en generisk.

export class ApiFejl extends Error {
  constructor(besked, status) {
    super(besked);
    this.status = status;
  }
}

export async function api(metode, sti, krop) {
  let svar;
  try {
    svar = await fetch(sti, {
      method: metode,
      headers: krop === undefined ? {} : { "content-type": "application/json" },
      body: krop === undefined ? undefined : JSON.stringify(krop),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiFejl("Ingen forbindelse. Tjek internettet, og prøv igen.", 0);
  }
  let data = null;
  try {
    data = await svar.json();
  } catch {
    // Et svar uden JSON er typisk platformens egen fejlside – fx når en
    // funktion rammer Netlifys tidsgrænse.
  }
  if (!svar.ok) {
    const standard =
      svar.status === 502 || svar.status === 504
        ? "Det tog for lang tid at få svar. Prøv igen."
        : "Der gik noget galt. Prøv igen om lidt.";
    throw new ApiFejl(data?.fejl || standard, svar.status);
  }
  return data;
}

// Hændelser er et bihverv. Fejler de, må det aldrig mærkes af den studerende.
export function noter(type, detalje) {
  api("POST", "/api/haendelse", detalje ? { type, detalje } : { type }).catch(() => {});
}
