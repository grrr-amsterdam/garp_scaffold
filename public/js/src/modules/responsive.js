/**
 * Responsive breakpoint registry
 */
var app = app || {};

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
