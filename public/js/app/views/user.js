$(function(){
	window.UserView = Backbone.View.extend({
		template: _.template($('#user-template').html()),
		
		className: 'user',
		
		events : {
		},
		
		initialize: function() {
			_.bindAll(this, 'render', 'remove');
			this.model.bind('change', this.render);
			this.model.bind('destroy', this.remove);
		},
		
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		}
	});
});