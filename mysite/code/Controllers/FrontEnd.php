<?php

use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;
use Everyman\Neo4j\Relationship;

class FrontEnd extends Controller {

	private static $allowed_actions = array(
		'get'
	);

	public function index($req) {
		debug::dump($req);
	}

	/**
	 * [cat description]
	 * @param  [type] $request [description]
	 * @return [type]          [description]
	 */
	public function get($request) {

		$primaryCategories = array(
			'design thinking',
			'public places',
			'design for better living',
			'fashion',
			'communication design'
		);

		// The category requested
		$category = str_replace('-', ' ', $this->request->param('ID'));

		// Get an item in the collection
		$item = $this->getRandomItem($category);

		// Something crazy happened. Are there any items at all?
		if ( !$item  ){
			return $this->httpError('404');
		}

		// If there aren't any friends try some more.
		$attempts = 0;
		while ( count($item->getNode()->getRelationships(array('LIKES'), Relationship::DirectionOut)) < 2  && $attempts < 5) {
			$item = $this->getRandomItem($category);
			$attempts++;
		}

		return $this->redirect($item->Link);
	}

	private function getRandomItem($category) {
		return CatalogueItem::get()->filter('APDLCategory', $category)->sort('RAND()')->first();
	}

}