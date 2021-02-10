

//window.addEventListener('DOMContentLoaded', () => {

//})

const ipc = require('electron').ipcRenderer;
const {desktopCapturer} = require('electron')
const fs = require("fs")
const { fork , spawn  } = require('child_process');

//-sseof -3 -i inputVideo -update 1 -q:v 1 last.jpg
//ffmpeg -i test.mp4 -vframes 1 -vf "scale=360:-1" small_thumnail.png
// ffmpeg -i video.mp4 -ss 00:01:00 -to 00:02:00 -c copy cut.mp4
// ffmpeg -f concat -safe 0 -i mylist.txt -c copy output.wav
// ffprobe -v quiet -print_format json -show_format -show_streams 2021-01-09_08-49-26.mp4
let cmd = {ffprobe:"ffprobe", ffplay:"ffplay", ffmpeg:"ffmpeg"}
let cmd_options = {
    last_frame:["-y", "-sseof", "-1", "-i", "inputVideo", "-update", "1", "-q:v", "1", "outputFile"],
    first_frame:["-y", "-i", "inputVideo", "-vframes", "1", "outputFile"],
    ffprobe_1:["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", "inputFile"],
    cut_clip:["-i", "inputVideo", "-ss", "startTime", "-to", "endTime", "-c", "copy", "outputFile"],
    concat_clips:["-f", "concat", "-safe", "0", "-i", "cliplist", "-c", "copy", "outputFile"],
    resize_opt:["-vf", `scale=WIDTH:HEIGHT:force_original_aspect_ratio=decrease,pad=WIDTH:HEIGHT:(ow-iw)/2:(oh-ih)/2,setsar=1`]
}

let codecs = {mp4:"libx264", webm:"libvpx-vp9", ogg:"libx264"}

let mimes = {
    mp4:`video/x-matroska; codecs="h264"`,
    webm:'video/webm; codecs="vp9"',
    //ogg:'video/webm; codecs=vp9'
}

window.vflux = {}
window.vflux.state = {}
window.vflux.FluxTypes = ["none","fade-in","fade-out","slide-up","slide-down"]
window.vflux.state.clip0 = { ffprobe:null, path:null }
window.vflux.state.clip1 = { ffprobe:null, path:null }


// ipc send channels
window.vflux.ipcSendToDisplay = function (data) {
    ipc.send("to_display_from_control", data)
}

window.vflux.ipcSendToMain = function (data) {
    ipc.send("to_main_from_control", data)
}

// ipc receive channels

