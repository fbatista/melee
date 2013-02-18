$(function(){
	window.ClusterListView = Backbone.View.extend({
		template: _.template($('#clusterlistview-template').html()),
		className: 'clearfix',
		events : {
			"click .cluster": "toggleDetails"
		},

		initialize: function(){
			_.bindAll(this, 'render', 'add', 'helpCheck');
			this.collection.bind('add', this.add);
			this.collection.bind('reset', this.render);

			this.collection.bind('reset', this.helpCheck);
			this.collection.bind('add', this.helpCheck);
			this.collection.bind('remove', this.helpCheck);
		},

		helpCheck: function() {
			if(this.collection.length == 0) {
				$(this.el).find('.help').show();
			} else {
				$(this.el).find('.help').hide();
			}
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