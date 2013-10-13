<?php 


class WorldCatBasic extends RestfulService {

	private $wsKey, $query;
	
	public function __construct($wsKey, $expiry=43200) {
		parent::__construct('http://www.worldcat.org/webservices/catalog/search/opensearch', $expiry);
		$this->wsKey = $wsKey;
	}

	public function setQuery($query) {
		$params = array(
			'wskey'=>$this->wsKey,
			'q' => $query
		);

		$this->setQueryString($params);
	}
}