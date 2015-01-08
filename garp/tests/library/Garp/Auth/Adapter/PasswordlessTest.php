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

	public function testShouldFailOnFalsyParams() {
		$pwless = new Garp_Auth_Adapter_Passwordless();
		$response = $pwless->acceptToken(null, null);
		$this->assertFalse($response);
		$this->assertEquals($pwless->getErrors(), array(__('Insufficient data received')));
	}

	public function testShouldFailOnInvalidToken() {
		$pwless = new Garp_Auth_Adapter_Passwordless();
		$response = $pwless->acceptToken('19398829849', 1);
		$this->assertFalse($response);
		$this->assertEquals($pwless->getErrors(), array(__('passwordless token not found')));
	}

	public function testShouldFailOnStrangersToken() {
		$userModel = new Model_User();
		$userModel->insert(array('email' => 'henk@grrr.nl', 'id' => 1));
		$userModel->insert(array('email' => 'jaap@grrr.nl', 'id' => 2));
		$authModel = new Model_AuthPasswordless();
		$authModel->insert(array('token' => '12345', 'token_expiration_date' => date('Y-m-d H:i:s', strtotime('+30 minutes')), 'user_id' => 2));

		$pwless = new Garp_Auth_Adapter_Passwordless();
		$response = $pwless->acceptToken('12345', 1);
		$this->assertFalse($response);
		$this->assertEquals($pwless->getErrors(), array(__('passwordless token not found')));
	}

	public function testShouldFailOnExpiredToken() {
		instance(new Model_User())->insert(array(
			'id' => 5,
			'email' => 'henk@grrr.nl'
		));
		instance(new Model_AuthPasswordless())->insert(array(
			'user_id' => 5,
			'token' => 'abc',
			'token_expiration_date' => date('Y-m-d H:i:s',
				strtotime('-1 hour'))
		));

		$pwless = new Garp_Auth_Adapter_Passwordless();
		$response = $pwless->acceptToken('abc', 5);
		$this->assertFalse($response);
		$this->assertEquals(array(__('passwordless token expired')),
			$pwless->getErrors());
	}

	public function testShouldAcceptValidToken() {
		$pwless = new Garp_Auth_Adapter_Passwordless();
		$response = $pwless->requestToken(array('email' => 'harmen@grrr.nl'));

		$userId = instance(new Model_User)->fetchRow()->id;
		$token  = instance(new Model_AuthPasswordless)->fetchRow()->token;

		$response = $pwless->acceptToken($token, $userId);
		$this->assertTrue($response instanceof Garp_Db_Table_Row);
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
