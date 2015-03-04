/**
 * Garp styling helpers
 */
if (typeof Garp === 'undefined') {
	var Garp = {};
}

Garp.transitionEndEvents = [
	'transitionEnd',
	'oTransitionEnd',
	'msTransitionEnd',
	'transitionend',
	'webkitTransitionEnd'
];

Garp.animationEndEvents = [
	'animationend',
	'webkitAnimationEnd',
	'oanimationend',
	'MSAnimationEnd'
];

Garp.getStyle = function(elm, rule) {
	if (document.defaultView && document.defaultView.getComputedStyle) {
		return document.defaultView.getComputedStyle(elm, '').getPropertyValue(rule);
	}
	if (elm.currentStyle) {
		rule = rule.replace(/\-(\w)/g, function(strMatch, p1) {
			return p1.toUpperCase();
		});
		return elm.currentStyle[rule];
	}
	return '';
};

Garp.getTransitionProperty = function() {
	var el = document.createElement('fakeelement');
	var transitions = [
		'transition',
		'OTransition',
		'MSTransition',
		'MozTransition',
		'WebkitTransition'
	];
	var getCurriedFunction = function(t) {
		return function() {
			return t;
		};
	};
	for (var i = 0, lt = transitions.length; i < lt; ++i) {
		if (el.style[transitions[i]] !== undefined) {
			// Speed up subsequent calls
			Garp.getTransitionProperty = getCurriedFunction(transitions[i]);
			return transitions[i];
		}
	}
	return null;
};

Garp.getAnimationProperty = function() {
	var el = document.createElement('fakeelement');
	var animations = [
		'animationName',
		'OAnimationName',
		'MSAnimationName',
		'MozAnimationName',
		'WebkitAnimationName'
	];
	var getCurriedFunction = function(a) {
		return function() {
			return a;
		};
	};
	for (var i = 0, la = animations.length; i < la; ++i) {
		if (el.style[animations[i]] !== undefined) {
			// Speed up subsequent calls
			Garp.getAnimationProperty = getCurriedFunction(animations[i]);
			return animations[i];
		}
	}
	return null;
};

/**
 * Get cross-browser transitionEnd event
 * Inspiration: @see http://stackoverflow.com/questions/5023514/how-do-i-normalize-css3-transition-functions-across-browsers
 * Note: this is not entirely reliable, Chrome uses 'transition', but listens to the WebkitTransitionEnd event. Some versions that is...
 */
Garp.getTransitionEndEvent = function() {
	var transitions = {
		'transition': 'transitionEnd',
		'OTransition': 'oTransitionEnd',
		'MSTransition': 'msTransitionEnd',
		'MozTransition': 'transitionend',
		'WebkitTransition': 'webkitTransitionEnd'
	};
	var t = Garp.getTransitionProperty();
	var getCurriedFunction = function(t) {
		return function() {
			return t;
		};
	};
	if (t && t in transitions) {
		Garp.getTransitionEndEvent = getCurriedFunction(transitions[t]);
		return transitions[t];
	}
	return null;
};

/**
 * Garp FlashMessage
 * API:
 * // Show message for 2 seconds
 * var fm = new Garp.FlashMessage('you have been logged out', 2);
 * fm.show();
 *
 * // Show message forever and ever:
 * var fm = new Garp.FlashMessage('you have been logged out', -1);
 * fm.show();
 *
 * // Hide manually
 * fm.hide();
 */
if (typeof Garp === 'undefined') {
	var Garp = {};
}

/**
 * FlashMessage
 * Shows a quick system message in an overlay or dialog box.
 * @param String|Array msg The message, or collection of messages
 * @param Int timeout How long the message will be displayed. Defaults to 5. Use -1 to never hide. (in seconds)
 */
