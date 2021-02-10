
const ipc = require('electron').ipcRenderer;


window.vflux = {}
window.vflux.state = {}

// ipc to the main process
window.vflux.ipcSendToConrol = function (data) {
    ipc.send("to_control_from_display", data)
}
//*** this may not be needed
window.vflux.ipcSendToMain = function (data) {
    ipc.send("to_main_from_display", data)
}


ipc.on('from_control', (event, data) => {
    handleFromControl(data)
})

ipc.on('from_main', (event, data) => {
    handleFromMain(data)
})
