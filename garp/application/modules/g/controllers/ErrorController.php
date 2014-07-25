<?php
/**
 * G_ErrorController
 * Handles display and logging of errors
 * @author Harmen Janssen, David Spreekmeester | grrr.nl
 * @version 1
 * @package Garp
 * @subpackage Controllers
 */
class G_ErrorController extends Garp_Controller_Action {
	public function indexAction() {
		$this->_forward('error');
	}

	public function errorAction() {
		$errors = $this->_getParam('error_handler');
		if ($this->getRequest()->isXmlHttpRequest()) {
			$this->_helper->layout->disableLayout();
		}
		if (!$errors) {
			return;
		}
		if (!$this->view) {
            $bootstrap = Zend_Registry::get('application')->getBootstrap();
            $this->view = $bootstrap->getResource('View');  
		}

		switch ($errors->type) { 
			case Zend_Controller_Plugin_ErrorHandler::EXCEPTION_NO_CONTROLLER:
			case Zend_Controller_Plugin_ErrorHandler::EXCEPTION_NO_ACTION:
				// 404 error -- controller or action not found
				$this->getResponse()->setHttpResponseCode(404);
				$this->view->httpCode = 404;
				$this->view->message = 'Page not found';
			break;
			default:
				// application error 
				$this->getResponse()->setHttpResponseCode(500);
				$this->view->httpCode = 500;
				$this->view->message = 'Application error';
			break;
		}

		$this->view->exception = $errors->exception;
		$this->view->request   = $errors->request;

		if (ini_get('display_errors')) {
			$this->view->displayErrors = true;

			if ($errors->exception instanceof Zend_Db_Exception) {
				$profiler = Zend_Db_Table::getDefaultAdapter()->getProfiler();
				if ($profiler && $profiler->getLastQueryProfile()) {
					$this->view->lastQuery = $profiler->getLastQueryProfile()->getQuery();
				}
			}
		} else {
			$this->view->displayErrors = false;

			// Oh dear, this is the production environment. This is serious.
			// Better log the error and mail a crash report to a nerd somewhere.
			if ($this->getResponse()->getHttpResponseCode() != 500) {
				return;
			}
			$errorMessage = "Exception: {$errors->exception->getMessage()}\n\n";
			$errorMessage .= "Stacktrace: {$errors->exception->getTraceAsString()}\n\n";
			$errorMessage .= "Request URL: {$errors->request->getRequestUri()}\n\n";
			// Referer
			if (!empty($_SERVER['HTTP_REFERER'])) {
				$errorMessage .= "Referer: {$_SERVER['HTTP_REFERER']}\n\n";
			} else {
				$errorMessage .= "Referer: n/a\n\n";
			}
			// IP Addr
			if (!empty($_SERVER['REMOTE_ADDR'])) {
				$errorMessage .= "IP address: {$_SERVER['REMOTE_ADDR']}\n\n";
			} else {
				$errorMessage .= "IP address: n/a\n\n";
			}
			// User agent
			if (!empty($_SERVER['HTTP_USER_AGENT'])) {
				$errorMessage .= "User agent: {$_SERVER['HTTP_USER_AGENT']}\n\n";
			} else {
				$errorMessage .= "User agent: n/a\n\n";
			}
			// Request params
			$errorMessage .= 'Request parameters: '.print_r($errors->request->getParams(), true)."\n\n";
			// User data
			$errorMessage .= 'User data: ';

			$auth = Garp_Auth::getInstance();
			if ($auth->isLoggedIn()) {
				$errorMessage .= print_r($auth->getUserData(), true);
			} else {
				$errorMessage .= 'n/a';
			}
			$errorMessage .= "\n\n";

			$this->_logError($errorMessage);
			$this->_mailAdmin($errorMessage);
		}
	}

	/**
 	 * Log that pesky error
 	 * @param String $message
 	 * @return Void
 	 */
	protected function _logError($message) {
		$stream = fopen(APPLICATION_PATH.'/data/logs/errors.log', 'a');
		$writer = new Zend_Log_Writer_Stream($stream);
		$logger = new Zend_Log($writer);
		$logger->log($message, Zend_Log::ALERT);
	}

	/**
 	 * Mail an error to an admin
 	 * @param String $message
 	 * @return Void
 	 */
	protected function _mailAdmin($message) {
		$subjectPrefix = '';
		if (isset($_SERVER) && !empty($_SERVER['HTTP_HOST'])) {
			$subjectPrefix = '['.$_SERVER['HTTP_HOST'].'] ';
		}

		$ini = Zend_Registry::get('config');
		$to = (isset($ini->app) && isset($ini->app->errorReportEmailAddress) && $ini->app->errorReportEmailAddress) ?
			$ini->app->errorReportEmailAddress :
			'garp@grrr.nl'
		;

		mail(
			$to,
			$subjectPrefix.'An application error occurred',
			$message,
			'From: garp@grrr.nl'
		);
	}
}
