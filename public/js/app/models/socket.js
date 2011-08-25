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
				_.bindAll(this, 
					'askNickname', 
					'userConnected',
					'userDisconnected', 
					'setNickname', 
					'newMessage', 
					'newMessageIn', 
					'welcome',
					'newIdea',
					'newCluster',
					'moveToCluster',
					'destroyIdea',
					'destroyCluster',
					'removeIdeaFromCluster',
					'userUpdated',
					'voteReceived',
					'voteRetracted');
				this.socket.on("welcome", this.welcome);
				this.socket.on("ask nickname", this.askNickname);
				this.socket.on("user connected", this.userConnected);
				this.socket.on("user disconnected", this.userDisconnected);
				this.socket.on("user updated", this.userUpdated);
				this.socket.on("new message", this.newMessageIn);
				this.socket.on("new idea", this.newIdea);
				this.socket.on("new cluster", this.newCluster);
				this.socket.on("move to cluster", this.moveToCluster);
				this.socket.on("destroy idea", this.destroyIdea);
				this.socket.on("destroy cluster", this.destroyCluster);
				this.socket.on("remove idea from cluster", this.removeIdeaFromCluster);
				this.socket.on("vote received", this.voteReceived);
				this.socket.on("vote retracted", this.voteRetracted);
			},
			
			//downstream
			
			joinSession : function(session_id, current_user_id, step) {
				this.socket.emit('join session', session_id, current_user_id, step);
			},
			
			setNickname : function(nickname) {
				this.socket.emit('set nickname', nickname);
			},
			
			newMessage : function(message) {
				this.socket.emit('new message', message.toJSON());
			},
			
			updateUserState : function(user) {
				this.socket.emit('update user state', user.toJSON());
			},
			
			addVote : function(ideaid){
				this.socket.emit('add vote', ideaid);
			},
			
			removeVote : function(ideaid){
				this.socket.emit('remove vote', ideaid);
			},
			
			//upstream
			
			welcome : function(data) {
				if(this.callbacks['onWelcome']){
					this.callbacks.onWelcome(data);
				}
			},
			
			askNickname : function(data) {
				if(this.callbacks['onAskNickname']){
					this.callbacks.onAskNickname(data);
				}
			},
			
			userConnected : function(data) {
				if(this.callbacks['onUserConnected']){
					this.callbacks.onUserConnected(data);
				}
			},
			
			userDisconnected : function(data) {
				if(this.callbacks['onUserDisconnected']){
					this.callbacks.onUserDisconnected(data);
				}
			},
			
			newMessageIn : function(data) {
				if(this.callbacks["onNewMessageIn"]){
					this.callbacks.onNewMessageIn(data);
				}
			},
			
			newIdea : function(data) {
				if(this.callbacks["onNewIdea"]) {
					this.callbacks.onNewIdea(data);
				}
			},
			
			newCluster : function(data) {
				if(this.callbacks["onNewCluster"]) {
					this.callbacks.onNewCluster(data);
				}
			},
			
			moveToCluster : function(data) {
				if(this.callbacks["onMoveToCluster"]) {
					this.callbacks.onMoveToCluster(data);
				}
			},
			
			destroyIdea : function(data) {
				if(this.callbacks["onDestroyIdea"]) {
					this.callbacks.onDestroyIdea(data);
				}
			},
			
			destroyCluster : function(data) {
				if(this.callbacks["onDestroyCluster"]) {
					this.callbacks.onDestroyCluster(data);
				}
			},
			
			removeIdeaFromCluster : function(data) {
				if(this.callbacks["onRemoveIdeaFromCluster"]) {
					this.callbacks.onRemoveIdeaFromCluster(data);
				}
			}, 
			
			userUpdated : function(data) {
				if(this.callbacks['onUserUpdated']) {
					this.callbacks.onUserUpdated(data);
				}
			},
			
			voteReceived : function(data) {
				if(this.callbacks['onVoteReceived']) {
					this.callbacks.onVoteReceived(data);
				}
			},
			
			voteRetracted : function(data) {
				if(this.callbacks['onVoteRetracted']) {
					this.callbacks.onVoteRetracted(data);
				}
			}
		};
	};
});