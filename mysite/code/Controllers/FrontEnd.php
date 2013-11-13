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

		$id = str_replace('-', ' ', $this->request->param('ID'));

		$primaryCategories = array(
			'design thinking',
			'public places',
			'design for better living',
			'fashion',
			'communication design'
		);

		$item = CatalogueItem::get()->filter('APDLCategory', $id)->sort('RAND()')->first();
		if ( !$item  ){
			return $this->httpError('404');
		}
		
		return $this->redirect($item->Link);
	}

}