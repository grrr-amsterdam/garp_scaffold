<?php
/**
 * G_View_Helper_Date
 * @author David Spreekmeester | grrr.nl
 * @modifiedby $LastChangedBy: $
 * @version $Revision: $
 * @package Garp
 * @subpackage Helper
 * @lastmodified $Date: $
 */
class G_View_Helper_Date extends Zend_View_Helper_BaseUrl {	
	public function date() {
		return $this;
	}


	/**
	 * Formats dates according to configuration settings in the ini file.
	 * @param String $type Name of the format, as defined in the ini file. The ini value can be in either format.
	 * @param String $date MySQL datetime string
	 * @return String
	 */
	public function format($type, $date) {
		$ini = Zend_Registry::get('config');
		$format = $ini->date->format->$type;

		if (strpos($format, '%') !== false) {
			return strftime($format, strtotime($date));
		} else {
			return date($format, strtotime($date));
		}
	}
	

	/**
	 * @param Int $minutes Minutes as an integer
	 * @return String Time, displayed as f.i. "2:50"
	 */
	public function displayMinutesAsTime($minutes) {
		$hours = floor($minutes / 60);
		$leftOverMinutes = str_pad($minutes % 60, 2, 0, STR_PAD_LEFT);
		return $hours . ':' . $leftOverMinutes;
	}
}
