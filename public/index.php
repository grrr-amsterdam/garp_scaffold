<?php
date_default_timezone_set('Europe/Amsterdam');

require_once('../application/configs/environment.php');

define('BASE_PATH', realpath(dirname(__FILE__) . '/..'));
require_once("../vendor/grrr-amsterdam/garp3/application/init.php");
require_once('../vendor/autoload.php');

// Create application, bootstrap, and run
$application = new Garp_Application(
	APPLICATION_ENV,
	APPLICATION_PATH.'/configs/application.ini'
);
Zend_Registry::set('application', $application);

$application->bootstrap()->run();
