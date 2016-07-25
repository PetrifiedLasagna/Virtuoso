"use strict";var AudioFile=function(){this.length=0;this.duration=0;this.sampleRate=0;this.channels=0;this.data=[];};var audioCtx=null;class AudioEngine{constructor(){if(!audioCtx){window.AudioContext=window.AudioContext||window.webkitAudioContext;audioCtx=new AudioContext();}
this.buffer=null;this.source=null;this.decodedFile=new AudioFile();this.autoCreateBuffer=true;this.completionCallback=null;}
fileCallback(event){console.log("file callback");this.buffer=null;this.decodedFile=null;if(this.source){this.source.stop(0);}
var reader=new FileReader();var file=event.target.files[0];reader.onload=this.loadCallback.bind(this);reader.readAsArrayBuffer(file);}
loadCallback(file){console.log("load callback");var raw=file.target.result;audioCtx.decodeAudioData(raw,this.decodeCallback.bind(this));}
decodeCallback(data){console.log("decode callback");var audioTemp=new AudioFile();audioTemp.length=data.length;audioTemp.duration=data.duration;audioTemp.sampleRate=data.sampleRate;audioTemp.channels=data.numberOfChannels;var arr=[];for(var i=0;i<data.numberOfChannels;i++){arr.push(new Float32Array(data.length));data.copyFromChannel(arr[i],i);}
audioTemp.data=arr.slice(0);this.decodedFile=audioTemp;if(this.autoCreateBuffer){var buffer=audioCtx.createBuffer(audioTemp.channels,audioTemp.length,audioTemp.sampleRate);var samples;for(var c=0;c<audioTemp.channels;c++){samples=buffer.getChannelData(c);for(var i=0;i<audioTemp.length;i++){samples[i]=this.decodedFile.data[c][i];}}
this.buffer=buffer;}
if(this.completionCallback){this.completionCallback(audioTemp);}}
decodeFile(audioData,callback){audioCtx.decodeAudioData(audioData,callback);}
newBuffer(numChannels,length,sampleRate){return audioCtx.createBuffer(numChannels,length,sampleRate);}
newBufferSource(){return audioCtx.createBufferSource();}
newOscillator(){return audioCtx.createOscillator();}
newGain(){return audioCtx.createGain();}
getDestination(){return audioCtx.destination;}
play(delay,endCallback){if(this.buffer){var source=audioCtx.createBufferSource();source.buffer=this.buffer;source.connect(audioCtx.destination);if(endCallback){source.onended=endCallback;}
source.start(delay);this.source=source;}}
stop(){if(this.source){this.source.stop(0);console.log("Stop");}}
getTime(){return audioCtx.currentTime;}}
function tRGB(red,green,blue){return{r:red,g:green,b:blue};}
function getString(color){return"rgb("+color.r+","+color.g+","+color.b+")";}
function colorEquals(col1,col2){return col1.r==col2.r&&col1.g==col2.g&&col1.b==col2.b;}
class GfxEngine{constructor(id){this.canvas=document.getElementById(id);this.buffer=document.createElement("canvas");this.width=this.canvas.width;this.height=this.canvas.height;this.buffer.width=this.width;this.buffer.height=this.height;this.context=this.canvas.getContext("2d");this.contextB=this.buffer.getContext("2d");this.currentState={strokeStyle:"rgb(0,0,0)",fillStyle:"rgb(0,0,0)"};this.contextB.strokeStyle=this.currentState.strokeStyle;this.contextB.fillStyle=this.currentState.fillStyle;}
drawRect(x,y,width,height,lineColor){var style=getString(lineColor);if(style!=this.currentState.strokeStyle){this.contextB.strokeStyle=style;this.currentState.strokeStyle=style;}
this.contextB.strokeRect(x,y,width,height);}
fillRect(x,y,width,height,bgColor){var style=getString(bgColor);if(style!=this.currentState.fillStyle){this.contextB.fillStyle=style;this.currentState.fillStyle=style;}
this.contextB.fillRect(x,y,width,height);}
clearRect(x,y,width,height){this.contextB.clearRect(x,y,width,height);}
clearScreen(){this.contextB.clearRect(0,0,this.width,this.height);}
setDrawMode(mode){this.contextB.globalCompositeOperation=mode;}
createImageData(width,height){return this.contextB.createImageData(width,height);}
putImage(image,x,y){this.contextB.putImageData(image,x,y);}
toUrl(){return this.buffer.toDataURL();}
swapBuffers(){this.context.clearRect(0,0,this.width,this.height);this.context.drawImage(this.buffer,0,0);}}
var midiEvent=function(){this.delta=0;this.type=0;this.track=0;this.id=0;this.channel=0;this.data=null;};midiEvent.prototype.copy=function(srcE){this.delta=srcE.delta;this.type=srcE.type;this.track=srcE.track;this.id=srcE.id;this.channel=srcE.channel;this.data=srcE.data.slice();};var midiTrack=function(){this.name="";this.events=[];};var midiHeader=function(){this.format=0;this.numTracks=0;this.divisions={type:0,value:0,true_value:0};};var midiFile=function(){this.header=new midiHeader();this.tracks=[];};var songTimeSignature=function(){this.denominator=4;this.numerator=4;};var songKeySignature=function(){this.key=0;this.mi=0;};var songInfo=function(){this.tempo=500000;this.tempoBPM=120;this.timeSig=new songTimeSignature();this.keySig=new songKeySignature();};var midiNote=function(){this.note=0;this.velocity=0;this.channel=0;this.track=0;this.startTime=-1;this.endTime=-1;this.playing=true;this.oscillator=null;this.gain=null;};var midiSample=function(){this.buffer=null;this.loopStart=0;this.loopEnd=0;this.homeKey=0;}
midiNote.prototype.makeCopy=function(){var copy=new midiNote();copy.note=this.note;copy.channel=this.channel;copy.startTime=this.startTime;copy.playing=this.playing;copy.oscillator=this.oscillator;copy.gain=this.gain;return copy;};function microToMinute(tMicro){return tMicro / 60000000;}
function minuteToMicro(tMinute){return tMinute*60000000;}
function timePerBeat_BPM(tMicro){return Math.round(60000000 / tMicro);}
function readIdentifier(pointer,data){var id="";for(var i=0;i<4;i++){id+=String.fromCharCode(data[pointer.pos+i]);}
pointer.pos+=4;return id;}
function readInt(pointer,numBytes,data){var num=0;for(var i=0;i<numBytes;i++){num+=data[pointer.pos+i]<<(numBytes-i-1)*8;}
pointer.pos+=numBytes;return num;}
function readVariableLength(pointer,data){var bytes=[];var tmp=0xFF;while(tmp&0x80){tmp=readInt(pointer,1,data);bytes.push(tmp&0x7F);}
tmp=0;for(var i=0;i<bytes.length;i++){tmp+=bytes[i]<<(bytes.length-i-1)*7;}
return tmp;}
function readArray(pointer,len,data){var bytes=[];for(var i=0;i<len;i++){bytes.push(readInt(pointer,1,data));}
return bytes;}
function readSystemEvent(pointer,data){var bytes=[];var datalen=readVariableLength(pointer,data);bytes=readArray(pointer,datalen,data);return bytes;}
function readMetaEvent(pointer,data){var type=readInt(pointer,1,data);var bytes=readSystemEvent(pointer,data);bytes.unshift(type);return bytes;}
var note_frequencies=null;var midiEvents=[0x80,0x90,0xB0];var metaEvents=[0x51,0x58,0x59,];function freeMemory(arr){var emptyInd=-1;for(var i=0;i<arr.length;i++){if(arr[i]==null){if(emptyInd==-1){emptyInd=i;}}else{emptyInd=-1;}}
if(emptyInd!=-1){arr.splice(emptyInd);}}
function generateWave(frequency,sampleRate,type,length){if(type===undefined){type=0;}
if(length===undefined){length=Math.round(sampleRate / frequency);}
var buffer=new Float32Array(length);for(var i=0;i<length;i++){switch(type){default:case 0:case 1:buffer[i]=Math.sin(2*Math.PI*frequency*i / sampleRate);if(type==1){buffer[i]=Math.sign(buffer[i]);}
break;case 2:buffer[i]=(2*frequency*i / sampleRate+1)%2-1;break;case 3:buffer[i]=Math.abs((4*frequency*i-1)%4-2)-1;break;}}
return{rate:sampleRate,buff:buffer};}
var sampleKey=function(buffer,homeKey,loopStart,loopEnd){this.buffer=buffer;this.homeKey=homeKey;this.loopStart=loopStart;this.loopEnd=loopEnd;};class MidiHandler{constructor(audioEngine){this.playing=false;this.currentTime=0;this.realTime=0;this.songPointer=0;this.info=new songInfo();this.masterVolume=100;this.currentMidi=null;this.usableEvents=null;this.engine=audioEngine;this.gainNotes=new Array();this.activeNotes=new Array();this.gain=audioEngine.newGain();this.gain.gain.value=0.02;this.gain.connect(audioEngine.getDestination());if(!note_frequencies){note_frequencies=[128];var a=440;for(var x=0;x<128;++x)
{note_frequencies[x]=(a / 32)*Math.pow(2,(x-9)/ 12);}}
this.audioSample=null;this.speedTable=null;var sample=generateWave(note_frequencies[69],44100,1);this.setSample(sample.buff,69,0,0,1,sample.rate);this.tempoCallback=null;this.keyCallback=null;this.timeCallback=null;setInterval(this.volFalloff.bind(this),50);}
setSample(buffer,homeKey,loopStart,loopEnd,numChannels,sampleRate){if(loopStart===undefined){loopStart=0;}
if(loopEnd===undefined){loopEnd=0;}
var sample;if(Object.prototype.toString.call(buffer)==="[object AudioBuffer]"){sample=buffer;}else{sample=this.engine.newBuffer(numChannels,buffer.length,sampleRate);if(numChannels>1){for(var i=0;i<numChannels;i++){sample.copyToChannel(buffer[i],i);}}else{sample.copyToChannel(buffer,0);}}
var table=[];var homeKeyFreq=note_frequencies[homeKey];for(var i=0;i<128;i++){table.push(note_frequencies[i]/ homeKeyFreq);}
this.speedTable=table;this.audioSample=new sampleKey(sample,homeKey,loopStart,loopEnd);}
loadMidi(file){this.usableEvents=null;this.clearBuffers();var data=new Uint8Array(file.target.result);var midi=new midiFile();var foundHead=false;var pointer={pos:0};var ret="";while(pointer.pos<data.length&&ret.length==0){var id=readIdentifier(pointer,data);var chunkLength=readInt(pointer,4,data);if(id=="MThd"){if(!foundHead){if(chunkLength==6){var head=new midiHeader();head.format=readInt(pointer,2,data);head.numTracks=readInt(pointer,2,data);var format=readInt(pointer,2,data);head.divisions.format=format&0x8000;head.divisions.value=format;head.divisions.true_value=format;if(head.divisions.format){head.divisions.true_value=(((head.divisions.value>>8)^0xF)+1)*(head.divisions.value&0x00FF);}else{}
midi.header=head;foundHead=true;}else{ret="Invalid Midi Header";}}else{ret="Multiple Headers Found";}}else if(id=="MTrk"){var track=new midiTrack();var running_status=-1;chunkLength+=pointer.pos;while(pointer.pos<chunkLength){var event=new midiEvent();event.delta=readVariableLength(pointer,data);event.id=readInt(pointer,1,data);if(event.id==0xF0||event.id==0xF7){running_status=-1;event.type=1;event.data=readSystemEvent(pointer,data);if(event.id==0xF0){event.data.unshift(0xF0);}}else if(event.id==0xFF){event.type=2;event.data=readMetaEvent(pointer,data);}else{event.type=0;event.data=[];if(event.id<0x80||event.id>0xEF){if(running_status!=-1){event.data.push(event.id);event.id=running_status;}else{ret="Encountered Unkown/Invalid Midi Event"+event.id;break;}}
event.channel=event.id&0x0F;var datalen=2;if((event.id&0xF0)==0xC0||(event.id&0xF0)==0xD0){datalen=1;}
var eventData=readArray(pointer,datalen,data);event.data=event.data.concat(eventData);running_status=event.id;}
track.events.push(event);}
midi.tracks.push(track);}else{if(!foundHead){ret="No midi header found";}else{pointer.pos+=chunkLength;}}}
this.currentMidi=midi;this.parseEvents(midi);return ret;}
parseEvents(midiData){var t=midiData.header.numTracks;var events=[];for(var track=0;track<t;track++){var parsedTime=0;var eventP=midiData.tracks[track].events;for(var e=0;e<eventP.length;e++){parsedTime+=eventP[e].delta;var type=eventP[e].type;if(type==0){var id=eventP[e].id&0xF0;for(var i=0;i<midiEvents.length;i++){if(id==midiEvents[i]){var newEvent=new midiEvent();newEvent.copy(eventP[e]);newEvent.delta=parsedTime;newEvent.track=track;events.push(newEvent);break;}}}else if(type==2){var id=eventP[e].data[0];for(var i=0;i<metaEvents.length;i++){if(id==metaEvents[i]){var newEvent=new midiEvent();newEvent.copy(eventP[e]);newEvent.delta=parsedTime;newEvent.track=track;events.push(newEvent);break;}}}}}
events.sort(function(a,b){return a.delta-b.delta;});this.usableEvents=events;for(var i=0;this.usableEvents.length;i++){var type=this.usableEvents[i].type;if(type==2){this.processEvent(this.usableEvents[i]);}else{break;}}}
play(){if(this.usableEvents!=null&&!this.playing){this.clearBuffers();this.realTime=this.engine.getTime()+2;this.playing=true;this.playCallback();}}
playCallback(lookAhead){if(this.playing){var now=this.currentTime;var realNow=this.realTime;var nextTime=Math.round(now+lookAhead*this.currentMidi.header.divisions.true_value);var ind=this.songPointer;var notes=this.activeNotes;while(now<=nextTime){if(ind<this.usableEvents.length){var e=this.usableEvents[ind];var id;var eType=e.type;realNow+=(e.delta-now)/ this.currentMidi.header.divisions.true_value /(this.info.tempoBPM / 60);now=e.delta;this.processEvent(e,realNow);ind++;}else{this.playing=false;ind=0;now=0;break;}}
this.currentTime=now;this.realTime=realNow;this.songPointer=ind;}}
processEvent(e,time){var eType=e.type;var data=e.data;var id;switch(eType){case 0:id=e.id&0xF0;switch(id){case midiEvents[0]:this.noteOff(readInt({pos:0},1,data),e.track,e.channel,time);break;case midiEvents[1]:this.noteOn(readInt({pos:0},1,data),readInt({pos:1},1,data),e.track,e.channel,time);break;}
break;case 2:id=e.data[0];switch(id){case metaEvents[0]:this.tempoChange(readInt({pos:1},3,data),time);break;case metaEvents[1]:this.timeChange(data[1],Math.pow(2,data[2]),time);break;case metaEvents[2]:this.keyChange(data[1],data[2]);break;}
break;}}
noteOff(key,track,channel,time){var notes=this.activeNotes;for(var i=0;i<notes.length;i++){var tmp=notes[i];if(tmp){if(tmp.note==key&&tmp.track==track&&tmp.channel==channel&&tmp.playing==true){tmp.playing=false;tmp.endTime=time;tmp.oscillator.stop(time);break;}}}}
noteOn(key,velocity,track,channel,time){if(velocity==0){this.noteOff(key,track,channel,time);}else{var note=new midiNote();var self=this;note.playing=true;note.note=key;note.velocity=velocity / 127;note.track=track;note.channel=channel;note.startTime=time;var sound=this.engine.newBufferSource();sound.loop=true;sound.buffer=this.audioSample.buffer;sound.loopStart=this.audioSample.loopStart;sound.loopEnd=this.audioSample.loopEnd;sound.playbackRate.value=this.speedTable[key];var gain=this.engine.newGain();sound.connect(gain);gain.gain.value=note.velocity;gain.connect(this.gain);sound.start(time);note.oscillator=sound;note.gain=gain;sound.onended=function(){var vals=this.lookup;for(var i=0;i<self.activeNotes.length;i++){var tmp=self.activeNotes[i];if(tmp){if(tmp.oscillator===this){self.activeNotes.splice(i,1);break;}}}};self.activeNotes.push(note);}}
tempoChange(tMicro,time,call){if(call===undefined){call=true;}
var newTempo=timePerBeat_BPM(tMicro);this.info.tempo=tMicro;this.info.tempoBPM=newTempo;if(call&&this.tempoCallback){if(!(time===undefined)){setTimeout(this.tempoCallback,time-this.engine.getTime(),newTempo);}else{this.tempoCallback(newTempo);}}}
keyChange(key,mi,time,call){if(call===undefined){call=true;}
var newKey=new songKeySignature();if(key&0x80){newKey.key=-((key&0xF^0xF)+1);}else{newKey.key=key;}
newKey.mi=mi;this.info.keySig=newKey;if(call&&this.keyCallback){if(!(time===undefined)){setTimeout(this.keyCallback,time-this.engine.getTime(),newKey);}else{this.keyCallback(newKey);}}}
timeChange(numerator,denominator,time,call){if(call===undefined){call=true;}
var newTime=new songTimeSignature();newTime.denominator=denominator;newTime.numerator=numerator;this.info.timeSig=newTime;if(call&&this.timeCallback){if(!(time===undefined)){setTimeout(this.timeCallback,time-this.engine.getTime(),newTime);}else{this.timeCallback(newTime);}}}
volFalloff(){var t=this.engine.getTime();var notes=this.activeNotes;for(var i=0;i<notes.length;i++){var note=notes[i];if(note){var vol=note.gain.gain.value;if(vol>0){vol=Math.max(0,note.velocity*(1-(t-note.startTime)/ 4));note.gain.gain.value=vol;if(this.playing==false){if(vol<=0){note.oscillator.stop(t+2.1);note.endTime=t+2.1;}}}}}}
clearBuffers(){var notes=this.activeNotes.slice();for(var i=0;i<notes.length;i++){if(notes[i]){notes[i].oscillator.stop();}}
this.activeNotes.length=0;}}
var midiController;var audioController;var gfxController;var objDialogContainer;var objDialog;var objGfxGradient;var objFile;var objPlaybtn;var objTempo;var objKey;var objTimeNumerator;var objTimeDenominator;var usableColors;var colorMode;var keys;var keymap;function getKey(value){return keys[keymap[value].location];}
var key0Width=18;var key0Height=75;var key1Width=10;var key1Height=45;var keySpr=function(){this.x=0;this.y=0;this.width=0;this.height=0;this.type=0;this.color=tRGB(0,0,0);this.key=0;};var prevPressed=[];function drawNote(note,time){var room=gfxController.height-key0Height;var startTime=note.startTime;var endTime=note.endTime;var x=getKey(note.note).x;var width=getKey(note.note).width;var index;if(colorMode){index=note.track;}else{index=note.channel;}
var y;var height;if(endTime>-1){y=Math.floor(room*(1-(endTime-time)/ 2));}else{y=0;}
if(startTime-time>2){height=0;}else{var yy=room*(1-(startTime-time)/ 2);var height=Math.floor(yy-y);}
gfxController.fillRect(x,y,width,height,usableColors[index][1]);gfxController.fillRect(x+3,y+3,width-6,height-6,usableColors[index][0]);}
function update(time){var notes=midiController.activeNotes;var pressed=new Array();for(var i=0;i<notes.length;i++){var note=notes[i];if(note){drawNote(note,time);if(note.startTime<time&&(note.endTime==-1||note.endTime>time)){pressed.push(note.note);if(colorMode){getKey(note.note).color=usableColors[note.track][0];}else{getKey(note.note).color=usableColors[note.channel][0];}
var foundKey=prevPressed.indexOf(note.note);if(foundKey!=-1){prevPressed.splice(foundKey,1);}}}}
for(var i=0;i<prevPressed.length;i++){var tmpKey=getKey(prevPressed[i]);if(tmpKey.type){tmpKey.color=tRGB(0,0,0);}else{tmpKey.color=tRGB(255,255,255);}}
prevPressed=pressed;}
var pTime=0;function draw(cTime){gfxController.clearRect(0,0,gfxController.width,gfxController.height-key0Height-1);var t=audioController.getTime();update(t);for(var i=0;i<keys.length;i++){var tmpkey=keys[i];gfxController.fillRect(tmpkey.x,tmpkey.y,tmpkey.width,tmpkey.height,tmpkey.color);gfxController.drawRect(tmpkey.x,tmpkey.y,tmpkey.width,tmpkey.height,tRGB(0,0,0));}
gfxController.swapBuffers();requestAnimationFrame(draw);if(midiController.playing){if(Math.floor(cTime-tempo/60)>pTime){midiController.playCallback((cTime-pTime)/ 1000);pTime=cTime;}}else{pTime=cTime}}
function hideDialogue(){objDialogContainer.style.visibility="hidden";}
function displayDialogue(content,button){if(button===undefined){button=false;}
objDialog.innerHTML=content;if(button){var btn=document.createElement("input");btn.type="button";btn.style.float="right";btn.value=button;btn.onclick=hideDialogue;objDialog.appendChild(btn);}
objDialogContainer.style.visibility="visible";}
var tempo=120;var key=new songKeySignature();var time=new songTimeSignature();function tempoUpdate(newTempo){tempo=newTempo;objTempo.innerHTML=tempo+" BPM";}
function keyUpdate(newKey){key=newKey;var majorText=["Cb","Gb","Db","Ab","Eb","Bb","F","C","G","D","A","E","B","F#","C#"];var minorText=["Ab","Eb","Bb","F","C","G","D","A","E","B","F#","C#","G#","D#","A#"];var keyText;if(key.mi){keyText=minorText[key.key+7]+" Minor";}else{keyText=majorText[key.key+7]+" Major";}
objKey.innerHTML=keyText;}
function timeUpdate(newTime){time=newTime;objTimeNumerator.innerHTML=time.numerator.toString();objTimeDenominator.innerHTML=time.denominator.toString();}
function loadPresetDCall(buffer){midiController.setSample(buffer,69,0,0);hideDialogue();}
function loadPresetECall(e){displayDialogue("<p>Failed to load preset</p><p>"+e.err+"</p><p>Using default preset</p>","OK");}
function loadPresetRCall(e){var data=this.response;audioController.decodeFile(data,loadPresetDCall,loadPresetECall);}
function loadPreset(sampleName){var fetcher=new XMLHttpRequest();fetcher.onload=loadPresetRCall;fetcher.open("GET","samples/"+sampleName+".ogg",true);fetcher.responseType="arraybuffer";fetcher.send(loadPresetRCall);}
function initDOM(){objFile=document.getElementById("file");objPlaybtn=document.getElementById("play");objTempo=document.getElementById("tempo");objGfxGradient=document.getElementById("gfx-gradient");objTimeNumerator=document.getElementById("time-numerator");objTimeDenominator=document.getElementById("time-denominator");objKey=document.getElementById("key-signature");objPlaybtn.onclick=function(){midiController.play();};objFile.value="";objFile.onchange=function(event){displayDialogue("<p>Your file is being processed</p><br/><img class='rounded fit' src='images/loading2.gif'></img>");var reader=new FileReader();var file=event.target.files[0];reader.onload=function(raw){var msg=midiController.loadMidi(raw);if(msg!=""){displayDialogue("<p>There was a problem loading your file!</p><br/><p>"+msg+"</p>","OK");}else{colorMode=midiController.currentMidi.header.format==2;displayDialogue("<p>Your file was succsessfully loaded!</p>","OK");}};reader.readAsArrayBuffer(file);}}
function initGradient(){var tmpCol=window.getComputedStyle(objGfxGradient,null).getPropertyValue("background-color").replace(/[^\d,]/g,'').split(',');objGfxGradient.style.backgroundColor="transparent";var gfxGradient=gfxController.createImageData(gfxController.width,Math.floor(gfxController.height*0.1));for(var i=0;i<gfxGradient.data.length;i+=4){gfxGradient.data[i]=parseInt(tmpCol[0],10);gfxGradient.data[i+1]=parseInt(tmpCol[1],10);gfxGradient.data[i+2]=parseInt(tmpCol[2],10);gfxGradient.data[i+3]=Math.floor(255*(1-i / 4 / gfxController.width / Math.floor(gfxController.height*0.1)));}
gfxController.clearScreen();gfxController.putImage(gfxGradient,0,0);var tmpImg=document.createElement("img");tmpImg.style.width="100%";tmpImg.width=gfxController.width;tmpImg.height=gfxController.height;tmpImg.src=gfxController.toUrl();objGfxGradient.appendChild(tmpImg);}
function initKeyboard(){var keyType=0;keys=[];var keyPos=Math.floor(gfxController.width / 2-75*key0Width / 2);for(var i=0;i<128;i++){var tmpKey=new keySpr();tmpKey.x=Math.floor(keyPos);tmpKey.y=gfxController.height-key0Height-1;tmpKey.type=keyType;tmpKey.key=i;if(keyType){tmpKey.width=key1Width;tmpKey.height=key1Height;tmpKey.color=tRGB(0,0,0);keyPos+=key1Width/2;}else{tmpKey.width=key0Width;tmpKey.height=key0Height;tmpKey.color=tRGB(255,255,255);keyPos+=key0Width-key1Width/2;}
keys.push(tmpKey);if(!(i%12==4||i%12==11)){keyType=keyType^1;}else{keyPos+=key1Width/2;}}
keys.sort(function(a,b){return a.type-b.type;});keymap=keys.map(function(obj,index){return{key:obj.key,location:index};});keymap.sort(function(a,b){return a.key-b.key;});}
function initColors(){var colors=[tRGB(238,6,6),tRGB(13,6,238),tRGB(17,188,4),tRGB(227,223,7),tRGB(248,175,16),tRGB(248,16,171),tRGB(202,16,248),tRGB(16,194,248),tRGB(200,200,200),tRGB(100,100,100)];usableColors=[]
for(var i=0;i<colors.length;i++){usableColors[i]=[];var color=colors[i]
usableColors[i][0]=color;usableColors[i][1]=tRGB(Math.floor(color.r*0.6),Math.floor(color.g*0.6),Math.floor(color.b*0.6));}}
function init(){objDialogContainer=document.createElement("div");objDialogContainer.style.visibility="hidden";objDialogContainer.className="dialogueContainer";objDialog=document.createElement("div");objDialog.className="dialogue";objDialogContainer.appendChild(objDialog);document.body.appendChild(objDialogContainer);displayDialogue("<p><strong>Initializing...<br/>Please Wait</strong></p><img class='rounded fit' src='images/loading2.gif'></img>");initDOM();audioController=new AudioEngine();midiController=new MidiHandler(audioController);gfxController=new GfxEngine("Application");initGradient();midiController.tempoCallback=tempoUpdate;midiController.keyCallback=keyUpdate;midiController.timeCallback=timeUpdate;initKeyboard();initColors();switch(window.location.protocol){case"http:":case"https:":loadPreset("e-piano");break;case"file:":displayDialogue("<p>Running in local mode</p><p>Defaulting to generated preset</p>","OK");break;default:displayDialogue("<p>Unknown protocol type</p><p>Defaulting to generated preset</p>","OK");break;}
requestAnimationFrame(draw);}
window.onload=init;
