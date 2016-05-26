import handle from './modules/handle.js';
import enhance from './modules/enhance.js';

// Import functions that are executed on DOMready regardless of DOM
import { enhancer as scrollListener } from './modules/scroll-listener';
import { enhancer as responsive } from './modules/responsive';
import loadIconSprite from './modules/icon-sprite';
import disableHoverStylesOnScroll from './modules/disable-hover-styles-on-scroll.js';
import FlashMessage from './modules/flashmessage.js';

// Import handlers
import { handler as classToggler } from './modules/class-toggler.js';
import { hanlder as googleAnalyticsEventHandler } from './modules/google-analytics.js';

// Import enhancers
import { enhancer as googleAnalyticsEventEnhancer } from './modules/google-analytics.js';

let mainReady = false;

const executeOnReady = () => {
	// Flash Messages
	const cookieMsg = FlashMessage.parseCookie();
	if (cookieMsg) {
		const fm = new FlashMessage(cookieMsg);
		fm.show();
	}
  
  loadIconSprite(); // Load icon sprite
	disableHoverStylesOnScroll(); // Disable hover styles on scroll
  scrollListener(); // Initialise central scroll listener
  responsive(); // Set document width on resize and orientation change
}

function main() {
	if (mainReady) {
		return;
	}

	mainReady = true;

  // Setup the basics
	executeOnReady();

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
		googleAnalyticsEventHandler,
	});

	enhance({
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
