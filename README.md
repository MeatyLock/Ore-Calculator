# Ore Calculator

Small web app to hold item volume constants and simple recipe volume calculations.

Files:
- `index.html` — main UI
- `styles.css` — minimal styling to match the reference aesthetic
- `scripts/constants.js` — item volumes and recipes
- `scripts/main.js` — UI wiring and compute logic

Open `index.html` in a browser to try it.

Notes:
- Water has zero volume.
- Recipes are evaluated recursively; recursive recipes will cause an error to avoid infinite loops.
