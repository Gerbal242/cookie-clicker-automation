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
  //   MIN_BUILDING_COST: Infinity, // Tracks minimum building cost
  //   MIN_UPGRADE_COST: Infinity, // Tracks minimum upgrade cost
  UPGRADE_COST_RATIO: 5, // Buy building if cost > (ratio * upgrade cost)
};

// Main automation function
const cookieAutomation = setInterval(function () {
  try {
    // Click the big cookie
    Game.ClickCookie();

    // Click all golden cookies and other shimmers
    Game.shimmers.forEach((shimmer) => shimmer.pop());

    // // Reset minimum costs each tick
    // CONFIG.MIN_BUILDING_COST = Infinity;
    // CONFIG.MIN_UPGRADE_COST = Infinity;

    // // Find minimum upgrade cost first
    // for (let id = CONFIG.MAX_UPGRADE_ID; id >= 0; id--) {
    //   const upgrade = Game.UpgradesById[id];
    //   if (upgrade && !upgrade.bought) {
    //     CONFIG.MIN_UPGRADE_COST = Math.min(
    //       CONFIG.MIN_UPGRADE_COST,
    //       upgrade.basePrice || Infinity
    //     );
    //   }
    // }

    // Purchase buildings (most expensive first)
    for (let id = CONFIG.MAX_BUILDING_ID; id >= 0; id--) {
      const building = Game.ObjectsById[id];
      if (building && !building.locked) {
        // CONFIG.MIN_BUILDING_COST = Math.min(
        //   CONFIG.MIN_BUILDING_COST,
        //   building.price
        // );

        // Only buy building if it costs more than 5x the cheapest upgrade
        // if (
        //   building.price >
        //   CONFIG.UPGRADE_COST_RATIO * CONFIG.MIN_UPGRADE_COST
        // ) {
        building.buy(1);
        // }
      }
    }

    // Purchase available upgrades
    for (let id = CONFIG.MAX_UPGRADE_ID; id >= 0; id--) {
      const upgrade = Game.UpgradesById[id];
      if (upgrade && !upgrade.bought) {
        try {
          upgrade.buy(1);
        } catch {} // Skip invalid upgrades
      }
    }
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
