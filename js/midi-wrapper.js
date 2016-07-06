"use strict";

var midiEvent = function(){
  this.delta = 0;

  // type 0 - midi event, type 1 - system exlusive, type 2 - meta event
  this.type = 0;
  this.track = 0;
  this.id = 0;

  this.channel = 0;
  this.data = null;
};

midiEvent.prototype.copy = function(srcE){
  this.delta = srcE.delta;
  this.type = srcE.type;
  this.track = srcE.track;
  this.id = srcE.id;
  this.channel = srcE.channel;
  this.data = srcE.data.slice();
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

var songTimeSignature = function(){
  this.denominator = 4; //Denominator
  this.numerator = 4; //Numerator
};

var songKeySignature = function(){
  this.key = 0; //(-6)-(6)
  this.mi = 0;   //major(0)/minor(1)
};

var songInfo = function(){
  this.tempo = 500000; //microseconds 500,000
  this.tempoBPM = 120; //BPM
  this.timeSig = new songTimeSignature();
  this.keySig = new songKeySignature();
};

var midiNote = function(){
  this.note = 0;
  this.channel = 0;

  this.startTime = -1;
  this.endTime = -1;
  this.playing = true;

  this.oscillator = null;
  this.gain = null;
};

midiNote.prototype.makeCopy = function(){
  var copy = new midiNote();
  copy.note = this.note;
  copy.channel = this.channel;

  copy.startTime = this.startTime;
  copy.playing = this.playing;

  copy.oscillator = this.oscillator;
  copy.gain = this.gain;

  return copy;
};

function microToMinute(tMicro){
  return tMicro / 60000000; //60,000,000
}

function minuteToMicro(tMinute){
  return tMinute * 60000000; //60,000,000
}

function timePerBeat_BPM(tMicro){
  return Math.round(60000000 / tMicro);
}

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
/*
function log(str, backgroundColor){
  if(backgroundColor === undefined){
    backgroundColor = "#FFFFFF";
  }
  var p = document.createElement("P");
  p.innerHTML = str;
  p.style.backgroundColor = backgroundColor;
  document.body.appendChild(p);
}
*/

var note_frequencies = null;
var midiEvents = [
  0x80, //Note off
  0x90, //Note on
  0xB0  //Controller
];

var metaEvents = [
  0x51, //Tempo
  0x58, //Time signature
  0x59, //Key signature
  //0x2F, //End of Track
];

function freeMemory(arr){
  var emptyInd = -1;
  for(var i = 0; i < arr.length; i++){
    if(arr[i] == null){
      if(emptyInd == -1){emptyInd = i;}
    } else {
      emptyInd = -1;
    }
  }

  if(emptyInd != -1){
    arr.splice(emptyInd);
  }
}

class MidiHandler {
  constructor(audioEngine) {
    //this.channels = [];
    this.playing = false;
    this.currentTime = 0;
    this.realTime = 0;
    this.songPointer = 0;

    this.info = new songInfo();
    this.masterVolume = 100;

    this.currentMidi = null;
    this.usableEvents = null;

    this.engine = audioEngine;

    this.gainNotes = new Array();
    this.activeNotes = new Array();

    this.gain = audioEngine.newGain();
    this.gain.gain.value = 0.01;
    this.gain.connect(audioEngine.getDestination());

    if(!note_frequencies){
      note_frequencies = [128];

      var a = 440;
      for (var x = 0; x < 128; ++x)
      {
         note_frequencies[x] = (a / 32) * Math.pow(2, (x - 9) / 12);
      }
    }

    this.tempoCallback = null;
    this.keyCallback = null;
    this.timeCallback = null;

    setInterval(this.volFalloff.bind(this), 50);
  }

  loadMidi(file){
    this.usableEvents = null;
    this.clearBuffers();

    var data = new Uint8Array(file.target.result);
    var midi = new midiFile();

    var foundHead = false;
    var pointer = {pos: 0};
    var ret = "";

    while (pointer.pos < data.length && ret.length == 0) {
      var id = readIdentifier(pointer, data);
      var chunkLength = readInt(pointer, 4, data);

      console.log("Chunk Type: " + id + ", Length " + chunkLength);

      if(id == "MThd"){
        if(!foundHead) {
          if(chunkLength == 6) {
            var head = new midiHeader();
            head.format = readInt(pointer, 2, data);
            head.numTracks = readInt(pointer, 2, data);

            var format = readInt(pointer, 2, data);
            head.divisions.format = format & 0x8000;
            head.divisions.value = format;
            head.divisions.true_value = format;

            console.log("head properties");

            console.log("- Midi Format: " + head.format);
            console.log("- Midi Number of Tracks: " + head.numTracks);
            console.log("- Timing Format: " + head.divisions.format);
            if(head.divisions.format){
              head.divisions.true_value = (((head.divisions.value >> 8) ^ 0xF) + 1) * (head.divisions.value & 0x00FF);
              console.log("-- Frames Per Second: " + ((head.divisions.value >> 8) ^ 0xF) + 1);
              console.log("-- Ticks Per Frame: " + head.divisions.value & 0x00FF);
              console.log("-- Total Frames: " + head.divisions.true_value);
            } else {
              console.log("-- Ticks Per Quarter Note: " + head.divisions.value);
            }

            midi.header = head;

            foundHead = true;

          } else {
            ret = "Invalid Midi Header";
          }

        } else {
          ret = "Multiple Headers Found";
        }

      } else if(id == "MTrk"){
        var track = new midiTrack();
        var running_status = -1;

        chunkLength += pointer.pos;
        while(pointer.pos < chunkLength){
          var event = new midiEvent();

          event.delta = readVariableLength(pointer, data);
          event.id = readInt(pointer, 1, data);

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
                ret = "Encountered Unkown/Invalid Midi Event" + event.id;
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

          /*
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


          console.log("Event Type: " + stype);
          console.log("- Delta: " + event.delta);
          console.log("- Event ID(Hex): " + event.id.toString(16));
          if(event.type == 0){
            console.log("- Event Channel: " + event.channel);
          }
          console.log("- Event Data(Hex): ");

          var datastr = "";
          event.data.forEach(function(val){
            var tmp = val.toString(16);
            if(tmp.length < 2){tmp = "0" + tmp;}
            datastr += tmp + ", ";
          });
          console.log("-- " + datastr);
          */

          track.events.push(event);
        }

        midi.tracks.push(track);

      } else {
        if(!foundHead){
          ret = "No midi header found";
        } else {
          //console.log("Ignoring Unknown Chunk: " + id);
          pointer.pos += chunkLength;
        }
      }
    }

    this.currentMidi = midi;
    this.parseEvents(midi);

    return ret;
  }

  parseEvents(midiData){
    var t = midiData.header.numTracks;
    var events = [];

    for(var track = 0; track < t; track++){
      var parsedTime = 0;
      var eventP = midiData.tracks[track].events;
      //console.log(midiData.tracks[track]);

      for(var e = 0; e < eventP.length; e++){
        parsedTime += eventP[e].delta;
        var type = eventP[e].type;

        if(type == 0){
          var id = eventP[e].id & 0xF0;

          for(var i = 0; i < midiEvents.length; i++){
            if(id == midiEvents[i]){
              var newEvent = new midiEvent();
              newEvent.copy(eventP[e]);
              newEvent.delta = parsedTime;
              newEvent.track = track;

              events.push(newEvent);
              break;
            }
          }
        } else if (type == 2){
          var id = eventP[e].data[0];

          for(var i = 0; i < metaEvents.length; i++){
            if(id == metaEvents[i]){
              var newEvent = new midiEvent();
              newEvent.copy(eventP[e]);
              newEvent.delta = parsedTime;
              newEvent.track = track;

              events.push(newEvent);
              break;
            }
          }

        }

      }
    }

    //console.log(events);
    //console.log(sortEvents(events));
    //this.usableEvents = sortEvents(events);
    events.sort(function(a, b){
      return a.delta - b.delta;
    });

    this.usableEvents = events;

    for(var i = 0; this.usableEvents.length; i++){
      var type = this.usableEvents[i].type;
      if(type == 2){
        this.processEvent(this.usableEvents[i]);
      } else {
        break;
      }
    }

    console.log(this.usableEvents);
  }

  play(){
    if(this.usableEvents != null && !this.playing){
      this.clearBuffers();
      this.realTime = this.engine.getTime() + 2;
      this.playing = true;

      //console.log("hello");
      this.playCallback();
    }
  }

  playCallback(){
    if(this.playing){
      var now = this.currentTime;
      var realNow = this.realTime;
      var nextTime = Math.round(now + this.info.tempoBPM / 60 * this.currentMidi.header.divisions.true_value);
      //var nextTime = now + this.info.tempoBPM;
      var ind = this.songPointer;
      var notes = this.activeNotes;
      //var gains = this.gainNotes;

      //console.log("Next Time: " + nextTime);

      while(now <= nextTime){
        if(ind < this.usableEvents.length){
          //this.info.tempoBPM = 60;
          var e = this.usableEvents[ind];
          var id;
          var eType = e.type;

          realNow += (e.delta - now) / this.currentMidi.header.divisions.true_value / (this.info.tempoBPM / 60);
          //console.log(realNow);
          //console.log(ind);
          //console.log(now);
          now = e.delta;
          this.processEvent(e, realNow);
          ind++;
        } else {
          //console.log("ended");
          //setTimeout(this.clearBuffers.bind(this), (realNow - this.engine.getTime()) * 1000);
          this.playing = false;
          setTimeout(this.clearBuffers.bind(this), (realNow - this.engine.getTime() + 1) * 1000);
          ind = 0;
          now = 0;
          break;
        }
      }

      this.currentTime = now;
      this.realTime = realNow;
      this.songPointer = ind;
      setTimeout(this.playCallback.bind(this), (realNow - this.engine.getTime()) * 0.8 * 1000);
    }
  }

  processEvent(e, time){
    var eType = e.type;
    var data = e.data;
    var id;

    switch (eType) {
      case 0:
        id = e.id & 0xF0;
        //console.log(id.toString(16));

        switch (id) {
          case midiEvents[0]:
            this.noteOff(readInt({pos: 0}, 1, data), e.channel, time);
            break;

          case midiEvents[1]:
            this.noteOn(readInt({pos: 0}, 1, data), e.channel, time);
            break;
        }

        break;


      case 2:
        id = e.data[0];

        switch(id){
          case metaEvents[0]: //tempo
            this.tempoChange(readInt({pos: 1}, 3, data), time);
            break;

          case metaEvents[1]: //time sig
            this.timeChange(data[1], Math.pow(2, data[2]), time);
            break;

          case metaEvents[2]: //key sig
            this.keyChange(data[1], data[2]);
            break;
        }
        break;
    }
  }

  noteOff(key, channel, time){
    var notes = this.activeNotes;
    for(var i = 0; i < notes.length; i++){
      var tmp = notes[i];

      if(tmp){
        if(tmp.note == key && tmp.channel == channel && tmp.playing){
          notes[i].playing = false;
          notes[i].endTime = time;
          notes[i].oscillator.stop(time);
          break;
        }
      }

    }

  }

  noteOn(key, channel, time){
    var note = new midiNote();
    var self = this;

    note.note = key;
    note.channel = channel;
    note.startTime = time;

    var oscillator = this.engine.newOscillator();
    var gain = this.engine.newGain();
    oscillator.frequency.value = note_frequencies[key];
    oscillator.type = "square";

    oscillator.connect(gain);
    //oscillator.connect(this.engine.getDestination());
    gain.gain.value = 1.0;
    gain.connect(this.gain);

    //oscillator.index = [obj.length, gains.length];

    oscillator.start(time);
    note.oscillator = oscillator;
    note.gain = gain;

    oscillator.lookup = [key, channel];
    oscillator.onended = function(){
      var vals = this.lookup;
      for(var i = 0; i < self.activeNotes.length; i++){
        var tmp = self.activeNotes[i];
        if(tmp){
          if(tmp.note == vals[0] && tmp.channel == vals[1]){
            self.activeNotes.splice(i, 1);
            break;
          }
        }
      }
      //freeMemory(notes);
    };

    self.activeNotes.push(note);
  }

  tempoChange(tMicro, time, call){
    if(call === undefined){
      call = true;
    }
    var newTempo = timePerBeat_BPM(tMicro);

    this.info.tempo = tMicro;
    this.info.tempoBPM = newTempo;

    if(call && this.tempoCallback){
      if(!(time === undefined)){
        setTimeout(this.tempoCallback, time - this.engine.getTime(), newTempo);
      } else {
        this.tempoCallback(newTempo);
      }
    }
  }

  keyChange(key, mi, time, call){
    if(call === undefined){
      call = true;
    }

    var newKey = new songKeySignature();
    newKey.key = key;
    newKey.mi = mi;

    this.info.keySig = newKey;

    if(call && this.keyCallback){
      if(!(time === undefined)){
        setTimeout(this.keyCallback, time - this.engine.getTime(), newKey);
      } else {
        this.keyCallback(newKey);
      }
    }
  }

  timeChange(numerator, denominator, time, call){
    if(call === undefined){
      call = true;
    }

    var newTime = new songTimeSignature();
    newTime.denominator = denominator;
    newTime.numerator = numerator;

    this.info.timeSig = newTime;

    if(call && this.timeCallback){
      if(!(time === undefined)){
        setTimeout(this.timeCallback, time - this.engine.getTime(), newTime);
      } else {
        this.timeCallback(newTime);
      }
    }
  }

  volFalloff(){
    var t = this.engine.getTime();
    var notes = this.activeNotes;
    for(var i = 0; i < notes.length; i++){
      if(notes[i]){
        var vol = Math.max(0, 1 - (t - notes[i].startTime) / 4);
        notes[i].gain.gain.value = vol;
        //console.log(notes[i].gain.gain.value);
      }
    }
  }

  clearBuffers(){
    //this.gainNotes = new Array();
    for(var i = 0; i < this.activeNotes.length; i++){
      if(this.activeNotes[i]){
        this.activeNotes[i].oscillator.stop();
      }
    }
    this.activeNotes.length = 0;
  }
}
