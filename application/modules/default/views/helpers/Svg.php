<?php
class App_View_Helper_Svg extends Zend_View_Helper_Abstract {
	const OUTPUT_TPL = '<svg%2$s><use xlink:href="#%1$s"></use></svg>';

	public function svg($id = null, $args = array()) {
		if (!func_num_args()) {
			return $this;
		}

		return $this->render($id, $args);
	}

	public function render($id, $args) {
		$class = isset($args['class']) ? ' class="' . $args['class'] . '"' : '';
		return sprintf(self::OUTPUT_TPL, $id, $class);
	}
}
