 const videoContainer = document.getElementById("video-container");
 const myVideo = document.createElement("video");
 myVideo.muted = true;
 myVideo.style.transitionDuration="0.4s";
 const otherVideo = document.createElement("video");
 otherVideo.muted = true;
 otherVideo.style.transitionDuration="0.4s";
 let myVideoStream;
 let otheruser;
 let peer;
var chunks=[];



socket.on("room-filled",()=>{
  alert("room filled!!");
})



function calluser(userid){
     peer=createPeer(userid);
     myVideoStream.getTracks().forEach(element => peer.addTrack(element,myVideoStream));

}

function createPeer(userid){
  const pe = new RTCPeerConnection({
    iceServers:[
      {
        urls:"stun:stun.stunprotocol.org"
      },
      {
        urls:"turn:numb.viagenie.ca",
        credential:"muazkh",
        username:"webrtc@live.com"
      }
    ]
  });

  pe.onicecandidate = handleicecandidate;
  pe.ontrack = handletrack;
  pe.onnegotiationneeded =()=> handlenegotiation(userid);
  return pe;

}

function handlenegotiation(userid){
  peer.createOffer().then(offer=>{
    return peer.setLocalDescription(offer);
  }).then(()=>{
    const inp={
      target:userid,
      caller:socket.id,
      sdp:peer.localDescription
    };

    socket.emit('incoming-call',inp);

  }).catch(e=>console.log(e));

}

function handleincomingcall(incom){
  peer=createPeer();
  const desc = new RTCSessionDescription(incom.sdp);
  peer.setRemoteDescription(desc).then(()=>{
    myVideoStream.getTracks().forEach(ele => peer.addTrack(ele,myVideoStream))
  }).then(()=>{
    return peer.createAnswer();
  }).then(answer=>{
    return peer.setLocalDescription(answer);
  }).then(()=>{
    const inp={
      target:incom.caller,
      caller:socket.id,
      sdp:peer.localDescription
    }
    socket.emit("answer-call",inp);
  })
}

function handleanswer(message){
  const desc = new RTCSessionDescription(message.sdp);
  peer.setRemoteDescription(desc).catch(e=>console.log(e));
}

function handleicecandidate(e){
  if(e.candidate){
    const inp={
      target:otheruser,
      candidate:e.candidate
    }
    socket.emit('ice-candidate',inp);
  }
}

function handlenewicecandidate(e){
  const cand = new RTCIceCandidate(e);
  peer.addIceCandidate(cand).catch(er=>console.log(er));
}

function handletrack(e){
  console.log(e);
  addVideoStream(otherVideo,e.streams[0]);
}


 const addVideoStream = (videoEl, stream) => {
    videoEl.srcObject = stream;
    videoEl.addEventListener("loadedmetadata", () => {
      videoEl.play();
    });
  
    videoContainer.append(videoEl);
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
      otherVideo.style.display='flex';
      otherVideo.style.position='relative';
      otherVideo.style.width='100vw';
      otherVideo.style.height='100vh';
      myVideo.style.display='flex';
      myVideo.style.position='absolute';
      myVideo.style.zIndex='10';
      myVideo.style.width='200px';
      myVideo.style.height='200px';
      myVideo.style.bottom='0';
      myVideo.style.right='0';

    }
  };



  // start

  navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    socket.emit("join-room", ROOM_ID);
    

  
  });
  socket.on('other-users',(userid)=>{
    console.log(userid);
    calluser(userid);
    otheruser=userid;
  });

  socket.on("user-joined", (userid) => {
    console.log('user joined');
   otheruser=userid;
   var displaymediastreamconstraints = {
    video: {
        displaySurface: 'browser', // monitor, window, application, browser
        logicalSurface: true,
        cursor: 'always' // never, always, motion
    }
};
displaymediastreamconstraints = {
    video: true,
    audio:true
};
   navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  }).then((stream)=>{
    let recorder = RecordRTC(stream, {
      type: 'video',
      mimeType:"video/mp4;",
      timeSlice: 2000, // pass this parameter
      bitsPerSecond: 128000,
      ondataavailable: function(event) {
        console.log(event);
        var reader = new FileReader();
              reader.readAsArrayBuffer(event)
              reader.onloadend = function(){
                var buffer = reader.result;
                console.log(buffer)
                socket.emit('recieve-chunks',buffer,ROOM_ID);
              }
    }
  });
  recorder.startRecording();
  console.log(recorder);
   }).catch(er=>console.log(er));
 });
  socket.on('incoming-call', handleincomingcall);
   socket.on('answer-call',handleanswer);
   socket.on('ice-candidate',handlenewicecandidate);
 
 //  finish
