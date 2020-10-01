var divSelectRoom= document.getElementById("selectRoom")
var divConsultingRoom= document.getElementById("consultingRoom")
var inputRoomNumber= document.getElementById("roomNumber")
var btnGoRoom= document.getElementById("goRoom")
var localVideo= document.getElementById("localVideo")
var remoteVideo= document.getElementById("remoteVideo")
var screenShare=document.getElementById("screenShare")
var endShare=document.getElementById("endShare")
var video=document.getElementById("video")
var audio=document.getElementById("audio")
var msg=document.getElementById("msgText")
var sendButton=document.getElementById("sendBtn")
var msgContainer=document.getElementById("message-container")
var forChat=document.getElementById("forChat")

var roomNumber
var rtcPeerConnection
var isCaller
var localStream
var remoteStream
var isVideoOn=true
var isAudioOn=true
var isScreenShareOn=false

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

    if(inputRoomNumber.value==='')
    alert('Please provide a room number')
    else{
        roomNumber=inputRoomNumber.value
        socket.emit('create or join',roomNumber)    
    }
    
}
screenShare.onclick=()=>{
    addScreenShare()
}
endShare.onclick=()=>{
    addVidAndAud() 
}
video.onclick=()=>{
    toggleVideo()
}
audio.onclick=()=>{
    toggleAudio()
}
sendButton.onclick=sendMessage
socket.on('created',room=>{
    console.log('created')
    divSelectRoom.style='display:none'
    divConsultingRoom.style='display:block'
    forChat.style='display:block'
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
    divSelectRoom.style='display:none'
    divConsultingRoom.style='display:block'
    forChat.style='display:block'
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
    if(true)
    {
        rtcPeerConnection=new RTCPeerConnection(iceServers)
            rtcPeerConnection.onicecandidate=onIceCandidate
            rtcPeerConnection.ontrack=onAddStream
            rtcPeerConnection.addTrack(localStream.getTracks()[0],localStream)
            try{
            rtcPeerConnection.addTrack(localStream.getTracks()[1],localStream)
            }catch(e)
            {
                console.log(e)
            }
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
socket.on('message',otherText=>{
    msgContainer.innerHTML += '<div><b>' + 'Other' + '</b>: ' + otherText + '</div>'
    msgContainer.scrollTop = msgContainer.scrollHeight - msgContainer.clientHeight;
})
socket.on('full',()=>
{
    alert('The room is full')
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
function stopTracks(media)
{
    console.log('At stopTracks')
    isAudioOn=false
    isVideoOn=false
    try{
    var tracks=media.getTracks()
    tracks.forEach((track)=>{
        track.stop()
    })
    }
    catch(e)
    {
        console.log(e)
    }
}
function addVidAndAud()
{

    console.log('At addVidAndAud')
    navigator.mediaDevices.getUserMedia({video:true}).then((stream)=>{
        navigator.mediaDevices.getUserMedia({audio:true}).then((audStream)=>{
            stopTracks(localStream)

            endShare.style="display:none"
            screenShare.style="display:block"

            isScreenShareOn=false
            isAudioOn=true
            isVideoOn=true

            stream.addTrack(audStream.getTracks()[0])
            console.log("I am here first")
            localStream= stream
            return sendOffer()
        }).catch((error)=>{
            console.log('error: ',error)
        })
    }).catch((error)=>{
        console.log('error: ',error)
    })
}
function addScreenShare()
{
    console.log('At addScreenShare')
    navigator.mediaDevices.getDisplayMedia({video:true}).then((stream)=>{
        navigator.mediaDevices.getUserMedia({audio:true}).then((audStream)=>{
            stopTracks(localStream)

            endShare.style="display:block"
            screenShare.style="display:none"

            isScreenShareOn=true
            isAudioOn=true
            isVideoOn=true

            stream.addTrack(audStream.getTracks()[0])
            localStream= stream
            return sendOffer()
        }).catch((error)=>{
            console.log('error: ',error)
        })
    }).catch((error)=>{
        console.log('error: ',error)
    })
}
function sendOffer()
{

        localVideo.srcObject=localStream
        console.log("I am here later")
        console.log("from button sending offer---------->")
        rtcPeerConnection=new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate=onIceCandidate
        rtcPeerConnection.ontrack=onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0],localStream)
        try{
        rtcPeerConnection.addTrack(localStream.getTracks()[1],localStream)
        }catch(e)
        {
            console.log(e)
        }
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
function toggleAudio()
{

    var tracks=localStream.getTracks()
    console.log('I am in Toggle Audio',tracks[0].enabled)
    tracks[0].enabled=!tracks[0].enabled
    console.log('I am in Toggle Audio AFTER',tracks[0].enabled)
}
function toggleVideo()
{
    var tracks=localStream.getTracks()
    console.log('I am in Toggle Video',tracks[1].enabled)
    tracks[1].enabled=!tracks[1].enabled
    console.log('I am in Toggle Video AFTER',tracks[1].enabled)
}
function sendMessage()
{
    if(msg.value)
    {
        var tempText=msg.value
        msgContainer.innerHTML += '<div><b>' + 'You' + '</b>: ' + tempText + '</div>'
        msgContainer.scrollTop = msgContainer.scrollHeight - msgContainer.clientHeight;
        msg.value=""
        msg.placeholder="Type..."
        socket.emit('message',{room:roomNumber,text:tempText})
    }
}