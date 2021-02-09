
let BYID = function (id){ return document.getElementById(id) }
let cloneObj = function(obj){ return JSON.parse(JSON.stringify(obj))}
function generateUUIDv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

let STATE = vflux.state
console.log(vflux);

BYID("video_0").addEventListener('change', (event) => {
    let path = BYID("video_0").files[0].path
    //console.log( "First video path", BYID("first_video").files[0].path );
    //vflux.getVideoFrame(path, 0)
    //vflux.getVideoProbeInfo(path, 0)
})
BYID("video_1").addEventListener('change', (event) => {
    let path = BYID("video_1").files[0].path
    //console.log( "Second video path", BYID("second_video").files[0].path );
    //vflux.getVideoFrame(path, 1)
    //vflux.getVideoProbeInfo(path, 1)
})

function parseFluxSelector () {
    let str = ""
    vflux.FluxTypes.forEach((item, i) => {
      str += `<option value="${item}">${item}</option>`
    });
    BYID("sa_flux_type_selector").innerHTML = str
}


//document.getElementById("myFile").files[0].path

setTimeout(function(){
    //console.log("recorder initialization started ");
    //vflux.getVideoSources();
},1000)

/*
setTimeout(function(){
    console.log("stopping recorder");
    window.capi.mediaRecorder.stop();
},10000)
*/

function handleFromMainProcess(data){
    console.log("from_mainProcess", data);
    if (data.type === "start_job" ) {
        vflux.initJobRecorder(data.jobdata)
    }
}
