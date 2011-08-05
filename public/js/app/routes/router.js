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
			this.container = $('#melee');
			this.sessionView = new SessionView();
			this.ideateView = new IdeateView();
			this.clusterateView = new ClusterateView();
			//this.prioritizeView = new PrioritizeView();
			//this.exportView = new ExportView();
		},
		
	 	sessionStarted: function(session) {
			this.opts.session = session;
			this.setupNavEvents(session);
		},
		
		home: function() {
			$('nav').hide();
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
		},
		
		highlightNav : function(view) {
			$('nav').show();
			$('nav span#menu_'+view).addClass('current');
			$('nav span:not(#menu_'+view+')').removeClass('current');
		}
	});
});