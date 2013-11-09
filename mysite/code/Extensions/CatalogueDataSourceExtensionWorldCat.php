<?php
use Everyman\Neo4j\Node;
use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;
use Everyman\Neo4j\Relationship;

/**
 * Update this catalogue record from the WorldCat data sources.
 *
 * The first thing this does is attempt to find an author record and associate the book with 
 * and author node. From there each author node gets associated with subjects and other authors.
 */
class CatalogueDataSourceExtensionWorldCat extends DataExtension {

	private static $db = array(
		'WorldCatLastUpdate' => 'Int'
	);

	private static $updateInterval = 86400; // 24 hours

	/**
	 * Update this Catalogue item using data from the Trove API.
	 * 
	 * @return null
	 */
	public function onUpdateCatalogueData() {
		$wci = new WorldCatIdentities();

		$contributors = $this->owner->getNode()->getRelationships(array('CREATED_BY'), Relationship::DirectionOut);
		foreach($contributors as $contributor) {
			$lccn = $contributor->getEndNode()->getProperty('lccn');

			$record = $wci->getRecord($lccn);

			if (isset($record->associatedNames->name)) {
				foreach ($record->associatedNames->name as $name) {
					$norm = (string) $name->normName;
					$raw = (string) $name->rawName->suba;
					if (substr($norm, 0, 5) === 'lccn-') {
						$this->associateName($contributor->getEndNode(), $norm, $raw);
					}
				}
			}
		}

		// Set last update time for our own benefit.
		$this->owner->WorldCatLastUpdate = time();

		// Set next update time for catalogue item
		$this->owner->setNextUpdateTime(self::$updateInterval);
	}

	private function associateName($node, $lccn, $name) {

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
		if ($newNode || !Neo4jConnection::relationshipExists($node, 'ASSOCIATED_WITH', $contributorNode)) {
			$node->relateTo($contributorNode, 'ASSOCIATED_WITH')->save();
		}

		return $contributorNode;
	}


}
