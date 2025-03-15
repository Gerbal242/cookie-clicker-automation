# Cookie Clicker Automation Script

An advanced automation script for Cookie Clicker that optimizes cookie production through intelligent automation.

## Features

- **Rapid Cookie Clicking**: Automatically clicks the big cookie every millisecond
- **Smart Building Management**:
  - Purchases buildings from most expensive to least expensive
  - Automatically levels up buildings when possible
- **Upgrade Automation**:
  - Automatically purchases available upgrades
  - Excludes problematic upgrades that might interfere with automation
- **Resource Collection**:
  - Automatically collects all golden cookies and shimmers
  - Clicks sugar lumps when ready
- **Ascension Management**:
  - Automatic ascension after configurable time period
  - Purchases heavenly upgrades upon ascension
  - Automatically reincarnates to start new run

## Configuration

The script can be customized through the `CONFIG` object:

```javascript
const CONFIG = {
  CLICK_RATE: 1, // Cookie click interval (milliseconds)
  PURCHASE_RATE: 1000, // Purchase check interval (milliseconds)
  ASCENTION_TIME_AFTER: 86400, // Ascension trigger time (seconds, default 24 hours)
  EXCLUDED_UPGRADES: new Set([64, 74, 84, 85]), // Upgrades to skip
  UPGRADE_COST_RATIO: 1.618, // Golden ratio for future purchase optimization
};
```

### Configuration Options

- `CLICK_RATE`: How frequently to click the big cookie (1ms = 1000 clicks per second)
- `PURCHASE_RATE`: How often to check for possible purchases (1000ms = once per second)
- `ASCENTION_TIME_AFTER`: When to trigger ascension (86400 seconds = 24 hours)
- `EXCLUDED_UPGRADES`: Set of upgrade IDs to skip (these can cause automation issues)
- `UPGRADE_COST_RATIO`: Reserved for future purchase optimization features

## Usage

1. Open Cookie Clicker in your browser
2. Open the browser's developer console (usually F12)
3. Copy and paste the script into the console
4. The automation will start immediately

To stop the automation:

```javascript
stopAutomation();
```

## Performance

The script uses two separate intervals for optimal performance:

- Fast interval (1ms) for cookie clicking and shimmer collection
- Slower interval (1000ms) for purchases and upgrades

This dual-interval system prevents the script from overwhelming the game while maintaining maximum clicking speed.

TIP: If your screen starts to get buggy after a bit of time, increase the purchasing interval
as it does not have a major effect on progress and reduces lots of jitteryness.

## Features in Detail

### Building Management

- Purchases buildings from most expensive to least expensive
- Automatically attempts to level up buildings when possible
- Only purchases when sufficient cookies are available

### Upgrade Handling

- Automatically buys all available upgrades
- Excludes specific upgrades that could interfere with automation
- Checks affordability before attempting purchases

### Ascension System

- Tracks game session time
- Automatically ascends after configured time period (default 24 hours)
- Purchases available heavenly upgrades upon ascension
- Automatically reincarnates to start new run

### Resource Collection

- Clicks the big cookie every millisecond
- Collects all golden cookies and shimmers automatically
- Harvests sugar lumps when ready

## Troubleshooting

If the automation stops unexpectedly:

1. Check the console for error messages
2. Verify that Cookie Clicker is fully loaded
3. Try refreshing the page and rerunning the script

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This script is designed for educational purposes and to enhance the Cookie Clicker experience. Use responsibly!
