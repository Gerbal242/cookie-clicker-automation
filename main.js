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
  PURCHASE_RATE: 60000, // How often to check purchases (milliseconds) 10 seconds
  ASCENTION_TIME_AFTER: 43200, // How often we should ascend, I am doing it after 12 hours
  EXCLUDED_UPGRADES: new Set([
    181, 182, 183, 184, 185, 209, 264, 323, 327, 328, 331,
    333, 414,
  ]), // Upgrades to skip cuz they make weird stuff
  UPGRADE_COST_RATIO: (1 + Math.sqrt(5)) / 2, // TODO: UTILIZE THIS RATIO
};

// Separate clicking and purchasing into different intervals
const clickingAutomation = setInterval(function () {
  try {
    // Click the big cookie
    Game.ClickCookie();

    // Click all golden cookies and other shimmers
    Game.shimmers.forEach((shimmer) => shimmer.pop());

  } catch (err) {
    console.error("Stopping clicking automation:", err.message);
    clearInterval(clickingAutomation);
  }
}, CONFIG.CLICK_RATE);



// Separate interval for purchases
const purchaseAutomation = setInterval(function () {
  try {
    // // Click the lump
    // Game.clickLump();
    // Kill all winklers
    Game.registerHook("logic", () => {
      Game.wrinklers.forEach((me) => (me.hp -= Number.MAX_VALUE));
    });


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
        if (upgrade.id == 69){
          upgrade.buy(1);Game.ClosePrompt()
        }
        console.log("Purchasing upgrade", upgrade.name);
      } catch {
        console.log("Failed to purchase upgrade", upgrade.name);
      }
    });

    // Purchase buildings (most expensive first)
    for (let id = Game.ObjectsById.length - 1; id >= 0; id--) {
      const building = Game.ObjectsById[id];
      if (building && !building.locked) {
        if (Game.cookies >= building.price) {
          try {
            building.buy();
            console.log("Purchasing building", building.name)
          } catch {}
        }
        if (building.bought >= 1){
          try {
            building.levelUp();
          } catch {}
        }
      }
    }
    // TODO: Add support for using lumps to purchase levels

    // Try to ascend if the time on this run has been greater than 48 hours, can be changed in CONFIG
    var date = new Date();
    date.setTime(Date.now() - Game.startDate);
    var timeInSeconds = date.getTime() / 1000;

    if (timeInSeconds > CONFIG.ASCENTION_TIME_AFTER) {
      Game.Ascend(1);

      // Wait 10 seconds before purchasing upgrades asynchronously in order to populate purchase vector
      setTimeout(() => {
        try {
          const ascendUpgrades = Game.ascendUpgradesl.querySelectorAll(
            ".crate.upgrade.heavenly[data-id]"
          );
          const upgradeIds = Array.from(ascendUpgrades).map((upgrade) => {
            // Convert the data-id (string) to an integer
            return parseInt(upgrade.getAttribute("data-id"), 10);
          });

          // Iterate through the upgradeIds array
          for (let i = upgradeIds.length - 1; i >= 0; i--) {
            const upgradeId = upgradeIds[i];

            // Check if the upgradeId is excluded
            if (!CONFIG.EXCLUDED_UPGRADES.has(upgradeId)) {
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
            } else {
              console.log(
                "Skipping upgrade",
                Game.UpgradesById[upgradeId].name
              );
            }
          }

          // Finally exit after purchasing
          Game.Reincarnate(1);
        } catch (err) {
          console.error(
            "Error during ascension upgrade purchase:",
            err.message
          );
        }
      }, 10000); // Wait 10 seconds before attempting to purchase upgrades
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
console.log("To stop automation, run: stopAutomation()");
