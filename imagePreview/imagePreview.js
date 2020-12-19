const { electron, app, ipcRenderer } = require('electron');
const { transponder } = require('../electron-communicator/electron-communicator');

const JS = () => {
    console.log('Hello.. Image Preview is visible.');
    transponder(ipcRenderer);
};