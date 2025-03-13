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

      // Purchase Raindeer
      setInterval(function () {
        Game.shimmers.forEach(function (shimmer) {
          if (shimmer.type == "reindeer") {
            shimmer.pop();
          }
        });
      }, 500);
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

var interval = 1000;
var autoBuy = true;
var autoBuyTxt = "on";

document.addEventListener("keydown", function (event) {
  if (event.keyCode == 65) {
    autoBuy = !autoBuy;
    autoBuyTxt = autoBuy ? "on" : "off";
  }
});

function OptimalItem() {
  // Check if game is fully loaded and initialized
  if (!Game || !Game.ready || !Game.ObjectsById || !Game.UpgradesInStore) {
    console.debug("Game not fully loaded, skipping optimization");
    return {
      buy: function () {
        console.debug("Cannot buy: game not ready");
      },
    };
  }

  var cpc = Number.MAX_VALUE;
  var CurrentCps = Game.cookiesPs;
  var sel = null;
  var name = "";
  var price = 0;
  var cpsItem = 0;

  // Check upgrades
  try {
    for (let i = Game.UpgradesInStore.length - 1; i >= 0; i--) {
      var me = Game.UpgradesInStore[i];
      if (!me || !me.id) continue;

      var x = me.id;
      // Skip specific upgrades that might cause issues
      if (x != 64 && x != 74 && x != 84 && x != 85) {
        try {
          let cps1 = 0;
          if (Game.UpgradesById[x] && Game.UpgradesById[x].toggle) {
            Game.UpgradesById[x].toggle();
            Game.CalculateGains();

            // Calculate total CPS
            Game.ObjectsById.forEach(function (obj) {
              if (obj && typeof obj.cps === "function") {
                try {
                  cps1 += obj.cps() * (obj.amount || 0);
                } catch (e) {
                  console.debug("Error calculating CPS for " + obj.name, e);
                }
              }
            });

            var cps2 = cps1 * (Game.globalCpsMult || 1);
            Game.UpgradesById[x].toggle();
            Game.CalculateGains();
            var myCps = cps2 - CurrentCps;

            if (myCps >= 0.1) {
              var cpsUpgrade =
                (me.basePrice * (Game.cookiesPs + myCps)) / myCps;
              if (cpsUpgrade < cpc) {
                cpc = cpsUpgrade;
                sel = me;
                cpsItem = myCps;
                name = me.name;
                price = Math.round(me.basePrice);
              }
            }
          }
        } catch (e) {
          console.debug("Error processing upgrade " + me.name, e);
        }
      }
    }
  } catch (e) {
    console.debug("Error processing upgrades", e);
  }

  // Check buildings
  try {
    Game.ObjectsById.forEach(function (building, i) {
      if (!building || typeof building.cps !== "function") return;

      try {
        let cps1 = 0;
        building.amount++;
        Game.CalculateGains();

        // Calculate total CPS
        Game.ObjectsById.forEach(function (obj) {
          if (obj && typeof obj.cps === "function") {
            try {
              cps1 += obj.cps() * (obj.amount || 0);
            } catch (e) {
              console.debug("Error calculating CPS for " + obj.name, e);
            }
          }
        });

        var cps2 = cps1 * (Game.globalCpsMult || 1);
        building.amount--;
        Game.CalculateGains();
        var myCps = cps2 - CurrentCps;

        if (myCps >= 0.1) {
          var cpsBuilding = (building.price * (Game.cookiesPs + myCps)) / myCps;
          if (cpsBuilding < cpc) {
            cpc = cpsBuilding;
            sel = building;
            cpsItem = myCps;
            name = building.name;
            price = Math.round(building.price);
          }
        }
      } catch (e) {
        console.debug("Error processing building " + building.name, e);
      }
    });
  } catch (e) {
    console.debug("Error processing buildings", e);
  }

  // If nothing was selected, return dummy object
  if (!sel) {
    return {
      buy: function () {
        console.debug("No optimal purchase found");
      },
    };
  }

  // Update ticker
  try {
    var time = (price - Game.cookies) / Game.cookiesPs;
    time = time < 0 ? 0 : Beautify(time);

    var numb = Math.abs(Game.computedMouseCps / Game.cookiesPs);
    numb = numb.toFixed(3);

    Game.Ticker =
      "Buying " +
      name +
      " for " +
      Beautify(price) +
      " at " +
      Beautify(Math.round(price / (cpsItem * (Game.globalCpsMult || 1)))) +
      " cookies per CPS!" +
      "<br>This will take " +
      time +
      " seconds without manually clicking." +
      "<br>Each click would save you " +
      numb +
      " seconds." +
      "<br>Click A to toggle auto-buy. Auto-buy is currently " +
      autoBuyTxt;

    Game.TickerAge = interval;
  } catch (e) {
    console.debug("Error updating ticker", e);
  }

  return sel;
}

// Modify the cookieBot interval to be more resilient
var cookieBot = setInterval(function () {
  try {
    if (!Game || !Game.ready) {
      console.debug("Waiting for game to initialize...");
      return;
    }

    if (autoBuy) {
      const optimal = OptimalItem();
      if (optimal && optimal.buy && typeof optimal.buy === "function") {
        optimal.buy();
      }
    } else {
      OptimalItem();
    }
  } catch (e) {
    console.debug("Error in cookieBot:", e);
  }
}, interval);
