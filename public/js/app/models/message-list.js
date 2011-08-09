$(function(){
	window.MessageList = Backbone.Collection.extend({
		model: Message,
		initialize: function(models, options){
			this.url = options['url'];
		}
	});
});