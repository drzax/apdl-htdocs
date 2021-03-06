<?php

use Everyman\Neo4j\Node;
use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;
use Everyman\Neo4j\Relationship;

class API extends Controller {

	private static $allowed_actions = array(
		'graph',
		'searchData',
		'bookmark',
		'item'
	);

	public function bookmark($request) {

		$user = Member::currentUser();

		if (!$user) {
			return $this->httpError(404);
		}

		$bib = $request->param('ID');

		$current = $user->getBookmarks();
		$exists = false;
		foreach ($current as $bm) {
			if ($bm->getProperty('bib') == $bib) {
				$exists = true;
				break;
			}
		}

		if (!$exists) {
			$user->addBookmark($bib);
		}

		$bookmarks = array();
		foreach ($user->getBookmarks() as $mark) {
			$bookmarks[] = $mark->getProperties();
		}

		return Convert::raw2json($bookmarks);
	}

	public function graph($request) {

		$item = CatalogueItem::get()->filter(array(
			'BIB'=>$this->request->param('ID')
		))->First();
		
		if ( !$item  ){
			return $this->httpError('404');
		}

		$neo = Neo4jConnection::get();
		$node = $neo->getNode($item->NodeId);
		$likes = $node->getRelationships(array('LIKES'), Relationship::DirectionOut);

		$ret = new stdClass();
		$ret->nodes = array();
		$ret->links = array();
		$ret->nodes[] = $node->getProperties();
		foreach ($likes as $like) {
			$ret->nodes[] = $like->getEndNode()->getProperties();
			$ret->links[] = array(
				'source' => 0,
				'target' => count($ret->nodes)-1,
				'value' => $like->getProperty('strength')
			);
		}
		
		return Convert::raw2json($ret);
		
		// return 'bam';
	}

	public function item($request) {

		if ($this->request->param('ID')) {
			$item = CatalogueItem::get()->filter(array(
				'BIB'=>$this->request->param('ID')
			))->First();	
		} else {
			$item = CatalogueItem::get()->sort('RAND()')->first();
		}
		
		if ( !$item  ) {
			return $this->httpError('404');
		}

		$node = $item->getNode();

		$export = (object) $node->getProperties();
		$export->category = $item->APDLCategory;
		$export->friends = $this->getFriendsForExport($node, false);
		$export->creators = array();

		$timeline = $item->getTimelineNodes();
		$export->timeline = array();
		foreach ($timeline as $event) {
			$export->timeline[] = $event->getProperties();
		}
		return Convert::raw2json($export);

	}

	private function getCreatorsForExport($node) {
		$return = array();
		$creators = $node->getRelationships(array('CREATED_BY'), Relationship::DirectionOut);
		if ($creators) foreach ($creators as $rel) {
			$creator = $rel->getEndNode();
			$return[] = $creator->getProperties();
		}
		return $return;
	}

	private function getFriendsForExport($node, $recurse = false, $bare = false) {
		$return = array();
		$friends = $node->getRelationships(array('LIKES'), Relationship::DirectionOut);
		if ($friends) foreach ($friends as $friendRel) {
			$friend = $friendRel->getEndNode();
			$properties = (object) $friend->getProperties();
			$properties->category = $this->getNodeCategory($friend);
			$properties->strength = $friendRel->getProperty('strength');
			if ($recurse) $properties->friends = $this->getFriendsForExport($friend);
			$return[] = $properties;
		}
		return $return;
	}

	private function getNodeCategory($node) {
		$rel = $node->getFirstRelationship(array('APDL_CATEGORY'), Relationship::DirectionOut);
		if ($rel) {
			return $rel->getEndNode()->getProperty('name');
		}
	}

	/**
	 * Return all of the catalogue items as a JSON string.
	 * 
	 * This is a huge overhead, but works for this small catalogue. We will cache it in the browser's local storage.
	 * 
	 * @return [string] The catalogue as a JSON string.
	 */
	public function searchData() {
		$items = CatalogueItem::get();
		$ret = new stdClass();
		$ret->items = array();
		foreach ($items as $item) {
			$ret->items[] = array(
				'Title' => $item->Title,
				'Author' => $item->Author,
				'ISBN' => $item->ISBN,
				'BIB' => $item->BIB
			);
		}
		return Convert::raw2json($ret);
	}
}