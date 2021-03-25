const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const Blob = require("cross-blob");
const fs = require("fs");
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

    socket.on('recieve-chunks',(buffer,roomId)=>{
      function writeOrAppendData(data){
        var filePath = './videos/'
        const fileExtension = '.mp4'
        if (!fs.existsSync(filePath+ roomId  + fileExtension)){
            console.log('write Original file')
            fs.writeFileSync(filePath+roomId + fileExtension,data)
        }
        else {
            fs.appendFileSync(filePath+roomId + fileExtension,data)
        }
    }
    console.log(buffer)
    if (buffer instanceof Buffer)
        writeOrAppendData(buffer)

    })



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