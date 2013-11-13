<?php

/**
 * Description of Page
 *
 * @author Simon
 */
class ItemPage extends Page {
}

class ItemPage_Controller extends Page_Controller {

	private static $allowed_actions = array('item');
	
	public function item() {
		// Debug::dump($this->request);
		$item = CatalogueItem::get()->filter(array(
			'BIB'=>$this->request->param('ID')
		))->First();
		
		if ( !$item  ){
			return $this->httpError('404');
		}
		
		return $this->customise($item);

	}


}
