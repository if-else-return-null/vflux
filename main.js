// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')

let vfluxWindow = null
let STATE = {}




function createWindow () {
    // Create the browser window.
    vfluxWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // and load the index.html of the app.
    vfluxWindow.loadFile('index.html')

    // Open the DevTools.
    vfluxWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()
    //getVideoSources()
    //console.log("DEBUG",desktopCapturer);
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

let VFLUX = {}
VFLUX.jobs = []
//VFLUX.isReady = false
VFLUX.isWorking = false

ipcMain.on('from_vflux', (event, data) => {
    //console.log("from_vfluxWindow", data)
    //if (data.type === "ready_state"){ VFLUX.handleReady(data) }
    if (data.type ===  "job_complete"){ VFLUX.handleDone(data) }

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
            vfluxWindow.webContents.send("from_mainProcess",{ type:"start_job", jobdata:job })
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
    VFLUX.addNewJob(test_job)
},5000)
