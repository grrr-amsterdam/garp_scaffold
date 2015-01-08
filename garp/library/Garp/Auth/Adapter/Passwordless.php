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
	const DEFAULT_TOKEN_EXPIRATION_TIME = '+30 minutes';

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
		$userId = $this->_createOrFetchUserRecord($userData);
		$token  = $this->_createAuthRecord($userId);

		$this->_sendTokenEmail($userData['email'], $userId, $token);
	}

	/**
 	 * Accept a user token
 	 * @param String $token
 	 * @param Int $uid User id
 	 */
	public function acceptToken($token, $uid) {
	}

	protected function _createOrFetchUserRecord(array $userData) {
		$userModel = new Model_User();
		$userData = $userModel->filterColumns($userData);
		$select = $userModel->select()->where('email = ?', $userData['email']);
		if ($userRecord = $userModel->fetchRow($select)) {
			return $userRecord->id;
		}
		return $userModel->insert($userData);
	}

	protected function _createAuthRecord($userId) {
		$token = $this->_getToken();
		$authPwlessModel = new Model_AuthPasswordless();
		$authPwlessModel->insert(array(
			'user_id' => $userId,
			'token' => $token,
			'token_expiration_date' => $this->_getExpirationDate()
		));
		return $token;
	}

	protected function _getToken() {
		return bin2hex(openssl_random_pseudo_bytes(32));
	}

	protected function _getExpirationDate() {
		if ($this->_getAuthVars() && array_key_exists('token_expires_in', $this->_getAuthVars())) {
			$authVars = $this->_getAuthVars();
			return date('Y-m-d H:i:s', strtotime($authVars['token_expires_in']));
		}
		return date('Y-m-d H:i:s', strtotime(self::DEFAULT_TOKEN_EXPIRATION_TIME));
	}

	// @todo HTML email version
	protected function _sendTokenEmail($email, $userId, $token) {
		$mail = new Zend_Mail();
		$mail->setSubject($this->_getEmailSubject());
		$mail->setBodyText($this->_getEmailBody($userId, $token));
		$mail->setFrom($this->_getEmailFromAddress());
		$mail->addTo($email);
		$transport = $this->_getTransportMethod();
		return $mail->send($transport);
	}

	protected function _getEmailBody($userId, $token) {
		$authVars = $this->_getAuthVars();
		if (!empty($authVars->email_body_snippet_identifier) &&
			$authVars->email_body_snippet_identifier) {
			return $this->_interpolateEmailBody(
				$this->_getSnippet($authVars->email_body_snippet_identifier), $userId, $token);
		}
		if (!empty($authVars->email_body)) {
			return $this->_interpolateEmailBody($authVars->email_body, $userId, $token);
		}

		throw new Garp_Auth_Adapter_Passwordless_Exception('Missing email body: configure a ' .
			'snippet or hard-code a string.');
	}

	protected function _getEmailSubject() {
		$authVars = $this->_getAuthVars();
		if (isset($authVars->email_subject_snippet_identifier) &&
			$authVars->email_subject_snippet_identifier) {
			return $this->_getSnippet($authVars->email_subject_snippet_identifier);
		}
		if (isset($authVars->email_subject) && $authVars->email_subject) {
			return $authVars->email_subject;
		}

		throw new Garp_Auth_Adapter_Passwordless_Exception('Missing email subject: configure a ' .
			'snippet or hard-code a string.');

	}

	protected function _interpolateEmailBody($body, $userId, $token) {
		return Garp_Util_String::interpolate($body, array(
			'LOGIN_URL' => $this->_getLoginUrl($userId, $token)
		));
	}

	/**
 	 * @todo In the future when a global Zend_Mail config is present in config, this can all be
 	 * refactored and just use Zend_Mail using the default app settings for this environment.
 	 */
	protected function _getEmailFromAddress() {
		$authVars = $this->_getAuthVars();
		// Check some sensible default locations for email addresses
		if ($authVars->email_transport_method === 'Garp_Mail_Transport_AmazonSes') {
			return Zend_Registry::get('config')->amazon->ses->fromAddress;
		}
		if (isset($authVars->email_from_address)) {
			return $authVars->email_from_address;
		}
		return Zend_Registry::get('config')->organization->email;
	}

	/**
 	 * @todo In the future when a global Zend_Mail config is present in config, this can all be
 	 * refactored and just use Zend_Mail using the default app settings for this environment.
 	 */
	protected function _getTransportMethod() {
		$authVars = $this->_getAuthVars();
		if (!isset($authVars->email_transport_method)) {
			throw new Garp_Auth_Adapter_Passwordless_Exception('No transport method chosen');
		}
		$options = $authVars->email_transport_options ?: array();
		return new $authVars->email_transport_method($options);
	}

	protected function _getLoginUrl($userId, $token) {
		return new Garp_Util_FullUrl(array(array('method' => 'passwordless'), 'auth_submit')) .
			'?uid=' . $userId . '&token=' . $token;
	}

	protected function _getSnippet($identifier) {
		$snippetModel = new Model_Snippet();
		return $snippetModel->fetchByIdentifier($identifier)->text;
	}

}
