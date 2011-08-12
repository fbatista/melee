$(function(){
	window.SessionView = Backbone.View.extend({
		id: 'session',

		bootstrapped: false,

		events: {
			"click #new-session" : "start"
		},

		initialize : function() {
			_.bindAll(this, "start", "render", "proceed");
			this.template = _.template($('#startsession-template').html());
			$(this.el).html(this.template());
			this.startButton = this.$('#new-session');
		},

		bootstrap : function(opts) {
			if(!this.bootstrapped){
				this.router = opts.router;
				this.model = opts['session'] || new Session();
				this.model.bind("change", this.proceed);
				this.bootstrapped = true;
			}
		},

		render : function() {
			return this;
		},

		start : function() {
			//todo fetch a session ID from server
			if(this.model.isNew()){
				this.model.save();
			}else{
				this.proceed();
			}
		}, 
		
		proceed : function() {
			this.remove();
			this.router.sessionStarted(this.model, $.proxy(function(){
				this.router.navigate(this.model.id+"/ideate", true);
			}, this));
		}
	});
});