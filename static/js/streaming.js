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
let myid = randomString(12);
var participants = {}
var transactions = {}

// Audio
var mixertest = null;
var webrtcUp = false;
var audioenabled = false;
var room = null;

//Screen share
var screentest = null;
var role = null;
var capture = null;

var videoroom = 123;
var source = null;

var spinner = null;

var role = null;

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

function switchToHttps() {
	window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
	return false;
}

function preShareScreen() {
	// Make sure HTTPS is being used
	if(window.location.protocol !== 'https:') {
		bootbox.alert('Sharing your screen only works on HTTPS: click <b><a href="#" onclick="return switchToHttps();">here</a></b> to try the https:// version of this page');
		return;
	}
	if(!Janus.isExtensionEnabled()) {
		bootbox.alert("You're using a recent version of Chrome but don't have the screensharing extension installed: click <b><a href='https://chrome.google.com/webstore/detail/janus-webrtc-screensharin/hapfgfdkleiggjjpfpenajgdnfckjpaj' target='_blank'>here</a></b> to do so", function() {
			window.location.reload();
		});
		return;
	}
	capture = "screen";
	if(navigator.mozGetUserMedia) {
		// Firefox needs a different constraint for screen and window sharing
		bootbox.dialog({
			title: "Share whole screen or a window?",
			message: "Firefox handles screensharing in a different way: are you going to share the whole screen, or would you rather pick a single window/application to share instead?",
			buttons: {
				screen: {
					label: "Share screen",
					className: "btn-primary",
					callback: function() {
						capture = "screen";
						shareScreen();
					}
				},
				window: {
					label: "Pick a window",
					className: "btn-success",
					callback: function() {
						capture = "window";
						shareScreen();
					}
				}
			},
			onEscape: function() {
				console.log("On Escape function...")
			}
		});
	} else {
		shareScreen();
	}
}

function shareScreen() {
	// Create a new room
	var create = { "request": "create", "description": "Desc...", "bitrate": 0, "publishers": 1, "room": videoroom };
	screentest.send({"message": create, success: function(result) {
		var event = result["videoroom"];
		Janus.debug("Event: " + event);
		if(event != undefined && event != null) {
			// Our own screen sharing session has been created, join it
			//videoroom = result["room"];
			Janus.log("Screen sharing session created: " + videoroom);
			var register = { "request": "join", "room": videoroom, "ptype": role, "display": 'admin' };
			screentest.send({"message": register});
		}
	}});
}

