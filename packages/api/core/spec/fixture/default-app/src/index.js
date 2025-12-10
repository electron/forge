const { app, BrowserWindow } = require('electron');

const createWindow = () => {
  const mainWindow = new BrowserWindow();

  // and load the index.html of the app.
  mainWindow.loadURL('https://electronjs.org');
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
