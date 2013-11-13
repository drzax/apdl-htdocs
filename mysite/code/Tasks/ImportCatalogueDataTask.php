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
		$this->tagData();
		$this->barcodeData();
	}

	private function barcodeData() {
		$items = array();

		$csv = new CSVParser(dirname(__FILE__) . "/../../../assets/data-barcodes.csv");
		foreach ($csv as $row) {

			if (!array_key_exists($row['BIB_ID'], $items)) {
				// Create the catalogue item object
				$item = CatalogueItem::get()->filter('BIB', $row['BIB_ID'])->first();

				// Item should all be created by the tagData function, only populate common fields if it wasn't
				if (is_null($item)) {
					$item = CatalogueItem::create();
					$item->BIB = $row['BIB_ID'];
					$item->Title = $this->sanitiseTitle($row['TITLE']);
					$item->ISBN = $this->sanitiseISBN($row['TAG020']);
					$item->Author = $this->sanitiseAuthor($row['AUTHOR']);
				}

				// Add barcode
				$item->Barcode = $this->sanitiseBarcode($row['ITEM_BARCODE']);
				
				$item->write();

				$items[$row['BIB_ID']] = $item;
			}
		}
	}

	private function tagData() {

		$primaryCategories = array(
			'design thinking',
			'public places',
			'design for better living',
			'fashion',
			'communication design'
		);

		$items = array();

		$csv = new CSVParser(dirname(__FILE__) . "/../../../assets/data-tags.csv");
		foreach ($csv as $row) {

			//
			if (!array_key_exists($row['BIB_ID'], $items)) {
				
				// Create the catalogue item object
				$item = CatalogueItem::get()->filter('BIB', $row['BIB_ID'])->first();
				if (is_null($item)) {
					$item = CatalogueItem::create();
				}

				$item->BIB = $row['BIB_ID'];
				$item->Title = $this->sanitiseTitle($row['TITLE']);
				$item->ISBN = $this->sanitiseISBN($row['ISBN']);
				$item->Author = $this->sanitiseAuthor($row['AUTHOR']);

				$items[$row['BIB_ID']] = $item;

			}

			// Make tag relationship.
			if (trim($row['TAGS'])) {

				// Make generic tag relationships
				$items[$row['BIB_ID']]->setTag(trim($row['TAGS']));

				// Make a primary category relationship if appropriate
				if (in_array(trim($row['TAGS']), $primaryCategories)) {
					$items[$row['BIB_ID']]->setAPDLCategory(trim($row['TAGS']));
				}

				// Make recommendation relationships
				if (strpos($row['TAGS'], 'recommend') !== false) {
					$items[$row['BIB_ID']]->setRecommendation(trim($row['TAGS']));
				}
			}

			$items[$row['BIB_ID']]->write();

		}
	}

	// Remove dates from the author's name.
	private function sanitiseAuthor($author) {
		return preg_replace('/, [0-9 \.-]+/', '', $author);
	}

	// todo: Actually sanitise.
	private function sanitiseBarcode($barcode) {
		return $barcode;
	}

	private function sanitiseISBN($isbn) {
		// Clean the ISBN field
		preg_match('/[^\s]+/', trim($isbn), $match);
		return (isset($match[0])) ? $match[0] : null;
	}

	// Remove author's name
	private function sanitiseTitle($title) {
		$slash = strrpos($title, '/');
		return $slash ? trim(substr($title, 0, $slash)) : trim($title);
	}
}