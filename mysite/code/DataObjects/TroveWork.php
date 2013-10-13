<?php

/**
 * A functional wrapper around a work record as returned from the Trove API
 * http://trove.nla.gov.au/general/api-record-work
 */
class TroveWork {

	private $obj;
	
	public function __construct($obj) {

		$this->obj = $obj;

	}

	public function getVersions() {

		$versions = array();

		if ( is_array($obj->work->version) ) {
			foreach ($obj->work->version as $version) {
				$versions[] = new TroveVersion($version);
			}	
		}

		return $versions;

	}

	public function getCreators() {

	}

}