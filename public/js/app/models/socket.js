$(function(){
	window.SocketHandler = function(opts, callbacks) {
		/*
			opts = {
				socket_url : "http://192.168.2.137:8000",
				session : <#Session < Backbone.Model#>,
				
			}
		*/
		
		return {
			connect : function() {
				this.callbacks = callbacks;
				this.socket = io.connect(opts.socket_url);
				_.bindAll(this, 'askNickname', 'sessionStarted', 'userConnected', 'setNickname', 'newMessage', 'newMessageIn');
				this.socket.on("ask nickname", this.askNickname);
				this.socket.on("session started", this.sessionStarted);
				this.socket.on("user connected", this.userConnected);
				this.socket.on("new message", this.newMessageIn)
			},
			
			//downstream
			
			joinSession : function(sessionid, step) {
				console.log("write: join session");
				this.socket.emit('join session', sessionid, step);
			},
			
			setNickname : function(nickname) {
				console.log("write: set nickname");
				this.socket.emit('set nickname', nickname);
			},
			
			newMessage : function(message) {
				console.log("write: new message");
				this.socket.emit('new message', message.toJSON());
			},
			
			//upstream
			
			askNickname : function(data) {
				console.log("read: ask nickname");
				if(this.callbacks['onAskNickname']){
					this.callbacks.onAskNickname(data);
				}
			},
			
			sessionStarted : function(data) {
				console.log("read: session started");
				if(this.callbacks['onSessionStarted']){
					this.callbacks.onSessionStarted(data);
				}
			},
			
			userConnected : function(data) {
				console.log("read: user connected");
				if(this.callbacks['onUserConnected']){
					this.callbacks.onUserConnected(data);
				}
			},
			
			newMessageIn : function(data) {
				console.log("read: new message");
				if(this.callbacks["onNewMessageIn"]){
					this.callbacks.onNewMessageIn(data);
				}
			}
		};
	};
});