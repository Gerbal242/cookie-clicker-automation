/**
 * Cookie Clicker Automation Script
 * Optimizes cookie production through intelligent automation
 * @license MIT
 * @version 1.0.0
 */

// Configuration object for easy tweaking
const CONFIG = {
  TICK_RATE: 1, // How often to click (milliseconds)
  PURCHASE_INTERVAL: 250, // How often to check purchases (milliseconds)
  MAX_LOAD_ATTEMPTS: 60, // Maximum seconds to wait for game load
  MIN_CPS_IMPROVEMENT: 0.1, // Minimum CPS improvement to consider a purchase
  SAFETY_BANK: 0.1, // Keep 10% of cookies as safety bank
  EXCLUDED_UPGRADES: [64, 74, 84, 85], // Upgrades to skip
};

// Global state
let automation = {
  autoBuy: true,
  autoBuyTxt: "on",
  intervals: [],
};

/**
 * Waits for game to load before starting automation
 */
function initializeAutomation() {
  let loadAttempts = 0;
  const gameLoader = setInterval(() => {
    if (
      typeof Game !== "undefined" &&
      Game.ready &&
      Game.Objects &&
      Game.Objects.Cursor
    ) {
      console.log("Game loaded! Starting automation...");
      clearInterval(gameLoader);
      startAutomation();
    } else {
      loadAttempts++;
      if (loadAttempts >= CONFIG.MAX_LOAD_ATTEMPTS) {
        console.error(
          "Game failed to load after " + CONFIG.MAX_LOAD_ATTEMPTS + " seconds"
        );
        clearInterval(gameLoader);
      }
    }
  }, 1000);
}

/**
 * Calculates the optimal purchase (building or upgrade)
 */
function calculateOptimalPurchase() {
  if (!Game || !Game.ready || !Game.ObjectsById || !Game.UpgradesInStore) {
    return null;
  }

  let bestPurchase = {
    item: null,
    cpc: Number.MAX_VALUE,
    cps: 0,
    price: 0,
  };

  const currentCps = Game.cookiesPs;
  const availableCookies = Game.cookies * (1 - CONFIG.SAFETY_BANK);

  // Check upgrades
  try {
    Game.UpgradesInStore.forEach((upgrade) => {
      if (!upgrade || CONFIG.EXCLUDED_UPGRADES.includes(upgrade.id)) return;

      try {
        let baseCps = calculateBaseCps();
        if (Game.UpgradesById[upgrade.id]?.toggle) {
          Game.UpgradesById[upgrade.id].toggle();
          Game.CalculateGains();
          const newCps = calculateBaseCps() * Game.globalCpsMult;
          Game.UpgradesById[upgrade.id].toggle();
          Game.CalculateGains();

          const cpsDiff = newCps - currentCps;
          if (
            cpsDiff >= CONFIG.MIN_CPS_IMPROVEMENT &&
            upgrade.basePrice <= availableCookies
          ) {
            const efficiency = upgrade.basePrice / cpsDiff;
            if (efficiency < bestPurchase.cpc) {
              bestPurchase = {
                item: upgrade,
                cpc: efficiency,
                cps: cpsDiff,
                price: upgrade.basePrice,
              };
            }
          }
        }
      } catch (e) {
        console.debug("Error processing upgrade:", e);
      }
    });
  } catch (e) {
    console.debug("Error checking upgrades:", e);
  }

  // Check buildings
  try {
    Game.ObjectsById.forEach((building) => {
      if (!building || building.locked) return;

      try {
        let baseCps = calculateBaseCps();
        building.amount++;
        Game.CalculateGains();
        const newCps = calculateBaseCps() * Game.globalCpsMult;
        building.amount--;
        Game.CalculateGains();

        const cpsDiff = newCps - currentCps;
        if (
          cpsDiff >= CONFIG.MIN_CPS_IMPROVEMENT &&
          building.price <= availableCookies
        ) {
          const efficiency = building.price / cpsDiff;
          if (efficiency < bestPurchase.cpc) {
            bestPurchase = {
              item: building,
              cpc: efficiency,
              cps: cpsDiff,
              price: building.price,
            };
          }
        }
      } catch (e) {
        console.debug("Error processing building:", e);
      }
    });
  } catch (e) {
    console.debug("Error checking buildings:", e);
  }

  updateGameTicker(bestPurchase);
  return bestPurchase.item;
}