Garp.FlashMessage = function(msg, timeout) {
	var shouldTimeout = -1 !== timeout,
		fm,
		timer,
		doc = document.documentElement,
		body = document.getElementsByTagName('body')[0],
		FM_ACTIVE_CLASS = 'flash-message-active',
		FM_INACTIVE_CLASS = 'flash-message-inactive'
	;

	// assume seconds
	timeout = timeout || 5;
	if (shouldTimeout) {
		timeout *= 1000;
	}

	// normalize msg to array
	if (typeof msg.push !== 'function') {
		msg = [msg];
	}

	var removeNode = function() {
		if (!fm) {
			return;
		}
		fm.parentNode.removeChild(fm);
		fm = null;
		doc.className = doc.className.replace(FM_INACTIVE_CLASS, '');
	};

	// Add event listeners that remove the node from the DOM
	// after a transition or animation ends.
	var setRemoveHandler = function(transition) {
		var events = transition ? Garp.transitionEndEvents : Garp.animationEndEvents;
		for (var i = 0, el = events.length; i < el; ++i) {
			fm.addEventListener(events[i], removeNode, false);
		}
	};

	var hide = function() {
		clearInterval(timer);
		if (!fm) {
			return;
		}

		var t = Garp.getStyle(fm, Garp.getTransitionProperty()),
			a = Garp.getStyle(fm, Garp.getAnimationProperty());

		if (t || a) {
			setRemoveHandler(t);
		}
		doc.className = doc.className.replace(FM_ACTIVE_CLASS, FM_INACTIVE_CLASS);

		if (!t && !a) {
			removeNode();
		}
	};

	/**
	 * Show the message.
	 * A timer will be set that hides the it.
	 */
	var show = function() {
		fm = document.createElement('div');
		fm.setAttribute('id', 'flash-message');
		fm.className = 'flash-message';
		var html = '';
		for (var i = 0, ml = msg.length; i < ml; ++i) {
			html += '<p>' + msg[i] + '</p>';
		}
		fm.innerHTML = html;
		body.appendChild(fm);
		setTimeout(function() {
			doc.className += ' ' + FM_ACTIVE_CLASS;
		}, 0);

		// clicking on flash message hides it
		fm.onclick = hide;
		if (shouldTimeout) {
			timer = setTimeout(hide, timeout);
		}
	};

	// public api
	this.show = show;
	this.hide = hide;

	return this;
};

/**
 * Read the designated flashMessage cookie
 */
Garp.FlashMessage.parseCookie = function() {
	if (typeof JSON == 'undefined' || typeof JSON.parse !== 'function') {
		return '';
	}
	var FM_COOKIE = 'FlashMessenger',
		m = JSON.parse(unescape(Garp.Cookie.get(FM_COOKIE))),
		out = [];
	if (!m || !m.messages) {
		return '';
	}
	for (var i in m.messages) {
		var msg = m.messages[i];
		if (msg) {
			out.push(msg.replace(/\+/g, ' '));
		}
	}

	// Remove the cookie after parsing the flash message
	var exp = new Date();
	exp.setHours(exp.getHours() - 1);
	Garp.Cookie.set(FM_COOKIE, '', exp, (typeof COOKIEDOMAIN !== 'undefined') ? COOKIEDOMAIN : document.location.host);

	return out;
};

/**
 * Garp cookie helper utilities
 */
if (typeof Garp === 'undefined') {
	var Garp = {};
}

Garp.Cookie = {};

/**
 * Grab a Cookie
 * @param {Object} name
 */
Garp.Cookie.get = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0, cal = ca.length; i < cal; ++i) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
			c = c.substring(1, c.length);
		}
        if (c.indexOf(nameEQ) === 0) {
			return c.substring(nameEQ.length, c.length);
		}
    }
    return null;
};

/**
 * Set a cookie
 * @param {Object} name
 * @param {Object} value
 * @param {Date} expiration date 
 */
Garp.Cookie.set = function(name, value, date) {
	value = escape(value) + "; path=/";
	value += (!date ? "" : "; expires=" + date.toGMTString());
	document.cookie = name + "=" + value;
};

