<?php
global $project;
$project = 'mysite';
 
// Use _ss_environment.php file for configuration
require_once("conf/ConfigureFromEnv.php");

MySQLDatabase::set_connection_charset('utf8');

// Set the site locale
i18n::set_locale('en_GB');

// Set default theme
SSViewer::set_theme('default');

// Enable nested URLs for this site (e.g. page/sub-page/)
SiteTree::enable_nested_urls();

date_default_timezone_set('Australia/Brisbane');

// Improve default image quality for resized images.
GD::set_default_quality(90);

if (Director::isDev()) {
	SSViewer::flush_template_cache();
}


// Set default email address for admin
Email::setAdminEmail('simon@elvery.net');

// Warnings and errors to log file we can access easily.
SS_Log::add_writer(new SS_LogFileWriter(dirname(__FILE__) . '/logs/errors-' . date('Ymd')), SS_Log::NOTICE, '<=');
$updateWriter = new SS_LogFileWriter(dirname(__FILE__) . '/logs/updates-' . date('Ymd'));
$updateWriter->setFormatter(new UpdateLogFileFormatter());
UpdateLog::add_writer($updateWriter, UpdateLog::NOTICE, '<=');
	

// Configure the CMS editor
HtmlEditorConfig::get('cms')->insertButtonsBefore('bullist','sup','sub');
DateField::set_default_config('showcalendar', true);