/**
 * Calculates base CPS for all objects
 */
function calculateBaseCps() {
  let cps = 0;
  Game.ObjectsById.forEach((obj) => {
    if (obj && typeof obj.cps === "function" && obj.amount) {
      try {
        cps += obj.cps() * obj.amount;
      } catch (e) {
        console.debug("Error calculating CPS for " + obj.name, e);
      }
    }
  });
  return cps;
}

/**
 * Updates game ticker with purchase information
 */
function updateGameTicker(purchase) {
  if (!purchase.item) return;

  try {
    const timeToWait = Math.max(
      0,
      (purchase.price - Game.cookies) / Game.cookiesPs
    );
    const clickValue = Game.computedMouseCps
      ? (Game.computedMouseCps / Game.cookiesPs).toFixed(3)
      : 0;

    Game.Ticker =
      "Buying " +
      purchase.item.name +
      " for " +
      Beautify(Math.round(purchase.price)) +
      " cookies<br>Time to wait: " +
      Beautify(timeToWait) +
      " seconds" +
      "<br>Each click saves " +
      clickValue +
      " seconds" +
      "<br>Press A to toggle auto-buy (currently " +
      automation.autoBuyTxt +
      ")";

    Game.TickerAge = CONFIG.PURCHASE_INTERVAL;
  } catch (e) {
    console.debug("Error updating ticker:", e);
  }
}

/**
 * Starts all automation processes
 */
function startAutomation() {
  // Cookie clicking automation
  automation.intervals.push(
    setInterval(() => {
      try {
        // Click the big cookie
        Game.ClickCookie();
        Game.lastClick = Date.now() - 1000 / 50;

        // Click all golden cookies and other shimmers
        if (Game.shimmers?.length) {
          Game.shimmers.forEach((shimmer) => {
            try {
              shimmer.pop();
            } catch (e) {
              console.debug("Error popping shimmer:", e);
            }
          });
        }
      } catch (e) {
        console.debug("Error in cookie clicking:", e);
      }
    }, CONFIG.TICK_RATE)
  );

  // Wrinkler and reindeer management
  if (Game.registerHook) {
    Game.registerHook("logic", () => {
      try {
        // Kill wrinklers
        Game.wrinklers?.forEach((wrinkler) => {
          if (wrinkler?.hp) wrinkler.hp = 0;
        });

        // Pop reindeer
        Game.shimmers?.forEach((shimmer) => {
          if (shimmer.type === "reindeer") shimmer.pop();
        });
      } catch (e) {
        console.debug("Error in wrinkler/reindeer management:", e);
      }
    });
  }

  // Purchase automation
  automation.intervals.push(
    setInterval(() => {
      try {
        if (automation.autoBuy) {
          const optimal = calculateOptimalPurchase();
          if (optimal?.buy) optimal.buy();
        } else {
          calculateOptimalPurchase();
        }
      } catch (e) {
        console.debug("Error in purchase automation:", e);
      }
    }, CONFIG.PURCHASE_INTERVAL)
  );

  // Auto-buy toggle listener
  document.addEventListener("keydown", (event) => {
    if (event.keyCode === 65) {
      // 'A' key
      automation.autoBuy = !automation.autoBuy;
      automation.autoBuyTxt = automation.autoBuy ? "on" : "off";
      Game.Notify("Auto-buy is now " + automation.autoBuyTxt, "", [16, 5]);
    }
  });
}

/**
 * Stops all automation
 */
window.stopAutomation = function () {
  automation.intervals.forEach((interval) => clearInterval(interval));
  automation.intervals = [];
  console.log("Automation stopped");
};

// Start the automation
initializeAutomation();
