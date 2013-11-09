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

			// Associate this contributor node with FAST heading nodes
			foreach ($record->nameInfo->fastHeadings->fast as $fast) {
				$this->associateFastHeading($contributor->getEndNode(), $fast);
			}

			// Associate this contributor node with FAST heading nodes
			foreach ($record->nameInfo->languages->lang as $lang) {
				$this->associateLanguage($contributor->getEndNode(), (string) $lang->attributes()->code);
			}

			// Associate this contributor with related contributors (where they have lccn numbers)
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

	/**
	 * Associate this author with a language
	 * 
	 * @param  [Node] $node The author node
	 * @param  [String] $lang The language code
	 * @return [Node] The language node
	 */
	private function associateLanguage($node, $lang) {
		$newNode = false;

		// Get the index
		$index = Neo4jConnection::getIndex('languages');

		$langNode = $index->findOne('code', $lang);

		if (!$langNode) {
			$langNode = Neo4jConnection::get()->makeNode();
			$langNode->save();
			$index->add($langNode, 'code', $lang);
			$newNode = true;
		}

		$langNode
			->setProperty('code', $lang)
			->save();

		// Create relationship (if it doesn't already exist)
		if ($newNode || !Neo4jConnection::relationshipExists($node, 'ASSOCIATED_WITH_LANG', $langNode)) {
			$node->relateTo($langNode, 'ASSOCIATED_WITH_LANG')->save();
		}
		// Debug::dump($)
		return $langNode;
	}

	/**
	 * Associate an author node with a 'FAST' heading.
	 * 
	 * @param  [Node] $node The Neo4j node for the author/contributor
	 * @param  [SimpleXMLElement] $fast A FAST node returned from WorldCatIdentities
	 * @return [Node] The FAST node in the neo4j graph
	 */
	private function associateFastHeading($node, $fast) {
		$newNode = false;

		// Get the index
		$index = Neo4jConnection::getIndex('fast');

		$subject = (string) $fast;
		$norm = (string) $fast->attributes()->norm;
		
		$fastNode = $index->findOne('norm', $norm);

		if (!$fastNode) {
			$fastNode = Neo4jConnection::get()->makeNode();
			$fastNode->save();
			$index->add($fastNode, 'norm', $norm);
			$newNode = true;
		}

		$fastNode
			->setProperty('norm', $norm)
			->setProperty('subject', $subject)
			->save();

		// Create relationship (if it doesn't already exist)
		if ($newNode || !Neo4jConnection::relationshipExists($node, 'ASSOCIATED_WITH_SUBJECT', $fastNode)) {
			$node->relateTo($fastNode, 'ASSOCIATED_WITH_SUBJECT')->save();
		}
		// Debug::dump($)
		return $fastNode;
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
