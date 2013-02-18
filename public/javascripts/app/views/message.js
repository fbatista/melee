$(function(){
	window.MessageView = Backbone.View.extend({
		template: _.template($('#message-template').html()),
		
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