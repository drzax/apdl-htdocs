<?php 
use Everyman\Neo4j\Node;
use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;
use Everyman\Neo4j\Relationship;

/**
 * Provides a Silverstripe DataObject for catalogue items. This provides a link between
 * the item in Silverstripe's MySQL database and the neo4j database which holds most of
 * the data about items.
 * 
 * Provides a number of functions specific to working with catalogue item nodes.
 */
class CatalogueItem extends DataObject {

	private $node, $catalogueIndex;

	private static $db = array(
		'BIB' => 'Int',
		'NodeId' => 'Int',
		'NextUpdate' => 'Int',
		'Title' => 'Varchar(300)',
		'Author' => 'Varchar(300)',
		'ISBN' => 'Varchar(30)',
		'Barcode' => 'Varchar(40)'
	);

	private static $singlular_name = 'Catalogue Item';
	private static $plural_name = 'Catalogue Items';
	
	private static $default_sort = 'BIB';
	
	private static $summary_fields = array('BIB','NodeId','Title','Author');	

	private $indexedProperties = array(
		'title',
		'author',
		'isbn',
		'oclc_id',
		'trove_id'
	);

	/**
	 * Return a reference to the neo4j node object for direct usage.
	 */
	public function getNode() {

		// If it's null, attempt to get it from Neo4j
		if (is_null($this->node)) {
			$this->node = Neo4jConnection::get()->getNode((int) $this->NodeId);
		}

		// If it's still null, create an empty node
		if (is_null($this->node)) {
			$this->node = Neo4jConnection::get()->makeNode();
		}
		return $this->node;
	}

	/**
	 * Set the neo4j node object for this catalogue item.
	 * 
	 * @param Node|int $node A neo4j Node object or the node's ID.
	 */
	public function setNode($node) {
		if ($node instanceof Node) {
			$this->node = $node;
		} else {
			$this->node = Neo4jConnection::get()->getNode((int) $node);
		}	
	}

	/**
	 * Get the title property from neo4j
	 * @return string The title
	 */
	public function getTitle() {
		return $this->getNode()->getProperty('title');
	}

	/**
	 * Set the title. It goes to two places.
	 * @param string $title The item title
	 */
	public function setTitle($title) {
		$this->setField('Title', $title);
		$this->setNodeProperty('title', $title);
	}

	/**
	 * Set the author. It goes to two places.
	 * @param string $author The item author
	 */
	public function setAuthor($author) {
		$this->setField('Author', $author);
		$this->setNodeProperty('author', $author);
	}

	/**
	 * Set the ISBN. It goes to two places.
	 * @param string $isbn The item ISBN
	 */
	public function setISBN($isbn) {
		$this->setField('ISBN', $isbn);
		$this->setNodeProperty('isbn', $isbn);
	}

	/**
	 * Get the author property from neo4j
	 * @return string The author
	 */
	public function getAuthor() {
		return $this->getNode()->getProperty('author');
	}

	/**
	 * Setter function for properties of this object which are stored in the neo4j
	 * record. 
	 *
	 * Automatically adds properties to indexes.
	 * 
	 * @param string $name The name of the property to set.
	 * @param mixed $value The value to set.
	 */
	public function setNodeProperty($name, $value) {

		// Make sure the index is updated if it should be.
		if (in_array($name, $this->indexedProperties)) {
			$this->indexOn($name, $value);
		}

		return $this->getNode()->setProperty($name, $value);
	}

	/**
	 * Update the node from external data sources.
	 * Each external data source is implemented as an extension on this class.
	 */
	public function updateCatalogueData() {

		$this->extend('onUpdateCatalogueData');

		// Save the update time on the node
		$time = time();
		$this->setNodeProperty('updated', $time);
		$this->write();
	}

	/**
	 * Save the underlying neo4j node back to the database on write.
	 */	
	public function onBeforeWrite() {
		$node = $this->getNode()->save();
		$this->NodeId = $node->getId();
		parent::onBeforeWrite();
	}

	/**
	 * Index this item's neo4j node in the catalogue index with the given key and value
	 * @param  string $key The index key
	 * @param  string $val The index value
	 * @return NodeIndex
	 */
	private function indexOn($key, $val) {

		// Make sure the index exists.
		$catalogueIndex = Neo4jConnection::getIndex('catalogue');
		$node = $this->getNode();

		if (!$node->getId()) {
			$node->save();
		}
		
		return $catalogueIndex->add($node, $key, $val);

	}

