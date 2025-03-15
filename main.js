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
  CLICK_RATE: 1, // How often to click the cookie (milliseconds) 1 ms
  PURCHASE_RATE: 1000, // How often to check purchases (milliseconds) 1 second
  ASCENTION_TIME_AFTER: 86400, // How often we should ascend, I am doing it after a day per run (seconds) 24 hours
  EXCLUDED_UPGRADES: new Set([64, 74, 84, 85]), // Upgrades to skip cuz they make weird stuff
  UPGRADE_COST_RATIO: (1 + Math.sqrt(5)) / 2, // TODO: UTILIZE THIS RATIO
};

// Separate clicking and purchasing into different intervals
const clickingAutomation = setInterval(function () {
  try {
    // Click the big cookie
    Game.ClickCookie();

    // Click all golden cookies and other shimmers
    Game.shimmers.forEach((shimmer) => shimmer.pop());

    // // Kill all winklers
    // Game.registerHook("logic", () => {
    //   Game.wrinklers.forEach((me) => (me.hp -= Number.MAX_VALUE));
    // });
  } catch (err) {
    console.error("Stopping clicking automation:", err.message);
    clearInterval(clickingAutomation);
  }
}, CONFIG.CLICK_RATE);

// Separate interval for purchases
const purchaseAutomation = setInterval(function () {
  try {
    // Click the lump
    Game.clickLump();

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
      } catch {}
    });

    // Purchase buildings (most expensive first)
    for (let id = Game.ObjectsById.length - 1; id >= 0; id--) {
      const building = Game.ObjectsById[id];
      if (building && !building.locked && Game.cookies >= building.price) {
        try {
          building.buy(1);
        } catch {}
        try {
          building.levelup();
        } catch {}
      }
    }

    // Purchase available upgrades

    // TODO: Add support for using lumps to purchase levels

    // Try to ascend if the time on this run has been greater than 24 hours, can be changed in CONFIG
    var date = new Date();
    date.setTime(Date.now() - Game.startDate);
    var timeInSeconds = date.getTime() / 1000;

    if (timeInSeconds > CONFIG.ASCENTION_TIME_AFTER) {
      Game.Ascend(1);

      // Filter data that we can upgrade from
      const upgradeIds = Array.from(
        Game.ascendUpgradesl.querySelectorAll(
          ".crate.upgrade.heavenly[data-id]"
        )
      ).map((upgrade) => upgrade.getAttribute("data-id"));

      // iterate in reverse order through the vector of upgradeIds
      for (let i = upgradeIds.length - 1; i >= 0; i--) {
        const upgradeId = upgradeIds[i];
        try {
          Game.PurchaseHeavenlyUpgrade(upgradeId);
          console.log(
            "Bought heavenly upgrade:",
            Game.UpgradesById[upgradeId].name
          );
        } catch (e) {
          console.debug(
            "Failed to buy heavenly upgrade:",
            Game.UpgradesById[upgradeId].name
          );
        }
      }
      // finally exit after purchasing
      Game.Reincarnate(1);
    }
  } catch (err) {
    console.error("Stopping purchase automation:", err.message);
    clearInterval(purchaseAutomation);
  }
}, CONFIG.PURCHASE_RATE);

// Helper function to stop all automation
function stopAutomation() {
  clearInterval(clickingAutomation);
  clearInterval(purchaseAutomation);
  console.log("All automation stopped");
}
// To stop automation, run: stopAutomation()
