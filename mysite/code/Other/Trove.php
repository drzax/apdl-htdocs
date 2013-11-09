<?php

class Trove {

	const ENDPOINT = 'http://api.trove.nla.gov.au/';
	
	/**
	 * Instantiate the Trove API class
	 */
	public function __construct($key) {
		$this->key = $key;
	}

	/**
	 * Perform a search in the trove API
	 * @param  string  $query The query to search for
	 * @param  string  $zone The type of record to search for
	 * @param  array   $lfacets An associative array of key/value pairs to limit the search by facet value
	 * @param  integer $start The start record (default = 0)
	 * @param  integer $limit The limit of results to return (default = 20, max = 100)
	 * @param  string  $sort The sort order for results (default = relevance)
	 * @param  string  $reclevel The level of detail for records returned (default = basic)
	 * @param  array   $include Extra data to include (e.g. comments, tags, etc)
	 * @param  array   $facets Extra facets to include for reach record
	 * @return stdClass A result object.
	 */
	public function search($query, $zone, $lfacets=array(), $start=0, $limit=20, $sort='relevance', $reclevel='brief', $include=array(), $facets=array() ) {
		$params = array();
		$params['q'] = $query;
		$params['zone'] = $zone;

		if (count($lfacets)) {
			foreach ($lfacets as $key => $val) {
				$params['l-'.$key] = $val;
			}
		}
			
		if ($start !== 0) $params['s'] = $start;
		if ($limit !== 20) $params['n'] = $limit;
		if ($sort !== 'relevance') $params['sortby'] = $sort;
		if ($reclevel !== 'basic') $params['reclevel']=$reclevel;
		if (count($include)) $params['include'] = implode(',', $include);
		if (count($facets)) $params['facets'] = implode(',', $facets);

		return $this->request('result', $params);
	}

	/**
	 * Get a specific record from the API
	 * @param  string $type The type of record to retrieve
	 * @param  int $id The ID of the record
	 * @param  string $reclevel The level of detail to retrieve (default=basic)
	 * @param  array $include Extra data to include
	 * @return stdClass A result object
	 */
	public function record($type, $id, $reclevel='basic', $include=array()) {
		$params = array();
		if ($reclevel !== 'basic') $params['reclevel']=$reclevel;
		if (count($include)) $params['include'] = implode(',', $include);

		return $this->request($type.'/'.$id, $params);
	}

	/**
	 * Convenience wrapper for $this->record() to get a specific work (book) from the API
	 * @param  int $id The ID of the record
	 * @param  string $reclevel The level of detail to retrieve (default=basic)
	 * @param  array $include Extra data to include
	 * @return stdClass A result object
	 */
	public function work($id, $reclevel='basic', $include=array()) {
		return $this->record('work', $id, $reclevel, $include);
	}

	/**
	 * Make a request to the API.
	 * @param  string $path The endpoint suffix for this particular query
	 * @param  array $params An associative array of URL params for the request
	 * @return stdClass A standard class of results.
	 */
	private function request($path, $params) {

		$params['encoding'] = 'json';
		$params['key'] = $this->key;

		$url = implode(array(
			self::ENDPOINT,
			$path,
			'?',
			http_build_query($params)
		));

		$result = file_get_contents($url);
		if ($result === false) {
			throw new Exception('Error retrieving data from Trove. See error log for more information.');
		}

		$json = json_decode($result);

		return $json;
	}

}