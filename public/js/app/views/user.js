$(function(){
	window.UserView = Backbone.View.extend({
		template: _.template($('#user-template').html()),
		
		className: 'user',
		
		events : {
		},
		
		initialize: function() {
		},
		
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		}
	});
});