function registerUsername() {
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
		$('#init').attr('disabled', true).unbind('click');
		$('#init').hide();
		$('#chatroom').css('height', ($(window).height()-540)+"px"),
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
	var register_audio = { "request": "join", "room": myroom, "display": myid };
	mixertest.send({"message": register_audio});
	
	// Register Video
	if ($('#init').attr("admin") == 'true') {
		preShareScreen();
	} else {
		registervideo = { "request": "join", "room": videoroom, "ptype": "publisher", "display": myid };
		screentest.send({"message": registervideo})
	}
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

function newRemoteFeed(id, display) {
	// A new feed has been published, create a new plugin handle and attach to it as a listener
	source = id;
	var remoteFeed = null;
	janus.attach(
		{
			plugin: "janus.plugin.videoroom",
			success: function(pluginHandle) {
				remoteFeed = pluginHandle;
				Janus.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
				Janus.log("  -- This is a subscriber");
				// We wait for the plugin to send us an offer
				var listen = { "request": "join", "room": videoroom, "ptype": "listener", "feed": id };
				remoteFeed.send({"message": listen});
			},
			error: function(error) {
				Janus.error("  -- Error attaching plugin...", error);
				bootbox.alert("Error attaching plugin... " + error);
			},
			onmessage: function(msg, jsep) {
				Janus.debug(" ::: Got a message (listener) :::");
				Janus.debug(JSON.stringify(msg));
				var event = msg["videoroom"];
				Janus.debug("Event: " + event);
				if(event != undefined && event != null) {
					if(event === "attached") {
						// Subscriber created and attached
						if(spinner === undefined || spinner === null) {
							var target = document.getElementById('#screencapture');
							spinner = new Spinner({top:100}).spin(target);
						} else {
							spinner.spin();
						}
						Janus.log("Successfully attached to feed " + id + " (" + display + ") in room " + msg["room"]);
					} else {
						// What has just happened?
					}
				}
				if(jsep !== undefined && jsep !== null) {
					Janus.debug("Handling SDP as well...");
					Janus.debug(jsep);
					// Answer and attach
					remoteFeed.createAnswer(
						{
							jsep: jsep,
							media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
							success: function(jsep) {
								Janus.debug("Got SDP!");
								Janus.debug(jsep);
								var body = { "request": "start", "room": videoroom };
								remoteFeed.send({"message": body, "jsep": jsep});
							},
							error: function(error) {
								Janus.error("WebRTC error:", error);
								bootbox.alert("WebRTC error... " + error);
							}
						});
				}
			},
			onlocalstream: function(stream) {
				// The subscriber stream is recvonly, we don't expect anything here
			},
			onremotestream: function(stream) {
				if($('#screenvideo').length === 0) {
					// No remote video yet
					$('#screencapture').append('<video class="rounded centered" id="waitingvideo" width="100%" height="100%" />');
					$('#screencapture').append('<video class="rounded centered hide" id="screenvideo" width="100%" height="100%" autoplay muted="unmuted"/>');
				}
				// Show the video, hide the spinner and show the resolution when we get a playing event
				$("#screenvideo").bind("playing", function () {
					$('#waitingvideo').remove();
					$('#screenvideo').removeClass('hide');
					if(spinner !== null && spinner !== undefined)
						spinner.stop();
					spinner = null;
				});
				attachMediaStream($('#screenvideo').get(0), stream);
			},
			oncleanup: function() {
				Janus.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
				$('#waitingvideo').remove();
				if(spinner !== null && spinner !== undefined)
					spinner.stop();
				spinner = null;
			}
		});
}

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
										
										if(!webrtcUp && $('#init').attr("admin") != 'true') {
											webrtcUp = true;
											// Publish our stream as client
											mixertest.createOffer(
												{
													media: { audioSend: false, videoSend: false, audio: true, video: false, data: false },	// This is an audio only room
													success: function(jsep) {
														Janus.debug("Got SDP!");
														Janus.debug(jsep);
														var publish = { "request": "configure", "muted": false };
														mixertest.send({"message": publish, "jsep": jsep});
													},
													error: function(error) {
														Janus.error("WebRTC error:", error);
														alert("WebRTC error... " + JSON.stringify(error));
													}
												});
										}
									/*
									if(!webrtcUp) {
										webrtcUp = true;
										// Responding to the Streaming audio offer
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
											}
										);
									}*/
									else if(!webrtcUp && $('#init').attr("admin") == 'true') {
										webrtcUp = true;
										// Publish our stream as admin
										mixertest.createOffer(
											{
												media: { video: false},	// This is an audio only room
												success: function(jsep) {
													Janus.debug("Got SDP!");
													Janus.debug(jsep);
													var publish = { "request": "configure", "muted": false };
													mixertest.send({"message": publish, "jsep": jsep});
												},
												error: function(error) {
													Janus.error("WebRTC error:", error);
													alert("WebRTC error... " + JSON.stringify(error));
												}
											});
									}
								}else if(event === "destroyed") {
									// The room has been destroyed
									Janus.warn("The room has been destroyed!");
									alert("The room has been destroyed", function() {
										window.location.reload();
									});
								}
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
							if ($('#init').attr("admin") == 'true') {
								// Mute button
								audioenabled = true;
								$('#toggleaudio').click(
									function() {
										audioenabled = !audioenabled;
										if(audioenabled) {
											$('#toggleaudio').removeClass("btn-success").addClass("btn-danger");
											$('#toggleaudio').html('<span id ="iconaudio" class="glyphicon glyphicon-volume-off" aria-hidden="true"></span>');
											$('#toggleaudio').attr("title", "Deshabilitar Micrófono");
										} else {
											$('#toggleaudio').removeClass("btn-danger").addClass("btn-success");
											$('#toggleaudio').html('<span id ="iconaudio" class="glyphicon glyphicon-volume-up" aria-hidden="true"></span>');
											$('#toggleaudio').attr("title", "Habilitar Micrófono");
										}
										mixertest.send({message: { "request": "configure", "muted": !audioenabled }});
									}).removeClass('hide').show();
								}
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
		        // Screanshare attachment
				janus.attach(
							{
								plugin: "janus.plugin.videoroom",
								success: function(pluginHandle) {
									screentest = pluginHandle;
									Janus.log("Plugin attached! (" + screentest.getPlugin() + ", id=" + screentest.getId() + ")");
									// Prepare the username registration
									if ($('#init').attr("admin") == 'true') {
										role = "publisher";
									} else {
										role = "listener";
									}
								},
								error: function(error) {
									Janus.error("  -- Error attaching plugin...", error);
									alert("Error attaching plugin... " + error);
								},
								consentDialog: function(on) {
									Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
								},
								webrtcState: function(on) {
									Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
									alert("Your screen sharing session just started: pass the <b>" + videoroom + "</b> session identifier to those who want to attend.");
								},
								onmessage: function(msg, jsep) {
									Janus.debug(" ::: Got a message (publisher) :::");
									Janus.debug(JSON.stringify(msg));
									var event = msg["videoroom"];
									Janus.debug("Event: " + event);
									if(event != undefined && event != null) {
										if(event === "joined") {
											myid = msg["id"];
											Janus.log("Successfully joined video room " + msg["room"] + " with ID " + myid);
											if(role === "publisher") {
												// This is our session, publish our stream
												Janus.debug("Negotiating WebRTC stream for our screen (capture " + capture + ")");
												screentest.createOffer(
													{
														media: { video: capture, audio: false, videoRecv: false},	// Screen sharing doesn't work with audio, and Publishers are sendonly
														success: function(jsep) {
															Janus.debug("Got publisher SDP!");
															Janus.debug(jsep);
															var publish = { "request": "configure", "audio": false, "video": true };
															screentest.send({"message": publish, "jsep": jsep});
														},
														error: function(error) {
															Janus.error("WebRTC error:", error);
															alert("WebRTC error... " + JSON.stringify(error));
														}
													});
											} else {
												// We're just watching a session, any feed to attach to?
												console.log('In listener else');
												if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
													var list = msg["publishers"];
													Janus.debug("Got a list of available publishers/feeds:");
													Janus.debug(list);
													for(var f in list) {
														var id = list[f]["id"];
														var display = list[f]["display"];
														Janus.debug("  >> [" + id + "] " + display);
														newRemoteFeed(id, display)
													}
												}
											}
										} else if(event === "event") {
											// Any feed to attach to?
											if(role === "listener" && msg["publishers"] !== undefined && msg["publishers"] !== null) {
												var list = msg["publishers"];
												Janus.debug("Got a list of available publishers/feeds:");
												Janus.debug(list);
												for(var f in list) {
													var id = list[f]["id"];
													var display = list[f]["display"];
													Janus.debug("  >> [" + id + "] " + display);
													newRemoteFeed(id, display)
												}
											} else if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
												// One of the publishers has gone away?
												var leaving = msg["leaving"];
												Janus.log("Publisher left: " + leaving);
												if(role === "listener" && msg["leaving"] === source) {
													alert("The screen sharing session is over, the publisher left", function() {
														window.location.reload();
													});
												}
											} else if(msg["error"] !== undefined && msg["error"] !== null) {
												bootbox.alert(msg["error"]);
											}
										}
									}
									if(jsep !== undefined && jsep !== null) {
										Janus.debug("Handling SDP as well...");
										Janus.debug(jsep);
										screentest.handleRemoteJsep({jsep: jsep});
									}
								},
								onlocalstream: function(stream) {
									Janus.debug(" ::: Got a local stream :::");
									Janus.debug(JSON.stringify(stream));
									if($('#screenvideo').length === 0) {
										$('#screencapture').append('<video class="rounded centered" id="screenvideo" width="100%" height="100%" autoplay muted="unmuted"/>');
									}
									attachMediaStream($('#screenvideo').get(0), stream);
									// Fix this
									/*$("#screencapture").parent().block({
										message: '<b>Publishing...</b>',
										css: {
											border: 'none',
											backgroundColor: 'transparent',
											color: 'white'
										}
									});*/
								},
								onremotestream: function(stream) {
									// The publisher stream is sendonly, we don't expect anything here
								},
								oncleanup: function() {
									Janus.log(" ::: Got a cleanup notification :::");
									$('#screencapture').empty();
									$("#screencapture").parent().unblock();
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