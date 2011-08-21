$(function() {
	window.Backbone.volatileSync = function(method, model, options) {
		options.success(model);
	};

	window.User = Backbone.Model.extend({
		sync : Backbone.volatileSync
	});
});