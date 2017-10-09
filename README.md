# Extension development

In the extension directory :

```bash
npm run dev
```

This will watch your modifications and bundle everything into the build directory, from where it will be loaded by Google Chrome

# Start WebSocket server

```bash
npm start -- <BIND_IP> <BIND_PORT> <FLASH_LIFETIME_SECONDS>
```

# Build extension

```bash
npm run dist
```

The script will execute `build.js` which will copy required files into the dist directory.