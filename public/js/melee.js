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
			if(options !== undefined)
				this.url = options['url'];
			else
				this.url = '/ideas';
		}
	});
	
	window.Cluster = Backbone.Model.extend({
		initialize: function(){
			this.ideas = new IdeaList();
			this.ideas.url = _.bind(function(){
				return this.url() + '/ideas';
			}, this);
		}
	});
	
	window.ClusterList = Backbone.Collection.extend({
		model: Cluster,
		initialize: function(models, options){
			this.url = options['url'];
		}
	});
	
	//VIEW FOR CLUSTER MODEL
	window.ClusterView = Backbone.View.extend({
		className: 'cluster',
		expanded: true,
		template: _.template($('#cluster-template').html()),
		
		events : {
			"cluster:idea:add": "addIdea",
			"hideDetails": "hideIdeas",
			"click" : "toggleIdeas",
			"click .cluster-delete": "clear",
			"mouseover": "showDelete",
			"mouseout": "hideDelete"
		},
		
		initialize: function() {
			_.bindAll(this, 'render', 'remove', 'showIdeas', 'ideaAdded');
			this.model.bind('change', this.render);
			this.model.bind('destroy', this.remove);
			this.model.ideas.bind('reset', this.showIdeas);
			this.model.ideas.bind('add', this.ideaAdded);
			this.idealistview = new IdeaListView({collection : this.model.ideas});
			this.$separator = $();
		},
		
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			this.hideIdeas();
			$(this.el).find(".cluster-ideas").html(this.idealistview.render().el);
			return this;
		},
		
		showIdeas: function(){
			if(!this.expanded){
				var $siblings = $(this.el).nextAll();
				var $this_el = $(this.el);
				var $end_of_line = $this_el;
				for(var i = 0; i < $siblings.length; i++){
					//case there is no more elements ahead of this one
					var $curr = $($siblings[i]);
					if(i+1 == $siblings.length && $this_el.offset().top == $curr.offset().top){
						$end_of_line = $curr;
						break;
					}else{
						if(i+1 != $siblings.length && $($siblings[i+1]).offset().top > $this_el.offset().top){
							$end_of_line = $curr;
							break;
						}
					}
				}
				this.$separator = $('<div class="cluster-separator"/>');
				$end_of_line.after(this.$separator);
				$this_el.find(".cluster-ideas, .arrow, .arrow-border").show('blindStep', {
					step : $.proxy(function(now, fx) {
						this.$separator.height(now);
					}, this)
				});
				this.expanded = true;
			}
		},
		
		hideIdeas: function(){
			if(this.expanded){
				$(this.el).find(".cluster-ideas, .arrow, .arrow-border").hide('blindStep', {
					step : $.proxy(function(now, fx) {
						this.$separator.height(now);
					},this)
				}, $.proxy(function(){
					this.$separator.remove();
				}, this));
				this.expanded = false;
			}
		},
		
		toggleIdeas: function(){
			if(!this.expanded){
				this.model.ideas.fetch();
			} else {
				this.hideIdeas();
			}
		},
		
		addIdea: function(ev, idea){
			$(idea).trigger("cluster:idea:add", this);
		},
		
		ideaAdded: function() {
			
		},
		
		clear: function() {
			this.model.destroy();
		},
		
		showDelete: function() {
			this.$(".cluster-delete").show();
		},
		
		hideDelete: function() {
			this.$(".cluster-delete").hide();
		}
	});
	
	//VIEW FOR CLUSTER COLLECTION
	window.ClusterListView = Backbone.View.extend({
		template: _.template($('#clusterlistview-template').html()),
		
		events : {
			"click .cluster": "toggleDetails"
		},
		
		initialize: function(){
			_.bindAll(this, 'render', 'add');
			this.collection.bind('add', this.add);
			this.collection.bind('reset', this.render);
		},
		
		render: function(){			
			var $ideas, collection = this.collection;
			
			$(this.el).html(this.template());
			$clusters = $(this.el);
			collection.each(function(cluster){
				var view = new ClusterView({
					model : cluster
				});
				$clusters.append(view.render().el);
			});
			
			return this;
		},
		
		toggleDetails: function(e){
			$(e.currentTarget).siblings().trigger("hideDetails");
		},
		
		add: function(cluster) {
			var view = new ClusterView({model:cluster});
			$(this.el).append(view.render().el);
			this.trigger("cluster:add", $(view.el));
		}
	});
		
	window.IdeaView = Backbone.View.extend({
		className: 'idea',
		template: _.template($('#idea-template').html()),
		
		events : {
			"cluster:idea:add": "addToCluster",
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
		},
		
		addToCluster: function(ev, clusterView) {
			//remove an idea from the collection without triggering the remove event on the whole structure, which would cause backbone to try to destroy the model in the backend.
			this.model.collection.remove(this.model, {silent: true});
			//this will trigger a PUT in the backend.
			clusterView.model.ideas.create(this.model);
		}
	});
	
	window.IdeaListView = Backbone.View.extend({
		template: _.template($('#idealistview-template').html()),
		
		initialize: function(){
			_.bindAll(this, 'render', 'add');
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
			$(this.el).append(view.render().el);
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
				this.router.setupNavEvents(opts['session']);
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
		
		bootstrapped: false,
		
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
				this.clusterListView.bind("cluster:add", this.makeDroppable);
				this.unsortedIdeas = opts['unsortedIdeas'];
				if (!this.unsortedIdeas) {
					this.unsortedIdeas = new IdeaList([], {url : "/"+opts['session'].id+"/unsorted"});
					this.unsortedIdeas.fetch();
				}
				this.unsortedListView = new IdeaListView({
					collection: this.unsortedIdeas
				});
				this.router.setupNavEvents(opts['session']);
				this.bootstrapped = true;
			}
		},
		
		render: function() {
			$(this.clusterlist).html(this.clusterListView.render().el);
			$(this.unsortedlist).html(this.unsortedListView.render().el);
			this.makeDraggable($(this.unsortedListView.el).find('.idea'));
			this.makeDroppable($(this.clusterListView.el).find('.cluster'));
			return this;
		},
		
		makeDraggable: function(e) {
			e.draggable({revert: 'invalid'});
		},
		
		makeDroppable: function(e) {
			e.droppable({
				accept: ".idea", 
				drop: function(ev, ui) {
					ui.draggable.hide('scale', {}, $.proxy(function(){
						$(this).effect('highlight');
					}, this));
					$(this).trigger("cluster:idea:add", ui.draggable);
				}
			});
		},
		
		addCluster: function(e){
			if(e.keyCode != 13) return;
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