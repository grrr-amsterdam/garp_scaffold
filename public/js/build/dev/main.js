'use strict';

;(function () {
	'use strict';

	/**
  * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
  *
  * @codingstandard ftlabs-jsv2
  * @copyright The Financial Times Limited [All Rights Reserved]
  * @license MIT License (see LICENSE.txt)
  */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/

	/**
  * Instantiate fast-clicking listeners on the specified layer.
  *
  * @constructor
  * @param {Element} layer The layer to listen on
  * @param {Object} [options={}] The options to override the defaults
  */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
   * Whether a click is currently being tracked.
   *
   * @type boolean
   */
		this.trackingClick = false;

		/**
   * Timestamp for when click tracking started.
   *
   * @type number
   */
		this.trackingClickStart = 0;

		/**
   * The element being tracked for a click.
   *
   * @type EventTarget
   */
		this.targetElement = null;

		/**
   * X-coordinate of touch start event.
   *
   * @type number
   */
		this.touchStartX = 0;

		/**
   * Y-coordinate of touch start event.
   *
   * @type number
   */
		this.touchStartY = 0;

		/**
   * ID of the last touch, retrieved from Touch.identifier.
   *
   * @type number
   */
		this.lastTouchIdentifier = 0;

		/**
   * Touchmove boundary, beyond which a click will be cancelled.
   *
   * @type number
   */
		this.touchBoundary = options.touchBoundary || 10;

		/**
   * The FastClick layer.
   *
   * @type Element
   */
		this.layer = layer;

		/**
   * The minimum time between tap(touchstart and touchend) events
   *
   * @type number
   */
		this.tapDelay = options.tapDelay || 200;

		/**
   * The maximum time for a tap
   *
   * @type number
   */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function () {
				return method.apply(context, arguments);
			};
		}

		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function (type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function (type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function (event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function (event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
 * Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
 *
 * @type boolean
 */
	var deviceIsWindowsPhone = navigator.userAgent.indexOf('Windows Phone') >= 0;

	/**
  * Android requires exceptions.
  *
  * @type boolean
  */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;

	/**
  * iOS requires exceptions.
  *
  * @type boolean
  */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;

	/**
  * iOS 4 requires an exception for select elements.
  *
  * @type boolean
  */
	var deviceIsIOS4 = deviceIsIOS && /OS 4_\d(_\d)?/.test(navigator.userAgent);

	/**
  * iOS 6.0-7.* requires the target element to be manually derived
  *
  * @type boolean
  */
	var deviceIsIOSWithBadTarget = deviceIsIOS && /OS [6-7]_\d/.test(navigator.userAgent);

	/**
  * BlackBerry requires exceptions.
  *
  * @type boolean
  */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
  * Determine whether a given element requires a native click.
  *
  * @param {EventTarget|Element} target Target DOM element
  * @returns {boolean} Returns true if the element needs a native click
  */
	FastClick.prototype.needsClick = function (target) {
		switch (target.nodeName.toLowerCase()) {

			// Don't send a synthetic click to disabled inputs (issue #62)
			case 'button':
			case 'select':
			case 'textarea':
				if (target.disabled) {
					return true;
				}

				break;
			case 'input':

				// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
				if (deviceIsIOS && target.type === 'file' || target.disabled) {
					return true;
				}

				break;
			case 'label':
			case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
			case 'video':
				return true;
		}

		return /\bneedsclick\b/.test(target.className);
	};

	/**
  * Determine whether a given element requires a call to focus to simulate click into element.
  *
  * @param {EventTarget|Element} target Target DOM element
  * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
  */
	FastClick.prototype.needsFocus = function (target) {
		switch (target.nodeName.toLowerCase()) {
			case 'textarea':
				return true;
			case 'select':
				return !deviceIsAndroid;
			case 'input':
				switch (target.type) {
					case 'button':
					case 'checkbox':
					case 'file':
					case 'image':
					case 'radio':
					case 'submit':
						return false;
				}

				// No point in attempting to focus disabled inputs
				return !target.disabled && !target.readOnly;
			default:
				return /\bneedsfocus\b/.test(target.className);
		}
	};

	/**
  * Send a click event to the specified element.
  *
  * @param {EventTarget|Element} targetElement
  * @param {Event} event
  */
	FastClick.prototype.sendClick = function (targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function (targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};

	/**
  * @param {EventTarget|Element} targetElement
  */
	FastClick.prototype.focus = function (targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};

	/**
  * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
  *
  * @param {EventTarget|Element} targetElement
  */
	FastClick.prototype.updateScrollParent = function (targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};

	/**
  * @param {EventTarget} targetElement
  * @returns {Element|EventTarget}
  */
	FastClick.prototype.getTargetElementFromEventTarget = function (eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};

	/**
  * On touch start, record the position and scroll offset.
  *
  * @param {Event} event
  * @returns {boolean}
  */
	FastClick.prototype.onTouchStart = function (event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if (event.timeStamp - this.lastClickTime < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};

	/**
  * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
  *
  * @param {Event} event
  * @returns {boolean}
  */
	FastClick.prototype.touchHasMoved = function (event) {
		var touch = event.changedTouches[0],
		    boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};

	/**
  * Update the last position.
  *
  * @param {Event} event
  * @returns {boolean}
  */
	FastClick.prototype.onTouchMove = function (event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};

	/**
  * Attempt to find the labelled control for the given label element.
  *
  * @param {EventTarget|HTMLLabelElement} labelElement
  * @returns {Element|null}
  */
	FastClick.prototype.findControl = function (labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};

	/**
  * On touch end, determine whether to send a click event at once.
  *
  * @param {Event} event
  * @returns {boolean}
  */
	FastClick.prototype.onTouchEnd = function (event) {
		var forElement,
		    trackingClickStart,
		    targetTagName,
		    scrollParent,
		    touch,
		    targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if (event.timeStamp - this.lastClickTime < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if (event.timeStamp - this.trackingClickStart > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if (event.timeStamp - trackingClickStart > 100 || deviceIsIOS && window.top !== window && targetTagName === 'input') {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};

	/**
  * On touch cancel, stop tracking the click.
  *
  * @returns {void}
  */
	FastClick.prototype.onTouchCancel = function () {
		this.trackingClick = false;
		this.targetElement = null;
	};

	/**
  * Determine mouse events which should be permitted.
  *
  * @param {Event} event
  * @returns {boolean}
  */
	FastClick.prototype.onMouse = function (event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};

	/**
  * On actual clicks, determine whether this is a touch-generated click, a click action occurring
  * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
  * an actual click which should be permitted.
  *
  * @param {Event} event
  * @returns {boolean}
  */
	FastClick.prototype.onClick = function (event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};

	/**
  * Remove all FastClick's event listeners.
  *
  * @returns {void}
  */
	FastClick.prototype.destroy = function () {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};

	/**
  * Check whether FastClick is needed.
  *
  * @param {Element} layer The layer to listen on
  */
	FastClick.notNeeded = function (layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

				// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};

	/**
  * Factory method for creating a FastClick object
  *
  * @param {Element} layer The layer to listen on
  * @param {Object} [options={}] The options to override the defaults
  */
	FastClick.attach = function (layer, options) {
		return new FastClick(layer, options);
	};

	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function () {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
})();

/**
 * Garp styling helpers
 */
if (typeof Garp === 'undefined') {
	var Garp = {};
}

Garp.transitionEndEvents = ['transitionEnd', 'oTransitionEnd', 'msTransitionEnd', 'transitionend', 'webkitTransitionEnd'];

Garp.animationEndEvents = ['animationend', 'webkitAnimationEnd', 'oanimationend', 'MSAnimationEnd'];

Garp.getStyle = function (elm, rule) {
	if (document.defaultView && document.defaultView.getComputedStyle) {
		return document.defaultView.getComputedStyle(elm, '').getPropertyValue(rule);
	}
	if (elm.currentStyle) {
		rule = rule.replace(/\-(\w)/g, function (strMatch, p1) {
			return p1.toUpperCase();
		});
		return elm.currentStyle[rule];
	}
	return '';
};

Garp.getTransitionProperty = function () {
	var el = document.createElement('fakeelement');
	var transitions = ['transition', 'OTransition', 'MSTransition', 'MozTransition', 'WebkitTransition'];
	var getCurriedFunction = function getCurriedFunction(t) {
		return function () {
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

Garp.getAnimationProperty = function () {
	var el = document.createElement('fakeelement');
	var animations = ['animationName', 'OAnimationName', 'MSAnimationName', 'MozAnimationName', 'WebkitAnimationName'];
	var getCurriedFunction = function getCurriedFunction(a) {
		return function () {
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
Garp.getTransitionEndEvent = function () {
	var transitions = {
		transition: 'transitionEnd',
		OTransition: 'oTransitionEnd',
		MSTransition: 'msTransitionEnd',
		MozTransition: 'transitionend',
		WebkitTransition: 'webkitTransitionEnd'
	};
	var t = Garp.getTransitionProperty();
	var getCurriedFunction = function getCurriedFunction(t) {
		return function () {
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
Garp.Cookie.get = function (name) {
	var nameEQ = name + '=';
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
Garp.Cookie.set = function (name, value, date) {
	value = escape(value) + '; path=/';
	value += !date ? '' : '; expires=' + date.toGMTString();
	document.cookie = name + '=' + value;
};

Garp.Cookie.remove = function (name) {
	Garp.setCookie(name, '', new Date('1900'));
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
Garp.FlashMessage = function (msg, timeout) {
	var shouldTimeout = -1 !== timeout,
	    fm,
	    timer,
	    doc = document.documentElement,
	    body = document.getElementsByTagName('body')[0],
	    FM_ACTIVE_CLASS = 'flash-message-active',
	    FM_INACTIVE_CLASS = 'flash-message-inactive';

	// assume seconds
	timeout = timeout || 5;
	if (shouldTimeout) {
		timeout *= 1000;
	}

	// normalize msg to array
	if (typeof msg.push !== 'function') {
		msg = [msg];
	}

	var removeNode = function removeNode() {
		if (!fm) {
			return;
		}
		fm.parentNode.removeChild(fm);
		fm = null;
		doc.className = doc.className.replace(FM_INACTIVE_CLASS, '');
	};

	// Add event listeners that remove the node from the DOM
	// after a transition or animation ends.
	var setRemoveHandler = function setRemoveHandler(transition) {
		var events = transition ? Garp.transitionEndEvents : Garp.animationEndEvents;
		for (var i = 0, el = events.length; i < el; ++i) {
			fm.addEventListener(events[i], removeNode, false);
		}
	};

	var hide = function hide() {
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
	var show = function show() {
		fm = document.createElement('div');
		fm.setAttribute('id', 'flash-message');
		fm.className = 'flash-message';
		var html = '';
		for (var i = 0, ml = msg.length; i < ml; ++i) {
			html += '<p>' + msg[i] + '</p>';
		}
		fm.innerHTML = html;
		body.appendChild(fm);
		setTimeout(function () {
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
Garp.FlashMessage.parseCookie = function () {
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
	Garp.Cookie.set(FM_COOKIE, '', exp, typeof COOKIEDOMAIN !== 'undefined' ? COOKIEDOMAIN : document.location.host);

	return out;
};

/**
 * Responsive breakpoint registry
 */
var app = app || {};

app.responsive = (function () {
	var docWidth,
	    docWidthSetter = function docWidthSetter() {
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
		getDocWidth: function getDocWidth() {
			if (!docWidth) {
				docWidth = document.documentElement.clientWidth;
			}
			return docWidth;
		},
		/**
  	* Read state of various breakpoints
  	*/
		getCurrentBreakpoint: function getCurrentBreakpoint() {
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
		matchesBreakpoint: function matchesBreakpoint(breakpoint) {
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

// Main app namespace
var app = app || {};
app.init = function () {};

/**
 * Add class to the body when scrolling.
 * This class disabled pointer-events in the CSS. Greatly enhanced performance.
 */
function disableHoverStylesOnScroll() {
	var body = document.body,
	    timer;
	if (!body.classList || !window.addEventListener) {
		return;
	}
	window.addEventListener('scroll', function () {
		clearTimeout(timer);
		if (!body.classList.contains('disable-hover')) {
			body.classList.add('disable-hover');
		}

		timer = setTimeout(function () {
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

// Initialize modules
//# sourceMappingURL=data:application/json;base64,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R0FBRSxDQUFDLElBQUksRUFBRSxDQUFDO0NBQ1YiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIjsoZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0LyoqXG5cdCAqIEBwcmVzZXJ2ZSBGYXN0Q2xpY2s6IHBvbHlmaWxsIHRvIHJlbW92ZSBjbGljayBkZWxheXMgb24gYnJvd3NlcnMgd2l0aCB0b3VjaCBVSXMuXG5cdCAqXG5cdCAqIEBjb2RpbmdzdGFuZGFyZCBmdGxhYnMtanN2MlxuXHQgKiBAY29weXJpZ2h0IFRoZSBGaW5hbmNpYWwgVGltZXMgTGltaXRlZCBbQWxsIFJpZ2h0cyBSZXNlcnZlZF1cblx0ICogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKHNlZSBMSUNFTlNFLnR4dClcblx0ICovXG5cblx0Lypqc2xpbnQgYnJvd3Nlcjp0cnVlLCBub2RlOnRydWUqL1xuXHQvKmdsb2JhbCBkZWZpbmUsIEV2ZW50LCBOb2RlKi9cblxuXG5cdC8qKlxuXHQgKiBJbnN0YW50aWF0ZSBmYXN0LWNsaWNraW5nIGxpc3RlbmVycyBvbiB0aGUgc3BlY2lmaWVkIGxheWVyLlxuXHQgKlxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtFbGVtZW50fSBsYXllciBUaGUgbGF5ZXIgdG8gbGlzdGVuIG9uXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHRzXG5cdCAqL1xuXHRmdW5jdGlvbiBGYXN0Q2xpY2sobGF5ZXIsIG9wdGlvbnMpIHtcblx0XHR2YXIgb2xkT25DbGljaztcblxuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdFx0LyoqXG5cdFx0ICogV2hldGhlciBhIGNsaWNrIGlzIGN1cnJlbnRseSBiZWluZyB0cmFja2VkLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgYm9vbGVhblxuXHRcdCAqL1xuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXG5cblx0XHQvKipcblx0XHQgKiBUaW1lc3RhbXAgZm9yIHdoZW4gY2xpY2sgdHJhY2tpbmcgc3RhcnRlZC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0ID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGhlIGVsZW1lbnQgYmVpbmcgdHJhY2tlZCBmb3IgYSBjbGljay5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIEV2ZW50VGFyZ2V0XG5cdFx0ICovXG5cdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblxuXG5cdFx0LyoqXG5cdFx0ICogWC1jb29yZGluYXRlIG9mIHRvdWNoIHN0YXJ0IGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50b3VjaFN0YXJ0WCA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFktY29vcmRpbmF0ZSBvZiB0b3VjaCBzdGFydCBldmVudC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudG91Y2hTdGFydFkgPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBJRCBvZiB0aGUgbGFzdCB0b3VjaCwgcmV0cmlldmVkIGZyb20gVG91Y2guaWRlbnRpZmllci5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMubGFzdFRvdWNoSWRlbnRpZmllciA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRvdWNobW92ZSBib3VuZGFyeSwgYmV5b25kIHdoaWNoIGEgY2xpY2sgd2lsbCBiZSBjYW5jZWxsZWQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRvdWNoQm91bmRhcnkgPSBvcHRpb25zLnRvdWNoQm91bmRhcnkgfHwgMTA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBGYXN0Q2xpY2sgbGF5ZXIuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBFbGVtZW50XG5cdFx0ICovXG5cdFx0dGhpcy5sYXllciA9IGxheWVyO1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIG1pbmltdW0gdGltZSBiZXR3ZWVuIHRhcCh0b3VjaHN0YXJ0IGFuZCB0b3VjaGVuZCkgZXZlbnRzXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRhcERlbGF5ID0gb3B0aW9ucy50YXBEZWxheSB8fCAyMDA7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgbWF4aW11bSB0aW1lIGZvciBhIHRhcFxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50YXBUaW1lb3V0ID0gb3B0aW9ucy50YXBUaW1lb3V0IHx8IDcwMDtcblxuXHRcdGlmIChGYXN0Q2xpY2subm90TmVlZGVkKGxheWVyKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFNvbWUgb2xkIHZlcnNpb25zIG9mIEFuZHJvaWQgZG9uJ3QgaGF2ZSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZFxuXHRcdGZ1bmN0aW9uIGJpbmQobWV0aG9kLCBjb250ZXh0KSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7IHJldHVybiBtZXRob2QuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTsgfTtcblx0XHR9XG5cblxuXHRcdHZhciBtZXRob2RzID0gWydvbk1vdXNlJywgJ29uQ2xpY2snLCAnb25Ub3VjaFN0YXJ0JywgJ29uVG91Y2hNb3ZlJywgJ29uVG91Y2hFbmQnLCAnb25Ub3VjaENhbmNlbCddO1xuXHRcdHZhciBjb250ZXh0ID0gdGhpcztcblx0XHRmb3IgKHZhciBpID0gMCwgbCA9IG1ldGhvZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHRjb250ZXh0W21ldGhvZHNbaV1dID0gYmluZChjb250ZXh0W21ldGhvZHNbaV1dLCBjb250ZXh0KTtcblx0XHR9XG5cblx0XHQvLyBTZXQgdXAgZXZlbnQgaGFuZGxlcnMgYXMgcmVxdWlyZWRcblx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdH1cblxuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkNsaWNrLCB0cnVlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5vblRvdWNoU3RhcnQsIGZhbHNlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlLCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmQsIGZhbHNlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMub25Ub3VjaENhbmNlbCwgZmFsc2UpO1xuXG5cdFx0Ly8gSGFjayBpcyByZXF1aXJlZCBmb3IgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IEV2ZW50I3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoZS5nLiBBbmRyb2lkIDIpXG5cdFx0Ly8gd2hpY2ggaXMgaG93IEZhc3RDbGljayBub3JtYWxseSBzdG9wcyBjbGljayBldmVudHMgYnViYmxpbmcgdG8gY2FsbGJhY2tzIHJlZ2lzdGVyZWQgb24gdGhlIEZhc3RDbGlja1xuXHRcdC8vIGxheWVyIHdoZW4gdGhleSBhcmUgY2FuY2VsbGVkLlxuXHRcdGlmICghRXZlbnQucHJvdG90eXBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbikge1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKSB7XG5cdFx0XHRcdHZhciBybXYgPSBOb2RlLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyO1xuXHRcdFx0XHRpZiAodHlwZSA9PT0gJ2NsaWNrJykge1xuXHRcdFx0XHRcdHJtdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjay5oaWphY2tlZCB8fCBjYWxsYmFjaywgY2FwdHVyZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cm12LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKSB7XG5cdFx0XHRcdHZhciBhZHYgPSBOb2RlLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyO1xuXHRcdFx0XHRpZiAodHlwZSA9PT0gJ2NsaWNrJykge1xuXHRcdFx0XHRcdGFkdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjay5oaWphY2tlZCB8fCAoY2FsbGJhY2suaGlqYWNrZWQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRcdFx0aWYgKCFldmVudC5wcm9wYWdhdGlvblN0b3BwZWQpIHtcblx0XHRcdFx0XHRcdFx0Y2FsbGJhY2soZXZlbnQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pLCBjYXB0dXJlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRhZHYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8vIElmIGEgaGFuZGxlciBpcyBhbHJlYWR5IGRlY2xhcmVkIGluIHRoZSBlbGVtZW50J3Mgb25jbGljayBhdHRyaWJ1dGUsIGl0IHdpbGwgYmUgZmlyZWQgYmVmb3JlXG5cdFx0Ly8gRmFzdENsaWNrJ3Mgb25DbGljayBoYW5kbGVyLiBGaXggdGhpcyBieSBwdWxsaW5nIG91dCB0aGUgdXNlci1kZWZpbmVkIGhhbmRsZXIgZnVuY3Rpb24gYW5kXG5cdFx0Ly8gYWRkaW5nIGl0IGFzIGxpc3RlbmVyLlxuXHRcdGlmICh0eXBlb2YgbGF5ZXIub25jbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuXG5cdFx0XHQvLyBBbmRyb2lkIGJyb3dzZXIgb24gYXQgbGVhc3QgMy4yIHJlcXVpcmVzIGEgbmV3IHJlZmVyZW5jZSB0byB0aGUgZnVuY3Rpb24gaW4gbGF5ZXIub25jbGlja1xuXHRcdFx0Ly8gLSB0aGUgb2xkIG9uZSB3b24ndCB3b3JrIGlmIHBhc3NlZCB0byBhZGRFdmVudExpc3RlbmVyIGRpcmVjdGx5LlxuXHRcdFx0b2xkT25DbGljayA9IGxheWVyLm9uY2xpY2s7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0XHRcdG9sZE9uQ2xpY2soZXZlbnQpO1xuXHRcdFx0fSwgZmFsc2UpO1xuXHRcdFx0bGF5ZXIub25jbGljayA9IG51bGw7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCogV2luZG93cyBQaG9uZSA4LjEgZmFrZXMgdXNlciBhZ2VudCBzdHJpbmcgdG8gbG9vayBsaWtlIEFuZHJvaWQgYW5kIGlQaG9uZS5cblx0KlxuXHQqIEB0eXBlIGJvb2xlYW5cblx0Ki9cblx0dmFyIGRldmljZUlzV2luZG93c1Bob25lID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiV2luZG93cyBQaG9uZVwiKSA+PSAwO1xuXG5cdC8qKlxuXHQgKiBBbmRyb2lkIHJlcXVpcmVzIGV4Y2VwdGlvbnMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0FuZHJvaWQgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSA+IDAgJiYgIWRldmljZUlzV2luZG93c1Bob25lO1xuXG5cblx0LyoqXG5cdCAqIGlPUyByZXF1aXJlcyBleGNlcHRpb25zLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNJT1MgPSAvaVAoYWR8aG9uZXxvZCkvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgIWRldmljZUlzV2luZG93c1Bob25lO1xuXG5cblx0LyoqXG5cdCAqIGlPUyA0IHJlcXVpcmVzIGFuIGV4Y2VwdGlvbiBmb3Igc2VsZWN0IGVsZW1lbnRzLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNJT1M0ID0gZGV2aWNlSXNJT1MgJiYgKC9PUyA0X1xcZChfXFxkKT8vKS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG5cblx0LyoqXG5cdCAqIGlPUyA2LjAtNy4qIHJlcXVpcmVzIHRoZSB0YXJnZXQgZWxlbWVudCB0byBiZSBtYW51YWxseSBkZXJpdmVkXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0lPU1dpdGhCYWRUYXJnZXQgPSBkZXZpY2VJc0lPUyAmJiAoL09TIFs2LTddX1xcZC8pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cblx0LyoqXG5cdCAqIEJsYWNrQmVycnkgcmVxdWlyZXMgZXhjZXB0aW9ucy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzQmxhY2tCZXJyeTEwID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdCQjEwJykgPiAwO1xuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgd2hldGhlciBhIGdpdmVuIGVsZW1lbnQgcmVxdWlyZXMgYSBuYXRpdmUgY2xpY2suXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0IFRhcmdldCBET00gZWxlbWVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHRoZSBlbGVtZW50IG5lZWRzIGEgbmF0aXZlIGNsaWNrXG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm5lZWRzQ2xpY2sgPSBmdW5jdGlvbih0YXJnZXQpIHtcblx0XHRzd2l0Y2ggKHRhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG5cblx0XHQvLyBEb24ndCBzZW5kIGEgc3ludGhldGljIGNsaWNrIHRvIGRpc2FibGVkIGlucHV0cyAoaXNzdWUgIzYyKVxuXHRcdGNhc2UgJ2J1dHRvbic6XG5cdFx0Y2FzZSAnc2VsZWN0Jzpcblx0XHRjYXNlICd0ZXh0YXJlYSc6XG5cdFx0XHRpZiAodGFyZ2V0LmRpc2FibGVkKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdpbnB1dCc6XG5cblx0XHRcdC8vIEZpbGUgaW5wdXRzIG5lZWQgcmVhbCBjbGlja3Mgb24gaU9TIDYgZHVlIHRvIGEgYnJvd3NlciBidWcgKGlzc3VlICM2OClcblx0XHRcdGlmICgoZGV2aWNlSXNJT1MgJiYgdGFyZ2V0LnR5cGUgPT09ICdmaWxlJykgfHwgdGFyZ2V0LmRpc2FibGVkKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdsYWJlbCc6XG5cdFx0Y2FzZSAnaWZyYW1lJzogLy8gaU9TOCBob21lc2NyZWVuIGFwcHMgY2FuIHByZXZlbnQgZXZlbnRzIGJ1YmJsaW5nIGludG8gZnJhbWVzXG5cdFx0Y2FzZSAndmlkZW8nOlxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICgvXFxibmVlZHNjbGlja1xcYi8pLnRlc3QodGFyZ2V0LmNsYXNzTmFtZSk7XG5cdH07XG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBnaXZlbiBlbGVtZW50IHJlcXVpcmVzIGEgY2FsbCB0byBmb2N1cyB0byBzaW11bGF0ZSBjbGljayBpbnRvIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0IFRhcmdldCBET00gZWxlbWVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHRoZSBlbGVtZW50IHJlcXVpcmVzIGEgY2FsbCB0byBmb2N1cyB0byBzaW11bGF0ZSBuYXRpdmUgY2xpY2suXG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm5lZWRzRm9jdXMgPSBmdW5jdGlvbih0YXJnZXQpIHtcblx0XHRzd2l0Y2ggKHRhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0Y2FzZSAndGV4dGFyZWEnOlxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0Y2FzZSAnc2VsZWN0Jzpcblx0XHRcdHJldHVybiAhZGV2aWNlSXNBbmRyb2lkO1xuXHRcdGNhc2UgJ2lucHV0Jzpcblx0XHRcdHN3aXRjaCAodGFyZ2V0LnR5cGUpIHtcblx0XHRcdGNhc2UgJ2J1dHRvbic6XG5cdFx0XHRjYXNlICdjaGVja2JveCc6XG5cdFx0XHRjYXNlICdmaWxlJzpcblx0XHRcdGNhc2UgJ2ltYWdlJzpcblx0XHRcdGNhc2UgJ3JhZGlvJzpcblx0XHRcdGNhc2UgJ3N1Ym1pdCc6XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gTm8gcG9pbnQgaW4gYXR0ZW1wdGluZyB0byBmb2N1cyBkaXNhYmxlZCBpbnB1dHNcblx0XHRcdHJldHVybiAhdGFyZ2V0LmRpc2FibGVkICYmICF0YXJnZXQucmVhZE9ubHk7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdHJldHVybiAoL1xcYm5lZWRzZm9jdXNcXGIvKS50ZXN0KHRhcmdldC5jbGFzc05hbWUpO1xuXHRcdH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBTZW5kIGEgY2xpY2sgZXZlbnQgdG8gdGhlIHNwZWNpZmllZCBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldEVsZW1lbnRcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuc2VuZENsaWNrID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCwgZXZlbnQpIHtcblx0XHR2YXIgY2xpY2tFdmVudCwgdG91Y2g7XG5cblx0XHQvLyBPbiBzb21lIEFuZHJvaWQgZGV2aWNlcyBhY3RpdmVFbGVtZW50IG5lZWRzIHRvIGJlIGJsdXJyZWQgb3RoZXJ3aXNlIHRoZSBzeW50aGV0aWMgY2xpY2sgd2lsbCBoYXZlIG5vIGVmZmVjdCAoIzI0KVxuXHRcdGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IHRhcmdldEVsZW1lbnQpIHtcblx0XHRcdGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuXHRcdH1cblxuXHRcdHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cblx0XHQvLyBTeW50aGVzaXNlIGEgY2xpY2sgZXZlbnQsIHdpdGggYW4gZXh0cmEgYXR0cmlidXRlIHNvIGl0IGNhbiBiZSB0cmFja2VkXG5cdFx0Y2xpY2tFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50cycpO1xuXHRcdGNsaWNrRXZlbnQuaW5pdE1vdXNlRXZlbnQodGhpcy5kZXRlcm1pbmVFdmVudFR5cGUodGFyZ2V0RWxlbWVudCksIHRydWUsIHRydWUsIHdpbmRvdywgMSwgdG91Y2guc2NyZWVuWCwgdG91Y2guc2NyZWVuWSwgdG91Y2guY2xpZW50WCwgdG91Y2guY2xpZW50WSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAsIG51bGwpO1xuXHRcdGNsaWNrRXZlbnQuZm9yd2FyZGVkVG91Y2hFdmVudCA9IHRydWU7XG5cdFx0dGFyZ2V0RWxlbWVudC5kaXNwYXRjaEV2ZW50KGNsaWNrRXZlbnQpO1xuXHR9O1xuXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZGV0ZXJtaW5lRXZlbnRUeXBlID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCkge1xuXG5cdFx0Ly9Jc3N1ZSAjMTU5OiBBbmRyb2lkIENocm9tZSBTZWxlY3QgQm94IGRvZXMgbm90IG9wZW4gd2l0aCBhIHN5bnRoZXRpYyBjbGljayBldmVudFxuXHRcdGlmIChkZXZpY2VJc0FuZHJvaWQgJiYgdGFyZ2V0RWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdzZWxlY3QnKSB7XG5cdFx0XHRyZXR1cm4gJ21vdXNlZG93bic7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICdjbGljayc7XG5cdH07XG5cblxuXHQvKipcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmZvY3VzID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCkge1xuXHRcdHZhciBsZW5ndGg7XG5cblx0XHQvLyBJc3N1ZSAjMTYwOiBvbiBpT1MgNywgc29tZSBpbnB1dCBlbGVtZW50cyAoZS5nLiBkYXRlIGRhdGV0aW1lIG1vbnRoKSB0aHJvdyBhIHZhZ3VlIFR5cGVFcnJvciBvbiBzZXRTZWxlY3Rpb25SYW5nZS4gVGhlc2UgZWxlbWVudHMgZG9uJ3QgaGF2ZSBhbiBpbnRlZ2VyIHZhbHVlIGZvciB0aGUgc2VsZWN0aW9uU3RhcnQgYW5kIHNlbGVjdGlvbkVuZCBwcm9wZXJ0aWVzLCBidXQgdW5mb3J0dW5hdGVseSB0aGF0IGNhbid0IGJlIHVzZWQgZm9yIGRldGVjdGlvbiBiZWNhdXNlIGFjY2Vzc2luZyB0aGUgcHJvcGVydGllcyBhbHNvIHRocm93cyBhIFR5cGVFcnJvci4gSnVzdCBjaGVjayB0aGUgdHlwZSBpbnN0ZWFkLiBGaWxlZCBhcyBBcHBsZSBidWcgIzE1MTIyNzI0LlxuXHRcdGlmIChkZXZpY2VJc0lPUyAmJiB0YXJnZXRFbGVtZW50LnNldFNlbGVjdGlvblJhbmdlICYmIHRhcmdldEVsZW1lbnQudHlwZS5pbmRleE9mKCdkYXRlJykgIT09IDAgJiYgdGFyZ2V0RWxlbWVudC50eXBlICE9PSAndGltZScgJiYgdGFyZ2V0RWxlbWVudC50eXBlICE9PSAnbW9udGgnKSB7XG5cdFx0XHRsZW5ndGggPSB0YXJnZXRFbGVtZW50LnZhbHVlLmxlbmd0aDtcblx0XHRcdHRhcmdldEVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UobGVuZ3RoLCBsZW5ndGgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0YXJnZXRFbGVtZW50LmZvY3VzKCk7XG5cdFx0fVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIENoZWNrIHdoZXRoZXIgdGhlIGdpdmVuIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2YgYSBzY3JvbGxhYmxlIGxheWVyIGFuZCBpZiBzbywgc2V0IGEgZmxhZyBvbiBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLnVwZGF0ZVNjcm9sbFBhcmVudCA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblx0XHR2YXIgc2Nyb2xsUGFyZW50LCBwYXJlbnRFbGVtZW50O1xuXG5cdFx0c2Nyb2xsUGFyZW50ID0gdGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQ7XG5cblx0XHQvLyBBdHRlbXB0IHRvIGRpc2NvdmVyIHdoZXRoZXIgdGhlIHRhcmdldCBlbGVtZW50IGlzIGNvbnRhaW5lZCB3aXRoaW4gYSBzY3JvbGxhYmxlIGxheWVyLiBSZS1jaGVjayBpZiB0aGVcblx0XHQvLyB0YXJnZXQgZWxlbWVudCB3YXMgbW92ZWQgdG8gYW5vdGhlciBwYXJlbnQuXG5cdFx0aWYgKCFzY3JvbGxQYXJlbnQgfHwgIXNjcm9sbFBhcmVudC5jb250YWlucyh0YXJnZXRFbGVtZW50KSkge1xuXHRcdFx0cGFyZW50RWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7XG5cdFx0XHRkbyB7XG5cdFx0XHRcdGlmIChwYXJlbnRFbGVtZW50LnNjcm9sbEhlaWdodCA+IHBhcmVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0KSB7XG5cdFx0XHRcdFx0c2Nyb2xsUGFyZW50ID0gcGFyZW50RWxlbWVudDtcblx0XHRcdFx0XHR0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudCA9IHBhcmVudEVsZW1lbnQ7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRwYXJlbnRFbGVtZW50ID0gcGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuXHRcdFx0fSB3aGlsZSAocGFyZW50RWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0Ly8gQWx3YXlzIHVwZGF0ZSB0aGUgc2Nyb2xsIHRvcCB0cmFja2VyIGlmIHBvc3NpYmxlLlxuXHRcdGlmIChzY3JvbGxQYXJlbnQpIHtcblx0XHRcdHNjcm9sbFBhcmVudC5mYXN0Q2xpY2tMYXN0U2Nyb2xsVG9wID0gc2Nyb2xsUGFyZW50LnNjcm9sbFRvcDtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0RWxlbWVudFxuXHQgKiBAcmV0dXJucyB7RWxlbWVudHxFdmVudFRhcmdldH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZ2V0VGFyZ2V0RWxlbWVudEZyb21FdmVudFRhcmdldCA9IGZ1bmN0aW9uKGV2ZW50VGFyZ2V0KSB7XG5cblx0XHQvLyBPbiBzb21lIG9sZGVyIGJyb3dzZXJzIChub3RhYmx5IFNhZmFyaSBvbiBpT1MgNC4xIC0gc2VlIGlzc3VlICM1NikgdGhlIGV2ZW50IHRhcmdldCBtYXkgYmUgYSB0ZXh0IG5vZGUuXG5cdFx0aWYgKGV2ZW50VGFyZ2V0Lm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuXHRcdFx0cmV0dXJuIGV2ZW50VGFyZ2V0LnBhcmVudE5vZGU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGV2ZW50VGFyZ2V0O1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIHRvdWNoIHN0YXJ0LCByZWNvcmQgdGhlIHBvc2l0aW9uIGFuZCBzY3JvbGwgb2Zmc2V0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaFN0YXJ0ID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgdGFyZ2V0RWxlbWVudCwgdG91Y2gsIHNlbGVjdGlvbjtcblxuXHRcdC8vIElnbm9yZSBtdWx0aXBsZSB0b3VjaGVzLCBvdGhlcndpc2UgcGluY2gtdG8tem9vbSBpcyBwcmV2ZW50ZWQgaWYgYm90aCBmaW5nZXJzIGFyZSBvbiB0aGUgRmFzdENsaWNrIGVsZW1lbnQgKGlzc3VlICMxMTEpLlxuXHRcdGlmIChldmVudC50YXJnZXRUb3VjaGVzLmxlbmd0aCA+IDEpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHRhcmdldEVsZW1lbnQgPSB0aGlzLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQoZXZlbnQudGFyZ2V0KTtcblx0XHR0b3VjaCA9IGV2ZW50LnRhcmdldFRvdWNoZXNbMF07XG5cblx0XHRpZiAoZGV2aWNlSXNJT1MpIHtcblxuXHRcdFx0Ly8gT25seSB0cnVzdGVkIGV2ZW50cyB3aWxsIGRlc2VsZWN0IHRleHQgb24gaU9TIChpc3N1ZSAjNDkpXG5cdFx0XHRzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0XHRpZiAoc2VsZWN0aW9uLnJhbmdlQ291bnQgJiYgIXNlbGVjdGlvbi5pc0NvbGxhcHNlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFkZXZpY2VJc0lPUzQpIHtcblxuXHRcdFx0XHQvLyBXZWlyZCB0aGluZ3MgaGFwcGVuIG9uIGlPUyB3aGVuIGFuIGFsZXJ0IG9yIGNvbmZpcm0gZGlhbG9nIGlzIG9wZW5lZCBmcm9tIGEgY2xpY2sgZXZlbnQgY2FsbGJhY2sgKGlzc3VlICMyMyk6XG5cdFx0XHRcdC8vIHdoZW4gdGhlIHVzZXIgbmV4dCB0YXBzIGFueXdoZXJlIGVsc2Ugb24gdGhlIHBhZ2UsIG5ldyB0b3VjaHN0YXJ0IGFuZCB0b3VjaGVuZCBldmVudHMgYXJlIGRpc3BhdGNoZWRcblx0XHRcdFx0Ly8gd2l0aCB0aGUgc2FtZSBpZGVudGlmaWVyIGFzIHRoZSB0b3VjaCBldmVudCB0aGF0IHByZXZpb3VzbHkgdHJpZ2dlcmVkIHRoZSBjbGljayB0aGF0IHRyaWdnZXJlZCB0aGUgYWxlcnQuXG5cdFx0XHRcdC8vIFNhZGx5LCB0aGVyZSBpcyBhbiBpc3N1ZSBvbiBpT1MgNCB0aGF0IGNhdXNlcyBzb21lIG5vcm1hbCB0b3VjaCBldmVudHMgdG8gaGF2ZSB0aGUgc2FtZSBpZGVudGlmaWVyIGFzIGFuXG5cdFx0XHRcdC8vIGltbWVkaWF0ZWx5IHByZWNlZWRpbmcgdG91Y2ggZXZlbnQgKGlzc3VlICM1MiksIHNvIHRoaXMgZml4IGlzIHVuYXZhaWxhYmxlIG9uIHRoYXQgcGxhdGZvcm0uXG5cdFx0XHRcdC8vIElzc3VlIDEyMDogdG91Y2guaWRlbnRpZmllciBpcyAwIHdoZW4gQ2hyb21lIGRldiB0b29scyAnRW11bGF0ZSB0b3VjaCBldmVudHMnIGlzIHNldCB3aXRoIGFuIGlPUyBkZXZpY2UgVUEgc3RyaW5nLFxuXHRcdFx0XHQvLyB3aGljaCBjYXVzZXMgYWxsIHRvdWNoIGV2ZW50cyB0byBiZSBpZ25vcmVkLiBBcyB0aGlzIGJsb2NrIG9ubHkgYXBwbGllcyB0byBpT1MsIGFuZCBpT1MgaWRlbnRpZmllcnMgYXJlIGFsd2F5cyBsb25nLFxuXHRcdFx0XHQvLyByYW5kb20gaW50ZWdlcnMsIGl0J3Mgc2FmZSB0byB0byBjb250aW51ZSBpZiB0aGUgaWRlbnRpZmllciBpcyAwIGhlcmUuXG5cdFx0XHRcdGlmICh0b3VjaC5pZGVudGlmaWVyICYmIHRvdWNoLmlkZW50aWZpZXIgPT09IHRoaXMubGFzdFRvdWNoSWRlbnRpZmllcikge1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5sYXN0VG91Y2hJZGVudGlmaWVyID0gdG91Y2guaWRlbnRpZmllcjtcblxuXHRcdFx0XHQvLyBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgYSBjaGlsZCBvZiBhIHNjcm9sbGFibGUgbGF5ZXIgKHVzaW5nIC13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOiB0b3VjaCkgYW5kOlxuXHRcdFx0XHQvLyAxKSB0aGUgdXNlciBkb2VzIGEgZmxpbmcgc2Nyb2xsIG9uIHRoZSBzY3JvbGxhYmxlIGxheWVyXG5cdFx0XHRcdC8vIDIpIHRoZSB1c2VyIHN0b3BzIHRoZSBmbGluZyBzY3JvbGwgd2l0aCBhbm90aGVyIHRhcFxuXHRcdFx0XHQvLyB0aGVuIHRoZSBldmVudC50YXJnZXQgb2YgdGhlIGxhc3QgJ3RvdWNoZW5kJyBldmVudCB3aWxsIGJlIHRoZSBlbGVtZW50IHRoYXQgd2FzIHVuZGVyIHRoZSB1c2VyJ3MgZmluZ2VyXG5cdFx0XHRcdC8vIHdoZW4gdGhlIGZsaW5nIHNjcm9sbCB3YXMgc3RhcnRlZCwgY2F1c2luZyBGYXN0Q2xpY2sgdG8gc2VuZCBhIGNsaWNrIGV2ZW50IHRvIHRoYXQgbGF5ZXIgLSB1bmxlc3MgYSBjaGVja1xuXHRcdFx0XHQvLyBpcyBtYWRlIHRvIGVuc3VyZSB0aGF0IGEgcGFyZW50IGxheWVyIHdhcyBub3Qgc2Nyb2xsZWQgYmVmb3JlIHNlbmRpbmcgYSBzeW50aGV0aWMgY2xpY2sgKGlzc3VlICM0MikuXG5cdFx0XHRcdHRoaXMudXBkYXRlU2Nyb2xsUGFyZW50KHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IHRydWU7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrU3RhcnQgPSBldmVudC50aW1lU3RhbXA7XG5cdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDtcblxuXHRcdHRoaXMudG91Y2hTdGFydFggPSB0b3VjaC5wYWdlWDtcblx0XHR0aGlzLnRvdWNoU3RhcnRZID0gdG91Y2gucGFnZVk7XG5cblx0XHQvLyBQcmV2ZW50IHBoYW50b20gY2xpY2tzIG9uIGZhc3QgZG91YmxlLXRhcCAoaXNzdWUgIzM2KVxuXHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdGhpcy5sYXN0Q2xpY2tUaW1lKSA8IHRoaXMudGFwRGVsYXkpIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cblxuXHQvKipcblx0ICogQmFzZWQgb24gYSB0b3VjaG1vdmUgZXZlbnQgb2JqZWN0LCBjaGVjayB3aGV0aGVyIHRoZSB0b3VjaCBoYXMgbW92ZWQgcGFzdCBhIGJvdW5kYXJ5IHNpbmNlIGl0IHN0YXJ0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS50b3VjaEhhc01vdmVkID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXSwgYm91bmRhcnkgPSB0aGlzLnRvdWNoQm91bmRhcnk7XG5cblx0XHRpZiAoTWF0aC5hYnModG91Y2gucGFnZVggLSB0aGlzLnRvdWNoU3RhcnRYKSA+IGJvdW5kYXJ5IHx8IE1hdGguYWJzKHRvdWNoLnBhZ2VZIC0gdGhpcy50b3VjaFN0YXJ0WSkgPiBib3VuZGFyeSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSB0aGUgbGFzdCBwb3NpdGlvbi5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hNb3ZlID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRpZiAoIXRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIHRvdWNoIGhhcyBtb3ZlZCwgY2FuY2VsIHRoZSBjbGljayB0cmFja2luZ1xuXHRcdGlmICh0aGlzLnRhcmdldEVsZW1lbnQgIT09IHRoaXMuZ2V0VGFyZ2V0RWxlbWVudEZyb21FdmVudFRhcmdldChldmVudC50YXJnZXQpIHx8IHRoaXMudG91Y2hIYXNNb3ZlZChldmVudCkpIHtcblx0XHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBBdHRlbXB0IHRvIGZpbmQgdGhlIGxhYmVsbGVkIGNvbnRyb2wgZm9yIHRoZSBnaXZlbiBsYWJlbCBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEhUTUxMYWJlbEVsZW1lbnR9IGxhYmVsRWxlbWVudFxuXHQgKiBAcmV0dXJucyB7RWxlbWVudHxudWxsfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5maW5kQ29udHJvbCA9IGZ1bmN0aW9uKGxhYmVsRWxlbWVudCkge1xuXG5cdFx0Ly8gRmFzdCBwYXRoIGZvciBuZXdlciBicm93c2VycyBzdXBwb3J0aW5nIHRoZSBIVE1MNSBjb250cm9sIGF0dHJpYnV0ZVxuXHRcdGlmIChsYWJlbEVsZW1lbnQuY29udHJvbCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm4gbGFiZWxFbGVtZW50LmNvbnRyb2w7XG5cdFx0fVxuXG5cdFx0Ly8gQWxsIGJyb3dzZXJzIHVuZGVyIHRlc3QgdGhhdCBzdXBwb3J0IHRvdWNoIGV2ZW50cyBhbHNvIHN1cHBvcnQgdGhlIEhUTUw1IGh0bWxGb3IgYXR0cmlidXRlXG5cdFx0aWYgKGxhYmVsRWxlbWVudC5odG1sRm9yKSB7XG5cdFx0XHRyZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobGFiZWxFbGVtZW50Lmh0bWxGb3IpO1xuXHRcdH1cblxuXHRcdC8vIElmIG5vIGZvciBhdHRyaWJ1dGUgZXhpc3RzLCBhdHRlbXB0IHRvIHJldHJpZXZlIHRoZSBmaXJzdCBsYWJlbGxhYmxlIGRlc2NlbmRhbnQgZWxlbWVudFxuXHRcdC8vIHRoZSBsaXN0IG9mIHdoaWNoIGlzIGRlZmluZWQgaGVyZTogaHR0cDovL3d3dy53My5vcmcvVFIvaHRtbDUvZm9ybXMuaHRtbCNjYXRlZ29yeS1sYWJlbFxuXHRcdHJldHVybiBsYWJlbEVsZW1lbnQucXVlcnlTZWxlY3RvcignYnV0dG9uLCBpbnB1dDpub3QoW3R5cGU9aGlkZGVuXSksIGtleWdlbiwgbWV0ZXIsIG91dHB1dCwgcHJvZ3Jlc3MsIHNlbGVjdCwgdGV4dGFyZWEnKTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiB0b3VjaCBlbmQsIGRldGVybWluZSB3aGV0aGVyIHRvIHNlbmQgYSBjbGljayBldmVudCBhdCBvbmNlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaEVuZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIGZvckVsZW1lbnQsIHRyYWNraW5nQ2xpY2tTdGFydCwgdGFyZ2V0VGFnTmFtZSwgc2Nyb2xsUGFyZW50LCB0b3VjaCwgdGFyZ2V0RWxlbWVudCA9IHRoaXMudGFyZ2V0RWxlbWVudDtcblxuXHRcdGlmICghdGhpcy50cmFja2luZ0NsaWNrKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBQcmV2ZW50IHBoYW50b20gY2xpY2tzIG9uIGZhc3QgZG91YmxlLXRhcCAoaXNzdWUgIzM2KVxuXHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdGhpcy5sYXN0Q2xpY2tUaW1lKSA8IHRoaXMudGFwRGVsYXkpIHtcblx0XHRcdHRoaXMuY2FuY2VsTmV4dENsaWNrID0gdHJ1ZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdGhpcy50cmFja2luZ0NsaWNrU3RhcnQpID4gdGhpcy50YXBUaW1lb3V0KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBSZXNldCB0byBwcmV2ZW50IHdyb25nIGNsaWNrIGNhbmNlbCBvbiBpbnB1dCAoaXNzdWUgIzE1NikuXG5cdFx0dGhpcy5jYW5jZWxOZXh0Q2xpY2sgPSBmYWxzZTtcblxuXHRcdHRoaXMubGFzdENsaWNrVGltZSA9IGV2ZW50LnRpbWVTdGFtcDtcblxuXHRcdHRyYWNraW5nQ2xpY2tTdGFydCA9IHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0O1xuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0ID0gMDtcblxuXHRcdC8vIE9uIHNvbWUgaU9TIGRldmljZXMsIHRoZSB0YXJnZXRFbGVtZW50IHN1cHBsaWVkIHdpdGggdGhlIGV2ZW50IGlzIGludmFsaWQgaWYgdGhlIGxheWVyXG5cdFx0Ly8gaXMgcGVyZm9ybWluZyBhIHRyYW5zaXRpb24gb3Igc2Nyb2xsLCBhbmQgaGFzIHRvIGJlIHJlLWRldGVjdGVkIG1hbnVhbGx5LiBOb3RlIHRoYXRcblx0XHQvLyBmb3IgdGhpcyB0byBmdW5jdGlvbiBjb3JyZWN0bHksIGl0IG11c3QgYmUgY2FsbGVkICphZnRlciogdGhlIGV2ZW50IHRhcmdldCBpcyBjaGVja2VkIVxuXHRcdC8vIFNlZSBpc3N1ZSAjNTc7IGFsc28gZmlsZWQgYXMgcmRhcjovLzEzMDQ4NTg5IC5cblx0XHRpZiAoZGV2aWNlSXNJT1NXaXRoQmFkVGFyZ2V0KSB7XG5cdFx0XHR0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuXG5cdFx0XHQvLyBJbiBjZXJ0YWluIGNhc2VzIGFyZ3VtZW50cyBvZiBlbGVtZW50RnJvbVBvaW50IGNhbiBiZSBuZWdhdGl2ZSwgc28gcHJldmVudCBzZXR0aW5nIHRhcmdldEVsZW1lbnQgdG8gbnVsbFxuXHRcdFx0dGFyZ2V0RWxlbWVudCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQodG91Y2gucGFnZVggLSB3aW5kb3cucGFnZVhPZmZzZXQsIHRvdWNoLnBhZ2VZIC0gd2luZG93LnBhZ2VZT2Zmc2V0KSB8fCB0YXJnZXRFbGVtZW50O1xuXHRcdFx0dGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQgPSB0aGlzLnRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50O1xuXHRcdH1cblxuXHRcdHRhcmdldFRhZ05hbWUgPSB0YXJnZXRFbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAodGFyZ2V0VGFnTmFtZSA9PT0gJ2xhYmVsJykge1xuXHRcdFx0Zm9yRWxlbWVudCA9IHRoaXMuZmluZENvbnRyb2wodGFyZ2V0RWxlbWVudCk7XG5cdFx0XHRpZiAoZm9yRWxlbWVudCkge1xuXHRcdFx0XHR0aGlzLmZvY3VzKHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGFyZ2V0RWxlbWVudCA9IGZvckVsZW1lbnQ7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0aGlzLm5lZWRzRm9jdXModGFyZ2V0RWxlbWVudCkpIHtcblxuXHRcdFx0Ly8gQ2FzZSAxOiBJZiB0aGUgdG91Y2ggc3RhcnRlZCBhIHdoaWxlIGFnbyAoYmVzdCBndWVzcyBpcyAxMDBtcyBiYXNlZCBvbiB0ZXN0cyBmb3IgaXNzdWUgIzM2KSB0aGVuIGZvY3VzIHdpbGwgYmUgdHJpZ2dlcmVkIGFueXdheS4gUmV0dXJuIGVhcmx5IGFuZCB1bnNldCB0aGUgdGFyZ2V0IGVsZW1lbnQgcmVmZXJlbmNlIHNvIHRoYXQgdGhlIHN1YnNlcXVlbnQgY2xpY2sgd2lsbCBiZSBhbGxvd2VkIHRocm91Z2guXG5cdFx0XHQvLyBDYXNlIDI6IFdpdGhvdXQgdGhpcyBleGNlcHRpb24gZm9yIGlucHV0IGVsZW1lbnRzIHRhcHBlZCB3aGVuIHRoZSBkb2N1bWVudCBpcyBjb250YWluZWQgaW4gYW4gaWZyYW1lLCB0aGVuIGFueSBpbnB1dHRlZCB0ZXh0IHdvbid0IGJlIHZpc2libGUgZXZlbiB0aG91Z2ggdGhlIHZhbHVlIGF0dHJpYnV0ZSBpcyB1cGRhdGVkIGFzIHRoZSB1c2VyIHR5cGVzIChpc3N1ZSAjMzcpLlxuXHRcdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0cmFja2luZ0NsaWNrU3RhcnQpID4gMTAwIHx8IChkZXZpY2VJc0lPUyAmJiB3aW5kb3cudG9wICE9PSB3aW5kb3cgJiYgdGFyZ2V0VGFnTmFtZSA9PT0gJ2lucHV0JykpIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmZvY3VzKHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0dGhpcy5zZW5kQ2xpY2sodGFyZ2V0RWxlbWVudCwgZXZlbnQpO1xuXG5cdFx0XHQvLyBTZWxlY3QgZWxlbWVudHMgbmVlZCB0aGUgZXZlbnQgdG8gZ28gdGhyb3VnaCBvbiBpT1MgNCwgb3RoZXJ3aXNlIHRoZSBzZWxlY3RvciBtZW51IHdvbid0IG9wZW4uXG5cdFx0XHQvLyBBbHNvIHRoaXMgYnJlYWtzIG9wZW5pbmcgc2VsZWN0cyB3aGVuIFZvaWNlT3ZlciBpcyBhY3RpdmUgb24gaU9TNiwgaU9TNyAoYW5kIHBvc3NpYmx5IG90aGVycylcblx0XHRcdGlmICghZGV2aWNlSXNJT1MgfHwgdGFyZ2V0VGFnTmFtZSAhPT0gJ3NlbGVjdCcpIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGlmIChkZXZpY2VJc0lPUyAmJiAhZGV2aWNlSXNJT1M0KSB7XG5cblx0XHRcdC8vIERvbid0IHNlbmQgYSBzeW50aGV0aWMgY2xpY2sgZXZlbnQgaWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGNvbnRhaW5lZCB3aXRoaW4gYSBwYXJlbnQgbGF5ZXIgdGhhdCB3YXMgc2Nyb2xsZWRcblx0XHRcdC8vIGFuZCB0aGlzIHRhcCBpcyBiZWluZyB1c2VkIHRvIHN0b3AgdGhlIHNjcm9sbGluZyAodXN1YWxseSBpbml0aWF0ZWQgYnkgYSBmbGluZyAtIGlzc3VlICM0MikuXG5cdFx0XHRzY3JvbGxQYXJlbnQgPSB0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudDtcblx0XHRcdGlmIChzY3JvbGxQYXJlbnQgJiYgc2Nyb2xsUGFyZW50LmZhc3RDbGlja0xhc3RTY3JvbGxUb3AgIT09IHNjcm9sbFBhcmVudC5zY3JvbGxUb3ApIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gUHJldmVudCB0aGUgYWN0dWFsIGNsaWNrIGZyb20gZ29pbmcgdGhvdWdoIC0gdW5sZXNzIHRoZSB0YXJnZXQgbm9kZSBpcyBtYXJrZWQgYXMgcmVxdWlyaW5nXG5cdFx0Ly8gcmVhbCBjbGlja3Mgb3IgaWYgaXQgaXMgaW4gdGhlIHdoaXRlbGlzdCBpbiB3aGljaCBjYXNlIG9ubHkgbm9uLXByb2dyYW1tYXRpYyBjbGlja3MgYXJlIHBlcm1pdHRlZC5cblx0XHRpZiAoIXRoaXMubmVlZHNDbGljayh0YXJnZXRFbGVtZW50KSkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHRoaXMuc2VuZENsaWNrKHRhcmdldEVsZW1lbnQsIGV2ZW50KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gdG91Y2ggY2FuY2VsLCBzdG9wIHRyYWNraW5nIHRoZSBjbGljay5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hDYW5jZWwgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIERldGVybWluZSBtb3VzZSBldmVudHMgd2hpY2ggc2hvdWxkIGJlIHBlcm1pdHRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uTW91c2UgPSBmdW5jdGlvbihldmVudCkge1xuXG5cdFx0Ly8gSWYgYSB0YXJnZXQgZWxlbWVudCB3YXMgbmV2ZXIgc2V0IChiZWNhdXNlIGEgdG91Y2ggZXZlbnQgd2FzIG5ldmVyIGZpcmVkKSBhbGxvdyB0aGUgZXZlbnRcblx0XHRpZiAoIXRoaXMudGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKGV2ZW50LmZvcndhcmRlZFRvdWNoRXZlbnQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFByb2dyYW1tYXRpY2FsbHkgZ2VuZXJhdGVkIGV2ZW50cyB0YXJnZXRpbmcgYSBzcGVjaWZpYyBlbGVtZW50IHNob3VsZCBiZSBwZXJtaXR0ZWRcblx0XHRpZiAoIWV2ZW50LmNhbmNlbGFibGUpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIERlcml2ZSBhbmQgY2hlY2sgdGhlIHRhcmdldCBlbGVtZW50IHRvIHNlZSB3aGV0aGVyIHRoZSBtb3VzZSBldmVudCBuZWVkcyB0byBiZSBwZXJtaXR0ZWQ7XG5cdFx0Ly8gdW5sZXNzIGV4cGxpY2l0bHkgZW5hYmxlZCwgcHJldmVudCBub24tdG91Y2ggY2xpY2sgZXZlbnRzIGZyb20gdHJpZ2dlcmluZyBhY3Rpb25zLFxuXHRcdC8vIHRvIHByZXZlbnQgZ2hvc3QvZG91YmxlY2xpY2tzLlxuXHRcdGlmICghdGhpcy5uZWVkc0NsaWNrKHRoaXMudGFyZ2V0RWxlbWVudCkgfHwgdGhpcy5jYW5jZWxOZXh0Q2xpY2spIHtcblxuXHRcdFx0Ly8gUHJldmVudCBhbnkgdXNlci1hZGRlZCBsaXN0ZW5lcnMgZGVjbGFyZWQgb24gRmFzdENsaWNrIGVsZW1lbnQgZnJvbSBiZWluZyBmaXJlZC5cblx0XHRcdGlmIChldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24pIHtcblx0XHRcdFx0ZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdC8vIFBhcnQgb2YgdGhlIGhhY2sgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBFdmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKGUuZy4gQW5kcm9pZCAyKVxuXHRcdFx0XHRldmVudC5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDYW5jZWwgdGhlIGV2ZW50XG5cdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgbW91c2UgZXZlbnQgaXMgcGVybWl0dGVkLCByZXR1cm4gdHJ1ZSBmb3IgdGhlIGFjdGlvbiB0byBnbyB0aHJvdWdoLlxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIGFjdHVhbCBjbGlja3MsIGRldGVybWluZSB3aGV0aGVyIHRoaXMgaXMgYSB0b3VjaC1nZW5lcmF0ZWQgY2xpY2ssIGEgY2xpY2sgYWN0aW9uIG9jY3VycmluZ1xuXHQgKiBuYXR1cmFsbHkgYWZ0ZXIgYSBkZWxheSBhZnRlciBhIHRvdWNoICh3aGljaCBuZWVkcyB0byBiZSBjYW5jZWxsZWQgdG8gYXZvaWQgZHVwbGljYXRpb24pLCBvclxuXHQgKiBhbiBhY3R1YWwgY2xpY2sgd2hpY2ggc2hvdWxkIGJlIHBlcm1pdHRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uQ2xpY2sgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciBwZXJtaXR0ZWQ7XG5cblx0XHQvLyBJdCdzIHBvc3NpYmxlIGZvciBhbm90aGVyIEZhc3RDbGljay1saWtlIGxpYnJhcnkgZGVsaXZlcmVkIHdpdGggdGhpcmQtcGFydHkgY29kZSB0byBmaXJlIGEgY2xpY2sgZXZlbnQgYmVmb3JlIEZhc3RDbGljayBkb2VzIChpc3N1ZSAjNDQpLiBJbiB0aGF0IGNhc2UsIHNldCB0aGUgY2xpY2stdHJhY2tpbmcgZmxhZyBiYWNrIHRvIGZhbHNlIGFuZCByZXR1cm4gZWFybHkuIFRoaXMgd2lsbCBjYXVzZSBvblRvdWNoRW5kIHRvIHJldHVybiBlYXJseS5cblx0XHRpZiAodGhpcy50cmFja2luZ0NsaWNrKSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBWZXJ5IG9kZCBiZWhhdmlvdXIgb24gaU9TIChpc3N1ZSAjMTgpOiBpZiBhIHN1Ym1pdCBlbGVtZW50IGlzIHByZXNlbnQgaW5zaWRlIGEgZm9ybSBhbmQgdGhlIHVzZXIgaGl0cyBlbnRlciBpbiB0aGUgaU9TIHNpbXVsYXRvciBvciBjbGlja3MgdGhlIEdvIGJ1dHRvbiBvbiB0aGUgcG9wLXVwIE9TIGtleWJvYXJkIHRoZSBhIGtpbmQgb2YgJ2Zha2UnIGNsaWNrIGV2ZW50IHdpbGwgYmUgdHJpZ2dlcmVkIHdpdGggdGhlIHN1Ym1pdC10eXBlIGlucHV0IGVsZW1lbnQgYXMgdGhlIHRhcmdldC5cblx0XHRpZiAoZXZlbnQudGFyZ2V0LnR5cGUgPT09ICdzdWJtaXQnICYmIGV2ZW50LmRldGFpbCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cGVybWl0dGVkID0gdGhpcy5vbk1vdXNlKGV2ZW50KTtcblxuXHRcdC8vIE9ubHkgdW5zZXQgdGFyZ2V0RWxlbWVudCBpZiB0aGUgY2xpY2sgaXMgbm90IHBlcm1pdHRlZC4gVGhpcyB3aWxsIGVuc3VyZSB0aGF0IHRoZSBjaGVjayBmb3IgIXRhcmdldEVsZW1lbnQgaW4gb25Nb3VzZSBmYWlscyBhbmQgdGhlIGJyb3dzZXIncyBjbGljayBkb2Vzbid0IGdvIHRocm91Z2guXG5cdFx0aWYgKCFwZXJtaXR0ZWQpIHtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgY2xpY2tzIGFyZSBwZXJtaXR0ZWQsIHJldHVybiB0cnVlIGZvciB0aGUgYWN0aW9uIHRvIGdvIHRocm91Z2guXG5cdFx0cmV0dXJuIHBlcm1pdHRlZDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBSZW1vdmUgYWxsIEZhc3RDbGljaydzIGV2ZW50IGxpc3RlbmVycy5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGF5ZXIgPSB0aGlzLmxheWVyO1xuXG5cdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHR9XG5cblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DbGljaywgdHJ1ZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0LCBmYWxzZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZSwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kLCBmYWxzZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLm9uVG91Y2hDYW5jZWwsIGZhbHNlKTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBDaGVjayB3aGV0aGVyIEZhc3RDbGljayBpcyBuZWVkZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gbGF5ZXIgVGhlIGxheWVyIHRvIGxpc3RlbiBvblxuXHQgKi9cblx0RmFzdENsaWNrLm5vdE5lZWRlZCA9IGZ1bmN0aW9uKGxheWVyKSB7XG5cdFx0dmFyIG1ldGFWaWV3cG9ydDtcblx0XHR2YXIgY2hyb21lVmVyc2lvbjtcblx0XHR2YXIgYmxhY2tiZXJyeVZlcnNpb247XG5cdFx0dmFyIGZpcmVmb3hWZXJzaW9uO1xuXG5cdFx0Ly8gRGV2aWNlcyB0aGF0IGRvbid0IHN1cHBvcnQgdG91Y2ggZG9uJ3QgbmVlZCBGYXN0Q2xpY2tcblx0XHRpZiAodHlwZW9mIHdpbmRvdy5vbnRvdWNoc3RhcnQgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBDaHJvbWUgdmVyc2lvbiAtIHplcm8gZm9yIG90aGVyIGJyb3dzZXJzXG5cdFx0Y2hyb21lVmVyc2lvbiA9ICsoL0Nocm9tZVxcLyhbMC05XSspLy5leGVjKG5hdmlnYXRvci51c2VyQWdlbnQpIHx8IFssMF0pWzFdO1xuXG5cdFx0aWYgKGNocm9tZVZlcnNpb24pIHtcblxuXHRcdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0XHRtZXRhVmlld3BvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9dmlld3BvcnRdJyk7XG5cblx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydCkge1xuXHRcdFx0XHRcdC8vIENocm9tZSBvbiBBbmRyb2lkIHdpdGggdXNlci1zY2FsYWJsZT1cIm5vXCIgZG9lc24ndCBuZWVkIEZhc3RDbGljayAoaXNzdWUgIzg5KVxuXHRcdFx0XHRcdGlmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gQ2hyb21lIDMyIGFuZCBhYm92ZSB3aXRoIHdpZHRoPWRldmljZS13aWR0aCBvciBsZXNzIGRvbid0IG5lZWQgRmFzdENsaWNrXG5cdFx0XHRcdFx0aWYgKGNocm9tZVZlcnNpb24gPiAzMSAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggPD0gd2luZG93Lm91dGVyV2lkdGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHQvLyBDaHJvbWUgZGVza3RvcCBkb2Vzbid0IG5lZWQgRmFzdENsaWNrIChpc3N1ZSAjMTUpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZGV2aWNlSXNCbGFja0JlcnJ5MTApIHtcblx0XHRcdGJsYWNrYmVycnlWZXJzaW9uID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvVmVyc2lvblxcLyhbMC05XSopXFwuKFswLTldKikvKTtcblxuXHRcdFx0Ly8gQmxhY2tCZXJyeSAxMC4zKyBkb2VzIG5vdCByZXF1aXJlIEZhc3RjbGljayBsaWJyYXJ5LlxuXHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2Z0bGFicy9mYXN0Y2xpY2svaXNzdWVzLzI1MVxuXHRcdFx0aWYgKGJsYWNrYmVycnlWZXJzaW9uWzFdID49IDEwICYmIGJsYWNrYmVycnlWZXJzaW9uWzJdID49IDMpIHtcblx0XHRcdFx0bWV0YVZpZXdwb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPXZpZXdwb3J0XScpO1xuXG5cdFx0XHRcdGlmIChtZXRhVmlld3BvcnQpIHtcblx0XHRcdFx0XHQvLyB1c2VyLXNjYWxhYmxlPW5vIGVsaW1pbmF0ZXMgY2xpY2sgZGVsYXkuXG5cdFx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydC5jb250ZW50LmluZGV4T2YoJ3VzZXItc2NhbGFibGU9bm8nKSAhPT0gLTEpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyB3aWR0aD1kZXZpY2Utd2lkdGggKG9yIGxlc3MgdGhhbiBkZXZpY2Utd2lkdGgpIGVsaW1pbmF0ZXMgY2xpY2sgZGVsYXkuXG5cdFx0XHRcdFx0aWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCA8PSB3aW5kb3cub3V0ZXJXaWR0aCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSUUxMCB3aXRoIC1tcy10b3VjaC1hY3Rpb246IG5vbmUgb3IgbWFuaXB1bGF0aW9uLCB3aGljaCBkaXNhYmxlcyBkb3VibGUtdGFwLXRvLXpvb20gKGlzc3VlICM5Nylcblx0XHRpZiAobGF5ZXIuc3R5bGUubXNUb3VjaEFjdGlvbiA9PT0gJ25vbmUnIHx8IGxheWVyLnN0eWxlLnRvdWNoQWN0aW9uID09PSAnbWFuaXB1bGF0aW9uJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gRmlyZWZveCB2ZXJzaW9uIC0gemVybyBmb3Igb3RoZXIgYnJvd3NlcnNcblx0XHRmaXJlZm94VmVyc2lvbiA9ICsoL0ZpcmVmb3hcXC8oWzAtOV0rKS8uZXhlYyhuYXZpZ2F0b3IudXNlckFnZW50KSB8fCBbLDBdKVsxXTtcblxuXHRcdGlmIChmaXJlZm94VmVyc2lvbiA+PSAyNykge1xuXHRcdFx0Ly8gRmlyZWZveCAyNysgZG9lcyBub3QgaGF2ZSB0YXAgZGVsYXkgaWYgdGhlIGNvbnRlbnQgaXMgbm90IHpvb21hYmxlIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9OTIyODk2XG5cblx0XHRcdG1ldGFWaWV3cG9ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT12aWV3cG9ydF0nKTtcblx0XHRcdGlmIChtZXRhVmlld3BvcnQgJiYgKG1ldGFWaWV3cG9ydC5jb250ZW50LmluZGV4T2YoJ3VzZXItc2NhbGFibGU9bm8nKSAhPT0gLTEgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIDw9IHdpbmRvdy5vdXRlcldpZHRoKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJRTExOiBwcmVmaXhlZCAtbXMtdG91Y2gtYWN0aW9uIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgYW5kIGl0J3MgcmVjb21lbmRlZCB0byB1c2Ugbm9uLXByZWZpeGVkIHZlcnNpb25cblx0XHQvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvd2luZG93cy9hcHBzL0hoNzY3MzEzLmFzcHhcblx0XHRpZiAobGF5ZXIuc3R5bGUudG91Y2hBY3Rpb24gPT09ICdub25lJyB8fCBsYXllci5zdHlsZS50b3VjaEFjdGlvbiA9PT0gJ21hbmlwdWxhdGlvbicpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBGYWN0b3J5IG1ldGhvZCBmb3IgY3JlYXRpbmcgYSBGYXN0Q2xpY2sgb2JqZWN0XG5cdCAqXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gbGF5ZXIgVGhlIGxheWVyIHRvIGxpc3RlbiBvblxuXHQgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0c1xuXHQgKi9cblx0RmFzdENsaWNrLmF0dGFjaCA9IGZ1bmN0aW9uKGxheWVyLCBvcHRpb25zKSB7XG5cdFx0cmV0dXJuIG5ldyBGYXN0Q2xpY2sobGF5ZXIsIG9wdGlvbnMpO1xuXHR9O1xuXG5cblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09ICdvYmplY3QnICYmIGRlZmluZS5hbWQpIHtcblxuXHRcdC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cblx0XHRkZWZpbmUoZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gRmFzdENsaWNrO1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBGYXN0Q2xpY2suYXR0YWNoO1xuXHRcdG1vZHVsZS5leHBvcnRzLkZhc3RDbGljayA9IEZhc3RDbGljaztcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cuRmFzdENsaWNrID0gRmFzdENsaWNrO1xuXHR9XG59KCkpO1xuXG4vKipcbiAqIEdhcnAgc3R5bGluZyBoZWxwZXJzXG4gKi9cbmlmICh0eXBlb2YgR2FycCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0dmFyIEdhcnAgPSB7fTtcbn1cblxuR2FycC50cmFuc2l0aW9uRW5kRXZlbnRzID0gW1xuXHQndHJhbnNpdGlvbkVuZCcsXG5cdCdvVHJhbnNpdGlvbkVuZCcsXG5cdCdtc1RyYW5zaXRpb25FbmQnLFxuXHQndHJhbnNpdGlvbmVuZCcsXG5cdCd3ZWJraXRUcmFuc2l0aW9uRW5kJ1xuXTtcblxuR2FycC5hbmltYXRpb25FbmRFdmVudHMgPSBbXG5cdCdhbmltYXRpb25lbmQnLFxuXHQnd2Via2l0QW5pbWF0aW9uRW5kJyxcblx0J29hbmltYXRpb25lbmQnLFxuXHQnTVNBbmltYXRpb25FbmQnXG5dO1xuXG5HYXJwLmdldFN0eWxlID0gZnVuY3Rpb24oZWxtLCBydWxlKSB7XG5cdGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSB7XG5cdFx0cmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWxtLCAnJykuZ2V0UHJvcGVydHlWYWx1ZShydWxlKTtcblx0fVxuXHRpZiAoZWxtLmN1cnJlbnRTdHlsZSkge1xuXHRcdHJ1bGUgPSBydWxlLnJlcGxhY2UoL1xcLShcXHcpL2csIGZ1bmN0aW9uKHN0ck1hdGNoLCBwMSkge1xuXHRcdFx0cmV0dXJuIHAxLnRvVXBwZXJDYXNlKCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGVsbS5jdXJyZW50U3R5bGVbcnVsZV07XG5cdH1cblx0cmV0dXJuICcnO1xufTtcblxuR2FycC5nZXRUcmFuc2l0aW9uUHJvcGVydHkgPSBmdW5jdGlvbigpIHtcblx0dmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZmFrZWVsZW1lbnQnKTtcblx0dmFyIHRyYW5zaXRpb25zID0gW1xuXHRcdCd0cmFuc2l0aW9uJyxcblx0XHQnT1RyYW5zaXRpb24nLFxuXHRcdCdNU1RyYW5zaXRpb24nLFxuXHRcdCdNb3pUcmFuc2l0aW9uJyxcblx0XHQnV2Via2l0VHJhbnNpdGlvbidcblx0XTtcblx0dmFyIGdldEN1cnJpZWRGdW5jdGlvbiA9IGZ1bmN0aW9uKHQpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdDtcblx0XHR9O1xuXHR9O1xuXHRmb3IgKHZhciBpID0gMCwgbHQgPSB0cmFuc2l0aW9ucy5sZW5ndGg7IGkgPCBsdDsgKytpKSB7XG5cdFx0aWYgKGVsLnN0eWxlW3RyYW5zaXRpb25zW2ldXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHQvLyBTcGVlZCB1cCBzdWJzZXF1ZW50IGNhbGxzXG5cdFx0XHRHYXJwLmdldFRyYW5zaXRpb25Qcm9wZXJ0eSA9IGdldEN1cnJpZWRGdW5jdGlvbih0cmFuc2l0aW9uc1tpXSk7XG5cdFx0XHRyZXR1cm4gdHJhbnNpdGlvbnNbaV07XG5cdFx0fVxuXHR9XG5cdHJldHVybiBudWxsO1xufTtcblxuR2FycC5nZXRBbmltYXRpb25Qcm9wZXJ0eSA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmYWtlZWxlbWVudCcpO1xuXHR2YXIgYW5pbWF0aW9ucyA9IFtcblx0XHQnYW5pbWF0aW9uTmFtZScsXG5cdFx0J09BbmltYXRpb25OYW1lJyxcblx0XHQnTVNBbmltYXRpb25OYW1lJyxcblx0XHQnTW96QW5pbWF0aW9uTmFtZScsXG5cdFx0J1dlYmtpdEFuaW1hdGlvbk5hbWUnXG5cdF07XG5cdHZhciBnZXRDdXJyaWVkRnVuY3Rpb24gPSBmdW5jdGlvbihhKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGE7XG5cdFx0fTtcblx0fTtcblx0Zm9yICh2YXIgaSA9IDAsIGxhID0gYW5pbWF0aW9ucy5sZW5ndGg7IGkgPCBsYTsgKytpKSB7XG5cdFx0aWYgKGVsLnN0eWxlW2FuaW1hdGlvbnNbaV1dICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdC8vIFNwZWVkIHVwIHN1YnNlcXVlbnQgY2FsbHNcblx0XHRcdEdhcnAuZ2V0QW5pbWF0aW9uUHJvcGVydHkgPSBnZXRDdXJyaWVkRnVuY3Rpb24oYW5pbWF0aW9uc1tpXSk7XG5cdFx0XHRyZXR1cm4gYW5pbWF0aW9uc1tpXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG51bGw7XG59O1xuXG4vKipcbiAqIEdldCBjcm9zcy1icm93c2VyIHRyYW5zaXRpb25FbmQgZXZlbnRcbiAqIEluc3BpcmF0aW9uOiBAc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTAyMzUxNC9ob3ctZG8taS1ub3JtYWxpemUtY3NzMy10cmFuc2l0aW9uLWZ1bmN0aW9ucy1hY3Jvc3MtYnJvd3NlcnNcbiAqIE5vdGU6IHRoaXMgaXMgbm90IGVudGlyZWx5IHJlbGlhYmxlLCBDaHJvbWUgdXNlcyAndHJhbnNpdGlvbicsIGJ1dCBsaXN0ZW5zIHRvIHRoZSBXZWJraXRUcmFuc2l0aW9uRW5kIGV2ZW50LiBTb21lIHZlcnNpb25zIHRoYXQgaXMuLi5cbiAqL1xuR2FycC5nZXRUcmFuc2l0aW9uRW5kRXZlbnQgPSBmdW5jdGlvbigpIHtcblx0dmFyIHRyYW5zaXRpb25zID0ge1xuXHRcdCd0cmFuc2l0aW9uJzogJ3RyYW5zaXRpb25FbmQnLFxuXHRcdCdPVHJhbnNpdGlvbic6ICdvVHJhbnNpdGlvbkVuZCcsXG5cdFx0J01TVHJhbnNpdGlvbic6ICdtc1RyYW5zaXRpb25FbmQnLFxuXHRcdCdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuXHRcdCdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnXG5cdH07XG5cdHZhciB0ID0gR2FycC5nZXRUcmFuc2l0aW9uUHJvcGVydHkoKTtcblx0dmFyIGdldEN1cnJpZWRGdW5jdGlvbiA9IGZ1bmN0aW9uKHQpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdDtcblx0XHR9O1xuXHR9O1xuXHRpZiAodCAmJiB0IGluIHRyYW5zaXRpb25zKSB7XG5cdFx0R2FycC5nZXRUcmFuc2l0aW9uRW5kRXZlbnQgPSBnZXRDdXJyaWVkRnVuY3Rpb24odHJhbnNpdGlvbnNbdF0pO1xuXHRcdHJldHVybiB0cmFuc2l0aW9uc1t0XTtcblx0fVxuXHRyZXR1cm4gbnVsbDtcbn07XG5cbi8qKlxuICogR2FycCBjb29raWUgaGVscGVyIHV0aWxpdGllc1xuICovXG5pZiAodHlwZW9mIEdhcnAgPT09ICd1bmRlZmluZWQnKSB7XG5cdHZhciBHYXJwID0ge307XG59XG5cbkdhcnAuQ29va2llID0ge307XG5cbi8qKlxuICogR3JhYiBhIENvb2tpZVxuICogQHBhcmFtIHtPYmplY3R9IG5hbWVcbiAqL1xuR2FycC5Db29raWUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBuYW1lRVEgPSBuYW1lICsgXCI9XCI7XG4gICAgdmFyIGNhID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7Jyk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGNhbCA9IGNhLmxlbmd0aDsgaSA8IGNhbDsgKytpKSB7XG4gICAgICAgIHZhciBjID0gY2FbaV07XG4gICAgICAgIHdoaWxlIChjLmNoYXJBdCgwKSA9PSAnICcpIHtcblx0XHRcdGMgPSBjLnN1YnN0cmluZygxLCBjLmxlbmd0aCk7XG5cdFx0fVxuICAgICAgICBpZiAoYy5pbmRleE9mKG5hbWVFUSkgPT09IDApIHtcblx0XHRcdHJldHVybiBjLnN1YnN0cmluZyhuYW1lRVEubGVuZ3RoLCBjLmxlbmd0aCk7XG5cdFx0fVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn07XG5cbi8qKlxuICogU2V0IGEgY29va2llXG4gKiBAcGFyYW0ge09iamVjdH0gbmFtZVxuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlXG4gKiBAcGFyYW0ge0RhdGV9IGV4cGlyYXRpb24gZGF0ZSBcbiAqL1xuR2FycC5Db29raWUuc2V0ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGRhdGUpIHtcblx0dmFsdWUgPSBlc2NhcGUodmFsdWUpICsgXCI7IHBhdGg9L1wiO1xuXHR2YWx1ZSArPSAoIWRhdGUgPyBcIlwiIDogXCI7IGV4cGlyZXM9XCIgKyBkYXRlLnRvR01UU3RyaW5nKCkpO1xuXHRkb2N1bWVudC5jb29raWUgPSBuYW1lICsgXCI9XCIgKyB2YWx1ZTtcbn07XG5cbkdhcnAuQ29va2llLnJlbW92ZSA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0R2FycC5zZXRDb29raWUobmFtZSwnJyxuZXcgRGF0ZSgnMTkwMCcpKTtcbn07XG5cbi8qKlxuICogR2FycCBGbGFzaE1lc3NhZ2VcbiAqIEFQSTpcbiAqIC8vIFNob3cgbWVzc2FnZSBmb3IgMiBzZWNvbmRzXG4gKiB2YXIgZm0gPSBuZXcgR2FycC5GbGFzaE1lc3NhZ2UoJ3lvdSBoYXZlIGJlZW4gbG9nZ2VkIG91dCcsIDIpO1xuICogZm0uc2hvdygpO1xuICpcbiAqIC8vIFNob3cgbWVzc2FnZSBmb3JldmVyIGFuZCBldmVyOlxuICogdmFyIGZtID0gbmV3IEdhcnAuRmxhc2hNZXNzYWdlKCd5b3UgaGF2ZSBiZWVuIGxvZ2dlZCBvdXQnLCAtMSk7XG4gKiBmbS5zaG93KCk7XG4gKlxuICogLy8gSGlkZSBtYW51YWxseVxuICogZm0uaGlkZSgpO1xuICovXG5pZiAodHlwZW9mIEdhcnAgPT09ICd1bmRlZmluZWQnKSB7XG5cdHZhciBHYXJwID0ge307XG59XG5cbi8qKlxuICogRmxhc2hNZXNzYWdlXG4gKiBTaG93cyBhIHF1aWNrIHN5c3RlbSBtZXNzYWdlIGluIGFuIG92ZXJsYXkgb3IgZGlhbG9nIGJveC5cbiAqIEBwYXJhbSBTdHJpbmd8QXJyYXkgbXNnIFRoZSBtZXNzYWdlLCBvciBjb2xsZWN0aW9uIG9mIG1lc3NhZ2VzXG4gKiBAcGFyYW0gSW50IHRpbWVvdXQgSG93IGxvbmcgdGhlIG1lc3NhZ2Ugd2lsbCBiZSBkaXNwbGF5ZWQuIERlZmF1bHRzIHRvIDUuIFVzZSAtMSB0byBuZXZlciBoaWRlLiAoaW4gc2Vjb25kcylcbiAqL1xuR2FycC5GbGFzaE1lc3NhZ2UgPSBmdW5jdGlvbihtc2csIHRpbWVvdXQpIHtcblx0dmFyIHNob3VsZFRpbWVvdXQgPSAtMSAhPT0gdGltZW91dCxcblx0XHRmbSxcblx0XHR0aW1lcixcblx0XHRkb2MgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG5cdFx0Ym9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0sXG5cdFx0Rk1fQUNUSVZFX0NMQVNTID0gJ2ZsYXNoLW1lc3NhZ2UtYWN0aXZlJyxcblx0XHRGTV9JTkFDVElWRV9DTEFTUyA9ICdmbGFzaC1tZXNzYWdlLWluYWN0aXZlJ1xuXHQ7XG5cblx0Ly8gYXNzdW1lIHNlY29uZHNcblx0dGltZW91dCA9IHRpbWVvdXQgfHwgNTtcblx0aWYgKHNob3VsZFRpbWVvdXQpIHtcblx0XHR0aW1lb3V0ICo9IDEwMDA7XG5cdH1cblxuXHQvLyBub3JtYWxpemUgbXNnIHRvIGFycmF5XG5cdGlmICh0eXBlb2YgbXNnLnB1c2ggIT09ICdmdW5jdGlvbicpIHtcblx0XHRtc2cgPSBbbXNnXTtcblx0fVxuXG5cdHZhciByZW1vdmVOb2RlID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCFmbSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRmbS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGZtKTtcblx0XHRmbSA9IG51bGw7XG5cdFx0ZG9jLmNsYXNzTmFtZSA9IGRvYy5jbGFzc05hbWUucmVwbGFjZShGTV9JTkFDVElWRV9DTEFTUywgJycpO1xuXHR9O1xuXG5cdC8vIEFkZCBldmVudCBsaXN0ZW5lcnMgdGhhdCByZW1vdmUgdGhlIG5vZGUgZnJvbSB0aGUgRE9NXG5cdC8vIGFmdGVyIGEgdHJhbnNpdGlvbiBvciBhbmltYXRpb24gZW5kcy5cblx0dmFyIHNldFJlbW92ZUhhbmRsZXIgPSBmdW5jdGlvbih0cmFuc2l0aW9uKSB7XG5cdFx0dmFyIGV2ZW50cyA9IHRyYW5zaXRpb24gPyBHYXJwLnRyYW5zaXRpb25FbmRFdmVudHMgOiBHYXJwLmFuaW1hdGlvbkVuZEV2ZW50cztcblx0XHRmb3IgKHZhciBpID0gMCwgZWwgPSBldmVudHMubGVuZ3RoOyBpIDwgZWw7ICsraSkge1xuXHRcdFx0Zm0uYWRkRXZlbnRMaXN0ZW5lcihldmVudHNbaV0sIHJlbW92ZU5vZGUsIGZhbHNlKTtcblx0XHR9XG5cdH07XG5cblx0dmFyIGhpZGUgPSBmdW5jdGlvbigpIHtcblx0XHRjbGVhckludGVydmFsKHRpbWVyKTtcblx0XHRpZiAoIWZtKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIHQgPSBHYXJwLmdldFN0eWxlKGZtLCBHYXJwLmdldFRyYW5zaXRpb25Qcm9wZXJ0eSgpKSxcblx0XHRcdGEgPSBHYXJwLmdldFN0eWxlKGZtLCBHYXJwLmdldEFuaW1hdGlvblByb3BlcnR5KCkpO1xuXG5cdFx0aWYgKHQgfHwgYSkge1xuXHRcdFx0c2V0UmVtb3ZlSGFuZGxlcih0KTtcblx0XHR9XG5cdFx0ZG9jLmNsYXNzTmFtZSA9IGRvYy5jbGFzc05hbWUucmVwbGFjZShGTV9BQ1RJVkVfQ0xBU1MsIEZNX0lOQUNUSVZFX0NMQVNTKTtcblxuXHRcdGlmICghdCAmJiAhYSkge1xuXHRcdFx0cmVtb3ZlTm9kZSgpO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogU2hvdyB0aGUgbWVzc2FnZS5cblx0ICogQSB0aW1lciB3aWxsIGJlIHNldCB0aGF0IGhpZGVzIHRoZSBpdC5cblx0ICovXG5cdHZhciBzaG93ID0gZnVuY3Rpb24oKSB7XG5cdFx0Zm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRmbS5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2ZsYXNoLW1lc3NhZ2UnKTtcblx0XHRmbS5jbGFzc05hbWUgPSAnZmxhc2gtbWVzc2FnZSc7XG5cdFx0dmFyIGh0bWwgPSAnJztcblx0XHRmb3IgKHZhciBpID0gMCwgbWwgPSBtc2cubGVuZ3RoOyBpIDwgbWw7ICsraSkge1xuXHRcdFx0aHRtbCArPSAnPHA+JyArIG1zZ1tpXSArICc8L3A+Jztcblx0XHR9XG5cdFx0Zm0uaW5uZXJIVE1MID0gaHRtbDtcblx0XHRib2R5LmFwcGVuZENoaWxkKGZtKTtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0ZG9jLmNsYXNzTmFtZSArPSAnICcgKyBGTV9BQ1RJVkVfQ0xBU1M7XG5cdFx0fSwgMCk7XG5cblx0XHQvLyBjbGlja2luZyBvbiBmbGFzaCBtZXNzYWdlIGhpZGVzIGl0XG5cdFx0Zm0ub25jbGljayA9IGhpZGU7XG5cdFx0aWYgKHNob3VsZFRpbWVvdXQpIHtcblx0XHRcdHRpbWVyID0gc2V0VGltZW91dChoaWRlLCB0aW1lb3V0KTtcblx0XHR9XG5cdH07XG5cblx0Ly8gcHVibGljIGFwaVxuXHR0aGlzLnNob3cgPSBzaG93O1xuXHR0aGlzLmhpZGUgPSBoaWRlO1xuXG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZWFkIHRoZSBkZXNpZ25hdGVkIGZsYXNoTWVzc2FnZSBjb29raWVcbiAqL1xuR2FycC5GbGFzaE1lc3NhZ2UucGFyc2VDb29raWUgPSBmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBKU09OID09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBKU09OLnBhcnNlICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cdHZhciBGTV9DT09LSUUgPSAnRmxhc2hNZXNzZW5nZXInLFxuXHRcdG0gPSBKU09OLnBhcnNlKHVuZXNjYXBlKEdhcnAuQ29va2llLmdldChGTV9DT09LSUUpKSksXG5cdFx0b3V0ID0gW107XG5cdGlmICghbSB8fCAhbS5tZXNzYWdlcykge1xuXHRcdHJldHVybiAnJztcblx0fVxuXHRmb3IgKHZhciBpIGluIG0ubWVzc2FnZXMpIHtcblx0XHR2YXIgbXNnID0gbS5tZXNzYWdlc1tpXTtcblx0XHRpZiAobXNnKSB7XG5cdFx0XHRvdXQucHVzaChtc2cucmVwbGFjZSgvXFwrL2csICcgJykpO1xuXHRcdH1cblx0fVxuXG5cdC8vIFJlbW92ZSB0aGUgY29va2llIGFmdGVyIHBhcnNpbmcgdGhlIGZsYXNoIG1lc3NhZ2Vcblx0dmFyIGV4cCA9IG5ldyBEYXRlKCk7XG5cdGV4cC5zZXRIb3VycyhleHAuZ2V0SG91cnMoKSAtIDEpO1xuXHRHYXJwLkNvb2tpZS5zZXQoRk1fQ09PS0lFLCAnJywgZXhwLCAodHlwZW9mIENPT0tJRURPTUFJTiAhPT0gJ3VuZGVmaW5lZCcpID8gQ09PS0lFRE9NQUlOIDogZG9jdW1lbnQubG9jYXRpb24uaG9zdCk7XG5cblx0cmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmVzcG9uc2l2ZSBicmVha3BvaW50IHJlZ2lzdHJ5XG4gKi9cbnZhciBhcHAgPSBhcHAgfHwge307XG5cbmFwcC5yZXNwb25zaXZlID0gKGZ1bmN0aW9uKCkge1xuXHR2YXIgZG9jV2lkdGgsXG5cdFx0ZG9jV2lkdGhTZXR0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdGRvY1dpZHRoID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xuXHRcdH07XG5cblx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGRvY1dpZHRoU2V0dGVyKTtcblx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgZG9jV2lkdGhTZXR0ZXIpO1xuXG5cdHJldHVybiB7XG5cdFx0QlJFQUtQT0lOVF9TTUFMTDogNjgwLFxuXHRcdEJSRUFLUE9JTlRfTUVESVVNOiA5NjAsXG5cdFx0QlJFQUtQT0lOVF9MQVJHRTogMTIwMCxcblxuXHRcdC8qKlxuXHQgXHQqIFJldHVybmVkIChjYWNoZWQpIGRvY3VtZW50IHdpZHRoXG5cdCBcdCovXG5cdFx0Z2V0RG9jV2lkdGg6IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCFkb2NXaWR0aCkge1xuXHRcdFx0XHRkb2NXaWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBkb2NXaWR0aDtcblx0XHR9LFxuXHRcdC8qKlxuXHQgXHQqIFJlYWQgc3RhdGUgb2YgdmFyaW91cyBicmVha3BvaW50c1xuXHQgXHQqL1xuXHRcdGdldEN1cnJlbnRCcmVha3BvaW50OiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciB0cmllcyA9IFsnc21hbGwnLCAnbWVkaXVtJywgJ2xhcmdlJ107XG5cdFx0XHR2YXIgaSA9IDA7XG5cdFx0XHR2YXIgYnAgPSAnc21hbGwnO1xuXG5cdFx0XHRkbyB7XG5cdFx0XHRcdGJwID0gdHJpZXNbaV07XG5cdFx0XHR9IHdoaWxlICh0aGlzLm1hdGNoZXNCcmVha3BvaW50KHRyaWVzWysraV0pKTtcblx0XHRcdHJldHVybiBicDtcblx0XHR9LFxuXHRcdC8qKlxuXHQgXHQqIFJlYWQgc3RhdGUgb2YgdmFyaW91cyBicmVha3BvaW50c1xuXHQgXHQqL1xuXHRcdG1hdGNoZXNCcmVha3BvaW50OiBmdW5jdGlvbihicmVha3BvaW50KSB7XG5cdFx0XHRzd2l0Y2ggKGJyZWFrcG9pbnQpIHtcblx0XHRcdFx0Y2FzZSAnc21hbGwnOlxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmdldERvY1dpZHRoKCkgPj0gdGhpcy5CUkVBS1BPSU5UX1NNQUxMO1xuXHRcdFx0XHRjYXNlICdtZWRpdW0nOlxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmdldERvY1dpZHRoKCkgPj0gdGhpcy5CUkVBS1BPSU5UX01FRElVTTtcblx0XHRcdFx0Y2FzZSAnbGFyZ2UnOlxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmdldERvY1dpZHRoKCkgPj0gdGhpcy5CUkVBS1BPSU5UX0xBUkdFO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn0pKCk7XG5cbi8vIE1haW4gYXBwIG5hbWVzcGFjZVxudmFyIGFwcCA9IGFwcCB8fCB7fTtcbmFwcC5pbml0ID0gZnVuY3Rpb24oKSB7XG5cblx0Ly8gSW5pdGlhbGl6ZSBtb2R1bGVzXG5cbn07XG5cblxuXG4vKipcbiAqIEFkZCBjbGFzcyB0byB0aGUgYm9keSB3aGVuIHNjcm9sbGluZy5cbiAqIFRoaXMgY2xhc3MgZGlzYWJsZWQgcG9pbnRlci1ldmVudHMgaW4gdGhlIENTUy4gR3JlYXRseSBlbmhhbmNlZCBwZXJmb3JtYW5jZS5cbiAqL1xuZnVuY3Rpb24gZGlzYWJsZUhvdmVyU3R5bGVzT25TY3JvbGwoKSB7XG5cdHZhciBib2R5ID0gZG9jdW1lbnQuYm9keSwgdGltZXI7XG5cdGlmICghYm9keS5jbGFzc0xpc3QgfHwgIXdpbmRvdy5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBmdW5jdGlvbigpIHtcblx0XHRjbGVhclRpbWVvdXQodGltZXIpO1xuXHRcdGlmKCFib2R5LmNsYXNzTGlzdC5jb250YWlucygnZGlzYWJsZS1ob3ZlcicpKSB7XG5cdFx0XHRib2R5LmNsYXNzTGlzdC5hZGQoJ2Rpc2FibGUtaG92ZXInKTtcblx0XHR9XG5cblx0XHR0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2Rpc2FibGUtaG92ZXInKTtcblx0XHR9LCAzMDApO1xuXHR9LCBmYWxzZSk7XG59XG5cbkZhc3RDbGljay5hdHRhY2goZG9jdW1lbnQuYm9keSk7XG5kaXNhYmxlSG92ZXJTdHlsZXNPblNjcm9sbCgpO1xuXG52YXIgY29va2llX21zZyA9IEdhcnAuRmxhc2hNZXNzYWdlLnBhcnNlQ29va2llKCk7XG5pZiAoY29va2llX21zZykge1xuXHR2YXIgZm0gPSBuZXcgR2FycC5GbGFzaE1lc3NhZ2UoY29va2llX21zZyk7XG5cdGZtLnNob3coKTtcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==