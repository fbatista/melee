$(function(){
	window.PrioritizeView = Backbone.View.extend({
		id: 'prioritize',
		
		bootstrapped: false,
		
		events: {
			"idea:vote .idea": "vote"
		},
		
		initialize: function() {
			_.bindAll(this, 
				'render', 
				'onNewCluster', 
				'onMoveToCluster',
				'onDestroyIdea',
				'onDestroyCluster',
				'onRemoveIdeaFromCluster');
			this.template = _.template($('#prioritizeview-template').html());
			$(this.el).html(this.template());
			this.clusterlist = this.$('#p-clusterlist');
			this.votecounter = this.$('#remaining-votes');
		},
		
		bootstrap: function(opts) {
			if(!this.bootstrapped){
				this.router = opts.router;
				this.clusters = opts['clusters'];
				if (!this.clusters) {
					this.clusters = new ClusterList([], {url : "/"+opts.session.id+"/clusters"});
				}
				this.clusterListView = new ClusterListView({
					collection: this.clusters
				});
				
				this.router.sessionStarted(opts['session'], $.proxy(function(){
					this.clusters.fetch({success: $.proxy(function(collection, response){
						collection.each($.proxy(function(cluster){
							this.bindIdeasDisplay(cluster);
						}, this));
					},this)});
					this.updateVoteCounter();
					this.router.current_user.set({step: 'Prioritize'});
					this.router.current_user.bind('change:votes', this.updateVoteCounter, this);
				},this));
				
				this.bootstrapped = true;
			}
		},
		
		updateVoteCounter : function() {
			this.votecounter.text(this.router.current_user.get('votes'));
		},
		
		vote: function(ev, ideaView) {
			var idea_id = "idea:"+this.router.opts.session.id+":"+ideaView.model.id;
			if(this.router.current_user.votes.get(idea_id)){
				//remove vote
				this.router.current_user.votes.get(idea_id).destroy({socket : this.router.socket});
				ideaView.$('.vote').animate({backgroundColor : '#999999'}, 350);
				this.router.current_user.set({votes : (this.router.current_user.get('votes') + 1)});
			} else {
				//add vote
				if(this.router.current_user.get('votes') > 0){
					this.router.current_user.votes.create({idea : idea_id}, {socket : this.router.socket});
					this.router.current_user.set({votes : (this.router.current_user.get('votes') - 1)});
					ideaView.$('.vote').animate({backgroundColor : '#00ff00'}, 350);
				}
			}
		},
		
		render: function() {
			$(this.clusterlist).html(this.clusterListView.render().el);
			return this;
		},

		bindIdeasDisplay: function(cluster) {
			cluster.bind("cluster:ideas:shown", function(){
				this.router.current_user.votes.each($.proxy(function(voted_idea){
					var idea_id = voted_idea.get('idea').split(":")[2];
					cluster.ideas.each(function(idea){
						if (idea.id === idea_id) {
							idea.trigger('bootstrap:vote');
						}
					});
				},this));
			}, this);
		},
		
		proceed: function() {
			this.router.navigate(this.id+"/export", true);
		},
		
		/*
		S O C K E T   E V E N T S
		*/
		onNewCluster : function(cluster) {
			if(this.bootstrapped && !this.clusters.get(cluster.id)){
				this.clusters.add(cluster);
				this.bindIdeasDisplay(cluster);
			}
		},
		
		onMoveToCluster : function(idea) {
			var cluster_id = idea.cluster.split(":")[2];
			if(this.bootstrapped && !this.clusters.get(cluster_id).ideas.get(idea.id)){
				this.unsortedIdeas.get(idea.id).trigger('destroy', this.unsortedIdeas.get(idea.id));
				this.clusters.get(cluster_id).ideas.add(idea);
			}
		},
		
		onDestroyIdea : function(idea) {
			if(this.bootstrapped && idea.cluster && this.clusters.get(idea.cluster).ideas.get(idea.id)) {
				var idea_model = this.clusters.get(idea.cluster).ideas.get(idea.id);
				idea_model.trigger('destroy', idea_model);
			}
		},
		
		onDestroyCluster : function(cluster) {
			if(this.bootstrapped && this.clusters.get(cluster.id)) {
				this.clusters.get(cluster.id).trigger('destroy', this.clusters.get(cluster.id));
			}
		},
		
		onRemoveIdeaFromCluster : function(idea) {
			var cluster_id = idea.cluster;
			if(this.bootstrapped && this.clusters.get(cluster_id).ideas.get(idea.id)){
				var idea_model = this.clusters.get(cluster_id).ideas.get(idea.id);
				idea_model.trigger('destroy', idea_model);
			}
		}
	});
});