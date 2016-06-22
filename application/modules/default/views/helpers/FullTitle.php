<?php
class App_View_Helper_FullTitle extends Zend_View_Helper_Abstract {

    public function fullTitle($title, $currentPage) {
		if ($currentPage == 'home') {
			$out = $this->view->escape($this->view->config()->app->name);
			if ($title) {
				$out .= ' — ' . $this->view->escape($title);
            }
            return $out;
		}
        if ($title) {
			$title .= ' | ';
        }
		$title .= $this->view->config()->app->name;
        return $title;
    }

}
