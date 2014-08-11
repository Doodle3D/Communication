var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

http.listen(3000, function(){
  console.log('server listening on *:3000');
});

var printerSocket; // socket connection with printer in / namespace
var printerPrinterSocket; // socket connection with printer in /printer namespace

var rootNSP = io.of("/");
rootNSP.on('connection', function(socket){
  
  switch(socket.handshake.query.type) {
    case "printer":
      console.log("rootNSP: new printer connection: ",socket.id);
      printerSocket = socket;      
      break;
    default: 
      console.log("rootNSP: new user connection: ",socket.id);
      break;
  }
  
  socket.on('disconnect', function(){
    console.log("printerNSP: disconnect: ",socket.id);
    printerSocket = null;
  });
});

var printerNSP = io.of("/printer");
printerNSP.on('connection', function(socket){
  
  switch(socket.handshake.query.type) {
    case "printer":
      console.log("printerNSP: new printer connection: ",socket.id);
      printerPrinterSocket = socket;
      // forward events from printer to clients
      socket.on("temperatures",function(data) {
        console.log("printer temperature change");
        // broadcast to other clients in namespace
        socket.broadcast.emit("temperatures",data);
      });
      break;
    default: 
      console.log("printerNSP: new user connection: ",socket.id);
      break;
  }
  
  socket.on('disconnect', function(){
    console.log("printerNSP: disconnect: ",socket.id);
    printerPrinterSocket = null;
  });
  // forward events from clients to printer
  socket.on('setTemperatures', function(data,callback){
    console.log("printerNSP: setTemperatures: ",data);
    
    if(printerPrinterSocket === undefined || printerPrinterSocket === null) {
      if(callback) {
        callback({err:"Printer not connected"});
      }
      return;
    }
    printerPrinterSocket.emit("setTemperatures",data,function(response){
      callback(response);
    });
  });
});