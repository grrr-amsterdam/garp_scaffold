<?php
/**
 * G_View_Helper_Vimeo
 * Helper for rendering embedded Vimeo players
 * @author Harmen Janssen | grrr.nl
 * @modifiedby $LastChangedBy: $
 * @version $Revision: $
 * @package Garp
 * @subpackage Helper
 * @lastmodified $Date: $
 */
class G_View_Helper_Vimeo extends Zend_View_Helper_HtmlElement {
	/**
	 * Render a Vimeo player.
	 * If no arguments are given, $this is returned 
	 * so there can be some chaining.
	 * @param Garp_Db_Table_Row $vimeo A record from the `vimeo_videos` table
	 * @param Array $options Various rendering options
	 * @return Mixed
	 */
	public function vimeo($vimeo = null, array $options = array()) {
		if (!func_num_args()) {
			return $this;
		}
		return $this->render($vimeo, $options);
	}
	
	
	/**
	 * Render a Vimeo object tag.
	 * @param Garp_Db_Table_Row $vimeo A record from the `vimeo_videos` table (or `media` view)
	 * @param Array $options Various rendering options
	 * @return Mixed
	 */
	public function render($vimeo, array $options = array()) {
		$options = $this->_setDefaultOptions($options);
		$_attribs = $options['attribs'];
		$_attribs['width']  = $options['width'];
		$_attribs['height'] = $options['height'];

		unset($options['width']);
		unset($options['height']);
		unset($options['attribs']);

		$playerurl  = $vimeo instanceof Garp_Db_Table_Row ? $vimeo->player : $vimeo;
		$playerurl .= '?'.http_build_query((array)$options);

		$_attribs['frameborder'] = 0;
		$_attribs['src'] = $playerurl;
		
		$html = '<iframe'.$this->_htmlAttribs($_attribs).'></iframe>';
		return $html;
	}
	
	
	/**
	 * Normalize some configuration values.
	 * @param Array $options
	 * @return Array Modified options
	 */
	protected function _setDefaultOptions(array $options) {
		$config = new Garp_Util_Configuration($options);
		$config->setDefault('height', isset($options['width']) ? round($options['width']*0.55) : 264)
			   ->setDefault('width', 480)
			   ->setDefault('portrait', 0)
			   ->setDefault('title', 0)
			   ->setDefault('byline', 0)
			   ->setDefault('attribs', array())
			   ;
		return $config;
	}
}
