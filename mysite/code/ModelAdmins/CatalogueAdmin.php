<?php
/**
 * Provide an admin interface for browsing/editing form submission data. *
 */
class CatalogueAdmin extends ModelAdmin {

	public static $managed_models = array(
		'CatalogueItem' => array('title' => 'Catalogue')
	);

	static $url_segment = 'catalogue';
	static $menu_title = 'Catalogue';

	static $model_importers = array(
		'CatalogueItem' => 'CatalogueItemImporter'
	);
	
	/**
	 * Imports the submitted CSV file based on specifications given in
	 * {@link self::model_importers}.
	 * Redirects back with a success/failure message.
	 * 
	 * @todo Figure out ajax submission of files via jQuery.form plugin
	 *
	 * @param array $data
	 * @param Form $form
	 * @param SS_HTTPRequest $request
	 */
	public function import($data, $form, $request) {
		if(!$this->showImportForm || (is_array($this->showImportForm) && !in_array($this->modelClass,$this->showImportForm))) {
			return false;
		}
		
		// Store the import information
		$import = new JobLocumImport();
		$import->write();
		
		// File wasn't properly uploaded, show a reminder to the user
		if(
			empty($_FILES['_CsvFile']['tmp_name']) ||
			file_get_contents($_FILES['_CsvFile']['tmp_name']) == ''
		) {
			$import->Message = _t('ModelAdmin.NOCSVFILE', 'Please browse for a CSV file to import.&nbsp;');
			$import->write();
			$form->sessionMessage($import->Message, 'bad');
			$this->redirectBack();
			return false;
		}
		
		// Load the CSV file
		$importers = $this->getModelImporters();
		$loader = $importers[$this->modelClass];		
		$loader->importerId = $import->ID;
		$results = $loader->load($_FILES['_CsvFile']['tmp_name']);		
		
		$messages = array();
		$importMessage = '';
		if($results->CreatedCount()) $messages[] = _t(
			'ModelAdmin.IMPORTEDRECORDS', "Imported {count} records.&nbsp;",
			array('count' => $results->CreatedCount())
		);
		if($results->UpdatedCount()) $messages[] = _t(
			'ModelAdmin.UPDATEDRECORDS', "Updated {count} records.&nbsp;",
			array('count' => $results->UpdatedCount())
		);		
		if($results->ErrorCount()) {
			$messages[] = _t(
				'ModelAdmin.ERRORRECORDS', "Error occured with {count} fields.&nbsp;",
				array('count' => $results->ErrorCount())
			);		
		}
		
		if(!$results->Count()) $messages[] = _t('ModelAdmin.NOIMPORT', "Nothing to import.&nbsp;");
		$message = implode(' ', $messages);
		// Update the import message
		$importMessage .= $message;
		
		$message .= ' (<a href="' . Controller::join_links($this->Link($this->sanitiseClassName('JobLocumImport')),'EditForm','field',$this->sanitiseClassName('JobLocumImport'),'item',$import->ID,'view') . '">see report</a>)';
		
		// Now, let's add all the error messages
		if($results->ErrorCount()) {			
			$importMessage .= "\n<br/>\n<br/>Error information:\n<br/>";
			foreach($results->Errors() as $error){
				$importMessage .= $error;
			}
		}		
		
		$import->Rows = $results->rows;
		$import->Successful = $results->Count();
		$import->Added = $results->CreatedCount();
		$import->Updated = $results->UpdatedCount();
		$import->Faulty = $import->Rows - $results->Count();
		$import->Message = $importMessage;
		$import->RecruiterID = Member::currentUserID();
		$import->write();

		$form->sessionMessage($message, (!$results->ErrorCount()) ? 'good' : 'bad');
		$this->redirectBack();
	}
}