<?php
/**
 * Garp_ZFTwig_GlobalVariables
 * Global variables for twig templates
 *
 * @package Garp_ZFTwig
 * @author Harmen Janssen <harmen@grrr.nl>
 */
class App_ZFTwig_GlobalVariables extends Ano_ZFTwig_GlobalVariables {

    public function getConfig() {
        return Zend_Registry::get('config');
    }

    public function getApplicationPath() {
        return APPLICATION_PATH;
    }

    public function getVersion() {
        return new Garp_Semver;
    }

}
