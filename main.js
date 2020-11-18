// https://www.tutorialspoint.com/electron/electron_file_handling.htm
const { app, BrowserWindow } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 1050,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('src/index.html')
  win.removeMenu()
  //win.webContents.openDevTools()
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