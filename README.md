# Ore Calculator

Single-page calculator for volume-based resource planning. Open index.html in a browser and everything runs client-side.

## Features
- **Mode toggle**: Switch between Titanium Ore and Stravidium Mass calculations.
- **Live totals**: Enter a total volume and results update instantly.
- **Participant split**: Provide a participant count to see per-person amounts alongside overall totals.
- **25% discount toggle**: Mirrors the spice calculator behaviour; when enabled volumes are multiplied by 1.25 and the UI highlights the active state.
- **Derived outputs**: In mass mode see Stravidium Fiber yield plus water usage; both modes list Plastanium ingot potential and required inputs.

## Project structure
- index.html – main markup and component layout.
- styles.css – themed styling matching the reference aesthetic.
- scripts/constants.js – item volume constants and recipe definitions.
- scripts/main.js – UI wiring, calculation logic, and rendering helpers.

No build step is required. Double-click index.html or serve the folder with any static host (including GitHub Pages) to share the app.
