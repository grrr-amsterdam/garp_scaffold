var casper = require('casper').create();

casper.start('http://localhost:9000', function() {
	    this.echo(this.getTitle(), 'INFO');
});

casper.run();
