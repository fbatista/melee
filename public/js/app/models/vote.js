$(function(){
	window.Vote = Backbone.Model.extend({
		sync : function(method, model, options){
			var id = model.get('idea');
			if(method == "create") {
				console.log("create");
				options.socket.addVote(id);
			} else if(method == "delete") {
				console.log("delete");
				options.socket.removeVote(id);
			}
			model.id = id;
			console.log(method);
			console.log("SYNC VOTE");
			options.success(model);
		}
	});
});