$(function(){
	window.IdeateView = Backbone.View.extend({
		id: 'ideate',
		
		bootstrapped: false,
		
		events: {
			"keypress #new-idea": "addIdea",
			"click #start-help .close": "closeHelp"
		},

		initialize: function() {
			_.bindAll(this, 'addIdea', 'render');
			this.template = _.template($('#ideateview-template').html());
			$(this.el).html(this.template());
			this.input = this.$('#new-idea');
			this.welcome = this.$('#start-help');
			this.help_url = this.$('#start-help-url');
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
				if(opts.showWelcome) {
					this.welcome.css({display:'block'});
					this.help_url.val(document.location.href);
					opts.showWelcome = false;
				}
				this.bootstrapped = true;
			}else{
				this.router.current_user.set({step: 'Ideate'});
			}
		},
		
		render: function() {
			// display ideas			
			$(this.idealist).html(this.ideaListView.render().el);
			return this;
		},

		closeHelp: function() {
			this.welcome.hide();
		},
		
		addIdea: function(e) {
			if(e.keyCode != 13) return;
			if(this.input.val().replace(/(^( )*)|(( )*$)/g, "").length == 0) return;
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
				idea_model = this.ideas.get(idea.id);
				idea_model.trigger('destroy', idea_model);
			}
		}
	});
});