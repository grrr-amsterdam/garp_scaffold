<?php
/**
 * G_View_Helper_Image
 * Assists in rendering dynamic images.
 * @author David Spreekmeester | grrr.nl
 * @modifiedby $LastChangedBy: $
 * @version $Revision: $
 * @package Garp
 * @subpackage Helper
 * @lastmodified $Date: $
 */
class G_View_Helper_Image extends Zend_View_Helper_HtmlElement {
	/**
 	 * Store configuration, don't fetch it fresh every time.
 	 * @var Zend_Config_Ini
 	 */
	protected $_config;


	/**
 	 * @var Garp_Image_Scaler
 	 */
	protected $_scaler;
	
	const ERROR_SCALING_TEMPLATE_MISSING = 'You will need to provide a scaling template.';
	const ERROR_ARGUMENT_IS_NOT_FILENAME = 'The provided argument is not a filename.';
	
	


	/**
	 * Instance conveyer method to enable calling of the other methods in this class from the view.
	 */
	public function image() {
		return $this;
	}


	/**
	 * @param	mixed	$image		 Database id for uploads, or a file name in case of a static image asset.
	 * @param	String	$template	 The id of the scaling template as defined in application.ini.
	 *								 For instance: 'cms_preview'
	 * @param   Array   $htmlAttribs HTML attributes on the image tag
	 * @param   String  $partial     Custom partial for rendering an upload
	 * @return 	String				 Html image tag
	 */
	public function render($image, $template = null, $htmlAttribs = array(), $partial = null) {
		if ($this->_isFilename($image)) {
			// When calling for a static image, you can use the second param as $htmlAttribs.
			$htmlAttribs = $template;
			if (is_null($htmlAttribs)) {
				$htmlAttribs = array();
			}
			return $this->_renderStatic($image, $htmlAttribs);
		} else {
			if ($template) {
				return $this->_renderUpload($image, $template, $htmlAttribs, $partial);
			} else throw new Exception(self::ERROR_SCALING_TEMPLATE_MISSING);
		}		
	}


	/**
	 * @param	mixed	$image		Database id for uploads, or a file name in case of a static image asset.
	 * @param	String	$template	The id of the scaling template as defined in application.ini.
	 *								For instance: 'cms_preview'
	 * @return 	String				Url to the image
	 */
	public function getUrl($image, $template = null) {
		if ($this->_isFilename($image)) {
			return $this->getStaticUrl($image);
		}
		if (!$template) {
			throw new Exception(self::ERROR_SCALING_TEMPLATE_MISSING);
		}
		return $this->getScaledUrl($image, $template);
	}
	
	/**
 	 * Return the URL of a static image
 	 * @return String
 	 */
	public function getStaticUrl($image) {
		$file = new Garp_Image_File('static');
		return $file->getUrl($image);
	}		
	
	/**
 	 * Return the URL of a scaled image
 	 * @param String $image
 	 * @param String $template
 	 * @return String
 	 */
	public function getScaledUrl($image, $template) {
		return $this->_getImageScaler()->getScaledUrl($image, $template);
	}		

	/**
	 * Returns the url to the source file of an upload.
	 * @param String $filename The filename of the upload, without the path.
	 */
	public function getSourceUrl($filename) {
		if (!$this->_isFilename($filename)) {
			throw new Exception(self::ERROR_ARGUMENT_IS_NOT_FILENAME);
		}
		$file = new Garp_Image_File();
		return $file->getUrl($filename);
	}


	protected function _isFilename($image) {
		return 
			is_string($image) &&
			strpos($image, '.') !== false
		;
	}


	protected function _renderStatic($filename, Array $htmlAttribs = array()) {
		$file = new Garp_Image_File('static');
		$src = $file->getUrl($filename);

		if (!array_key_exists('alt', $htmlAttribs)) {
			$htmlAttribs['alt'] = '';
		}

		return $this->view->htmlImage($src, $htmlAttribs);
	}


	/**
	 * Returns an HTML image tag, with the correct path to the image provided.
	 * @param Mixed $image						Id of the image record, or a Garp_Db_Table_Row image record. 
	 * 											This can also be an instance of an Image model. If so, the image will
	 * 											be rendered inside a partial that includes its caption and other metadata.
	 * @param Array $template					Template name.
	 * @param Array $htmlAttribs				HTML attributes for this <img> tag, such as 'alt'.
	 * @param String $partial 					Custom partial for rendering this image
	 * @return String							Full image tag string, containing attributes and full path
	 */
	protected function _renderUpload($imageIdOrRecord, $template = null, Array $htmlAttribs = array(), $partial = '') {
		if (!empty($template)) {
			$scaler = $this->_getImageScaler();
			$src = $scaler->getScaledUrl($imageIdOrRecord, $template);
			$tplScalingParams = $scaler->getTemplateParameters($template);
			$this->_addSizeParamsToHtmlAttribs($tplScalingParams, $htmlAttribs);
		} else {
			if ($imageIdOrRecord instanceof Garp_Db_Table_Row) {
				$filename = $imageIdOrRecord->filename;
			} else {
				$imageModel = new G_Model_Image();
				$filename = $imageModel->fetchFilenameById($imageIdOrRecord);
			}
			$file = new Garp_Image_File('upload');
			$src = $file->getUrl($filename);
		}

		if (!array_key_exists('alt', $htmlAttribs)) {
			$htmlAttribs['alt'] = '';
		}

		$htmlAttribs['src'] = $src;
		$imgTag = '<img'.$this->_htmlAttribs($htmlAttribs).'>';
		
		if ($imageIdOrRecord instanceof Garp_Db_Table_Row) {
			if ($partial) {
				$module  = 'default';
			} else {
				$partial = 'partials/image.phtml';
				$module  = 'g';
			}
			return $this->view->partial($partial, $module, array(
				'imgTag' => $imgTag,
				'imgObject' => $imageIdOrRecord
			));
		} else {
			return $imgTag;
		}
	}


	/**
	 * If available, adds 'width' and 'height' tags to the provided html attributes array, by reference.
	 * @param Array $scalingParams Scaling parameters, either custom or distilled from template configuration
	 * @return Void
	 */
	private function _addSizeParamsToHtmlAttribs($scalingParams, &$htmlAttribs) {
		if (
			array_key_exists('w', $scalingParams) &&
			$scalingParams['w']
		) {
			$htmlAttribs['width'] = $scalingParams['w'];
		}

		if (!$this->_config) {
			$this->_config = Zend_Registry::get('config');
		}

		if (
			is_null($this->_config->image->setHtmlHeight) ||
			$this->_config->image->setHtmlHeight
		) {
			if (
				array_key_exists('h', $scalingParams) &&
				$scalingParams['h']
			) {
				$htmlAttribs['height'] = $scalingParams['h'];
			}
		}
	}


	/**
 	 * Create Garp_Image_Scaler object
 	 * @return Garp_Image_Scaler
 	 */
	protected function _getImageScaler() {
		if (!$this->_scaler) {
			$this->_scaler = new Garp_Image_Scaler();
		}
		return $this->_scaler;
	}
}
