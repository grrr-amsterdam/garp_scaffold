<?php
/**
 * Configuration scheme for a 'base' model, as opposed to binding models.
 * @author David Spreekmeester | grrr.nl
 */
class Garp_Spawn_Config_Model_Base extends Garp_Spawn_Config_Model_Abstract {
	protected $_defaultBehaviors = array(
		'Timestampable' => null,
		'Authorable' => null
	);
	
	
	public function __construct(
		$id,
		Garp_Spawn_Config_Storage_Interface $storage,
		Garp_Spawn_Config_Format_Interface $format
	) {
		parent::__construct($id, $storage, $format);

		$this->_addIdField();
		$this->_addDefaultBehaviors();
		
		$validator = new Garp_Spawn_Config_Validator_Model_Base();
		$validator->validate($this);
	}
	

	/**
	 * Adds an 'id' field to the model structure.
	 * Make it the primary key if there is no other primary key defined yet.
	 */
	protected function _addIdField() {
		$params = array(
			'type' => 'numeric',
			'editable' => false,
			'visible' => false,
			//	next to being primary, an extra index key is also needed,
			//	to enable the flexibility to modify primary keys.
			'index' => true
		);
		
		$params['primary'] = !$this->_primaryKeyFieldIsPresent();

<<<<<<< HEAD
		$this['inputs']['id'] = $params;
=======
		$this['inputs'] = array('id' => $params) + $this['inputs'];
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	}
	
	
	protected function _primaryKeyFieldIsPresent() {
		foreach ($this['inputs'] as $inputName => $input) {
			if (
				$inputName !== 'id' &&
				array_key_exists('primary', $input) &&
				$input['primary']
			) {
				return true;
			}
		}

		return false;
	}
	
	
	protected function _addDefaultBehaviors() {
		$this['behaviors'] = $this['behaviors'] ?
			array_merge($this['behaviors'], $this->_defaultBehaviors) :
			$this->_defaultBehaviors
		;
	}
<<<<<<< HEAD
}
=======
}
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
