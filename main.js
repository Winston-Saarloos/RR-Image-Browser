// https://www.tutorialspoint.com/electron/electron_file_handling.htm
const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const ipcMain = require('electron').ipcMain;
const log = require('electron-log');

//autoUpdater.allowPrerelease = true;
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let win;
function createWindow () {
  win = new BrowserWindow({
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
  //autoUpdater.checkForUpdatesAndNotify();
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

// if (win) {
//   autoUpdater.on('update-available', () => {
//     win.webContents.send('update_available');
//   });

//   autoUpdater.on('update-downloaded', () => {
//     win.webContents.send('update_downloaded');
//   });

//   ipcMain.on('restart_app', () => {
//     win.quitAndInstall();
//   });
// }

// app.on('ready', function()  {
//   autoUpdater.checkForUpdatesAndNotify();
// });

//--------------------------------------------------
// Auto Updates
//--------------------------------------------------

function sendStatusToWindow(text) {
  log.info(text);
  if (win) {
    win.webContents.send('message', text);
  }
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (ev, info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (ev, info) => {
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (ev, err) => {
  sendStatusToWindow('Error in auto-updater.');
})
autoUpdater.on('download-progress', (ev, progressObj) => {
  sendStatusToWindow('Download progress...');
})
autoUpdater.on('update-downloaded', (ev, info) => {
  sendStatusToWindow('Update downloaded; will install in 5 seconds');
});

autoUpdater.on('update-downloaded', (ev, info) => {
  // Wait 5 seconds, then quit and install
  // In your application, you don't need to wait 5 seconds.
  // You could call autoUpdater.quitAndInstall(); immediately
  setTimeout(function() {
    autoUpdater.quitAndInstall();  
  }, 5000)
})

app.on('ready', function()  {
  autoUpdater.checkForUpdates();
});