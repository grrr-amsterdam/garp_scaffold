<?php
/**
 * Garp_Auth
 * Handles all kinds of authentication related stuff.
 * @author Harmen Janssen | grrr.nl
 * @modifiedby $LastChangedBy: $
 * @version $Revision: $
 * @package Garp
 * @subpackage Auth
 * @lastmodified $Date: $
 */
class Garp_Auth {
	/**
 	 * Name of the column that stores the user's role
 	 */
	const ROLE_COLUMN = 'role';

<<<<<<< HEAD

=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
 	 * Role when nobody is logged in
 	 */
	const DEFAULT_VISITOR_ROLE = 'visitor';

<<<<<<< HEAD

=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
 	 * Default role when a user is logged in
 	 */
	const DEFAULT_USER_ROLE = 'user';

<<<<<<< HEAD

=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Singleton instance
	 * @var Garp_Auth
	 */
	private static $_instance = null;
<<<<<<< HEAD
	
=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94

	/**
 	 * Storage
 	 * @var Garp_Auth_Store
 	 */
	protected $_store;

<<<<<<< HEAD
	
=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Some config defaults
	 * @var Array
	 */
	protected $_defaultConfigValues = array(
		'loginModule'			=> 'default',
		'loginView'				=> 'login',
		'layoutView'			=> 'layout',
		'loginSuccessUrl'		=> '/',
		'loginSuccessMessage'	=> 'You are successfully logged in',
		'logoutSuccessMessage'	=> 'You are now logged out',
		'salt'                  => 'you should really fill this in application.ini'
	);
<<<<<<< HEAD
	
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Private constructor. Here be Singletons.
	 * @param Garp_Store_Interface $store Session or cookie, for instance
	 * @return Void
	 */
	private function __construct(Garp_Store_Interface $store = null) {
		$this->setStore($store ?: Garp_Store_Factory::getStore('Garp_Auth'));
	}
<<<<<<< HEAD
	
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Get Garp_Auth instance
	 * @param Garp_Store_Interface $store Session or cookie, for instance
	 * @return Garp_Auth
	 */
	public static function getInstance(Garp_Store_Interface $store = null) {
		if (!Garp_Auth::$_instance) {
			Garp_Auth::$_instance = new Garp_Auth($store);
		}
		return Garp_Auth::$_instance;
	}

<<<<<<< HEAD

=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
 	 * Return the currently used storage object
 	 * @return Garp_Store_Interface
 	 */
	public function getStore() {
		return $this->_store;
	}

<<<<<<< HEAD

=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
 	 * Set storage object
 	 * @return Garp_Auth
 	 */
	public function setStore(Garp_Store_Interface $store) {
		$this->_store = $store;
		return $this;
	}
<<<<<<< HEAD
	
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Check if a user is logged in
	 * @return Boolean
	 */
	public function isLoggedIn() {
		$hasUserData    = isset($this->_store->userData);
		$hasLoginMethod = isset($this->_store->method);
		$hasValidToken  = isset($this->_store->token) && $this->validateToken();
		$isLoggedIn     = $hasUserData && $hasLoginMethod && $hasValidToken;

		// Don't leave invalid cookies laying around.
		// Clear data only when data is present, but it is invalid.
		if ($hasUserData && $hasLoginMethod && !$hasValidToken) {
			$this->_store->userData = null;
			$this->_store->method   = null;
		}
		return $isLoggedIn;
	}
<<<<<<< HEAD
	
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Get data from logged in user
	 * @return Array
	 */
	public function getUserData() {
		return $this->_store->userData;
	}
<<<<<<< HEAD
	
	
=======

