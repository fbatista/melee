$(function(){
	window.IdeaListView = Backbone.View.extend({
		template: _.template($('#idealistview-template').html()),
		className: 'clearfix',
		initialize: function(){
			this.title = this.options.title || 'Ideas'
			_.bindAll(this, 'render', 'add');
			this.collection.bind('add', this.add);
			this.collection.bind('reset', this.render);
		},
		
		render: function(stuff){
			var $ideas, idea_views = [], collection = this.collection;
			
			$(this.el).html(this.template({title : this.title}));
			$ideas = $(this.el);
			
			collection.each(function(idea){
				var view = new IdeaView({
					model : idea
				});
				idea_views.push(view);
				$ideas.append(view.render().el);
			});
			this.trigger('idea:add', $(this.el).find('.idea'), idea_views);
			return this;
		},
		
		add: function(idea) {
			var view = new IdeaView({model:idea});
			$(this.el).append(view.render().el);
			this.trigger('idea:add', $(view.el), [view]);
		}
	});
	
	//VIEW FOR CLUSTER COLLECTION
	window.ClusterListView = Backbone.View.extend({
		template: _.template($('#clusterlistview-template').html()),
		className: 'clearfix',
		events : {
			"click .cluster": "toggleDetails"
		},
		
		initialize: function(){
			_.bindAll(this, 'render', 'add');
			this.collection.bind('add', this.add);
			this.collection.bind('reset', this.render);
		},
		
		render: function(){			
			var $ideas, collection = this.collection;
			
			$(this.el).html(this.template());
			$clusters = $(this.el);
			collection.each(function(cluster){
				var view = new ClusterView({
					model : cluster
				});
				$clusters.append(view.render().el);
			});
			this.trigger("cluster:add", $(this.el).find('.cluster'));
			return this;
		},
		
		toggleDetails: function(e){
			$(e.currentTarget).siblings().trigger("hideDetails");
		},
		
		add: function(cluster) {
			var view = new ClusterView({model:cluster});
			$(this.el).append(view.render().el);
			this.trigger("cluster:add", $(view.el));
		}
	});
});