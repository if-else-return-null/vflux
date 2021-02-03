// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

//window.addEventListener('DOMContentLoaded', () => {

//})

const ipc = require('electron').ipcRenderer;
const {desktopCapturer} = require('electron')
const fs = require("fs")

console.log("pre-load : " , "test");

window.capi = {}

//console.log(window);
// ipc to the main process
window.capi.ipcSend = function (channel,data) {
    ipc.send(channel, data)
}

// *** not used just testing
ipc.on('from_mainProcess', (event, data) => {
    handleFromMainProcess(data)
})


// Get the available video sources
window.capi.getVideoSources = function () {
    let sourceid // video
    let deviceid // audio
    desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
        console.log(sources);
        for (let source of sources) {
            console.log(source.name);
            //console.log(source);
            if (source.name === "vflux_render") {
                //window.capi.setupRecorder(source.id)
                sourceid = source.id
            }
        }
        window.capi.setupRecorder(sourceid)

    })
}

window.capi.mediaRecorder; // MediaRecorder instance to capture footage
window.capi.recordedChunks = [];


window.capi.setupRecorder = async function (sourceid) {
    console.log("setupRecorder",sourceid);
    let constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceid
            }
        }
    }

    let stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Create the Media Recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    window.capi.mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers
    window.capi.mediaRecorder.ondataavailable = window.capi.handleDataAvailable;
    window.capi.mediaRecorder.onstop = window.capi.handleStop;

    //window.capi.mediaRecorder.start();
    console.log("recorder initialization complete ");







}



// Captures all recorded chunks
window.capi.handleDataAvailable = function (e) {
  console.log('video data available');
  window.capi.recordedChunks.push(e.data);
}

// Saves the video file on stop
window.capi.handleStop = async function (e) {
  const blob = new Blob(window.capi.recordedChunks, {
    //type: 'video/webm; codecs=vp9'
    //type: 'video/mp4; codecs=h264'
    type: 'video/ogg; codecs=h264'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  //let filepath = "outvideo.webm"
  //let filepath = "outvideo.mp4"
  let filepath = "outvideo.ogg"
  console.log(filepath);

  fs.writeFile(filepath, buffer, function () {
     console.log('video saved successfully!');
     window.capi.recordedChunks = [];

 })
}
