<?php
/**
 * @group File
 */
class Garp_File_Storage_S3_Test extends Garp_Test_PHPUnit_TestCase {
	protected $_storage;
	protected $_gzipTestFile = '19209ujr203r20rk409rk2093ir204r92r90.txt';

	public function testShouldGzipOutput() {
		$testContent =  'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
		$this->_storage->store($this->_gzipTestFile, $testContent, true);

		$contents = $this->_storage->fetch($this->_gzipTestFile);
		$this->assertTrue(strlen($contents) > 0);

		// Alas: the service deflates the contents so there's no real checking wether
		// the contents actually arrives gzipped. Still: it's useful to check wether the contents
		// actually deflate to the right string.
		$this->assertEquals($testContent, $contents);
	
	}

	public function testGetList() {
		///////////////
		// This test is disabled by default because of performance.
		return;
		///////////////
		
		
		if (!($cdnConfig = $this->_findFirstS3Config())) {
			return;
		}

		$s3 		= new Garp_File_Storage_S3($cdnConfig, $cdnConfig->path->upload->image);
		$list 		= $s3->getList();
		
		$this->assertTrue((bool)count($list));
	}
	
	protected function _findFirstS3Config() {
		$envs = array('production', 'staging', 'integration', 'development');
		
		foreach ($envs as $env) {
			$ini = new Garp_Config_Ini('application/configs/application.ini', $env);
			if ($ini->cdn->type === 's3') {
				return $ini->cdn;
			}
		}
	}

	public function setUp() {
		$this->_helper->injectConfigValues(array(
			'cdn' => array(
				'gzip' => true,
				's3' => array(
				)
			)
		));
		$this->_storage = new Garp_File_Storage_S3(Zend_Registry::get('config')->cdn, '/');
	}

	public function tearDown() {
<<<<<<< HEAD
		$this->_storage->remove($this->_gzipTestFile);
=======
		if ($this->_storage) {
			$this->_storage->remove($this->_gzipTestFile);
		}
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	}
}
