// Main app namespace
var app = app || {};
app.init = function() {

	// Initialize modules

};


/**
 * Responsive breakpoint registry
 */
app.responsive = (function() {
	var docWidth,
		docWidthSetter = function() {
			docWidth = document.documentElement.clientWidth;
		};

	window.addEventListener('resize', docWidthSetter);
	window.addEventListener('orientationchange', docWidthSetter);

	return {
		BREAKPOINT_SMALL: 680,
		BREAKPOINT_MEDIUM: 960,
		BREAKPOINT_LARGE: 1200,

		/**
	 	* Returned (cached) document width
	 	*/
		getDocWidth: function() {
			if (!docWidth) {
				docWidth = document.documentElement.clientWidth;
			}
			return docWidth;
		},
		/**
	 	* Read state of various breakpoints
	 	*/
		getCurrentBreakpoint: function() {
			var tries = ['small', 'medium', 'large'];
			var i = 0;
			var bp = 'small';

			do {
				bp = tries[i];
			} while (this.matchesBreakpoint(tries[++i]));
			return bp;
		},
		/**
	 	* Read state of various breakpoints
	 	*/
		matchesBreakpoint: function(breakpoint) {
			switch (breakpoint) {
				case 'small':
					return this.getDocWidth() >= this.BREAKPOINT_SMALL;
				case 'medium':
					return this.getDocWidth() >= this.BREAKPOINT_MEDIUM;
				case 'large':
					return this.getDocWidth() >= this.BREAKPOINT_LARGE;
			}
		}
	};
})();

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
