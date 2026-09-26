// Prøveserver. Kører de rigtige funktionsfiler fra netlify/functions, men
// med et lager i hukommelsen i stedet for Netlify Blobs og en attrap i stedet
// for Claude, så hele forløbet kan afprøves uden at deploye, uden nøgle og
// uden at røre rigtige data.
//
//   npm run proeve     kører prøverne
//   npm run server     starter serveren på http://localhost:8787
//                      (kør "npm run build" først, så siden er bygget)
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROD = path.resolve(import.meta.dirname, "..");

// Bytter @netlify/blobs og @anthropic-ai/sdk ud, før funktionerne indlæses.
registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "@netlify/blobs")
      return { url: pathToFileURL(path.join(ROD, "proever/blobs-attrap.mjs")).href, shortCircuit: true };
    if (spec === "@anthropic-ai/sdk")
      return { url: pathToFileURL(path.join(ROD, "proever/anthropic-attrap.mjs")).href, shortCircuit: true };
    return next(spec, ctx);
  },
});

process.env.SESSION_HEMMELIGHED ??= "proevehemmelighed";
// Koderne hedder "kun-lokal-proeve-", fordi de står i et offentligt repo.
// Sættes en af dem som rigtig kode i Netlify, kan enhver læse den på GitHub
// – navnet skal gøre det åbenlyst, at de ikke er til det.
process.env.ANTHROPIC_API_KEY ??= "kun-lokal-proeve-noegle";
process.env.UNDERVISER_ARNE ??= "kun-lokal-proeve-arne";
process.env.UNDERVISER_HELLE ??= "kun-lokal-proeve-helle";
process.env.UNDERVISER_RASMUS ??= "kun-lokal-proeve-rasmus";

const api = (await import(path.join(ROD, "netlify/functions/api.mjs"))).default;
const admin = (await import(path.join(ROD, "netlify/functions/admin.mjs"))).default;

const TYPER = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };

export function start(port = 8787) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");

    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin-api/")) {
      const bidder = [];
      for await (const b of req) bidder.push(b);
      const forespoergsel = new Request("http://localhost" + req.url, {
        method: req.method,
        headers: { ...req.headers, "x-nf-client-connection-ip": req.headers["x-proeve-ip"] ?? "1.2.3.4" },
        body: bidder.length ? Buffer.concat(bidder) : undefined,
      });
      const svar = await (url.pathname.startsWith("/admin-api/") ? admin : api)(forespoergsel, {});
      res.writeHead(svar.status, Object.fromEntries(svar.headers));
      res.end(Buffer.from(await svar.arrayBuffer()));
      return;
    }

    // Kun den byggede side serveres – præcis som Netlify gør det.
    const fil = url.pathname === "/" ? "/index.html" : url.pathname === "/underviser" ? "/underviser.html" : url.pathname;
    try {
      // Filen læses FØR statuslinjen sendes – ellers kan 404'eren ikke
      // skrives, når filen mangler, og serveren vælter i stedet.
      const indhold = await readFile(path.join(ROD, "dist", fil));
      res.writeHead(200, { "content-type": TYPER[path.extname(fil)] || "application/octet-stream" });
      res.end(indhold);
    } catch {
      res.writeHead(404).end("ikke fundet – er siden bygget med npm run build?");
    }
  });
  return new Promise(klar => server.listen(port, () => klar(server)));
}

if (process.argv[1] === import.meta.filename) {
  await start();
  console.log("Prøveserver på http://localhost:8787 – underviser på /underviser (kode: kun-lokal-proeve-arne)");
}
