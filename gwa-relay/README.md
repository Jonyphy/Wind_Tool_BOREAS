# Global Wind Atlas relay (optional)

`wind.html` cannot download the Global Wind Atlas wind climate (.lib) by
itself: the GWA server does not accept requests from other web pages. Without
this relay you load the file by hand (see below). With it, the wind rose page
gets the GWA rose automatically.

## Set it up (Cloudflare Workers, free plan, about 5 minutes)

1. Log in at dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
2. Give it a name (e.g. `boreas-gwa`), click **Deploy**, then **Edit code**.
3. Replace the code with the contents of `worker.js`, click **Deploy**.
4. Optional: **Settings → Variables** → add `ALLOWED_ORIGIN` with your site's
   address (e.g. `https://jonyphy.github.io`) so only your page can use it.
5. Copy the worker address (e.g. `https://boreas-gwa.<you>.workers.dev`).
6. In `wind.html`, paste it into **GWA relay URL** (saved in your browser).
   To set it for everyone, put it in `GWA_RELAY_DEFAULT` near the top of the
   script in `wind.html`.

Test: open `https://boreas-gwa.<you>.workers.dev/?lat=50.98&long=11.03` — you
should see the .lib text.

The relay does the same thing as `windrsf/gwc.py`: it sends the request with a
`Referer: https://globalwindatlas.info` header, tries GWA 4.0 first and 3.x
as a fallback, and caches each point for a day.

## Without the relay

- `python make_gwa_lib.py --lat 50.98 --lon 11.03` in the windrsf repo, then
  load the .lib in the page, or
- globalwindatlas.info → click the point → download the generalized wind
  climate (.lib) → load it in the page.

Respect the Global Wind Atlas terms of use (globalwindatlas.info/about/TermsOfUse).
