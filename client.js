/////// DISPLAY ///////
var temperaturesDisplay = document.querySelector(".display");
function displayTemperatures(data) {
  var text = "Hotend: "+data.hotend;
  temperaturesDisplay.innerHTML = text;
  hotEndField.value = data.hotend;
}
var errDisplay = document.querySelector(".err");
function displayErr(err) {
  var text = "Error: "+err;
  errDisplay.innerHTML = text;
}
function clearErr() {
  errDisplay.innerHTML = "";
}

/////// EDIT ///////
var hotEndField = document.getElementById("hotend");
hotEndField.onchange = function(event) {
  console.log("change: ",hotEndField.value);
  clearErr();
  
  var targetSocket = (toBackend)? backendPrinterNSP : printerPrinterNSP;
  console.log("toBackend: ",toBackend);
  console.log("targetSocket: ",targetSocket);
  
  targetSocket.emit("setTemperatures",{hotend:hotEndField.value},function(response) {
    console.log("response: ",response);
    if(response.err) displayErr(response.err);
  });
};
var toBackend = true;
var toBackendRadio = document.getElementById("tobackend");
var toPrinterRadio = document.getElementById("toprinter");
toBackendRadio.onchange = toPrinterRadio.onchange = function() {
  toBackend = toBackendRadio.checked;
  console.log("  toBackend: ",toBackend);
};

/////// SOCKET TO BACKEND ///////
var backendSocket = io("localhost:3000?key=CsCeMtYJALkn");
var backendPrinterNSP;

backendSocket.on('connect', function(){
  console.log("connected to backend root nsp");
  backendPrinterNSP = io.connect("localhost:3000/printer?key=CsCeMtYJALkn");
  backendPrinterNSP.on('connect', function(){
    console.log("connected to backend printer nsp");
    
    backendPrinterNSP.on('temperatures', function(data){
      displayTemperatures(data);
    });
  });
});

/////// SOCKET TO PRINTER ///////
var printerSocket = io("localhost:4000?key=CsCeMtYJALkn");
var printerPrinterNSP;
printerSocket.on('connect', function(){
  console.log("connected to printer root nsp");
  printerPrinterNSP = io.connect("localhost:4000/printer?key=CsCeMtYJALkn");
  printerPrinterNSP.on('connect', function(){
    console.log("connected to printer printer nsp");
    
    printerPrinterNSP.on('temperatures', function(data){
      displayTemperatures(data);
    });
  });
});