import { app, BrowserWindow } from 'electron';

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();
});

const helloWorld = require('native-hello-world');
console.log(`main: ${helloWorld()} from the renderer`);
