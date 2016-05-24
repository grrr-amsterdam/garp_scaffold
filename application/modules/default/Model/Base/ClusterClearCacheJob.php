<?php
/* This file was generated by Garp_Spawn_Php_Model_Base - do not edit */
class Model_Base_ClusterClearCacheJob extends Garp_Model_Db {
	protected $_name = 'clusterclearcachejob';

	protected $_primary = 'id';

	protected $_configuration = array('id' => 'ClusterClearCacheJob', 'order' => 'created DESC', 'label' => 'Cluster clear cache job', 'description' => null, 'route' => null, 'creatable' => true, 'deletable' => true, 'quickAddable' => false, 'comment' => null, 'visible' => false, 'module' => 'garp', 'fields' => array(array('name' => 'id', 'required' => true, 'type' => 'numeric', 'maxLength' => 8, 'multiline' => null, 'label' => 'Id', 'editable' => false, 'visible' => false, 'default' => null, 'primary' => true, 'unique' => false, 'info' => null, 'index' => true, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'config', 'relationType' => null), array('name' => 'tags', 'required' => true, 'type' => 'text', 'maxLength' => null, 'multiline' => true, 'label' => 'Tags', 'editable' => true, 'visible' => true, 'default' => null, 'primary' => false, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'config', 'relationType' => null), array('name' => 'created', 'required' => true, 'type' => 'datetime', 'maxLength' => null, 'multiline' => null, 'label' => 'Created', 'editable' => false, 'visible' => true, 'default' => null, 'primary' => false, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'behavior', 'relationType' => null), array('name' => 'modified', 'required' => true, 'type' => 'datetime', 'maxLength' => null, 'multiline' => null, 'label' => 'Modified', 'editable' => false, 'visible' => true, 'default' => null, 'primary' => false, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'behavior', 'relationType' => null), array('name' => 'author_id', 'required' => false, 'type' => 'numeric', 'maxLength' => null, 'multiline' => null, 'label' => 'Created by', 'editable' => false, 'visible' => false, 'default' => null, 'primary' => null, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'relation', 'relationType' => 'hasOne'), array('name' => 'modifier_id', 'required' => false, 'type' => 'numeric', 'maxLength' => null, 'multiline' => null, 'label' => 'Modified by', 'editable' => false, 'visible' => false, 'default' => null, 'primary' => null, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'relation', 'relationType' => 'hasOne'), array('name' => 'creator_id', 'required' => true, 'type' => 'numeric', 'maxLength' => null, 'multiline' => null, 'label' => 'Creator', 'editable' => false, 'visible' => false, 'default' => null, 'primary' => null, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'relation', 'relationType' => 'belongsTo')), 'behaviors' => array(), 'relations' => array('Author' => array('model' => 'User', 'name' => 'Author', 'type' => 'hasOne', 'label' => 'Created by', 'limit' => 1, 'column' => 'author_id', 'simpleSelect' => null, 'max' => null, 'paginated' => null, 'multilingual' => null, 'primary' => null, 'info' => null, 'visible' => true, 'editable' => true, 'inverse' => false, 'oppositeRule' => 'Author', 'inverseLabel' => 'ClusterClearCacheJob', 'weighable' => false, 'required' => false, 'inputs' => null, 'inline' => false, 'mirrored' => false, 'bindingModel' => false), 'Creator' => array('model' => 'ClusterServer', 'name' => 'Creator', 'type' => 'belongsTo', 'label' => 'Creator', 'limit' => 1, 'column' => 'creator_id', 'simpleSelect' => null, 'max' => null, 'paginated' => null, 'multilingual' => null, 'primary' => null, 'info' => null, 'visible' => true, 'editable' => true, 'inverse' => true, 'oppositeRule' => 'Creator', 'inverseLabel' => 'ClusterClearCacheJob', 'weighable' => false, 'required' => true, 'inputs' => null, 'inline' => false, 'mirrored' => false, 'bindingModel' => false), 'Modifier' => array('model' => 'User', 'name' => 'Modifier', 'type' => 'hasOne', 'label' => 'Modified by', 'limit' => 1, 'column' => 'modifier_id', 'simpleSelect' => null, 'max' => null, 'paginated' => null, 'multilingual' => null, 'primary' => null, 'info' => null, 'visible' => true, 'editable' => false, 'inverse' => false, 'oppositeRule' => 'Modifier', 'inverseLabel' => 'ClusterClearCacheJob', 'weighable' => false, 'required' => false, 'inputs' => null, 'inline' => false, 'mirrored' => false, 'bindingModel' => false)), 'unique' => null);

	protected $_listFields = array('tags');

	protected $_jointView = 'clusterclearcachejob_joint';

	protected $_defaultOrder = 'created DESC';

	protected $_bindable = array(
		'Model_ClusterServer',
		'Model_User'
	);

	protected $_referenceMap = array(
		'Author' => array(
			'refTableClass' => 'Model_User',
			'columns' => 'author_id',
			'refColumns' => 'id'
		),
		'Creator' => array(
			'refTableClass' => 'Model_ClusterServer',
			'columns' => 'creator_id',
			'refColumns' => 'id'
		),
		'Modifier' => array(
			'refTableClass' => 'Model_User',
			'columns' => 'modifier_id',
			'refColumns' => 'id'
		)
	);


	public function init() {
		parent::init();
		$this->registerObserver(new Garp_Model_Behavior_Timestampable());
		$this->registerObserver(new Garp_Model_Behavior_Authorable());
		$this->registerObserver(new Garp_Model_Validator_NotEmpty(array('tags', 'created', 'modified', 'creator_id')));
	}

}