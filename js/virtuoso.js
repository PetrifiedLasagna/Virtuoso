"use strict";

var midiController;
var audioController;

var objDialogContainer;
var objDialog;

var objFile;
var objPlaybtn;

var objTempo;
var objKey;
var objTimeNumerator;
var objTimeDenominator;

var objPiano;
var objPianoKeys;

var prevPressed = [];

function draw(){
  var t = audioController.getTime();
  var notes = midiController.activeNotes;
  var pressed = new Array();

  for(var i = 0; i < notes.length; i++){
    var note = notes[i];
    if(note){
      if(note.startTime <= t && (note.endTime == -1 || note.endTime > t)){
        pressed.push(note.note);
        objPianoKeys[note.note].style.backgroundColor = "#22FF22";
        var foundKey = prevPressed.indexOf(note.note);
        if(foundKey != -1){
          prevPressed.splice(foundKey, 1);
        }
        continue;
      }
    }
  }

  for(var i = 0; i < prevPressed.length; i++){
    objPianoKeys[prevPressed[i]].style.backgroundColor = "";
  }

  prevPressed = pressed;

  requestAnimationFrame(draw);
}

function hideDialogue(){
  objDialogContainer.style.visibility = "hidden";
}

function displayDialogue(content, button){
  if(button === undefined){
    button = false;
  }
  objDialog.innerHTML = content;

  if(button){
    var btn = document.createElement("input");
    //btn.className = "rounded";
    btn.type = "button";
    btn.style.float = "right";
    btn.value = button;

    btn.onclick = hideDialogue;

    objDialog.appendChild(btn);
  }

  objDialogContainer.style.visibility = "visible";
}

var tempo = 120;
var key = new songKeySignature();
var time = new songTimeSignature();

function tempoUpdate(newTempo){
  tempo = newTempo;
  objTempo.innerHTML = tempo + " BPM";
}

function keyUpdate(newKey){
  key = newKey;

  var majorText = ["Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B"];
  var minorText = ["Eb", "Bb", "F", "C", "G", "D", "G#", "C#", "F#", "B", "E", "A"];

  var keyText;
  if(key.mi){
    keyText = minorText[key.key + 6] + " Minor";
  } else {
    keyText = majorText[key.key + 6] + " Major";
  }

  objKey.innerHTML = keyText;
}

function timeUpdate(newTime){
  time = newTime;
  objTimeNumerator.innerHTML = time.numerator.toString();
  objTimeDenominator.innerHTML = time.denominator.toString();
}

function init(){
  audioController = new AudioEngine();
  midiController = new MidiHandler(audioController);

  midiController.tempoCallback = tempoUpdate;
  midiController.keyCallback = keyUpdate;
  midiController.timeCallback = timeUpdate;

  objFile = document.getElementById("file");
  objPlaybtn = document.getElementById("play");
  objPiano = document.getElementById("piano");
  objTempo = document.getElementById("tempo");
  objTimeNumerator = document.getElementById("time-numerator");
  objTimeDenominator = document.getElementById("time-denominator");
  objKey = document.getElementById("key-signature");

  objDialogContainer = document.createElement("div");
  objDialogContainer.style.visibility = "hidden";
  objDialogContainer.className = "dialogueContainer";

  objDialog = document.createElement("div");
  objDialog.className = "dialogue";

  objDialogContainer.appendChild(objDialog);
  document.body.appendChild(objDialogContainer);

  //"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  objPianoKeys = [];
  var keyType = 0;
  for(var i = 0; i < 128; i++){
    var pKey = document.createElement("div");
    pKey.className = "key key" + keyType;
    pKey.id = "key-" + i;
    pKey.index = i;
    objPianoKeys.push(pKey);
    objPiano.appendChild(pKey);

    if(!(i % 12 == 4 || i % 12 == 11)){
      keyType = keyType ^ 1;
    }
  }

  objPlaybtn.onclick = function() {
    midiController.play();
  };

  objFile.value = "";

  objFile.onchange = function(event){
    displayDialogue("<p>Your file is being processed</p><br/><img class='rounded' src='../images/loading2.gif'></img>")
    var reader = new FileReader();
    var file = event.target.files[0];

    reader.onload = function(raw){
      var msg = midiController.loadMidi(raw);
      console.log(msg);
      if(msg != ""){
        displayDialogue("<p>There was a problem loading your file!</p><br/><p>" + msg + "</p>", "Ok");
      } else {
        hideDialogue();
      }
    };

    reader.readAsArrayBuffer(file);
  }

  requestAnimationFrame(draw);
}

window.onload = init;
