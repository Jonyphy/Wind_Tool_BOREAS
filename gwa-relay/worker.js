// BOREAS · Global Wind Atlas relay (Cloudflare Worker)
//
// The Global Wind Atlas server does not accept requests from other web pages,
// so wind.html cannot download the .lib wind climate by itself. This worker
// fetches it on the server side and passes it back with CORS headers.
//
//   GET https://<your-worker>.workers.dev/?lat=50.98&long=11.03[&version=4]
//
// Optional environment variable ALLOWED_ORIGIN (e.g. https://jonyphy.github.io)
// limits which site may use the relay. Without it, any site may.

const GWA = 'https://globalwindatlas.info/api/gwa/custom/Lib/';

// Same version candidates as windrsf/gwc.py: the first one that returns a
// valid .lib wins; 3.x is the fallback.
const CANDIDATES = {
  4: [{ version: '4' }, { release: '4' }, {}],
  3: [{ version: '3' }, {}],
};

function looksLikeLib(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 5) return false;
  const [nr, nh, ns] = lines[1].trim().split(/\s+/).map(Number);
  if (!(nr >= 1 && nr <= 20 && nh >= 1 && nh <= 20 && ns >= 4 && ns <= 36)) return false;
  return lines.length >= 4 + nr * (2 * nh + 1);
}

function cors(origin, env) {
  const allow = env.ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': allow === '*' ? '*' : (origin === allow ? allow : 'null'),
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const h = cors(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers: h });
    if (request.method !== 'GET') return new Response('GET only', { status: 405, headers: h });

    const url = new URL(request.url);
    const lat = Number(url.searchParams.get('lat'));
    const lon = Number(url.searchParams.get('long') ?? url.searchParams.get('lon'));
    const want = url.searchParams.get('version') === '3' ? 3 : 4;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return new Response('lat and long are required', { status: 400, headers: h });
    }

    // cache one day per point and version
    const key = new Request(`https://gwa-cache/${want}/${lat.toFixed(4)}/${lon.toFixed(4)}`);
    const cache = caches.default;
    const hit = await cache.match(key);
    if (hit) return new Response(hit.body, { headers: { ...Object.fromEntries(hit.headers), ...h } });

    const tried = [];
    for (const v of [want, want === 4 ? 3 : 4]) {
      for (const extra of CANDIDATES[v]) {
        const q = new URLSearchParams({ lat: lat.toFixed(6), long: lon.toFixed(6), ...extra });
        try {
          const r = await fetch(`${GWA}?${q}`, { headers: { Referer: 'https://globalwindatlas.info' } });
          const buf = await r.arrayBuffer();
          const text = new TextDecoder('latin1').decode(buf);
          if (r.ok && looksLikeLib(text)) {
            const res = new Response(text, {
              headers: {
                'Content-Type': 'text/plain; charset=latin-1',
                'Cache-Control': 'public, max-age=86400',
                'X-GWA-Version': String(v),
                'Access-Control-Expose-Headers': 'X-GWA-Version',
              },
            });
            ctx.waitUntil(cache.put(key, res.clone()));
            return new Response(res.body, { headers: { ...Object.fromEntries(res.headers), ...h } });
          }
          tried.push(`v${v} ${JSON.stringify(extra)}: HTTP ${r.status}, not a .lib`);
        } catch (e) {
          tried.push(`v${v} ${JSON.stringify(extra)}: ${e.message}`);
        }
      }
    }
    return new Response('Global Wind Atlas did not return a .lib:\n' + tried.join('\n'),
      { status: 502, headers: h });
  },
};
