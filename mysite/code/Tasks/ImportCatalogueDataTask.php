<?php

/**
 * Import catalogue data from a defined location
 * 
 * Creates a basic entry in the SS database and the graph for an item in the catalogue.
 * 
 * This basic entry will be automatically updated later via a scheduled task to try and fill out missing information
 * from additional data sources.
 *
 * The only data we really need here is ISBN, BIB_ID and the APDL tags.
 */
class ImportCatalogueDataTask extends BuildTask {

	public function getDescription() {
		return 'Import the catalogue data';
	}

	public function run($request) {

		$items = array();

		$csv = new CSVParser(dirname(__FILE__) . "/../../../assets/data.csv");
		foreach ($csv as $row) {

			//
			if (!array_key_exists($row['BIB_ID'], $items)) {
				
				// Create the catalogue item object
				$item = CatalogueItem::get()->filter('BIB', $row['BIB_ID'])->first();
				if (is_null($item)) {
					$item = CatalogueItem::create();
				}

				$item->BIB = $row['BIB_ID'];

				if (trim($row['TITLE'])) {
					$item->setNodeProperty('title', trim($row['TITLE']));
				}

				if (trim($row['ISBN'])) {
					// Clean the ISBN field
					preg_match('/[^\s]+/', $row['ISBN'], $match);
					$isbn = $match[0];
					$item->setNodeProperty('isbn', $isbn);
				}

				if (trim($row['AUTHOR'])) {
					$item->setNodeProperty('author', trim($row['AUTHOR']));
				}

				$item->write();

				$items[$row['BIB_ID']] = $item;

			}

			if (trim($row['TAGS'])) {
				$items[$row['BIB_ID']]->setTag(trim($row['TAGS']));
			}
		}
	}
}