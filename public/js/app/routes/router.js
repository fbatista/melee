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
			this.opts = opts || {};
			this.opts.router = this;
			this.chat_container = $('#chat');
			this.container = $('#melee');
			this.chatView = new ChatView();
			this.sessionView = new SessionView();
			this.ideateView = new IdeateView();
			this.clusterateView = new ClusterateView();
			//this.prioritizeView = new PrioritizeView();
			//this.exportView = new ExportView();
		},
		
	 	sessionStarted: function(session) {
			if(!this['socket']){
				this.initSocket(session);
			}
			this.opts.session = session;
			this.setupNavEvents(session);
		},
		
		initSocket : function(session) {
			this.socket = new SocketHandler(this.opts, {
				onAskNickname : this.chatView.askNickname,
				onSessionStarted : this.chatView.sessionStarted,
				onUserConnected : this.chatView.addUser,
				onNewMessageIn : this.chatView.addMessage
			});

			this.chatView.bind('chat:changenick', $.proxy(this.socket.setNickname, this.socket));
			this.chatView.bind('chat:newmessage', $.proxy(this.socket.newMessage, this.socket));
			this.socket.connect();
			this.socket.joinSession(session.id, this.currentStep);
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