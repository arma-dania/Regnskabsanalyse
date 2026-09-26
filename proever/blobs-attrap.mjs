// Står i stedet for @netlify/blobs under afprøvning. Samme lille flade,
// men alt ligger i hukommelsen.
const butik = new Map();
export function getStore() {
  return {
    async get(n) { const v = butik.get(n); return v === undefined ? null : JSON.parse(v); },
    async setJSON(n, v) { butik.set(n, JSON.stringify(v)); },
    async delete(n) { butik.delete(n); },
    async list({ prefix = "" } = {}) {
      return { blobs: [...butik.keys()].filter(k => k.startsWith(prefix)).sort().map(key => ({ key })) };
    },
  };
}
export const _noegler = () => [...butik.keys()];
export const _ryd = () => butik.clear();
