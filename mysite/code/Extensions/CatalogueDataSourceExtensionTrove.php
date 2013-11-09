<?php

class CatalogueDataSourceExtensionTrove extends DataExtension {

	private static $db = array(
		'TroveID' => 'Varchar(300)',
		'TroveLastUpdate' => 'Int'
	);

	private static $updateInterval = 86400; // 24 hours

	/**
	 * Update this Catalogue item using data from the Trove API.
	 * 
	 * @return null
	 */
	public function onUpdateCatalogueData() {

		// Make sure an update is actually required.
		// if ($this->owner->TroveLastUpdate + self::$updateInterval > time()) {
		// 	return;
		// }

		// Instantiate the Trove API connector.
		$trove = new Trove(TROVE_KEY); 
		
		// Get the trove ID for this record
		$id = $this->owner->TroveID;

		// If there isn't already a trove ID, search on ISBN and title .
		if (!$id) {

			$searchTerms = array();

			$isbn = $this->owner->getNode()->getProperty('isbn');
			if ($isbn) $searchTerms[] = 'isbn:'.$isbn;

			$title = $this->owner->getNode()->getProperty('title');
			if ($title) $searchTerms[] = 'title:('.$title.')';

			$author = $this->owner->getNode()->getProperty('author');
			if ($author) $searchTerms[] = 'creator:('.$author.')';

			$result = $trove->search(
				implode(' ', $searchTerms), 			// Search terms
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
			if (isset($result->response->zone[0]->records->work[0]->id)) {
				$id = $result->response->zone[0]->records->work[0]->id;
				$this->owner->TroveID = $id;
			}
		}

		if ($id) {

			$record = $trove->work($id, 'full', array('tags','comments','lists','workversions', 'holdings'));

			// Update the issued year
			if (isset($record->work->version)) {
				foreach ($record->work->version as $version) {
					if (isset($version->issued)) {
						$issued = $version->issued;
						if ($issued && !is_array($issued) && isset($version->record)) {
							if (is_array($version->record)) {
								if (isset($version->record[0]->publisher))
									$publisher = $version->record[0]->publisher;
							} else {
								if (isset($version->record->publisher))
									$publisher = $version->record->publisher;
							}
							$publisher_parts = explode(':', $publisher);
							$publisher = trim(implode(' ', array_reverse($publisher_parts)));
							// todo: Add to timeline
							// Debug::dump("Published by $publisher in $issued.");
						}
					}
				}
			}
			
			// Update the publisher relationships
			foreach ($record->work->version as $version) {
				if (isset($version->record->publisher))	 {
					$this->owner->setItemPublisher($version->record->publisher);	
				}
			}

			// Update the holding relationships
			foreach ($record->work->holding as $holding) {
				if (isset($holding->nuc)) {
					$this->owner->setItemHolding($holding->nuc);
				}
			}

			// Update the contributor relationships
			// Debug::dump($record->work);
			if (isset($record->work->contributor)) {
				$wci = new WorldCatIdentities();
				foreach ($record->work->contributor as $contributor) {
					$contributorRecord = $wci->getRecordByName($contributor);

					if ($contributorRecord && isset($contributorRecord->pnkey)) {
						$this->owner->setItemContributor((string)$contributorRecord->pnkey);
					}
				}
			}
		}

		// Set last update time for our own benefit.
		$this->owner->TroveLastUpdate = time();

		// Set next update time for catalogue item
		$this->owner->setNextUpdateTime(self::$updateInterval);

	}
}