<?php
/**
 * Garp_Config_Ini
 * Complement to Zend_Config_Ini.
 * Creates an ini file from a string instead of a file.
 * I've stolen some methods from Zend_Config_Ini for parsing ini-style configuration strings.
 *
 * @author       David Spreekmeester, Harmen Janssen | grrr.nl
 * @version      1.0
 * @package      Garp_Config
 */
class Garp_Config_Ini extends Zend_Config_Ini {

    public function __construct($filename, $section = null, $options = false) {
		$options['allowModifications'] = true;
		parent::__construct($filename, $section, $options);

		if (isset($this->config)) {
			$this->_mergeSubConfigs($section, $options);
		}
    }

	protected function _mergeSubConfigs($section, $options) {
		foreach ($this->config as $subConfigPath) {
			$subConfig = new Garp_Config_Ini($subConfigPath, $section, $options);
			$this->merge($subConfig);
		}
	}

	/**
 	 * Hacked to allow ini strings as well as ini files.
 	 * @param String|Garp_Config_Ini_String $filename If this is a Garp_Config_Ini_String, an ini string is assumed instead of an ini file.
 	 * @return Array
 	 */
	protected function _parseIniFile($filename) {
		if ($filename instanceof Garp_Config_Ini_String) {
			$ini = $filename->getValue();
			return parse_ini_string($ini);
		}
		return parent::_parseIniFile($filename);
	}

	/**
 	 * Take an ini string to populate the config object. 
 	 * @param String $iniString
 	 * @param String $section
 	 * @param Array $options
 	 * @return Garp_Config_Ini
 	 * @see Zend_Config_Ini::__construct for an explanation of the second and third arguments.
 	 */
	public static function fromString($iniString, $section = null, $options = false) {
		return new Garp_Config_Ini(new Garp_Config_Ini_String($iniString), $section, $options);
	}
}
