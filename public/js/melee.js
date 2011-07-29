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
		
		events: {
			"click #new-session" : "start"
		},
		
		initialize : function() {
			_.bindAll(this, "start", "render");
			this.template = _.template($('#startsession-template').html());
			$(this.el).html(this.template());
			this.startButton = this.$('#new-session');
			this.model = window['session'] || new Session();
			this.model.bind("change", this.model.proceed);
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
		}
	});
	
	window.IdeateView = Backbone.View.extend({
		id: 'ideate',
		
		events: {
			"keypress #new-idea": "addIdea"
		},

		initialize: function() {
			_.bindAll(this, 'addIdea', 'render');
			this.template = _.template($('#ideateview-template').html());
			$(this.el).html(this.template());
			this.input = this.$('#new-idea');
			this.idealist = this.$('#idealist');
			
			if(!window['ideas']){
				window.ideas = new IdeaList([], {url : "/"+session.id+"/ideas"});
				window.ideas.fetch();
			}
			this.ideaListView = new IdeaListView({
				collection: ideas
			});
		},
		
		render: function() {
			// display ideas			
			$(this.idealist).html(this.ideaListView.render().el);
			return this;
		},
		
		addIdea: function(e) {
			if(e.keyCode != 13) return;
			ideas.create({title: this.input.val()});
			this.input.val('');
		},
		
		proceed: function() {
			melee.navigate(this.id+"/cluster", true);
		}
	});
	
	window.ClusterView = Backbone.View.extend({
		id: 'cluster',
		
		events: {
			'keypress #new-cluster': 'addCluster'
		},
		
		initialize: function() {
			_.bindAll(this, 'addCluster', 'render');
			this.template = _.template($('#clusterview-template').html());
			$(this.el).html(this.template());
			this.input = this.$('#new-cluster');
			this.clusterlist = this.$('#clusterlist');
			this.clusterListView = new ClusterListView({
				collection: clusters
			});
			this.unsortedlist = this.$('#unsortedlist');
			this.unsortedListView = new IdeaListView({
				collection: unsortedIdeas
			});
		},
		
		render: function() {
			$(this.unsortedlist).html(this.unsortedListView.render().el);
			return this;
		},
		
		addCluster: function(e){
			if(e.keyCode != 12) return;
			clusters.create({title: this.input.val()});
			this.input.val('');
		},
		
		proceed: function() {
			melee.navigate(this.id+"/prioritize", true);
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
		
		initialize: function() {
			this.container = $('#melee');
			this.sessionView = new SessionView();
		},
		
		home: function() {
			$('nav').hide();
			this.container.append(this.sessionView.render().el);
		},
		
		ideate: function(id) {
			$('nav').show();
			this.ideateView = new IdeateView();
			this.container.append(this.ideateView.render().el);
		},
		
		cluster: function(id) {
			this.clusterView = new ClusterView();
			this.container.append(this.clusterView.render().el);
		},
		
		prioritize: function(id) {
			this.prioritizeView = new PrioritizeView();
			this.container.append(this.prioritizeView.render().el);
		},
		
		exportit: function(id) {
			this.exportView = new ExportView();
			this.container.append(this.exportView.render().el);
		}
	});
});