<?php
/**
 * @author David Spreekmeester | Grrr.nl
 * This class tests Garp_File.
 */
class Garp_FileTest extends PHPUnit_Framework_TestCase {
	protected $_bogusFilenames = array(
		'$(4g3s#@!)@#%(#@√£¡).JPEG',
		'émerfep¢9£ª^ƒ˚ßƒ´¬å⌛✇☠❄☺☹♨ ♩ ✙✈ ✉✌ ✁ ✎ ✐ ❀ ✰ ❁ ❤ ❥ ❦❧ ➳ ➽ εїз℡❣·۰•●○●',
		'.htaccess',
		''
	);

	function testFormatFilenameShouldReturnNonEmpty() {
		foreach ($this->_bogusFilenames as $origFilename) {
			$newFilename = Garp_File::formatFilename($origFilename);
			$this->assertTrue(
				!empty($newFilename),
				"Original filename: [{$origFilename}], new filename: [{$newFilename}]"
			);
		}
	}


	function testFormatFilenameShouldContainNoneOrASingleDot() {
		foreach ($this->_bogusFilenames as $origFilename) {
			$newFilename = Garp_File::formatFilename($origFilename);
			$this->assertTrue(
				substr_count($newFilename, '.') <= 1,
				"Original filename: [{$origFilename}], new filename: [{$newFilename}]"
			);
		}
	}


	function testFormatFilenameShouldContainOnlyPlainCharacters() {
		foreach ($this->_bogusFilenames as $origFilename) {
			$newFilename = Garp_File::formatFilename($origFilename);
			$this->assertTrue(
				$this->_containsOnlyPlainCharacters($newFilename),
				"Original filename: [{$origFilename}], new filename: [{$newFilename}]"
			);
		}
	}


	function testGetCumulativeFilenameShouldReturnNonEmpty() {
		foreach ($this->_bogusFilenames as $origFilename) {
			$newFilename = Garp_File::getCumulativeFilename($origFilename);
			$this->assertTrue(
				!empty($newFilename),
				"Original filename: [{$origFilename}], new filename: [{$newFilename}]"
			);
		}
	}


	function testGetCumulativeFilenameShouldContainNoneOrASingleDot() {
		foreach ($this->_bogusFilenames as $origFilename) {
			$newFilename = Garp_File::getCumulativeFilename($origFilename);
			$this->assertTrue(
				substr_count($newFilename, '.') <= 1,
				"Original filename: [{$origFilename}], new filename: [{$newFilename}]"
			);
		}
	}


	function testGetCumulativeFilenameShouldContainOnlyPlainCharacters() {
		foreach ($this->_bogusFilenames as $origFilename) {
			$newFilename = Garp_File::getCumulativeFilename($origFilename);
			$this->assertTrue(
				$this->_containsOnlyPlainCharacters($newFilename),
				"Original filename: [{$origFilename}], new filename: [{$newFilename}]"
			);
		}
	}
	

	/**
	 * Checks whether the argument provided contains only word characters (a to z, A to Z, 0 to 9 or underscores), dashes and dots. This excludes characters with accents.
	 * @param String $filename The filename to be checked
	 * @return Boolean Whether the provided argument contains only plain characters.
	 */
	protected function _containsOnlyPlainCharacters($filename) {
		return preg_match('/[^\w-\.]/', $filename) === 0;
	}
}