<?php 
use Everyman\Neo4j\Node;
use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;
use Everyman\Neo4j\Relationship;
use Everyman\Neo4j\Traversal;

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
		'FriendsUpdated' => 'Int',
		'Title' => 'Varchar(300)',
		'Author' => 'Varchar(300)',
		'ISBN' => 'Varchar(30)',
		'Barcode' => 'Varchar(40)',
		'APDLCategory' => 'Varchar(80)'
	);

	private static $singlular_name = 'Catalogue Item';
	private static $plural_name = 'Catalogue Items';
	
	private static $default_sort = 'BIB';
	
	private static $summary_fields = array('ID', 'BIB','NodeId','Title','Author');	

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
		if (is_null($this->node) && $this->NodeId) {
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
	 * Make sure the BIB makes it through to the graph db
	 * @param string $bib The BIB from the SLQ db
	 */
	public function setBIB($bib) {
		$this->setField('BIB', $bib);
		$this->setNodeProperty('bib', $bib);
	}

	/**
	 * Get the author property from neo4j
	 * @return string The author
	 */
	public function getAuthor() {
		return $this->getNode()->getProperty('author');
	}

	/**
	 * Set the primary category in the graph too.
	 * 
	 * @param string $category The category string
	 */
	public function setAPDLCategory($category) {
		$this->setField('APDLCategory', $category);
		
		$neo = Neo4jConnection::get();
		$existingRel = $this->getNode()->getFirstRelationship(array('APDL_CATEGORY'), Relationship::DirectionOut);
		if ($existingRel && $existingRel->getEndNode()->getProperty('name') !== $category) {
			$existingRel->delete();
		} else {
			if (!$existingRel) {
				$category = Neo4jConnection::getIndex('tags')->findOne('value', $category);
				if ($category) $this->getNode()->relateTo($category, 'APDL_CATEGORY')->save();
			}
		}
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

		$this->NextUpdate = 0;

		$this->extend('onUpdateCatalogueData');

		// Save the update time on the node
		$time = time();
		$this->setNodeProperty('updated', $time);
		$this->write();

		return "Catalogue data updated for: {$this->NodeId}: {$this->Title} by {$this->Author}\n";
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

	public function getLink() {
		return 'view/item/' . $this->BIB;
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
	 * Set a recommendation relationship with a node.
	 * 
	 * @param string $tag The recommendation tag
	 */
	public function setRecommendation($tag) {

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
		if ($newNode || !Neo4jConnection::relationshipExists($this->getNode(), 'RECOMMENDED_BY', $tagNode)) {
			$this->getNode()->relateTo($tagNode, 'RECOMMENDED_BY')->save();
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
		if ($this->NextUpdate === 0 || $this->NextUpdate > $requested) {
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

	public function updateFriends() {

		$output = '';

		$existingRelationships = $this->getNode()->getRelationships(array('LIKES'), Relationship::DirectionOut);
		$remaining = array();
		
		$currentFriends = $this->findFriends();
		$maxNorm = $currentFriends[0]['norm'];
		$minNorm = $currentFriends[count($currentFriends)-1]['norm'];
		
		$neo = Neo4jConnection::get();

		foreach ($currentFriends as $friend) {

			$likes = $neo->getNode($friend['id']);
			$relationship = false;

			// Check if there is an existing like
			foreach ($existingRelationships as $key => $rel) {
				$liked = $rel->getEndNode();
				if ($liked->getId() == $friend['id']) {
					$remaining[] = $key;
					$relationship = $rel;
				}
			}

			// Create a relationship
			if ($relationship === false) {
				$relationship = $this->getNode()->relateTo($likes, 'LIKES');
				$output .= "$this->nodeId now likes " . $likes->getId . "\n";
			}

			$relationship->setProperty('strength', $this->normalise($minNorm, $maxNorm, $friend['norm']));
			$relationship->save();
		}

		// Remove old relationships
		foreach ($existingRelationships as $key => $rel) {
			if (!in_array($key, $remaining)) {
				$rel->delete();
			}
		}

		$this->FriendsUpdated = time();
		$this->write();

		return "Friends updated for: {$this->NodeId}: {$this->Title} by {$this->Author}\n $output";

	}

	public function findFriends() {
		
		$potentialFriends = $this->findPotentialFriends();
		$actualFriends = array();

		$max = null;
		$min = null;
		foreach ($potentialFriends as $id => $friend) {
			$sum = 0;
			foreach ($friend as $type) {
				$sum = $sum + $type['weighted'];
			}
			$avg = $sum/count($friend);

			if (is_null($max) || $avg > $max) $max = $avg;
			if (is_null($min) || $avg < $min) $min = $avg;
			
			$actualFriends[] = array(
				'id' => $id, 
				'sum' => $sum,
				'avg' => $avg
			);
		}

		foreach ($actualFriends as &$friend) {
			$friend['norm'] = $this->normalise($min, $max, $friend['avg']);
		}
		
		usort($actualFriends, array($this, "cmp"));
		// debug::dump($potentialFriends);
		$list = array();
		$min_list = 8;
		$max_normative_count = 0;
		foreach ($actualFriends as $friend) {
			if (
				(
					count($list) < $min_list ||
					$friend['avg'] > .6 ||
					$friend['norm'] > .85
				) && (
					$friend['sum'] > 0 &&
					$max_normative_count <= $min_list
				)
			) {
				$list[] = $friend;
				if ($friend['norm'] == 1) $max_normative_count++;
			} else {
				break;
			}
		}
		

		return $list;
	}

	private function cmp($a, $b) {
			
		$a = $a['avg'];
		$b = $b['avg'];

		if ($a == $b) {
			return 0;
		}
		return ($a > $b) ? -1 : 1;
	}



	/**
	 * Return an array of potential friends. 
	 * 
	 * @return array An array of nodes with a collection of signals about the strength of the relationship with that node.
	 */
	public function findPotentialFriends() {
		$potentialFriends = array();

		$relationshipWeightings = array(
			'HELD_BY' => .5,
			'HAS_TAG' => 1.1,
			'RECOMMENDED_BY' => 2,
			'CREATED_BY' => 1.8,
			'ASSOCIATED_AUTHORS' => 1.5,
			'ASSOCIATED_AUTHOR_SUBJECTS' => .7,
			'ASSOCIATED_AUTHOR_LANGUAGES' => .4
		);

		// For each of the one degree common relationship types, compile a list of raw values.
		foreach (array('HELD_BY','HAS_TAG','CREATED_BY') as $relationshipType) {

			$related = $this->getOneDegreeRelationships($relationshipType);

			if (count($related)) {
				foreach ($related as $row) {

					$relatedNodeId = $row['them']->getId();

					// If this node isn't in the list of potentials yet, add it to the array.
					if (!isset($potentialFriends[$relatedNodeId])) {
						$potentialFriends[$relatedNodeId] = array(
							$relationshipType => array()
						);
					}

					// Record the raw value
					$potentialFriends[$relatedNodeId][$relationshipType]['raw'] = $row['common'];
				}
			}
		}

		// Do the same thing for two degree creator relationships
		foreach (array('ASSOCIATED_AUTHORS','ASSOCIATED_AUTHOR_SUBJECTS','ASSOCIATED_AUTHOR_LANGUAGES') as $relationshipType) {
			$related = $this->getTwoDegreeRelationships('CREATED_BY', $relationshipType);
			if (count($related)) {
				foreach ($related as $row) {

					$relatedNodeId = $row['them']->getId();

					// If this node isn't in the list of potentials yet, add it to the array.
					if (!isset($potentialFriends[$relatedNodeId])) {
						$potentialFriends[$relatedNodeId] = array(
							$relationshipType => array()
						);
					}

					// Record the raw value
					$potentialFriends[$relatedNodeId][$relationshipType]['raw'] = $row['common'];
				}
			}
		}

		$mins = array();
		$maxs = array();

		// Go through each potential friend and add some additional data and zero fill missing relationship data.
		foreach ($potentialFriends as $id => &$friend) {

			// Count of how many relationship types exist with this potential friend.
			$relCount = 0;

			// Go through and zero fill missing relationship types
			foreach ($relationshipWeightings as $rel => $weight) {
				if (isset($friend[$rel]) && $friend[$rel] > 0) {
					$relCount++;
				} else {
					$friend[$rel] = array('raw'=>0);
				}

				// Record max and min for each so we can normalise later.
				if (!isset($mins[$rel]) || $mins[$rel] > $friend[$rel]['raw']) {
					$mins[$rel] = $friend[$rel]['raw'];
				}
				if (!isset($maxs[$rel]) || $maxs[$rel] < $friend[$rel]['raw']) {
					$maxs[$rel] = $friend[$rel]['raw'];
				}
			}
		}

		// Normalise
		foreach ($potentialFriends as $id => &$friend) {
			// Go through and zero fill missing relationship types
			foreach ($relationshipWeightings as $rel => $weight) {
				$friend[$rel]['norm'] = $this->normalise($mins[$rel], $maxs[$rel], $friend[$rel]['raw']);
				$friend[$rel]['weighted'] = $friend[$rel]['norm']*$weight;
			}
		}

		// debug::dump($potentialFriends);

		return $potentialFriends;
	}

	public function removeTimelineEvent($key) {
		$event = $this->getNewOrExistingNode('timeline', 'key', $key);
		$this->removeNodeFromTimeline($event);
		$event->delete();
	}

	private function removeNodeFromTimeline($node) {

		$neo = Neo4jConnection::get();

		// If this event node is already in a linked list, it needs to be removed.
		$existingRels = $node->getRelationships(array('NEXT'), Relationship::DirectionAll);
		if (count($existingRels)) {
			$queryTemplate = "START e=node({id})
				MATCH b-[relBefore:NEXT]->e-[relAfter:NEXT]->a
				CREATE b-[:NEXT]->a
				DELETE relBefore, relAfter";

			$queryData = array(
				'id' => $node->getId()
			);

			$query = new Query($neo, $queryTemplate, $queryData);
			$query->getResultSet();
		}
	}

	/**
	 * Add an event to this item's timeine.
	 */
	public function addTimelineEvent($key, $time, $text) {

		$neo = Neo4jConnection::get();

		// Get a node for this timeline event
		$event = $this->getNewOrExistingNode('timeline', 'key', $key);
		$event
			->setProperty('time', $time)
			->setProperty('text', $text)
			->save();

		// If this event node is already in a linked list, it needs to be removed.
		$this->removeNodeFromTimeline($event);

		$item = $this->getNode();

		// Get a reference to the current status (if there is one)
		$latestEventRel = $item->getFirstRelationship(array('NEXT'), Relationship::DirectionIn);
			
		// If there isn't a latest relationship, this item has no events - start the linked list.
		if (!$latestEventRel) {
			$latestEventRel = $neo->makeRelationship();
			$latestEventRel
				->setStartNode($item)
				->setEndNode($item)
				->setType('NEXT')
				->save();
		}

		$queryTemplate = "START item=node({id}) 
			MATCH item-[:NEXT*0..]->before, // before could be same as item
			after-[:NEXT*0..]->item, // after could be same as item
			before-[old:NEXT]->after
			WHERE ( NOT(HAS(before.time)) OR before.time <= {time} ) 
			AND ( NOT(HAS(after.time)) OR after.time >= {time} )
			RETURN before, after, old";

		$queryData = array(
			'id' => (int) $item->getId(),
			'time' => (int) $time
		);

		$query = new Query($neo, $queryTemplate, $queryData);
		$results = $query->getResultSet();
		
		$results[0]['old']->delete();
		$results[0]['before']->relateTo($event, 'NEXT')->save();
		$event->relateTo($results[0]['after'], 'NEXT')->save();
	}

	// Returns the latest ten timeline nodes.
	public function getTimelineNodes() {
		
		$traversal = new Traversal(Neo4jConnection::get());
		$traversal->addRelationship('NEXT', Relationship::DirectionIn)
			->setPruneEvaluator(Traversal::PruneNone)
		    ->setReturnFilter(Traversal::ReturnAll)
		    ->setMaxDepth(11);

		$timeline = $traversal->getResults($this->getNode(), Traversal::ReturnTypeNode);
		// array_pop($timeline);
		
		return $timeline;
	}

	/**
	 * Query an index for an existing node. If it exists, return it, otherwise create a new
	 * node and add it to the index.
	 * 
	 * @param  [string] $index The name of the index to look up
	 * @param  [string] $key   The key in the index
	 * @param  [string] $value The value in the index
	 * @return [Node] An existing or new node.
	 */
	private function getNewOrExistingNode($index, $key, $value) {

		// Get the index
		$index = Neo4jConnection::getIndex($index);
		
		// Find an existing event node
		$node = $index->findOne($key, $value);

		// Create the publisher node and add to index if it doesn't exist.
		if (!$node) {
			$node = Neo4jConnection::get()->makeNode();
			$node->save();
			$index->add($node, $key, $value);
		}

		return $node;
	}

	/**
	 * Get nodes with common in-bound one-degree relationships of the specified type to this catalogue item.
	 *
	 * For example, all nodes that have one or more tags in common with this item.
	 * 
	 * @param  string $type The relationship type
	 * @return ResultSet The query results
	 */
	private function getOneDegreeRelationships($type) {
		$queryTemplate = "START me=node({id}) 
			MATCH me-[:$type]->rel<-[:$type]-them 
			WHERE NOT (me=them) 
			RETURN them, count(*) AS common";
		$queryData = array(
			'id' => (int) $this->getNode()->getId(),
			'type' => $type
		);
		$query = new Query(Neo4jConnection::get(), $queryTemplate, $queryData);
		return $query->getResultSet();
	}

	private function getTwoDegreeRelationships($type1, $type2) {
		$queryTemplate = "START me=node({id}) 
			MATCH me-[:$type1]->n-[:$type2]->c<-[:$type2]-m<-[:$type1]-them 
			WHERE NOT (me=them) 
			RETURN them, count(*) AS common";
		$queryData = array(
			'id' => (int) $this->getNode()->getId()
		);
		$query = new Query(Neo4jConnection::get(), $queryTemplate, $queryData);
		return $query->getResultSet();
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
		if ($range == 0) return 0;
		return ($score-$min)/($max-$min);
	}

	// Remove dates from the author's name.
	public function sanitiseAuthor($author) {
		return preg_replace('/, [0-9 \.-]+/', '', $author);
	}

}