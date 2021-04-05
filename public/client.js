const socket = io("127.0.0.1:3000")
const roomSelectionDiv = document.getElementById("roomSelectionDiv")
const createBtn = document.getElementById("createBtn")
const localVideo = document.getElementById("localVideo")
const remoteVideo = document.getElementById("remoteVideo")
const videoDiv = document.getElementById("videoDiv")
const enteredRoomName = document.getElementById("enteredRoomName");
const joinBtn = document.getElementById("joinBtn")
const joinRoom = document.getElementById("joinRoom")
let roomNumber, localStream, remoteStream, rtcPeerCon, isCaller

const iceServers = {
    iseServers: [
        { urls: 'stun3.l.google.com:19302' },
        { urls: 'stun2.l.google.com:19302' }
    ]

}

const streamConstraints = {
    video: true,
    audio: true
}

createBtn.onclick = () => {
    roomNumber = enteredRoomName.value;
    socket.emit('create', roomNumber)
    roomSelectionDiv.style = "display:none"
    videoDiv.style = "display:block"
}

joinBtn.onclick = () => {
    roomNumber = joinRoom.value;
    socket.emit('join', roomNumber);
    roomSelectionDiv.style = "display:none"
    videoDiv.style = "display:block"
}



socket.on('created', room => {
    navigator.mediaDevices.getUserMedia(streamConstraints)
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;
            isCaller = true;
        }).catch(err => {
            console.log(err)
        });

})

socket.on('joined', room => {
    console.log('joined')
    navigator.mediaDevices.getUserMedia(streamConstraints)
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;
            socket.emit('ready', room)
        }).catch(err => {
            console.log(err)
        });

})


socket.on('ready', room => {
    if (isCaller) {
        rtcPeerCon = new RTCPeerConnection(iceServers);
        rtcPeerCon.onicecandidate = onCandidate;
        rtcPeerCon.ontrack = addRemoteStream;
        rtcPeerCon.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerCon.addTrack(localStream.getTracks()[1], localStream)
        rtcPeerCon.createOffer()
            .then(sessionDescription => {
                rtcPeerCon.setLocalDescription(sessionDescription)
                console.log(sessionDescription)
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber

                })
            })
            .catch(err => {
                console.log(error)
            })
    }
})

socket.on('offer', sdp => {
    if (!isCaller) {
        rtcPeerCon = new RTCPeerConnection(iceServers);
        rtcPeerCon.onicecandidate = onCandidate;
        rtcPeerCon.ontrack = addRemoteStream;
        rtcPeerCon.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerCon.addTrack(localStream.getTracks()[1], localStream)
        rtcPeerCon.setRemoteDescription(sdp)
        rtcPeerCon.createAnswer()
            .then(sessionDescription => {
                rtcPeerCon.setLocalDescription(sessionDescription)
                console.log('my sdp comin from answerfunc:', sessionDescription)
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                })
                console.log(rtcPeerCon.signalingState)

            })
            .catch(err => {
                console.log('error happened ' + err)
            })
    }
})


socket.on('answer', sdp => {
    rtcPeerCon.setRemoteDescription(sdp);
    console.log('adderd remote desc to caller')
})

function addRemoteStream(event) {
    if (event.streams && event.streams[0]) {
        console.log('recieved remote stream')
        remoteVideo.srcObject = event.streams[0]
        remoteVideo
        remoteStream = event.streams[0]
    }
}


socket.on('full', room => alert(`${room} is full`))
socket.on('exists', room => alert(`${room} already exists`))


function onCandidate(event) {
    if (event.candidate) {
        console.log('sending ice candidate ', event.candidate)
        socket.emit('candidate', {
            candidate: event.candidate,
            room: roomNumber /** 
            type: 'candidate',
            label: event.candidate.sdpMlineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        **/})
    }
}

socket.on('candidate', event => {
    const candidate = new RTCIceCandidate(event.candidate)
    rtcPeerCon.addIceCandidate(candidate)
})