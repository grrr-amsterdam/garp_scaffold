/*
 * Gulpfile
 * Author: Mattijs Bliek
 *
 * See README.md for usage instructions
 * -------------------------------------------------------------
 */

var gulp          = require('gulp'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	$               = gulpLoadPlugins(),
	pxtorem         = require('postcss-pxtorem'),
	autoprefixer    = require('autoprefixer'),
	browserSync     = require('browser-sync'),
  browserify      = require('browserify'),
  babelify        = require('babelify'),
  del             = require('del'),
  watchify        = require('watchify'),
	assign          = require('lodash.assign'),
  runSequence     = require('run-sequence'),
  source          = require('vinyl-source-stream'),
  buffer          = require('vinyl-buffer'),
	path            = require('path'),
	reworkUrl       = require('rework-plugin-url'),
  execSync        = require('child_process').execSync,
	argv            = require('yargs').argv;

var paths = {};
var isWatching = false;
var ENV = argv.e ? argv.e : 'development';
var PROFILE = argv.profile ? argv.profile : 'development';
var GARP_DIR = __dirname + '/vendor/grrr-amsterdam/garp3';

/**
 * Constructs paths and gets the domain for Browserify
 */
gulp.task('init', function() {
	domain = getConfigValue('app.domain');
	paths = constructPaths();

	$.util.log($.util.colors.green('----------------------------------'));
	$.util.log($.util.colors.green('Environment: ' + ENV));
	$.util.log($.util.colors.green(''));
  $.util.log($.util.colors.green('CDN url used in css: ' + (paths.cssCdn ? paths.cssCdn : '[local]')));
  $.util.log($.util.colors.green('Building css to:     ' + paths.cssBuild));
  $.util.log($.util.colors.green('Building js to:      ' + paths.jsBuild));
	$.util.log($.util.colors.green('----------------------------------'));
});

/**
 * Deletes all previous build files
 */
gulp.task('clean', function() {
  return del([
    paths.cssBuild + '/**/*',
    paths.jsBuild + '/**/*'
  ]);
});

/**
 * Auto refresh and hot reloading in the browser
 *
 * Also makes your development computer available to
 * third party devices over the network.
 */
gulp.task('browser-sync', function() {
	if (!domain) {
		handleError('Could not get "' + ENV + '" domain from application/configs/app.ini');
	}
	browserSync({
		proxy: domain,
		open: false,
		notify: {
			styles: [
        "display: none",
        "padding: 15px",
        "font-family: sans-serif",
        "position: fixed",
        "font-size: 0.9em",
        "z-index: 9999",
        "right: 0px",
        "bottom: 0px",
        "border-top-left-radius: 5px",
        "background-color: rgb(27, 32, 50)",
        "margin: 0",
        "color: white",
        "text-align: center"
			]
		}
	});
});

/**
 * Builds css files
 */
gulp.task('sass', function() {
	var processors = [
      autoprefixer({
          browsers: ['>5%', 'last 2 versions', 'ie 9', 'ie 10']
      }),
      pxtorem({
        root_value: 10,
        unit_precision: 5,
        prop_white_list: [
          'font',
          'font-size',
        ],
        replace: false,
        media_query: false
      })
    ];

  return gulp.src(paths.cssSrc + '/base.scss')
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss(processors))
    .pipe($.if(ENV !== 'development' || PROFILE === 'production', $.csso()))
    .pipe($.if(paths.cssCdn !== '', $.rework(
      reworkUrl(function(url) {
        // Prepend url with cdn path
        return paths.cssCdn + '/' + url;
      })
    )))
    .pipe(gulp.dest(paths.cssBuild))
    .pipe(browserSync.reload({stream:true}))
  ;
});

gulp.task('sass:cms', function() {
  return gulp.src([paths.cssSrc + '/cms.scss', paths.cssSrc + '/cms-wysiwyg.scss'])
    .pipe($.sass({
      onError: function(err) {
        handleError(err.message + ' => ' + err.file + ':' + err.line, false);
      }
    }))
    .pipe($.if(ENV !== 'development', $.csso()))
    .pipe(gulp.dest(paths.cssBuild))
  ;
});

/**
 * Lints Sass
 */
gulp.task('sass:lint', function() {
  var scssLintOutput = function(file, stream) {
  if (!file.scsslint.success) {
    $.util.log($.util.colors.gray('-----------------'));
    $.util.log($.util.colors.green(file.scsslint.issues.length) + ' scss-lint issue(s) found:');
    file.scsslint.issues.forEach(function(issue) {
      $.util.colors.underline(file.path);
      $.util.log($.util.colors.green(issue.reason) + ' => ' + $.util.colors.underline(file.path) + ':' + issue.line);
    });
    $.util.log($.util.colors.gray('-----------------'));
  }
  };
  return gulp.src(paths.cssSrc + '/**/*.scss')
    .pipe($.scssLint({
      'config': __dirname + '/.scss-lint.yml',
      'customReport': scssLintOutput
    })).on('error', handleError)
  ;
});


