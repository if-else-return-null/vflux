
const ipc = require('electron').ipcRenderer;


window.vflux = {}
window.vflux.state = {}

// ipc to the main process
window.vflux.ipcSend = function (channel,data) {
    ipc.send(channel, data)
}

//
ipc.on('from_mainProcess', (event, data) => {
    handleFromMainProcess(data)
})

ipc.on('from_render_control', (event, data) => {
    handleFromRenderControl(data)
})
