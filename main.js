/**
 * Cookie Clicker Automation Script
 * Optimizes cookie production through intelligent automation
 * @license MIT
 * @version 1.1.0
 */

// Configuration object for easy tweaking
const CONFIG = {
  TICK_RATE: 1, // How often to click (milliseconds)
  PURCHASE_INTERVAL: 250, // How often to check purchases (milliseconds)
  MAX_LOAD_ATTEMPTS: 60, // Maximum seconds to wait for game load
  MIN_CPS_IMPROVEMENT: 0.1, // Minimum CPS improvement to consider a purchase
  SAFETY_BANK: 0.1, // Keep 10% of cookies as safety bank
  EXCLUDED_UPGRADES: new Set([64, 74, 84, 85]), // Upgrades to skip (using Set for O(1) lookup)
  DEBUG: false, // Enable debug logging
};

// Global state with TypeScript-like interface for better structure
const automation = {
  autoBuy: true,
  autoBuyTxt: "on",
  intervals: new Set(), // Using Set for better cleanup
  isRunning: false,
  lastPurchaseAttempt: 0,
  purchaseThrottleMs: 1000, // Prevent too frequent purchase attempts
};

/**
 * Safe logging function that respects debug mode
 */
const log = {
  debug: (...args) => CONFIG.DEBUG && console.debug(...args),
  error: (...args) => console.error(...args),
  info: (...args) => console.log(...args),
};

/**
 * Safely access game objects with error handling
 */
const GameProxy = {
  get: () => {
    if (typeof Game === "undefined" || !Game.ready) {
      throw new Error("Game not ready");
    }
    return Game;
  },
  isReady: () => {
    try {
      return (
        typeof Game !== "undefined" &&
        Game.ready &&
        Game.Objects &&
        Game.Objects.Cursor
      );
    } catch {
      return false;
    }
  },
};

/**
 * Waits for game to load before starting automation
 */
function initializeAutomation() {
  if (automation.isRunning) {
    log.info("Automation already running");
    return;
  }

  let loadAttempts = 0;
  const gameLoader = setInterval(() => {
    try {
      if (GameProxy.isReady()) {
        log.info("Game loaded! Starting automation...");
        clearInterval(gameLoader);
        startAutomation();
      } else {
        loadAttempts++;
        if (loadAttempts >= CONFIG.MAX_LOAD_ATTEMPTS) {
          log.error(
            `Game failed to load after ${CONFIG.MAX_LOAD_ATTEMPTS} seconds`
          );
          clearInterval(gameLoader);
        }
      }
    } catch (e) {
      log.error("Error in initialization:", e);
      clearInterval(gameLoader);
    }
  }, 1000);
}

/**
 * Calculates the optimal purchase (building or upgrade) with performance optimizations
 */
function calculateOptimalPurchase() {
  try {
    const game = GameProxy.get();

    // Throttle purchase calculations
    const now = Date.now();
    if (now - automation.lastPurchaseAttempt < automation.purchaseThrottleMs) {
      return null;
    }
    automation.lastPurchaseAttempt = now;

    const bestPurchase = {
      item: null,
      cpc: Number.MAX_VALUE,
      cps: 0,
      price: 0,
    };

    const currentCps = game.cookiesPs;
    const availableCookies = game.cookies * (1 - CONFIG.SAFETY_BANK);
    const baseCps = calculateBaseCps();

    // Check upgrades (now using for...of for better performance with early returns)
    for (const upgrade of game.UpgradesInStore) {
      if (!upgrade || CONFIG.EXCLUDED_UPGRADES.has(upgrade.id)) continue;

      try {
        if (!game.UpgradesById[upgrade.id]?.toggle) continue;

        // Calculate CPS difference with upgrade
        game.UpgradesById[upgrade.id].toggle();
        game.CalculateGains();
        const newCps = calculateBaseCps() * game.globalCpsMult;
        game.UpgradesById[upgrade.id].toggle();
        game.CalculateGains();

        const cpsDiff = newCps - currentCps;
        if (
          cpsDiff >= CONFIG.MIN_CPS_IMPROVEMENT &&
          upgrade.basePrice <= availableCookies
        ) {
          const efficiency = upgrade.basePrice / cpsDiff;
          if (efficiency < bestPurchase.cpc) {
            Object.assign(bestPurchase, {
              item: upgrade,
              cpc: efficiency,
              cps: cpsDiff,
              price: upgrade.basePrice,
            });
          }
        }
      } catch (e) {
        log.debug("Error processing upgrade:", e);
      }
    }

    // Check buildings with optimized iteration
    for (const building of game.ObjectsById) {
      if (!building || building.locked || building.price > availableCookies)
        continue;

      try {
        // Calculate CPS difference with building
        building.amount++;
        game.CalculateGains();
        const newCps = calculateBaseCps() * game.globalCpsMult;
        building.amount--;
        game.CalculateGains();

        const cpsDiff = newCps - currentCps;
        if (cpsDiff >= CONFIG.MIN_CPS_IMPROVEMENT) {
          const efficiency = building.price / cpsDiff;
          if (efficiency < bestPurchase.cpc) {
            Object.assign(bestPurchase, {
              item: building,
              cpc: efficiency,
              cps: cpsDiff,
              price: building.price,
            });
          }
        }
      } catch (e) {
        log.debug("Error processing building:", e);
      }
    }

    updateGameTicker(bestPurchase);
    return bestPurchase.item;
  } catch (e) {
    log.debug("Error in calculateOptimalPurchase:", e);
    return null;
  }
}

