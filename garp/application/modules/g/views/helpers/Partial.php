<?php
class G_View_Helper_Partial extends Zend_View_Helper_Partial {

	public function partial($name = null, $module = null, $model = null) {

		if (0 == func_num_args()) {
            return $this;
        }
        $view = $this->view;
		
		if (is_null($model)) {
			$model = array();
		}
		$storageArray = array();
        foreach ($model as $key => $value) {
        	//check if the key already exists in the view
        	if (array_key_exists($key, $view)) { 
	        	//if it does, it is saved in storageArray because it will be overwritten
        		$storageArray[$key] = $this->view->{$key};
        	}
        }

        if (isset($this->partialCounter)) {
            $view->partialCounter = $this->partialCounter;
        }
        if (isset($this->partialTotalCount)) {
            $view->partialTotalCount = $this->partialTotalCount;
        }

        if ((null !== $module) && is_string($module)) {
            require_once 'Zend/Controller/Front.php';
            $moduleDir = Zend_Controller_Front::getInstance()->getControllerDirectory($module);
            if (null === $moduleDir) {
                require_once 'Zend/View/Helper/Partial/Exception.php';
                $e = new Zend_View_Helper_Partial_Exception('Cannot render partial; module does not exist');
                $e->setView($this->view);
                throw $e;
            }
            $viewsDir = dirname($moduleDir) . '/views';
            $view->addBasePath($viewsDir);
        } elseif ((null == $model) && (null !== $module)
            && (is_array($module) || is_object($module)))
        {
            $model = $module;
        }

        if (!empty($model)) {
            if (is_array($model)) {
                $view->assign($model);
            } elseif (is_object($model)) {
                if (null !== ($objectKey = $this->getObjectKey())) {
                    $view->assign($objectKey, $model);
                } elseif (method_exists($model, 'toArray')) {
                    $view->assign($model->toArray());
                } else {
                    $view->assign(get_object_vars($model));
                }
            }
        }

        $output = $view->render($name);

        foreach ($model as $key => $value) {
        	unset($this->view->{$key});
		}
        $this->view->assign($storageArray);

        return $output;
	}

}