
	var io = require('socket.io').listen(8000),
		redis = require('redis'),
		sessions = {},
		rc = redis.createClient(),
		rebind = function(fun, newthis){
			return function() {
				return fun.apply(newthis, arguments);
			};
		};

	io.configure('production', function(){
		io.enable('browser client minification');
		io.enable('browser client etag');
		io.set('log level', 1);

		io.set('transports', [
		  'websocket'
		, 'flashsocket'
		, 'htmlfile'
		, 'xhr-polling'
		, 'jsonp-polling'
		]);
	});
	
	io.configure('development', function(){
	  io.set('transports', ['websocket']);
	});
	
	rc.on("error", function (err) {
	    console.log("Error " + err);
	});
	
	rc.on("connect", function() {
		rc.subscribe("melee:data");
	});
	
	// when we get a message in one of the channels we're subscribed to
	// we send it over to all connected clients
	rc.on("message", function (channel, message) {
		//console.log("Sending: " + message);
		io.sockets.to().emit('message', message);
	});

	// so now, for every client that connects to node
	// though whatever transport (flash, websockets, polling)
	io.sockets.on('connection', function(socket) { 
		console.log("new client connected!");
		socket.on('join session', function(sessionid, step){
			socket.join(sessionid);
			socket.set('sessionid', sessionid, function(){
				socket.set('step', step);
				socket.emit('ask nickname');
			});
		});
		
	 	socket.on('set nickname', function(nickname) { 
	 		socket.set('nickname', nickname, function(){
				socket.get('sessionid', function(err, sessionid){
					var usernicks = io.sockets.clients(sessionid).map(function(client){
						return {
							id: client.id,
							nickname : client.store.data['nickname'] || null,
							step : client.store.data['step'] || null,
							votes : client.store.data['votes'] || null
						};
					});
					console.log("sending nicks of connected users in the room to the new user");
					socket.emit('session started', usernicks);
					
					console.log('broadcasting to '+sessionid+' that '+nickname+' has joined')
					socket.get('step', function(err, step){
						socket.get('votes', function(err, votes){
							socket.broadcast.to(sessionid).emit('user connected', {
								id : socket.id,
								nickname : nickname,
								step : step,
								votes : votes || null
							});
						});
					});
				});
			});
	 	});
	
		socket.on('new message', function(message){
			socket.get('sessionid', function(err, sessionid){
				message.out = true;
				socket.broadcast.to(sessionid).emit('new message', message);
			});
		});

	 	socket.on('disconnect', function() {
	 		// nothin'
			socket.get('sessionid', function(err, sessionid){
				socket.get('nickname', function(err, nickname){
					socket.broadcast.to(sessionid).emit("user disconnected", {
						id : socket.id,
						nickname : nickname,
						step : step,
						votes : votes || null
					});
				});
			});
	 	});
	});
