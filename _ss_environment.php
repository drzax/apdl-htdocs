<?php
/* What kind of environment is this: development, test, or live (ie, production)? */
define('SS_ENVIRONMENT_TYPE', 'dev');
 
/* Database connection */
global $database;
define('SS_DATABASE_SERVER', 'localhost');
define('SS_DATABASE_USERNAME', 'root');
define('SS_DATABASE_PASSWORD', 'password');
define('SS_DATABASE_NAME', 'apdl');
$database = SS_DATABASE_NAME;

/* Configure a default username and password to access the CMS on all sites in this environment. */
define('SS_DEFAULT_ADMIN_USERNAME', 'simon@elvery.net');
define('SS_DEFAULT_ADMIN_PASSWORD', 'w1nd0w');
