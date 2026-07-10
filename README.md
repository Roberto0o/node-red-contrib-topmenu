# node-red-contrib-topmenu

A Node-RED editor plugin that replaces the hamburger main menu with a horizontal menu on top of the web page.

The plugin does not recreate or hard-code Node-RED menu entries. Preserving original IDs, actions, disabled states, toggles, translations, nested menus and entries added by other editor plugins.

## How it works

Node-RED creates its main menu as `#red-ui-header-button-sidemenu-submenu`. The plugin waits for the editor header, moves that same menu between the logo and toolbar, removes its root dropdown presentation and hides the original hamburger button.

The existing flow-tab element is moved into `#red-ui-workspace` as a 35-pixel row. The workspace chart, vertical scrollbar and right sidebar container are offset to sit below it.

I had to move a few things around to make it fit properly without the workspace shifting too much. The deploy button and warning have been relocated and the flows tab bar now runs along the way.

The topmenu dynamically changes depending on your window size to fit as many buttons in the topmenu. Rest buttons are placed under the `more` dropdown.

## Requirements

- Node-RED 5.0 or newer
- Node.js 22.9 or newer

## License

MIT
