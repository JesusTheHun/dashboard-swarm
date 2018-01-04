# Extension development

In the extension directory :

```bash
npm run dev
```

This will watch your modifications and bundle everything into the build directory, from where it will be loaded by Google Chrome

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

The script will execute `dist.js` which will copy required files into the dist directory.