
let BYID = function (id){ return document.getElementById(id) }
let cloneObj = function(obj){ return JSON.parse(JSON.stringify(obj))}
function generateUUIDv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

let STATE = vflux.state
console.log(vflux);


function handleFromMain(data){
    console.log("from_mainProcess", data);
    if (data.type === "ready_state" ) {

    }
}

function handleFromControl(data){
    console.log("from_render_control", data);
    if (data.type === "prepare_flux" ) {

    }
}
