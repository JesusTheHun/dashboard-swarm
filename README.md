# Features

* Remote control
* Multi-screens support
* Add tab
* Custom tab name
* Close tab
* Refresh tab
* Move tab from one screen to another
* Start & stop rotation
* Zoom tab
* Scroll tab
* Send tab to foreground
* Change tab order
* Rotation speed
* Tab crash restoration
* Auto-refresh tab

# Extension development

Master is the head of development. Use releases to build the extension.

Vanilla ES6 is used for background & content scripts
ReactJS is used for the popup

In the ```chrome-extension``` directory :

```bash
npm run dev
```

This will watch your **extension background** modifications and bundle everything into the build directory, from where it will be loaded by Google Chrome.
Unfortunately there is no current way to watch ReactJS, used for the popup.

# Build extension

To build the popup & the inner materials

```bash
npm run dist
```

# Start WebSocket server

```bash
npm start -- <BIND_IP> <BIND_PORT> <STORAGE_FILE>
```

Default to

```bash
npm start -- localhost 8080 storage.json
```

# License

GPL v3