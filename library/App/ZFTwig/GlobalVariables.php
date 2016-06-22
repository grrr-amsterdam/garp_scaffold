<?php
class App_ZFTwig_GlobalVariables extends Ano_ZFTwig_GlobalVariables {

    public function getConfig() {
        return Zend_Registry::get('config');
    }

    public function getApplicationPath() {
        return APPLICATION_PATH;
    }

}
