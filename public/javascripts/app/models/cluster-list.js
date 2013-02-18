$(function(){
	window.ClusterList = Backbone.Collection.extend({
		model: Cluster,
		initialize: function(models, options){
			this.url = options['url'];
		}
	});
});