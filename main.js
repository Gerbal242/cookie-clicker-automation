/**
 * Cookie Clicker Automation Script
 * Optimizes cookie production through intelligent automation
 * @license MIT
 * @version 1.1.0
 */

/**
 * Cookie Clicker Automation Script
 * This script automates various aspects of Cookie Clicker:
 * - Clicks the big cookie
 * - Purchases buildings (most expensive to least expensive)
 * - Buys available upgrades
 * - Collects golden cookies and other shimmers
 */

// Configuration
const CONFIG = {
  TICK_RATE: 1, // How often to run the main loop (in milliseconds)
  MAX_BUILDING_ID: 19, // Highest building ID in the game
  MAX_UPGRADE_ID: 76, // Highest upgrade ID in the game
  EXCLUDED_UPGRADES: new Set([64, 74, 84, 85]), // Upgrades to skip (using Set for O(1) lookup)
  UPGRADE_COST_RATIO: (1 + Math.sqrt(5)) / 2, // Buy building if cost > (ratio * upgrade cost)
};

// Main automation function
const cookieAutomation = setInterval(function () {
  try {
    // Click the big cookie
    Game.ClickCookie();

    // Click all golden cookies and other shimmers
    Game.shimmers.forEach((shimmer) => shimmer.pop());

    // Kill all winklers
    Game.registerHook("logic", () => {
      Game.wrinklers.forEach((me) => (me.hp -= Number.MAX_VALUE));
    });

    // Purchase buildings (most expensive first)
    for (let id = Game.ObjectsById.length - 1; id >= 0; id--) {
      const building = Game.ObjectsById[id];
      if (building && !building.locked && Game.cookies >= building.price) {
        try {
          building.buy(1);
        } catch {}
      }
    }

    // Purchase available upgrades
    // Filter valid upgrades first, then try to buy them
    const availableUpgrades = Game.UpgradesInStore.filter(
      (upgrade) =>
        upgrade &&
        !CONFIG.EXCLUDED_UPGRADES.has(upgrade.id) &&
        Game.cookies >= upgrade.getPrice()
    );

    // Try to buy all available upgrades
    availableUpgrades.forEach((upgrade) => {
      try {
        upgrade.buy();
        console.log("Bought upgrade:", upgrade.name);
      } catch (e) {
        console.debug("Failed to buy upgrade:", upgrade.name);
      }
    });
  } catch (err) {
    console.error("Stopping automation:", err.message);
    clearInterval(cookieAutomation);
  }
}, CONFIG.TICK_RATE);

// Helper function to stop automation
function stopAutomation() {
  clearInterval(cookieAutomation);
  console.log("Automation stopped");
}

// To stop automation, run: stopAutomation()
