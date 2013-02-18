$(function(){
	/* App Router */
	
	window.Melee = Backbone.Router.extend({
		
		routes: {
			"": "home",
			":id": "ideate",
			":id/ideate": "ideate",
			":id/cluster" : "cluster",
			":id/prioritize" : "prioritize",
			":id/export" : "exportit"
		},
		
		initialize: function(opts) {
			_.bindAll(this, 'updateCurrentUserState');
			this.opts = opts || {};
			this.opts.router = this;
			this.chat_container = $('#chat');
			this.notification_badge = $('#notification_badge');
			this.container = $('#melee');
			this.chatView = new ChatView();
			this.sessionView = new SessionView();
			this.ideateView = new IdeateView();
			this.clusterateView = new ClusterateView();
			this.prioritizeView = new PrioritizeView();
			this.exportView = new ExportView();
		},
		
	 	sessionStarted: function(session, userSuccessCallback) {
			if(!this['current_user']){
				this.current_user = new User();
				if (this.opts.votes) {
					this.current_user.votes = this.opts.votes;	
				} else {
					this.current_user.votes = new VoteList([], {url : '/'+session.id+'/user/ideas'});
					this.current_user.votes.fetch();
				}
				this.current_user.url = '/'+session.id+'/user';
				this.current_user.sync = Backbone.sync;
				this.current_user.bind('change', this.updateCurrentUserState);
				this.current_user.fetch({silent: true, success : $.proxy(function(){
					if(!this['socket']){
						this.initSocket(session, this.current_user);
					}
					userSuccessCallback();
				}, this)});
				this.opts.session = session;
				this.setupNavEvents(session);
			} else {
				userSuccessCallback();
			}
		},
		
		updateCurrentUserState : function() {
			this.socket.updateUserState(this.current_user);
		},
		
		initSocket : function(session, user) {
			this.socket = new SocketHandler(this.opts, {
				onWelcome : session.setUserId,
				onAskNickname : this.chatView.askNickname,
				onSessionStarted : this.chatView.sessionStarted,
				onUserConnected : this.chatView.addUser,
				onUserDisconnected : this.chatView.removeUser,
				onUserUpdated : this.chatView.updateUser,
				onNewMessageIn : this.chatView.addMessage,
				onNewCluster : $.proxy(function(cluster) {
					this.clusterateView.onNewCluster(cluster);
					this.prioritizeView.onNewCluster(cluster);
				}, this),
				onMoveToCluster : $.proxy(function(idea) {
					this.clusterateView.onMoveToCluster(idea);
					this.prioritizeView.onMoveToCluster(idea);
				}, this),
				onDestroyIdea : $.proxy(function(idea) {
					this.ideateView.onDestroyIdea(idea);
					this.clusterateView.onDestroyIdea(idea);
					this.prioritizeView.onDestroyIdea(idea);
				}, this),
				onDestroyCluster : $.proxy(function(cluster) {
					this.clusterateView.onDestroyCluster(cluster);
					this.prioritizeView.onDestroyCluster(cluster);
				}, this),
				onRemoveIdeaFromCluster : $.proxy(function(idea) {
					this.clusterateView.onRemoveIdeaFromCluster(idea);
					this.prioritizeView.onRemoveIdeaFromCluster(idea);
				}, this),
				onNewIdea : $.proxy(function(idea) {
					this.ideateView.onNewIdea(idea);
					this.clusterateView.onNewIdea(idea);
				}, this),
				onVoteReceived : this.exportView.onVoteReceived,
				onVoteRetracted : $.proxy(function(idea) {
					this.exportView.onVoteRetracted(idea);
					this.prioritizeView.onVoteRetracted(idea);
				}, this)
			});

			this.chatView.bind('chat:changenick', $.proxy(this.socket.setNickname, this.socket));
			this.chatView.bind('chat:newmessage', $.proxy(this.socket.newMessage, this.socket));
			this.socket.connect();
			this.socket.joinSession(session.id, user.id, this.currentStep);
		},
		
		home: function() {
			$('nav').css({marginLeft: -130});
			this.sessionView.bootstrap(this.opts);
			$content = $('#home');
			if($content.size()){
				$content.siblings().hide();
				$content.show();
			}else{
				this.container.children().hide();
				this.container.append(this.sessionView.render().el);
			}
		},
		
		ideate: function(id) {
			this.highlightNav('ideate');
			this.ideateView.bootstrap(this.opts);
			this.chatView.bootstrap(this.opts);
			$content = $('#ideate');
			if($content.size()){
				$content.siblings().hide();
				$content.show();
			}else{
				this.container.children().hide();
				this.container.append(this.ideateView.render().el);
			}
		},
		
		cluster: function(id) {
			this.highlightNav('cluster');
			this.clusterateView.bootstrap(this.opts);
			this.chatView.bootstrap(this.opts);
			$content = $('#cluster');
			if($content.size()){
				$content.siblings().hide();
				$content.show();
			}else{
				this.container.children().hide();
				this.container.append(this.clusterateView.render().el);
			}
		},
		
		prioritize: function(id) {
			this.highlightNav('prioritize');
			this.prioritizeView.bootstrap(this.opts);
			this.chatView.bootstrap(this.opts);
			$content = $('#prioritize');
			if($content.size()){
				$content.siblings().hide();
				$content.show();
			}else{
				this.container.children().hide();
				this.container.append(this.prioritizeView.render().el);
			}
		},
		
		exportit: function(id) {
			this.highlightNav('export');
			this.exportView.bootstrap(this.opts);
			this.chatView.bootstrap(this.opts);
			$content = $('#export');
			if($content.size()){
				$content.siblings().hide();
				$content.show();
			}else{
				this.container.children().hide();
				this.container.append(this.exportView.render().el);
			}
		},
		
		setupNavEvents : function(session) {
			$('#menu_ideate').click($.proxy(function(){
				this.navigate(session.id+"/ideate", true);
			}, this));
			$('#menu_cluster').click($.proxy(function(){
				this.navigate(session.id+"/cluster", true);
			}, this));
			$('#menu_prioritize').click($.proxy(function(){
				this.navigate(session.id+"/prioritize", true);
			}, this));
			$('#menu_export').click($.proxy(function(){
				this.navigate(session.id+"/export", true);
			}, this));
			$('#menu_collaborate').click($.proxy(this.toggleChat, this));
		},
		
		toggleChat : function() {
			var $chat_container = this.chat_container;
			if($chat_container.css('marginLeft') === "130px") {
				//hide
				$chat_container.animate({marginLeft : -130}, {easing: 'easeInOutQuart', complete: function(){
					$chat_container.css('marginLeft',-260);
				}});
				this.container.animate({marginLeft : 130}, {easing: 'easeInOutQuart'});
				this.chat_open = false;
			} else {
				//show
				$chat_container.animate({marginLeft : 130}, {easing: 'easeInOutQuart'});
				this.container.animate({marginLeft : 390}, {easing: 'easeInOutQuart'});
				this.chat_open = true;
				this.notification_badge.hide();
				this.notification_badge.text('0');
			}
		},
		
		highlightNav : function(view) {
			this.currentStep = view;
			$('nav').animate({marginLeft : 0},{easing : "easeInOutQuart"});
			this.container.animate({marginLeft : (this.chat_open ? 390 : 130)}, {easing : "easeInOutQuart"});
			$('nav span#menu_'+view).addClass('current');
			$('nav span:not(#menu_'+view+')').removeClass('current');
		}
	});
});