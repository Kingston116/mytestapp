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
    var current_comment_list;

    $(document).on("pageinit", "#main", function(e) {
        currentPage = "HOME";
            window.location.href="#main";
        load_home(e); 
        document.getElementById("prev").addEventListener("click", load_news_prev);
        document.getElementById("next").addEventListener("click", load_news_next);
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
            
            currentPage = "HOME";
            load_menu();
            mainaudio.addEventListener('canplay', function (e) {
                document.getElementById("buffer").style.visibility = "hidden";
                //mainaudio.play();                
            });
            document.addEventListener("pause", onPause, false);
            //document.addEventListener("backbutton", onBackKeyDown, false);
            
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
                if(!e.target.id.includes("player")){
                    document.getElementById('playAll').value = "▶ Play all";
                    $('#playAll').button("refresh");
                }
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
                        commentpanel += '<li data-role="fieldcontain" data-role="list-divider" style="display:flex;width: 100%;height:50px;"><div style="width:50%;padding-top: 4%;"> <a style="font-size: smaller;"  href="#">'+current_audio_list[audiocomment]["time"]+' </a></div><audio id="player-'+audiocomment+'" style="width:70%;height:30px;margin-top: 4%;" src="http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/upload/'+key+"/"+current_audio_list[audiocomment]["filename"]+'" controls controlsList="nodownload"></audio></li><hr>';
                    }
                    commentpanel+="</ul>";
                    current_comment_list = current_audio_list;
                    current_audio_list = [];
                    document.getElementById("commentsList").innerHTML = commentpanel;
                    draw_chart();
                })
                .catch((error) => {
                    console.warn(error);
                });                
                $.mobile.loading("hide");
            });

            document.getElementById('playAll').addEventListener('click', function(e){  
                if(document.getElementById('playAll').value == "■ Stop"){
                    document.getElementById('playAll').value = "▶ Play all";
                    $('#playAll').button("refresh");
                    onPause();
                    return;
                }
                onPause();
                if(Object.keys(current_comment_list).length > 0){                    
                    current_audio_comment_index = 0;
                    var audioPlayer = document.getElementById('player-0');
                    document.getElementById('player-0').addEventListener('ended', nextComment, true); 
                    audioPlayer.play();                    
                    current_audio_comment_index = current_audio_comment_index +1;
                    document.getElementById('playAll').value = "■ Stop";
                    $('#playAll').button("refresh");                    
                }
            }, true);

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
                    console.log(s);
                }     
                console.log("playing "+nextSong);
                audioPlayer.play();
                current_audio_comment_index++;
                }, false);
            document.addEventListener('play', function(e){
                if(!e.target.id.includes("player")){
                    document.getElementById('playAll').value = "▶ Play all";
                    $('#playAll').button("refresh");
                }
                var audios = document.getElementsByTagName('audio');
                for(var i = 0, len = audios.length; i < len;i++){
                    if(audios[i] != e.target){
                        audios[i].pause();
                    }
                }                
            }, true);
            $("#recordedComment").hide();
            $("#tabs").tabs();        
            $("#acomment").trigger("click");   
	        $("#recordSound").on("tap", function(e) {
                e.preventDefault();
                onPause();
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
                                             if(recTime > 120){
                                                stopRecordingSound(recordingCallback);
                                                $("#recordSoundDialog").popup("close");
                                             }
	                                      }, 1000);
	        });

	        $("#recordSoundDialog").on("popupafterclose", function(event, ui) {
	            clearInterval(recInterval);
	            stopRecordingSound();
	        });

	        $("#stopRecordingSound").on("tap", function(e) {
                $("#recordSoundDialog").popup("close");
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
        document.getElementsByClassName("ui-btn ui-input-btn ui-corner-all ui-shadow ui-icon-delete ui-btn-icon-left")[0].style = "background-color: rgb(255, 45, 45);color: white;";
        
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
            if (device.platform == "iOS"){
                basePath = cordova.file.tempDirectory.replace(/^file:\/\//, '');
                console.log("basepath = " + basePath);
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
        load_menu();
        currentPage = "HOME";
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
                window.location.href="index.html";
                console.log("refresh home");
                load_home();
            });
            var li = document.getElementsByClassName("news");

            for(var i = 0;i<li.length;i++){
                li[i].addEventListener("click", load_news);
            }
        })
        .catch((error) => {
            console.warn(error);
        });
        $.mobile.loading("hide");

    }

    function load_menu(){        
        document.addEventListener("backbutton", onBackKeyDown, false);
        document.getElementById("upload").addEventListener('click',upload,true);
        document.getElementById("cancel").addEventListener('click',hideRecordedComment, true);
    }

    function hideRecordedComment(){
        $("#recordedComment").hide();
    }

    function onBackKeyDown(e) {
        console.log('ok backey downed');
        e.preventDefault();
        onPause();
        if(currentPage == "HOME"){
            if (confirm('Do you want to exit the app?')==true){
                navigator.app.exitApp();
            }
            else{
                return;
            }
        }
        window.location.href = "index.html";
        currentPage = "HOME";
        onPause();
    }

    function news_load(){
        onPause();
        if(news_index+1 == news_list.length){
            document.getElementById("options").innerHTML = "";
            $.mobile.loading("show",{
                text: "Refreshing...",
                textVisible: true
                });
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
          
          var poll_check = "";
          $("#recordedComment").hide();
          fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/detailednews/"+key).then((response) => response.json())
            .then((data) => {
                document.getElementById("title").innerText=key;
                document.getElementById("backgroundTile").style = "background-image: url('"+data.image_path+"');text-align:center;background-size:100% 220px;";
                document.getElementById("audio").src = "http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/news/"+key+"/"+key+".wav";
                document.getElementById("audio").load();
               
                current_audio_list = data.comments;
                var commentpanel = '<ul data-role="listview" data-theme="d" data-divider-theme="d"  data-inset="true" style="width:100%;padding:0;">';
                
                for(var audiocomment in current_audio_list){
                    commentpanel += '<li data-role="fieldcontain" data-role="list-divider" style="display:flex;width: 100%;;height:50px;"><div style="width:50%;padding-top: 4%;"> <a style="font-size: smaller;"  href="#">'+ current_audio_list[audiocomment]["time"] +'</a></div><audio id="player-'+audiocomment+'" style="width:70%;height:30px;margin-top: 4%;" src="http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/upload/'+key+"/"+current_audio_list[audiocomment]["filename"]+'" controls controlsList="nodownload"></audio></li><hr>';
                }
                commentpanel+="</ul>";
                current_comment_list = current_audio_list;
                current_audio_list = [];
                document.getElementById("commentsList").innerHTML = commentpanel;
                document.getElementById("Question").text = data.question;
                
                fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/poll_check/"+key+"/"+userid).then((response) => response.json())
                .then((polldata) => {
                    console.log(polldata);
                    poll_check = polldata.status;
                    if(poll_check == "Not voted"){
                        var answerpanel = "<table style='width:100%;'>";
                        var count = 0;
                        for(var answer in data.answers){
                            answerpanel += '<tr><td style="width:10%"><input type="radio" name="radio-choice-v-6" value="'+answer+'" id="radio_choice_'+count+'" data-mini="true" style="z-index: inherit;"></td><td style="width:90%;text-align: left;"><label for="radio_choice_'+count+'"  style="z-index: inherit;">'+answer+'</label></td></tr>';
                            count++;
                        }
                        answerpanel += '</table><input type="button" id="Send" value="Send"></input>'
                        document.getElementById("options").innerHTML = answerpanel;
                        
                        document.getElementById("Send").addEventListener("click", function(){
                            fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/poll/"+key+"/"+userid+"/"+$('input[name=radio-choice-v-6]:checked').val()).then((response) => response.json())
                            .then((data) => {
                                console.log(data);
                                draw_chart();
                            })
                            .catch((error) => {
                                console.warn(error);
                            });
                        });
                    }
                    if(poll_check == "Already Voted"){
                        console.log(polldata.answer)
                        draw_chart();
                    }
                    document.getElementById("audio").play();
                    $("#acomment").trigger("click");
                })
                .catch((error) => {
                    console.warn(error);
                });
                
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
            $.mobile.loading("hide");
    }

    function draw_chart(){
        var poll_check;
        fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/poll_check/"+key+"/"+userid).then((response) => response.json())
        .then((polldata) => {
            poll_check = polldata.status;
            if(poll_check == "Already Voted"){
                fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/detailednews/"+key).then((response) => response.json())
                    .then((data) => {
                        document.getElementById("options").innerHTML = '<h3 style="text-align: left;">Your answer : '+polldata.answer+'</h3><canvas id="myChart" width="400" height="400"></canvas>';
                        var ctx = document.getElementById('myChart').getContext('2d');
                        var myChart = new Chart(ctx, {
                            type: 'pie',
                            data: {                            
                                labels: Object.keys(data.answers),
                                datasets: [{
                                    data: Object.values(data.answers),
                                    backgroundColor: [
                                        "#2ecc71",
                                        "#3498db",
                                        "#95a5a6",
                                        "#9b59b6",
                                        "#f1c40f",
                                        "#e74c3c",
                                        "#34495e"
                                        ]
                                    }]
                                },
                            options: {
                                title: {
                                    display: true,
                                    fontsize: 14,
                                },
                                legend: {
                                    display: true,
                                    position: 'top',
                        
                                },
                                responsive: true, 
                                tooltips: {
                                    enabled: false
                               },
                                plugins: {
                                    datalabels: {
                                        formatter: (value, ctx) => {
                                            let sum = 0;
                                            let dataArr = ctx.chart.data.datasets[0].data;
                                            dataArr.map(data => {
                                                sum += data;
                                            });
                                            //let percentage = (value*100 / sum).toFixed(2)+"%";
                                            let percentage = value;
                                            return percentage;
                                        },
                                        color: '#fff',
                                        font: {
                                            weight: 'bold',
                                            size: 16,
                                        }
                                    }
                                }
                            }
                        });
                    });
            }
        });
    }

    function load_news(element){
      current_audio_comment_index=0;
      key = element.target.parentElement.children[0].children[0].innerText;
      news_index = news_list.indexOf(key);
      news_load();       
    }

    function load_news_next(){
        current_audio_comment_index=0;
        key = news_list[news_index+1];
        news_index = news_index+1;
        news_load();
        document.getElementById("audio").play();
      }

      function load_news_prev(){
        current_audio_comment_index=0;
        
        key = news_list[news_index-1];
        news_index = news_index-1
        news_load();        
        document.getElementById("audio").play();
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
    onPause();
    function onSuccess(r) {
      console.log("Code = " + r.responseCode);
      console.log("Response = " + r.response);
      console.log("Sent = " + r.bytesSent);
      fetch("http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/detailednews/"+key).then((response) => response.json())
        .then((data) => {
            current_audio_list = data.comments;
            var commentpanel = '<ul data-role="listview" data-inset="true" data-theme="d" data-divider-theme="d" style="width:100%;padding:0;">';
            
            for(var audiocomment in current_audio_list){
                commentpanel += '<li data-role="fieldcontain" data-role="list-divider" style="display:flex;width: 100%;height:50px;"><div style="width:50%;padding-top: 4%;"> <a style="font-size: smaller;" href="#">'+current_audio_list[audiocomment]["time"]+' </a></div><audio id="player-'+audiocomment+'" style="width:70%;height:30px;margin-top: 4%;" src="http://ec2-3-10-169-78.eu-west-2.compute.amazonaws.com/upload/upload/'+key+"/"+current_audio_list[audiocomment]["filename"]+'" controls controlsList="nodownload"></audio></li><hr>';
            }
            commentpanel+="</ul>";
            current_comment_list = current_audio_list;
            current_audio_list = [];
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
   //var networkState = navigator.connection['type'];
   var networkState = "unknown";
   var states = {};
   console.log('Connection type: ' + networkState);
}

function nextComment(){                
    onPause();
    console.log("nextComment");
    if(current_audio_comment_index < Object.keys(current_comment_list).length 
    && current_audio_comment_index > 0){
    var audioPlayer = document.getElementById('player-'+current_audio_comment_index);
    document.getElementById('player-'+current_audio_comment_index).addEventListener('ended', nextComment, true); 
    audioPlayer.play();    
    current_audio_comment_index = current_audio_comment_index +1;
    }
    else{        
        document.getElementById('playAll').value = "▶ Play all";
        $('#playAll').button("refresh");
    }
}

function onPause() {
    var audios = document.getElementsByTagName('audio');
    for(var i = 0, len = audios.length; i < len;i++){
        audios[i].pause();
    }
    try{
        document.getElementById('playAll').value = "▶ Play all";
        $('#playAll').button("refresh");
    }
    catch(e){
        console.log(e);
    }
}
})();


