<?php
date_default_timezone_set('Europe/Amsterdam');
define('APPLICATION_ENV', 'testing');
define('MEMCACHE_HOST', null);
define('MEMCACHE_PORT', null);

define('BASE_PATH', realpath(dirname(__FILE__) . '/..'));

error_reporting(-1);
ini_set('log_errors', 0);
ini_set('display_startup_errors', 1);
ini_set('display_errors', 'stderr');

$garpRoot = BASE_PATH . '/vendor/grrr-amsterdam/garp3';
require_once $garpRoot . '/application/init.php';

$application = new Garp_Application(
    APPLICATION_ENV,
    APPLICATION_PATH . '/configs/application.ini'
);

$application->bootstrap();
Zend_Registry::set('application', $application);

$mem = new Garp_Util_Memory();
$mem->useHighMemory();
