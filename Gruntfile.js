module.exports = function(grunt) {

	// File and path configuration
	var paths = {}
	paths.public   = 'public/';

	paths.js       = paths.public + 'js/';
	paths.css      = paths.public + 'css/';

	paths.js_src   = paths.js + 'src/';
	paths.js_garp  = paths.js + 'garp/';
	paths.build    = paths.js + 'build/';
	paths.js_libs  = paths.js_src + 'libs/';

	paths.sass     = paths.css    + 'sass/';

	paths.icons    = paths.css    + 'icons/';
	paths.fonts    = paths.css    + 'compiled/fonts/icons/';

	var	build_stack = {
		'libs': [
			paths.js_libs + '/fastclick.js',
		],
		'garp': [
			// paths.js_garp + 'styling.js',
			// paths.js_garp + 'flashmessage.js',
			// paths.js_garp + 'cookies.js',
		],
		'src': [
			paths.js_src + '/main.js'
		],
		'jquery':    [ paths.js_libs + '/jquery.js' ],
		'modernizr': [ paths.js_libs + '/modernizr.js' ]
	};
	build_stack.main = build_stack.libs.concat(build_stack.garp).concat(build_stack.src);

	// Grunt configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		documentWritify: {
			dev: {
				files: [
					{src: build_stack.main, dest: paths.build + 'dev/main.js'},
					{src: build_stack.jquery,    dest: paths.build + 'dev/jquery.js'},
					{src: build_stack.modernizr, dest: paths.build + 'dev/modernizr.js'},
				],
				options: {
					// append: "\ndocument.write(\"<script src=\\\"http://127.0.0.1:35728/livereload.js?snipver=1\\\"></script>\");"
				}
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
				"-W099": true,
			}
		},
		uglify: {
			prod: {
				options: {
					compress: true
				},
				files: [
					{src: build_stack.main,      dest: paths.build + 'prod/main.js'},
					{src: build_stack.jquery,    dest: paths.build + 'prod/jquery.js'},
					{src: build_stack.modernizr, dest: paths.build + 'prod/modernizr.js'},
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
					destHtml: paths.fonts,
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
					dest: paths.css + '/compiled/img',
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
				dest: paths.css + '/compiled/img/',
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
				options: {
					// outputStyle: 'compressed'
				},
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
				tasks: ['sass:dev', 'autoprefixer:dev', 'gitBranch'],
			},
			js: {
				files: [paths.js_src + '/**/*.js'],
				tasks: ['documentWritify:dev', 'jshint', 'gitBranch'],
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
				livereload: false,
				spawn: false, // Should improve performance but might introduce bugs
				interrupt: true, // Should improve performance but might introduce bugs
			}
		},
		clean: {
			prod: [paths.css + '/compiled/prod', paths.build + '/prod'],
		},
	});

	// Load NPM tasks thru matchdep
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
	})

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

	// Dev build doesn't minify js or css
	grunt.registerTask('development', ['jshint', 'documentWritify:dev', 'sass:dev', 'autoprefixer:dev']);
	grunt.registerTask('production', ['clean:prod', 'jshint', 'uglify:prod', 'sass:prod', 'autoprefixer:prod', 'cssmin:prod', 'imagemin:compress', 'tinypng:compress']);

	grunt.registerTask('icons', ['webfont:icons']);
	grunt.registerTask('images', ['imagemin:compress', 'tinypng:compress']);

	// Default task(s).
	grunt.registerTask('default', ['development', 'gitBranch', 'watch']);

};
