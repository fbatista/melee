$(function() {
	
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
			"click .idea-delete": "clear"
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

			this.ideaListView = new IdeaListView({
				collection: Ideas
			});
		},
		
		render: function() {
			
			// display ideas			
			$(this.idealist).html(this.ideaListView.render().el);
			return this;
		},
		
		addIdea: function(e) {
			if(e.keyCode != 13) return;
			Ideas.create({title: this.input.val()});
			this.input.val('');
		}
	});
	
	/* App Router */
	
	window.Melee = Backbone.Router.extend({
		routes: {
			"": "home",
			":id": "ideate",
			":id/ideate": "ideate"
		},
		
		initialize: function() {
			this.container = $('#melee');
		},
		
		home: function() {
			console.log("im at home!");
		},
		
		ideate: function(id) {
			this.ideateView = new IdeateView();
			this.container.empty();
			this.container.append(this.ideateView.render().el);
		}
	});
});