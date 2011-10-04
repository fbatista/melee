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

		toMarkdown: function() {
			var md = "# Melee session results #\n\n";
			if(this.collection.length > 0) {
				if (this.collection.length > 10) {
					md += "## Top 10 ideas ##\n\n";
				} else {
					md += "## Top ideas ##\n\n";
				}
			}else {
				md += "## No ideas were voted ##";
			}
			for(var i = 0; i < Math.min(this.collection.length, 10); i++){
				var idea = this.collection.at(i);
				md += (i+1) + ". " + idea.get('title') + " - _with "+ idea.get('score') + " votes_\n"
			}
			if(this.collection.length > 10) {
				md += "\n## Other ideas that got voted ##\n\n"
				for (var j = 10; j < this.collection.length; j++) {
					md += "- " + this.collection.at(j).get('title') + "\n";
				}
			}
			return md;
		},
		
		add: function(idea) {
			var view = new IdeaView({model:idea});
			$(this.el).append(view.render().el);
			this.trigger('idea:add', $(view.el), [view]);
		}
	});
});