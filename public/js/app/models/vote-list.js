$(function(){
	window.VoteList = Backbone.Collection.extend({
		model: Vote,
		initialize: function(models, options){
			this.url = options['url'];
		}
	});
});