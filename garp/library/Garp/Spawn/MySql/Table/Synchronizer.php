<?php
/**
 * @author David Spreekmeester | grrr.nl
 * @package Garp
 * @subpackage MySql
 */
class Garp_Spawn_MySql_Table_Synchronizer {
	/**
	 * @var Garp_Spawn_MySql_Table_Abstract $_source
	 */
	protected $_source;

	/**
	 * @var Garp_Spawn_MySql_Table_Abstract $_target
	 */
	protected $_target;

	/**
	 * @var Garp_Spawn_Model_Abstract $_model
	 */
	protected $_model;

	/**
 	 * @var Garp_Cli_Ui_Protocol $_feedback
 	 */
	protected $_feedback;

	/**
	 * @param 	Garp_Spawn_Model_Abstract 		$model
	 */
	public function __construct(Garp_Spawn_Model_Abstract $model, Garp_Cli_Ui_Protocol $feedback) {
		$tableFactory 	= new Garp_Spawn_MySql_Table_Factory($model);
		$configTable 	= $tableFactory->produceConfigTable();
		$liveTable 		= $tableFactory->produceLiveTable();

		$this->setSource($configTable);
		$this->setTarget($liveTable);
		$this->setModel($model);
		$this->setFeedback($feedback);
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Syncs source and target tables with one another, trying to resolve any conflicts.
	 * @param	Bool	Whether to remove no longer configured columns. This can be triggered
	 * 					separately with the cleanUp() method.
	 * @return 	Bool	In sync
	 */
	public function sync($removeRedundantColumns = true) {
		$target 		= $this->getTarget();
		$keysInSync 	= true;

		$configuredKeys = $this->_getConfiguredKeys();
		$keySyncer		= new Garp_Spawn_MySql_Key_Set_Synchronizer($configuredKeys, $target->keys, $this->getFeedback());
<<<<<<< HEAD
		
		if (!$keySyncer->removeKeys()) {
			$keysInSync = false;
		}
		
		$colsInSync = $this->_syncColumns($target);
		
=======

		if (!$keySyncer->removeKeys()) {
			$keysInSync = false;
		}

		$colsInSync = $this->_syncColumns($target);

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		$i18nTableFork = $this->_detectI18nTableFork();
		if ($i18nTableFork) {
			$dbManager = Garp_Spawn_MySql_Manager::getInstance();
			$dbManager->onI18nTableFork($this->getModel());
		}
<<<<<<< HEAD
		
		if ($removeRedundantColumns) {
			$this->_deleteRedundantColumns();
		}
		
=======

		if ($removeRedundantColumns) {
			$this->_deleteRedundantColumns();
		}

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		if (
			!$keySyncer->addKeys() ||
			!$keySyncer->modifyKeys()
		) {
			$keysInSync = false;
		}
<<<<<<< HEAD
		
		return $colsInSync && $keysInSync;
	}
	
	/**
	 * 
=======

		return $colsInSync && $keysInSync;
	}

	/**
	 *
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	 */
	public function cleanUp() {
		$this->_deleteRedundantColumns();
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * @return Garp_Spawn_MySql_Table_Abstract
	 */
	public function getSource() {
		return $this->_source;
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * @param Garp_Spawn_MySql_Table_Abstract $source
	 */
	public function setSource($source) {
		$this->_source = $source;
<<<<<<< HEAD
	}	
	
=======
	}

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * @return Garp_Spawn_MySql_Table_Abstract
	 */
	public function getTarget() {
		return $this->_target;
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * @param Garp_Spawn_MySql_Table_Abstract $target
	 */
	public function setTarget($target) {
		$this->_target = $target;
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * @return Garp_Spawn_Model_Abstract
	 */
	public function getModel() {
		return $this->_model;
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * @param Garp_Spawn_Model_Abstract $model
	 */
	public function setModel($model) {
		$this->_model = $model;
	}

	/**
	 * @return Garp_Cli_Ui_Protocol
	 */
	public function getFeedback() {
		return $this->_feedback;
	}

	/**
	 * @param Garp_Cli_Protocol $feedback
	 */
	public function setFeedback(Garp_Cli_Ui_Protocol $feedback) {
		$this->_feedback = $feedback;
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	protected function _detectI18nTableFork() {
		$source 	= $this->getSource();
		$target 	= $this->getTarget();
		$model 		= $this->getModel();
<<<<<<< HEAD
		
		if (!$model->isMultilingual()) {
			return false;
		}
		
=======

		if (!$model->isMultilingual()) {
			return false;
		}

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		$multilingualFields = $this->_getMultilingualFields();
		foreach ($multilingualFields as $field) {
			if ($target->columnExists($field->name)) {
				return true;
			}
		}
<<<<<<< HEAD
		
		return false;
	}
	
=======

		return false;
	}

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	protected function _getMultilingualFields() {
		$model 					= $this->getModel();
		$multilingualFields 	= $model->fields->getFields('multilingual', true);

		return $multilingualFields;
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	protected function _syncColumns() {
		$source 	= $this->getSource();
		$target 	= $this->getTarget();
		$sync 		= false;

		if ($source === $target) {
			return true;
		} else {
			if ($source->columns != $target->columns) {
				$this->_resolveColumnConflicts();
			}
			return true;
		}
	}

	protected function _resolveColumnConflicts() {
		$source	= $this->getSource();
		$target = $this->getTarget();
<<<<<<< HEAD
		
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		foreach ($source->columns as $sourceColumn) {
			$target->columnExists($sourceColumn) ?
				$this->_alterColumn($sourceColumn, $target):
				$target->addColumn($sourceColumn)
			;
		}
	}
<<<<<<< HEAD
	
	protected function _alterColumn(Garp_Spawn_MySql_Column $sourceColumn) {
		$diffProperties = $this->_getDiffProperties($sourceColumn);
		$target 		= $this->getTarget();
		
		if (!$diffProperties) {
			return;
		}
		
=======

	protected function _alterColumn(Garp_Spawn_MySql_Column $sourceColumn) {
		$diffProperties = $this->_getDiffProperties($sourceColumn);
		$target 		= $this->getTarget();

		if (!$diffProperties) {
			return;
		}

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		$target->disableFkChecks();
		$this->_ifNullableChangesThenDeleteForeignKeys($sourceColumn, $diffProperties);
		$target->alterColumn($sourceColumn);
		$target->enableFkChecks();
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	protected function _deleteRedundantColumns() {
		$target		= $this->getTarget();

		foreach ($target->columns as $targetColumn) {
			$this->_deleteNoLongerConfiguredColumn($targetColumn);
		}
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	protected function _deleteNoLongerConfiguredColumn(Garp_Spawn_MySql_Column $targetColumn) {
		$source		= $this->getSource();
		$target		= $this->getTarget();
		$progress 	= Garp_Cli_Ui_ProgressBar::getInstance();

		if ($source->columnExists($targetColumn->name)) {
			return;
		}
<<<<<<< HEAD
		
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		if ($this->getFeedback()->isInteractive()) {
			$progress->display("Delete column {$target->name}.{$targetColumn->name}? ");
			if (!Garp_Spawn_Util::confirm()) {
				return;
			}
		}

		$target->deleteColumn($targetColumn);
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	protected function _ifNullableChangesThenDeleteForeignKeys(Garp_Spawn_MySql_Column $sourceColumn, array $diffProperties) {
		$source = $this->getSource();

		if (in_array('nullable', $diffProperties)) {
			foreach ($source->keys->foreignKeys as $fk) {
				if ($fk->localColumn === $sourceColumn->name) {
					Garp_Spawn_MySql_ForeignKey::delete($source->name, $fk);
					$source->keys->droppedForeignKeyNamesDuringColumnSync[] = $fk->name;
					break;
				}
			}
		}
	}
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	protected function _getDiffProperties(Garp_Spawn_MySql_Column $sourceColumn) {
		$target 		= $this->getTarget();
		$targetColumn 	= $target->getColumn($sourceColumn->name);
		$diffProperties = $sourceColumn->getDiffProperties($targetColumn);

		return $diffProperties;
	}

<<<<<<< HEAD
	/** 
=======
	/**
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
 	 * @return Garp_Spawn_MySql_Key_Set
 	 */
	protected function _getConfiguredKeys() {
		$model 					= $this->getModel();
		$source					= $this->getSource();
		$createStatementLines 	= explode("\n", $source->getCreateStatement());

		$keys = $this->_isBindingModel($model) ?
			new Garp_Spawn_MySql_Key_Set(
				$createStatementLines,
				$source->name,
				$model
			) :
			$source->keys
		;

		return $keys;
	}
<<<<<<< HEAD
	
	protected function _isBindingModel(Garp_Spawn_Model_Abstract $model) {
		return get_class($model) === 'Garp_Spawn_Model_Binding';
	}
	
=======

	protected function _isBindingModel(Garp_Spawn_Model_Abstract $model) {
		return get_class($model) === 'Garp_Spawn_Model_Binding';
	}

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
}
