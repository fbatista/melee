$(function(){
	window.UserListView = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this, 'render', 'add');
			this.collection.bind('add', this.add);
			this.collection.bind('reset', this.render);
		},
		
		render: function() {
			var $users, user_views = [], collection = this.collection;
			
			$users = $(this.el);
			
			collection.each(function(user){
				var view = new UserView({
					model : user
				});
				user_views.push(view);
				$users.append(view.render().el);
			});
			return this;
		},
		
		add: function(user) {
			var $el = $(this.el);
			var view = new UserView({
				model : user
			});
			$el.append(view.render().el);
			$el.animate({scrollTop : ($el.prop('scrollHeight') - $el.height())}, 1000, "easeInOutQuart");
			return view;
		}
	});
});