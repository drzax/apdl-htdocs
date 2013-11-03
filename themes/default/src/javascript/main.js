(function(){

	// Menu
	require(['jquery'], function($) {
		var $container, $button;

		$button = $('#nav-trigger');
		$container = $('body');
		$pusher = $('#pusher');

		$button.on('click', function(){

			$container.addClass('nav-open'); 
			$pusher.one('click', function(){
				$container.removeClass('nav-open');
				return false;
			});

			return false;
		});
	});
	
}());