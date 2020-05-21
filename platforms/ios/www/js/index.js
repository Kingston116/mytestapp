document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    console.log(Media);
}
document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('record').addEventListener('click', clickHandler);
      document.getElementById('play').addEventListener('click', clickPlayHandler);
    });


var audioFile;
var audioFilePath;

var captureError = function(e) {
	console.log('captureError' ,e);
}

var captureSuccess = function(e) {
	console.log('captureSuccess');console.dir(e);
	audioFile = e[0].localURL;
	audioFilePath = e[0].fullPath;
}

var record = function() {
	navigator.device.capture.captureAudio(
		captureSuccess,captureError,{duration:10});
}

var play = function() {
	if(!audioFile) {
		navigator.notification.alert("Record a sound first.", null, "Error");
		return;
	}
	var media = new Media(audioFile, function(e) {
		media.release();
	}, function(err) {
		console.log("media err", err);
	});
	media.play();
}

function clickHandler(element) {
        record();
    }

function clickPlayHandler(element) {
        play();
    }