/**
 * Javascript bundle with Browserify
 */
var b;

function initBrowserify() {
  var customOpts = {
    entries: paths.jsSrc + '/main.js'
  };
  var opts = assign({}, watchify.args, customOpts);
  b = browserify(opts);

  // If this is a watch task, wrap browserify in watchify
  if (isWatching) {
    b = watchify(b);
  }
  b.transform(babelify, {
    presets: ["es2015"]
  }).on('error', handleError);

  b.on('update', bundle);
  bundle();
};

gulp.task('javascript', initBrowserify);

function bundle() {
  eslint();

  return b.bundle()
    .on('error', handleError)
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe($.if(ENV === 'development' && PROFILE !== 'production', $.sourcemaps.init({loadMaps: true})))
    .pipe($.if(ENV !== 'development' || PROFILE === 'production', $.uglify())).on('error', handleError)
    .pipe($.if(ENV === 'development' && PROFILE !== 'production', $.sourcemaps.write({loadMaps: true})))
    .pipe(gulp.dest(paths.jsBuild))
    .pipe(browserSync.stream({once: true}));
};

gulp.task('bundle', bundle);

/**
 * Lints JS
 */
function eslint() {
  return gulp.src(paths.jsSrc + '/**/*.js')
      .pipe($.eslint('.eslintrc').on('error', handleError))
      .pipe($.eslint.format());
}

gulp.task('eslint', eslint);


/**
 * Builds the JS for the CMS
 */
gulp.task('javascript:cms', function() {
  return gulp.src(require(GARP_DIR + '/public/js/cmsBuildStack.js').stack)
    .pipe($.concat('cms.js'))
    .pipe($.if(ENV !== 'development', $.uglify())).on('error', handleError)
    .pipe(gulp.dest(paths.jsBuild))
  ;
});

/**
 * Builds the JS for the Garp front-end models
 */
gulp.task('javascript:models', function() {
  return gulp.src([
    paths.jsSrc + '/../garp/models/*.js',
    paths.jsSrc + '/../models/*.js',
  ])
    .pipe($.concat('extended-models.js'))
    .pipe($.uglify()).on('error', handleError)
    .pipe(gulp.dest(paths.jsBuild))
  ;
});

/**
 * Compresses images
 */
gulp.task('images', function() {
  if (argv.skipImages) {
    return;
  }
  $.util.log($.util.colors.green('Building images to ' + paths.imgBuild));
  return gulp.src(paths.imgSrc + '/*.{png,gif,jpg,svg}')
    .pipe($.imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}]
    }))
    .on('error', handleError)
    .pipe(gulp.dest(paths.imgBuild))
  ;
});

/**
 * Creates an svg sprite out of all files in the public/css/img/icons folder
 *
 * This sprite is lazy loaded with JS, see load-icons.js for more info
 */
gulp.task('images:icons', function () {
    return gulp.src(paths.css + '/img/icons/*.svg')
		.pipe($.svgmin(function (file) {
        var prefix = path.basename(file.relative, path.extname(file.relative));
        return {
            plugins: [{
                cleanupIDs: {
                    prefix: prefix + '-',
                    minify: true
                }
            }]
        }
    }).on('error', handleError))
    .pipe($.svgstore({ inlineSvg: true }).on('error', handleError))
    .pipe(gulp.dest(paths.cssBuild + '/img'));
});

/**
 * Checks js and scss source files for Modernizr tests such as Modernizr.flexbox or .flexbox
 * and creates a custom modernizr build containing only the tests you use.
 *
 * Note: this task isn't run on watch, you can run it manually via `gulp modernizr`
 */
gulp.task('modernizr:build', function() {
  return gulp.src([paths.cssSrc + '/**/*.scss', paths.jsSrc + '/modules/*.js', paths.jsSrc + '/main.js'])
  .pipe($.modernizr({
    "enableJSClass": false,
    "options" : [
      'setClasses',
    ],
    "tests": [
      "picture"
    ]
  }))
  .pipe($.uglify())
  .pipe(gulp.dest(paths.jsBuild))
});

/**
 * Used for running modernizr as an individual Gulp task
 */
gulp.task('modernizr', ['init', 'modernizr:build']);

/**
 * Watches for file changes and runs Gulp tasks accordingly
 */