/**
 * Calculates base CPS for all objects with memoization
 */
const calculateBaseCps = (() => {
  let lastCalculation = { time: 0, value: 0 };
  const CACHE_DURATION = 100; // ms

  return function () {
    const now = Date.now();
    if (now - lastCalculation.time < CACHE_DURATION) {
      return lastCalculation.value;
    }

    try {
      const game = GameProxy.get();
      let cps = 0;

      for (const obj of game.ObjectsById) {
        if (obj?.cps && obj.amount) {
          cps += obj.cps() * obj.amount;
        }
      }

      lastCalculation = { time: now, value: cps };
      return cps;
    } catch (e) {
      log.debug("Error calculating base CPS:", e);
      return 0;
    }
  };
})();

/**
 * Updates game ticker with purchase information
 */
function updateGameTicker(purchase) {
  if (!purchase.item) return;

  try {
    const game = GameProxy.get();
    const timeToWait = Math.max(
      0,
      (purchase.price - game.cookies) / game.cookiesPs
    );
    const clickValue = game.computedMouseCps
      ? (game.computedMouseCps / game.cookiesPs).toFixed(3)
      : 0;

    game.Ticker = [
      `Buying ${purchase.item.name} for ${Beautify(
        Math.round(purchase.price)
      )} cookies`,
      `Time to wait: ${Beautify(timeToWait)} seconds`,
      `Each click saves ${clickValue} seconds`,
      `Press A to toggle auto-buy (currently ${automation.autoBuyTxt})`,
    ].join("<br>");

    game.TickerAge = CONFIG.PURCHASE_INTERVAL;
  } catch (e) {
    log.debug("Error updating ticker:", e);
  }
}

/**
 * Starts all automation processes with improved error handling
 */
function startAutomation() {
  try {
    const game = GameProxy.get();
    automation.isRunning = true;

    // Cookie clicking automation with rate limiting
    const clickInterval = setInterval(() => {
      try {
        game.ClickCookie();
        game.lastClick = Date.now() - 1000 / 50;

        // Click all shimmers
        if (game.shimmers?.length) {
          game.shimmers.forEach((shimmer) => {
            try {
              shimmer.pop();
            } catch (e) {
              log.debug("Error popping shimmer:", e);
            }
          });
        }
      } catch (e) {
        log.debug("Error in cookie clicking:", e);
      }
    }, CONFIG.TICK_RATE);
    automation.intervals.add(clickInterval);

    // Wrinkler and reindeer management with improved error handling
    if (game.registerHook) {
      game.registerHook("logic", () => {
        try {
          // Kill wrinklers efficiently
          if (game.wrinklers) {
            for (const wrinkler of game.wrinklers) {
              if (wrinkler?.hp > 0) wrinkler.hp = 0;
            }
          }

          // Pop reindeer efficiently
          if (game.shimmers) {
            for (const shimmer of game.shimmers) {
              if (shimmer.type === "reindeer") shimmer.pop();
            }
          }
        } catch (e) {
          log.debug("Error in wrinkler/reindeer management:", e);
        }
      });
    }

    // Purchase automation with throttling
    const purchaseInterval = setInterval(() => {
      try {
        if (automation.autoBuy) {
          const optimal = calculateOptimalPurchase();
          if (optimal?.buy) optimal.buy();
        } else {
          calculateOptimalPurchase(); // Keep calculating for display
        }
      } catch (e) {
        log.debug("Error in purchase automation:", e);
      }
    }, CONFIG.PURCHASE_INTERVAL);
    automation.intervals.add(purchaseInterval);

    // Auto-buy toggle listener with cleanup
    const handleKeyPress = (event) => {
      if (event.keyCode === 65) {
        // 'A' key
        automation.autoBuy = !automation.autoBuy;
        automation.autoBuyTxt = automation.autoBuy ? "on" : "off";
        game.Notify("Auto-buy is now " + automation.autoBuyTxt, "", [16, 5]);
      }
    };
    document.addEventListener("keydown", handleKeyPress);

    // Store the event listener for cleanup
    automation.keyPressListener = handleKeyPress;
  } catch (e) {
    log.error("Error starting automation:", e);
    stopAutomation();
  }
}

/**
 * Stops all automation with complete cleanup
 */
window.stopAutomation = function () {
  try {
    automation.intervals.forEach((interval) => clearInterval(interval));
    automation.intervals.clear();

    if (automation.keyPressListener) {
      document.removeEventListener("keydown", automation.keyPressListener);
      automation.keyPressListener = null;
    }

    automation.isRunning = false;
    log.info("Automation stopped successfully");
  } catch (e) {
    log.error("Error stopping automation:", e);
  }
};

// Start the automation
initializeAutomation();
