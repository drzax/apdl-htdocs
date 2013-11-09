<?php 

use Everyman\Neo4j\Node;
use Everyman\Neo4j\Client;
use Everyman\Neo4j\Cypher\Query;
use Everyman\Neo4j\Index\NodeIndex;
use Everyman\Neo4j\Relationship;

/**
 * A singleton for neo4j connection establishment and to provide some utilities
 */
class Neo4jConnection {

	private static $conn;
	private static $indexes = array();

	public static function get() {
		if ( ! self::$conn) {
			self::$conn = new Client(NEO4J_SERVER, NEO4J_PORT);
			if (defined('NEO4J_USERNAME') && defined('NEO4J_PASSWORD')) {
				self::$conn->getTransport()->setAuth(NEO4J_USERNAME, NEO4J_PASSWORD);
			}	
		}
		return self::$conn;
	}

	public static function getIndex($name) {
		// Make sure the index exists.
		if ( ! array_key_exists($name, self::$indexes) ) {
			$index = new NodeIndex(self::get(), $name);
			$index->save();
			self::$indexes[$name] = $index;
		}
		
		return self::$indexes[$name];
	}

	/**
	 * Check if a relationship exists between two nodes on the neo4j database.
	 *
	 * @param  Node $start The starting node
	 * @param  string $type  The type of relationship to check for (can be an array)
	 * @param  Node $end The ending node.
	 * @return boolean True if the relationship exists.
	 */
	public static function relationshipExists($start, $type, $end) {

		if (!is_array($type)) {
			$type = array($type);
		}

		$relationships = $start->getRelationships($type, Relationship::DirectionOut);
		foreach ($relationships as $rel) {
			if ($rel->getEndNode()->getId() === $end->getId()) return true;
		}
		return false;
	}
}