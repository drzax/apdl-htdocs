<?php

use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;
use Everyman\Neo4j\Relationship;

/**
 * The UpdateItem job looks for items in the neo4j database that haven't been updated recently
 * and updates them.
 */
class UpdateItemJob extends AbstractQueuedJob implements QueuedJob {

	private static $updateInterval = 1;
	private static $nodeLimit = 10;

	public function getTitle() {
		return "Update items in the collection from appropriate data sources";
	}

	public function setup() {

		$query = CatalogueItem::get()
			->filter(array(
				'NextUpdate:LessThan' => time()
			))
			->limit(self::$nodeLimit)
			->sort('NextUpdate', 'ASC');

		$remaining = $query
			->map('ID', 'ID')
			->toArray();

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
		$item = CatalogueItem::get()->byID(array_shift($remaining));
		
		// Get the node data
		$item->updateCatalogueData();

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
		$c = __CLASS__;
		$job = new $c();
		singleton('QueuedJobService')->queueJob($job, date('Y-m-d H:i:s', time() + self::$updateInterval));
	}



}