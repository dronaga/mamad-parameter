# mamad parameter extension

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/yourusername/yourrepo.svg?label=last%20commit)](https://github.com/yourusername/yourrepo)
![Chrome Extension](https://img.shields.io/badge/chrome-extension-blue)

A fast, lightweight Chrome extension for discovering parameters (GET, POST, hidden, cookies, JS, AJAX) on any web page. Great for bug bounty hunters, pentesters, and web developers.

## Features
- Finds parameters from URLs, forms, cookies, inline JS, and AJAX/XHR requests
- Filter by parameter type (GET, POST, hidden, cookie, JS, AJAX)
- Search/filter parameters by name
- Import/export parameter lists as text files
- Generate randomized parameter strings with custom prefix and value type (sequential, random, UUID, etc.)
- Responsive, dark-themed UI
- Real-time updates as the page changes (MutationObserver)
- Rescan button for manual refresh
- Reset button to clear filters, search, and output
- Copy feedback and parameter count

## How to Install (Unpacked Extension)
1. Download or clone this repository to your computer.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked** and select the folder containing these files (with `manifest.json`).
5. The extension icon will appear in your Chrome toolbar. Click it to use!

## Usage
- Click the extension icon to open the popup.
- Use checkboxes to filter parameter types.
- Use the search box to filter by name.
- Click **Copy as Randomized String** to copy all parameters in a testable format.
- Use **Import Text**/**Export Text** to save or load parameter lists.
- Click **Rescan** to refresh parameters after page changes or AJAX.
- Click **Reset** to clear all filters, search, and output.

## Notes
- Some parameters (especially those only present in network traffic or sent before the extension loads) may not be detected. For full coverage, use this tool alongside a proxy like Burp Suite.
- No data is sent anywhere; all processing is local in your browser.

## License
MIT 