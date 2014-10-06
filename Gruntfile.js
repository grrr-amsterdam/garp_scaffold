/*
----------------------------------

grunt

Run grunt development

----------------------------------

grunt development

['bower', 'copy', 'bower_concat', 'modernizr', 'jshint', 'documentWritify:dev', 'sass:dev', 'autoprefixer:dev']

1. Runs bower install, so all the depencies defined in bower.json are installed
2. Copies over Modernizr, since it is a stand-alone file
3. Concatenates all other bower depencies to one libs.js file
4. Runs modernizr task to automatically determine which tests are necessary, writes resulting file to dev build folder
5. Runs jshint to validate javascript
6. Creates a file which writes all javascript files to the DOM dynamically so the html doesn't need updating when depencies are added
7. Runs sass compilation
8. Runs autoprefixer to add vender prefixes where necessary

----------------------------------

grunt production

['clean:prod', 'bower', 'copy', 'bower_concat', 'modernizr', 'jshint', 'uglify:prod', 'sass:prod', 'autoprefixer:prod', 'cssmin:prod', 'imagemin:compress', 'tinypng:compress']

1. Cleans out js and css build folders so no legacy files are left behind
2. Runs bower install, depencies should already be installed during development, but make sure just in case
3. Copies over Modernizr, since it is a stand-alone file
4. Concatenates all other bower depencies to one libs.js file
5. Runs modernizr task to automatically determine which tests are necessary, writes resulting file to dev build folder
6. Runs jshint to validate javascript
7. Minify javscript and concatenate libs.js with main.js
8. Remove all console and alert instances
9. Runs sass compilation
10. Runs autoprefixer to add vender prefixes where necessary
11. Minify css
12. Compress jpg and gif images used for css
13. Compress png images used for css

----------------------------------

grunt icons

Generate an icon font as well as selectors for usage

----------------------------------

grunt images

Compresses images, see steps 11 and 12 of Grunt production

----------------------------------

grunt stats

Provides with statistics of your css, such as the number of font-sizes used etc.
Run with --e=production if you want to check the production css

----------------------------------
*/
module.exports = function(grunt) {

	var LIVERELOAD_PORT = 35728;

	// File and path configuration
	var paths = {};
	paths.public    = 'public/';

	paths.js        = paths.public + 'js/';
	paths.css       = paths.public + 'css/';

	paths.js_src    = paths.js + 'src/';
	paths.js_build  = paths.js + 'build/';
	paths.js_garp   = paths.js + 'garp/';

	paths.sass      = paths.css + 'sass/';
	paths.css_build = paths.css + 'build/';

	paths.icons     = paths.css + 'icons/';
	paths.fonts     = paths.css_build + 'fonts/icons/';

	// Domain URL form webpagetest grunt task
	var domain = {};
	domain.staging = 'http://staging.grrr.nl';
	domain.production = 'http://grrr.nl';

	// CDN location for image files referenced from css
	var cdn = {
		development: '/css/img',
		staging:     '/css/img',
		production:  '/css/img'
	};

	var	build_stack = {
		'libs': [
			paths.js_src + '/libs.js'
		],
		'garp': [
			paths.js_garp + 'front/styling.js',
			paths.js_garp + 'front/flashmessage.js',
			paths.js_garp + 'front/cookies.js'
		],
		'src': [
			paths.js_src + 'main.js'
		],
		'modernizr': [ paths.js_src + 'modernizr.js' ],
		'models': [ paths.js_garp + 'models/*.js', paths.js + 'models/*.js' ],
		'cms': require('./garp/public/js/cmsBuildStack.js').stack
	};
	build_stack.main = build_stack.libs.concat(build_stack.garp).concat(build_stack.src);

	// Grunt configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		bower: {
			install: {
				options: {
					copy: false
				}
			}
		},
	    bower_concat: {
			all: {
				dest: paths.js_src + 'libs.js',
				exclude: ['jquery', 'modernizr'],
				bowerOptions: {
					relative: false
				}
			}
		},
		copy: {
			main: {
				files: [
					// Copy modernizr
					{expand: true, flatten: true, src: ['bower_components/modernizr/modernizr.js'], dest: paths.js_src, filter: 'isFile'},
				]
			}
		},
		modernizr: {
			dist: {
			    // [REQUIRED] Path to the build you're using for development.
			    "devFile": paths.js_src+"modernizr.js",

			    // [REQUIRED] Path to save out the built file.
			    "outputFile": paths.js_build + "dev/<%=semver%>/modernizr.js",

			    // Based on default settings on http://modernizr.com/download/
			    "extra": {
			        "shiv":       true,
			        "printshiv":  false,
			        "load":       false,
			        "mq":         false,
			        "cssclasses": true
			    },

			    // Based on default settings on http://modernizr.com/download/
			    "extensibility": {
			        "addtest":      false,
			        "prefixed":     false,
			        "teststyles":   false,
			        "testprops":    false,
			        "testallprops": false,
			        "hasevents":    false,
			        "prefixes":     false,
			        "domprefixes":  false
			    },

			    // By default, source is uglified before saving
			    "uglify": false,

			    // Define any tests you want to implicitly include.
			    "tests": [],

			    // By default, this task will crawl your project for references to Modernizr tests.
			    // Set to false to disable.
			    "parseFiles": true,

			    // When parseFiles = true, this task will crawl all *.js, *.css, *.scss files, except files that are in node_modules/.
			    // You can override this by defining a "files" array below.
			    "files": {
					"src": [ paths.js_src + '*', paths.css_build + 'dev/<%=semver%>/*']
			    },

			    // When parseFiles = true, matchCommunityTests = true will attempt to
			    // match user-contributed tests.
			    "matchCommunityTests": false,

			    // Have custom Modernizr tests? Add paths to their location here.
			    "customTests": []
			}
		},
		jshint: {
			main: build_stack.src,
			options: {
				curly: true,
				latedef: true,
				eqnull: true,
				trailing: false,
				browser: true,
				"-W099": true
			}
		},
		documentWritify: {
			dev: {
				files: [
					{ src: build_stack.main,   dest: paths.js_build + 'dev/<%=semver%>/main.js'},
					{ src: build_stack.models, dest: paths.js_build + 'dev/<%=semver%>/extended-models.js'},
					{ src: build_stack.cms,    dest: paths.js_build + 'dev/<%=semver%>/cms.js'}
				],
				options: {
					append: "\ndocument.write(\"<script src=\\\"http://127.0.0.1:" + LIVERELOAD_PORT + "/livereload.js?snipver=1\\\"></script>\");"
				}
			}
		},
		uglify: {
			prod: {
				options: {
					compress: {
						drop_console: true
					}
				},
				files: [
					{src: build_stack.main, dest: paths.js_build + 'prod/<%=semver%>/main.js'},
					{src: build_stack.models, dest: paths.js_build + 'prod/<%=semver%>/extended-models.js'},
					{src: build_stack.cms, dest: paths.js_build + 'prod/<%=semver%>/cms.js'},
					{src: paths.js_build + 'dev/<%=semver%>/modernizr.js', dest: paths.js_build + 'prod/<%=semver%>/modernizr.js'}
				]
			},
			dev: {
				options: {
					compress: {
						drop_console: true
					}
				},
				files: [
					// Do not documentWritify modernizr cause we want to include it directly in the
					// head.
					{src: paths.js_build + "dev/<%=semver%>/modernizr.js", dest: paths.js_build + 'dev/<%=semver%>/modernizr.js'}
				]
			}
		},
		webfont: {
			icons: {
				src: paths.icons + '*.svg',
				dest: paths.fonts,
				destCss: paths.sass + 'imports',
				options: {
					syntax: 'bem',
					stylesheet: 'scss',
					font: 'icons',
					template: paths.sass + 'imports/_icons-template.css',
					relativeFontPath: '../fonts/icons/',
					htmlDemo: false,
					destHtml: paths.fonts
				}
			}
		},
		/* only jpg or gif */
		imagemin: {
			compress: {
				files: [{
					expand: true,
					cwd: paths.css + '/img',
					src: ['**/*.{jpg,gif}'],
					dest: paths.css_build + 'img'
				}]
			}
		},
		/* only png (max 500 requests per month (per API key)) */
		tinypng: {
			options: {
				apiKey: "GpST4zD3uNuHeQbIw7zs3hiL-raKJGMF",
				checkSigs: true,
				sigFile: paths.css_build + 'img/tinypng.json',
				summarize: true
			},
			compress: {
				expand: true,
				src: ['**/*.png'],
				cwd: paths.css + '/img/',
				dest: paths.css_build + 'img/'
			}
		},
		sass: {
			dev: {
				options: {
					imagePath: cdn.development,
					sourceMap: true
				},
				files: (function() {
					var obj = {};
					obj[paths.css_build + 'dev/<%=semver%>/base.css']   = paths.sass + 'base.scss';
					obj[paths.css_build + 'dev/<%=semver%>/cms.css']    = paths.sass + 'cms.scss';
					obj[paths.css_build + 'dev/<%=semver%>/ie-old.css'] = paths.sass + 'ie-old.scss';
					return obj;
				})()
			},
			prod: {
				options: {
					imagePath: cdn.production
				},
				files: (function() {
					var obj = {};
					obj[paths.css_build + 'prod/<%=semver%>/base.css'] = paths.sass + 'base.scss';
					obj[paths.css_build + 'prod/<%=semver%>/cms.css'] = paths.sass + 'cms.scss';
					obj[paths.css_build + 'prod/<%=semver%>/ie-old.css'] = paths.sass + 'ie-old.scss';
					return obj;
				})()
			}
		},
		autoprefixer: {
			options: {
				browsers: ['last 3 version', 'ie 8']
			},
			dev: {
				src: paths.css_build + 'dev/<%=semver%>/*.css'
			},
			prod: {
				src: paths.css_build + 'prod/<%=semver%>/*.css'
			}
		},
		stylestats: {
			options: {
  	  	  	  gzippedSize: true,
			},
			dev: {
				src: [paths.css_build + 'dev/<%=semver%>' ]
			},
			production: {
				src: [paths.css_build + 'prod/<%=semver%>' ]
			}
		},
		/* limited to 200 pageloads per day per API key
		 * for a list of possible locations and browsers, see:
		 * http://www.webpagetest.org/getLocations.php?f=xml
		 */
		perfbudget: {
			default: {
				options: {
					url: domain.staging,
					key: '501e7c4914294a25ab9279ded5f1ce0c',
					location: 'Amsterdam_IISpeed:Chrome'
				}
			},
			production: {
				options: {
					url: domain.production,
					key: '501e7c4914294a25ab9279ded5f1ce0c',
					location: 'Amsterdam_IISpeed:Chrome'
				}
			}
		},
		cssmin: {
			prod: {
				expand: true,
				cwd: paths.css_build + 'prod/<%=semver%>',
				src: ['*.css'],
				dest: paths.css_build + 'prod/<%=semver%>',
				ext: '.css'
			}
		},
		scsslint: {
			allFiles: [
      	  	  paths.sass + '**/*.scss',
    		],
    		options: {
      	  	  bundleExec: false,
      	  	  config: '.scss-lint.yml',
      	  	  colorizeOutput: true
    		}
		},
		watch: {
			sass: {
				files: [paths.sass + '/**/*.scss'],
				tasks: ['determineSemver', 'sass:dev', 'autoprefixer:dev', 'gitBranch', 'echoSemver']
			},
			imagemin: {
				files: [paths.css + 'img/**/*.{jpg,gif}'],
				tasks: ['imagemin:compress']
			},
			tinypng: {
				files: [paths.css + 'img/**/*.png'],
				tasks: ['tinypng:compress']
			},
			livereload: {
				options: {
					livereload: LIVERELOAD_PORT
				},
				files: [
					paths.css_build + '**/*.css',
					paths.js_src + '**/*.js',
					'application/modules/default/views/**/*.phtml',
				]
			}
		},
		clean: {
			prod: [paths.css_build + 'prod/<%=semver%>', paths.js_build + 'prod/<%=semver%>']
		}
	});

	// Load tasks through matchdep
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	/**
	 * Task to combine all provided files into one file by document.writing script tags to include each one
	 * Author: Larix Kortbeek
	 */
	grunt.registerMultiTask("documentWritify", "Refer to all js files from one js", function () {
		var options = this.options({
			append: ''
		});
		// For all destination:files pairs
		var content = this.files.map(function(file) {
			// Loop over all files provided
			var content = file.src.map(function(filepath) {
					filepath = filepath.replace('public', '');
					// Create the document.write script include tag
					return "document.write(\"<script src=\\\"" + filepath + "\\\"></script>\");";
				}).join('\n');

			// Save built string to dest
			content += options.append;
			grunt.file.write(file.dest, content);
			grunt.log.ok('DocumentWritified file "' + file.dest + '" created.');
		});
	});

	/**
	 * Echo current git branch to show which git flow feature is active while running grunt
	 * Author: Larix Kortbeek
	 */
	grunt.registerTask("gitBranch", "Echo current git branch", function () {
		var done = this.async();
		grunt.util.spawn({
			cmd : 'git',
			args : ['rev-parse', '--abbrev-ref', 'HEAD']
		}, function (err, result) {
		  if (!err) {
			grunt.log.writeln('Working on: ' + (result + "").yellow);
			return done();
		  }
		  done(false);
		});
	});

	/**
	 * Echo the project's semver
	 */
	grunt.registerTask('echoSemver', 'Echo current version', function() {
		grunt.log.writeln('Current version: ' + (grunt.config('semver') + '').yellow);
	});

	grunt.registerTask('determineSemver', 'Figure out which version we\'re at', function() {
		var done = this.async();
		grunt.util.spawn({
			cmd: 'semver'
		}, function(err, result) {
			if (err) {
				grunt.log.error(err);
				done(false);
				return false;
			}
			grunt.config('semver', result);
			done();
		});
	});

	/**
	 * grunt development
	 * note: doesn't minify js or css
	 */
	grunt.registerTask('development', [
		'determineSemver',
		'bower',
		'copy',
		'bower_concat',
		'modernizr',
		'jshint',
		'documentWritify:dev',
		'uglify:dev',
		'sass:dev',
		'autoprefixer:dev'
	]);

	/**
	 * grunt production
	 */
	grunt.registerTask('production', [
		'determineSemver',
		'clean:prod',
		'bower',
		'copy',
		'bower_concat',
		'modernizr',
		'jshint',
		'uglify:prod',
		'sass:prod',
		'autoprefixer:prod',
		'cssmin:prod',
		'imagemin:compress',
		'tinypng:compress'
	]);

	/**
	 * grunt icons
	 * note: generates icon font
	 */
	grunt.registerTask('icons', ['determineSemver', 'webfont:icons']);

	/**
	 * grunt images
	 * note: compresses images with imagemin and tinypng
	 */
	grunt.registerTask('images', ['determineSemver', 'imagemin:compress', 'tinypng:compress']);

	/*
	 * grunt stats
	 * note: display stats for stylesheets
	 * usage: pass -e=production to run on production css
	 */
	var env = grunt.option('e') || 'dev';
	grunt.registerTask('stats', ['stylestats:' + env]);
	
	/*
	 * grunt webpagetest
	 * note: domain has to be externally accessible, so no local install
	 * usage: pass -e=production to run on production
	 */
	var env = grunt.option('e') || 'default';
	grunt.registerTask('webpagetest', ['perfbudget:' + env]);

	/**
	 * grunt
	 */
	grunt.registerTask('default', ['development', 'gitBranch', 'echoSemver', 'watch']);

};
