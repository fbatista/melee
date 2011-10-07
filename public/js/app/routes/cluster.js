$(function(){
	//VIEW FOR CLUSTER ROUTE STEP
	window.ClusterateView = Backbone.View.extend({
		id: 'cluster',
		
		bootstrapped: false,
		
		events: {
			'keypress #new-cluster': 'addCluster',
			'click .cluster .idea-delete': 'fromClusterToUnsorted'
		},
		
		initialize: function() {
			_.bindAll(this, 
				'addCluster', 
				'render', 
				'onNewCluster', 
				'onMoveToCluster',
				'onNewIdea',
				'onDestroyIdea',
				'onDestroyCluster',
				'onRemoveIdeaFromCluster');
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
				}
				this.clusterListView = new ClusterListView({
					collection: this.clusters
				});
				this.clusterListView.bind("cluster:add", this.makeDroppable);
				
				this.unsortedIdeas = opts['unsortedIdeas'];
				if (!this.unsortedIdeas) {
					this.unsortedIdeas = new IdeaList([], {url : "/"+opts['session'].id+"/unsorted"});
				}
				this.unsortedListView = new IdeaListView({
					title: "Unsorted Ideas",
					collection: this.unsortedIdeas
				});
				this.unsortedListView.bind("idea:add", this.makeDraggable);
				
				this.router.sessionStarted(opts['session'], $.proxy(function(){
					this.clusters.fetch();
					this.unsortedIdeas.fetch();
					this.router.current_user.set({step: 'Cluster'});
				},this));
				this.bootstrapped = true;
			} else {
				this.router.current_user.set({step: 'Cluster'});
			}
		},
		
		render: function() {
			$(this.clusterlist).html(this.clusterListView.render().el);
			$(this.unsortedlist).html(this.unsortedListView.render().el);
			return this;
		},
		
		fromClusterToUnsorted: function(ev) {
			this.unsortedIdeas.fetch();
		},
		
		makeDraggable: function(e) {
			e.draggable({revert: 'invalid', zIndex: 50}).addTouch();
		},
		
		makeDroppable: function(e) {
			e.droppable({
				accept: ".idea", 
				drop: function(ev, ui) {
					ui.draggable.hide('scale', {}, $.proxy(function(){
						$(this).effect('highlight');
						$(this).trigger("cluster:idea:add", ui.draggable);
					}, this));
				}
			}).addTouch();
		},
		
		addCluster: function(e){
			if(e.keyCode != 13) return;
			var cluster = new Cluster({title: this.input.val()});
			cluster.collection = this.clusters;
			cluster.save();
			this.input.val('');
		},
		
		proceed: function() {
			this.router.navigate(this.id+"/prioritize", true);
		},
		
		/*
		S O C K E T   E V E N T S
		*/
		onNewCluster : function(cluster) {
			if(this.bootstrapped && !this.clusters.get(cluster.id)){
				this.clusters.add(cluster);
			}
		},
		
		onNewIdea : function(idea) {
			if(this.bootstrapped && !this.unsortedIdeas.get(idea.id)){
				this.unsortedIdeas.add(idea);
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
			if(this.bootstrapped) {
				var idea_model;
				if(idea.cluster && this.clusters.get(idea.cluster).ideas.get(idea.id)) {
					//in a cluster
					idea_model = this.clusters.get(idea.cluster).ideas.get(idea.id)
					idea_model.trigger('destroy', idea_model);
				} else if(this.unsortedIdeas.get(idea.id)) {
					//unsorted
					idea_model = this.unsortedIdeas.get(idea.id);
					idea_model.trigger('destroy', idea_model);
				}
			}
		},
		
		onDestroyCluster : function(cluster) {
			if(this.bootstrapped && this.clusters.get(cluster.id)) {
				this.clusters.get(cluster.id).trigger('destroy', this.clusters.get(cluster.id));
				this.unsortedIdeas.fetch();
			}
		},
		
		onRemoveIdeaFromCluster : function(idea) {
			var cluster_id = idea.cluster;
			if(this.bootstrapped && this.clusters.get(cluster_id).ideas.get(idea.id)){
				var idea_model = this.clusters.get(cluster_id).ideas.get(idea.id);
				idea_model.trigger('destroy', idea_model);
				this.unsortedIdeas.add(idea_model);
			}
		}
	});
});