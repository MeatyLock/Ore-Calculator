/* Item base volumes (volume per unit). Water has no volume (0). */
const VOLUMES = {
  Water: 0.0,
  "Titanium Ore": 0.9,
  "Stravidium Mass": 0.5,
  "Stravidium Fiber": 0.6,
  "Plastanium Ingot": 1.0
};

/* Recipes: how to make a single unit of a product from components.
   Each recipe maps product -> {componentName: quantity, ...}
   For example, 1 Stravidium Fiber = 3 Stravidium Mass + 100 Water
*/
const RECIPES = {
  "Stravidium Fiber": {
    "Stravidium Mass": 3,
    Water: 100
  },
  "Plastanium Ingot": {
    "Stravidium Fiber": 1,
    "Titanium Ore": 6,
    Water: 1250
  }
};

// Export for other scripts (browser global)
window.APP_DATA = { VOLUMES, RECIPES };