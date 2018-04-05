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

# Available on the Chrome Store

Visit https://chrome.google.com/webstore/detail/dashboard-swarm/cohiccdmoofaannbeahbjkhhabppmdnn

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

# How to use

Connect your screens to a machine. We'll call it the "master".
On one machine of the network, usually on the master, install the server (instructions below).
Install the extension on the master and every machine that will remotely control the dashboards.
Open the extension, hit the cogs and set the server url and connect.

Your setup is done.

# Install the server

Get the server code. You can get a .zip in the release section ( https://github.com/JesusTheHun/dashboard-swarm/releases ) or you can clone the repo through ```git clone git@github.com:JesusTheHun/dashboard-swarm.git```
Open a command and execute this command :

```bash
npm start -- <LAN_IP>
```

It will listen on port ```8080``` and store your data in the ```storage.json``` file in this directory.
You can set parameters if the default config does not apply to you

```bash
npm start -- <LAN_IP> <PORT> <STORAGE_FILE>
```

# License

GPL v3