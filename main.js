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
    TICK_RATE: 1,                   // How often to run the main loop (in milliseconds)
    MAX_BUILDING_ID: 19,            // Highest building ID in the game
    MAX_UPGRADE_ID: 76,             // Highest upgrade ID in the game
    BULDING_UPGRADE_MULT: 2,
};

// Main automation function
const cookieAutomation = setInterval(function() {
    try {
        // init the variables used
        let building_cost = CONFIG.MIN_BUILDING_COST;
        let upgrade_cost = CONFIG.MIN_UPGRADE_COST;

        // Click the big cookie
        Game.ClickCookie();

        // Click all golden cookies and other shimmers
        Game.shimmers.forEach(shimmer => shimmer.pop());
        
        // Purchase buildings (most expensive first)
        for (let id = CONFIG.MAX_BUILDING_ID; id >= 0; id--) {
            const building = Game.ObjectsById[id];
            CONFIG.MIN_BUILDING_COST = Math.min(CONFIG.MIN_BUILDING_COST, building.price)
            building_cost = CONFIG.MIN_BUILDING_COST;

            // console.log("Printing the building and upgrade in building purchase", building_cost, upgrade_cost)
            // compare building cost to assuring it is > 5* upgrade cost
            if (building && !building.locked && building_cost > (5 * upgrade_cost)) {
                building.buy(1);
                CONFIG.MIN_UPGRADE_COST = Infinity;
            }
        }
        
        // Purchase available upgrades
        for (let id = CONFIG.MAX_UPGRADE_ID; id >= 0; id--) {
            const upgrade = Game.UpgradesById[id];

            if (!upgrade.bought) {
                CONFIG.MIN_UPGRADE_COST = Math.min(CONFIG.MIN_UPGRADE_COST, upgrade.baseprice)
                upgrade_cost = CONFIG.MIN_UPGRADE_COST;
                // console.log("Printing the building and upgrade in upgrade purchase", building_cost, upgrade_cost)

                if (upgrade) {
                    try{
                    upgrade.buy(1);
                    CONFIG.MIN_UPGRADE_COST = Infinity;
                    } catch{}   
                }
            }
        }
    } catch(err) {
        console.error('Stopping automation:', err.message);
        clearInterval(cookieAutomation);
    }
}, CONFIG.TICK_RATE);

// Helper function to stop automation
function stopAutomation() {
    clearInterval(cookieAutomation);
    console.log('Automation stopped');
}

// To stop automation, run: stopAutomation()
