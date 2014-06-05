<?php
/**
 * @author David Spreekmeester | grrr.nl
 */
class Garp_Spawn_Behavior_Set {
	const ERROR_BEHAVIOR_NOT_FOUND = "Behavior '%s' could not be found in model '%s'.";

	/**
	 * @var Array $_behaviors Associative array of Garp_Spawn_Behavior objects, where the key is the behavior name.
	 */
	protected $_behaviors = array();

	/**
	 * @var Garp_Spawn_Model_Abstract $_model
	 */
	protected $_model;

	protected $_defaultConditionalBehaviorNames = array(
		'HtmlFilterable',
		'NotEmpty',
		'Email',
		'Translatable'
	);
	
	protected $_validatorBehaviors = array(
		'Email',
		'NotEmpty'
	);


	public function __construct(Garp_Spawn_Model_Abstract $model, array $config) {
		$this->_model = $model;
		$this->_loadConfiguredBehaviors($config);
		$this->_loadDefaultConditionalBehaviors();
	}

	public function getBehaviors() {
		return $this->_behaviors;
	}

	public function getBehavior($name) {
		if (!array_key_exists($name, $this->_behaviors)) {
			$error = sprintf(self::ERROR_BEHAVIOR_NOT_FOUND, $name, $this->getModel()->id);
			throw new Exception($error);
		}

		return $this->_behaviors[$name];
	}
		
	public function displaysBehavior($behaviorName) {
		return array_key_exists($behaviorName, $this->_behaviors);
	}
	
	public function onAfterSingularRelationsDefinition() {
		$this->_addWeighableBehavior();
	}

	/**
	 * @return Garp_Spawn_Model_Abstract
	 */
	public function getModel() {
		return $this->_model;
	}
	
	/**
	 * @param Garp_Spawn_Model_Abstract $model
	 */
	public function setModel($model) {
		$this->_model = $model;
	}

	protected function _add($origin, $behaviorName, $behaviorConfig = null) {
		$behaviorType = $this->_isValidatorBehavior($behaviorName) ? 'Validator' : null;
		$behaviorModule = 'Garp';
		if ($behaviorConfig) {
			$behaviorConfig = (array)$behaviorConfig;
			$behaviorModule = array_key_exists('module', $behaviorConfig) ? $behaviorConfig['module'] : $behaviorModule;
			unset($behaviorConfig['module']);
		}
		
		if (!array_key_exists($behaviorName, $this->_behaviors)) {
			$factory 	= new Garp_Spawn_Behavior_Factory();
			$behavior 	= $factory->produce($this->_model, $origin, $behaviorName, $behaviorConfig, $behaviorType, $behaviorModule);
			$this->_behaviors[$behaviorName] = $behavior;

			//	generate fields which are necessary for this behavior in the accompanying Model
			$generatedFields = $this->_behaviors[$behaviorName]->getFields();
			foreach ($generatedFields as $fieldName => $fieldParams) {
				$this->_model->fields->add('behavior', $fieldName, $fieldParams);
			}			

		} else throw new Exception("The {$behaviorName} behavior is already registered.");
	}

	protected function _isValidatorBehavior($behaviorName) {
		return in_array($behaviorName, $this->_validatorBehaviors);
	}

	protected function _loadConfiguredBehaviors(array $config) {
		foreach ($config as $behaviorName => $behaviorConfig) {
			$this->_add('config', $behaviorName, $behaviorConfig);
		}
	}

	protected function _loadDefaultConditionalBehaviors() {
		$model 				= $this->getModel();
		$behaviorConfig 	= null;
		$behaviorType 		= null;

		foreach ($this->_defaultConditionalBehaviorNames as $behaviorName) {
			if (!$this->_needsConditionalBehavior($behaviorName)) {
				continue;
			}

			$this->_add('default', $behaviorName, $behaviorConfig, $behaviorType);
		}
	}
	
	protected function _needsConditionalBehavior($behaviorName) {
		$model = $this->getModel();
		$class = 'Garp_Spawn_Behavior_Type_' . $behaviorName;
		
		return $class::isNeededBy($model);
	}
		
	/**
	 * Adds the weighable behavior, for user defined sorting of related objects.
	 * Can only be initialized after the relations for this model are set.
	 */
	protected function _addWeighableBehavior() {
		$model = $this->getModel();
		$weighableRels = $model->relations->getRelations('weighable', true);

		if (!$weighableRels) {
			return;
		}

		$weighableConfig = array();

		foreach ($weighableRels as $relName => $rel) {
			$weightColumn = Garp_Spawn_Util::camelcased2underscored($relName) . '_weight';
			$weighableConfig[$relName] = array(
				'foreignKeyColumn' 	=> $rel->column,
				'weightColumn' 		=> $weightColumn
			);
		}

		$this->_add('relation', 'Weighable', $weighableConfig);
	}
}
