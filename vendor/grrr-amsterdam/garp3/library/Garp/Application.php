<?php
/**
 * Garp_Application
 * Provides the extra functionality of being able to cache config files.
 *
 * @package Garp
 * @author  Harmen Janssen <harmen@grrr.nl>
 */
class Garp_Application extends Zend_Application {
    const UNDERCONSTRUCTION_LOCKFILE = 'underconstruction.lock';

    /**
     * Load configuration file of options.
     *
     * Optionally will cache the configuration.
     *
     * @param  string $file
     * @throws Zend_Application_Exception When invalid configuration file is provided
     * @return array
     */
    protected function _loadConfig($file) {
        $suffix = pathinfo($file, PATHINFO_EXTENSION);
        $suffix = ($suffix === 'dist') ?
                    pathinfo(basename($file, ".$suffix"), PATHINFO_EXTENSION) : $suffix;
        if ($suffix == 'ini') {
            $config = Garp_Config_Ini::getCached($file)->toArray();
        } else {
            $config = parent::_loadConfig($file);
        }
        return $config;
    }

    public function bootstrap($resource = null) {
        Zend_Registry::set('config', new Zend_Config($this->getOptions()));
        return parent::bootstrap();
    }

    public static function isUnderConstruction() {
        return file_exists(self::getUnderConstructionLockFilePath());
    }

    public static function getUnderConstructionLockFilePath() {
        return APPLICATION_PATH . '/../' . self::UNDERCONSTRUCTION_LOCKFILE;
    }

    public static function setUnderConstruction($enabled) {
        $lockFilePath = static::getUnderConstructionLockFilePath();
        return $enabled ?
            touch($lockFilePath) :
            !file_exists($lockFilePath) || unlink($lockFilePath);
    }
}
