import '../polyfills/classList';
import handle from './modules/handle.js';
import enhance from './modules/enhance.js';

import { init as scrollListener } from './modules/scroll-listener';
import { enhancer as responsive } from './modules/responsive';
import loadIconSprite from './modules/icon-sprite';
import disableHoverStylesOnScroll from './modules/disable-hover-styles-on-scroll.js';
import FlashMessage from './modules/flashmessage.js';

// Import handlers
import { handler as clickTester } from './modules/click-tester.js';
import { handler as classToggler } from './modules/class-toggler.js';
import { hanlder as googleAnalyticsEventHandler } from './modules/google-analytics.js';

// Import enhancers
import { enhancer as loadImage } from './modules/load-image.js';
import { enhancer as googleAnalyticsEventEnhancer } from './modules/google-analytics.js';

let mainReady = false;

function main() {
	if (mainReady) {
		return;
	}

	mainReady = true;

  // Load icon sprite
  loadIconSprite();

	// Flash Messages
	const cookieMsg = FlashMessage.parseCookie();
	if (cookieMsg) {
		const fm = new FlashMessage(cookieMsg);
		fm.show();
	}

	// Disable hover styles on scroll
	disableHoverStylesOnScroll();

  // Initialise central scroll listener
  scrollListener();

  // Initialise central scroll listener
  responsive();

	/**
 	 * We use handlers and enhancers.
 	 * For more info:
 	 * @see https://hiddedevries.nl/en/blog/2015-04-03-progressive-enhancement-with-handlers-and-enhancers
 	 *
 	 * Add handlers and enhancers to the respective lists below, and add the data-handler or
 	 * data-enhancer attributes to your HTML.
 	 *
 	 */
	handle({
		classToggler,
		clickTester,
		googleAnalyticsEventHandler,
	});

	enhance({
		loadImage,
		googleAnalyticsEventEnhancer,
	});
}

if (document.readyState !== "loading") {
	main();
} else {
	document.addEventListener("DOMContentLoaded", main, false);
	document.addEventListener("readystatechange", main, false);
	window.addEventListener("load", main, false);
}
