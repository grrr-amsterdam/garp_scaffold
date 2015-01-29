<?php
/**
 * G_Model_Passwordless
 * class description
 *
 * @author       Harmen Janssen | grrr.nl
 * @version      0.1.0
 * @package      G_Model
 */
class G_Model_AuthPasswordless extends Model_Base_AuthPasswordless {
	protected $_name = 'authpasswordless';

	public function init() {
		parent::init();
		$this->registerObserver(new Garp_Model_Behavior_Authenticatable(array($this)));
	}

}
