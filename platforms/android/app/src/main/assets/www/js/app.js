(function() {

    var BASE_DIRECTORY = "CS_Recorder";
    var audioMedia;
    var recordingMedia;
    var recInterval;
    var currentPage;
    var userid;
    var key;
    var current_audio_list;
    var current_audio_comment_index=0;
    var news_list=[];
    var news_index=0;

    $(document).on("pageinit", "#main", function(e) {
        currentPage = "HOME";
        load_home(e); 
        document.getElementById("prev").addEventListener("click", load_news_prev);
        document.getElementById("next").addEventListener("click", load_news_next);
        
        load_menu();
        networkInfo();
        e.preventDefault();



        function onDeviceReady() {
        	console.log("[Notice] Device is now ready. Now registering app events ...");
        	console.log(FileTransfer);
        	console.log(device.cordova);
            userid = device.uuid;
            console.log(navigator.connection.type);
           document.addEventListener("offline", function(e){
                                alert("NO_NETWORK");
                                }, false);
             document.addEventListener("online", function(e){
            console.log("YOU ARE ONLINE");
            }, false);
            mainaudio = document.getElementById('audio');
            mainaudio.addEventListener('loadstart', function (e) {
                document.getElementById("buffer").style.visibility = "visible";
                document.getElementsByClassName("ui-btn ui-input-btn ui-corner-all ui-shadow ui-btn-inline ui-icon-audio ui-btn-icon-left")[0].style = "background-color: #082aa2;color: white;";
            });
            mainaudio.addEventListener('canplay', function (e) {
                document.getElementById("buffer").style.visibility = "hidden";
                //mainaudio.play();                
            });
            document.addEventListener("pause", onPause, false);

            fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/terms").then((response) => response.json())
                .then((data) => {
                    document.getElementById("term").innerHTML = data["terms"];
                })
                .catch((error) => {
                    console.warn(error);
                });
            
            fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/terms").then((response) => response.json())
            .then((data) => {
                document.getElementById("about").innerHTML = data["about"];
            })
            .catch((error) => {
                console.warn(error);
            });
                
            document.getElementById("news_nav").addEventListener('click', function (e) {
                var audios = document.getElementsByTagName('audio');
                for(var i = 0, len = audios.length; i < len;i++){
                    if(audios[i] != e.target){
                        audios[i].pause();
                    }
                }
            }, true);

            document.getElementById("refreshnews").addEventListener('click', function (e) {
                $.mobile.loading("show",{
                    text: "Refreshing...",
                    textVisible: true
                    })
                fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/detailednews/"+key).then((response) => response.json())
                .then((data) => {
                    current_audio_list = data.comments;
                    var commentpanel = '<ul data-role="listview" data-inset="true" data-theme="d" data-divider-theme="d" style="width:100%;padding:0;">';
                    
                    for(var audiocomment in current_audio_list){
                        commentpanel += '<li data-role="fieldcontain" data-role="list-divider" style="display:flex;width: 100%;"><div style="width:50%;padding-top: 4%;"> <a style="font-size: smaller;"  href="#">'+current_audio_list[audiocomment]["time"]+' </a></div><audio id="player-'+audiocomment+'" style="width:50%" src="http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/upload/'+key+"/"+current_audio_list[audiocomment]["filename"]+'" controls controlsList="nodownload"></audio></li><hr>';
                    }
                    commentpanel+="</ul>"
                    document.getElementById("commentsList").innerHTML = commentpanel;
                })
                .catch((error) => {
                    console.warn(error);
                });                
                $.mobile.loading("hide");
            });

                        
            
            document.getElementById('audio').addEventListener('ended', function(){
                audioPlayer = document.getElementById('audio');
                if(current_audio_list[current_audio_comment_index] == undefined){
                    //alert("No more audio to play for this news");
                    audioPlayer = document.getElementById('audio');
                    audioPlayer.src = "http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/news/"+key+"/"+key+".wav";
                    audioPlayer.pause();
                    current_audio_comment_index=0;
                    return;
                }
                nextSong = current_audio_list[current_audio_comment_index]["filename"];
                audioPlayer.src = "http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/upload/"+key+"/"+nextSong;
                try{
                audioPlayer.load();
                }
                catch(s){
                    
                }     
                console.log("playing "+nextSong);
                audioPlayer.play();
                current_audio_comment_index++;
                }, false);
            document.addEventListener('play', function(e){
                var audios = document.getElementsByTagName('audio');
                for(var i = 0, len = audios.length; i < len;i++){
                    if(audios[i] != e.target){
                        audios[i].pause();
                    }
                }
            }, true);
            $("#recordedComment").hide();
            $("#tabs").tabs();
	        $("#recordSound").on("tap", function(e) {
                e.preventDefault();
                var audios = document.getElementsByTagName('audio');
                for(var i = 0, len = audios.length; i < len;i++){
                    audios[i].pause();
                }
	            var recordingCallback = {};

	            recordingCallback.recordSuccess = handleRecordSuccess;
	            recordingCallback.recordError = handleRecordError;

	            startRecordingSound(recordingCallback);

	            var recTime = 0;

	            $("#soundDuration").html("Duration: " + recTime + " seconds");

	            $("#recordSoundDialog").popup("open");

	            recInterval = setInterval(function() {
	                                         recTime = recTime + 1;
	                                         $("#soundDuration").html("Duration: " + recTime + " seconds");
	                                      }, 1000);
	        });

	        $("#recordSoundDialog").on("popupafterclose", function(event, ui) {
	            clearInterval(recInterval);
	            stopRecordingSound();
                window.location.href = "#news";
	        });

	        $("#stopRecordingSound").on("tap", function(e) {
                $("#recordSoundDialog").popup("close");
                window.location.href = "#news";
	        });

	        $("#playSound").on("tap", function(e) {
	            e.preventDefault();

	            var playCallback = {};

	            playCallback.playSuccess = handlePlaySuccess;
	            playCallback.playError = handlePlayError;

	            playSound($("#location").val(), playCallback);
	        });
        }

        $(document).on('deviceready', onDeviceReady);

        initPage();
    });

    function handleRecordSuccess(newFilePath) {
        var currentFilePath = newFilePath;
        $("#recordedComment").show();
        document.getElementsByClassName("ui-btn ui-input-btn ui-corner-all ui-shadow ui-icon-check ui-btn-icon-left")[0].style = "background-color: #007b00;color: white;";
        document.getElementById("recordedAudio").src = newFilePath;
        $("#location").val(currentFilePath);
        $("#playSound").closest('.ui-btn').show();
    }

    function handleRecordError(error) {
    	console.log(error);
    }

    function handlePlaySuccess() {
        console.log("Sound file is played successfully ...");
    }

    function handlePlayError(error) {
        displayMediaError(error);
    }

    function onDeviceReady() {
    	console.log("Device is ready ...");
    }

    function startRecordingSound(recordingCallback) {
        var recordVoice = function(dirPath) {
            document.getElementsByClassName("ui-btn ui-input-btn ui-corner-all ui-shadow ui-btn-inline")[1].style = "background-color: #ff4343;color: white;";
            var basePath = "";

            if (dirPath) {
                basePath = dirPath + "/";
            }

            var mediaFilePath = basePath + (new Date()).getTime() + ".wav";

            var recordingSuccess = function() {
                recordingCallback.recordSuccess(mediaFilePath);
            };

            recordingMedia = new Media(mediaFilePath, recordingSuccess, recordingCallback.recordError);

            // Record audio
            recordingMedia.startRecord();
        };

        if (device.platform === "Android") {
            var callback = {};

            callback.requestSuccess = recordVoice;
            callback.requestError = recordingCallback.recordError;

            requestApplicationDirectory(callback);
        } else {

            recordVoice();
        }
    }

    function stopRecordingSound(recordingCallback) {
        recordingMedia.stopRecord();
        recordingMedia.release();
    }

    function playSound(filePath, playCallback) {
        if (filePath) {
            cleanUpResources();

            audioMedia = new Media(filePath, playCallback.playSuccess, playCallback.playError);
            console.log(audioMedia)
            // Play audio
            audioMedia.play();
        }
    }

    function cleanUpResources() {
        if (audioMedia) {
            audioMedia.stop();
            audioMedia.release();
            audioMedia = null;
        }

        if (recordingMedia) {
      	  recordingMedia.stop();
      	  recordingMedia.release();
      	  recordingMedia = null;
        }
    }

    function requestApplicationDirectory(callback) {
        var directoryReady = function (dirEntry) {
      	  callback.requestSuccess(dirEntry.toURL());
        };

        var fileSystemReady = function(fileSystem) {
            fileSystem.root.getDirectory(BASE_DIRECTORY, {create: true}, directoryReady);
        };

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, fileSystemReady, callback.requestError);
    }

    function initPage() {
        $("#playSound").closest('.ui-btn').hide();
    }

    function load_home (e) {
    (e || window.event).preventDefault();
    /* if(checkMenuOpen() == false){
        return;
      } */
    var news_list_temp = []
    var panel = '<div id="refreshhome" class="circle-div" style="z-index: 1;text-align: center;font-size: x-large;transform: rotate(90deg);color: white;background-image: url(img/refresh.png);background-size: 70%;background-repeat: no-repeat;background-position: 40% 40%;"></div><input type="hidden" id="location" /><ul class="ui-listview ui-listview-inset ui-corner-all ui-shadow" data-role="listview" data-inset="true" style="padding-left: 0px;text-align: center;text-transform:uppercase;">';
    fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/news").then((response) => response.json())
    .then((data) => {
        for (i = 0; i < Object.keys(data.news).length; i++) {
            news_list_temp.push(Object.keys(data.news)[i].toUpperCase());
            panel += '<li class="news" data-transition="pop" id="'+Object.keys(data.news)[i]+'"><a href="#" style="color: #082aa2;font-size:large;margin-top:4%;margin-bottom:0%"><p><b>'+Object.keys(data.news)[i]+'</b></p><img style="width: 90%;height:200px;object-fit:cover;padding-top: 10px;padding-right: 10px;padding-left: 10px;" src="'+data.news[Object.keys(data.news)[i]].image_path+'"/>';
            panel += '</a></li><hr>';
        }
        news_list = news_list_temp;
        panel += "</ul>"
        document.getElementById("content").innerHTML = panel
        document.getElementById("refreshhome").addEventListener('click', function (e) {
            $.mobile.loading("show",{
                text: "Refreshing...",
                textVisible: true
                })
            console.log("refresh home");
            load_home();
            $.mobile.loading("hide");
        });
        var li = document.getElementsByClassName("news");

        for(var i = 0;i<li.length;i++){
            li[i].addEventListener("click", load_news);
        }
    })
    .catch((error) => {
        console.warn(error);
    });

    }

    function load_menu(){
        document.addEventListener("backbutton", onBackKeyDown, false);
        document.getElementById("upload").addEventListener('click',upload,false);
    }

    function onBackKeyDown(e) {
       e.preventDefault();
       var audios = document.getElementsByTagName('audio');
        for(var i = 0, len = audios.length; i < len;i++){
            audios[i].pause();
        }
        if(currentPage == "HOME"){
            if (confirm('Do you want to exit the app?')==true){
                navigator.app.exitApp();
            }
        }
        window.location.href = "#main";
        currentPage = "HOME";
    }
    function load_news(element){
      current_audio_comment_index=0;
      key = element.target.parentElement.children[0].children[0].innerText;
      news_index = news_list.indexOf(key);
      
      if(news_index+1 == news_list.length){
        document.getElementById("next").disabled= true;
        }
        else{
            document.getElementById("next").disabled= false;
        }
        if(news_index == 0){
            document.getElementById("prev").disabled= true;
        }
        else{
            document.getElementById("prev").disabled= false;
        }
      window.location.href = "#news";
      $("#recordedComment").hide();
      fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/detailednews/"+key).then((response) => response.json())
        .then((data) => {
            document.getElementById("title").innerText=key;
            document.getElementById("backgroundTile").style = "background-image: url('"+data.image_path+"');text-align:center;";
            document.getElementById("audio").src = "http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/news/"+key+"/"+key+".wav";
            document.getElementById("audio").load();
            document.getElementById("audio").play();
            current_audio_list = data.comments;
            var commentpanel = '<ul data-role="listview" data-theme="d" data-divider-theme="d"  data-inset="true" style="width:100%;padding:0;">';
            
            for(var audiocomment in current_audio_list){
                commentpanel += '<li data-role="fieldcontain" data-role="list-divider" style="display:flex;width: 100%;"><div style="width:50%;padding-top: 4%;"> <a style="font-size: smaller;"  href="#">'+ current_audio_list[audiocomment]["time"] +'</a></div><audio id="player-'+audiocomment+'" style="width:50%" src="http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/upload/'+key+"/"+current_audio_list[audiocomment]["filename"]+'" controls controlsList="nodownload"></audio></li><hr>';
            }
            commentpanel+="</ul>"
            document.getElementById("commentsList").innerHTML = commentpanel;
        })
        .catch((error) => {
            console.warn(error);
        });
        currentPage = "NEWS";
        
        // Initializing values
        var isPlaying = true;
        audioPlayer = document.getElementById('audio');
        // On video playing toggle values
        audioPlayer.onplaying = function() {
            isPlaying = true;
        };

        // On video pause toggle values
        audioPlayer.onpause = function() {
            isPlaying = false;
        };
    }

    function load_news_next(){
        current_audio_comment_index=0;
        
        
        key = news_list[news_index+1];
        news_index = news_index+1;
        if(news_index+1 == news_list.length){
            document.getElementById("next").disabled= true;
        }
        else{
            document.getElementById("next").disabled= false;
        }
        if(news_index == 0){
            document.getElementById("prev").disabled= true;
        }
        else{
            document.getElementById("prev").disabled= false;
        }
        window.location.href = "#news";
        $("#recordedComment").hide();
        fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/detailednews/"+key).then((response) => response.json())
          .then((data) => {
              document.getElementById("title").innerText=key;
              document.getElementById("backgroundTile").style = "background-image: url('"+data.image_path+"');text-align:center;";
              document.getElementById("audio").src = "http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/news/"+key+"/"+key+".wav";
              document.getElementById("audio").load();
              document.getElementById("audio").play();
              current_audio_list = data.comments;
              var commentpanel = '<ul data-role="listview" data-theme="d" data-divider-theme="d"  data-inset="true" style="width:100%;padding:0;">';
              
              for(var audiocomment in current_audio_list){
                  commentpanel += '<li data-role="fieldcontain" data-role="list-divider" style="display:flex;width: 100%;"><div style="width:50%;padding-top: 4%;"> <a style="font-size: smaller;"  href="#">'+ current_audio_list[audiocomment]["time"] +'</a></div><audio id="player-'+audiocomment+'" style="width:50%" src="http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/upload/'+key+"/"+current_audio_list[audiocomment]["filename"]+'" controls controlsList="nodownload"></audio></li><hr>';
              }
              commentpanel+="</ul>"
              document.getElementById("commentsList").innerHTML = commentpanel;
          })
          .catch((error) => {
              console.warn(error);
          });
          currentPage = "NEWS";
          
          // Initializing values
          var isPlaying = true;
          audioPlayer = document.getElementById('audio');
          // On video playing toggle values
          audioPlayer.onplaying = function() {
              isPlaying = true;
          };
  
          // On video pause toggle values
          audioPlayer.onpause = function() {
              isPlaying = false;
          };
      }

      function load_news_prev(){
        current_audio_comment_index=0;
        
        key = news_list[news_index-1];
        news_index = news_index-1
        if(news_index+1 == news_list.length){
            document.getElementById("next").disabled= true;
        }
        else{
            document.getElementById("next").disabled= false;
        }
        if(news_index == 0){
            document.getElementById("prev").disabled= true;
        }
        else{
            document.getElementById("prev").disabled= false;
        }
        window.location.href = "#news";
        $("#recordedComment").hide();
        fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/detailednews/"+key).then((response) => response.json())
          .then((data) => {
              document.getElementById("title").innerText=key;
              document.getElementById("backgroundTile").style = "background-image: url('"+data.image_path+"');text-align:center;";
              document.getElementById("audio").src = "http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/news/"+key+"/"+key+".wav";
              document.getElementById("audio").load();
              document.getElementById("audio").play();
              current_audio_list = data.comments;
              var commentpanel = '<ul data-role="listview" data-theme="d" data-divider-theme="d"  data-inset="true" style="width:100%;padding:0;">';
              
              for(var audiocomment in current_audio_list){
                  commentpanel += '<li data-role="fieldcontain" data-role="list-divider" style="display:flex;width: 100%;"><div style="width:50%;padding-top: 4%;"> <a style="font-size: smaller;"  href="#">'+ current_audio_list[audiocomment]["time"] +'</a></div><audio id="player-'+audiocomment+'" style="width:50%" src="http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/upload/'+key+"/"+current_audio_list[audiocomment]["filename"]+'" controls controlsList="nodownload"></audio></li><hr>';
              }
              commentpanel+="</ul>"
              document.getElementById("commentsList").innerHTML = commentpanel;
          })
          .catch((error) => {
              console.warn(error);
          });
          currentPage = "NEWS";
          
          // Initializing values
          var isPlaying = true;
          audioPlayer = document.getElementById('audio');
          // On video playing toggle values
          audioPlayer.onplaying = function() {
              isPlaying = true;
          };
  
          // On video pause toggle values
          audioPlayer.onpause = function() {
              isPlaying = false;
          };
      }

    function wait(milliseconds) { 
        let timeStart = new Date().getTime(); 
        while (true) { 
          let elapsedTime = new Date().getTime() - timeStart; 
          if (elapsedTime > milliseconds) { 
            break; 
          } 
        } 
      } 


function upload(){

    function onSuccess(r) {
      console.log("Code = " + r.responseCode);
      console.log("Response = " + r.response);
      console.log("Sent = " + r.bytesSent);
      fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/detailednews/"+key).then((response) => response.json())
        .then((data) => {
            current_audio_list = data.comments;
            var commentpanel = '<ul data-role="listview" data-inset="true" data-theme="d" data-divider-theme="d" style="width:100%;padding:0;">';
            
            for(var audiocomment in current_audio_list){
                commentpanel += '<li data-role="fieldcontain" data-role="list-divider" style="display:flex;width: 100%;"><div style="width:50%;padding-top: 4%;"> <a style="font-size: smaller;" href="#">'+current_audio_list[audiocomment]["time"]+' </a></div><audio id="player-'+audiocomment+'" style="width:50%" src="http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/upload/'+key+"/"+current_audio_list[audiocomment]["filename"]+'" controls controlsList="nodownload"></audio></li><hr>';
            }
            commentpanel+="</ul>"
            document.getElementById("commentsList").innerHTML = commentpanel;
        })
        .catch((error) => {
            console.warn(error);
        });
        $.mobile.loading("hide");
        $("body").removeClass('ui-disabled');
        $("#recordedComment").hide();
        alert("Successfully uploaded");
   }

   function onError(error) {
      alert("An error has occurred: Code = " + error.code);
      console.log("upload error source " + error.source);
      console.log("upload error target " + error.target);
      $.mobile.loading("hide");
        $("body").removeClass('ui-disabled');
        alert("uploaded failed..Please try again");
   }

    $("body").addClass('ui-disabled');
    $.mobile.loading("show",{
    text: "Uploading...",
    textVisible: true
    })
    fileURL = document.getElementById("recordedAudio").src;

    var options ={
        fileName: key + "_" + userid + "_" + fileURL.substr(fileURL.lastIndexOf('/') + 1),
        chunkedMode: false,
        params:{'user_id' : "$scope.data.userid"},
        headers:{Connection: 'close'}
    };

    var ft = new FileTransfer();
    ft.upload(fileURL, encodeURI("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/upload.php"), onSuccess, onError, options);
    
}

function networkInfo() {
   var networkState = navigator.connection.type;
   var states = {};
   console.log('Connection type: ' + networkState);
}

function onPause() {
    var audios = document.getElementsByTagName('audio');
    for(var i = 0, len = audios.length; i < len;i++){
        audios[i].pause();
    }
}
})();


