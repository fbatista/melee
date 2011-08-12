$(function(){
	window.IdeaView = Backbone.View.extend({
		className: 'idea',
		template: _.template($('#idea-template').html()),
		
		events : {
			"cluster:idea:add": "addToCluster",
			"click .idea-delete": "clear",
			"click .vote": "vote",
			"mouseover": "showDelete",
			"mouseout": "hideDelete"
		},
		
		initialize: function() {
			_.bindAll(this, 'render', 'remove');
			this.model.bind('change', this.render);
			this.model.bind('destroy', this.remove);
		},
		
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},
		
		clear: function(ev) {
			this.model.destroy();
		},
		
		vote: function(ev){
			$(this.el).trigger('idea:vote', this);
		},
		
		showDelete: function() {
			this.$(".idea-delete").show();
		},
		
		hideDelete: function() {
			this.$(".idea-delete").hide();
		},
		
		addToCluster: function(ev, clusterView) {
			//remove an idea from the collection without triggering the remove event on the whole structure, which would cause backbone to try to destroy the model in the backend.
			this.model.trigger('destroy');
			this.model.collection.remove(this.model, {silent: true});
			//this will trigger a PUT in the backend.
			//clusterView.model.ideas.create(this.model);
			clusterView.model.ideas.add(this.model, {silent: true});
			this.model.save({}, {success: $.proxy(function(){
				clusterView.model.ideas.trigger('add', this.model);
			}, this)});
			
		}
	});
});