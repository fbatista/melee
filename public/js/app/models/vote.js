$(function(){
	window.Vote = Backbone.Model.extend({
		sync : function(method, model, options){
			var id = model.get('idea');
			if(method == "create") {
				options.socket.addVote(id);
			} else if(method == "delete") {
				options.socket.removeVote(id);
			}
			model.id = id;
			options.success(model);
		}
	});
});