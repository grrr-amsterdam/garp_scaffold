<?php
/**
 * Garp_Test_PHPUnit_TestCase
<<<<<<< HEAD
 * Adds some convenience methods to Tests.
 *
 * @author       $Author: harmen $
 * @modifiedby   $LastChangedBy: harmen $
 * @version      $LastChangedRevision: 6134 $
 * @package      Garp
 * @subpackage   Test
 * @lastmodified $LastChangedDate: 2012-08-29 23:32:18 +0200 (Wed, 29 Aug 2012) $
=======
 * Adds some convenience methods to unit tests.
 *
 * @author       Harmen Janssen | grrr.nl
 * @version      0.3.0
 * @package      Garp_Test_PHPUnit
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
 */
abstract class Garp_Test_PHPUnit_TestCase extends PHPUnit_Framework_TestCase {
	/** @var Zend_Db_Adapter_Abstract */
	protected $_db;

	/** @var Garp_Test_PHPUnit_Helper */
	protected $_helper;

<<<<<<< HEAD
=======
	/**
 	 * Fixtures
 	 * @var Array
 	 */
	protected $_mockData = array();

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	public function __construct() {
		$this->_helper = new Garp_Test_PHPUnit_Helper();
		parent::__construct();
	}

	/**
 	 * Get database adapter for executing queries quickly.
 	 * It will be configured as defined in application.ini.
 	 * @return Zend_Db_Adapter_Abstract
 	 */
	public function getDatabaseAdapter() {
		if (!$this->_db) {
			$ini = Zend_Registry::get('config');
			$this->_db = Zend_Db::factory($ini->resources->db);
		}
		return $this->_db;
	}

<<<<<<< HEAD
=======
	public function setUp() {
		$this->_helper->setUp($this->_mockData);
		parent::setUp();
	}

	public function tearDown() {
		$this->_helper->tearDown($this->_mockData);
		parent::tearDown();
	}
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
}
