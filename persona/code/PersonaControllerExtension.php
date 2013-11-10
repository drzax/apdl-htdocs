<?php

class PersonaControllerExtension extends Extension {


	public function onAfterInit() {

		$member = Member::currentUser();
		$vars = array(
			"MemberEmail" => ($member) ? $member->Email : false
		);

		Requirements::javascript(FRAMEWORK_DIR .'/thirdparty/jquery/jquery.js');
		Requirements::javascript('https://login.persona.org/include.js');
		Requirements::javascriptTemplate('persona/javascript/frontend.js', $vars);
		Requirements::css('persona/thirdparty/persona-css-buttons/persona-buttons.css');
	}
}