	/**
 	 * Convenience method for grabbing id of the currently logged in user
 	 * @return Int
 	 */
	public function getUserId() {
		$data = $this->getUserData();
		return !empty($data['id']) ? $data['id'] : null;
	}

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Create a unique token for the currently logged in user.
	 * @param String $input Serialized user data
	 * @return String
	 */
	public function createToken($input) {
		$config = $this->getConfigValues();
		$salt   = $config['salt'];

		$token  = '';
		$token .= !empty($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
		$token .= md5($input);
		$token .= md5($salt);

		/**
 		 * Embed an outline of the User table columns in the token. That way, whenever the database changes,
 		 * all current cookies are made invalid and users have to generate a new cookie afresh by logging in.
 		 * This ensures the user cookies always contain all the columns.
 		 */
		$userModel = new Model_User();
		$columns = $userModel->info(Zend_Db_Table_Abstract::COLS);
		$columns = implode('.', $columns);

		$token .= $columns;
		$token = md5($token);

		return $token;
	}
<<<<<<< HEAD
	
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Validate the current token
	 * @return Boolean
	 */
	public function validateToken() {
		$userData = $this->_store->userData;
		$currToken = $this->_store->token;
		$checkToken = $this->createToken(serialize($userData));
		return $checkToken === $currToken;
	}
<<<<<<< HEAD
	
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Store user data in session
	 * @param Mixed $data The user data
	 * @param String $method The method used to login
	 * @return Void
	 */
	public function store($data, $method = 'db') {
		$token = $this->createToken(serialize($data));
		$this->_store->userData = $data;
		$this->_store->method = $method;
 	 	$this->_store->token = $token;
<<<<<<< HEAD
	}
	
	
=======
		return $this;
	}

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Destroy session, effectively logging out the user
	 * @return Void
	 */
	public function destroy() {
		$this->_store->destroy();
	}
<<<<<<< HEAD
	
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Retrieve auth-related config values from application.ini
	 * @return Array
	 */
	public function getConfigValues() {
		$config = Zend_Registry::get('config');
		// set defaults
		$values = $this->_defaultConfigValues;
		if ($config->auth) {
			$values = array_merge($values, $config->auth->toArray());
		}
		return $values;
	}

<<<<<<< HEAD

=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
 	 * Check if the current user (ARO) has access to a certain controller action or Model CRUD method (ACO).
 	 * Note that this requires 'Zend_Acl' to be available from Zend_Registry.
 	 * @param String $resource A resource
 	 * @param String $privilege A specific privilege within a resource
 	 * @return Boolean
 	 */
	public function isAllowed($resource, $privilege = null) {
		$role = $this->getCurrentRole();
		if (Zend_Registry::isRegistered('Zend_Acl')) {
			$acl = Zend_Registry::get('Zend_Acl');
			return $acl->has($resource) ? $acl->isAllowed($role, $resource, $privilege) : false;
		}
		/**
 		 * Return TRUE when ACL is not in use, to allow for small, quick projects that don't need a configured ACL.
 		 */
		return true;
	}

<<<<<<< HEAD

=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
 	 * Get the role associated with the current session.
 	 * Note that an anonymous session, where nobody is logged in also has a role associated with it.
 	 * @return String The role
 	 */
	public function getCurrentRole() {
		$role = self::DEFAULT_VISITOR_ROLE;
		if ($this->isLoggedIn()) {
			$role = self::DEFAULT_USER_ROLE;
			$data = $this->getUserData();
			if (isset($data[self::ROLE_COLUMN])) {
				$role = $data[self::ROLE_COLUMN];
			}
		}
		return $role;
	}
<<<<<<< HEAD
	
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Return all available roles from the ACL tree.
	 * @param Boolean $verbose Wether to include a role's parents
	 * @return Array A numeric array consisting of role strings
	 */
	public function getRoles($verbose = false) {
		if (Zend_Registry::isRegistered('Zend_Acl')) {
			$acl = Zend_Registry::get('Zend_Acl');
			$roles = $acl->getRoles();

			// collect parents
			if ($verbose) {
				$roles = array_fill_keys($roles, array());
				foreach (array_keys($roles) as $role) {
					$roles[$role]['parents'] = $this->getRoleParents($role);
					$roles[$role]['children'] = $this->getRoleChildren($role);
				}
			}
			return $roles;
		}
		return array();
	}
<<<<<<< HEAD
	
=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94

	/**
 	 * Return the parents of a given role
 	 * @param String $role
 	 * @param Boolean $onlyParents Wether to only return direct parents
 	 * @return Array
 	 */
	public function getRoleParents($role, $onlyParents = true) {
		$parents = array();
		if (Zend_Registry::isRegistered('Zend_Acl')) {
			$acl = Zend_Registry::get('Zend_Acl');
			$roles = $acl->getRoles();

			foreach ($roles as $potentialParent) {
				if ($acl->inheritsRole($role, $potentialParent, $onlyParents)) {
					$parents[] = $potentialParent;
				}
			}
		}
		return $parents;
	}

<<<<<<< HEAD

=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
 	 * Return the children of a given role
 	 * @param String $role
 	 * @return Array
 	 */
	public function getRoleChildren($role) {
		$children = array();
		if (Zend_Registry::isRegistered('Zend_Acl')) {
			$acl = Zend_Registry::get('Zend_Acl');
			$roles = $acl->getRoles();

			foreach ($roles as $potentialChild) {
				if ($acl->inheritsRole($potentialChild, $role)) {
					$children[] = $potentialChild;
				}
			}
		}
<<<<<<< HEAD
		return $children;	
=======
		return $children;
	}

	/**
 	 * Return which columns should be stored in the user session
 	 */
	public function getSessionColumns() {
		$ini = Zend_Registry::get('config');
		$sessionColumns = Zend_Db_Select::SQL_WILDCARD;
		if (!empty($ini->auth->login->sessionColumns)) {
 		   	$sessionColumns = $ini->auth->login->sessionColumns;
 		   	$sessionColumns = explode(',', $sessionColumns);
		}
		return $sessionColumns;
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	}
}
