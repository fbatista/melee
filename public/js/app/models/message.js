$(function(){
	window.Backbone.socketSync = function(method, model, options) {
		console.log("sending through socket...");
		console.log("method -> "+method);
		console.log("model -> "+model);
		console.log("options -> "+options);
		
		setTimeout(function(){
			console.log("sending success...");
			options.success(model);
		}, 10);
	};
	
	window.Message = Backbone.Model.extend({
		sync : Backbone.socketSync
	});
});