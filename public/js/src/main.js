// Main app namespace
var app = app || {};
app.init = function() {

	// Initialize modules

};



/**
 * Add class to the body when scrolling.
 * This class disabled pointer-events in the CSS. Greatly enhanced performance.
 */
function disableHoverStylesOnScroll() {
	var body = document.body, timer;
	if (!body.classList || !window.addEventListener) {
		return;
	}
	window.addEventListener('scroll', function() {
		clearTimeout(timer);
		if(!body.classList.contains('disable-hover')) {
			body.classList.add('disable-hover');
		}

		timer = setTimeout(function() {
			body.classList.remove('disable-hover');
		}, 300);
	}, false);
}

FastClick.attach(document.body);
disableHoverStylesOnScroll();

var cookie_msg = Garp.FlashMessage.parseCookie();
if (cookie_msg) {
	var fm = new Garp.FlashMessage(cookie_msg);
	fm.show();
}
