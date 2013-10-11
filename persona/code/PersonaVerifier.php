<?php 

class PersonaVerifier extends Controller {

	private static $allowed_actions = array(
		'verify',
		'logout'
	);

	public function index($request) {
		
	}

	public function logout($request) {
		$member = Member::currentUser();
		if ($member) $member->logOut();
	}

	public function verify($request) {

		$ch = curl_init();

		$fields = http_build_query(array(
			'assertion' => $request->postVar('assertion'),
			'audience' => $_SERVER['HTTP_HOST'] . ':80' // TODO: Allow non-default ports
		));

		curl_setopt_array($ch, array(
			CURLOPT_URL => 'https://verifier.login.persona.org/verify',
			CURLOPT_POST => true,
			CURLOPT_POSTFIELDS => $fields,
			CURLOPT_RETURNTRANSFER => true
		));

		$result = json_decode(curl_exec($ch));
		if ($result->status === 'okay') {
			$member = Member::get()->filter('Email', $result->email)->first();
			
			if (!$member) {
				$member = Member::create();
				$member->Email = $result->email;
				$member->write();
			}
			$member->logIn();
		}

		return json_encode($result);
	}

}