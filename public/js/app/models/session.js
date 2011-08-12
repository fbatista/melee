$(function() {
	window.Session = Backbone.Model.extend({
		url : '/',
		
		setUserid : function (data) {
			this.set("userid", data.id);
		},
		
		getUserid : function() {
			return this.get('userid');
		}
	});	
});