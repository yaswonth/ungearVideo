const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);

var data={}


app.set("view engine", "ejs");
app.use(express.static("public"));
app.get("/", (req, rsp) => {
    rsp.redirect(`/${uuidv4()}`);
  });
  
  app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
  });


io.on('connection', (socket)=>{
    socket.on('join-room', (roomId)=>{
      if(data[roomId]){
         if(data[roomId].length==2){
          socket.emit('room-filled');
          console.log(roomId+' filled');
          
         }else{
          const ou = data[roomId].find(id=>id!=socket.id);
          data[roomId].push(socket.id);
          socket.join(roomId);
          io.to().emit('user-joined',socket.id);
          if(ou){
            io.to(ou).emit('user-joined',socket.id);
            console.log(ou,"other");
            socket.emit('other-users',ou);
          }
          
          
         }
         
      }else{
        data[roomId]=[]
        data[roomId].push(socket.id);
        socket.join(roomId);
        io.to(roomId).emit('user-joined');
      } 
      console.log(data);
    });

    socket.on('incoming-call',(inp)=>{
      io.to(inp.target).emit('incoming-call',inp);
    });
    socket.on('answer-call',(inp)=>{
      io.to(inp.target).emit('answer-call',inp);
    });
    socket.on('ice-candidate',(inp)=>{
      io.to(inp.target).emit('ice-candidate',inp.candidate);
    });



    socket.on('disconnect',()=>{
      console.log(socket.id,"refreshed");
      for(var key in data){
        const index = data[key].indexOf(socket.id);
        if (index > -1) {
          data[key].splice(index, 1);
        }
      }
      console.log(data);
         
         
    })
    
});



console.log(process.env.PORT || 3083);
server.listen(process.env.PORT || 3083);
