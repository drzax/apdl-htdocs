<?php
use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;	
use Everyman\Neo4j\Relationship;

/**
 * A testing playground!
 */
class Playground extends Controller {

	private static $allowed_actions = array('AddingEvents', 'UpdateFriendsTest', 'UpdateTaskTests', 'ImportCatalogue', 'WorldCatIdentities', 'FindFriends', 'TroveRecord');

	private function neo() {
		if (!$this->neo) {
			$this->neo = new Client(NEO4J_SERVER, NEO4J_PORT);
			if (defined('NEO4J_USERNAME') && defined('NEO4J_PASSWORD')) {
				$this->neo->getTransport()->setAuth(NEO4J_USERNAME, NEO4J_PASSWORD);
			}	
		}

		return $this->neo; 
		
	}

	public function TroveRecord($request) {

		$id = (int) $request->param('ID');
		$trove = new Trove(TROVE_KEY); 
		$record = $trove->work($id, 'full', array('tags','comments','lists','workversions', 'holdings'));
		Debug::dump($record);
	}

	public function WorldCatIdentities($request) {

		$wc = new WorldCatIdentities();

		$lccns = array(
			'lccn-no2008-30495', // Smallman, Jake
			'lccn-no2004-26558' // Uffelen, Chris van
		);

		$record = $wc->getRecord($lccns[0]);
		// Debug::dump($record);
		foreach ($record->associatedNames->name as $name) {
			Debug::dump((string)$name->normName);
		}
		

		return;

		$tufte = array(
			'Edward R. Tufte 1942-',
			'Edward R. Tufte',
			'Tufte, Edward R., 1942-',
			'Graves-Morris, P. R.',
			'Baker, George A. (George Allen), 1932-',
			'Graves-Morris, P. R. (Peter R.)',
			'Tufte, Edward R.',
			'Tufte, Edward R. (Edward Rolf), 1942-'
		);

		$oclc = '228365461';
		$name = substr($tufte[1], 0, strpos($tufte[1], ','));

		$oclc = '780815260';
		// $oclc = '0237502375';
		$name = 'Haverkamp';

		// $wc->openSearch($name, $oclc);
		// 
		// $wc->nameFinder('Haverkamp, Michael');
		Debug::dump($wc->getRecordByName('aohagoiehgpie'));

	}
	
	public function UpdateTaskTests($request) {
		
		$id = (int) $request->param('ID');
		if ($id) {
			$query = CatalogueItem::get()->filter('ID', $id);
		} else {
			$query = CatalogueItem::get()
				->filter(array(
					'NextUpdate:LessThan' => time()
				))
				->limit(10)
				->sort('NextUpdate', 'ASC');
		}

		
		$remaining = $query
			->map('ID', 'ID')
			->toArray();

		Debug::dump($remaining);

		// lets process our first item - note that we take it off the list of things left to do
		$item = CatalogueItem::get()->byID(array_shift($remaining));
		
		// Get the node data
		$item->updateCatalogueData();

	}

	/**
	 * Creates a basic entry in the graph for an item in the catalogue.
	 * This basic entry will be automatically updated later via a scheduled task to try and fill out missing information
	 * from additional data sources and to also
	 */
	public function ImportCatalogue($request) {
		$item = CatalogueItem::get()->first();
		$item->write();

	}

	public function AddingEvents($request) {
		$id = (int) $request->param('ID');
		if ($id) {
			$item = CatalogueItem::get()->filter('NodeId', $id)->first();
		} else {
			$item = CatalogueItem::get()->sort('RAND()')->first();
		}

		// $item->addTimelineEvent('fake', time(), 'Fake');
		$item->removeTimelineEvent('fake');
	}

	public function UpdateFriendsTest($request) {
		$id = (int) $request->param('ID');
		if ($id) {
			$item = CatalogueItem::get()->filter('NodeId', $id)->first();
		} else {
			$query = CatalogueItem::get()
				->limit(1)
				->sort('FriendsUpdated', 'ASC');

			$remaining = $query
				->map('ID', 'ID')
				->toArray();
		}


		$remaining = $query
			->map('ID', 'ID')
			->toArray();

		// lets process our first item - note that we take it off the list of things left to do
		$item = CatalogueItem::get()->byID(array_shift($remaining));
		
		// Get the node data
		echo $item->updateFriends();
	}

	public function FindFriends($request) {

		$id = (int) $request->param('ID');
		if ($id) {
			$item = CatalogueItem::get()->filter('NodeId', $id)->first();
		} else {
			$item = CatalogueItem::get()->sort('RAND()')->first();
		}
		
		$friends = $item->findFriends();

		debug::dump("{$item->NodeId}: {$item->Title} by {$item->Author}");
		debug::dump(count($friends));
		debug::dump($friends);
	}

}