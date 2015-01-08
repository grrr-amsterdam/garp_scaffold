<?php
/**
 * @group Auth
 */
class Garp_Auth_Adapter_PasswordlessTest extends Garp_Test_PHPUnit_TestCase {
	protected $_mockData = array(
		'User' => array(),
		'AuthPasswordless' => array(),
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

	public function testShouldNotInsertDuplicateRecord() {
		$userModel = new Model_User();
		$userId = $userModel->insert(array('email' => 'harmen@grrr.nl'));

		$pwless = new Garp_Auth_Adapter_Passwordless();
		$pwless->requestToken(array('email' => 'harmen@grrr.nl'));

		$users = $userModel->fetchAll();
		$this->assertEquals(1, count($users));
		$this->assertEquals($userId, $users[0]->id);
	}

	public function testShouldCreateAuthRecord() {
		$pwless = new Garp_Auth_Adapter_Passwordless();
		$pwless->requestToken(array('email' => 'harmen@grrr.nl'));

		$userModel = new Model_User();
		$theUser = $userModel->fetchRow();

		$authModel = new Model_AuthPasswordless();
		$authRecord = $authModel->fetchRow();

		$this->assertFalse(is_null($authRecord));
		$this->assertEquals($theUser->id, $authRecord->user_id);
		$this->assertTrue(is_string($authRecord->token));
		$this->assertTrue(strlen($authRecord->token) > 0);
		$this->assertTrue(is_string($authRecord->token_expiration_date));
		$this->assertTrue(strlen($authRecord->token_expiration_date) > 0);
	}

	public function testShouldSendEmail() {
		$pwless = new Garp_Auth_Adapter_Passwordless();
		$pwless->requestToken(array('email' => 'harmen@grrr.nl'));

		$userModel = new Model_User();
		$theUser = $userModel->fetchRow();

		$authModel = new Model_AuthPasswordless();
		$authRecord = $authModel->fetchRow();

		$tokenUrl = new Garp_Util_FullUrl(array(array('method' => 'passwordless'), 'auth_submit')) .
			'?uid=' . $theUser->id . '&token=' . $authRecord->token;

		$storedMessage = file_get_contents(GARP_APPLICATION_PATH .
			'/../tests/tmp/harmen@grrr.nl.tmp');

		$expectedMessage = Garp_Util_String::interpolate($this->_getMockEmailMessage(), array(
			'LOGIN_URL' => $tokenUrl
		));

		// Pass thru actual Mime part, otherwise the two wil never be the same
		$mp = new Zend_Mime_Part($expectedMessage);
        $mp->encoding = Zend_Mime::ENCODING_QUOTEDPRINTABLE;
        $mp->type = Zend_Mime::TYPE_TEXT;
        $mp->disposition = Zend_Mime::DISPOSITION_INLINE;
        $mp->charset = 'iso-8859-1';

		// Just check for the token url. Message is encoded so checking for entire message to be
		// correct is overly complex (and not the responsibility of this unit test).
		$this->assertTrue(strpos($storedMessage, $mp->getContent("\r\n")) !== false);
	}

	protected function _getMockEmailMessage() {
		return "Hi, You can login with the following URL: %LOGIN_URL%. " .
			"Have fun on the website! Kind regards, the team";
	}

	public function generateEmailFilename($transport) {
		return $transport->recipients . '.tmp';
	}

	public function tearDown() {
		parent::tearDown();

		if (file_exists(GARP_APPLICATION_PATH . '/../tests/tmp/harmen@grrr.nl.tmp')) {
			unlink(GARP_APPLICATION_PATH . '/../tests/tmp/harmen@grrr.nl.tmp');
		}

		$this->_helper->injectConfigValues(array(
			'app' => array(
				'domain' => 'testing.example.com'
			),
			'organization' => array(
				'email' => 'harmen@grrr.nl'
			),
			'auth' => array(
				'adapters' => array(
					'passwordless' => array(
						'email_body' => $this->_getMockEmailMessage(),
						'email_subject' => "Here's your login token",
						'email_body_snippet_identifier' => null,
						'email_subject_snippet_identifier' => null,
						'email_transport_method' => 'Zend_Mail_Transport_File',
						'email_transport_options' => array(
							'path' => GARP_APPLICATION_PATH . '/../tests/tmp',
							'callback' => array($this, 'generateEmailFilename')
						)
					)
				)
			)
		));
	}
}
