$(function(){
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
				}
				this.ideaListView = new IdeaListView({
					collection: this.ideas
				});
				this.router.sessionStarted(opts['session'], $.proxy(function(){
					this.ideas.fetch();
					this.router.current_user.set({step: 'Ideate'});
				},this));
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
			var idea = new Idea({title: this.input.val()});
			idea.collection = this.ideas;
			idea.save();
			this.input.val('');
		},
		
		proceed: function() {
			this.router.navigate(this.id+"/cluster", true);
		},
		
		/*
		S O C K E T   E V E N T S
		*/
		onNewIdea : function(idea) {
			if(this.bootstrapped && !this.ideas.get(idea.id)){
				this.ideas.add(idea);
			}
		},
		
		onDestroyIdea : function(idea) {
			if(this.bootstrapped && this.ideas.get(idea.id)) {
				this.ideas.get(idea.id).trigger('destroy');
			}
		}
	});
});