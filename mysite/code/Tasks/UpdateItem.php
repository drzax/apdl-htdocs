<?php

use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;
use Everyman\Neo4j\Relationship;

/**
 * The UpdateItem job looks for items in the neo4j database that haven't been updated recently
 * and updates them.
 */
class UpdateItem extends AbstractQueuedJob implements QueuedJob {

	private static $updateInterval = 1;
	private static $nodeUpdateInterval = 86400;
	private static $nodeLimit = 3;

	private $neo;

	public function getTitle() {
		return "Update items in the collection from appropriate data sources";
	}

	private function neo() {
		return Neo4jConnection::get();
	}

	public function setup() {

		$queryTemplate = 'START n=node(*) WHERE HAS(n.bib) AND (NOT(HAS(n.updated)) OR n.updated < {timestamp}) RETURN n LIMIT {no}';
		$queryData = array(
			'timestamp' => (time()-self::$nodeUpdateInterval), 	// Seven days ago
			'no' => self::$nodeLimit
		);
		$query = new Query($this->neo(), $queryTemplate, $queryData);
		$nodes = $query->getResultSet();

		$remaining = array(); 

		foreach($nodes as $node) {
			$remaining[] = $node['x']->getId();
		}
		$this->remaining = $remaining;
		$this->totalSteps = count($remaining);
	}

	/**
	 * Process a single node
	 */
	public function process() {

		$remaining = $this->remaining;

		// if there's no more, we're done!
		if (!count($remaining)) {
			$this->isComplete = true;
			return;
		}

		$this->currentStep++;

		// lets process our first item - note that we take it off the list of things left to do
		$nodeId = array_shift($remaining);

		$node = Neo4jConnection::get()->getNode($nodeId);

		$item = new CatalogueItem($node);

		// Get the node data
		$item->update();

		// and now we store the new list of remaining children
		$this->remaining = $remaining;

		if (!count($remaining)) {
			$this->isComplete = true;
			return;
		}
	}

	/**
	 * Queue new job
	 */
	public function afterComplete() {
		$job = new UpdateItem();
		singleton('QueuedJobService')->queueJob($job, date('Y-m-d H:i:s', time() + self::$updateInterval));
	}



}