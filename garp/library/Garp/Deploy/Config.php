<?php
/**
 * Garp_Deploy_Config
 * Represents a (Capistrano) deploy configuration.
 * 
 * @author David Spreekmeester | grrr.nl
 * @modifiedby $LastChangedBy: $
 * @version $Revision: $
 * @package Garp
 * @subpackage Content
 * @lastmodified $Date: $
 */	
class Garp_Deploy_Config {
<<<<<<< HEAD
	protected $_path;

	protected $_content;

	protected $_deployParams = array('server', 'deploy_to', 'user');


	public function __construct() {
		$this->_setPath();
		$this->_setContent();
=======
	const GENERIC_CONFIG_PATH = '/application/configs/deploy.rb';
	const ENV_CONFIG_PATH = '/application/configs/deploy/';

	protected $_genericContent;

	protected $_deployParams = array(
		'server', 'deploy_to', 'user', 'application', 'repo_url', 'branch'
	);


	public function __construct() {
		$this->_genericContent = $this->_fetchGenericContent();
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	}


	/**
	 * Returns the deploy parameters for a specific environment.
	 *
<<<<<<< HEAD
	 * @param String $environment 	The environment to get parameters for (i.e. 'integration' or 'production').
	 * @return Array				List of deploy parameters:
	 * 									'server' 	=> 'myhost.example.com',
	 *									'deploy_to' => '/var/www/mylittlepony',
	 *									'user' 		=> 'SSH user'
	 */
	public function getParams($environment) {
		$output = array();
		$matches = array();
		$envContent = $this->getContent($environment);

		if (preg_match_all('/:?(?P<paramName>'. implode('|', $this->_deployParams) .'),? "(?P<paramValue>.*)"/', $envContent, $matches)) {
			foreach ($this->_deployParams as $p) {
				$index = array_search($p, $matches['paramName']);
				if ($index !== false) {
					$output[$p] = $matches['paramValue'][$index];
				} else throw new Exception("Did not find the configuration for {$p}, for environment {$environment} in {$this->_path}.");
			}
		} else throw new Exception("Could not extract deploy parameters for {$environment} from {$this->_path}.");
=======
	 * @param String $env The environment to get parameters for
	 *					(i.e. 'integration' or 'production').
	 * @return Array List of deploy parameters:
	 * 					'server' 	=> 'myhost.example.com',
	 *					'deploy_to' => '/var/www/mylittlepony',
	 *					'user' 		=> 'SSH user'
	 */
	public function getParams($env) {
		$genericParams = $this->_parseContent($this->_genericContent);
		$envParams = $this->_parseContent($this->_fetchEnvContent($env));

		$output = $genericParams + $envParams;
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94

		return $output;
	}

<<<<<<< HEAD

	/**
	 * Returns the raw content of the Capistrano deploy configuration (in Ruby).
	 *
	 * @param String [$environment] Optional environment (i.e. 'integration' or 'production') to filter by.
	 */
	public function getContent($environment = null) {
		if ($environment) {
			$envEntryHead = "task :{$environment} do";
			if ($this->isConfigured($environment)) {
				$envStart 		= strpos($this->_content, $envEntryHead) + strlen($envEntryHead);
				$envEnd 		= strpos($this->_content, "\nend", $envStart);
				$envContent 	= trim(substr($this->_content, $envStart, $envEnd - $envStart));

				return $envContent;
			} else {
				throw new Exception("Environment configuration for '{$environment}' not found in {$this->_path}.");
			}			
		} else return $this->_content;
	}
	
	
	/**
	 * Checks if there is a configuration entry for the provided environment.
	 * @param 	String 	$environment 	The environment.
	 * @return 	Bool					Whether this environment has deployment configuration.
	 */
	public function isConfigured($environment) {
		$envEntryHead = "task :{$environment} do";
		return (bool)preg_match("/\n[^#]{$envEntryHead}/", $this->_content);
	}


	protected function _setPath() {
		$this->_path = APPLICATION_PATH . DIRECTORY_SEPARATOR . 'configs' . DIRECTORY_SEPARATOR . 'deploy.rb';
	}


	protected function _setContent() {
		$this->_content = file_get_contents($this->_path);
	}
}
=======
	/**
 	 * Parses the generic configuration.
 	 * @param String $content
 	 * @return Array
 	 */
	protected function _parseContent($content) {
		$output = array();
		$matches = array();
		$paramsString = implode('|', $this->_deployParams);
		$pattern = '/:?(?P<paramName>'. $paramsString
			.')[,:]? [\'"](?P<paramValue>[^\'"]*)[\'"]/';

		if (!preg_match_all($pattern, $content, $matches)) {
			throw new Exception(
				"Could not extract deploy parameters from "
				. self::GENERIC_CONFIG_PATH
			);
		}

		foreach ($this->_deployParams as $p) {
			$index = array_search($p, $matches['paramName']);
			if ($index !== false) {
				$output[$p] = $matches['paramValue'][$index];
			}
		}

		return $output;
	}

	
	/**
	 * Returns the raw content of the Capistrano
	 * deploy configuration (in Ruby) per environment.
	 *
	 * @param String $env Environment (i.e. 'integration'
	 * or 'production') of which to retrieve config params.
	 */
	protected function _fetchEnvContent($env) {
		$envPath = BASE_PATH . self::ENV_CONFIG_PATH . $env . '.rb';
		$envConfig = file_get_contents($envPath);

		if ($envConfig === false) {
			throw new Exception(
				"Could not read the configuration file for "
				. "the '{$env}' environment."
			);
		}

		return $envConfig;
	}
	
	protected function _fetchGenericContent() {
		return file_get_contents(BASE_PATH . self::GENERIC_CONFIG_PATH);
	}
}
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
