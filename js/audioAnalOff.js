/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var AudioMonitor = function() {

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null,
    source = null,
    analyserNode = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;
var isLoaded = false;

var numFreqs = 128;
var freqArray = new Array(numFreqs);


//create custom event for audio loaded
var audioloadedEvent = document.createEvent('Event');
// Define that the event name is 'build'.
audioloadedEvent.initEvent('customaudioloaded', true, true);



function fftArray() {
  // if(source.playbackState==1) source.start();

    // analyzer draw code here
    var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

    analyserNode.getByteFrequencyData(freqByteData);
    var multiplier = analyserNode.frequencyBinCount / numFreqs;

    // Draw rectangle for each frequency bin.
    for (var i = 0; i < numFreqs; ++i) {
        var magnitude = 0;
        var offset = Math.floor( i * multiplier );
        // gotta sum/average the block, or we miss narrow-bandwidth spikes
        for (var j = 0; j< multiplier; j++)
            magnitude += freqByteData[offset + j];
        magnitude = magnitude / multiplier;
        var magnitude2 = freqByteData[i * multiplier];
        // analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numFreqs) + ", 100%, 50%)";
        // analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
        freqArray[i]=magnitude;
    }


  //  socket.emit('fft-data', {'freqArray': freqArray } );
  //  updateAnalysers();
    rafID = window.requestAnimationFrame( fftArray );
}

//load sample MP3
function loadSampleAudio() {

	source = audioContext.createBufferSource();
	analyserNode = audioContext.createAnalyser();
	analyserNode.fftSize = 1024;

	// Connect audio processing graph
	source.connect(analyserNode);
	analyserNode.connect(audioContext.destination);
	loadAudioBuffer("Ber.mp3");
  console.log("loadSampleAudio");
}

function loadAudioBuffer(url) {
	// Load asynchronously
	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.responseType = "arraybuffer";

	request.onload = function() {


		audioContext.decodeAudioData(request.response, function(buffer) {
				audioBuffer = buffer;
				finishLoad();
		 }, function(e) {
			console.log(e);
		});

	};

	request.send();
  console.log("loadAudioBuffer");

}


function finishLoad() {

	source.buffer = audioBuffer;
	source.loop = false;
  fftArray();
  console.log("audio loaded");
  if(!isLoaded)isLoaded=true;
  //dispatch audioloaded event
  window.dispatchEvent(audioloadedEvent);
}




return{
    setNumFreqs: function(n){ numFreqs=n; freqArray = new Array(n)},
    getFreqArray:function(){return freqArray},
    getFreqArray:function(n){return freqArray[n]},
    loadSampleAudio:loadSampleAudio,
    start:function(){source.start()},
    isOk:isLoaded

}
}();

window.addEventListener('load', AudioMonitor.loadSampleAudio );
