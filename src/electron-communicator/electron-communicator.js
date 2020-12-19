const { ipcRenderer } = require("electron");

module.exports.communicator = (ipcMain) => {
    ipcMain.on('asynchronous-message', (event, arg) => {
        console.log(arg);
        event.sender.send('asynchronous-reply', 'pong');
    })
};

module.exports.trasnsponder = (ipcRenderer) => {
    ipcRenderer.on('asynchronous-reply', (event, arg) => {
        console.log(arg);
    });
    
    ipcRenderer.send('asynchronous-message', 'ping');
};
