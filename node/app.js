(function(){
	var io = require('socket.io'), redis = require('redis');
	var rebind = function(fun, newthis){
		return function() {
			return fun.apply(newthis, arguments);
		};
	};
})();