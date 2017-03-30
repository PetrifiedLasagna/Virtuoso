"use strict";

var midiController;
var audioController;
var gfxController;

var objDialogContainer;
var objDialog;

var objGfxGradient;

var objFile;

var objTime;
var objTimeText;
var objTimeTextEnd;
var objPlaybtn;
var objStopbtn;

var objTempo;
var objKey;
var objTimeNumerator;
var objTimeDenominator;
var objPedal;

var usableColors;
var colorMode;

var keys;
var keymap;

var playStart;

var isActive;

function getKey(value){
  return keys[keymap[value].location];
}

var key0Width = 18;
var key0Height = 75;
var key1Width = 10;
var key1Height = 45;
var keySpr = function(){
  this.x = 0;
  this.y = 0;
  this.width = 0;
  this.height = 0;

  this.type = 0;
  this.color = tRGB(0,0,0);
  this.key = 0;
};

var prevPressed = [];
function drawNote(note, time){
  var room = gfxController.height - key0Height;
  var startTime = note.startTime;
  var endTime = note.endTime;

  var x = getKey(note.note).x;
  var width = getKey(note.note).width;
  var index;
  if(colorMode){
    index = note.track;
  } else {
    index = note.channel;
  }

  var y;
  var height;

  if(endTime > -1){
    y = Math.floor(room * (1 - (endTime - time) / 2));
  } else {
    y = 0;
  }

  if(startTime - time > 2){
    height = 0;
  } else {
    var yy = room * (1 - (startTime - time) / 2);
    var height = Math.floor(yy - y);
  }

  gfxController.fillRect(x, y, width, height, usableColors[index][1]);
  gfxController.fillRect(x + 3, y + 3, width - 6, height - 6, usableColors[index][0]);
}

function newDrawNotes(time){
  var sorts = midiController.activeNotes.slice().sort(function(a, b){
    if(a === null){
      return 1;
    }else if(b === null){
      return -1;
    } else if(colorMode){
      return a.track - b.track;
    }
    return a.channel - b.channel;
  });

  var groups = [];
  var room = gfxController.height - key0Height;
  for(var i = 0; i < sorts.length; i++){
    if(sorts[i]){
      var startTime = sorts[i].startTime;
      var endTime = sorts[i].endTime;

      var xPos = getKey(sorts[i].note).x;
      var width = getKey(sorts[i].note).width;

      var yPos;
      var height;

      if(endTime > -1){
        yPos = Math.floor(room * (1 - (endTime - time) / 2));
      } else {
        yPos = 0;
      }

      if(startTime - time > 2){
        height = 0;
      } else {
        var yy = room * (1 - (startTime - time) / 2);
        var height = Math.floor(yy - yPos);
      }

      if(i == 0){
        groups.push(new Array());
        if(colorMode){
          groups[groups.length - 1].push({col: sorts[i].track, x: xPos, y: yPos, w: width, h: height});
        } else {
          groups[groups.length - 1].push({col: sorts[i].channel, x: xPos, y: yPos, w: width, h: height});
        }

      } else {
        if(colorMode){
          if(sorts[i].track != sorts[i-1].track){
            groups.push(new Array());
          }
          groups[groups.length - 1].push({col: sorts[i].track, x: xPos, y: yPos, w: width, h: height});
        } else {
          if(sorts[i].channel != sorts[i-1].channel){
            groups.push(new Array());
          }
          groups[groups.length - 1].push({col: sorts[i].channel, x: xPos, y: yPos, w: width, h: height});
        }
      }
    }
  }

  for(var g = 0; g < groups.length; g++){
    var indG = groups[g];
    var indC = groups[g][0].col;

    gfxController.setFillStyle(usableColors[indC][1]);
    gfxController.startBuffering();
    gfxController.moveTo(0,0);
    for(var i = 0; i < indG.length; i++){
      gfxController.prepareRect(indG[i].x, indG[i].y, indG[i].w, indG[i].h);
    }
    gfxController.finishRects();

    gfxController.setFillStyle(usableColors[indC][0]);
    gfxController.startBuffering();
    gfxController.moveTo(0,0);
    for(var i = 0; i < indG.length; i++){
      gfxController.prepareRect(indG[i].x + 3, indG[i].y + 3, indG[i].w - 6, indG[i].h - 6);
    }
    gfxController.finishRects();

  }
}

