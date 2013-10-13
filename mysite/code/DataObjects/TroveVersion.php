<?php 

/**
 * A functional wrapper for the 'verson' object of a work record returned from the Trove API.
 * http://trove.nla.gov.au/general/api-record-work
 */
class TroveVersion {

	private $obj;

	public function __construct($obj) {
		$this->obj = $obj;
	}

	/*
	 * Attempt to get the WorldCat record that relates to this version of the item.
	 */
	public function getWorldCatRecord() {
		
	}
	
}