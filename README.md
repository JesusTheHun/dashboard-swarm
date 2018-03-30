Master is the head of development. Use releases to build the extension.

# Extension development

In the extension directory :

```bash
npm run dev
```

This will watch your **extension background** modifications and bundle everything into the build directory, from where it will be loaded by Google Chrome.
Unfortunately there is no current way to watch ReactJS, used for the popup.

# Start WebSocket server

```bash
npm start -- <BIND_IP> <BIND_PORT> <STORAGE_FILE>
```

Default to

```bash
npm start -- localhost 8080 storage.json
```

# Build extension

```bash
npm run dist
```

# License

GPL v3