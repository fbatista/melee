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
});