<?php
use Everyman\Neo4j\Node;
use Everyman\Neo4j\Index\NodeIndex;
use Everyman\Neo4j\Relationship;

class MemberExtension extends DataExtension {

	public function addBookmark($bib) {
		$item = CatalogueItem::get()->filter(array(
			'BIB'=>$bib
		))->First();
		
		if ( !$item  ){
			return false;
		}

		// Save the relationship.
		$rel = $item->getNode()->relateTo($this->owner->getNode(), 'LIKED_BY_MEMBER')->save();
		return true;
	}

	/**
	 * Return a reference to the neo4j node object for direct usage.
	 */
	public function getNode() {

		$memberIndex = Neo4jConnection::getIndex('members');
		$memberNode = $memberIndex->findOne('email', $this->owner->Email);

		if (!$memberNode) {
			$memberNode = Neo4jConnection::get()->makeNode();
			$memberNode->setProperty('email', $this->owner->Email);
			$memberNode->setProperty('ssid', $this->owner->ID);
			$memberNode->save();
			$memberIndex->add($memberNode, 'email', $this->owner->Email);
		}

		return $memberNode;
	}

	public function getBookmarks() {
		$node = $this->owner->getNode();
		$rels = $node->getRelationships(array('LIKED_BY_MEMBER'), Relationship::DirectionIn);

		$return = array();
		if ($rels) {
			foreach ($rels as $rel) {
				$return[] = $rel->getStartNode();
			}
		}
		return $return;
	}

	// todo: We need to make sure email is in sync.
	public function onBeforeWrite() {
		// $node = $this->owner->getNode();
	}

}
