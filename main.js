// https://www.tutorialspoint.com/electron/electron_file_handling.htm
const { app, BrowserWindow } = require('electron');

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
  win.webContents.openDevTools()
}

// function syncUserPhotos () {
//   //if (!bUserDisabledPhotoSync) {
//     // look in their file system and see if the folder exists

//     // if not create the folder and download all images to place inside of the folder

//     //else if the folder exists.  For each photo returned by recnet verify it exists in the file system
//   // if it does not then download it from the image database and write the file to disc
//   // Make a request for a user with a given ID
//   axios.get('https://api.rec.net/api/images/v4/player/256147?skip=0&take=50000')
//     .then(function (response) {
//       // handle success
//       console.log(response);
//     })
//     .catch(function (error) {
//       // handle error
//       console.log(error);
//     })
//     .then(function () {
//       // always executed
//     });
// }

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