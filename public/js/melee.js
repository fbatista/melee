$(function() {
	
	window.Session = Backbone.Model.extend({
		url : '/',
		
		proceed : function() {
			window.session = this;
			melee.navigate(this.id+"/ideate", true);
		}
	});
	
	window.Idea = Backbone.Model.extend({
	});
	
	window.IdeaList = Backbone.Collection.extend({
		model: Idea,
		initialize: function(models, options){
			this.url = options['url'];
		}
	});
	
	window.Cluster = Backbone.Model.extend({
	});
	
	window.ClusterList = Backbone.Collection.extend({
		model: Cluster,
		initialize: function(models, options){
			this.url = options['url'];
		}
	});
	
	//VIEW FOR CLUSTER MODEL
	window.ClusterView = Backbone.View.extend({
		
	});
	
	//VIEW FOR CLUSTER COLLECTION
	window.ClusterListView = Backbone.View.extend({
		
	});
		
	window.IdeaView = Backbone.View.extend({
		className: 'idea',
		template: _.template($('#idea-template').html()),
		
		events : {
			"click .idea-delete": "clear",
			"mouseover": "showDelete",
			"mouseout": "hideDelete"
		},
		
		initialize: function() {
			_.bindAll(this, 'render', 'remove');
			this.model.bind('change', this.render);
			this.model.bind('destroy', this.remove);
		},
		
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},
		
		clear: function() {
			this.model.destroy();
		},
		
		showDelete: function() {
			this.$(".idea-delete").show();
		},
		
		hideDelete: function() {
			this.$(".idea-delete").hide();
		}
	});
	
	window.IdeaListView = Backbone.View.extend({
		template: _.template($('#idealistview-template').html()),
		
		initialize: function(){
			_.bindAll(this, 'render');
			this.collection.bind('add', this.add);
			this.collection.bind('reset', this.render);
		},
		
		render: function(){			
			var $ideas, collection = this.collection;
			
			$(this.el).html(this.template());
			$ideas = $(this.el);
			collection.each(function(idea){
				var view = new IdeaView({
					model : idea
				});
				$ideas.append(view.render().el);
			});
			
			return this;
		},
		
		add: function(idea) {
			var view = new IdeaView({model:idea});
			$('#idealist').append(view.render().el);
		}
	});
	
	/* Main views (ideate, group, prioritize, export) */
	window.SessionView = Backbone.View.extend({
		id: 'session',
		
		bootstrapped: false,
		
		events: {
			"click #new-session" : "start"
		},
		
		initialize : function() {
			_.bindAll(this, "start", "render");
			this.template = _.template($('#startsession-template').html());
			$(this.el).html(this.template());
			this.startButton = this.$('#new-session');
		},
		
		bootstrap : function(opts) {
			if(!this.bootstrapped){
				this.router = opts.router;
				this.model = opts['session'] || new Session();
				this.model.bind("change", this.model.proceed);
				this.bootstrapped = true;
			}
		},
		
		render : function() {
			return this;
		},
		
		start : function() {
			//todo fetch a session ID from server
			if(this.model.isNew()){
				this.model.save();
			}else{
				this.model.proceed();
			}
			this.remove();
			this.router.sessionStarted(this.model);
		}
	});
	
	window.IdeateView = Backbone.View.extend({
		id: 'ideate',
		
		bootstrapped: false,
		
		events: {
			"keypress #new-idea": "addIdea"
		},

		initialize: function() {
			_.bindAll(this, 'addIdea', 'render');
			this.template = _.template($('#ideateview-template').html());
			$(this.el).html(this.template());
			this.input = this.$('#new-idea');
			this.idealist = this.$('#idealist');
		},
		
		bootstrap : function(opts) {
			if(!this.bootstrapped){
				this.router = opts.router;
				this.ideas = opts['ideas'];
				if (!this.ideas) {
					this.ideas = new IdeaList([], {url : "/"+opts['session'].id+"/ideas"});
					this.ideas.fetch();
				}
				this.ideaListView = new IdeaListView({
					collection: this.ideas
				});
				this.bootstrapped = true;
			}
		},
		
		render: function() {
			// display ideas			
			$(this.idealist).html(this.ideaListView.render().el);
			return this;
		},
		
		addIdea: function(e) {
			if(e.keyCode != 13) return;
			this.ideas.create({title: this.input.val()});
			this.input.val('');
		},
		
		proceed: function() {
			this.router.navigate(this.id+"/cluster", true);
		}
	});
	
	//VIEW FOR CLUSTER ROUTE STEP
	window.ClusterateView = Backbone.View.extend({
		id: 'cluster',
		
		events: {
			'keypress #new-cluster': 'addCluster'
		},
		
		initialize: function() {
			_.bindAll(this, 'addCluster', 'render');
			this.template = _.template($('#clusterateview-template').html());
			$(this.el).html(this.template());
			this.input = this.$('#new-cluster');
			this.clusterlist = this.$('#clusterlist');
			this.unsortedlist = this.$('#unsortedlist');
		},
		
		bootstrap: function(opts) {
			if(!this.bootstrapped){
				this.router = opts.router;
				this.clusters = opts['clusters'];
				if (!this.clusters) {
					this.clusters = new ClusterList([], {url : "/"+opts['session'].id+"/clusters"});
					this.clusters.fetch();
				}
				this.clusterListView = new ClusterListView({
					collection: this.clusters
				});
				
				this.unsortedIdeas = opts['unsortedIdeas'];
				if (!this.unsortedIdeas) {
					this.unsortedIdeas = new IdeaList([], {url : "/"+opts['session'].id+"/unsorted"});
					this.unsortedIdeas.fetch();
				}
				this.unsortedListView = new IdeaListView({
					collection: this.unsortedIdeas
				});
				this.bootstrapped = true;
			}
		},
		
		render: function() {
			$(this.unsortedlist).html(this.unsortedListView.render().el);
			return this;
		},
		
		addCluster: function(e){
			if(e.keyCode != 12) return;
			this.clusters.create({title: this.input.val()});
			this.input.val('');
		},
		
		proceed: function() {
			this.router.navigate(this.id+"/prioritize", true);
		}
	});
	
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
		},
		
		home: function() {
			$('nav').hide();
			this.sessionView.bootstrap(this.opts);
			this.container.append(this.sessionView.render().el);
		},
		
		ideate: function(id) {
			this.highlightNav('ideate');
			this.ideateView.bootstrap(this.opts);
			this.container.append(this.ideateView.render().el);
		},
		
		cluster: function(id) {
			this.highlightNav('cluster');
			this.clusterateView.bootstrap(this.opts);
			this.container.append(this.clusterateView.render().el);
		},
		
		prioritize: function(id) {
			this.highlightNav('prioritize');
			this.prioritizeView.bootstrap(this.opts);
			this.container.append(this.prioritizeView.render().el);
		},
		
		exportit: function(id) {
			this.highlightNav('export');
			this.exportView.bootstrap(this.opts);
			this.container.append(this.exportView.render().el);
		},
		
		highlightNav : function(view) {
			$('nav').show();
			$('nav a#menu_'+view).addClass('current');
			$('nav a:not(#menu_'+view+')').removeClass('current');
		}
	});
});