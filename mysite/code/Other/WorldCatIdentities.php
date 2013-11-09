<?php

class WorldCatIdentities {

	/**
	 * Attempt to find a WorldCat identity record by author name.
	 * 
	 * @param  string $name Author's name
	 * @return SimpleXMLElement Identity record
	 */
	public function getRecordByName($name) {
		$lccn = $this->nameFinder($name);
		return $this->getRecord($lccn);
	}

	public function getRecord($lccn) {
		$ch = curl_init();

		$endpoint = 'http://worldcat.org/identities/' . $lccn . '/identity.xml';

		curl_setopt($ch, CURLOPT_URL, $endpoint);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array(
			'Content-Type: text/xml'
		));

		$result = curl_exec($ch);
		$xml = simplexml_load_string($result);
		return $xml;
	}


	public function nameFinder($name) {

		$ch = curl_init();

		$endpoint = 'http://worldcat.org/identities/find';

		$params = array(
			'fullName' => urlencode($name)
		);

		curl_setopt($ch, CURLOPT_URL, $endpoint . '?' . http_build_query($params));
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

		$result = curl_exec($ch);

		$xml = simplexml_load_string($result);

		if (isset($xml->match[0]->lccn)) {
			$lccn = (string) $xml->match[0]->lccn;
			$lccn = 'lccn-' . $lccn;
		} else {
			$lccn = null;
		}
		return $lccn;
	}

	public function openSearch($name, $oclc) {
		$ch = curl_init();

		$endpoint = 'http://worldcat.org/identities/find';

		$params = array(
			'url_ver'=>'Z39.88-2004',
			'rft_val_fmt' => 'info:ofi/fmt:kev:mtx:identity',
			'rft.namelast' => urlencode($name),
			'rft_id' => 'info:oclcnum/'.$oclc
		);

		curl_setopt($ch, CURLOPT_URL, $endpoint . '?' . http_build_query($params));
		// curl_setopt($ch, CURLOPT_HTTPHEADER, array(
		// 	'Content-Type: text/xml'
		// ));
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

		$result = curl_exec($ch);

		Debug::dump(htmlentities($result));

	}

	public function autoSuggest($term) {
		
		$ch = curl_init();

		$endpoint = 'http://worldcat.org/identities/AutoSuggest';
		// $params = array(
		// 	'url_ver'=>'Z39.88-2004',
		// 	'rft_val_fmt' => 'info:ofi/fmt:kev:mtx:identity',
		// 	'rft.namelast' => urlencode($name),
		// 	'rft_id' => 'info:oclcnum/'.$oclc
		// );

		$params = array(
			'query' => urlencode($term)
		);

		curl_setopt($ch, CURLOPT_URL, $endpoint . '?' . http_build_query($params));
		// curl_setopt($ch, CURLOPT_HTTPHEADER, array(
		// 	'Content-Type: text/xml'
		// ));
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		$result = curl_exec($ch);
		Debug::dump(htmlentities($result));


	}



}
