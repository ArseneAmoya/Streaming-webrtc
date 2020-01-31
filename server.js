var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var id = 0;
app.use(express.static('public'));
app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/index.html');
})

io.sockets.on('connection',(socket)=>{
    console.log('an user connected');
    socket.on('create or join',(room)=>{
        id++;
        console.log('create or join room:',room);
        var myRoom = io.sockets.adapter.rooms[room] || {length: 0};
        var numClients = myRoom.length;
        console.log(room,' has ',numClients,' clients');
        if (numClients == 0) {
            socket.join(room);
            console.log("created",room)
            socket.emit('created',{room:room, id:id});
        }else if(numClients >= 1){
            var ident = Object.keys(io.sockets.adapter.rooms[room].sockets);
            socket.join(room);
            console.log('Joined',room)
            socket.emit('joined',{room:room, id:id, chambre : numClients, users: ident, me: socket.id });
        }
    });

    socket.on('ready',(event)=>{
        socket.to(event.user).emit('ready',event.by);
        console.log('ready');
    });

    socket.on('candidate',(event)=>{
        socket.broadcast.to(event.room).emit('candidate',event);
        console.log("candidate");
    })
    socket.on('offer',(event)=>{
        socket.to(event.to).emit('offer',event.sdp);
        console.log("offer");
    })
    socket.on('answer',(event)=>{
                socket.to(event.user).emit('answer',event.sdp);
        console.log("answer");
    })

    socket.on("suivant",()=>{
        socket.emit("suivant");
        console.log("suivant");
   
    })
    

})

server.listen(5555,()=>{
    console.log('listening');
})