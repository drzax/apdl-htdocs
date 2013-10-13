<?php

class WorldCatIdentities {

	public function search($name, $oclc) {
		$this->request($name, $oclc);
	}

	private function request($name, $oclc) {

		$ch = curl_init();

		$endpoint = 'http://worldcat.org/identities/find';
		// $params = array(
		// 	'url_ver'=>'Z39.88-2004',
		// 	'rft_val_fmt' => 'info:ofi/fmt:kev:mtx:identity',
		// 	'rft.namelast' => urlencode($name),
		// 	'rft_id' => 'info:oclcnum/'.$oclc
		// );

		$params = array(
			'fullName' => urlencode($name)
		);

		curl_setopt($ch, CURLOPT_URL, $endpoint . '?' . http_build_query($params));
		// curl_setopt($ch, CURLOPT_HTTPHEADER, array(
		// 	'Content-Type: text/xml'
		// ));
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

		$result = curl_exec($ch);

		Debug::dump(htmlentities($result));

		// echo $result;
		

	}

}
