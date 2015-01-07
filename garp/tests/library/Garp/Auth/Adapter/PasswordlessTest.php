<?php
/**
 * @group Auth
 */
class Garp_Auth_Adapter_PasswordlessTest extends Garp_Test_PHPUnit_TestCase {
	protected $_mockData = array(
		'User' => array()
	);

	public function testShouldFailWithoutEmail() {
		$pwless = new Garp_Auth_Adapter_Passwordless();
		$pwless->requestToken(array());
		$this->assertTrue(count($pwless->getErrors()) > 0);
	}

	public function testShouldCreateUserRecord() {
		$pwless = new Garp_Auth_Adapter_Passwordless();
		$pwless->requestToken(array('email' => 'harmen@grrr.nl'));

		$userModel = new Model_User();
		$theUser = $userModel->fetchRow();
		$this->assertFalse(is_null($theUser));
		$this->assertEquals('harmen@grrr.nl', $theUser->email);
	}

	public function tearDown() {
		parent::tearDown();
	}
}
