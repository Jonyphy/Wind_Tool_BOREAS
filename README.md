# BOREAS · Wind Tools

Browser-based engineering tools for wind farm analysis. Every page is a single self-contained HTML file that runs client-side — no server and no data upload (the wind rose and the ERA5 options fetch public weather data, the account tracker uses a shared database). That makes the site easy to host on GitHub Pages or GitLab Pages.

## Pages

| File | Tool |
|---|---|
| `index.html` | Start page — links to every tool (add new tools here as cards) |
| **Curtailment losses** | |
| `fledermaus.html` | Bat (Fledermaus) curtailment losses — NZ windows, monthly thresholds, temperature filter; Weibull or time series; project files, bulk turbine import |
| `turbulence.html` | Turbulence curtailment losses — sector overlap between full and curtailed datasets, several scenarios |
| **Yield & probability** | |
| `pvalues.html` | Exceedance probabilities — P50 / P75 / P90 or any P-value from an annual energy sum and combined uncertainty |
| **Site data** | |
| `turbines.html` | Turbine table matcher — compare two turbine lists by name and position, copy types/hub heights/power across, 2 D spacing check |
| `wind.html` | Wind rose & main wind direction — ERA5, CERRA, ERA5-Land, ECMWF IFS, Global Wind Atlas, DWD station check; coordinates or shapefile |
| **Turbine files (.wtg)** — one card on the start page, both pages linked to each other | |
| `wtg-generator.html` | WTG generator — WAsP / windPRO .wtg file from manufacturer power and ct tables for the chosen air densities |
| `wtg-curtailment.html` | Curtailment WTGs — curtailed .wtg files per sector from a turbulence report's curtailment table, downloaded as ZIP |
| **Reporting & coordination** | |
| `bericht.html` | Report generator (Berichtsgenerator) — print-ready A3/A4 PDF with header data, site plans, Excel tables, sources and remarks |
| `konto.html` | Account tracker — live status of the shared Wake2e accounts with usage log |
| `gwa-relay/` | Optional Cloudflare Worker that lets the wind rose download Global Wind Atlas data automatically (see its README) |

## Host on GitHub Pages

1. Push all files in this folder to the repository root.
2. In the repository: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / root → Save**.
3. After a minute the site is live at `https://<your-username>.github.io/<repository>/`.

On GitLab, use GitLab Pages with a job that publishes the repository root as `public/`.

To add a new tool: copy one of the tool pages, replace the logic, and add a card in `index.html` (English and German text are in the `T` object at the bottom of the page).

## Fledermaus calculator — methods

**Weibull (sector statistics), windPRO style.** Per sector the wake Weibull is derived as `A_wake = A_free x (v_wake / v_free)` with unchanged `k`. Loss = frequency-weighted expected power below the threshold, multiplied by the active hours of each NZ window. Validated against the original Python script to machine precision (BN14 full AEP 20,320.7 MWh/a, +1.69 % vs. the windPRO reference of 19,982.5 MWh/a).

**Time series.** Each timestep of the meteo CSV inside an NZ window with valid temperature is checked directly: if wind < threshold, the power-curve value for that timestep counts as loss. This captures the correlation between night/summer hours and wind speed that the Weibull method averages away. Needs a wind speed column; an optional per-turbine wind scale factor adjusts met-mast wind to hub conditions.

**Compare both** runs the two methods side by side.

### Site, months and night windows (NZ)

- **Site:** coordinates in ETRS89/UTM (EPSG:258xx), WGS84 lat/lon, WGS84/UTM or Gauss-Krüger DHDN (EPSG:3146x), a click on the map, or a shapefile (.zip or .shp + .prj; the shape's centre is used).
- **Months:** click Jan–Dec chips, or use the presets (Apr–Oct, Mar–Nov, all).
- **Automatic NZ windows:** sunset and sunrise are computed for the site (NOAA solar algorithm, offline, ±1 min; or fetched from the Open-Meteo archive as a cross-check) in the data's time zone (German local time, MEZ all year, or UTC). Each night is divided into N equal parts (10 = Nachtzehntel; 4–12 selectable). Options: sunset/sunrise or civil twilight, monthly mean / 15th / longest night, NZ0 as % of night or minutes before sunset (or none), classic scheme as minutes before sunset / after sunrise. Switch to **Manual** to type windows as before.
- **Thresholds and manual hours** are editable tables; a block copied from Excel can be pasted in (month names in the first column are recognised).
- **Meteo data** can also be fetched directly: hourly ERA5 2 m temperature and 100 m wind for the site from Open-Meteo, so no CSV is needed.

The "Load example (BN14–16)" button switches to Manual mode with the original project windows, so the validation figures below still reproduce.

### Active hours

Either computed from the meteo CSV (timestamp + temperature, 10-min default timestep, year range filter, temperature window 10–75 °C by default) or entered manually per month/NZ window. "Fill from CSV" copies computed hours into the manual table for tweaking.

### Configuration defaults

NZ time windows (April–Oktober, NZ1–NZ10), monthly wind speed thresholds (NZ0–NZ10), classic scheme windows and the 6.5 m/s classic threshold are pre-loaded from the project and fully editable in the UI. NZ0 is generated automatically: it starts 15 % of the night length before NZ1 (factor editable).

### Data formats

- **Sector data** (per turbine, one row per sector): `sector angle freq% A k v_free v_wake`
- **Power curve**: `wind_speed power` — W or kW, detected automatically
- **Meteo CSV**: `;` or `,` separated, German decimal commas supported, timestamps `YYYY-MM-DD HH:MM` or `DD.MM.YYYY HH:MM`

All inputs are stored in the browser (localStorage), so your setup survives a page reload. **Save / Open** in the top bar writes all inputs to a `.boreas.json` project file (meteo data is not included). Several turbines can be imported at once (one pasted block or one file per turbine). Results export as a multi-sheet `.xlsx` or as TSV to the clipboard.
