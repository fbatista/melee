$(function() {
	
	window.Session = Backbone.Model.extend({
		url : '/',
		
		proceed : function() {
			window.session = this;
			melee.navigate(this.id+"/ideate", true);
		}
	});
	
	window.Idea = Backbone.Model.extend({
	});
	
	window.IdeaList = Backbone.Collection.extend({
		model: Idea,
		initialize: function(models, options){
			if(options !== undefined)
				this.url = options['url'];
			else
				this.url = '/ideas';
		}
	});
	
	window.Cluster = Backbone.Model.extend({
		initialize: function(){
			this.ideas = new IdeaList();
			this.ideas.url = _.bind(function(){
				return this.url() + '/ideas';
			}, this);
		}
	});
	
	window.ClusterList = Backbone.Collection.extend({
		model: Cluster,
		initialize: function(models, options){
			this.url = options['url'];
		}
	});
});