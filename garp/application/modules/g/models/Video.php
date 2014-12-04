<?php
/**
 * G_Model_Video
 * @author Harmen Janssen, David Spreekmeester | grrr.nl
 * @modifiedby $LastChangedBy: $
 * @version $Revision: $
 * @package Garp
 * @subpackage Model
 * @lastmodified $Date: $
 */
class G_Model_Video extends Model_Base_Video {
<<<<<<< HEAD
	public function insert(array $data) {	
=======
	public function insert(array $data) {
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		try {
			return parent::insert($data);
		} catch (Exception $e) {
			if (strpos($e->getMessage(), 'Duplicate entry') === false) {
				throw $e;
			}

			if (!array_key_exists('url', $data) || !$data['url']) {
				throw new Exception("Missing the 'url' parameter in provided video data.");
			}

			$videoUrl = trim($data['url']);
<<<<<<< HEAD

			if ($this->_isVimeoUrl($videoUrl)) {
				$select = $this->select()->where('url LIKE ?', "%{$videoUrl}%");
=======
			$this->unregisterObserver('Translatable');

			if ($this->_isVimeoUrl($videoUrl)) {
				$queryUrl = parse_url($videoUrl);
				$queryUrl = $queryUrl['host'] . $queryUrl['path'];
				$select = $this->select()->where('url LIKE ?', "%{$queryUrl}%");
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
			} elseif ($this->_isYouTuBeUrl($videoUrl) || $this->_isYouTubeComUrl($videoUrl)) {
				$ytVideoId = $this->_getYouTubeIdFromURL($videoUrl);
				$select = $this->select()->where('identifier = ?', $ytVideoId);
			} else throw new Exception("Unknown video type.");

			if (isset($select) && $select) {
				$videoRow = $this->fetchRow($select);
				if ($videoRow) {
					return $videoRow->id;
				}
			}
		}
<<<<<<< HEAD

=======
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		return null;
	}


	protected function _isVimeoUrl($url) {
		return strpos($url, 'vimeo.com') !== false;
	}

	protected function _isYouTuBeUrl($url) {
		return strpos($url, 'youtu.be') !== false;
	}

	protected function _isYouTubeComUrl($url) {
		return strpos($url, 'youtube.com') !== false;
	}

	protected function _getYouTubeIdFromURL($url) {
		$pattern = '%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i';
		preg_match($pattern, $url, $matches);

		if (isset($matches[1])) {
			return $matches[1];
		}

		throw new Exception("Cannot find YouTube video id in url.");
	}
}
