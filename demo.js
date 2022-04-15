let Sensors = [];

function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
       var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
       return v.toString(16);
    });
 }
// Called after form input is processed
function startConnect() {
    // Generate a random client ID
    clientID = "clientID-" + parseInt(Math.random() * 100);

    // Fetch the hostname/IP address and port number from the form
    host = "192.168.50.100";
    port = "9001";

    // Print output for the user in the messages div
    document.getElementById("messages").innerHTML += '<span>Connecting to: ' + host + ' on port: ' + port + '</span><br/>';
    document.getElementById("messages").innerHTML += '<span>Using the following client value: ' + clientID + '</span><br/>';

    // Initialize new Paho client connection
    client = new Paho.MQTT.Client(host, Number(port), clientID);

    // Set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    // Connect the client, if successful, call onConnect function
    client.connect({ 
        onSuccess: onConnect,
    });
}

function checkAlive() {
    var element = document.getElementById("sensors");
    element.textContent = '';
    message = new Paho.MQTT.Message("report_alive");
	message.destinationName = "recorder/control";
	client.send(message);
    Sensors=[];
    updateSensorList();
}

function startPreview() {
    message = new Paho.MQTT.Message("preview");
	message.destinationName = "recorder/control";
	client.send(message);
}

function stopPreview() {
    message = new Paho.MQTT.Message("stop_preview");
	message.destinationName = "recorder/control";
	client.send(message);
}

function startAll() {
    message = new Paho.MQTT.Message("start,"+createUUID());
	message.destinationName = "recorder/control";
	client.send(message);
}

function stopAll() {
    message = new Paho.MQTT.Message("stop");
	message.destinationName = "recorder/control";
	client.send(message);
}

function startSensor(sensorName) {
    message = new Paho.MQTT.Message("sensor_start,"+sensorName+","+createUUID());
	message.destinationName = "recorder/control";
	client.send(message);
}

function stopSensor(sensorName) {
    message = new Paho.MQTT.Message("sensor_stop,"+sensorName);
	message.destinationName = "recorder/control";
	client.send(message);
}

function previewSensor(sensorName){
    message = new Paho.MQTT.Message("sensor_preview,"+sensorName);
	message.destinationName = "recorder/control";
	client.send(message);
}

function stopPreviewSensor(sensorName){
    message = new Paho.MQTT.Message("sensor_preview_stop,"+sensorName);
	message.destinationName = "recorder/control";
	client.send(message);
}

function updateSensors() {
    message = new Paho.MQTT.Message("update");
	message.destinationName = "recorder/control";
	client.send(message);
}

function rebootSensors() {
    message = new Paho.MQTT.Message("reboot");
	message.destinationName = "recorder/control";
	client.send(message);
}

function shutdownSensors() {
    message = new Paho.MQTT.Message("shutdown");
	message.destinationName = "recorder/control";
	client.send(message);
}

function shutdownSensor(sensorName){
    message = new Paho.MQTT.Message("sensor_shutdown,"+sensorName);
	message.destinationName = "recorder/control";
	client.send(message);
}

// Called when the client connects
function onConnect() {
    // Fetch the MQTT topic from the form
    topic1 = "recorder/heartbeat";
    topic2 = "recorder/update"

    // Print output for the user in the messages div
    document.getElementById("messages").innerHTML += '<span>Subscribing to: ' + topic1 + '</span><br/>';
    document.getElementById("messages").innerHTML += '<span>Subscribing to: ' + topic2 + '</span><br/>';

    // Subscribe to the requested topic
    client.subscribe(topic1);
    client.subscribe(topic2);
}

// Called when the client loses its connection
function onConnectionLost(responseObject) {
    console.log("onConnectionLost: Connection Lost");
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost: " + responseObject.errorMessage);
    }
}

function updateSensorList(){
    var element = document.getElementById("sensors");
    element.innerHTML=""
    sensorLength=Sensors.length;
    for (let i =0; i<sensorLength; i++){
        var tag = document.createElement("p");
        var text = "";
        console.log(Sensors[i])
        text += "<a href='http://"+Sensors[i].ip+"' target='_blank' rel='noopener noreferrer'>"+Sensors[i].name+"</a>";
        if(Sensors[i].health="Alive"){
            text = "<i class='fa-solid fa-circle' style='color:green'></i> "+text;
        }
        else {
            text = "<i class='fa-solid fa-circle' style='color:red'></i> "+text;
        }
        if(Sensors[i].status=="Previewing"){
            text +=" <button class='btn' onclick='stopPreviewSensor(\""+Sensors[i].name+"\")' style='background-color: lightgreen;' ><i class='fa-solid fa-magnifying-glass'></i></button>"
        }
        else{
            text +=" <button class='btn' onclick='previewSensor(\""+Sensors[i].name+"\")' style='background-color: pink;'><i class='fa-solid fa-magnifying-glass'></i></button>"
        }
        if(Sensors[i].status=="Recording"){
            text +=" <button class='btn' onclick='stopSensor(\""+Sensors[i].name+"\")' style='background-color: lightgreen;'><i class='fa-solid fa-video'></i></button>"
        }
        else {
            text +=" <button class='btn' onclick='startSensor(\""+Sensors[i].name+"\")' style='background-color: pink;'><i class='fa-solid fa-video'></i></button>"
        }
        text += " <button class='btn' onclick='shutdownSensor(\""+Sensors[i].name+"\")'><i class='fa-solid fa-power-off'></i></button>";
        tag.innerHTML =text;
        
        element.appendChild(tag);
    }
    
}

// Called when a message arrives
function onMessageArrived(message) {
    newSensor=false
    console.log(message.destinationName)
    if(message.destinationName=="recorder/heartbeat"){
        newSensor=true
    }
    else{
        newSensor=false
    }
    sensorData=message.payloadString;
    sensorInfo = sensorData.split(",");
    sensorName=sensorInfo[0];
    sensorIP=sensorInfo[1];
    sensorStatus=sensorInfo[2];
    sensorHealth=sensorInfo[3];
    sensor={"name":sensorName,"ip":sensorIP,"status":sensorStatus,"health":sensorHealth}
    if(newSensor){
        Sensors.push(sensor);
    }
    else{
        sensorsLength = Sensors.length;
        for (let i =0; i<sensorsLength; i++){
            if(Sensors[i].name==sensorName){
                Sensors[i]=sensor
            }
        }
    }
    console.log(Sensors)
    updateSensorList();
    console.log("onMessageArrived: " + message.payloadString);
    document.getElementById("messages").innerHTML += '<span>Topic: ' + message.destinationName + '  | ' + message.payloadString + '</span><br/>';
    updateScroll(); // Scroll to bottom of window
}

// Called when the disconnection button is pressed
function startDisconnect() {
    client.disconnect();
    document.getElementById("messages").innerHTML += '<span>Disconnected</span><br/>';
    updateScroll(); // Scroll to bottom of window
}

// Updates #messages div to auto-scroll
function updateScroll() {
    var element = document.getElementById("messages");
    element.scrollTop = element.scrollHeight;
}

function collapsibleLog(){
    messages=document.getElementById("messages")
    if (messages.style.display === "inline-block") {
        messages.style.display = "none";
      } else {
        messages.style.display = "inline-block";
      }
}

window.onload = function() {
    startConnect();
    setTimeout(() => { checkAlive(); }, 500);
  };





