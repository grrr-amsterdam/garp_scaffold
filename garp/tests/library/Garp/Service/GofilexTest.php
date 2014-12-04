<?php
/**
 * @author Harmen Janssen | Grrr.nl
 * This class tests Garp_Service_Gofilex
 */
class Garp_Service_GofilexTest extends PHPUnit_Framework_TestCase {
	/**
 	 * Gofilex service object
 	 * @var Garp_Service_Gofilex
 	 */
	protected $_service;


	public function setUp() {
		$wdsl = 'http://82.94.241.186:34/GofilexC.nsf/GofilexCOD?WSDL';
		$this->_service = new Garp_Service_Gofilex($wdsl);
	}


	public function testShouldReceiveArrayOfMovies() {
		$movies = $this->_service->getMovies();
<<<<<<< HEAD
		$this->assertInternalType('array', $movies);
=======
		$this->assertTrue(is_array($movies));
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	}


	public function testShouldReceiveArrayOfTheaters() {
		$theaters = $this->_service->getTheaters();
<<<<<<< HEAD
		$this->assertInternalType('array', $theaters);
=======
		$this->assertTrue(is_array($theaters));
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	}
}
