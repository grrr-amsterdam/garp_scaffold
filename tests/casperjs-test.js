var casper = require('casper').create();

casper.start('http://grrr.nl/', function() {
	    this.echo(this.getTitle(), 'INFO');
});

casper.run();
