/*
----------------------------------

grunt

Run grunt development

----------------------------------

grunt development

['bower', 'copy', 'bower_concat', 'modernizr', 'jshint', 'documentWritify:dev', 'sass:dev', 'autoprefixer:dev']

1. Runs bower install, so all the depencies defined in bower.json are installed
2. Copies over Modernizr and jQuery if used, since these are standalone files
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
3. Copies over Modernizr and jQuery if used, since these are standalone files
4. Concatenates all other bower depencies to one libs.js file
5. Runs modernizr task to automatically determine which tests are necessary, writes resulting file to dev build folder
6. Runs jshint to validate javascript
7. Minify javscript and concatenate libs.js with main.js
8. Runs sass compilation
9. Runs autoprefixer to add vender prefixes where necessary
10. Minify css
11. Compress jpg and gif images used for css
12. Compress png images used for css

* May produce a warning when jQuery is not used, this is expected behaviour and safe to ignore

----------------------------------

grunt icons

Generate an icon font as well as selectors for usage

----------------------------------

grunt images

Compresses images, see steps 11 and 12 of Grunt production

----------------------------------
*/

module.exports = function(grunt) {


	// File and path configuration
	var paths = {};
	paths.public   = 'public/';

	paths.js       = paths.public + 'js/';
	paths.css      = paths.public + 'css/';

	paths.js_src   = paths.js + 'src/';
	paths.js_garp  = paths.js + 'garp/';
	paths.js_extux = paths.js_garp + 'extux/';
	paths.build    = paths.js + 'build/';

	paths.sass     = paths.css    + 'sass/';

	paths.icons    = paths.css    + 'icons/';
	paths.fonts    = paths.css    + 'compiled/fonts/icons/';

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
		'jquery': [ paths.js_src + 'jquery.js' ],
		'models': [ paths.js_garp + 'models/*.js', paths.js + 'models/*.js' ],
		'cms': [
			paths.js_garp + 'overrides.js',
			paths.js_garp + 'garp.config.js',
			paths.js_garp + 'garp.renderers.js',
			paths.js_extux + 'ext.ux.searchbar.js',
			paths.js_extux + 'ext.ux.form.datetime.js',
			paths.js_garp + 'garp.mapwindow.js',
			paths.js_garp + 'garp.mapfield.js',
			paths.js_extux + 'ext.ux.form.rendereddisplayfield.js',
			paths.js_extux + 'ext.ux.form.fileuploadfield.js',
			paths.js_extux + 'ext.ux.form.uploadcombo.js',
			paths.js_extux + 'ext.ux.form.uploadfield.js',
			paths.js_extux + 'ext.ux.pagingsearchbar.js',
			paths.js_extux + 'ext.ux.form.searchfield.js',
			paths.js_extux + 'ext.ux.form.richtexteditor.js',
			paths.js_garp + 'garp.i18n.js',
			paths.js_garp + 'garp.wysiwygct.js',
			paths.js_garp + 'garp.wysiwygabstract.js',
			paths.js_garp + 'garp.filtermenu.js',
			paths.js_garp + 'garp.tweetwindow.js',
			paths.js_garp + 'garp.imageeditor.js',
			paths.js_garp + 'garp.imagepickerwindow.js',
			paths.js_garp + 'garp.modelpickerwindow.js',
			paths.js_garp + 'garp.relatecreatewindow.js',
			paths.js_garp + 'garp.inlinerelator.js',
			paths.js_garp + 'youtubeuploadwindow.js',
			paths.js_extux + 'ext.ux.relationfield.js',
			paths.js_extux + 'ext.ux.relationpanel.js',
			paths.js_extux + 'ext.ux.superboxselect.js',
			paths.js_garp + 'garp.metapanel.js',
			paths.js_garp + 'garp.modelmenu.js',
			paths.js_garp + 'garp.welcomepanel.js',
			paths.js_garp + 'garp.gridpanel.js',
			paths.js_garp + 'garp.formpanel.js',
			paths.js_garp + 'garp.toolbar.js',
			paths.js_garp + 'garp.infopanel.js',
			paths.js_garp + 'garp.viewport.js',
			paths.js_garp + 'garp.exportwindow.js',
			paths.js_garp + 'garp.importwindow.js',
			paths.js_garp + 'garp.passwordfieldset.js',
			paths.js_extux + 'ext.ux.datetimepicker.js',
			paths.js_extux + 'ext.ux.menu.datetimemenu.js',
			paths.js_garp + 'garp.datatype.js',
			paths.js_garp + 'overrides.postinit.js',
			paths.js_garp + 'garp.js'
		]
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
					{expand: true, flatten: true, src: ['bower_components/modernizr/modernizr.js'], dest: 'public/js/src/', filter: 'isFile'},
					{expand: true, flatten: true, src: ['bower_components/jquery/jquery.js'], dest: 'public/js/src/', filter: 'isFile'}
				]
			}
		},
		modernizr: {
		    // [REQUIRED] Path to the build you're using for development.
		    "devFile" : paths.js_src + "modernizr.js",

		    // [REQUIRED] Path to save out the built file.
		    "outputFile" : paths.build + "dev/modernizr.js",

		    // Based on default settings on http://modernizr.com/download/
		    "extra" : {
		        "shiv" : true,
		        "printshiv" : false,
		        "load" : false,
		        "mq" : false,
		        "cssclasses" : true
		    },

		    // Based on default settings on http://modernizr.com/download/
		    "extensibility" : {
		        "addtest" : false,
		        "prefixed" : false,
		        "teststyles" : false,
		        "testprops" : false,
		        "testallprops" : false,
		        "hasevents" : false,
		        "prefixes" : false,
		        "domprefixes" : false
		    },

		    // By default, source is uglified before saving
		    "uglify" : false,

		    // Define any tests you want to implicitly include.
		    "tests" : [],

		    // By default, this task will crawl your project for references to Modernizr tests.
		    // Set to false to disable.
		    "parseFiles" : true,

		    // When parseFiles = true, this task will crawl all *.js, *.css, *.scss files, except files that are in node_modules/.
		    // You can override this by defining a "files" array below.
		    "files" : ['public/js/src/*', 'public/css/sass/*'],

		    // When parseFiles = true, matchCommunityTests = true will attempt to
		    // match user-contributed tests.
		    "matchCommunityTests" : false,

		    // Have custom Modernizr tests? Add paths to their location here.
		    "customTests" : []
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
					{ src: build_stack.main,   dest: paths.build + 'dev/main.js'},
					{ src: build_stack.models, dest: paths.build + 'dev/extended-models.js'},
					{ src: build_stack.cms,    dest: paths.build + 'dev/cms.js'}					
				],
				options: {
					append: "\ndocument.write(\"<script src=\\\"http://127.0.0.1:35728/livereload.js?snipver=1\\\"></script>\");"
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
					{src: build_stack.main,      dest: paths.build + 'prod/main.js'},
					{src: build_stack.modernizr, dest: paths.build + 'prod/modernizr.js'},
					{src: build_stack.jquery,    dest: paths.build + 'prod/jquery.js'},
					{src: build_stack.models,    dest: paths.build + 'prod/extended-models.js'},
					{src: build_stack.cms,       dest: paths.build + 'prod/cms.js'}
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
					dest: paths.css + '/compiled/img'
				}]
			}
		},
		/* only png (max 500 requests per month (per API key)) */
		tinypng: {
			options: {
				apiKey: "GpST4zD3uNuHeQbIw7zs3hiL-raKJGMF",
				checkSigs: true,
				sigFile: paths.css + '/compiled/img/tinypng.json',
				summarize: true
			},
			compress: {
				expand: true,
				src: ['**/*.png'],
				cwd: paths.css + '/img/',
				dest: paths.css + '/compiled/img/'
			}
		},
		sass: {
			dev: {
				files: {
					'public/css/compiled/dev/base.css': paths.sass + 'base.scss',
					'public/css/compiled/dev/cms.css': paths.sass + 'cms.scss',
					'public/css/compiled/dev/ie-old.css': paths.sass + 'ie-old.scss'
				}
			},
			prod: {
				files: {
					'public/css/compiled/prod/base.css': paths.sass + 'base.scss',
					'public/css/compiled/prod/cms.css': paths.sass + 'cms.scss',
					'public/css/compiled/prod/ie-old.css': paths.sass + 'ie-old.scss'
				}
			}
		},
		autoprefixer: {
			options: {
				browsers: ['last 3 version', 'ie 8']
			},
			dev: {
				src: paths.css + 'compiled/dev/*.css'
			},
			prod: {
				src: paths.css + 'compiled/prod/*.css'
			}
		},
		cssmin: {
			prod: {
				expand: true,
				cwd: paths.css + 'compiled/prod/',
				src: ['*.css'],
				dest: paths.css + 'compiled/prod/',
				ext: '.css'
			}
		},
		watch: {
			sass: {
				files: [paths.sass + '/**/*.scss'],
				tasks: ['sass:dev', 'autoprefixer:dev', 'gitBranch']
			},
			imagemin: {
				files: [paths.css + 'img/**/*.{jpg,gif}'],
				tasks: ['imagemin:compress']
			},
			tinypng: {
				files: [paths.css + 'img/**/*.png'],
				tasks: ['tinypng:compress']
			},
			options: {
				livereload: 35728,
				spawn: false, // Should improve performance but might introduce bugs
				interrupt: true // Should improve performance but might introduce bugs
			}
		},
		clean: {
			prod: [paths.css + '/compiled/prod', paths.build + '/prod']
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
		grunt.util.spawn({
			cmd : 'git',
			args : ['rev-parse', '--abbrev-ref', 'HEAD']
		}, function (err, result) {
		  if (!err) {
			grunt.log.writeln('').writeln('Working on: ' + (result + "").yellow);
		  }
		});
	});

	/*
	   grunt development
	   note: doesn't minify js or css
	*/
	grunt.registerTask('development', [
		'bower',
		'copy',
		'bower_concat',
		'modernizr',
		'jshint',
		'documentWritify:dev',
		'sass:dev',
		'autoprefixer:dev'
	]);

	/*
	   grunt production
	*/
	grunt.registerTask('production', [
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

	/*
	   grunt icons
	   note: generates icon font
	*/
	grunt.registerTask('icons', ['webfont:icons']);


	/*
	   grunt images
	   note: compresses images with imagemin and tinypng
	*/
	grunt.registerTask('images', ['imagemin:compress', 'tinypng:compress']);

	/*
	   grunt
	*/
	grunt.registerTask('default', ['development', 'gitBranch', 'watch']);

};