function update(time){
  var notes = midiController.activeNotes;
  var pressed = new Array();

  for(var i = 0; i < notes.length; i++){
    var note = notes[i];
    if(note){
      if(note.startTime < time && (note.endTime == -1 || note.endTime > time)){
        pressed.push(note.note);
        if(colorMode){
          getKey(note.note).color = usableColors[note.track][0];
        } else {
          getKey(note.note).color = usableColors[note.channel][0];
        }
        var foundKey = prevPressed.indexOf(note.note);
        if(foundKey != -1){
          prevPressed.splice(foundKey, 1);
        }
      }
    }
  }

  for(var i = 0; i < prevPressed.length; i++){
    var tmpKey = getKey(prevPressed[i]);
    if(tmpKey.type){
      tmpKey.color = tRGB(0,0,0);
    } else {
      tmpKey.color = tRGB(255,255,255);
    }
  }

  prevPressed = pressed;
}

function draw(){
  //gfxController.setDrawMode("source-over");
  //gfxController.fillRect(0, 0, gfxController.width, gfxController.height, tRGB(0, 0, 0));
  var t = audioController.getTime();
  if(isActive){
    gfxController.clearRect(0, 0, gfxController.width, gfxController.height - key0Height - 1);
    update(t);
    newDrawNotes(t);

    for(var i = 0; i < keys.length; i++){
      var tmpkey = keys[i];
      gfxController.fillRect(tmpkey.x, tmpkey.y, tmpkey.width, tmpkey.height, tmpkey.color);
      gfxController.drawRect(tmpkey.x, tmpkey.y, tmpkey.width, tmpkey.height, tRGB(0, 0, 0));
    }

    //gfxController.putImage(gfxGradient, 0, 0);
    gfxController.swapBuffers();
    requestAnimationFrame(draw);
  } else {
    setTimeout(draw, 1000); //minimum for most browsers is 1s when not focused
  }
  if(midiController.playing){
    var d = Math.max(0, Math.min(objTime.max, t - playStart) );
    objTime.value = d;
    objTimeText.value = Math.floor(d / 60).toString() + ":" + Math.round(d - Math.floor(d / 60) * 60).toString();
    if(midiController.realTime - t < 4 || midiController.realTime < t){
      midiController.playCallback(Math.abs(midiController.realTime - t));
    }
  }
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
var pedal = false;

function tempoUpdate(newTempo){
  tempo = newTempo;
  objTempo.innerHTML = tempo + " BPM";
}

function keyUpdate(newKey){
  key = newKey;

  var majorText = ["Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#"];
  var minorText = ["Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#"];

  var keyText;
  if(key.mi){
    keyText = minorText[key.key + 7] + " Minor";
  } else {
    keyText = majorText[key.key + 7] + " Major";
  }

  objKey.innerHTML = keyText;
}

function timeUpdate(newTime){
  time = newTime;
  objTimeNumerator.innerHTML = time.numerator.toString();
  objTimeDenominator.innerHTML = time.denominator.toString();
}

function pedalUpdate(newPedal){
  pedal = newPedal;
  if(pedal){
    objPedal.style.filter = "unset";
  } else {
    objPedal.style.filter = "";
  }
}

function loadPresetDCall(buffer){
  midiController.setSample(buffer, 69, 0, 0);
  hideDialogue();
}

function loadPresetECall(e){
  displayDialogue("<p>Failed to load preset</p><p>" + e.err + "</p><p>Using default preset</p>", "OK");
}

//Loads a preset which must be fetched with XMLRequest
function loadPresetRCall(e){
  var data = this.response;
  audioController.decodeFile(data, loadPresetDCall, loadPresetECall);
}

function loadPreset(sampleName){
  var fetcher = new XMLHttpRequest();
  fetcher.onload = loadPresetRCall;
  fetcher.open("GET", "audioSamples/" + sampleName + ".ogg", true);
  fetcher.responseType = "arraybuffer";

  fetcher.send(loadPresetRCall);
}

function initDOM(){
  objFile = document.getElementById("file");
  objTime = document.getElementById("time");
  objTimeText = document.getElementById("time-text");
  objTimeTextEnd = document.getElementById("time-text-end");
  objPlaybtn = document.getElementById("play");
  objStopbtn = document.getElementById("stop");
  objTempo = document.getElementById("tempo");
  objGfxGradient = document.getElementById("gfx-gradient");
  objTimeNumerator = document.getElementById("time-numerator");
  objTimeDenominator = document.getElementById("time-denominator");
  objKey = document.getElementById("key-signature");
  objPedal = document.getElementById("pedal");

  objPlaybtn.onclick = function() {
    if(midiController.playing == false){
      midiController.play(2);
      var d = midiController.usableEvents[midiController.songPointer].timeCode;
      playStart = audioController.getTime() - d + 2;
    }
  };

  objStopbtn.onclick = function(){
    if(midiController.playing == true){
      midiController.stop();
      midiController.clearBuffers();
      midiController.setTimeCode(objTime.valueAsNumber);
    }
  };

  objTime.value = 0;
  objTimeText.value = objTimeTextEnd.value = "0:0";

  objTime.oninput = function(){
    if(midiController.playing == true){
      midiController.stop();
      midiController.clearBuffers();
    }
    var d = objTime.valueAsNumber;
    objTimeText.value = Math.floor(d / 60).toString() + ":" + Math.round(d - Math.floor(d / 60) * 60).toString();
    midiController.setTimeCode(d);
  };

  objFile.value = "";
  objFile.onchange = function(event){
    displayDialogue("<p>Your file is being processed</p><br/><img class='rounded fit' src='images/loading2.gif'></img>");
    var reader = new FileReader();
    var file = event.target.files[0];

    reader.onload = function(raw){
      var msg = midiController.loadMidi(raw);
      if(msg != ""){
        displayDialogue("<p>There was a problem loading your file!</p><br/><p>" + msg + "</p>", "OK");
      } else {
        colorMode = midiController.currentMidi.header.format == 2;

        var d = midiController.info.duration.toFixed(1);
        objTime.max = d;
        objTimeTextEnd.value = Math.floor(d / 60).toString() + ":" + Math.round(d - Math.floor(d / 60) * 60).toString();
        objTime.value = 0;
        objTimeText.value = "0:0";

        displayDialogue("<p>Your file was succsessfully loaded!</p>", "OK");
      }
    };

    reader.readAsArrayBuffer(file);
  }

}

function initGradient(){
  var tmpCol = window.getComputedStyle(objGfxGradient, null).getPropertyValue("background-color").replace(/[^\d,]/g, '').split(',');
  objGfxGradient.style.backgroundColor = "transparent";
  //objGfxGradient.style.background = "linear-gradient(to bottom, " + tmpCol + ", rgba(0,0,0,0))";
  //tmpCol = null;

  var gfxGradient = gfxController.createImageData(gfxController.width, Math.floor(gfxController.height * 0.1));
  for(var i = 0; i < gfxGradient.data.length; i+=4){
    gfxGradient.data[i] = parseInt(tmpCol[0], 10);
    gfxGradient.data[i + 1] = parseInt(tmpCol[1], 10);
    gfxGradient.data[i + 2] = parseInt(tmpCol[2], 10);
    gfxGradient.data[i + 3] = Math.floor(255 * (1 - i / 4 / gfxController.width / Math.floor(gfxController.height * 0.1)));
  }

  gfxController.clearScreen();
  gfxController.putImage(gfxGradient, 0, 0);

  var tmpImg = document.createElement("img");
  tmpImg.style.width = "100%";
  tmpImg.width = gfxController.width;
  tmpImg.height = gfxController.height;
  tmpImg.src = gfxController.toUrl();
  objGfxGradient.appendChild(tmpImg);
}

function initKeyboard(){
  var keyType = 0;
  keys = [];
  var keyPos = Math.floor(gfxController.width / 2 - 75 * key0Width / 2);
  for(var i = 0; i < 128; i++){
    var tmpKey = new keySpr();
    tmpKey.x = Math.floor(keyPos);
    tmpKey.y = gfxController.height - key0Height - 1;
    tmpKey.type = keyType;
    tmpKey.key = i;
    if(keyType){
      tmpKey.width = key1Width;
      tmpKey.height = key1Height;
      tmpKey.color = tRGB(0,0,0);
      keyPos += key1Width/2;
    } else {
      tmpKey.width = key0Width;
      tmpKey.height = key0Height;
      tmpKey.color = tRGB(255,255,255);
      keyPos += key0Width - key1Width/2;
    }

    keys.push(tmpKey);

    if(!(i % 12 == 4 || i % 12 == 11)){
      keyType = keyType ^ 1;
    } else {
      keyPos += key1Width/2;
    }
  }

  keys.sort(function(a,b){
    return a.type - b.type;
  });
  keymap = keys.map(function(obj, index){
    return {key: obj.key, location: index};
  });
  keymap.sort(function(a,b){
    return a.key - b.key;
  });
}

function initColors(){
  var colors = [
    tRGB(238, 6, 6), //Red
    tRGB(13, 6, 238), //Blue
    tRGB(17, 188, 4), //Green
    tRGB(227, 223, 7), //Yellow
    tRGB(248, 175, 16), //Orange
    tRGB(248, 16, 171), //Pink
    tRGB(202, 16, 248), //Light Purple
    tRGB(16, 194, 248), //Teal
    tRGB(200,200,200), //Light Gray
    tRGB(100,100,100) //Dark Gray
  ];

  usableColors = []
  for(var i = 0; i < colors.length; i++){
    usableColors[i] = [];
    var color = colors[i]
    usableColors[i][0] = color;
    usableColors[i][1] = tRGB(Math.floor(color.r * 0.6),
                              Math.floor(color.g * 0.6),
                              Math.floor(color.b * 0.6));
  }
}

function init(){
  isActive = true;
  window.onfocus = function(e){
    e.stopPropagation();
    isActive = true;
  };

  window.onblur = function(e){
    e.stopPropagation();
    isActive = false;
  };

  objDialogContainer = document.createElement("div");
  objDialogContainer.style.visibility = "hidden";
  objDialogContainer.className = "dialogueContainer";

  objDialog = document.createElement("div");
  objDialog.className = "dialogue";

  objDialogContainer.appendChild(objDialog);
  document.body.appendChild(objDialogContainer);
  displayDialogue("<p><strong>Initializing...<br/>Please Wait</strong></p><img class='rounded fit' src='images/loading2.gif'></img>");

  initDOM();

  audioController = new AudioEngine();
  midiController = new MidiHandler(audioController);
  gfxController = new GfxEngine("Application");

  initGradient();

  midiController.tempoCallback = tempoUpdate;
  midiController.keyCallback = keyUpdate;
  midiController.timeCallback = timeUpdate;
  midiController.pedalCallback = pedalUpdate;

  initKeyboard();

  initColors();

  switch (window.location.protocol) {
    case "http:":
    case "https:":
      loadPreset("e-piano");
      break;

    case "file:":
      displayDialogue("<p>Running in local mode</p><p>Defaulting to generated preset</p>", "OK");
      break;

    default:
      displayDialogue("<p>Unknown protocol type</p><p>Defaulting to generated preset</p>", "OK");
      break;
  }
  requestAnimationFrame(draw);
}

window.onload = init;
