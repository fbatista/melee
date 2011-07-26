(function($) {
	/*
	M O D E L S  &  C O L L E C T I O N S
	*/
	window.Idea = Backbone.Model.extend({
		
	});
	
	window.Ideas = Backbone.Collection.extend({
		model: Idea,
		url: '/ideas'
	});
	
	/*
	V I E W S
	*/
	
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
	
	window.SessionIdeaView = IdeaView.extend({

	});
	
	window.AppView = Backbone.View.extend({
		el : $('#melee'),
		
		events: {
			'keypress #new-idea': 'addIdea'
		},
		
		addIdea: function(e){
			if(e.keyCode != 13) return;
			Idea.create({title: this.input.val()})
		},
		
		initialize: function(){
			_.bindAll(this, 'addIdea', 'render');
			this.$input = this.$('#new-idea');
		},
		
		render: function(){
			
		}
		
	});
	
	window.SessionView = Backbone.View.extend({
		tagName: 'section',
		
		initialize: function(){
			_.bindAll(this, 'render');
			this.template = _.template($('#session-template').html());
			this.collection.bind('reset', this.render);
		},
		
		render: function(){
			var $ideas,
				collection = this.collection;
			$(this.el).html(this.template({}));
			$ideas = this.$('.ideas');
			collection.each(function(idea){
				var view = new SessionIdeaView({
					model : idea
				});
				$ideas.append(view.render().el);
			});
			return this;
		}
	});
	
	/*
	R O U T E R
	*/
	
	window.session = new Ideas();
	
	window.Melee = Backbone.Router.extend({
		routes: {
			'': 'home'
		},
		
		initialize: function(){
			this.sessionView = new SessionView({
				collection: window.session
			});
		},
		
		ideate: function(){
			var $container = $('#container');
			$container.html(this.sessionView.render().el);
		},
		
		organize: function(){
			
		},
		
		score: function(){
			
		},
		
		export: function(){
			
		}
	});
	
	$(function() {
		window.App = new Melee();
		Backbone.history.start({pushState : true});
	})
	
})(jQuery);
