<?php
/**
 * Garp_Store_Array
 * Store elements in an array.
 * Note: this is not a persistent store. Use it only for Unit Tests.
 *
 * @author       $Author: harmen $
 * @modifiedby   $LastChangedBy: harmen $
 * @version      $LastChangedRevision: 6148 $
 * @package      Garp
 * @subpackage   Store
 * @lastmodified $LastChangedDate: 2012-09-03 10:52:37 +0200 (Mon, 03 Sep 2012) $
 */
class Garp_Store_Array implements Garp_Store_Interface {
	/**
 	 * @var Array
 	 */
	protected $_data = array();


	/**
 	 * Namespace used to store data.
 	 * @var String
 	 */
	protected $_namespace;


	/**
 	 * Class constructor
 	 * @param String $namespace Global namespace
 	 * @return Void
 	 */
	public function __construct($namespace) {
		$this->_namespace = $namespace;
		$this->_data[$this->_namespace] = array();
	}


	/**
 	 * Get value by key $key
 	 * @param String $key
 	 * @return Mixed
 	 */
	public function get($key) {
		return array_key_exists($key, $this->_data[$this->_namespace]) ?
<<<<<<< HEAD
			$this->_data[$this->_namespace] :
=======
			$this->_data[$this->_namespace][$key] :
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
			null
		;
	}


	/**
 	 * Store $value by key $key
 	 * @param String $key
 	 * @param Mixed $value
 	 * @return $this
 	 */
	public function set($key, $value) {
<<<<<<< HEAD
		$this->_data[$this->_namespace][$key] = $key;
=======
		$this->_data[$this->_namespace][$key] = $value;
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		return $this;
	}		


	/**
 	 * Magic getter
 	 * @param String $key
 	 * @return Mixed
 	 */
	public function __get($key) {
		return $this->get($key);
	}


	/**
 	 * Magic setter
 	 * @param String $key
 	 * @param Mixed $value
 	 * @return Void
 	 */
	public function __set($key, $value) {
		return $this->set($key, $value);
	}


	/**
 	 * Magic isset
 	 * @param String $key
 	 * @return Boolean
 	 */
	public function __isset($key) {
		return isset($this->_data[$this->_namespace][$key]);
	}


	/**
 	 * Magic unset
 	 * @param String $key
 	 * @return Void
 	 */
	public function __unset($key) {
		$this->destroy($key);
	}


	/**
 	 * Remove a certain key from the store
 	 * @param String $key
 	 * @return $this
 	 */
	public function destroy($key = false) {
		if ($key) {
			unset($this->_data[$this->_namespace][$key]);
		} else {
			$this->_data[$this->_namespace] = array();
		}
		return $this;
	}
<<<<<<< HEAD
=======

	public function toArray() {
		return $this->_data[$this->_namespace];
	}
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
}
