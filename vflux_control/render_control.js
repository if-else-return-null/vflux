

//window.addEventListener('DOMContentLoaded', () => {

//})

const ipc = require('electron').ipcRenderer;
const {desktopCapturer} = require('electron')
const fs = require("fs")
const { fork , spawn  } = require('child_process');

//-sseof -3 -i inputVideo -update 1 -q:v 1 last.jpg
//ffmpeg -i test.mp4 -vframes 1 -vf "scale=360:-1" small_thumnail.png
let cmd = {ffprobe:"ffprobe", ffplay:"ffplay", ffmpeg:"ffmpeg"}
cmd_options = {
    last_frame:["-y", "-sseof", "-1", "-i", "inputVideo", "-update", "1", "-q:v", "1", "outputFile"],
    first_frame:["-y", "-i", "inputVideo", "-vframes", "1", "outputFile"],
    ffprobe_1:["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", "inputFile"]
}


let mimes = {
    mp4:`video/x-matroska; codecs="h264"`,
    webm:'video/webm; codecs="avc1.64003d"',
    ogg:'video/webm; codecs=vp9'
}
window.vflux = {}
window.vflux.state = {}
window.vflux.FluxTypes = ["none","fade-in","fade-out","slide-up","slide-down"]
window.vflux.state.clip0 = { ffprobe:null, path:null }
window.vflux.state.clip1 = { ffprobe:null, path:null }

//console.log(window);
// ipc to the main process
window.vflux.ipcSend = function (channel,data) {
    ipc.send(channel, data)
}

// *** not used just testing
ipc.on('from_mainProcess', (event, data) => {
    handleFromMainProcess(data)
})

window.vflux.initJobRecorder = function (data) {

    // change the window size to match job options

    // setup the recorer with job options
    window.vflux.getVideoSources(data)
}


// Get the available video sources
window.vflux.getVideoSources = function (data) {
    let sourceid // video
    let deviceid // audio
    desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
        //console.log(sources);
        for (let source of sources) {
            //console.log(source.name);
            //console.log(source);
            if (source.name === "vflux_render") {
                console.log(`\nFound ${source.name} window`);
                sourceid = source.id
            }
        }
        data.sourceid = sourceid
        window.vflux.setupRecorder(data)

    })
}




window.vflux.setupRecorder = async function (data) {
    window.vflux.mediaRecorder = null
    window.vflux.recordedChunks = [];

    console.log(`\nsetupRecorder" , ${data.sourceid}`);
    let constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: data.sourceid
            }
        }
    }

    let stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Create the Media Recorder mimes
    const options = { mimeType:  mimes[data.out_ops.container] };
    window.vflux.mediaRecorder = new MediaRecorder(stream, options);

    // define the handler function


    // Captures all recorded chunks
    window.vflux.handleDataAvailable = function (e) {
      //console.log('video data available');
      window.vflux.recordedChunks.push(e.data);
    }

    // Saves the video file on stop
    window.vflux.handleStop = async function (e) {
      const blob = new Blob(window.vflux.recordedChunks, {

        type: mimes[data.out_ops.container]
      });

      const buffer = Buffer.from(await blob.arrayBuffer());


      let filepath = `outvideo.${data.out_ops.container}`
      //console.log(filepath);

      fs.writeFile(filepath, buffer, function () {
         console.log(`\nvideo saved successfully!`);
         //window.vflux.recordedChunks = [];

     })
    }


    // Register Event Handlers
    window.vflux.mediaRecorder.ondataavailable = window.vflux.handleDataAvailable;
    window.vflux.mediaRecorder.onstop = window.vflux.handleStop;

    //window.vflux.mediaRecorder.start();
    console.log(`\nrecorder initialization complete `);
    //window.vflux.ipcSend("from_vflux", {type:"ready_state", value:true})

    window.vflux.processJob(data)




}


window.vflux.processJob = function (data) {
    console.log("\nprocessing job ", data);
}



window.vflux.getVideoProbeInfo = function(path,index) {
    let options = cloneObj(cmd_options.ffprobe_1)
    options[6] = path
    //console.log(options);
    let output = ""
    let probespawn = spawn(cmd.ffprobe, options)
    probespawn.stdout.on('data', (data) => { output += data });
    probespawn.stderr.on('data', (data) => { console.log("stderr",data.toString());});
    probespawn.on('exit', (code) => {
        window.vflux.state[`clip${index}`].ffprobe = JSON.parse(output)
        console.log("\nFFPROBE: ", code , window.vflux.state[`clip${index}`].ffprobe)
    });

}


// gety the last frame from a video file
//first_frame:["-y", "-i", "inputVideo", "-vframes", "1", "outputFile"],
window.vflux.getVideoFrame = function(path, index) {
    BYID(`video_img_${index}`).src = ""
    window.vflux.state[`clip${index}`].path = path
    let options
    if (index === 0){ //last frame
        options = cloneObj(cmd_options.last_frame)
        options[4] = path
        options[9] =  `video_img_${index}.jpg`
    } else { //first frame
        options = cloneObj(cmd_options.first_frame)
        options[2] = path
        options[5] =  `video_img_${index}.jpg`
    }
    let spawnlog = {out:[], err:[], exit:null}
    let lastspawn = spawn(cmd.ffmpeg, options)
   lastspawn.stdout.on('data', (data) => {
       spawnlog.out.push(data.toString())
   });

   lastspawn.stderr.on('data', (data) => {
       spawnlog.err.push(data.toString())
   });

   lastspawn.on('exit', (code) => {
       spawnlog.exit = code
       console.log(`\ngetVideoFrame ${index} \n ${path} \n`, spawnlog );
       BYID(`video_img_${index}`).src =  `video_img_${index}.jpg`
   });
}
