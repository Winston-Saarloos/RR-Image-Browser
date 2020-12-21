// https://www.tutorialspoint.com/electron/electron_file_handling.htm
const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const ipcMain = require('electron').ipcMain;

function createWindow () {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1050,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('src/index.html')
  win.removeMenu()
  //win.webContents.openDevTools()

  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});