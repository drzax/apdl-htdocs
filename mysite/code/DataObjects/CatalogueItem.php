<?php 
use Everyman\Neo4j\Node;
use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;
use Everyman\Neo4j\Relationship;

/**
 * A wrapper object for a node in the neo4j graph that represents a catalogue item.
 * Provides a number of functions specific to working with catalogue item nodes.
 */
class CatalogueItem {

	private $node, $catalogueIndex;

	private $indexedProperties = array(
		'title',
		'author',
		'isbn',
		'oclc_id',
		'trove_id'
	);

	/**
	 * Instantiate the CatalogueItem objecct
	 * @param Everyman\Neo4j\Node|int $node The node object or node ID.
	 */
	public function __construct($node) {
		if ($node instanceof Node) {
			$this->node = $node;
		} else {
			$this->node = Neo4jConnection::get()->getNode((int) $node);
		}
	}

	/**
	 * Return a reference to the neo4j node object for direct usage.
	 */
	public function getNode() {
		return $node;
	}

	/**
	 * Magic getter for properties on the node.
	 * @param string $property The name of the property  to return.
	 */
	public function __get($property) {
		return $this->node->getProperty($property);
	}

	/**
	 * Magic setter for properties on the node.
	 * @param string $name The name of the property to set.
	 * @param mixed $value The value to set.
	 */
	public function __set($name, $value) {

		// Make sure the index is updated if it should be.
		if (in_array($name, $this->indexedProperties)) {
			$this->indexOn($name, $value);
		}

		return $this->node->setProperty($name, $value);
	}

	public function getWorldCatRecord($isbn) {

		$basic = new WorldCatBasic(WORLDCAT_BASIC_WSKEY);

		$basic->setQuery($isbn);

		$r = $basic->request();
		$items = $basic->getValues($r->getBody(), "entry");

		return $items[0];

	}

	/**
	 * Update the node from external data sources.
	 */
	public function update() {

		$this->updateFromTrove();

		// Save the update time on the node
		$this->node->setProperty('updated', time());
		$this->node->save();
	}

	/**
	 * Save the underlying neo4j node back to the database.
	 */
	public function save() {
		return $this->node->save();
	}

	/**
	 * Index this node in the catalogue index with the given key and value
	 */
	private function indexOn($key, $val) {

		// Make sure the index exists.
		$catalogueIndex = Neo4jConnection::getIndex('catalogue');
		
		return $catalogueIndex->add($this->node, $key, $val);

	}

	private function relationshipExists($start, $type, $end) {
		$relationships = $start->getRelationships(array($type), Relationship::DirectionOut);
		foreach ($relationships as $rel) {
			if ($rel->getEndNode()->getId() === $end->getId()) return true;
		}
		return false;
	}

	private function updateFromTrove() {

		$trove = new Trove(TROVE_KEY); 
		
		$id = $this->node->getProperty('trove_id');

		// If there isn't already a trove ID, search on ISBN and title .
		if (!$id) {

			$searchTerms = array();

			$isbn = $this->node->getProperty('isbn');
			if ($isbn) $searchTerms[] = 'isbn:'.$isbn;

			$title = $this->node->getProperty('title');
			if ($title) $searchTerms[] = 'title:('.$title.')';

			$author = $this->node->getProperty('author');
			if ($author) $searchTerms[] = 'creator:('.$author.')';

			$result = $trove->search(
				implode(' ', $searchTerms), 	// Search terms
				'book',									// Zone
				array(),								// Limiting facets
				0, 										// Start record
				1, 										// Limit
				'relevance', 							// Sort
				'brief', 								// Detail level
				array(), 								// Included data
				array() 								// Included facets
			);

			// todo: What if the search returns no results or there is some error?
			$id = $result->response->zone[0]->records->work[0]->id;

			$this->node->setProperty('trove_id', $id);
		}

		if ($id) {

			$this->node->setProperty('trove_id', $id);

			$record = $trove->work($id, 'full', array('tags','comments','lists','workversions', 'holdings'));

			// Update the issued year
			$this->node->setProperty('issued_year', $record->work->issued);

			// Update the publisher relationships
			foreach ($record->work->version as $version) {
				$this->setItemPublisher($version->record->publisher, $node);
			}

			// Update the holding relationships
			foreach ($record->work->holding as $holding) {
				$this->setItemHolding($holding, $node);
			}

			Debug::dump($record->work);

		}
	}



	private function setContributor($contributor) {

		$newNode = false;

		// Get the index
		$index = Neo4jConnection::getIndex('creators');
		
		$contributorNode = $index->findOne('name', $contributor);

		if (!$contributorNode) {
			$contributorNode = Neo4jConnection::get()->makeNode();
			$contributorNode->save();
			$index->add($contributorNode, 'name', $contributor);
			$newNode = true;
		}

		$contributorNode
			->setProperty('name', $contributor)
			->save();

		// Create relationship (if it doesn't already exist)
		if ($newNode || !$this->relationshipExists($this->node, 'CREATED_BY', $contributorNode)) {
			$this->node->relateTo($contributorNode, 'CREATED_BY')->save();
		}
	}

