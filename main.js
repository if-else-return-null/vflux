// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')

let renderDisplayWindow = null
let renderControlWindow = null
let STATE = {}




function createControlWindow () {
    // Create the browser window.
    renderControlWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'control/render_control.js')
        }
    })

    // and load the index.html of the app.
    renderControlWindow.loadFile('vflux_control/index.html')

    // Open the DevTools.
    renderControlWindow.webContents.openDevTools()
}

function createDisplayWindow () {
    // Create the browser window.
    renderDisplayWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'display/render_display.js')
        }
    })

    // and load the index.html of the app.
    renderDisplayWindow.loadFile('vflux_render/index.html')

    // Open the DevTools.
    renderDisplayWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
    createControlWindow()

})

app.on('window-all-closed', function () {
    //if (process.platform !== 'darwin') app.quit()
    app.quit()
})



let VFLUX = {}
VFLUX.jobs = []

VFLUX.isWorking = false


ipcMain.on('to_display_from_control', (event, data) => {
    // this just passes data between windows
    renderDisplayWindow.webContents.send("from_control",data)


})

ipcMain.on('to_main_from_control', (event, data) => {
    //console.log("renderControlWindow", data)
    if (data.type ===  "job_complete"){ VFLUX.handleDone(data) }
})


ipcMain.on('to_control_from_display', (event, data) => {
    // this just passes data between windows
    renderDisplayWindow.webContents.send("from_display",data)


})

ipcMain.on('to_main_from_display', (event, data) => {
    console.log("to_main_from_display", data)

})




/*
VFLUX.handleReady = function (data) {
    console.log("vflux ready_state ", data);
    VFLUX.isReady = data.value
    // check for a new job
}
*/
VFLUX.handleDone = function (data) {
    console.log("vflux done ", data);
    VFLUX.isWorking = false
    // try to do another job
    VFLUX.doJob()
}

VFLUX.addNewJob = function (data) {
    VFLUX.jobs.push(data)
    if (VFLUX.isWorking === false) {
        VFLUX.doJob()
    }
}

VFLUX.doJob = function () {

    if (VFLUX.isWorking === false  ) {
        if(VFLUX.jobs.length !== 0){
            VFLUX.isWorking = true
            let job = VFLUX.jobs.shift()
            renderControlWindow.webContents.send("from_standalone_main",{ type:"start_job", jobdata:job })
        } else {
            console.log("doJob: vflux has no jobs left");
        }
    } else {
        console.log("doJob: vflux is busy");
    }
}

let test_job = {
    out_ops:{
        h:1080,
        w:1920,
        container:"mp4",
        codec_name:"h264"
    },
    clip0:"",
    clip1:"",
    duration:5,
    flux_type:"fade"
}



setTimeout(function (){
    //VFLUX.addNewJob(test_job)
},5000)
