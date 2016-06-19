"use strict";

var midiEvent = function(){
  this.delta = 0;

  // type 0 - midi event, type 1 - system exlusive, type 2 - meta event
  this.type = 0;
  this.id = 0;

  this.channel = 0;
  this.data = null;
};

var midiTrack = function(){
  this.name = "";
  this.events = [];
};

var midiHeader = function(){
  this.format = 0;
  this.numTracks = 0;
  this.divisions = {
                    type: 0,
                    value: 0,
                    true_value: 0
                   };
};

var midiFile = function(){
  this.header = new midiHeader();
  this.tracks = [];
};

function readIdentifier(pointer, data){
  var id = "";
  for(var i = 0; i < 4; i++){
    id += String.fromCharCode(data[pointer.pos + i]);
  }
  pointer.pos += 4;

  return id;
}

function readInt(pointer, numBytes, data){
  var num = 0;
  for(var i = 0; i < numBytes; i++){
    num += data[pointer.pos + i] << (numBytes - i - 1) * 8;
  }

  pointer.pos += numBytes;
  return num;
}

function readVariableLength(pointer, data){
  var bytes = [];
  var tmp = 0xFF;

  while(tmp & 0x80){
    tmp = readInt(pointer, 1, data);
    bytes.push(tmp & 0x7F);
  }

  tmp = 0;
  for(var i = 0; i < bytes.length; i++){
    tmp += bytes[i] << (bytes.length - i - 1) * 7;
  }

  return tmp;
}

function readArray(pointer, len, data){
  var bytes = [];
  for(var i = 0; i < len; i++){
    bytes.push(readInt(pointer, 1, data));
  }


  return bytes;
}

function readSystemEvent(pointer, data){
  var bytes = [];
  var datalen = readVariableLength(pointer, data);
  bytes = readArray(pointer, datalen, data);

  return bytes;
}

function readMetaEvent(pointer, data){
  var type = readInt(pointer, 1, data);

  var bytes = readSystemEvent(pointer, data);
  bytes.unshift(type);

  return bytes;
}

function log(str, backgroundColor = "#FFFFFF"){
  var p = document.createElement("P");
  p.innerHTML = str;
  p.style.backgroundColor = backgroundColor;
  document.body.appendChild(p);
}

class MidiHandler {
  constructor() {
    this.channels = [];
    this.currentTime = 0;
    this.tempo = 0;
    this.masterVolume = 100;

    this.currentMidi = null;
  }

  loadMidi(file){
    var data = new Uint8Array(file.target.result);
    var midi = new midiFile();

    var foundHead = false;
    var pointer = {pos: 0};
    while (pointer.pos < data.length) {
      if(!foundHead && pointer.pos != 0){
        log("Invalid Midi File");
        break;
      }
      var id = readIdentifier(pointer, data);
      var chunkLength = readInt(pointer, 4, data);

      log("Chunk Type: " + id + ", Length " + chunkLength, "#999999");

      switch (id) {
        case "MThd":
          if(!foundHead && chunkLength == 6){
            var head = new midiHeader();
            head.format = readInt(pointer, 2, data);
            head.numTracks = readInt(pointer, 2, data);

            var format = readInt(pointer, 2, data);
            head.divisions.format = format & 0x8000;
            head.divisions.value = format;

            log("head properties", "#33FF33");

            log("- Midi Format: " + head.format);
            log("- Midi Number of Tracks: " + head.numTracks);
            log("- Timing Format: " + head.divisions.format);
            if(head.divisions.format){
              log("-- Frames Per Second: " + Math.abs(head.divisions.value >> 8));
              log("-- Ticks Per Frame: " + head.divisions.value & 0x00FF);
            } else {
              log("-- Ticks Per Quarter Note: " + head.divisions.value);
            }

            midi.header = head;

            foundHead = true;
          } else {
            log("Multiple Headers Found or Header is invalid length", "#FF3333");
          }
          break;

        case "MTrk":
          var track = new midiTrack();
          var running_status = -1;

          chunkLength += pointer.pos;
          while(pointer.pos < chunkLength){
            var event = new midiEvent();

            event.delta = readVariableLength(pointer, data);

            var tmp = readInt(pointer, 1, data);
            event.id = tmp;

            if(event.id == 0xF0 || event.id == 0xF7){
              running_status = -1;
              event.type = 1;

              event.data = readSystemEvent(pointer, data);
              if(event.id == 0xF0){
                event.data.unshift(0xF0);
              }

            } else if (event.id == 0xFF) {
              event.type = 2;
              event.data = readMetaEvent(pointer, data);
            } else {
              event.type = 0;
              event.data = [];

              if(event.id < 0x80 || event.id > 0xEF){
                if(running_status != -1){
                  event.data.push(event.id);
                  event.id = running_status;
                } else {
                  log("Unkown Midi Event", "#FF3333");
                  foundHead = false;
                  break;
                }
              }

              event.channel = event.id & 0x0F;

              var datalen = 2;
              if((event.id & 0xF0) == 0xC0 || (event.id & 0xF0) == 0xD0){
                datalen = 1;
              }

              var eventData = readArray(pointer, datalen, data);
              event.data = event.data.concat(eventData);

              running_status = event.id;
            }

            var stype = "";
            switch (event.type) {
              case 0:
                stype = "Midi Controller";
                break;
              case 1:
                stype = "System Exclusive";
                break;
              case 2:
                stype = "Meta Controller";
                break;
            }

            log("Event Type: " + stype, "#33FF33");
            log("- Event ID(Hex): " + event.id.toString(16));
            if(event.type == 0){
              log("- Event Channel: " + event.channel);
            }
            log("- Event Data(Hex): ");
            var datastr = "";
            event.data.forEach(function(val){
              var tmp = val.toString(16);
              if(tmp.length < 2){tmp = "0" + tmp;}
              datastr += tmp + ", ";
            });
            log("-- " + datastr);

            track.events.push(event);
          }

          midi.tracks.push(track);

          break;

        default:
          log("Ignoring Unknown Chunk: " + id, "#FFFF00");
          pointer.pos += chunkLength;
      }
    }
  }
}
