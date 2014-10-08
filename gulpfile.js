var gulp           = require('gulp'),
	autoprefixer   = require('gulp-autoprefixer'),
	gutil          = require('gulp-util'),
	concat         = require('gulp-concat'),
	jshint         = require('gulp-jshint');
	imagemin       = require('gulp-imagemin');
    minifycss      = require('gulp-minify-css'),
	modernizr      = require('gulp-modernizr'),
	sass           = require('gulp-sass'),
	browserSync    = require('browser-sync'),
	ini            = require('multi-ini'),
	merge          = require('merge'),
	jshintStylish  = require('jshint-stylish'),
	mainBowerFiles = require('main-bower-files'),
	uglify         = require('gulp-uglify'),
	sourcemaps     = require('gulp-sourcemaps'),
	sh             = require('execSync');

var config,
	semver;
var paths = {};
var arguments = require('yargs').argv;
var ENV = arguments.e ? arguments.e : 'development';

function getConfig() {
	var zendApp = ini.read('./application/configs/app.ini');
	var zendAssets = ini.read('./application/configs/assets.ini');

	var zendConfig = {};
	for (var i in zendApp) {
		var shortname = i.split(" ")[0];
		zendConfig[shortname] = merge(zendApp[i],zendAssets[i]);
	}
	return zendConfig;
};

function getSemver() {
	result = sh.exec('semver');
    if (result.stderr) {
        gutil.log(gutil.colors.red('semver error: ' + result.stderr));
        gutil.beep();
    }
    return result.stdout;
};

function constructPaths() {
	paths.public      = 'public';

	paths.js          = paths.public + config.production.assets.js.basePath;
	paths.jsSrc       = paths.js + '/src';
	paths.jsBuild     = paths.js + config[ENV].assets.js.root + '/' + semver;

	paths.css         = paths.public + '/css';
	paths.cssSrc      = paths.css + '/' + config.production.assets.sass.root;
	paths.cssBuild    = paths.css + '/' + config[ENV].assets.css.root + '/' + semver;

	paths.icons       = paths.css      + 'icons/';
	paths.fonts       = paths.css      + 'build/fonts/icons/';
	return paths;
};


gulp.task('configure', function() {
	config = getConfig();
	semver = getSemver();
	paths  = constructPaths();
});


/**
 * Wait for sass build, then launch the proxy
 */
gulp.task('browser-sync', ['sass', 'javascript'], function() {
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
	gutil.log('Building css to ' + paths.cssBuild);
    var base = gulp.src(paths.css.src + '/base.scss')
        .pipe(sass({
			onError: browserSync.notify
        }))
		.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 9', 'opera 12.1'))
		.pipe(minifycss())
        .pipe(gulp.dest(paths.cssBuild))
		.pipe(browserSync.reload({stream:true}))
		.pipe(gulp.dest(paths.cssBuild));

	var oldIE = gulp.src(paths.css.src + '/ie-old.scss')
        .pipe(sass({
			onError: browserSync.notify
        }))
		.pipe(autoprefixer('ie 8'))
		.pipe(minifycss())
        .pipe(gulp.dest(paths.cssBuild));

	var cms = gulp.src(paths.css.src + '/css.scss')
        .pipe(sass({
			onError: browserSync.notify
        }))
		.pipe(minifycss())
        .pipe(gulp.dest(paths.cssBuild));
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
    return gulp.src(paths.js.src + '/**/*.js')
	.pipe(sourcemaps.init())
		.pipe(concat('main.js'))
		.pipe(uglify())
	.pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.jsBuild))
});

/**
 * Concat dependencies installed through Bower
 */
gulp.task('bower-concat', function() {
	if (mainBowerFiles().length == 0) {
		gutil.log('No bower dependencies');
		return;
	}
    return gulp.src(mainBowerFiles())
    .pipe(concat('libs.js'))
    .pipe(gulp.dest(paths.jsBuild))
});

/**
 * JShint
 * Checks writing style of js files
 */
gulp.task('jshint', function () {
    gulp.src(paths.jsSrc + '/**/*.js')
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
  gulp.src([paths.cssSrc, paths.jsSrc])
    .pipe(modernizr())
    .pipe(gulp.dest(paths.jsBuild))
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

gulp.task('default', ['configure', 'browser-sync', 'modernizr', 'watch'] );
gulp.task('production', ['configure', 'sass', 'javascript', 'modernizr'] );
