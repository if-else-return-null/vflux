
let BYID = function (id){ return document.getElementById(id) }
let cloneObj = function(obj){ return JSON.parse(JSON.stringify(obj))}
function generateUUIDv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}


BYID("first_video").addEventListener('change', (event) => {
    console.log( "First video path", BYID("first_video").files[0].path );
})
BYID("second_video").addEventListener('change', (event) => {
    console.log( "Second video path", BYID("second_video").files[0].path );
})


//document.getElementById("myFile").files[0].path

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
