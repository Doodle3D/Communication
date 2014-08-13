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
      console.log("/: new printer connection: ",socket.id);
      printerSocket = socket;      
      break;
    default: 
      console.log("/: new user connection: ",socket.id);
      break;
  }
  socket.on('disconnect', function(){
    console.log("printerNSP: disconnect: ",socket.id);
    printerSocket = null;
  });
});

var printerNSP = io.of("/printer");
printerNSP.on('connection', function(socket){
  
  var type = socket.handshake.query.type;
  if(type === "printer") printerPrinterSocket = socket;
  
  switch(type) {
    case "printer":
      console.log("/printer: new printer connection: ",socket.id);
      break;
    default: 
      console.log("/printer: new user connection: ",socket.id);
      break;
  }
  
  var oneventHandler = socket.onevent;
  socket.onevent = function() {
    oneventHandler.apply(this,arguments);
    var packet = arguments[0];
    var type = packet.data[0];
    var data = packet.data[1];
    var callback = packet.data[2];
    console.log("Event: ",type,data);
    if(socket === printerPrinterSocket) {
      // forward all events from printer to other clients in namespace
      printerPrinterSocket.broadcast.emit(type,data);
    } else {
      // forward all events from clients to printer
      if(printerPrinterSocket === null) {
        if(callback) callback({err:"Printer not available"});
        return; 
      }
      printerPrinterSocket.emit(type,data,function(response) {
        callback(response);
      });
    }
  };
  socket.on('disconnect', function(){
    console.log("printerNSP: disconnect: ",socket.id);
    printerPrinterSocket = null;
  });
});