<?php

use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;
use Everyman\Neo4j\Relationship;

class API extends Controller {

	private static $allowed_actions = array(
		'graph'
	);

	public function graph() {

		$neo = Neo4jConnection::get();

		$index = Neo4jConnection::getIndex('catalogue');

		$queryTemplate = 'START n=node(*) WHERE HAS(n.bib) RETURN n LIMIT 1';

		$queryData = array(
			
		);

		$query = new Query($neo, $queryTemplate, $queryData);
		$nodes = $query->getResultSet();
debug::dump($nodes);
		// return 'bam';
	}

}