	public function setItemContributor($lccn, $name) {

		$newNode = false;

		// Get the index
		$index = Neo4jConnection::getIndex('contributors');
		
		$contributorNode = $index->findOne('lccn', $lccn);

		if (!$contributorNode) {
			$contributorNode = Neo4jConnection::get()->makeNode();
			$contributorNode->save();
			$index->add($contributorNode, 'lccn', $lccn);
			$newNode = true;
		}

		$contributorNode
			->setProperty('lccn', $lccn)
			->setProperty('name', $name)
			->save();

		// Create relationship (if it doesn't already exist)
		if ($newNode || !Neo4jConnection::relationshipExists($this->getNode(), 'CREATED_BY', $contributorNode)) {
			$this->getNode()->relateTo($contributorNode, 'CREATED_BY')->save();
		}
	}

	/**
	 * Relates this catalogue item to a tag node (and creates one if it doesn't exist).
	 *
	 * Tag data comes from the APDL data CSV.
	 * 
	 * @param string $tag The tag to relate to
	 */
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
		if ($newNode || !Neo4jConnection::relationshipExists($this->getNode(), 'HAS_TAG', $tagNode)) {
			$this->getNode()->relateTo($tagNode, 'HAS_TAG')->save();
		}
	}

	/**
	 * Set the next update time for this catalogue item.
	 * 
	 * This funciton is called by the data source extensions and schedules when an item should
	 * be updated again. If the passed timestamp is sooner than the one currently in the database
	 * this will bring the update time forward.
	 *
	 * @param Int $time The maximum number of seconds after now that an update is due.
	 */
	public function setNextUpdateTime($time) {
		$requested = time() + $time;
		if ($this->NextUpdate === 0 || $this->NextUpdate < $requested) {
			$this->NextUpdate = $requested;
		}
	}

	/**
	 * Link this catalogue item to a node representing a holding institution.
	 * 
	 * @param string $institutionId The intitution's identifying string.
	 */
	public function setItemHolding($institutionId) {

		$newNode = false;

		// Get the index
		$index = Neo4jConnection::getIndex('holders');

		$holderNode = $index->findOne('trove_nuc', $institutionId);

		if (!$holderNode) {
			$holderNode = Neo4jConnection::get()->makeNode();
			$holderNode->save();
			$index->add($holderNode, 'trove_nuc', $institutionId);
			$newNode = true;
		}

		$holderNode
			->setProperty('trove_nuc', $institutionId)
			->save();

		// Existing relationships
		if ($newNode || !Neo4jConnection::relationshipExists($this->getNode(), 'HELD_BY', $holderNode)) {
			$this->getNode()->relateTo($holderNode, 'HELD_BY')->save();
		}
	}

	/**
	 * Relate this catalogue item to a publisher node with a PUBLISHED_BY relationship
	 * in the neo4j graph.
	 *
	 * This checks the graph for a node in the 'publishers' index with a 'name' value of 
	 * the $publisherName passed in. Creates the publisher node if it doesn't exist and
	 * creates a relationship with this catalogue item.
	 * 
	 * @param string $publisherName The publisher's name.
	 */
	public function setItemPublisher($publisherName) {

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
		if ($newNode || !Neo4jConnection::relationshipExists($this->getNode(), 'PUBLISHED_BY', $publisherNode)) {
			$this->getNode()->relateTo($publisherNode, 'PUBLISHED_BY')->save();
		}
		
	}

	public function getFriends() {

	}

	public function findFriends() {
		
		$existingRelationships = $this->getNode()->getRelationships(array('LIKES'), Relationship::DirectionOut);
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
	 * Add an event to this item's timeine.
	 */
	public function addTimelineEvent($time, $text) {

	}

	/**
	 * The a result set of nodes with common relationships of the type passed, and how many are in common.
	 * 
	 * @param  string $type The relationship type
	 * @return ResultSet The query results
	 */
	private function getCommonRelationships($type) {
		$neo =Neo4jConnection::get();

		$queryTemplate = "START me=node({id}) MATCH me-[:$type]->rel<-[:$type]-them WHERE NOT (me=them) RETURN them, count(*) AS common ORDER BY common DESC";
		$queryData = array(
			'id' => (int) $this->NodeId,
			'type' => $type
		);
		$query = new Query($neo, $queryTemplate, $queryData);
		$nodes = $query->getResultSet();
		return $nodes;
	}

	/**
	 * A utility function to normalise an arbitrary score.
	 * @param  int $min The minimum score in the set
	 * @param  int $max The maximum score in the set
	 * @param  int $score The score to normalise
	 * @return float A number between 0 and 1.
	 */
	private function normalise($min, $max, $score) {
		$range = $max-$min;
		if ($range === 0) return 0;
		return ($score-$min)/($max-$min);
	}

}