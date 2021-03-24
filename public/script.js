 const videoContainer = document.getElementById("video-container");
 const myVideo = document.createElement("video");
 myVideo.muted = true;
 const otherVideo = document.createElement("video");
 otherVideo.muted = true;
 let myVideoStream;
 let otheruser;
 let peer;





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
      for (let index = 0; index < totalUsers; index++) {
        document.getElementsByTagName("video")[index].style.width =
          100 / totalUsers + "%";
      }
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
    console.log(userid);
   otheruser=userid;
 });
  socket.on('incoming-call', handleincomingcall);
   socket.on('answer-call',handleanswer);
   socket.on('ice-candidate',handlenewicecandidate);
 
 //  finish
