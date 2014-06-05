<?php
/**
 * Garp_Shell_Command_DatabaseExists
 * Executing this command results in an empty string if database does not exist.
 * If it does exist, the name of the database is returned, in mysql column format.
 * @author David Spreekmeester | Grrr.nl
 */
class Garp_Shell_Command_DatabaseExists extends Garp_Shell_Command_Abstract {
	const COMMAND_QUERY = "mysql -u'%s' -p'%s' --host='%s' -e '%s'";
	const QUERY = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = \"%s\"";

	/**
	 * @var Zend_Config $_dbConfigParams
	 */
	protected $_dbConfigParams;


	public function __construct(Zend_Config $dbConfigParams) {
		$this->setDbConfigParams($dbConfigParams);
	}

	public function getDbConfigParams() {
		return $this->_dbConfigParams;
	}

	public function setDbConfigParams(Zend_Config $dbConfigParams) {
		$this->_dbConfigParams = $dbConfigParams;
	}

	public function render() {
		$dbConfig 	= $this->getDbConfigParams();
		$query = sprintf(self::QUERY, $dbConfig->dbname);

		$dumpCommand = sprintf(
			self::COMMAND_QUERY,
			$dbConfig->username,
			$dbConfig->password,
			$dbConfig->host,
			$query
		);
		
		return $dumpCommand;
	}
	
}