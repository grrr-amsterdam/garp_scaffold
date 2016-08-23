<?php
/**
 * App_Cli_Command_Cron
 * Runner of cronjobs
 *
 * @package App_Cli_Command
 * @author  Harmen Janssen <harmen@grrr.nl>
 */
class App_Cli_Command_Cron extends Garp_Cli_Command {

    /**
     * Runs every minute
     *
     * @return void
     */
    public function frequently() {
        $config = Zend_Registry::get('config');
        if ($config->app->clusteredHosting) {
            $this->_runClusterJobs();
        }
    }

    /**
     * Runs every hour
     *
     * @return void
     */
    public function hourly() {

    }

    /**
     * Runs every day
     *
     * @return void
     */
    public function daily() {
        $config = Zend_Registry::get('config');
        if ($config->app->clusteredHosting) {
            $this->_cleanClusterJobs();
        }
    }

    /**
     * Run cluster jobs. Makes sure jobs are shared between server.
     *
     * @return void
     */
    protected function _runClusterJobs() {
        $cluster_cmd = new Garp_Cli_Command_Cluster();
        $cluster_cmd->main(array('run'));
    }

    /**
     * Clean old cluster jobs.
     *
     * @return void
     */
    protected function _cleanClusterJobs() {
        $cluster_cmd = new Garp_Cli_Command_Cluster();
        $cluster_cmd->main(array('clean'));
    }

}
