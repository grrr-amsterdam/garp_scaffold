<?php
/**
 * Garp_Auth_Adapter_Facebook
 * Authenticate using Facebook (using oAuth)
 * @author Harmen Janssen | grrr.nl
 * @modifiedby $LastChangedBy: $
 * @version $Revision: $
 * @package Garp
 * @subpackage Auth
 * @lastmodified $Date: $
 */
class Garp_Auth_Adapter_Facebook extends Garp_Auth_Adapter_Abstract {
	protected $_configKey = 'facebook';
<<<<<<< HEAD
	
	
=======


>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Authenticate a user.
	 * @param Zend_Controller_Request_Abstract $request The current request
	 * @return Array|Boolean User data, or FALSE
	 */
	public function authenticate(Zend_Controller_Request_Abstract $request) {
		$facebook = $this->_getFacebookClient();
<<<<<<< HEAD
		
		/**
		 * Send the user to Facebook to login and give us access.
		 * This happens when the form on the login page gets posted. 
=======
		$authVars = $this->_getAuthVars();

		/**
		 * Send the user to Facebook to login and give us access.
		 * This happens when the form on the login page gets posted.
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		 * Then this request will be made one more time; when the user comes back from Facebook.
		 * At that point he might has given us access, which is
		 * checked in the try {...} catch(){...} block below.
		 * Just note that any POST request here results in the user being redirected to Facebook.
		 */
		if ($request->isPost()) {
			$redirector = Zend_Controller_Action_HelperBroker::getStaticHelper('redirector');
<<<<<<< HEAD
			$redirector->gotoUrl($facebook->getLoginUrl());
			exit;
		}
		
		// Session based API call.
		try {
			$userData = $facebook->login();
			$userData = $this->_getUserData($userData);

			$authVars = $this->_getAuthVars();
=======
			$scope = isset($authVars->scope) ? $authVars->scope : null;
			$redirector->gotoUrl($facebook->getLoginUrl(array(
				'scope' => $scope
			)));
			exit;
		}

		// Session based API call.
		try {
			$userData = $facebook->login(!!$authVars->grabUserImage);
			$userData = $this->_getUserData($userData);

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
			// Automatically fetch friends if so configured.
			if (!empty($authVars->friends->collect) && $authVars->friends->collect) {
				$bindingModel = 'Model_UserUser'; // A Sensible Default™
				if (empty($authVars->friends->bindingModel)) {
					$bindingModel = $authVars->friends->bindingModel;
				}
				$facebook->mapFriends(array(
					'bindingModel' => $bindingModel,
					'user_id'      => $userData['id']
				));
			}
			return $userData;
		} catch (FacebookApiException $e) {
			$this->_addError($e->getMessage());
			return false;
		} catch (Exception $e) {
<<<<<<< HEAD
			$this->_addError('Er is een onbekende fout opgetreden. Probeer het later opnieuw.');
			return false;
		}
	}
	
	
=======
			if (strpos($e->getMessage(), 'Duplicate entry') !== false &&
				strpos($e->getMessage(), 'email_unique') !== false) {
				$this->_addError(__('this email address already exists'));
				return false;
			}
			$this->_addError(__('login error'));
			return false;
		}
	}


>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Store the user's profile data in the database, if it doesn't exist yet.
	 * @param Array $facebookData The profile data received from Facebook
	 * @return Void
	 */
	protected function _getUserData(array $facebookData) {
		$uid = $facebookData['id'];
		$ini = Zend_Registry::get('config');
		$sessionColumns = Zend_Db_Select::SQL_WILDCARD;
		if (!empty($ini->auth->login->sessionColumns)) {
 		   	$sessionColumns = $ini->auth->login->sessionColumns;
 		   	$sessionColumns = explode(',', $sessionColumns);
		}
		$userModel = new Model_User();
		$userConditions = $userModel->select()->from($userModel->getName(), $sessionColumns);
		$model = new G_Model_AuthFacebook();
		$model->bindModel('Model_User', array('conditions' => $userConditions));
		$userData = $model->fetchRow(
			$model->select()
				  ->where('facebook_uid = ?', $uid)
		);
 		if (!$userData || !$userData->Model_User) {
			$userData = $model->createNew(
				array(
					'facebook_uid' => $uid,
					'access_token' => $facebookData['access_token'],
				),
				$this->_mapProperties($facebookData)
			);
		} else {
			$model->updateLoginStats($userData->user_id, array(
				'access_token' => $facebookData['access_token'],
			));
			$userData = $userData->Model_User;
		}
		return $userData;
	}
<<<<<<< HEAD
	
	
=======


>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Load Facebook's own client
	 * @return Facebook
	 */
	protected function _getFacebookClient() {
		$authVars = $this->_getAuthVars();
		$facebook = Garp_Social_Facebook::getInstance(array(
			'appId'  => $authVars->appId,
			'secret' => $authVars->secret,
			'cookie' => false,
		));
		return $facebook;
	}
}
