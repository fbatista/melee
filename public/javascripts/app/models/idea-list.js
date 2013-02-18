$(function(){
	window.IdeaList = Backbone.Collection.extend({
		model: Idea,
		initialize: function(models, options){
			if(options !== undefined)
				this.url = options['url'];
			else
				this.url = '/ideas';
		}
	});
});