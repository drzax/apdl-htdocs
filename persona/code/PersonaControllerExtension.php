<?php

class PersonaControllerExtension extends Extension {


	public function onAfterInit() {
		Requirements::javascript(FRAMEWORK_DIR .'/thirdparty/jquery/jquery.js');
		Requirements::javascript('https://login.persona.org/include.js');
		Requirements::javascript('persona/javascript/frontend.js');
		Requirements::css('persona/thirdparty/persona-css-buttons/persona-buttons.css');
	}
}