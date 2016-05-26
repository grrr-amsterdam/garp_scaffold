export const trackEvent = (category, action, optLabel, optValue, optNoninteraction) => {
	if (typeof ga === 'undefined') {
		console.log('Tracking event', arguments);
		return;
	}
	ga('send', 'event', category, action, optLabel, optValue,
		{ nonInteraction: optNoninteraction });
};

export const handler = () => {
	const category = this.getAttribute('data-event-category');
	const action = this.getAttribute('data-event-action');
	const label = this.getAttribute('data-event-label');
	const value = this.getAttribute('data-event-value');
	trackEvent(category, action, label, value);
};

export const enhancer = () => {
	if (this.nodeName.toUpperCase() !== 'FORM') {
		console.log('I don\'t know how to enhance non-forms.');
	}
	this.addEventListener('submit', e => {
		const category = this.getAttribute('data-event-category');
		const action = this.getAttribute('data-event-action');
		const label = this.getAttribute('data-event-label');
		const value = this.getAttribute('data-event-value');
		trackEvent(category, action, label, value);
	});
};
