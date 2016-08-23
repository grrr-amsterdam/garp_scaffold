<?php
/**
 * IndexController
 * class description
 *
 * @package Controllers
 * @author  Harmen Janssen <harmen@grrr.nl>
 */
class IndexController extends Garp_Controller_Action {
    public function indexAction() {
        $this->view->title = 'Home';
        $this->view->currentPage = 'home';
    }
}
