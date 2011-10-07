$(function(){
	window.ExportView = Backbone.View.extend({
		id: 'export',
	
		bootstrapped: false,

		initialize: function() {
			_.bindAll(this, 
				'onVoteReceived',
				'onVoteRetracted'
			); 
			this.template = _.template($('#exportview-template').html());
			$(this.el).html(this.template());
			this.download = this.$('#download-results');
			this.resultlist = this.$('#resultlist');
		},

		bootstrap: function(opts) {
			if(!this.bootstrapped){
				this.router = opts.router;

				this.resultIdeas = opts['resultIdeas'];
				if (!this.resultIdeas) {
					this.resultIdeas = new IdeaList([], {url : "/"+opts['session'].id+"/results"});
				}
				this.resultIdeas.comparator = function(idea) {
					return idea.get('score') * -1;
				}
				this.resultListView = new IdeaListView({
					title: "Ideas, ordered by score:",
					collection: this.resultIdeas
				});

				this.router.sessionStarted(opts['session'], $.proxy(function(){
					this.resultIdeas.fetch();
					this.router.current_user.set({step: 'Export'});
					this.updateLink();
				},this));

				this.bootstrapped = true;
			}else{
				this.router.current_user.set({step: 'Export'});
			}
		},

		render: function() {
			$(this.resultlist).html(this.resultListView.render().el);
			return this;
		},

		updateLink: function() {
			this.download.attr('href', "data:text/x-markdown;charset=utf-8,"+escape(this.resultListView.toMarkdown()));
		},

		onVoteReceived: function(idea) {
			var res_idea = this.resultIdeas.get(idea.id);
			if(res_idea){
				res_idea.set({score: (res_idea.get('score') + 1)});
				this.resultIdeas.sort();
			}else {
				idea.score = 1
				this.resultIdeas.add(idea);
			}
			this.updateLink();
		},

		onVoteRetracted: function(idea) {
			var res_idea = this.resultIdeas.get(idea.id);
			if(res_idea){
				res_idea.set({score: (res_idea.get('score') - 1)});
				if(res_idea.get('score') <= 0) {
					res_idea.trigger('destroy', res_idea);
				}else{
					this.resultIdeas.sort();	
				}
				this.updateLink();
			}
		}
	});	
});