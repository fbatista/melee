$(function(){
	window.ChatView = Backbone.View.extend({
		el: $('#chat'),
		
		events : {
			"focus #textarea_chat" : "focus",
			"blur #textarea_chat" : "blur",
			"keypress #textarea_chat" : "enterSubmit",
			"keypress #change_nickname>input" : "nickSubmit",
			"message:add" : "addMessage" 
		},
		
		initialize : function(){
			_.bindAll(this, 'askNickname', 'sessionStarted', 'addUser', 'updateUser', 'addMessage', 'removeUser');
			this.textarea = this.$('#textarea_chat');
			this.chat_input = this.$('#chat_input');
			this.textarea_arrow = this.$('#chat_input .arrow');
			this.author = "Anonymous";
			this.modal = this.$('.modal');
			this.change_nickname = this.$("#change_nickname");
			this.nick_input = this.$("#change_nickname>input");
		},
		
		askNickname : function() {
			this.modal.show('fade');
			this.change_nickname.show('fade');
		},
		
		addUser : function(user) {
			if(this.bootstrapped && !this.users.get(user.id)){
				this.users.add(user);
			} else {
				this.updateUser(user);
			}
		},
		
		updateUser : function(user) {
			if(this.bootstrapped && this.users.get(user.id)){
				this.users.get(user.id).set(user);
			}
		},
		
		removeUser : function(user) {
			if(this.bootstrapped && this.users.get(user.id)){
				this.users.get(user.id).destroy();
			}
		},
		
		bootstrap : function(opts) {
			if(!this.bootstrapped){
				this.router = opts.router;
				this.messages = new MessageList([], {url : "/"+opts['session'].id+"/messages"});
				this.users = new UserList([], {url : "/"+opts['session'].id+"/users"});
				
				this.messageListView = new MessageListView({
					el: this.$('#messages'),
					collection: this.messages
				});
				this.userListView = new UserListView({
					el: this.$('#users'),
					collection: this.users
				});
				this.bootstrapped = true;
			}
		},
		
		addMessage : function(message) {
			this.messages.add(message);
		},
		
		nickSubmit : function(ev) {
			if(ev.keyCode != 13) {
				return;
			}
			ev.preventDefault();
			this.trigger('chat:changenick', this.nick_input.val());
			if(this.nick_input.val().length > 0){
				this.author = this.nick_input.val();
			}
			this.nick_input.val('');
			this.modal.hide('fade');
			this.change_nickname.hide('fade');
		},
		
		enterSubmit : function(ev) {
			if(!(ev.keyCode == 13 && !ev.shiftKey && !ev.altKey)) {
				return;
			}
			ev.preventDefault();
			var message = new Message({text: this.textarea.val(), author: this.author, out: false});
			this.messages.create(message);
			this.trigger('chat:newmessage', message);
			this.textarea.val('');
		},
		
		focus : function() {
			this.chat_input.css({"backgroundColor": "white"});
			this.textarea_arrow.css({"borderColor": "transparent white transparent transparent"});
		},
		
		blur : function() {
			this.chat_input.css({"backgroundColor": "lightgray"});
			this.textarea_arrow.css({"borderColor": "transparent lightgray transparent transparent"});
		}
		
		
	});
});