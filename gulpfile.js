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
 * - Integrate something to generate icons (probably gulp-svg-sprites)
 * - CSS sourcemaps are not rendering properly
 * - Implement gulp-css-url-adjuster to generate cdn img paths
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
	imagemin       = require('gulp-imagemin'),
    minifycss      = require('gulp-minify-css'),
	modernizr      = require('gulp-modernizr'),
	sass           = require('gulp-sass'),
	browserSync    = require('browser-sync'),
	merge          = require('merge'),
	jshintStylish  = require('jshint-stylish'),
	mainBowerFiles = require('main-bower-files'),
	uglify         = require('gulp-uglify'),
	sourcemaps     = require('gulp-sourcemaps'),
	scsslint       = require('gulp-scss-lint'),
	cache          = require('gulp-cached'),
	tinypng        = require('gulp-tinypng'),
	gulpif         = require('gulp-if'),
	argv           = require('yargs').argv,
	sh             = require('execSync');

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
	paths.jsBuild     = paths.public + getConfigValue('assets.js.root') + '/' + semver;

	paths.css         = paths.public + '/css';
	paths.cssSrc      = paths.public + getConfigValue('assets.sass.root');
	paths.cssBuild    = paths.public + getConfigValue('assets.css.root') + '/' + semver;

	paths.imgSrc      = paths.css      + '/img';
	paths.imgBuild    = paths.cssBuild + '/img';
	paths.cdn         = getConfigValue('assets.cdn.domain');
	return paths;
};

function handleError (error) {
	gutil.log(gutil.colors.red(error.toString()));
	this.emit('end');
}

gulp.task('init', function() {
	semver = getShellOutput('semver');
	domain = getConfigValue('app.domain');
	paths  = constructPaths();
	gutil.log(gutil.colors.green('Semver: ' + semver));
	gutil.log(gutil.colors.green('Environment: ' + ENV));
});

gulp.task('browser-sync', ['sass-ie', 'sass-cms', 'sass', 'javascript'], function() {
	if(!domain) {
		handleError('Could not get ' + ENV + ' domain from application/configs/app.ini');
	}
	browserSync({
		proxy: domain
		open: true,
	});
});

gulp.task('sass', ['scss-lint'], function () {
    gutil.log(gutil.colors.green('Building css to ' + paths.cssBuild));
    return gulp.src([paths.cssSrc + '/base.scss'])
		// .pipe(gulpif(ENV == 'development', sourcemaps.init()))
		.pipe(sass({
			onError: browserSync.notify
		})).on('error', handleError)
		.pipe(autoprefixer('last 3 versions', 'safari 5', 'ie 9', 'opera 12.1'))
		.pipe(gulpif(ENV == 'development', minifycss()))
		// .pipe(gulpif(ENV == 'development', sourcemaps.write()))
        .pipe(gulp.dest(paths.cssBuild))
		.pipe(browserSync.reload({stream:true}))
		.pipe(gulp.dest(paths.cssBuild));
});

gulp.task('sass-cms', function() {
    return gulp.src(paths.cssSrc + '/cms.scss')
		.pipe(sass()).on('error', handleError)
		.pipe(gulpif(ENV == 'development', minifycss()))
		.pipe(gulp.dest(paths.cssBuild));
});

gulp.task('sass-ie', function() {
    return gulp.src(paths.cssSrc + '/ie-old.scss')
		.pipe(sass()).on('error', handleError)
		.pipe(gulpif(ENV == 'development', minifycss()))
		.pipe(gulp.dest(paths.cssBuild));
});

gulp.task('scss-lint', ['init'], function() {
	gulp.src(paths.cssSrc + '/**/*.scss')
		// .pipe(cache('scsslint'))
		.pipe(scsslint({'config': __dirname + '/.scss-lint.yml'})).on('error', handleError);
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
    .pipe(gulp.dest(paths.jsBuild));
});

gulp.task('jshint', function () {
    gulp.src(paths.jsSrc + '/**/*.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
});

/**
 * NOTE: this task produces erros which are safe to ignore, this is due
 * to Modernizr not being tool agnostic and looking for grunt modules.
 */
gulp.task('modernizr', ['sass', 'javascript'], function() {
  return gulp.src([paths.cssBuild + '/base.css', paths.jsBuild + '/main.js'])
    .pipe(modernizr('modernizr.js')).on('error', handleError)
    .pipe(uglify())
    .pipe(gulp.dest(paths.jsBuild))
});

gulp.task('tinypng', function () {
	if (argv.skipImages) {
		return;
	}
    return gulp.src(paths.imgSrc + '/*.png')
        .pipe(tinypng('GpST4zD3uNuHeQbIw7zs3hiL-raKJGMF'))
        .pipe(gulp.dest(paths.imgBuild));
});

gulp.task('images', ['init', 'tinypng'], function () {
	if (argv.skipImages) {
		return;
	}
	gutil.log(gutil.colors.green('Building images to ' + paths.imgBuild));
    return gulp.src(paths.imgSrc + '/*.{gif,jpg,svg}')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}]
        })).on('error', handleError)
        .pipe(gulp.dest(paths.imgBuild));
});

gulp.task('watch', ['default', 'browser-sync'], function() {
	gulp.watch(paths.cssSrc + '/**/*.scss', ['sass']);
	gulp.watch(paths.jsSrc + '/**/*.js', ['javascript']);
	gulp.watch(paths.imgSrc + '/*.{gif,jpg,svg,png}', ['images']);
    gulp.watch('application/modules/default/**/*.{phtml, php}', browserSync.reload);
});

gulp.task('default', [
	'init',
	'sass-ie',
	'sass-cms',
	'sass',
	'javascript-cms',
	'javascript-models',
	'javascript',
	'images',
	'modernizr'
]);
