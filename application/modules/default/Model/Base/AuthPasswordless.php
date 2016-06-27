<?php
/* This file was generated by Garp_Spawn_Php_Model_Base - do not edit */
class Model_Base_AuthPasswordless extends Garp_Model_Db {
	protected $_name = 'authpasswordless';

	protected $_primary = 'id';

	protected $_configuration = array('id' => 'AuthPasswordless', 'order' => 'created DESC', 'label' => 'Auth passwordless', 'description' => null, 'route' => null, 'creatable' => true, 'deletable' => true, 'quickAddable' => false, 'comment' => null, 'visible' => false, 'module' => 'garp', 'fields' => array(array('name' => 'id', 'required' => true, 'type' => 'numeric', 'maxLength' => 8, 'multiline' => null, 'label' => 'Id', 'editable' => false, 'visible' => false, 'default' => null, 'primary' => true, 'unique' => false, 'info' => null, 'index' => true, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'config', 'relationType' => null), array('name' => 'token', 'required' => true, 'type' => 'text', 'maxLength' => null, 'multiline' => true, 'label' => 'Token', 'editable' => true, 'visible' => true, 'default' => null, 'primary' => false, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'config', 'relationType' => null), array('name' => 'token_expiration_date', 'required' => true, 'type' => 'datetime', 'maxLength' => null, 'multiline' => null, 'label' => 'Token expiration date', 'editable' => true, 'visible' => true, 'default' => null, 'primary' => false, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'config', 'relationType' => null), array('name' => 'claimed', 'required' => false, 'type' => 'checkbox', 'maxLength' => null, 'multiline' => null, 'label' => 'Claimed', 'editable' => true, 'visible' => true, 'default' => 0, 'primary' => false, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'config', 'relationType' => null), array('name' => 'ip_address', 'required' => false, 'type' => 'text', 'maxLength' => 15, 'multiline' => false, 'label' => 'Ip address', 'editable' => true, 'visible' => true, 'default' => null, 'primary' => false, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'config', 'relationType' => null), array('name' => 'last_login', 'required' => false, 'type' => 'datetime', 'maxLength' => null, 'multiline' => null, 'label' => 'Last login', 'editable' => true, 'visible' => true, 'default' => null, 'primary' => false, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'config', 'relationType' => null), array('name' => 'created', 'required' => true, 'type' => 'datetime', 'maxLength' => null, 'multiline' => null, 'label' => 'Created', 'editable' => false, 'visible' => true, 'default' => null, 'primary' => false, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'behavior', 'relationType' => null), array('name' => 'modified', 'required' => true, 'type' => 'datetime', 'maxLength' => null, 'multiline' => null, 'label' => 'Modified', 'editable' => false, 'visible' => true, 'default' => null, 'primary' => false, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'behavior', 'relationType' => null), array('name' => 'author_id', 'required' => false, 'type' => 'numeric', 'maxLength' => null, 'multiline' => null, 'label' => 'Created by', 'editable' => false, 'visible' => false, 'default' => null, 'primary' => null, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'relation', 'relationType' => 'hasOne'), array('name' => 'modifier_id', 'required' => false, 'type' => 'numeric', 'maxLength' => null, 'multiline' => null, 'label' => 'Modified by', 'editable' => false, 'visible' => false, 'default' => null, 'primary' => null, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'relation', 'relationType' => 'hasOne'), array('name' => 'user_id', 'required' => true, 'type' => 'numeric', 'maxLength' => null, 'multiline' => null, 'label' => 'User', 'editable' => false, 'visible' => false, 'default' => null, 'primary' => null, 'unique' => false, 'info' => null, 'index' => null, 'multilingual' => false, 'comment' => null, 'wysiwyg' => false, 'options' => array(), 'float' => false, 'unsigned' => true, 'rich' => false, 'origin' => 'relation', 'relationType' => 'belongsTo')), 'behaviors' => array(), 'relations' => array('Author' => array('model' => 'User', 'name' => 'Author', 'type' => 'hasOne', 'label' => 'Created by', 'limit' => 1, 'column' => 'author_id', 'simpleSelect' => null, 'max' => null, 'paginated' => null, 'multilingual' => null, 'primary' => null, 'info' => null, 'visible' => true, 'editable' => true, 'inverse' => false, 'oppositeRule' => 'Author', 'inverseLabel' => 'AuthPasswordless', 'weighable' => false, 'required' => false, 'inputs' => null, 'inline' => false, 'mirrored' => false, 'bindingModel' => false), 'Modifier' => array('model' => 'User', 'name' => 'Modifier', 'type' => 'hasOne', 'label' => 'Modified by', 'limit' => 1, 'column' => 'modifier_id', 'simpleSelect' => null, 'max' => null, 'paginated' => null, 'multilingual' => null, 'primary' => null, 'info' => null, 'visible' => true, 'editable' => false, 'inverse' => false, 'oppositeRule' => 'Modifier', 'inverseLabel' => 'AuthPasswordless', 'weighable' => false, 'required' => false, 'inputs' => null, 'inline' => false, 'mirrored' => false, 'bindingModel' => false), 'User' => array('model' => 'User', 'name' => 'User', 'type' => 'belongsTo', 'label' => 'User', 'limit' => 1, 'column' => 'user_id', 'simpleSelect' => null, 'max' => null, 'paginated' => null, 'multilingual' => null, 'primary' => null, 'info' => null, 'visible' => true, 'editable' => true, 'inverse' => true, 'oppositeRule' => 'AuthPasswordless', 'inverseLabel' => 'AuthPasswordless', 'weighable' => false, 'required' => true, 'inputs' => null, 'inline' => false, 'mirrored' => false, 'bindingModel' => false)), 'unique' => null);

	protected $_listFields = array('id', 'ip_address');

	protected $_jointView = 'authpasswordless_joint';

	protected $_defaultOrder = 'created DESC';

	protected $_bindable = array(
		'Model_User'
	);

	protected $_referenceMap = array(
		'Author' => array(
			'refTableClass' => 'Model_User',
			'columns' => 'author_id',
			'refColumns' => 'id'
		),
		'Modifier' => array(
			'refTableClass' => 'Model_User',
			'columns' => 'modifier_id',
			'refColumns' => 'id'
		),
		'User' => array(
			'refTableClass' => 'Model_User',
			'columns' => 'user_id',
			'refColumns' => 'id'
		)
	);


	public function init() {
		parent::init();
		$this->registerObserver(new Garp_Model_Behavior_Timestampable());
		$this->registerObserver(new Garp_Model_Behavior_Authorable());
		$this->registerObserver(new Garp_Model_Validator_NotEmpty(array('token', 'token_expiration_date', 'created', 'modified', 'user_id')));
		$this->registerObserver(new Garp_Model_Behavior_Truncatable(array('columns' => array('ip_address' => 15))));
	}

}