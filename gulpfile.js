var gulp           = require('gulp'),
	gutil          = require('gulp-util'),
	concat         = require('gulp-concat'),
	sass           = require('gulp-sass'),
	autoprefixer   = require('gulp-autoprefixer'),
    minifycss      = require('gulp-minify-css'),
	browserSync    = require('browser-sync'),
	ini            = require('multi-ini'),
	merge          = require('merge'),
	jshint         = require('gulp-jshint');
	jshintStylish  = require('jshint-stylish'),
	modernizr      = require('gulp-modernizr'),
	imagemin       = require('gulp-imagemin');
	mainBowerFiles = require('main-bower-files'),
	gulpif         = require('gulp-if'),
	uglify         = require('gulp-uglify'),
	sourcemaps     = require('gulp-sourcemaps');

/**
 * Init variables
 */
var paths = {};
paths.public      = 'public';

paths.dev         = 'dev/';
paths.stag        = 'stag';
paths.prod        = 'prod/';

paths.icons       = paths.css      + 'icons/';
paths.fonts       = paths.css      + 'compiled/fonts/icons/';

/**
 * Get config values from ini file
 * Zend config contains key names like 'development : staging'
 * This converts those to just 'development'
 */
function getConfig() {
	var zendApp = ini.read('./application/configs/app.ini');
	var zendAssets = ini.read('./application/configs/assets.ini');

	var config = {};
	for (var i in zendApp) {
		var shortname = i.split(" ")[0];
		config[shortname] = merge(zendApp[i],zendAssets[i]);
	}
	return config;
}
var config = getConfig();

/**
 * Wait for sass build, then launch the proxy
 */
gulp.task('browser-sync', ['sass'], function() {
	if(!config.development.app.domain) {
		gutil.log(gutil.colors.red('No domain set in application/configs/app.ini'));
	}
	browserSync({
		proxy: config.development.app.domain
	});
});

/**
 * Build sass files
 */
gulp.task('sass', function () {
	var buildDir = paths.public + config.development.assets.css.root;
    return gulp.src(paths.public + config.production.assets.sass.root + '/base.scss')
        .pipe(sass({
			onError: browserSync.notify
        }))
		.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
		.pipe(minifycss())
        .pipe(gulp.dest(buildDir))
		.pipe(browserSync.reload({stream:true}))
		.pipe(gulp.dest(buildDir));
});

/*
 * - Concat dependencies in libs.js
 * - Run modernizr task
 * - Run jshint
 *
 * If (env != development)
 * - Concat all in main.js
 * - Run removeLogging on main.js
 * - Run uglifyJs on main.js
 */

/**
 * Build js files
 */
gulp.task('javascript', ['jshint', 'bower-concat'], function() {
    return gulp.src(paths.public + config.production.assets.js.basePath + '/src/**/*.js')
	.pipe(sourcemaps.init())
		.pipe(concat('main.js'))
		.pipe(uglify())
	.pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.public + config.development.assets.js.root))
});

/**
 * Concat dependencies installed through Bower
 */
gulp.task('bower-concat', function() {
	if (mainBowerFiles().length == 0) {
		return;
	}
    return gulp.src(mainBowerFiles())
    .pipe(concat('libs.js'))
    .pipe(gulp.dest(paths.public + config.development.assets.js.root))
});

/**
 * JShint
 * Checks writing style of js files
 */
gulp.task('jshint', function () {
    gulp.src(paths.public + config.production.assets.js.basePath + '/src/**/*.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
});

/**
 * Modernizr
 * Build custom modernizr file by scanning js and css files
 *
 * NOTE: this task produces erros which are safe to ignore
 */
gulp.task('modernizr', function() {
  gulp.src([paths.public + config.production.assets.js.basePath + '/src/**/*.js'])
    .pipe(modernizr())
    .pipe(gulp.dest(paths.public + config.development.assets.js.root))
});

/**
 * Images
 * Crush those things
 *
 * TODO: Implement TinyPNG
 */
gulp.task('crush-images', function () {
    return gulp.src(paths.public + config.production.assets.css.images + '/*.{gif,jpg,png,svg}')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}]
        }))
        .pipe(gulp.dest(paths.public + config.production.assets.css.root + '/img'));
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
	gulp.watch(paths.public + config.production.assets.sass.root + '/**/*.scss', ['sass']);
	gulp.watch(paths.public + config.production.assets.js.basePath + '/src/**/*.js', ['javascript']);
    gulp.watch(['application/modules/default/*'], browserSync.reload);
});

gulp.task('default', ['browser-sync', 'watch'] );
