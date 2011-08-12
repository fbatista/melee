$(function() {
	window.Backbone.volatileSync = function(method, model, options) {
		options.success(model);
	};
	window.User = Backbone.Model.extend({
		sync : Backbone.volatileSync,
		initialize : function(){
			var tempidealist = IdeaList.extend({sync : Backbone.volatileSync});
			this.ideas = new tempidealist([]);
		}
	});
});