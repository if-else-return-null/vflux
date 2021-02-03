// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


setTimeout(function(){
    console.log("recorder initialization started ");
    window.capi.getVideoSources();
},1000)

/*
setTimeout(function(){
    console.log("stopping recorder");
    window.capi.mediaRecorder.stop();
},10000)
*/

function handleFromMainProcess(data){
    console.log("from_mainProcess", data);

}
