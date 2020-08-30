var divSelectRoom= document.getElementById("selectRoom")
var divConsultingRoom= document.getElementById("consultingRoom")
var inputRoomNumber= document.getElementById("roomNumber")
var btnGoRoom= document.getElementById("goRoom")
var localVideo= document.getElementById("localVideo")
var remoteVideo= document.getElementById("remoteVideo")

var roomNumber
var rtcPeerConnection
var isCaller
var localStream
var remoteStream

var iceServers={
    'iceServers':[
        {'urls':'stun:stun.services.mozilla.com'},
        {'urls':'stun:stun.l.google.com:19302'}
    ]
}

var streamConstraints={
    video:true,
    audio:true
}
var socket=io()
btnGoRoom.onclick=()=>{
    console.log('I am here')
    if(inputRoomNumber.value==='')
    alert('Please provide a room number')
    else{
        roomNumber=inputRoomNumber.value
        socket.emit('create or join',roomNumber)
        divSelectRoom.style='display:none'
        divConsultingRoom.style='display:block'
    }
    
}
socket.on('created',room=>{
    console.log('created')
    navigator.mediaDevices.getUserMedia(streamConstraints).then((stream)=>{
        localStream=stream
        localVideo.srcObject=stream
        isCaller=true
    }).catch((error)=>{
        console.log('error: ',error)
    })
    
})
socket.on('joined',room=>{
    console.log('joined')
    navigator.mediaDevices.getUserMedia(streamConstraints).then((stream)=>{
        localStream=stream
        localVideo.srcObject=stream
        socket.emit('ready',roomNumber)
    }).catch((error)=>{
        console.log('error: ',error)
    })
    
})
socket.on('ready',()=>{
    console.log('ready',isCaller)
    if(isCaller)
    {
        rtcPeerConnection=new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate=onIceCandidate
        rtcPeerConnection.ontrack=onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0],localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1],localStream)
        rtcPeerConnection.createOffer().then(sessionDescription=>{
            rtcPeerConnection.setLocalDescription(sessionDescription)
            console.log('sending offer',sessionDescription)
            socket.emit('offer',{
                room:roomNumber,
                sdp:sessionDescription,
                type:'offer'
            })
        }).catch((error)=>{
            console.log('error: ',error)
        })
    }
})
socket.on('offer',otherSessionDescription=>{
    console.log('offer',isCaller)
    if(!isCaller)
    {
        rtcPeerConnection=new RTCPeerConnection(iceServers)
            rtcPeerConnection.onicecandidate=onIceCandidate
            rtcPeerConnection.ontrack=onAddStream
            rtcPeerConnection.addTrack(localStream.getTracks()[0],localStream)
            rtcPeerConnection.addTrack(localStream.getTracks()[1],localStream)
            rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(otherSessionDescription))
            rtcPeerConnection.createAnswer().then(sessionDescription=>{
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('answer',{
                    type:'answer',
                    sdp:sessionDescription,
                    room:roomNumber
                })
            }).catch((error)=>{
                console.log('error: ',error)
            })
    }
})

socket.on('answer',otherSessionDescription=>{
    console.log('answer',isCaller)
    if(true)
    {
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(otherSessionDescription))

    }
})

socket.on('candidate',event=>{
    console.log('candidate')
    var candidate=new RTCIceCandidate({
        sdpMLineIndex:event.label,
        candidate:event.candidate
    })
    rtcPeerConnection.addIceCandidate(candidate)
})

function onAddStream(event)
{
        remoteVideo.srcObject=event.streams[0]
        remoteStream=event.streams[0]
}
function onIceCandidate(event)
{
    if(event.candidate)
    {
        console.log('sending ice candidate')
        socket.emit('candidate',{
            type:'candidate',
            label:event.candidate.sdpMLineIndex,
            id:event.candidate.sdpMid,
            candidate:event.candidate.candidate,
            room:roomNumber
        })
    }
}