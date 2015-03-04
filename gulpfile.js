/*
 * Gulpfile
 * Author: Mattijs Bliek
 *
 * IMPORTANT:
 * Gulp needs to be installed globally on your system before
 * you're able to run tasks. This can be done by running:
 * `npm install -g gulp`
 *
 * -------------------------------------------------------------
 *
 * DESCRIPTION:
 * Gulp is used to manage and generate front-end assets, such as
 * css, javascript, and compressed images. You can run gulp from
 * the command line with the commands below.
 *
 * -------------------------------------------------------------
 *
 * TODO:
 * - CSS sourcemaps are not rendering properly
 * - Either concat libs.js and main.js for production, or employ a module
 *   loader to generate various builds
 *
 * -------------------------------------------------------------
 *
 * COMMANDS:
 *
 * Generate a build for an environment:
 * `gulp`
 *
 * Arguments:
 * --e=environment (development|staging|production)
 * --skipImages (don't build compressed images)
 *
 * Generate images for an environment:
 * `gulp images`
 *
 * Watch files and run a server (use for development only):
 * `gulp watch`
 *
 * -------------------------------------------------------------
 */

var gulp           = require('gulp'),
	autoprefixer   = require('gulp-autoprefixer'),
	gutil          = require('gulp-util'),
	concat         = require('gulp-concat'),
	jshint         = require('gulp-jshint'),
	jshintStylish  = require('jshint-stylish'),
	imagemin       = require('gulp-imagemin'),
	minifycss      = require('gulp-minify-css'),
	urlAdjuster    = require('gulp-css-url-adjuster'),
	pxtorem        = require('gulp-pxtorem'),
	modernizr      = require('gulp-modernizr'),
	sass           = require('gulp-sass'),
	browserSync    = require('browser-sync'),
	mainBowerFiles = require('main-bower-files'),
	uglify         = require('gulp-uglify'),
	stripDebug     = require('gulp-strip-debug'),
	sourcemaps     = require('gulp-sourcemaps'),
	scsslint       = require('gulp-scss-lint'),
	gulpif         = require('gulp-if'),
	argv           = require('yargs').argv,
	sh             = require('execSync'),
	runSequence    = require('run-sequence');

var semver;
var paths = {};
var ENV = argv.e ? argv.e : 'development';

function getShellOutput(command) {
	result = sh.exec(command);
	if (result.stderr) {
		handleError('Error getting shell output: ' + result.stderr);
		gutil.beep();
	}
	// Do a replace because of newline in shell output
	return result.stdout.replace(/\s?$/, '');
};

function getConfigValue(value) {
	if (!value) {
		handleError('Can\'t get undefined config value');
		return;
	}
	var command = 'php ' + __dirname + '/../golem/scripts/golem.php config get ' + value + ' --e=' + ENV;
	return getShellOutput(command);
}

function constructPaths() {
	paths.public      = 'public';

	paths.js          = paths.public + '/js';
	paths.jsSrc       = paths.js     + '/src';
	paths.jsBuild     = paths.public + getConfigValue('assets.js.root');

	paths.css         = paths.public + '/css';
	paths.cssSrc      = paths.public + getConfigValue('assets.sass.root');
	paths.cssBuild    = paths.public + getConfigValue('assets.css.root');

	paths.imgSrc      = paths.css      + '/img';
	paths.imgBuild    = paths.cssBuild + '/img';
	paths.cdn         = getConfigValue('cdn.domain');
	paths.cdnCss      = getConfigValue('assets.css.root');

	return paths;
};

function handleError(error, emitEnd) {
	if (typeof(emitEnd) === 'undefined') emitEnd = true;
	gutil.beep();
	gutil.log(gutil.colors.white.bgRed('Error!'), gutil.colors.red(error.toString()));
	if (emitEnd) {
		this.emit('end');
	}
}

