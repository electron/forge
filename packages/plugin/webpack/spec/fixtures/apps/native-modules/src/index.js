import { app, BrowserWindow, ipcMain } from 'electron';

let count = 0;
ipcMain.on('stdout', (_, line) => {
  console.log(line);
  count += 1;

  if (count > 1) {
    process.exit();
  }
});

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
});

const helloWorld = require('native-hello-world');
console.log(`${helloWorld()} from the main`);

setTimeout(() => {
  process.exit();
}, 10000);
