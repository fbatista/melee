$(function() {
	
	/* Ideas MVC */
	
	window.Idea = Backbone.Model.extend({
		
	});
	
	window.IdeaList = Backbone.Collection.extend({
		model: Idea,
		url: '/ideas'
	});
		
	window.IdeaView = Backbone.View.extend({
		className: 'idea',
		
		events: {
			"click": "teste"
		},
				
		initialize: function() {
			_.bindAll(this, 'render');
			this.model.bind('change', this.render);
			this.template = _.template($('#idea-template').html());
		},
		
		render: function() {
			var content = this.template(this.model.toJSON());
			$(this.el).html(content);
			return this;
		},
		
		teste: function() {
			alert('ola');
		}
	});
	
	window.IdeaListView = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this, 'render');
			this.template = _.template($('#idealistview-template').html());
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
		}
	});
	
	/* Main views (ideate, group, prioritize, export) */
	
	window.IdeateView = Backbone.View.extend({
		events: {
			"keypress #new-idea": "addIdea"
		},

		initialize: function() {
			_.bindAll(this, 'addIdea', 'render');
			this.template = _.template($('#ideateview-template').html());
			$(this.el).html(this.template());
			this.input = this.$('#new-idea');
			this.idealist = this.$('#idealist');

			Ideas.fetch();
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
			"": "ideate"
		},
		
		initialize: function() {
			this.container = $('#melee');
		},
		
		ideate: function() {
			this.ideateView = new IdeateView();
			this.container.empty();
			this.container.append(this.ideateView.render().el)
		}
	});
	
	window.Ideas = new IdeaList();
	window.melee = new Melee();
	Backbone.history.start();
});