$(function(){
	window.Cluster = Backbone.Model.extend({
		initialize: function(){
			this.ideas = new IdeaList();
			this.ideas.url = _.bind(function(){
				return this.url() + '/ideas';
			}, this);
		}
	});
});