<?php
function determineEnvironment($host) {
	$regexps = array(
		'/^staging\./' => 'staging',
		'/integration.grrr.nl$/' => 'integration',
		'/^localhost\./' => 'development'
	);
	foreach ($regexps as $re => $env) {
		if (preg_match($re, $host)) {
			return $env;
		}
	}
	return 'production';
}

define('APPLICATION_ENV', (getenv('APPLICATION_ENV') ? getenv('APPLICATION_ENV') :
	determineEnvironment(isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '')));


