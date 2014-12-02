<?php

class App_Cli_Command_Cron extends Garp_Cli_Command {
	
	public function frequently() {
		$config = Zend_Registry::get('config');
		if ($config->app->clusteredHosting) {
			$this->_runClusterJobs();
		}
	}

	public function hourly() {

	}

	public function daily() {
		$config = Zend_Registry::get('config');
		if ($config->app->clusteredHosting) {
			$this->_cleanClusterJobs();
		}
	}

	/** Run cluster jobs */
	protected function _runClusterJobs() {
		$cluster_cmd = new Garp_Cli_Command_Cluster();
		$cluster_cmd->main(array('run'));
	}

	/** Clean cluster jobs */
	protected function _cleanClusterJobs() {
		$cluster_cmd = new Garp_Cli_Command_Cluster();
		$cluster_cmd->main(array('clean'));
	}

}
