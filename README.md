# node-red-contrib-topmenu

A Node-RED editor plugin that replaces the hamburger menu with a horizontal menu at the top of the editor.

It provides quicker and easier access to actions, settings and other menu items. Although it adds a little more visual clutter, it also gives the Node-RED editor a layout similar to many other development environments.

The plugin does not recreate or hard-code any Node-RED menu entries. It reuses the original menu, preserving existing IDs, actions, disabled states, toggles, translations, nested menus and entries added by other editor plugins.

<img width="855" height="246" alt="Node-RED editor with the horizontal top menu enabled" src="https://github.com/user-attachments/assets/7ebb0564-c75c-4c73-8f77-567f1c8d79fd" />

## How it works

Node-RED creates its main menu inside `#red-ui-header-button-sidemenu-submenu`. The plugin waits for the editor header to load, then moves that same menu between the Node-RED logo and the editor toolbar. It removes the original dropdown presentation and hides the hamburger button.

The existing flow-tab bar is moved into `#red-ui-workspace` as a 35-pixel-high row. The workspace canvas, vertical scrollbar and right sidebar are then repositioned so they sit correctly below it.

A few other editor elements also need to be moved to make everything fit without unnecessarily reducing or shifting the workspace. The Deploy button and warning indicator are relocated to the top menu, allowing the flow-tab bar to use the full available width.

The top menu automatically adjusts to the width of the browser window. It displays as many menu items as possible and places any remaining items inside a **More** dropdown.

## Requirements

* Node-RED 5.0 or newer
* Node.js 22.9 or newer

## License

MIT