gulp.task('init', function() {
	// gulp-modernizr doesn't work without the dir set to 755, so do that
gutil.log(gutil.colors.green('--start chmod--'));
	sh.run('chmod -R 755 ./node_modules/gulp-modernizr');

gutil.log(gutil.colors.green('--start semver--'));
	semver = getShellOutput('semver');
gutil.log(gutil.colors.green('--start config app.domain--'));
	domain = getConfigValue('app.domain');
gutil.log(gutil.colors.green('--start config cdn.type--'));
	cdnType  = getConfigValue('cdn.type');
gutil.log(gutil.colors.green('--start construct paths--'));
	paths  = constructPaths();

	gutil.log(gutil.colors.green('-----------------'));
	gutil.log(gutil.colors.green('Semver: ' + semver));
	gutil.log(gutil.colors.green('Environment: ' + ENV));
	gutil.log(gutil.colors.green('CDN type: ' + cdnType));
	gutil.log(gutil.colors.green('-----------------'));
});

gulp.task('browser-sync', function() {
	if (!domain) {
		handleError('Could not get ' + ENV + ' domain from application/configs/app.ini');
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

// gulp.task('sass', ['scss-lint'], function() {
gulp.task('sass', function() {
	var pxtoremOptions = {
		root_value: 10,
		unit_precision: 5,
		prop_white_list: [
			'font',
			'font-size',
		],
		replace: false,
		media_query: false
	},
	postcssOptions = {
		map: true
	};

	gutil.log(gutil.colors.green('Building css to ' + paths.cssBuild));
	return gulp.src([paths.cssSrc + '/base.scss'])
		.pipe(sass({
			onError: function(err) {
				handleError(err.message + ' => ' + err.file + ':' + err.line, false);
				return browserSync.notify('Error: ' + err.message + ' => ' + err.file + ':' + err.line);
			}
		}))
		.pipe(pxtorem(pxtoremOptions, postcssOptions))
		.pipe(autoprefixer('>5%', 'last 3 versions', 'safari 5', 'ie 9', 'opera 12.1'))
		.pipe(gulpif(ENV != 'development' && cdnType != 'local', urlAdjuster({
			// hacky slashes are necessary because one slash is stripped by urlAdjuster
			prepend: 'http:///' + paths.cdn + paths.cdnCss + '/',
			append: '?v=' + semver
		})))
		.pipe(gulpif(ENV != 'development', minifycss()))
		.pipe(gulp.dest(paths.cssBuild))
		.pipe(browserSync.reload({stream:true}))
	;
});

gulp.task('sass-cms', function() {
	return gulp.src([paths.cssSrc + '/cms.scss', paths.cssSrc + '/cms-wysiwyg.scss'])
		.pipe(sass({
			onError: function(err) {
				handleError(err.message + ' => ' + err.file + ':' + err.line, false);
			}
		}))
		.pipe(gulpif(ENV != 'development', minifycss()))
		.pipe(gulp.dest(paths.cssBuild))
	;
});

gulp.task('sass-ie', function() {
	return gulp.src(paths.cssSrc + '/ie-old.scss')
		.pipe(sass({
			onError: function(err) {
				handleError(err.message + ' => ' + err.file + ':' + err.line, false);
			}
		}))
		.pipe(gulpif(ENV != 'development', minifycss()))
		.pipe(gulp.dest(paths.cssBuild))
	;
});

gulp.task('scss-lint', function() {
	var scssLintOutput = function(file, stream) {
		if (!file.scsslint.success) {
			gutil.log(gutil.colors.gray('-----------------'));
			gutil.log(gutil.colors.green(file.scsslint.issues.length) + ' scss-lint issue(s) found:');
			file.scsslint.issues.forEach(function(issue) {
				gutil.colors.underline(file.path);
				gutil.log(gutil.colors.green(issue.reason) + ' => ' + gutil.colors.underline(file.path) + ':' + issue.line);
			});
			gutil.log(gutil.colors.gray('-----------------'));
		}
	};
	return gulp.src(paths.cssSrc + '/**/*.scss')
		.pipe(scsslint({
			'config': __dirname + '/.scss-lint.yml',
			'customReport': scssLintOutput
		})).on('error', handleError)
	;
});

gulp.task('javascript', ['jshint', 'bower-concat'], function() {
	gutil.log(gutil.colors.green('Building js to ' + paths.jsBuild));
	return gulp.src([
		paths.jsSrc + '/../garp/front/styling.js',
		paths.jsSrc + '/../garp/front/flashmessage.js',
		paths.jsSrc + '/../garp/front/cookies.js',
		paths.jsSrc + '/**/*.js',
	])
		.pipe(gulpif(ENV == 'development', sourcemaps.init()))
		.pipe(concat('main.js'))
		.pipe(gulpif(ENV != 'development', stripDebug()))
		.pipe(gulpif(ENV != 'development', uglify())).on('error', handleError)
		.pipe(gulpif(ENV == 'development', sourcemaps.write()))
		.pipe(gulp.dest(paths.jsBuild))
		.pipe(browserSync.reload({stream:true}))
	;
});

gulp.task('javascript-cms', function() {
	return gulp.src(require('./garp/public/js/cmsBuildStack.js').stack)
		.pipe(concat('cms.js'))
		.pipe(gulpif(ENV != 'development', uglify())).on('error', handleError)
		.pipe(gulp.dest(paths.jsBuild))
	;
});

gulp.task('javascript-models', function() {
	return gulp.src([
		paths.jsSrc + '/../garp/models/*.js',
		paths.jsSrc + '/../models/*.js',
	])
		.pipe(concat('extended-models.js'))
		.pipe(uglify()).on('error', handleError)
		.pipe(gulp.dest(paths.jsBuild))
	;
});

gulp.task('bower-concat', function() {
	if (mainBowerFiles().length == 0) {
		gutil.log('No bower dependencies');
		return;
	}
	return gulp.src(mainBowerFiles())
		.pipe(concat('libs.js'))
		.pipe(uglify())
		.pipe(gulp.dest(paths.jsBuild))
	;
});

gulp.task('jshint', function() {
	return gulp.src(paths.jsSrc + '/**/*.js')
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('modernizr', function() {
	return gulp.src([paths.cssBuild + '/base.css', paths.jsBuild + '/main.js'])
		.pipe(modernizr('modernizr.js')).on('error', handleError)
		.pipe(uglify())
		.pipe(gulp.dest(paths.jsBuild))
	;
});

gulp.task('images', ['init'], function() {
	if (argv.skipImages) {
		return;
	}
	gutil.log(gutil.colors.green('Building images to ' + paths.imgBuild));
	return gulp.src(paths.imgSrc + '/*.{png,gif,jpg,svg}')
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}]
		}))
		.on('error', handleError)
		.pipe(gulp.dest(paths.imgBuild))
	;
});

gulp.task('watch', function(cb) {
	runSequence('default', 'browser-sync', cb);	gulp.watch([
		paths.cssSrc + '/**/*.scss',
		'!**/cms-wysiwyg.scss',
		'!**/cms.scss'
	], ['sass', 'sass-ie', 'scss-lint']);
	gulp.watch(paths.cssSrc + '/**/cms.scss', ['sass-cms']);
	gulp.watch(paths.jsSrc + '/**/*.js', ['javascript']);
	gulp.watch(paths.imgSrc + '/**/*.{gif,jpg,svg,png}', ['images']);
	gulp.watch('application/modules/default/**/*.{phtml, php}', browserSync.reload);
});

gulp.task('build', [
	'init',
	'sass-ie',
	'sass-cms',
	'sass',
	'scss-lint',
	'javascript-cms',
	'javascript-models',
	'javascript',
	'images'
]);

gulp.task('default', function(cb) {
	runSequence('build', 'modernizr', cb);
});
