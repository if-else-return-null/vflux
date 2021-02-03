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
        navigator.mediaDevices.enumerateDevices().then((adevices) => {
            console.log("device_web_audio", adevices);
            //devices = devices.filter((d) => d.kind === 'audioinput');
            for (let device of adevices) {
                console.log(device.kind, device.deviceId);
                //console.log(device);
                if (device.kind === "audiooutput") {
                    //window.capi.setupRecorder(source.id)
                    deviceid = device.deviceId
                }
            }
            window.capi.setupRecorder(sourceid,deviceid)
        });
    })
}

window.capi.mediaRecorder; // MediaRecorder instance to capture footage
window.capi.recordedChunks = [];


window.capi.setupRecorder = async function (sourceid, deviceid) {
    console.log("setupRecorder",sourceid, deviceid);
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
    // get the audio
    console.log("starting audio context");
    navigator.mediaDevices.getUserMedia({audio: { deviceId:deviceid } , video: false}).then(function(mediaStream){
        console.log(" starting audio context 2",mediaStream.getTracks());
      var audioTracks = mediaStream.getAudioTracks();
      console.log("audioTracks", audioTracks);

      // mix audio tracks
      if(audioTracks.length > 0){
        var mixAudioTrack = mixTracks(audioTracks);
        stream.addTrack(mixAudioTrack);
      }

      //stream.addTrack(audioTrack);
      console.log("here");
      // Create the Media Recorder
      const options = { mimeType: 'video/webm; codecs=vp9' };
      window.capi.mediaRecorder = new MediaRecorder(stream, options);

      // Register Event Handlers
      window.capi.mediaRecorder.ondataavailable = window.capi.handleDataAvailable;
      window.capi.mediaRecorder.onstop = window.capi.handleStop;

      //window.capi.mediaRecorder.start();
      console.log("recorder initialization complete ");


    }).catch(function(err) {
      //console.log("handle stream error");
    })






}

function mixTracks(tracks) {
  var ac = new AudioContext();
  var dest = ac.createMediaStreamDestination();
  for(var i=0;i<tracks.length;i++) {
    const source = ac.createMediaStreamSource(new MediaStream([tracks[i]]));
    source.connect(dest);
  }
  return dest.stream.getTracks()[0];
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

//console.log(navigator);



function startRecord() {
    electron.desktopCapturer.getSources({types: ['window', 'screen']}, (error, sources) => {
      if (error) throw error
      for (let i = 0; i < sources.length; ++i) {
        if (sources[i].name === "foo") {
          navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sources[i].id,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720
              }
            }
          })
            .then((stream) => handleStream(stream))
            .catch((e) => handleError(e))
          return
        }
      }
    });
}

function handleStream(stream) {
    navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(function(mediaStream){
      var audioTracks = mediaStream.getAudioTracks();
      //add video and audio sound
      var medias = $("audio,video");
      for (var i = 0; i < medias.length; i++) {
        var tmpStream = medias[i].captureStream();  // mainWindow = new BrowserWindow({webPreferences: {experimentalFeatures: true} })
        if(tmpStream) {
          var tmpTrack = tmpStream.getAudioTracks()[0];
          audioTracks.push(tmpTrack);
        }
      }

      // mix audio tracks
      if(audioTracks.length > 0){
        var mixAudioTrack = mixTracks(audioTracks);
        stream.addTrack(mixAudioTrack);
      }

      stream.addTrack(audioTrack);
      //recorder = new MediaRecorder(stream);
      recorder.ondataavailable = function(event) {
        // deal with your stream
      };
      recorder.start(1000);
    }).catch(function(err) {
      //console.log("handle stream error");
    })
}
