"use strict";

var AudioFile = function (){
  this.length = 0; // Number of samples
  this.duration = 0; // Time in seconds
  this.sampleRate = 0; // Sample rate
  this.channels = 0; // Number of channels
  this.data = []; //Audio/Waveform data
};

var audioCtx = null;

class AudioEngine {
  constructor (){
    // All of the necessary audio control variables
    if(!audioCtx){
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }

    // Will hold audio data waiting to be played
    this.buffer = null;

    this.source = null;

    // This will hold the decoded audio file upon completion
    this.decodedFile = new AudioFile();

    // Automatically create buffer upon finished decoding?
    this.autoCreateBuffer = true;

    // Specify this if you want to have a function recieve
    // the decoded audio, i.e. completionCallback(decodedFile);
    this.completionCallback = null;
  }

  // This will decode an audio file
  fileCallback (event){
    console.log("file callback");
    this.buffer = null;
    this.decodedFile = null;
    if(this.source){
      this.source.stop(0);
    }

    var reader = new FileReader();
    var file = event.target.files[0];
    reader.onload = this.loadCallback.bind(this);

    reader.readAsArrayBuffer(file);
  }

  // Called by fileCallback after file has been loaded
  loadCallback (file){
    console.log("load callback");
    var raw = file.target.result;
    audioCtx.decodeAudioData(raw, this.decodeCallback.bind(this));
  }

  // Called by loadCallback after file has been decoded
  decodeCallback (data){
    console.log("decode callback");
    var audioTemp = new AudioFile();

    audioTemp.length = data.length;
    audioTemp.duration = data.duration;
    audioTemp.sampleRate = data.sampleRate;
    audioTemp.channels = data.numberOfChannels;

    var arr = [];
    for(var i = 0; i < data.numberOfChannels; i++){
      arr.push(new Float32Array(data.length));
      data.copyFromChannel(arr[i], i);
    }

    audioTemp.data = arr.slice(0);
    this.decodedFile = audioTemp;

    if(this.autoCreateBuffer){
      var buffer = audioCtx.createBuffer(audioTemp.channels, audioTemp.length, audioTemp.sampleRate);

      var samples;
      for(var c = 0; c < audioTemp.channels; c++){
        samples = buffer.getChannelData(c);
        for(var i = 0; i < audioTemp.length; i++){
          samples[i] = this.decodedFile.data[c][i];
        }
      }

      this.buffer = buffer;
    }

    if(this.completionCallback){
      this.completionCallback(audioTemp);
    }
  }

  newBuffer(numChannels, length, sampleRate){
    return audioCtx.createBuffer(numChannels, length, sampleRate);
  }

  newBufferSource(){
    return audioCtx.createBufferSource();
  }

  // Play data that is in buffer
  play(delay, endCallback){
    if(this.buffer){
      var source = audioCtx.createBufferSource();
      source.buffer = this.buffer;
      source.connect(audioCtx.destination);

      if(endCallback){
        source.onended = endCallback;
      }

      source.start(delay);

      this.source = source;
      //console.log("play");
    }
  }

  stop(){
    if(this.source){
      this.source.stop(0);
      console.log("Stop");
    }
  }

  getTime(){
    return audioCtx.currentTime;
  }
}
