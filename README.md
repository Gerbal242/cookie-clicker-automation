# Cookie Clicker Automation

An automation script for Cookie Clicker that optimizes cookie production through intelligent automation of clicking, building purchases, and upgrade management.

## Features

- 🍪 Automatic cookie clicking
- 🏢 Smart building purchases based on cost efficiency
- ⬆️ Automatic upgrade purchases with cost optimization
- ✨ Golden cookie and shimmer collection
- ⚡ Configurable tick rate and other parameters

## Usage

1. Open Cookie Clicker in your browser
2. Open the browser's developer console (usually F12)
3. Copy and paste the contents of `main.js` into the console
4. The automation will start immediately
5. To stop the automation, run `stopAutomation()` in the console

## Configuration

The script can be configured through the `CONFIG` object:

```javascript
const CONFIG = {
    TICK_RATE: 1000,           // Update interval in milliseconds
    MAX_BUILDING_ID: 19,       // Highest building ID in the game
    MAX_UPGRADE_ID: 76,        // Highest upgrade ID in the game
    BULDING_UPGRADE_MULT: 2    // Building to upgrade cost multiplier
};
```

## Strategy

The automation follows these rules:
1. Continuously clicks the big cookie
2. Automatically collects golden cookies and other shimmers
3. Purchases buildings when their cost-efficiency ratio is favorable
4. Buys upgrades when they are more cost-effective than buildings

## License

MIT License - Feel free to use and modify as you wish! 