Garp.Cookie.remove = function(name) {
	Garp.setCookie(name,'',new Date('1900'));
};

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0eWxpbmcuanMiLCJmbGFzaG1lc3NhZ2UuanMiLCJjb29raWVzLmpzIiwibWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEdhcnAgc3R5bGluZyBoZWxwZXJzXG4gKi9cbmlmICh0eXBlb2YgR2FycCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0dmFyIEdhcnAgPSB7fTtcbn1cblxuR2FycC50cmFuc2l0aW9uRW5kRXZlbnRzID0gW1xuXHQndHJhbnNpdGlvbkVuZCcsXG5cdCdvVHJhbnNpdGlvbkVuZCcsXG5cdCdtc1RyYW5zaXRpb25FbmQnLFxuXHQndHJhbnNpdGlvbmVuZCcsXG5cdCd3ZWJraXRUcmFuc2l0aW9uRW5kJ1xuXTtcblxuR2FycC5hbmltYXRpb25FbmRFdmVudHMgPSBbXG5cdCdhbmltYXRpb25lbmQnLFxuXHQnd2Via2l0QW5pbWF0aW9uRW5kJyxcblx0J29hbmltYXRpb25lbmQnLFxuXHQnTVNBbmltYXRpb25FbmQnXG5dO1xuXG5HYXJwLmdldFN0eWxlID0gZnVuY3Rpb24oZWxtLCBydWxlKSB7XG5cdGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSB7XG5cdFx0cmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWxtLCAnJykuZ2V0UHJvcGVydHlWYWx1ZShydWxlKTtcblx0fVxuXHRpZiAoZWxtLmN1cnJlbnRTdHlsZSkge1xuXHRcdHJ1bGUgPSBydWxlLnJlcGxhY2UoL1xcLShcXHcpL2csIGZ1bmN0aW9uKHN0ck1hdGNoLCBwMSkge1xuXHRcdFx0cmV0dXJuIHAxLnRvVXBwZXJDYXNlKCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGVsbS5jdXJyZW50U3R5bGVbcnVsZV07XG5cdH1cblx0cmV0dXJuICcnO1xufTtcblxuR2FycC5nZXRUcmFuc2l0aW9uUHJvcGVydHkgPSBmdW5jdGlvbigpIHtcblx0dmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZmFrZWVsZW1lbnQnKTtcblx0dmFyIHRyYW5zaXRpb25zID0gW1xuXHRcdCd0cmFuc2l0aW9uJyxcblx0XHQnT1RyYW5zaXRpb24nLFxuXHRcdCdNU1RyYW5zaXRpb24nLFxuXHRcdCdNb3pUcmFuc2l0aW9uJyxcblx0XHQnV2Via2l0VHJhbnNpdGlvbidcblx0XTtcblx0dmFyIGdldEN1cnJpZWRGdW5jdGlvbiA9IGZ1bmN0aW9uKHQpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdDtcblx0XHR9O1xuXHR9O1xuXHRmb3IgKHZhciBpID0gMCwgbHQgPSB0cmFuc2l0aW9ucy5sZW5ndGg7IGkgPCBsdDsgKytpKSB7XG5cdFx0aWYgKGVsLnN0eWxlW3RyYW5zaXRpb25zW2ldXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHQvLyBTcGVlZCB1cCBzdWJzZXF1ZW50IGNhbGxzXG5cdFx0XHRHYXJwLmdldFRyYW5zaXRpb25Qcm9wZXJ0eSA9IGdldEN1cnJpZWRGdW5jdGlvbih0cmFuc2l0aW9uc1tpXSk7XG5cdFx0XHRyZXR1cm4gdHJhbnNpdGlvbnNbaV07XG5cdFx0fVxuXHR9XG5cdHJldHVybiBudWxsO1xufTtcblxuR2FycC5nZXRBbmltYXRpb25Qcm9wZXJ0eSA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmYWtlZWxlbWVudCcpO1xuXHR2YXIgYW5pbWF0aW9ucyA9IFtcblx0XHQnYW5pbWF0aW9uTmFtZScsXG5cdFx0J09BbmltYXRpb25OYW1lJyxcblx0XHQnTVNBbmltYXRpb25OYW1lJyxcblx0XHQnTW96QW5pbWF0aW9uTmFtZScsXG5cdFx0J1dlYmtpdEFuaW1hdGlvbk5hbWUnXG5cdF07XG5cdHZhciBnZXRDdXJyaWVkRnVuY3Rpb24gPSBmdW5jdGlvbihhKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGE7XG5cdFx0fTtcblx0fTtcblx0Zm9yICh2YXIgaSA9IDAsIGxhID0gYW5pbWF0aW9ucy5sZW5ndGg7IGkgPCBsYTsgKytpKSB7XG5cdFx0aWYgKGVsLnN0eWxlW2FuaW1hdGlvbnNbaV1dICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdC8vIFNwZWVkIHVwIHN1YnNlcXVlbnQgY2FsbHNcblx0XHRcdEdhcnAuZ2V0QW5pbWF0aW9uUHJvcGVydHkgPSBnZXRDdXJyaWVkRnVuY3Rpb24oYW5pbWF0aW9uc1tpXSk7XG5cdFx0XHRyZXR1cm4gYW5pbWF0aW9uc1tpXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG51bGw7XG59O1xuXG4vKipcbiAqIEdldCBjcm9zcy1icm93c2VyIHRyYW5zaXRpb25FbmQgZXZlbnRcbiAqIEluc3BpcmF0aW9uOiBAc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTAyMzUxNC9ob3ctZG8taS1ub3JtYWxpemUtY3NzMy10cmFuc2l0aW9uLWZ1bmN0aW9ucy1hY3Jvc3MtYnJvd3NlcnNcbiAqIE5vdGU6IHRoaXMgaXMgbm90IGVudGlyZWx5IHJlbGlhYmxlLCBDaHJvbWUgdXNlcyAndHJhbnNpdGlvbicsIGJ1dCBsaXN0ZW5zIHRvIHRoZSBXZWJraXRUcmFuc2l0aW9uRW5kIGV2ZW50LiBTb21lIHZlcnNpb25zIHRoYXQgaXMuLi5cbiAqL1xuR2FycC5nZXRUcmFuc2l0aW9uRW5kRXZlbnQgPSBmdW5jdGlvbigpIHtcblx0dmFyIHRyYW5zaXRpb25zID0ge1xuXHRcdCd0cmFuc2l0aW9uJzogJ3RyYW5zaXRpb25FbmQnLFxuXHRcdCdPVHJhbnNpdGlvbic6ICdvVHJhbnNpdGlvbkVuZCcsXG5cdFx0J01TVHJhbnNpdGlvbic6ICdtc1RyYW5zaXRpb25FbmQnLFxuXHRcdCdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuXHRcdCdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnXG5cdH07XG5cdHZhciB0ID0gR2FycC5nZXRUcmFuc2l0aW9uUHJvcGVydHkoKTtcblx0dmFyIGdldEN1cnJpZWRGdW5jdGlvbiA9IGZ1bmN0aW9uKHQpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdDtcblx0XHR9O1xuXHR9O1xuXHRpZiAodCAmJiB0IGluIHRyYW5zaXRpb25zKSB7XG5cdFx0R2FycC5nZXRUcmFuc2l0aW9uRW5kRXZlbnQgPSBnZXRDdXJyaWVkRnVuY3Rpb24odHJhbnNpdGlvbnNbdF0pO1xuXHRcdHJldHVybiB0cmFuc2l0aW9uc1t0XTtcblx0fVxuXHRyZXR1cm4gbnVsbDtcbn07XG4iLCIvKipcbiAqIEdhcnAgRmxhc2hNZXNzYWdlXG4gKiBBUEk6XG4gKiAvLyBTaG93IG1lc3NhZ2UgZm9yIDIgc2Vjb25kc1xuICogdmFyIGZtID0gbmV3IEdhcnAuRmxhc2hNZXNzYWdlKCd5b3UgaGF2ZSBiZWVuIGxvZ2dlZCBvdXQnLCAyKTtcbiAqIGZtLnNob3coKTtcbiAqXG4gKiAvLyBTaG93IG1lc3NhZ2UgZm9yZXZlciBhbmQgZXZlcjpcbiAqIHZhciBmbSA9IG5ldyBHYXJwLkZsYXNoTWVzc2FnZSgneW91IGhhdmUgYmVlbiBsb2dnZWQgb3V0JywgLTEpO1xuICogZm0uc2hvdygpO1xuICpcbiAqIC8vIEhpZGUgbWFudWFsbHlcbiAqIGZtLmhpZGUoKTtcbiAqL1xuaWYgKHR5cGVvZiBHYXJwID09PSAndW5kZWZpbmVkJykge1xuXHR2YXIgR2FycCA9IHt9O1xufVxuXG4vKipcbiAqIEZsYXNoTWVzc2FnZVxuICogU2hvd3MgYSBxdWljayBzeXN0ZW0gbWVzc2FnZSBpbiBhbiBvdmVybGF5IG9yIGRpYWxvZyBib3guXG4gKiBAcGFyYW0gU3RyaW5nfEFycmF5IG1zZyBUaGUgbWVzc2FnZSwgb3IgY29sbGVjdGlvbiBvZiBtZXNzYWdlc1xuICogQHBhcmFtIEludCB0aW1lb3V0IEhvdyBsb25nIHRoZSBtZXNzYWdlIHdpbGwgYmUgZGlzcGxheWVkLiBEZWZhdWx0cyB0byA1LiBVc2UgLTEgdG8gbmV2ZXIgaGlkZS4gKGluIHNlY29uZHMpXG4gKi9cbkdhcnAuRmxhc2hNZXNzYWdlID0gZnVuY3Rpb24obXNnLCB0aW1lb3V0KSB7XG5cdHZhciBzaG91bGRUaW1lb3V0ID0gLTEgIT09IHRpbWVvdXQsXG5cdFx0Zm0sXG5cdFx0dGltZXIsXG5cdFx0ZG9jID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuXHRcdGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdLFxuXHRcdEZNX0FDVElWRV9DTEFTUyA9ICdmbGFzaC1tZXNzYWdlLWFjdGl2ZScsXG5cdFx0Rk1fSU5BQ1RJVkVfQ0xBU1MgPSAnZmxhc2gtbWVzc2FnZS1pbmFjdGl2ZSdcblx0O1xuXG5cdC8vIGFzc3VtZSBzZWNvbmRzXG5cdHRpbWVvdXQgPSB0aW1lb3V0IHx8IDU7XG5cdGlmIChzaG91bGRUaW1lb3V0KSB7XG5cdFx0dGltZW91dCAqPSAxMDAwO1xuXHR9XG5cblx0Ly8gbm9ybWFsaXplIG1zZyB0byBhcnJheVxuXHRpZiAodHlwZW9mIG1zZy5wdXNoICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0bXNnID0gW21zZ107XG5cdH1cblxuXHR2YXIgcmVtb3ZlTm9kZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghZm0pIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Zm0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmbSk7XG5cdFx0Zm0gPSBudWxsO1xuXHRcdGRvYy5jbGFzc05hbWUgPSBkb2MuY2xhc3NOYW1lLnJlcGxhY2UoRk1fSU5BQ1RJVkVfQ0xBU1MsICcnKTtcblx0fTtcblxuXHQvLyBBZGQgZXZlbnQgbGlzdGVuZXJzIHRoYXQgcmVtb3ZlIHRoZSBub2RlIGZyb20gdGhlIERPTVxuXHQvLyBhZnRlciBhIHRyYW5zaXRpb24gb3IgYW5pbWF0aW9uIGVuZHMuXG5cdHZhciBzZXRSZW1vdmVIYW5kbGVyID0gZnVuY3Rpb24odHJhbnNpdGlvbikge1xuXHRcdHZhciBldmVudHMgPSB0cmFuc2l0aW9uID8gR2FycC50cmFuc2l0aW9uRW5kRXZlbnRzIDogR2FycC5hbmltYXRpb25FbmRFdmVudHM7XG5cdFx0Zm9yICh2YXIgaSA9IDAsIGVsID0gZXZlbnRzLmxlbmd0aDsgaSA8IGVsOyArK2kpIHtcblx0XHRcdGZtLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRzW2ldLCByZW1vdmVOb2RlLCBmYWxzZSk7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBoaWRlID0gZnVuY3Rpb24oKSB7XG5cdFx0Y2xlYXJJbnRlcnZhbCh0aW1lcik7XG5cdFx0aWYgKCFmbSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciB0ID0gR2FycC5nZXRTdHlsZShmbSwgR2FycC5nZXRUcmFuc2l0aW9uUHJvcGVydHkoKSksXG5cdFx0XHRhID0gR2FycC5nZXRTdHlsZShmbSwgR2FycC5nZXRBbmltYXRpb25Qcm9wZXJ0eSgpKTtcblxuXHRcdGlmICh0IHx8IGEpIHtcblx0XHRcdHNldFJlbW92ZUhhbmRsZXIodCk7XG5cdFx0fVxuXHRcdGRvYy5jbGFzc05hbWUgPSBkb2MuY2xhc3NOYW1lLnJlcGxhY2UoRk1fQUNUSVZFX0NMQVNTLCBGTV9JTkFDVElWRV9DTEFTUyk7XG5cblx0XHRpZiAoIXQgJiYgIWEpIHtcblx0XHRcdHJlbW92ZU5vZGUoKTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIFNob3cgdGhlIG1lc3NhZ2UuXG5cdCAqIEEgdGltZXIgd2lsbCBiZSBzZXQgdGhhdCBoaWRlcyB0aGUgaXQuXG5cdCAqL1xuXHR2YXIgc2hvdyA9IGZ1bmN0aW9uKCkge1xuXHRcdGZtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0Zm0uc2V0QXR0cmlidXRlKCdpZCcsICdmbGFzaC1tZXNzYWdlJyk7XG5cdFx0Zm0uY2xhc3NOYW1lID0gJ2ZsYXNoLW1lc3NhZ2UnO1xuXHRcdHZhciBodG1sID0gJyc7XG5cdFx0Zm9yICh2YXIgaSA9IDAsIG1sID0gbXNnLmxlbmd0aDsgaSA8IG1sOyArK2kpIHtcblx0XHRcdGh0bWwgKz0gJzxwPicgKyBtc2dbaV0gKyAnPC9wPic7XG5cdFx0fVxuXHRcdGZtLmlubmVySFRNTCA9IGh0bWw7XG5cdFx0Ym9keS5hcHBlbmRDaGlsZChmbSk7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdGRvYy5jbGFzc05hbWUgKz0gJyAnICsgRk1fQUNUSVZFX0NMQVNTO1xuXHRcdH0sIDApO1xuXG5cdFx0Ly8gY2xpY2tpbmcgb24gZmxhc2ggbWVzc2FnZSBoaWRlcyBpdFxuXHRcdGZtLm9uY2xpY2sgPSBoaWRlO1xuXHRcdGlmIChzaG91bGRUaW1lb3V0KSB7XG5cdFx0XHR0aW1lciA9IHNldFRpbWVvdXQoaGlkZSwgdGltZW91dCk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIHB1YmxpYyBhcGlcblx0dGhpcy5zaG93ID0gc2hvdztcblx0dGhpcy5oaWRlID0gaGlkZTtcblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVhZCB0aGUgZGVzaWduYXRlZCBmbGFzaE1lc3NhZ2UgY29va2llXG4gKi9cbkdhcnAuRmxhc2hNZXNzYWdlLnBhcnNlQ29va2llID0gZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgSlNPTiA9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgSlNPTi5wYXJzZSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiAnJztcblx0fVxuXHR2YXIgRk1fQ09PS0lFID0gJ0ZsYXNoTWVzc2VuZ2VyJyxcblx0XHRtID0gSlNPTi5wYXJzZSh1bmVzY2FwZShHYXJwLkNvb2tpZS5nZXQoRk1fQ09PS0lFKSkpLFxuXHRcdG91dCA9IFtdO1xuXHRpZiAoIW0gfHwgIW0ubWVzc2FnZXMpIHtcblx0XHRyZXR1cm4gJyc7XG5cdH1cblx0Zm9yICh2YXIgaSBpbiBtLm1lc3NhZ2VzKSB7XG5cdFx0dmFyIG1zZyA9IG0ubWVzc2FnZXNbaV07XG5cdFx0aWYgKG1zZykge1xuXHRcdFx0b3V0LnB1c2gobXNnLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcblx0XHR9XG5cdH1cblxuXHQvLyBSZW1vdmUgdGhlIGNvb2tpZSBhZnRlciBwYXJzaW5nIHRoZSBmbGFzaCBtZXNzYWdlXG5cdHZhciBleHAgPSBuZXcgRGF0ZSgpO1xuXHRleHAuc2V0SG91cnMoZXhwLmdldEhvdXJzKCkgLSAxKTtcblx0R2FycC5Db29raWUuc2V0KEZNX0NPT0tJRSwgJycsIGV4cCwgKHR5cGVvZiBDT09LSUVET01BSU4gIT09ICd1bmRlZmluZWQnKSA/IENPT0tJRURPTUFJTiA6IGRvY3VtZW50LmxvY2F0aW9uLmhvc3QpO1xuXG5cdHJldHVybiBvdXQ7XG59O1xuIiwiLyoqXG4gKiBHYXJwIGNvb2tpZSBoZWxwZXIgdXRpbGl0aWVzXG4gKi9cbmlmICh0eXBlb2YgR2FycCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0dmFyIEdhcnAgPSB7fTtcbn1cblxuR2FycC5Db29raWUgPSB7fTtcblxuLyoqXG4gKiBHcmFiIGEgQ29va2llXG4gKiBAcGFyYW0ge09iamVjdH0gbmFtZVxuICovXG5HYXJwLkNvb2tpZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG5hbWVFUSA9IG5hbWUgKyBcIj1cIjtcbiAgICB2YXIgY2EgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKTtcbiAgICBmb3IgKHZhciBpID0gMCwgY2FsID0gY2EubGVuZ3RoOyBpIDwgY2FsOyArK2kpIHtcbiAgICAgICAgdmFyIGMgPSBjYVtpXTtcbiAgICAgICAgd2hpbGUgKGMuY2hhckF0KDApID09ICcgJykge1xuXHRcdFx0YyA9IGMuc3Vic3RyaW5nKDEsIGMubGVuZ3RoKTtcblx0XHR9XG4gICAgICAgIGlmIChjLmluZGV4T2YobmFtZUVRKSA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIGMuc3Vic3RyaW5nKG5hbWVFUS5sZW5ndGgsIGMubGVuZ3RoKTtcblx0XHR9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufTtcblxuLyoqXG4gKiBTZXQgYSBjb29raWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBuYW1lXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWVcbiAqIEBwYXJhbSB7RGF0ZX0gZXhwaXJhdGlvbiBkYXRlIFxuICovXG5HYXJwLkNvb2tpZS5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgZGF0ZSkge1xuXHR2YWx1ZSA9IGVzY2FwZSh2YWx1ZSkgKyBcIjsgcGF0aD0vXCI7XG5cdHZhbHVlICs9ICghZGF0ZSA/IFwiXCIgOiBcIjsgZXhwaXJlcz1cIiArIGRhdGUudG9HTVRTdHJpbmcoKSk7XG5cdGRvY3VtZW50LmNvb2tpZSA9IG5hbWUgKyBcIj1cIiArIHZhbHVlO1xufTtcblxuR2FycC5Db29raWUucmVtb3ZlID0gZnVuY3Rpb24obmFtZSkge1xuXHRHYXJwLnNldENvb2tpZShuYW1lLCcnLG5ldyBEYXRlKCcxOTAwJykpO1xufTtcbiIsIi8vIE1haW4gYXBwIG5hbWVzcGFjZVxudmFyIGFwcCA9IGFwcCB8fCB7fTtcbmFwcC5pbml0ID0gZnVuY3Rpb24oKSB7XG5cblx0Ly8gSW5pdGlhbGl6ZSBtb2R1bGVzXG5cbn07XG5cblxuLyoqXG4gKiBSZXNwb25zaXZlIGJyZWFrcG9pbnQgcmVnaXN0cnlcbiAqL1xuYXBwLnJlc3BvbnNpdmUgPSAoZnVuY3Rpb24oKSB7XG5cdHZhciBkb2NXaWR0aCxcblx0XHRkb2NXaWR0aFNldHRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZG9jV2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG5cdFx0fTtcblxuXHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZG9jV2lkdGhTZXR0ZXIpO1xuXHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb3JpZW50YXRpb25jaGFuZ2UnLCBkb2NXaWR0aFNldHRlcik7XG5cblx0cmV0dXJuIHtcblx0XHRCUkVBS1BPSU5UX1NNQUxMOiA2ODAsXG5cdFx0QlJFQUtQT0lOVF9NRURJVU06IDk2MCxcblx0XHRCUkVBS1BPSU5UX0xBUkdFOiAxMjAwLFxuXG5cdFx0LyoqXG5cdCBcdCogUmV0dXJuZWQgKGNhY2hlZCkgZG9jdW1lbnQgd2lkdGhcblx0IFx0Ki9cblx0XHRnZXREb2NXaWR0aDogZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIWRvY1dpZHRoKSB7XG5cdFx0XHRcdGRvY1dpZHRoID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGRvY1dpZHRoO1xuXHRcdH0sXG5cdFx0LyoqXG5cdCBcdCogUmVhZCBzdGF0ZSBvZiB2YXJpb3VzIGJyZWFrcG9pbnRzXG5cdCBcdCovXG5cdFx0Z2V0Q3VycmVudEJyZWFrcG9pbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHRyaWVzID0gWydzbWFsbCcsICdtZWRpdW0nLCAnbGFyZ2UnXTtcblx0XHRcdHZhciBpID0gMDtcblx0XHRcdHZhciBicCA9ICdzbWFsbCc7XG5cblx0XHRcdGRvIHtcblx0XHRcdFx0YnAgPSB0cmllc1tpXTtcblx0XHRcdH0gd2hpbGUgKHRoaXMubWF0Y2hlc0JyZWFrcG9pbnQodHJpZXNbKytpXSkpO1xuXHRcdFx0cmV0dXJuIGJwO1xuXHRcdH0sXG5cdFx0LyoqXG5cdCBcdCogUmVhZCBzdGF0ZSBvZiB2YXJpb3VzIGJyZWFrcG9pbnRzXG5cdCBcdCovXG5cdFx0bWF0Y2hlc0JyZWFrcG9pbnQ6IGZ1bmN0aW9uKGJyZWFrcG9pbnQpIHtcblx0XHRcdHN3aXRjaCAoYnJlYWtwb2ludCkge1xuXHRcdFx0XHRjYXNlICdzbWFsbCc6XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0RG9jV2lkdGgoKSA+PSB0aGlzLkJSRUFLUE9JTlRfU01BTEw7XG5cdFx0XHRcdGNhc2UgJ21lZGl1bSc6XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0RG9jV2lkdGgoKSA+PSB0aGlzLkJSRUFLUE9JTlRfTUVESVVNO1xuXHRcdFx0XHRjYXNlICdsYXJnZSc6XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0RG9jV2lkdGgoKSA+PSB0aGlzLkJSRUFLUE9JTlRfTEFSR0U7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xufSkoKTtcblxuLyoqXG4gKiBBZGQgY2xhc3MgdG8gdGhlIGJvZHkgd2hlbiBzY3JvbGxpbmcuXG4gKiBUaGlzIGNsYXNzIGRpc2FibGVkIHBvaW50ZXItZXZlbnRzIGluIHRoZSBDU1MuIEdyZWF0bHkgZW5oYW5jZWQgcGVyZm9ybWFuY2UuXG4gKi9cbmZ1bmN0aW9uIGRpc2FibGVIb3ZlclN0eWxlc09uU2Nyb2xsKCkge1xuXHR2YXIgYm9keSA9IGRvY3VtZW50LmJvZHksIHRpbWVyO1xuXHRpZiAoIWJvZHkuY2xhc3NMaXN0IHx8ICF3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcikge1xuXHRcdHJldHVybjtcblx0fVxuXHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgZnVuY3Rpb24oKSB7XG5cdFx0Y2xlYXJUaW1lb3V0KHRpbWVyKTtcblx0XHRpZighYm9keS5jbGFzc0xpc3QuY29udGFpbnMoJ2Rpc2FibGUtaG92ZXInKSkge1xuXHRcdFx0Ym9keS5jbGFzc0xpc3QuYWRkKCdkaXNhYmxlLWhvdmVyJyk7XG5cdFx0fVxuXG5cdFx0dGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ym9keS5jbGFzc0xpc3QucmVtb3ZlKCdkaXNhYmxlLWhvdmVyJyk7XG5cdFx0fSwgMzAwKTtcblx0fSwgZmFsc2UpO1xufVxuXG5GYXN0Q2xpY2suYXR0YWNoKGRvY3VtZW50LmJvZHkpO1xuZGlzYWJsZUhvdmVyU3R5bGVzT25TY3JvbGwoKTtcblxudmFyIGNvb2tpZV9tc2cgPSBHYXJwLkZsYXNoTWVzc2FnZS5wYXJzZUNvb2tpZSgpO1xuaWYgKGNvb2tpZV9tc2cpIHtcblx0dmFyIGZtID0gbmV3IEdhcnAuRmxhc2hNZXNzYWdlKGNvb2tpZV9tc2cpO1xuXHRmbS5zaG93KCk7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=