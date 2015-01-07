<?php
/**
 * Garp_Auth_Adapter_Passwordless
 * Allow token-based, passwordless authentication.
 * Inspired by https://passwordless.net/
 *
 * @author       Harmen Janssen | grrr.nl
 * @version      0.1.0
 * @package      Garp_Auth_Adapter
 */
class Garp_Auth_Adapter_Passwordless extends Garp_Auth_Adapter_Abstract {
	/**
	 * Config key
	 * @var String
	 */
	protected $_configKey = 'passwordless';

	/**
	 * Authenticate a user.
	 * @param Zend_Controller_Request_Abstract $request The current request
	 * @return Array|Boolean User data, or FALSE
	 */
	public function authenticate(Zend_Controller_Request_Abstract $request) {
		if (!$request->isPost()) {
			return $this->acceptToken($request->getParam('token'),
				$request->getParam('uid'));
		}
		return $this->requestToken($request->getPost());
	}

	/**
 	 * Request a new token
 	 * @todo Allow different delivery-methods, such as SMS?
 	 * @todo Allow more
 	 */
	public function requestToken(array $userData) {
		if (empty($userData['email'])) {
			$this->_addError(sprintf(__('%s is a required field'),
				__('Email')));
			return false;
		}
		$userId = $this->_createUserRecord($userData);
	}

	/**
 	 * Accept a user token
 	 * @param String $token
 	 * @param Int $uid User id
 	 */
	public function acceptToken($token, $uid) {
	}

	protected function _createUserRecord(array $userData) {
		$userModel = new Model_User();
		$userData = $userModel->filterColumns($userData);
		return $userModel->insert($userData);
	}
}
