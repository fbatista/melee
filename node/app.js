var io = require('socket.io').listen(8000),
	redis = require('redis'),
	sessions = {},
	rc = redis.createClient(),
	pubsub = redis.createClient(),
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

pubsub.on("error", function (err) {
    console.log("Error " + err);
});

pubsub.on("connect", function() {
	pubsub.psubscribe("melee:data:*");
});

// when we get a message in one of the channels we're subscribed to
// we send it over to all connected clients
pubsub.on("pmessage", function (pattern, channel, message) {
	//console.log("Sending: " + message);
	var channel_meta = channel.split(":");
	io.sockets.in(channel_meta[2]).emit(channel_meta[3], JSON.parse(message));
});

// so now, for every client that connects to node
// though whatever transport (flash, websockets, polling)
io.sockets.on('connection', function(socket) { 
	socket.emit("welcome", {id: socket.id});
	
	socket.on('join session', function(session_id, current_user_id, step){
		socket.join(session_id);
		socket.set('sessionid', session_id);
		socket.set('currentuserid', current_user_id);
		rc.hset(current_user_id, 'step', step);
		socket.emit('ask nickname');
	});
	
 	socket.on('set nickname', function(nickname) { 
		socket.get('currentuserid', function(err, currentuserid){
			rc.hset(currentuserid, 'nickname', nickname, function(err, res){
				socket.get('sessionid', function(err, sessionid){
					var clients = io.sockets.clients(sessionid);
					for (var i = 0; i < clients.length; i++){
						var client = clients[i];
						client.get('currentuserid', function(err, eachuserid){
							rc.hgetall(eachuserid, function(err, res){
								if(res.id == currentuserid){
									socket.broadcast.to(sessionid).emit('user connected', res);
								}else {
									socket.emit('user connected', res);
								}
							});
						});
					};
				});
			});
		})
 	});

	socket.on('update user state', function(user) {
		socket.get('sessionid', function(err, sessionid){
			rc.hmset(user.id, user, function(){
				socket.broadcast.to(sessionid).emit("user updated", user);
			});
		});
	});

	socket.on('new message', function(message){
		socket.get('sessionid', function(err, sessionid){
			message.out = true;
			socket.broadcast.to(sessionid).emit('new message', message);
		});
	});
	
	socket.on('remove vote', function(idea){
		//remove vote on idea, from current user
		socket.get('sessionid', function(err, sessionid){
			rc.zincrby('session:'+sessionid+':ideas', -1, idea);
			socket.get('currentuserid', function(err, currentuserid){
				rc.srem(currentuserid + ':votes', idea);
			});
			rc.hgetall(idea, function(err, idea_json){
				rc.hgetall(idea_json.cluster, function(err, cluster_json)){
					idea_json.cluster = cluster_json;
					socket.broadcast.to(sessionid).emit("vote retracted", idea_json);
					socket.emit("vote retracted", idea_json);
				});
			});
		});
	});
	
	socket.on('add vote', function(idea){
		//add vote on idea, from current user
		socket.get('sessionid', function(err, sessionid){
			rc.zincrby('session:'+sessionid+':ideas', 1, idea);
			socket.get('currentuserid', function(err, currentuserid){
				rc.sadd(currentuserid + ':votes', idea);
			});
			rc.hgetall(idea, function(err, idea_json){
				rc.hgetall(idea_json.cluster, function(err, cluster_json)){
					idea_json.cluster = cluster_json;
					socket.broadcast.to(sessionid).emit("vote received", idea_json);
					socket.emit("vote received", idea_json);
				});
			});
		});
	});

 	socket.on('disconnect', function() {
		socket.get('sessionid', function(err, sessionid){
			socket.get('currentuserid', function(err, currentuserid){
				rc.hgetall(currentuserid, function(err, res) {
					socket.broadcast.to(sessionid).emit("user disconnected", res);
				});
			});
		});
 	});
});
