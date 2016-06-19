"use strict";

var midiController;
var audioController;

var objFile;
var objPiano;
var objPianoKeys;

function init(){
  midiController = new MidiHandler();

  objFile = document.getElementById("file");
  objPiano = document.getElementById("piano");

  objFile.value = "";

  objFile.onchange = function(event){
    var reader = new FileReader();
    var file = event.target.files[0];

    reader.onload = midiController.loadMidi.bind(midiController);

    reader.readAsArrayBuffer(file);
  }
}

window.onload = init;
