[![Build Status](https://travis-ci.org/grrr-amsterdam/garp_scaffold.svg)](https://travis-ci.org/grrr-amsterdam/garp_scaffold)

# Readme for Garp Scaffold

This is a scaffold set to initiate [Garp 3](https://github.com/grrr-amsterdam/garp3) projects.

## Getting started

Make sure you have the gulp cli installed globally. You can install it by running:
```bash
npm install --global gulp-cli
```

Next install all dependencies by running:
```bash
npm install
```

Now start your build and watch by running:
```bash
gulp watch
```

or alternatively via:
```bash
npm start
```

Now you should be able to visit [localhost:3000](http://localhost:3000) and get to your site.


## Building for different environments

You can generate builds for different environments by running either:
```bash
gulp --e=[development/staging/production]
```

or:
```bash
npm run build
npm run build:staging
npm run build:production
```


## CSS

We use [Sass](http://sass-lang.com/) for css compilation. However we prefer to stick as closely to
vanilla css as possible. Definitely make use of variables, but try to limit your use of mixins and
loops. Also never use extend.

We have a bunch more conventions for writing CSS. **Please heed these conventions**, they lead to
more consistent and maintainable code. See the [css coding standards](https://github.com/grrr-amsterdam/garp3/wiki/coding-standards-html-css)
for more info.

## JavaScript

JavaScript is transpiled from ES6 to ES5 with [Babel](https://babeljs.io/). We also use
[Browserify](http://browserify.org/) to allow you to import modules.

ES6 writing style is preferred, so please take full advantage of constants, arrow functions,
modules, template literals and all that goodness.

That being said, there are some features that can’t be properly transpiled. Make sure you load the
appropriate Babel polyfills for those. You can [include just the polyfills you need](https://github.com/zloirock/core-js#commonjs).


## Modernizr

We use [Modernizr](https://modernizr.com/) to test browser support for certain features. We can then
use progressive enhancement to leverage those features for supported browsers. Usage of
`Modernizr.feature` in JS, or `.feature-class .selector` in CSS will automatically be detected and
Gulp will make sure the appropriate tests are included.

**Note**: this detection isn’t run when you’re using `gulp watch`, see `gulp watch` task below for
more details.


## Building with Gulp

[Gulp](http://gulpjs.com) is our task runner of choice. It takes care of building CSS, compiling
JavaScript, and much more.

Gulp takes most of it’s configuration values—such as where to put build files, or which cdn to
use—from `app.ini`. Gulp will tell you which values it uses when you start a build.

Although you can run all Gulp tasks from the command line, only a subset is actually suited for
individual use. These are the tasks you can run:

### Building

```bash
gulp
```

Builds everything. Defaults to a development build, use `--e=[staging/production]` for generating a
staging or production build.

### Watching

```bash
gulp watch
```

Runs a build and watches for file changes in CSS and JavaScript, as well as php/phtml files in the
`application/modules` directory.

**BrowserSync**

`gulp watch` Also fires up a [BrowserSync](https://www.browsersync.io/) instance which proxies the
domain set in `app.ini`. This instance is accessible through both `localhost:3000` as well as
`localhost.example.com:3000`.

Browsersync also comes in handy for checking your work on other devices connected to the same local
network, such as mobile phones. Fire up a browser and point it to `[local ip address]:3000` to
access the site on your local machine.

### Generating a Modernizr file

```bash
gulp modernizr
```

Modernizr is run on build, checks your CSS and JS, and includes the appropriate feature tests. The
only caveat of this soluation is that **Modernizr doesn’t account for inline CSS/JS**. You will
need to explicitely include these tests in the Gulp Modernizr task.

Also, we don’t re-run Modernizr when watching, so if you add a test while running `gulp watch`,
so will either need to manually run `gulp modernizr`, or restart that watch task.


## Using icons

You can place all svg icons in the `public/css/img/icons` folder, and they will be transformed into
a sprite automatically.

In your views you can render an icon via the SVG helper as such, whereby [icon-name] is taken from
the filename of the SVG:
```php
$this->svg('[icon-name]')
```

Coloring icons is as easy as using `fill: #f00` in css.

**Note**
If your icons are not changing color, it is most likely because there are inline `fill`
attributes on your SVG. Open up the SVG in your text editor and remove all `fill` attributes to
make it colorable through CSS.


## Preloading webfonts

Your browser will only load a font once it has downloaded your css and finds an element which
uses the font. By using the `<link rel="preload">` syntax you can tell the browser to start
loading the font immediately, leading to faster render times. See `layout.phtml` for an example.
