const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const minimist = require('minimist');

const envOption = {
  string: 'env',
  default: { env: 'dev' }
}
const options = minimist(process.argv.slice(2), envOption)

const path = {
  des: './public/',
  html: {
    src: ['./source/**/*.html'],
    ejsSrc: [`./source/**/*.ejs`],
    des: './public/'
  },
  scss: {
    src: './source/scss/**/*.scss',
    des: './public/css'
  },
  js: {
    src: './source/js/**/*.js',
    des: './public/js'
  }
}

function sassTask(){
  var plugins = [
    autoprefixer(),
  ];

  return gulp.src(path.scss.src)
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe(sass({
      includePaths: ['./node_modules/bootstrap/scss']
    }).on('error', sass.logError))
    .pipe($.postcss(plugins))
    .pipe($.if(options.env === 'prod', $.cleanCss({ compatibility: 'ie8' })))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(path.scss.des))
    .pipe(browserSync.stream())
}

function babel(){
  return gulp.src(path.js.src)
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['@babel/env']
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(options.env === 'prod', $.uglify()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(path.js.des))
    .pipe(browserSync.stream())
}

function vendorsJs(){
  return gulp.src([
    './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
  ])
    .pipe($.concat('vendor.js'))
    .pipe(gulp.dest(path.js.des))
}
function ejs() {
  return gulp.src(path.html.src)
    .pipe($.plumber())
    .pipe($.frontMatter())
    .pipe(
      $.layout((file) => {
        return file.frontMatter;
      })
    )
    .pipe($.if(options.env === 'prod', $.htmlmin({ collapseWhitespace: true })))
    .pipe(gulp.dest('./public'))
    .pipe(browserSync.stream())
}

function watch(){
  gulp.watch(path.scss.src, gulp.series(sassTask))
  gulp.watch(path.js.src, gulp.series(babel))
  gulp.watch(path.html.src, gulp.series(ejs))
  gulp.watch(path.html.ejsSrc, gulp.series(ejs))
}

function browser(){
  browserSync.init({
    server: { baseDir: "./public" },
    reloadDebounce: 2000
  });
}

function clean(){
  return gulp.src(['./public'], { read: false, allowEmpty: true })
    .pipe($.clean());
}

function deploy(){
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
}

exports.deploy = deploy

exports.build = gulp.series(clean, ejs, sassTask, babel, vendorsJs)

exports.default = gulp.series(clean, ejs, sassTask, babel, vendorsJs, gulp.parallel(watch, browser))
