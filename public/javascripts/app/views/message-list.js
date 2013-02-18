$(function(){
	window.MessageListView = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this, 'render', 'add');
			this.collection.bind('add', this.add);
			this.collection.bind('reset', this.render);
		},
		
		render: function() {
			var $messages, message_views = [], collection = this.collection;
			
			$messages = $(this.el);
			
			collection.each(function(message){
				var view = new MessageView({
					model : message
				});
				message_views.push(view);
				$messages.append(view.render().el);
			});
			return this;
		},
		
		add: function(message) {
			var $el = $(this.el);
			var view = new MessageView({
				model : message,
				className : ("message " + (message.get('out') ? "out" : "in"))
			});
			$el.append(view.render().el);
			$el.animate({scrollTop : ($el.prop('scrollHeight') - $el.height())}, 1000, "easeInOutQuart");
			return view;
		}
	});
});