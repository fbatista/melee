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
				
				this.router.setupNavEvents(opts['session']);
				this.bootstrapped = true;
			}
			//TEMPORARY, MOVE THIS INSIDE THE IF WHEN WE HAVE MULTIPLAYER PUSH
			this.clusters.fetch();
			this.unsortedIdeas.fetch();
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
			e.draggable({revert: 'invalid', zIndex: 50});
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
});