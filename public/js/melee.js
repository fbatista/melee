(function($) {
	
	window.Idea = Backbone.Model.extend({
		
	});
	
	window.ideaView = IdeaView = Backbone.View.extend({
		className: 'idea',
		
		initialize: function() {
			_.bindAll(this, 'render');
			this.model.bind('change', this.render);
			this.template = _.template($('#idea-template').html());
		},
		
		render: function() {
			var content = this.template(this.model.toJSON());
			$(this.el).html(content);
			return this;
		}
	});
	
})(jQuery);
