<?php
<<<<<<< HEAD
ob_start();

abstract class Garp_Test_PHPUnit_ControllerTestCase extends Zend_Test_PHPUnit_ControllerTestCase {
=======
/**
 * Garp_Test_PHPUnit_ControllerTestCase
 * class description
 *
 * @author       Harmen Janssen | grrr.nl
 * @version      0.4.0
 * @package      Garp_Test_PHPUnit
 */
ob_start();

abstract class Garp_Test_PHPUnit_ControllerTestCase extends Zend_Test_PHPUnit_ControllerTestCase {
	/**
 	 * Fixtures
 	 * @var Array
 	 */
	protected $_mockData = array();

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
    public $application;

	/** @var Garp_Test_PHPUnit_Helper */
	protected $_helper;

	public function __construct() {
		$this->_helper = new Garp_Test_PHPUnit_Helper();
		parent::__construct();
	}
<<<<<<< HEAD
	
    public function setUp() {
=======

	public function setUp() {
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		$this->application = new Garp_Application(
			APPLICATION_ENV,
			APPLICATION_PATH.'/configs/application.ini'
		);

		$this->bootstrap = array($this, 'appBootstrap');
<<<<<<< HEAD
		parent::setUp();
	}


    public function appBootstrap() {
        $this->application->bootstrap();
		Zend_Controller_Front::getInstance()->setParam('bootstrap', $this->application->getBootstrap());
		Zend_Registry::set('application', $this->application);
	}
	
	
	public function assertRouteIsAlive($controller, $action, $module = 'default') {
		$params = array(
			'controller' => $controller,
			'action' 	 => $action,
			'module' 	 => $module
		);

	    $url = $this->url($this->urlizeOptions($params));
	    $this->dispatch($url);

	    $this->assertController($params['controller']);
		$this->assertAction($params['action']);
	    $this->assertModule($params['module']);
	}


=======

		$this->_helper->setUp($this->_mockData);
		parent::setUp();
	}

	public function tearDown() {
		$this->_helper->tearDown($this->_mockData);
		parent::tearDown();
	}

	/**
 	 * Overwritten to toss exceptions in your face, so developers don't have to inspect the
 	 * HTML response to see what went wrong.
 	 * We'll skip Zend_Controller_Action_Exceptions though, because they actually provide semantic
 	 * meaning to response. For instance, you can use them to adjust the HTTP status code, which is
 	 * actually a valid response to these exception.
 	 * This method should throw only unexpected exceptions that need fixing right away.
 	 */
    public function dispatch($url = null) {
		$response = parent::dispatch($url);
		if (!$this->getResponse()->isException()) {
			return $response;
		}
		foreach ($this->getResponse()->getException() as $exp) {
			if (!$exp instanceof Zend_Controller_Action_Exception) {
				throw $exp;
			}
		}
		return $response;
	}

	/**
 	 * Convenience method for checking if a given route exists
 	 */
	public function assertRouteIsAlive($controller, $action, $module = 'default') {
	    $url = $this->url($this->urlizeOptions(array(
			'controller' => $controller,
			'action' 	 => $action,
			'module' 	 => $module
		)));
	    $this->dispatch($url);

	    $this->assertController($controller);
		$this->assertAction($action);
	    $this->assertModule($module);
	}

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	public function getDatabaseAdapter() {
		$dbAdapter = $this->getFrontController()
			->getParam('bootstrap')
			->getResource('db')
		;
		return $dbAdapter;
	}
<<<<<<< HEAD
=======

    public function appBootstrap() {
        $this->application->bootstrap();
		Zend_Controller_Front::getInstance()->setParam('bootstrap', $this->application->getBootstrap());
		Zend_Registry::set('application', $this->application);
	}

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
}
