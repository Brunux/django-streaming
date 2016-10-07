/*var server = null;
if(window.location.protocol === 'http:')
	server = "http://" + window.location.hostname + ":8081/janus";
else
	server = "https://" + window.location.hostname + ":8082/janus";
*/
var server = "https://streaming-brunux.c9users.io/janus/"; // locally proxyed check urls file
var janus = null;

var textroom = null;
var registered = false;
var myroom = 1234;
var myusername = null;
var myid = null;
var participants = {}
var transactions = {}

// Audio
var mixertest = null;
var webrtcUp = false;
var audioenabled = false;


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
		                             $('#participants').html(Object.keys(participants).length.toString() + ' online');
		                             $('#chatroom').append('<p style="color: green;">[' + getDateString() + '] <i>' + participants[username] + ' se unió</i></p>');
		                             $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
		                         } else if(what === "leave") {
		                             // Somebody left
		                             var username = json["username"];
		                             var when = new Date();
		                             $('#chatroom').append('<p style="color: red;">[' + getDateString() + '] <i>' + participants[username] + ' Se fue</i></p>');
		                             $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
		                             delete participants[username];
		                             $('#participants').html(Object.keys(participants).length.toString() + ' online');
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
                    // Attach to Audio Bridge test plugin
						janus.attach(
							{
								plugin: "janus.plugin.audiobridge",
								success: function(pluginHandle) {
									mixertest = pluginHandle;
									Janus.log("Plugin attached! (" + mixertest.getPlugin() + ", id=" + mixertest.getId() + ")");
									// Prepare the username registration
								},
								error: function(error) {
									Janus.error("  -- Error attaching plugin...", error);
									alert("Error attaching plugin... " + error);
								},
								consentDialog: function(on) {
									// Check docs to see what options are for this
									console.log("ON consentDialog");
								},
								onmessage: function(msg, jsep) {
									Janus.debug(" ::: Got a message :::");
									Janus.debug(JSON.stringify(msg));
									var event = msg["audiobridge"];
									Janus.debug("Event: " + event);
									if(event != undefined && event != null) {
										if(event === "joined") {
											// Successfully joined, negotiate WebRTC now
											myid = msg["id"];
											Janus.log("Successfully joined room " + msg["room"] + " with ID " + myid);
										if(!webrtcUp) {
											webrtcUp = true;
											// Responding to the Streaming
											mixertest.createAnswer(
												{
													jsep: jsep,
													// We want recvonly audio/video
													media: { audioSend: false, videoSend: false, audio: true, video: false, data: false},	// This is an audio only room
													success: function(ourjsep) {
														Janus.debug("Got SDP!");
														Janus.debug(ourjsep);
														var body = { "request": "configure", "muted": true };
														mixertest.send({"message": body, "jsep": ourjsep});
													},
													error: function(error) {
														Janus.error("WebRTC error:", error);
														bootbox.alert("WebRTC error... " + JSON.stringify(error));
													}
												});
										}
											/*// Any room participant?
											if(msg["participants"] !== undefined && msg["participants"] !== null) {
												var list = msg["participants"];
												Janus.debug("Got a list of participants:");
												Janus.debug(list);
												for(var f in list) {
													var id = list[f]["id"];
													var display = list[f]["display"];
													var muted = list[f]["muted"];
													Janus.debug("  >> [" + id + "] " + display + " (muted=" + muted + ")");
													if($('#rp'+id).length === 0) {
														// Add to the participants list
														$('#list').append('<li id="rp'+id+'" class="list-group-item">'+display+' <i class="fa fa-microphone-slash"></i></li>');
														$('#rp'+id + ' > i').hide();
													}
													if(muted === true || muted === "true")
														$('#rp'+id + ' > i').removeClass('hide').show();
													else
														$('#rp'+id + ' > i').hide();
												}
											}*/
										} /*else if(event === "roomchanged") {
											// The user switched to a different room
											myid = msg["id"];
											Janus.log("Moved to room " + msg["room"] + ", new ID: " + myid);
											// Any room participant?
											$('#list').empty();
											if(msg["participants"] !== undefined && msg["participants"] !== null) {
												var list = msg["participants"];
												Janus.debug("Got a list of participants:");
												Janus.debug(list);
												for(var f in list) {
													var id = list[f]["id"];
													var display = list[f]["display"];
													var muted = list[f]["muted"];
													Janus.debug("  >> [" + id + "] " + display + " (muted=" + muted + ")");
													if($('#rp'+id).length === 0) {
														// Add to the participants list
														$('#list').append('<li id="rp'+id+'" class="list-group-item">'+display+' <i class="fa fa-microphone-slash"></i></li>');
														$('#rp'+id + ' > i').hide();
													}
													if(muted === true || muted === "true")
														$('#rp'+id + ' > i').removeClass('hide').show();
													else
														$('#rp'+id + ' > i').hide();
												}
											}
										}*/ else if(event === "destroyed") {
											// The room has been destroyed
											Janus.warn("The room has been destroyed!");
											alert("The room has been destroyed", function() {
												window.location.reload();
											});
										} /*else if(event === "event") {
											if(msg["participants"] !== undefined && msg["participants"] !== null) {
												var list = msg["participants"];
												Janus.debug("Got a list of participants:");
												Janus.debug(list);
												for(var f in list) {
													var id = list[f]["id"];
													var display = list[f]["display"];
													var muted = list[f]["muted"];
													Janus.debug("  >> [" + id + "] " + display + " (muted=" + muted + ")");
													if($('#rp'+id).length === 0) {
														// Add to the participants list
														$('#list').append('<li id="rp'+id+'" class="list-group-item">'+display+' <i class="fa fa-microphone-slash"></li>');
														$('#rp'+id + ' > i').hide();
													}
													if(muted === true || muted === "true")
														$('#rp'+id + ' > i').removeClass('hide').show();
													else
														$('#rp'+id + ' > i').hide();
												}
											} else if(msg["error"] !== undefined && msg["error"] !== null) {
												bootbox.alert(msg["error"]);
												return;
											}
											// Any new feed to attach to?
											if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
												// One of the participants has gone away?
												var leaving = msg["leaving"];
												Janus.log("Participant left: " + leaving + " (we have " + $('#rp'+leaving).length + " elements with ID #rp" +leaving + ")");
												$('#rp'+leaving).remove();
											}
										}*/
									}
									if(jsep !== undefined && jsep !== null) {
										Janus.debug("Handling SDP as well...");
										Janus.debug(jsep);
										mixertest.handleRemoteJsep({jsep: jsep});
									}
								},
								onlocalstream: function(stream) {
									Janus.debug(" ::: Got a local stream :::");
									Janus.debug(JSON.stringify(stream));
									// We're not going to attach the local audio stream
									/*$('#audiojoin').hide();
									$('#room').removeClass('hide').show();
									$('#participant').removeClass('hide').html(myusername).show();*/
								},
								onremotestream: function(stream) {
								    console.log("Attaching Media Audio");
									if($('#roomaudio').length === 0) {
										$('#mixedaudio').append('<audio class="rounded centered" id="roomaudio" width="100%" height="100%" autoplay/>');
									}
									attachMediaStream($('#roomaudio').get(0), stream);
								},
								oncleanup: function() {
									webrtcUp = false;
									Janus.log(" ::: Got a cleanup notification :::");
								}
							});
		        // Finish attachment Audio
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
		$('#chatroom').css('height', ($(window).height()-420)+"px"),
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
	registered = true;
	// Registering Audio
	var register_audio = { "request": "join", "room": myroom, "display": username };
	mixertest.send({"message": register_audio});
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