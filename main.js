const express= require('express')
const path=require('path')
const app=express()
const http=require('http').Server(app)
const port = process.env.PORT||3000
const io=require('socket.io')(http)
app.use(express.static(path.join(__dirname,'public')))
io.on('connection',(sock)=>{
    console.log('A user connected!')
    sock.on('create or join',(room)=>{
        console.log('count or join room ',room)
        const myRoom=io.sockets.adapter.rooms[room]||{length:0}
        const numClients=myRoom.length
        console.log(room,' has ',numClients,' clients')
        if(numClients===0)
        {
            sock.join(room)
            sock.emit('created',room)
        }
        else if(numClients===1)
        {
            sock.join(room)
            sock.emit('joined',room)
        }
        else{
            sock.emit('full',room)
        }
    })
    sock.on('ready',(room)=>{
        sock.broadcast.to(room).emit('ready')
    })
    sock.on('candidate',(event)=>{
        sock.broadcast.to(event.room).emit('candidate',event)
    })
    sock.on('offer',(event)=>{
        sock.broadcast.to(event.room).emit('offer',event.sdp)
    })
    sock.on('answer',(event)=>{
        sock.broadcast.to(event.room).emit('answer',event.sdp)
    })
})
http.listen(port,()=>
{
    console.log("Server started!!")
})
