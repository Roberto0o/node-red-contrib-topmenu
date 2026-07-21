# Top Menu

`node-red-contrib-topmenu`

Top Menu places Node-RED's main menu in a horizontal bar at the top of the editor. It provides quicker access to existing menu commands while retaining menu items added by Node-RED and other plugins.

## Features

- Moves the native main menu between the Node-RED logo and editor toolbar.
<img width="958.5" height="267" alt="topmenu" src="https://github.com/user-attachments/assets/11cab46c-8e00-48fe-9501-096217256efe" />

- Keeps third-party and plugin-provided menu items.
- Moves the flow-tab bar into the workspace and keeps Deploy at the top right.
- Places menu items that do not fit inside a responsive **More** menu.
- Supports nested dropdowns inside the main bar and **More** menu.

## Behaviour

Hover a menu item to open its dropdown. Moving to another dropdown closes the previous branch, including a dropdown that was pinned open with a click.

Clicking a menu item keeps its dropdown open until another menu branch is opened or the menu is dismissed. Nested entries inside **More** open toward the available side and show a single direction arrow.

The menu recalculates its available width when the editor changes size. Overflowing items move into **More** and return to the main bar when space becomes available.

## Requirements

- Node-RED 5.0 or newer
- Node.js 22.9 or newer

## Contact

Found a bug, have a suggestion, or want to discuss a plugin?

- Start a topic on the [Node-RED Forum](https://discourse.nodered.org/) and tag me.
- Join the [Discord community](https://discord.gg/5KzTRv4g3W).

## License

Licensed under the [MIT License](LICENSE).
