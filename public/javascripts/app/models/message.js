$(function(){
	window.Backbone.socketSync = function(method, model, options) {		
		setTimeout(function(){
			options.success(model);
		}, 10);
	};
	
	window.Message = Backbone.Model.extend({
		sync : Backbone.socketSync
	});
});