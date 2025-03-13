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
  PURCHASE_INTERVAL: 250, // How often to check for purchases
  MAX_LOAD_ATTEMPTS: 60, // Maximum number of seconds to wait for game load
};

// Wait for game to load before starting automation
let loadAttempts = 0;
const gameLoader = setInterval(function () {
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

// Main automation logic
function startAutomation() {
  // Auto-buy configuration
  var autoBuy = true;
  var autoBuyTxt = "on";

  // Main cookie clicking automation
  const cookieAutomation = setInterval(function () {
    try {
      // Click the big cookie
      Game.ClickCookie();
      Game.lastClick = new Date().getTime() - 1000 / 50;

      // Click all golden cookies and other shimmers
      if (Game.shimmers && Game.shimmers.length) {
        Game.shimmers.forEach((shimmer) => shimmer.pop());
      }

      // Kill wrinklers as soon as they spawn
      if (Game.registerHook) {
        Game.registerHook("logic", () => {
          if (Game.wrinklers) {
            Game.wrinklers.forEach((me) => {
              if (me && typeof me.hp !== "undefined") {
                me.hp -= Number.MAX_VALUE;
              }
            });
          }
        });
      }
    } catch (err) {
      console.error("Cookie clicking error:", err.message);
    }
  }, CONFIG.TICK_RATE);

  // Toggle auto-buy with 'A' key
  document.addEventListener("keydown", function (event) {
    if (event.keyCode === 65) {
      autoBuy = !autoBuy;
      autoBuyTxt = autoBuy ? "on" : "off";
      Game.Notify("Auto-buy is now " + autoBuyTxt, "", [16, 5]);
    }
  });

  // Calculate optimal building to purchase
  function optimalBuilding() {
    if (!Game.ObjectsById || !Game.ObjectsById.length) return -1;

    let cpc = Number.MAX_VALUE;
    let optimalIndex = 0;
    let optimalCps = 0;

    for (let i = Game.ObjectsById.length - 1; i >= 0; i--) {
      const building = Game.ObjectsById[i];
      if (!building || typeof building.cps !== "function") continue;

      // Calculate base CPS before adding new building
      let baseCps = 0;
      for (let j = Game.ObjectsById.length - 1; j >= 0; j--) {
        const obj = Game.ObjectsById[j];
        if (obj && typeof obj.cps === "function" && obj.amount) {
          try {
            baseCps += obj.cps() * obj.amount;
          } catch (e) {
            console.debug(
              "Error calculating CPS for " + obj.name + ": " + e.message
            );
          }
        }
      }

      // Calculate CPS after adding new building
      let buildingCps = 0;
      try {
        buildingCps = building.cps() * Game.globalCpsMult;
      } catch (e) {
        console.debug("Error calculating building CPS: " + e.message);
        continue;
      }

      // Calculate efficiency
      if (buildingCps > 0) {
        let efficiency = building.price / buildingCps;
        if (efficiency < cpc) {
          cpc = efficiency;
          optimalIndex = i;
          optimalCps = buildingCps;
        }
      }
    }

    // Update game ticker with purchase information
    if (Game.Ticker !== undefined) {
      const building = Game.ObjectsById[optimalIndex];
      if (building) {
        const timeToWait = Math.max(
          0,
          (building.price - Game.cookies) / Game.cookiesPs
        );
        const clickValue = Game.computedMouseCps
          ? (Game.computedMouseCps / Game.cookiesPs).toFixed(3)
          : 0;

        const txt =
          "Buying " +
          building.name +
          " for " +
          Beautify(Math.round(building.price)) +
          " cookies<br>Time to wait: " +
          Beautify(timeToWait) +
          " seconds" +
          "<br>Each click saves " +
          clickValue +
          " seconds" +
          "<br>Press A to toggle auto-buy (currently " +
          autoBuyTxt +
          ")";

        Game.Ticker = txt;
        Game.TickerAge = CONFIG.PURCHASE_INTERVAL;
      }
    }

    return optimalIndex;
  }

  // Auto-buy interval
  const cookieBot = setInterval(function () {
    try {
      const bestBuilding = optimalBuilding();
      if (autoBuy && bestBuilding >= 0) {
        const building = Game.ObjectsById[bestBuilding];
        if (building && Game.cookies >= building.price) {
          building.buy(1);
        }
      }
    } catch (err) {
      console.debug("Auto-buy error:", err.message);
    }
  }, CONFIG.PURCHASE_INTERVAL);

  // Helper function to stop automation
  window.stopAutomation = function () {
    clearInterval(cookieAutomation);
    clearInterval(cookieBot);
    console.log("Automation stopped");
  };
}

// Export stop function to global scope
window.stopAutomation = function () {
  console.log("Automation not yet started");
};
