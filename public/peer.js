var divSelectRoom = document.querySelector("#selectRoom");
var divConsultingRoom = document.querySelector("#consultingRoom");
var inputRoomNumber = document.querySelector("#roomNumber");
var btnGoRoom = document.querySelector("#goRoom");
var localVideo = document.querySelector("#localVideo");
var remoteVideo;
var id;
var i = 0;
var setted = false;
var roomNumber;
var localStream;
var remoteStream = "";
var hasjoined = false;
var rtcPeerConnection;
var chambre;
var clientTocontact;
var users;
var me;
var cible;
var contacted = 0;
var iceServers = {
    'iceServers':[
        {'url':'stun:stun.services.mozilla.com'},
        {'url':'stun:stun.l.google.com:19302'}
    ]
}
var streamConstraints = {
    audio : true,
    video : true
}
var isCaller = false;
var socket = io.connect();
btnGoRoom.onclick = ()=>{
    if(!!inputRoomNumber.value ===''){
        alert('SVP entrer un numero de room à rejoindre');
    }else{
        roomNumber = inputRoomNumber.value;
        socket.emit('create or join',roomNumber);
        divConsultingRoom.style = 'display:block;';
    }
}

socket.on("created",(event)=>{
    hasjoined = false;
    navigator.mediaDevices.getUserMedia(streamConstraints).then((stream)=>{
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
        id = event.id;
        
    }).catch((err)=>{
        console.log('sommething wrong kira',err);
    });
            
});

socket.on("joined",(event)=>{
    clientTocontact = event.chambre;
        navigator.mediaDevices.getUserMedia(streamConstraints).then((stream)=>{
            localStream = stream;
            localVideo.srcObject = stream;            
            users = event.users;
            me = event.me;
            lancer();
            id = event.id;
            hasjoined = true;
        }).catch((err)=>{
            console.log('An error occured kira when trying to join',err);
        });
});

socket.on("ready",async(data)=>{
    setted = false
    cible = data
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onTrack;
    localStream.getTracks().forEach((track) =>{rtcPeerConnection.addTrack(track, localStream)
        console.log('a track');
    }
    );
        try {
            await rtcPeerConnection.createOffer(setLocalAndOffer,(e)=>{console.log(e)});
        } catch (err) {
            console.error(err);
        }
    console.log("ready");
})

socket.on("offer",async(event)=>{
    if(hasjoined){
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
            try {
                await rtcPeerConnection.createAnswer(setLocalAndAnswer,(e)=>{console.log(e)});
            } catch (err) {
              console.error(err);
            }
            console.log("offer")
        }
        console.log("offer")
});
socket.on('answer',async(event)=>{
    if(!hasjoined){
        try {
            await rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
            console.log("answer")
        } catch (error) {
           console.log('Kira :',error) ;
        }
        
    }
});

socket.on('candidate',(event)=>{
    
    if(event.ind != id){
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: event.label,
            candidate:event.candidate
        })
        rtcPeerConnection.addIceCandidate(candidate);
    }
});

function onTrack(event){
    if(remoteStream.id  != event.streams[0].id){
        remoteStream = event.streams[0];
        video = document.createElement('video');
        video.srcObject = remoteStream;
        video.autoplay = true;
        video.controls = true;
        divConsultingRoom.appendChild(video);
        console.log('a remote video');
        contacted ++;
        socket.emit('suivant');
        if(hasjoined && contacted==clientTocontact){
            hasjoined = false;
        }
    }
}

function onIceCandidate(event){
    if(event.candidate){
        console.log('sending ice candidate');
        socket.emit('candidate',{
            type: 'candidate',
            label :event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            ind: id,
            room: roomNumber
        });

    }
}

function setLocalAndOffer(sessionDescription){
    if(!setted){
        rtcPeerConnection.setLocalDescription(sessionDescription);
        setted = true;
    }
    socket.emit('offer',{
        type: 'offer',
        sdp: sessionDescription,
        room: roomNumber,
        to: cible
    });
}

function setLocalAndAnswer(sessionDescription){
    rtcPeerConnection.setLocalDescription(sessionDescription);
    socket.emit('answer',{
        type: 'answer',
        sdp: sessionDescription,
        room: roomNumber,
        user:users[i]
    });
}

socket.on('log', (array) => {
    console.log.apply(console, array);
});

socket.on('full', (room) => {
    console.log('Room ' + room + ' is full');
})

socket.on("suivant",()=>{
    i++;
    lancer();
})
function lancer(){
    if(users[i]){
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        localStream.getTracks().forEach((track) =>{
            rtcPeerConnection.addTrack(track, localStream);
        });
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onTrack;
        socket.emit('ready',{room:roomNumber, user: users[i], by:me})
    }
}