	public function setTag($tag) {

		$newNode = false;

		// Get the index
		$index = Neo4jConnection::getIndex('tags');
		
		$tagNode = $index->findOne('value', $tag);

		if (!$tagNode) {
			$tagNode = Neo4jConnection::get()->makeNode();
			$tagNode->save();
			$index->add($tagNode, 'value', $tag);
			$newNode = true;
		}

		$tagNode
			->setProperty('name', $tag)
			->save();

		// Create relationship (if it doesn't already exist)
		if ($newNode || !$this->relationshipExists($this->node, 'HAS_TAG', $tagNode)) {
			$this->node->relateTo($tagNode, 'HAS_TAG')->save();
		}
	}

	private function setItemHolding($holdingData) {

		$newNode = false;

		// Get the index
		$index = Neo4jConnection::getIndex('holders');

		$holderNode = $index->findOne('trove_nuc', $holdingData->nuc);

		if (!$holderNode) {
			$holderNode = Neo4jConnection::get()->makeNode();
			$holderNode->save();
			$index->add($holderNode, 'trove_nuc', $holdingData->nuc);
			$newNode = true;
		}

		$holderNode
			->setProperty('trove_nuc', $holdingData->nuc)
			->save();

		// Existing relationships
		if ($newNode || !$this->relationshipExists($this->node, 'HELD_BY', $holderNode)) {
			$this->node->relateTo($holderNode, 'HELD_BY')->save();
		}
	}

	private function setItemPublisher($publisherName) {

		$newNode = false;

		// Get the index
		$index = Neo4jConnection::getIndex('publishers');
		
		// Find an existing publisher node
		$publisherNode = $index->findOne('name', $publisherName);

		// Create the publisher node and add to index if it doesn't exist.
		if (!$publisherNode) {
			$publisherNode = Neo4jConnection::get()->makeNode();
			$publisherNode->save();
			$index->add($publisherNode, 'name', $publisherName);
			$newNode = true;
		}

		$publisherNode
			->setProperty('name', $publisherName)
			->save();

		// Make link
		if ($newNode || !$this->relationshipExists($this->node, 'PUBLISHED_BY', $publisherNode)) {
			$this->node->relateTo($publisherNode, 'PUBLISHED_BY')->save();
		}
		
	}

	public function getFriends() {

	}

	public function findFriends() {
		
		$existingRelationships = $this->node->getRelationships(array('LIKES'), Relationship::DirectionOut);
		// foreach ($existing as $rel) {
		// 	$rel->delete();
		// }

		$potentialFriends = array();

		foreach (array('HELD_BY','HAS_TAG','CREATED_BY') as $relationshipType) {
			$related = $this->getCommonRelationships($relationshipType);

			if (count($related)) {
				$max = $related[0]['common'];
				$min = $related[count($related)-1]['common'];
				
				foreach ($related as $row) {

					if (!isset($potentialFriends[$row['them']->getId()])) {
						$potentialFriends[$row['them']->getId()] = array(
							// 'node' => $row['them']
						);
					}

					$ratio = $this->normalise($min, $max, $row['common']);
					if ($ratio > 0.5) {
						$potentialFriends[$row['them']->getId()][$relationshipType] = $ratio;
						// $this->row->relateTo($row['them'], 'LIKES')->save();
					}
				}
			}

		}

		debug::dump($potentialFriends);
			
	}

	/**
	 * The a result set of nodes with common relationships of the type passed, and how many are in common.
	 * 
	 * @param  string $type The relationship type
	 * @return Everyman\Neo4j\Query\ResultSet The query results
	 */
	private function getCommonRelationships($type) {
		$id = $this->node->getId();

		$neo =Neo4jConnection::get();

		$queryTemplate = "START me=node({id}) MATCH me-[:$type]->rel<-[:$type]-them WHERE NOT (me=them) RETURN them, count(*) AS common ORDER BY common DESC";
		$queryData = array(
			'id' => (int) $id,
			'type' => $type
		);
		$query = new Query($neo, $queryTemplate, $queryData);
		$nodes = $query->getResultSet();
		return $nodes;
	}

	private function normalise($min, $max, $score) {
		$range = $max-$min;
		if ($range === 0) return 0;
		return ($score-$min)/($max-$min);
	}

	/**
	 * Get a CatalogueItem by BIB ID.
	 * If an item with the providid $bib doesn't exists it will be created.
	 * The primary reason for this wrapper is to ensure that new catalogue item nodes are always indexed by bib.
	 */
	public static function get($bib) {

		$index = Neo4jConnection::getIndex('catalogue');

		// Check for existing item
		$itemNode = $index->findOne('bib', $bib);

		// If the work doesn't exist in the DB yet, create it.
		if ( is_null($itemNode) ) {
			$itemNode = Neo4jConnection::get()->makeNode();
			$itemNode->setProperty('bib', $bib);
			$itemNode->save();

			// Add it to the index
			$index->add($itemNode, 'bib', $bib);
		}

		return new CatalogueItem($itemNode);
	}

}