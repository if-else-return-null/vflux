// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')

let vfluxRenderWindow = null
let vfluxControlWindow = null
let STATE = {}




function createControlWindow () {
    // Create the browser window.
    vfluxControlWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'vflux_control/render_control.js')
        }
    })

    // and load the index.html of the app.
    vfluxControlWindow.loadFile('vflux_control/index.html')

    // Open the DevTools.
    vfluxControlWindow.webContents.openDevTools()
}

function createRenderWindow () {
    // Create the browser window.
    vfluxRenderWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'vflux_render/vflux_display.js')
        }
    })

    // and load the index.html of the app.
    vfluxRenderWindow.loadFile('vflux_render/index.html')

    // Open the DevTools.
    vfluxRenderWindow.webContents.openDevTools()
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

ipcMain.on('from_vflux', (event, data) => {
    //console.log("vfluxControlWindow", data)
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
            vfluxControlWindow.webContents.send("from_mainProcess",{ type:"start_job", jobdata:job })
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
