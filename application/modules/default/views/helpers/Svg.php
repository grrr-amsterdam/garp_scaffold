<?php
class App_View_Helper_Svg extends Zend_View_Helper_Abstract {
	const OUTPUT_TPL = '<svg%s><use xlink:href="%s#%s"></use></svg>';

	public function svg($id = null, $args = array()) {
		if (!func_num_args()) {
			return $this;
		}

		return $this->render($id, $args);
	}

	public function render($id, $args) {
		$class = isset($args['class']) ? ' class="' . $args['class'] . '"' : '';
		$sprite = $this->view->assetUrl($this->view->config()->assets->css->build . "/img/icons.svg");
		return sprintf(self::OUTPUT_TPL, $class, $sprite, $id);
	}
}
