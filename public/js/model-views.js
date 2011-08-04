$(function(){
	
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
		
		clear: function(ev) {
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
	
	
	//VIEW FOR CLUSTER MODEL
	window.ClusterView = Backbone.View.extend({
		className: 'cluster',
		expanded: true,
		template: _.template($('#cluster-template').html()),
		
		events : {
			"cluster:idea:add": "addIdea",
			"hideDetails": "hideIdeas",
			"click .title" : "toggleIdeas",
			"click .counter": "clear",
			"mouseover .counter": "showDelete",
			"mouseout .counter": "hideDelete"
		},
		
		initialize: function() {
			_.bindAll(this, 'render', 'remove', 'showIdeas', 'ideaAdded', 'updateCounter');
			this.model.bind('change', this.updateCounter);
			this.model.bind('destroy', this.remove);
			this.idealistview = new IdeaListView({collection : this.model.ideas});
			this.model.ideas.bind('reset', this.showIdeas);
			this.model.ideas.bind('add', this.ideaAdded);
			this.$separator = $();
		},
		
		ideaAdded: function() {
			//this should change probably
			this.model.fetch();
		},
		
		updateCounter: function() {
			this.$('.counter').text(this.model.get('ideas_count'));
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
						this.$separator.height(now - 15);
					}, this)
				});
				this.expanded = true;
			}
		},
		
		hideIdeas: function(){
			if(this.expanded){
				$(this.el).find(".cluster-ideas, .arrow, .arrow-border").hide('blindStep', {
					step : $.proxy(function(now, fx) {
						this.$separator.height(now - 15);
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
		
		clear: function(ev) {
			ev.stopPropagation();
			if(confirm("Are you sure you wish to delete this cluster?")){
				if(this.expanded){
					this.hideIdeas();
				}
				this.model.destroy();
			}
		},
		
		showDelete: function() {
			this.$('.counter').html('&#x2573;').css({'padding-left': '3px', 'padding-right': '2px'});
		},
		
		hideDelete: function() {
			this.$(".counter").css({'padding-left': '6px', 'padding-right': '6px'}).text(this.model.get("ideas_count"));
		}
	});
});