gulp.task('watch', ['default', 'browser-sync'], function(cb) {
  isWatching = true;

	gulp.watch([
		paths.cssSrc + '/**/*.scss',
		'!**/cms-wysiwyg.scss',
		'!**/cms.scss'
	], ['sass', 'sass:lint']);
	gulp.watch(paths.cssSrc + '/**/cms.scss', ['sass:cms']);
	gulp.watch(paths.cssSrc + '/img/icons/*.svg', ['icons']);
	gulp.watch(paths.jsSrc + '/**/*.js', ['bundle']);
	gulp.watch(paths.js + '/models/*.js', ['javascript:models']);
	gulp.watch(paths.imgSrc + '/**/*.{gif,jpg,svg,png}', ['images']);
	gulp.watch(paths.js +'/garp/*.js', ['javascript:cms']);
	gulp.watch('application/modules/default/**/*.{phtml, php}', browserSync.reload);
});

/**
 * Add revision hash behind filename so we can cache assets forever
 */
gulp.task('revision', function() {
  var cssFilter = $.filter('**/*.css', {restore: true});
  var jsFilter = $.filter('**/*.js', {restore: true});
  var imgFilter = $.filter('**/*.{png,gif,jpg,svg}', {restore: true});

  return gulp.src([
    paths.cssBuild + '/base.css',
    paths.cssBuild + '/cms.css',
    paths.cssBuild + '/wysiwyg_editor.css',
    paths.imgBuild + '/*.{png,gif,jpg,svg}',
    paths.jsBuild + '/cms.js',
    paths.jsBuild + '/extended-models.js',
    paths.jsBuild + '/main.js',
    paths.jsBuild + '/modernizr.js'
  ])
    .pipe($.rev())
    .pipe($.revDeleteOriginal())
    .pipe(cssFilter)
    .pipe(gulp.dest(paths.cssBuild))
    .pipe(cssFilter.restore)
    .pipe(jsFilter)
    .pipe(gulp.dest(paths.jsBuild))
    .pipe(jsFilter.restore)
    .pipe(imgFilter)
    .pipe(gulp.dest(paths.imgBuild))
    .pipe(imgFilter.restore)
    .pipe($.rev.manifest('rev-manifest-' + ENV + '.json'))
    .pipe(gulp.dest('./'));

});

/*
 * Replace image and font urls in css files
 */

gulp.task('revision:replace', function(){
  var manifestFile = './rev-manifest-' + ENV + '.json';
  var manifest = gulp.src(manifestFile);

  return gulp.src(paths.cssBuild + "/*.css")
    .pipe($.revReplace({ manifest: manifest }))
    .pipe(gulp.dest(paths.cssBuild));
});

gulp.task('default', [
  'init',
  'clean',
	'sass',
  'sass:cms',
	'sass:lint',
	'javascript',
	'javascript:cms',
	'javascript:models',
	'images',
	'images:icons',
	'modernizr:build'
], function(callback) {
  if (ENV === 'development') {
    $.util.log('Skipping revisioning for development');
    return callback();
  }
  runSequence('revision', 'revision:replace', callback);
});


/**
 * ----------------------------------------------------
 *
 * Utility functions
 *
 * ----------------------------------------------------
 */
function handleError(error, emitEnd) {
	if (typeof(emitEnd) === 'undefined') {
		emitEnd = true;
	}
	$.util.beep();
	$.util.log($.util.colors.white.bgRed('Error!'), $.util.colors.red(error.toString()));
	if (emitEnd) {
		this.emit('end');
	}
}

function getShellOutput(command) {
  var result = execSync(command).toString('utf-8');
	if (!result) {
		handleError('Error getting shell output');
		$.util.beep();
	}
	// Do a replace because of newline in shell output
	return result.replace(/\s?$/, '');
}

function getConfigValue(value) {
	if (!value) {
		handleError('Can\'t get undefined config value');
		return;
	}
	var command = 'php ' + GARP_DIR + '/scripts/garp.php config get ' + value + ' --e=' + ENV;
	return getShellOutput(command);
}

function constructPaths() {
	paths.public      = 'public';

	paths.js          = paths.public + '/js';
	paths.jsSrc       = paths.public + getConfigValue('assets.js.root');
	paths.jsBuild     = paths.public + getConfigValue('assets.js.build');

	paths.css         = paths.public + '/css';
	paths.cssSrc      = paths.public + getConfigValue('assets.css.root');
	paths.cssBuild    = paths.public + getConfigValue('assets.css.build');

	paths.imgSrc      = paths.css      + '/img';
	paths.imgBuild    = paths.cssBuild + '/img';
  paths.cssCdn      = getConfigValue('cdn.domain');
  if (paths.cssCdn) {
	  var protocol    = getConfigValue('cdn.ssl') ? 'https://' : 'http://';
	  paths.cssCdn    = protocol + paths.cssCdn + getConfigValue('assets.css.build');
  }

	return paths;
}

