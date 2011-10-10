$(function(){
	window.ClusteredResultListView = Backbone.View.extend({
		template: _.template($('#clusteredresultlistview-template').html()),
		cluster_template: _.template($('#clusteredresultcluster-template').html()),
		className: 'clearfix',
		
		initialize: function(){
			this.title = this.options.title || 'Ideas'
			_.bindAll(this, 'render', 'add');
			this.collection.bind('add', this.add);
			this.collection.bind('reset', this.render);
		},

		render: function(stuff){
			var $clusters, idea_views = [], collection = this.collection;
			this.cluster_views = {};

			$(this.el).html(this.template({title : this.title}));
			$clusters = $(this.el);
			
			collection.each($.proxy(function(idea){
				if(!this.cluster_views[idea.get('cluster').title]){
					this.cluster_views[idea.get('cluster').title] = [];	
				}
				var view = new IdeaView({
					model : idea
				});
				this.cluster_views[idea.get('cluster').title].push(view);
				idea_views.push(view);
			}, this));

			for (cluster_title in this.cluster_views) {
				var $cluster = $(this.cluster_template({title : cluster_title}));
				$clusters.append($cluster);
				for(var i = 0; i < this.cluster_views[cluster_title].length; i++){
					$cluster.find('.ideas').append(this.cluster_views[cluster_title][i].render().el);
				}
				this.cluster_views[cluster_title] = $cluster;
			}

			this.trigger('idea:add', $(this.el).find('.idea'), idea_views);
			return this;
		},

		toMarkdown: function() {
			var md = "";
			if(this.collection.length > 0) {
				md += "## Ideas grouped by cluster ##\n\n";
			}else {
				md += "## No clusters with ideas were voted ##";
			}

			var groups = {};
			this.collection.each(function(idea){
				if(!groups[idea.get('cluster').title]){
					groups[idea.get('cluster').title] = [];
				}
				groups[idea.get('cluster').title].push(idea);
			});

			for (cluster in groups){
				md += "### "+ cluster +" ###\n\n";
				for( var i = 0; i < groups[cluster].length; i++){
					md += (i+1)+". "+ groups[cluster][i].get('title') + " - _with "+ groups[cluster][i].get('score') + " votes_\n";
				}
				md += "\n"
			}
			return md;
		},

		add: function(idea) {
			var view = new IdeaView({model:idea});
			this.cluster_views[idea.get('cluster').title].find('.ideas').append(view.render().el);
			this.trigger('idea:add', $(view.el), [view]);
		}

	});
});