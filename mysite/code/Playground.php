<?php
use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;	
use Everyman\Neo4j\Relationship;	
class Playground extends Controller {

	private static $allowed_actions = array('UpdateTaskTests', 'ImportCatalogue', 'WorldCatIdentities', 'FindFriends');

	private function neo() {
		if (!$this->neo) {
			$this->neo = new Client(NEO4J_SERVER, NEO4J_PORT);
			if (defined('NEO4J_USERNAME') && defined('NEO4J_PASSWORD')) {
				$this->neo->getTransport()->setAuth(NEO4J_USERNAME, NEO4J_PASSWORD);
			}	
		}

		return $this->neo; 
		
	}

	public function WorldCatIdentities($request) {

// 		$item = new CatalogueItem('963');

// 		Debug::dump($item->getTroveRecord());


// return;
		$wc = new WorldCatIdentities();

		$tufte = array(
			'Edward R. Tufte 1942-',
			'Tufte, Edward R., 1942-',
			'Graves-Morris, P. R.',
			'Baker, George A. (George Allen), 1932-',
			'Graves-Morris, P. R. (Peter R.)',
			'Tufte, Edward R.',
			'Tufte, Edward R. (Edward Rolf), 1942-'
		);

		// $node = $nodes[0]['x'];
		// debug::dump($node->oclc_id);
		// return;

		$wc->search($tufte[3], '228365461');

	}
	
	public function UpdateTaskTests($request) {

		// Database connection
		$neo = new Client(NEO4J_SERVER, NEO4J_PORT);
		if (defined('NEO4J_USERNAME') && defined('NEO4J_PASSWORD')) {
			$neo->getTransport()->setAuth(NEO4J_USERNAME, NEO4J_PASSWORD);
		}

		$queryTemplate = 'START n=node(*) WHERE HAS(n.bib) AND (NOT(HAS(n.updated)) OR n.updated < {timestamp}) RETURN n LIMIT 3';

		$query = new Query($neo, $queryTemplate, array('timestamp'=>(time()-3600*24*7)));
		debug::dump($query);
		$nodes = $query->getResultSet();
		debug::dump($nodes);
	}

	/**
	 * Creates a basic entry in the graph for an item in the catalogue.
	 * This basic entry will be automatically updated later via a scheduled task to try and fill out missing information
	 * from additional data sources and to also
	 */
	public function ImportCatalogue($request) {

		$items = array();

		$csv = new CSVParser(dirname(__FILE__) . "/../../assets/apdlbooks_withlocationtags - pnx_pass_5.csv");
		foreach ($csv as $row) {

			if (!array_key_exists($row['BIB_ID'], $items)) {
				// Create the catalogue item object
				$item = CatalogueItem::get($row['BIB_ID']);


				if (trim($row['TITLE'])) {
					$item->title = trim($row['TITLE']);
				}

				if (trim($row['ISBN'])) {
					// Clean the ISBN field
					preg_match('/[^\s]+/', $row['ISBN'], $match);
					$isbn = $match[0];
					$item->isbn = $isbn;
				}

				if (trim($row['AUTHOR'])) {
					$item->author = trim($row['AUTHOR']);
				}

				$item->save();

				$items[$row['BIB_ID']] = $item;

			}

			if (trim($row['TAGS'])) {
				$items[$row['BIB_ID']]->setTag(trim($row['TAGS']));
			}
		}
	}

	public function FindFriends($request) {

		$id = (int) $request->param('ID');

		$item = new CatalogueItem($id);

		Debug::dump($item->getTroveRecord());

		// $searchTerms = array();

		// $isbn = $item->getNode()->getProperty('isbn');
		// if ($isbn) $searchTerms[] = 'isbn:'.$isbn;

		// $title = $item->getNode()->getProperty('title');
		// if ($title) $searchTerms[] = 'title:('.$title.')';

		// $author = $item->getNode()->getProperty('author');
		// if ($author) $searchTerms[] = 'creator:('.$author.')';

		// $trove = new Trove(TROVE_KEY); 
		// $result = $trove->search(
		// 	implode(' ', $searchTerms), 	// Search terms
		// 	'book',							// Zone
		// 	array(),						// Limiting facets
		// 	0, 								// Start record
		// 	1 								// Limit
		// );

		// Debug::dump($result);


		// $item->findFriends();


	}

}