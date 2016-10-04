/*var server = null;
if(window.location.protocol === 'http:')
	server = "http://" + window.location.hostname + ":8081/janus";
else
	server = "https://" + window.location.hostname + ":8082/janus";
*/
var server = "https://streaming-brunux.c9users.io/janus/"; // locally proxyed check urls file
var janus = null;
var textroom = null;
var registered = false

var myroom = 1234;
var myusername = null;
var myid = null;
var participants = {}
var transactions = {}


$(document).ready(function() {
	// Initialize the library (all console debuggers enabled)
	Janus.init({debug: "all", callback: function() {
		// Use a button to start the demo
		if(!Janus.isWebrtcSupported()) {
			alert("Lo sentimos, tu navegador no soporta communicacion en tiempo real\nCambia a Google Chrome");
			return;
			
		} else {
		    console.log("Navegador soportado");
		}
		// Creating the session
		janus = new Janus(
		    {
		        server: server,
		        success: function() {
		             // Attach to textroom plugin
		             console.log("En exito!");
		             janus.attach(
		                 {
		                     plugin: "janus.plugin.textroom",
		                     success: function(pluginHandle) {
		                         textroom = pluginHandle;
		                         Janus.log("Plugin attached! (" + textroom.getPlugin() + ", id=" + textroom.getId() + ")");
		                         // Seting up data channel
		                         var body = {"request": "setup"}
		                         Janus.debug("Sending message (" + JSON.stringify(body) + ")");
		                         textroom.send({"message": body});
		                     },
		                     error: function(error) {
		                         console.error("  -- Error attaching plugin...", error);
		                         alert("Error attaching plugin... " + error);
		                         
		                     },
		                     webrtcState: function(on) {
		                         Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
		                     },
		                     onmessage: function(msg, jsep) {
		                         Janus.debug(" ::: Got a message :::");
		                         Janus.debug(JSON.stringify(msg));
		                         if(msg["error"] !== undefined && msg["error"] !== null) {
		                             alert(msg["error"]);
		                         }
		                         if(jsep !== undefined && jsep !== null) {
		                             // Answere
		                             textroom.createAnswer(
		                                 {
		                                     jsep: jsep,
		                                     media: { audio: false, video: false, data: true}, // Text message pass through data channels
		                                     success: function (jsep) {
		                                         Janus.debug("Got SDP!");
		                                         Janus.debug(jsep);
		                                         var body = { "request": "ack" };
		                                         textroom.send({"message": body, "jsep": jsep});
		                                     },
		                                     error: function(error) {
		                                         Janus.error("WebRTC error:", error);
		                                         alert("WebRTC error... " + JSON.stringify(error));
		                                     }
		                                 });
		                         }
		                     },
		                     ondataopen: function(data) {
		                         Janus.log("The DataChannel is available!");
		                         // Optional prompt for a display name to join the default room
		                     },
		                     ondata: function(data) {
		                         Janus.debug("We got data from the DataChannel! " + data);
		                         var json = JSON.parse(data);
		                         var transaction = json["transaction"];
		                         if(transactions[transaction]) {
		                             // Someone was waiting for this
		                             transactions[transaction](json);
		                             delete transactions[transaction];
		                             return;
		                         }
		                         var what = json["textroom"];
		                         // Incoming message: public or private?
		                         if(what === "message") {
		                             var msg = json["text"];
		                             console.log("Got message!!");
		                             console.log(json["text"]);
		                             msg = msg.replace(new RegExp('<', 'g'), '&lt');
		                             msg = msg.replace(new RegExp('>', 'g'), '&gt');
		                             var from = json["from"];
		                             var dateString = getDateString(json["date"]);
	                                 $('#chatroom').append('<p>[' + dateString + '] <b>' + participants[from] + ':</b> ' + msg);
	                                 $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
		                         } else if(what === "join") {
		                             // Somebody joined
		                             var username = json["username"];
		                             var display = json["display"];
		                             participants[username] = display ? display : username;
		                             $('#chatroom').append('<p style="color: green;">[' + getDateString() + '] <i>' + participants[username] + ' se unió</i></p>');
		                             $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
		                         } else if(what === "leave") {
		                             // Somebody left
		                             var username = json["username"];
		                             var when = new Date();
		                             $('#chatroom').append('<p style="color: red;">[' + getDateString() + '] <i>' + participants[username] + ' Se fue</i></p>');
		                             $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
		                             delete participants[username];
		                         } else if(what === "destroyed") {
    		                             // Room was destroyed, goodbye!
    		                             Janus.warn("The room has been destroyed!");
		                         }
		                     },
		                     oncleanup: function() {
		                         Janus.log(" ::: Got a cleanup notification :::");
		                         $('#datasend').attr('disabled', true);
		                     }
		                 });
		        },
		        error: function(error) {
		            Janus.error(error);
		            alert(error);
		        },
		        destroyed: function() {
		            window.location.reload();
		        }
		    });
	}});
});

function checkEnter(field, event) {
	var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
	if(theCode == 13) {
		if(field.id == 'datasend')
			sendData();
		return false;
	} else {
		return true;
	}
}

function registerUsername() {
	myid = randomString(12);
	var username = $('#header-data').attr("client");
	var transaction = randomString(12);
	var register = {
		textroom: "join",
		transaction: transaction,
		room: myroom,
		username: myid,
		display: username
	};
	myusername = username;
	transactions[transaction] = function(response) {
		if(response["textroom"] === "error") {
			// Something went wrong
			alert(response["error"]);
			return;
		}
		// We're in
		$('#chatroom').css('height', ($(window).height()-820)+"px"),
		//$('#datasend').removeAttr('disabled');
		// Any participants already in?
		console.log("Participants:", response.participants);
		if(response.participants && response.participants.length > 0) {
			for(var i in response.participants) {
				var p = response.participants[i];
				participants[p.username] = p.display ? p.display : p.username;
				$('#chatroom').append('<p style="color: green;">[' + getDateString() + '] <i>' + participants[p.username] + ' se unió</i></p>');
				$('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
			}
		}
		$('#participants').html(Object.keys(participants).length.toString() + ' online');
	};
	textroom.data({
		text: JSON.stringify(register),
		error: function(reason) {
			alert(reason);
		}
	});
	registered = true 
}


function sendData() {
    if(!registered) {
        registerUsername()
    }
	var data = $('#datasend').val();
	if(data === "") {
		alert('Escribe un mensaje a enviar...');
		return;
	}
	var message = {
		textroom: "message",
		transaction: randomString(12),
		room: myroom,
 		text: data,
 		whisper: false,
	};
	// Note: messages are always acknowledged by default. This means that you'll
	// always receive a confirmation back that the message has been received by the
	// server and forwarded to the recipients. If you do not want this to happen,
	// just add an ack:false property to the message above, and server won't send
	// you a response (meaning you just have to hope it succeeded).
	textroom.data({
		text: JSON.stringify(message),
		error: function(reason) { alert(reason); },
		success: function() { $('#datasend').val(''); }
	});
}

// Helper to format times
function getDateString(jsonDate) {
	var when = new Date();
	if(jsonDate) {
		when = new Date(Date.parse(jsonDate));
	}
	var dateString =
			("0" + when.getHours()).slice(-2) + ":" +
			("0" + when.getMinutes()).slice(-2) + ":" +
			("0" + when.getSeconds()).slice(-2);
	return dateString;
}

// Just an helper to generate random usernames
function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
    	var randomPoz = Math.floor(Math.random() * charSet.length);
    	randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}