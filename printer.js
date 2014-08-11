/////// CLIENT ////////////////////////////////////
/////// Printer connects to server as client /////
/////////////////////////////////////////////////

var socketClient = require('socket.io-client');
var hotend = 0;
var hotendTarget = 0;

// connect to server as client
var socket = socketClient('http://localhost:3000?key=KFkYjdVgrtBn&type=printer');
socket.on('connect', function(){
  console.log("Connected to server");
  
  var printerNSP = socketClient('http://localhost:3000/printer?key=KFkYjdVgrtBn&type=printer');
  printerNSP.on('connect', function(){
    console.log("Connected to printer namespace");

    printerNSP.on('setTemperatures', function(data,callback){
      console.log("from server/printer: setTemperatures: ",data);
      
      if(data.hotend < 0) callback({err:"Temperature to low"});
      else if(data.hotend > 230) callback({err:"Temperature to high"});
      else hotend = data.hotend;
      
      hotendTarget = data.hotendTarget;
      printerNSP.emit("temperatures",{hotend:hotend,hotendTarget:hotendTarget});
    });
  });
});

/////// SERVER ////////////////////////////////////
/////// Clients connect to printer directly //////
/////////////////////////////////////////////////

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

http.listen(4000, function(){
  console.log('printer listening on *:4000');
});
var printerNSP = io.of("/printer");
printerNSP.on('connection', function(socket){
  console.log("printerNSP: new connection: ",socket.id);
  
  socket.on('setTemperatures', function(data){
    console.log("printerNSP: setTemperatures: ",data);
    
    hotend = data.hotend;
    hotendTarget = data.hotendTarget;
    printerNSP.emit("temperatures",{hotend:hotend,hotendTarget:hotendTarget});
  });
});