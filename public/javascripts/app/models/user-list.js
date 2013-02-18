$(function() {
	window.UserList = Backbone.Collection.extend({
		model: User,
		initialize: function(models, options){
			this.url = options['url'];
		}
	});
});