ipc.on('from_standalone_main', (event, data) => {
    console.log("from_standalone_main");
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


//-------------------------VOUT------------------------------------------------

let VOUT = {}
VOUT.isWorking = false
VOUT.project_cue = []
VOUT.job = null

// add a new video project job from the mainWindow
VOUT.addProjectToCue = function (data) {
    VOUT.project_cue.push(data)
    console.log("VOUT: Adding new project to cue.");
    if ( VOUT.isWorking === true ) {
        return
    } else {
        VOUT.parseCueItem()
    }


}


VOUT.parseCueItem = function() {
    if ( VOUT.project_cue.length === 0 ) {
        console.log("VOUT: Nothing to parse.");
        VOUT.isWorking = false
        return
    }
    VOUT.isWorking = true
    console.log("VOUT: Parsing Cue Item");
    VOUT.job = VOUT.project_cue.shift()
    VOUT.job.vpaths = {}
    VOUT.job.vorder = []
    VOUT.cutid = 0
    // determine which clips to render
    VOUT.job.mp.clip_order.forEach((item, i) => {
        if (VOUT.job.mp.clips[item].render === true) {
            VOUT.job.vorder.push(item)
            let vpath = VOUT.job.mp.clips[item].video_path
            VOUT.job.vpaths[vpath] = vpath
        }
    });
    console.log(VOUT.job.vorder,VOUT.job.vpaths );
    // check that needed video paths exist
    let pathsOk = true
    for (let path in VOUT.job.vpaths) {
        if (!fs.existsSync(path)) {
            pathsOk = false
        }
    }
    if (pathsOk = false) {
        console.log("VOUT:ERROR:  Some Video files do not exist");
        //*** maybe have to clean up VOUT object and check for more jobs
        return
    }
    // all videos exist so lets cut the clips
    VOUT.job.dir = app_video_out + "/" + getDateNow() +"_"+ getTimeNow() +"("+ VOUT.job.mp.name.trim() +")"

    console.log("VOUT:job.dir: ", VOUT.job.dir);
    fs.mkdirSync(VOUT.job.dir + "/clips", {recursive:true})

    VOUT.compareSourceFormats()



}

VOUT.comp_cout_1 = []

VOUT.compareSourceFormats = function () {
    if (VOUT.comp_cout_1.length === 0) {
        for ( let path in VOUT.job.vpaths){
            VOUT.comp_cout_1.push(path)
        }
    }

    let options = cloneObj(cmd_options.ffprobe_1)
    options[6] = VOUT.comp_cout_1.pop()
    //console.log(options);
    VOUT.job.vpaths[options[6]] = ""
    let probespawn = spawn(cmd.ffprobe, options)
    probespawn.stdout.on('data', (data) => { VOUT.job.vpaths[options[6]] += data });
    probespawn.stderr.on('data', (data) => { console.log("stderr",data.toString());});
    probespawn.on('exit', (code) => {
      console.log(`probespawn exited with code ${code}`);
      //console.log(VOUT.job.vpaths[options[6]]);
      // this job is done check for any more in the cue
      VOUT.job.vpaths[options[6]] = JSON.parse(VOUT.job.vpaths[options[6]])
      if (VOUT.comp_cout_1.length === 0) {
          console.log("all done compareSourceFormats");
          //console.log(VOUT.job.vpaths);
          VOUT.cutClips()
      } else {
          VOUT.compareSourceFormats()
      }

    });


}



//["-i", "inputVideo", "-ss", "startTime", "-to", "endTime", "-c", "copy" "outputFile"]
VOUT.cutClips = function() {
    if (VOUT.cutid === VOUT.job.vorder.length){
        console.log("VOUT: All done cutting clips");
        // call the next step
        VOUT.buildTransitions()
        return;
    }
    let clipid = VOUT.job.vorder[VOUT.cutid] // uuid from client
    let clip = VOUT.job.mp.clips[clipid]
    let  ext = clip.video_path.split(".").pop().toLowerCase()
    let stream = VOUT.job.vpaths[clip.video_path].streams[0]
    console.log("STREAM",stream);
    // check video container
    let force_encode = false
    let formats = VOUT.job.vpaths[clip.video_path].format.format_name.split(",")
    if ( !formats.includes(VOUT.job.options.container)) {
        ext = VOUT.job.options.container
        force_encode = true
    }
    // check video geometry
    let force_resize = false
    pwxh = VOUT.job.options.w + "x" + VOUT.job.options.h
    vwxh = VOUT.job.vpaths[clip.video_path].streams[0].width + "x" + VOUT.job.vpaths[clip.video_path].streams[0].height
    if (vwxh !== pwxh) {
        force_encode = true
        force_resize = true
    }

    clip.clip_filename = clipid +"."+ ext
    clip.clip_path = VOUT.job.dir + "/clips/" + clip.clip_filename
    // cut_clip:["-i", "inputVideo", "-ss", "startTime", "-to", "endTime", "-c", "copy", "outputFile"],
    let options = cloneObj(cmd_options.cut_clip)
    options[1] = clip.video_path
    options[3] = clip.start
    options[5] =  clip.end
    options[8] = clip.clip_path

    // do any modification to the ffmpeg options here
    if (clip.force_encode === true || force_encode === true) {
        console.log("Forced Encoding true");
        //options.splice(6,2)
        options[6] = "-c:v"
        options[7] = codecs[ext]
    }
    // resize_opt:["-vf", "'scale=WIDTH:HEIGHT:force_original_aspect_ratio=decrease,pad=WIDTH:HEIGHT:(ow-iw)/2:(oh-ih)/2,setsar=1'"]
    if ( force_resize === true) {
        let resize = cloneObj(cmd_options.resize_opt)
        resize[1] = resize[1].replace(/WIDTH/g, VOUT.job.options.w ).replace(/HEIGHT/g, VOUT.job.options.h)
        options.splice(6,0,resize[0],resize[1])
    }

    console.log(options);
    let cutspawn = spawn(cmd.ffmpeg, options)
    cutspawn.stdout.on('data', (data) => {
        console.log("stdout",data.toString());
    });

    cutspawn.stderr.on('data', (data) => {
        console.log("stderr",data.toString());
    });

    cutspawn.on('exit', (code) => {
      console.log(`cutspawn exited with code ${code}`);
      VOUT.cutid += 1
      VOUT.cutClips()
    });


}


VOUT.buildTransitions = function () {

    // done building transitions
    VOUT.buildFinalVideo()
}

VOUT.buildFinalVideo = function () {
    let str = ""
    VOUT.job.vorder.forEach((item, i) => { //*** check this on windows
        str += `file ${VOUT.job.mp.clips[item].clip_path.replace(/ /g, "\\ ")}\n`
        //str += `file "${VOUT.job.mp.clips[item].clip_path}"\n`
    });
    console.log(str);
    fs.writeFileSync(VOUT.job.dir + "/cliplist.txt" , str)
    //concat_clips:["-f", "concat", "-safe", "0", "-i", "cliplist", "-c", "copy", "outputFile"]
    let options = cloneObj(cmd_options.concat_clips)
    options[5] = VOUT.job.dir + "/cliplist.txt"
    options[8] = VOUT.job.dir + "/final_render." + VOUT.job.options.container
    console.log(options);
    let concatspawn = spawn(cmd.ffmpeg, options)
    concatspawn.stdout.on('data', (data) => {
        console.log("stdout",data.toString());
    });

    concatspawn.stderr.on('data', (data) => {
        console.log("stderr",data.toString());
    });

    concatspawn.on('exit', (code) => {
      console.log(`concatspawn exited with code ${code}`);
      // this job is done check for any more in the cue
      VOUT.parseCueItem()
    });




}
