# Wind Analysis Tools

Browser-based calculators for wind farm curtailment analysis. Everything runs client-side — no server, no data upload — which makes the site perfect for GitHub Pages.

## Pages

| File | Tool |
|---|---|
| `index.html` | Hub — pick a calculator (add new tools here as cards) |
| `fledermaus.html` | Bat (Fledermaus) curtailment losses — NZ windows, monthly thresholds, temperature filter |
| `turbulence.html` | Turbulence curtailment losses — sector overlap between full and curtailed datasets |

## Host on GitHub Pages

1. Create a new repository on GitHub (e.g. `wind-tools`).
2. Upload all files from this folder to the repository root (`index.html`, `fledermaus.html`, `turbulence.html`, `README.md`).
3. In the repository: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / root → Save**.
4. After a minute the site is live at `https://<your-username>.github.io/wind-tools/`.

To add a new calculator later: copy one of the tool pages, replace the logic, and add a new card in `index.html`.

## Fledermaus calculator — methods

**Weibull (sector statistics), windPRO style.** Per sector the wake Weibull is derived as `A_wake = A_free x (v_wake / v_free)` with unchanged `k`. Loss = frequency-weighted expected power below the threshold, multiplied by the active hours of each NZ window. Validated against the original Python script to machine precision (BN14 full AEP 20,320.7 MWh/a, +1.69 % vs. the windPRO reference of 19,982.5 MWh/a).

**Time series.** Each timestep of the meteo CSV inside an NZ window with valid temperature is checked directly: if wind < threshold, the power-curve value for that timestep counts as loss. This captures the correlation between night/summer hours and wind speed that the Weibull method averages away. Needs a wind speed column; an optional per-turbine wind scale factor adjusts met-mast wind to hub conditions.

**Compare both** runs the two methods side by side.

### Active hours

Either computed from the meteo CSV (timestamp + temperature, 10-min default timestep, year range filter, temperature window 10–75 °C by default) or entered manually per month/NZ window. "Fill from CSV" copies computed hours into the manual table for tweaking.

### Configuration defaults

NZ time windows (April–Oktober, NZ1–NZ10), monthly wind speed thresholds (NZ0–NZ10), classic scheme windows and the 6.5 m/s classic threshold are pre-loaded from the project and fully editable in the UI. NZ0 is generated automatically: it starts 15 % of the night length before NZ1 (factor editable).

### Data formats

- **Sector data** (per turbine, one row per sector): `sector angle freq% A k v_free v_wake`
- **Power curve**: `wind_speed power` — W or kW, detected automatically
- **Meteo CSV**: `;` or `,` separated, German decimal commas supported, timestamps `YYYY-MM-DD HH:MM` or `DD.MM.YYYY HH:MM`

All inputs are stored in the browser (localStorage), so your setup survives a page reload. Results export as a multi-sheet `.xlsx` or as TSV to the clipboard.
