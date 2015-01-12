<?php
/**
 * Garp_ShellCommand_Decorator_IoNice
 * @author David Spreekmeester | Grrr.nl
 *
 * Example of usage:
 * $command = new Garp_ShellCommand_Decorator_Nice($command);
 * $ioNiceCommand = new Garp_ShellCommand_IoNiceIsAvailable();
 * $ioNiceIsAvailable = $ioNiceCommand->executeLocally();
 *
 * if ($ioNiceIsAvailable) {
 * 		$command = new Garp_ShellCommand_Decorator_IoNice($command);
 * }
 */
class Garp_ShellCommand_Decorator_IoNice implements Garp_ShellCommand_Protocol {
	const COMMAND_PREFIX_IONICE = 'ionice -c3 ';

	/**
	 * @var Garp_ShellCommand_Protocol $_command
	 */
	protected $_command;


	public function __construct(Garp_ShellCommand_Protocol $command) {
		$this->setCommand($command);
	}
	
	/**
	 * @return Garp_ShellCommand_Protocol
	 */
	public function getCommand() {
		return $this->_command;
	}
	
	/**
	 * @param Garp_ShellCommand_Protocol $command
	 */
	public function setCommand($command) {
		$this->_command = $command;
	}


	public function render() {
		$command 		= $this->getCommand();
		$commandString 	= $command->render();
		$prefix			= self::COMMAND_PREFIX_IONICE;
		
		return $prefix . $commandString;
	}
	
}

