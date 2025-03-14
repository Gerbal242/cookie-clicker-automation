# Cookie Clicker Automation

An advanced automation script for Cookie Clicker that optimizes cookie production through intelligent automation of clicking, building purchases, and upgrade management.

## Features

- 🍪 **Smart Cookie Clicking**: Automatically clicks the big cookie at maximum efficiency
- ✨ **Golden Cookie & Shimmer Collection**: Automatically collects all golden cookies and special events
- 🎯 **Wrinkler Management**: Automatically pops wrinklers to maximize cookie production
- ⚡ **Performance Optimized**: Efficient code with proper error handling and safety checks
- 🎮 **User Controls**: Toggle automation with keyboard shortcuts

## Installation

1. Open Cookie Clicker in your browser
2. Open your browser's developer console:
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+J` (Windows/Linux) or `Cmd+Option+J` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Option+K` (Mac)
3. Copy the entire contents of `main.js`
4. Paste the code into your console and press Enter

## Usage

### Basic Controls

- The script starts automatically after pasting
- Type `stopAutomation()` in the console to stop all automation

### Configuration

The script can be configured through the `CONFIG` object:

```javascript
const CONFIG = {
  TICK_RATE: 1, // How often to click (milliseconds)
  PURCHASE_INTERVAL: 250, // How often to check purchases (milliseconds)
  MAX_LOAD_ATTEMPTS: 60, // Maximum seconds to wait for game load
};
```

### Features Explained

#### Golden Cookie Handling

- Automatically clicks all golden cookies
- Collects reindeer during Christmas season
- Manages wrinklers for optimal cookie production

## Performance

The script is optimized for long-term running with:

- Efficient error handling
- Memory leak prevention
- Safe game state management
- Proper initialization checks

## Troubleshooting

### Common Issues

1. **"Game not fully loaded" message**

   - Wait for the game to fully load before running the script
   - Refresh the page and try again

2. **Script stops working**

   - Type `stopAutomation()` in the console
   - Refresh the page and rerun the script

3. **Performance issues**
   - Adjust `TICK_RATE` and `PURCHASE_INTERVAL` in the CONFIG object
   - Higher values = better performance but slower automation

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - See LICENSE file for details
