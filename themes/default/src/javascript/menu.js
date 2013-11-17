;(function(window, $, undefined){ 

	var $container, 
		$button, 
		icon; 

	// Menu
	$button = $('#nav-trigger');
	$container = $('body');
	$pusher = $('#pusher');

	icon = new svgIcon( $button.get(0), svgIconConfig, { easing : mina.elastic, speed: 600 } );

	$button.on('click', function(){
		$container.toggleClass('nav-open'); 
		return false;
	});

}(window, jQuery));