import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import {stream as wiredep} from 'wiredep';

const $ = gulpLoadPlugins();

gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
    'app/_locales/**',
    '!app/*.json',
    '!app/*.html',
  ], {
    base: 'app',
    dot: true
  }).pipe(gulp.dest('dist'));
});

function lint(files, options) {
  return () => {
    return gulp.src(files)
               .pipe($.eslint(options))
               .pipe($.eslint.format());
  };
}

gulp.task('lint', lint('app/scripts/**/*.js', {
  env: {
    es6: false
  }
}));

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
             .pipe($.if($.if.isFile, $.cache($.imagemin({
               progressive: true,
               interlaced: true,
               // don't remove IDs from SVGs, they are often used
               // as hooks for embedding and styling
               svgoPlugins: [{cleanupIDs: false}]
             }))
                                      .on('error', function (err) {
                                        console.log(err);
                                        this.end();
                                      })))
             .pipe(gulp.dest('dist/images'));
});

gulp.task('html',  () => {
  return gulp.src('app/*.html')
             .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
             .pipe($.sourcemaps.init())
             .pipe($.if('*.js', $.uglify()))
             .pipe($.if('*.css', $.cleanCss({compatibility: '*'})))
             .pipe($.if('*.html', $.htmlmin({removeComments: true, collapseWhitespace: true})))
             .pipe(gulp.dest('dist'));
});

gulp.task('chromeManifest', () => {
  return gulp.src('app/manifest.json')
             .pipe($.chromeManifest({
               buildnumber: true,
               background: {
                 target: 'scripts/background.js',
                 exclude: [
                   'scripts/chromereload.js'
                 ]
               }
             }))
             .pipe($.if('*.css', $.cleanCss({compatibility: '*'})))
             .pipe($.if('*.js', $.uglify()))
             .pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('watch', gulp.series('lint'), () => {
  $.livereload.listen();

  gulp.watch([
    'app.html',
    'app/scripts.js',
    'app/images',
    'app/styles',
    'app/_locales.json',
    'app/tests.js'
  ]).on('change', $.livereload.reload);

  gulp.watch('app/scripts.js', gulp.series('lint'));
  gulp.watch('bower.json', gulp.series('wiredep'));
});

gulp.task('size', () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('wiredep', () => {
  gulp.src('app/*.html')
      .pipe(wiredep({
        ignorePath: /^(\.\.\/)*\.\./
      }))
      .pipe(gulp.dest('app'));
});

gulp.task('package', function () {
  var manifest = require('./dist/manifest.json');
  return gulp.src(['dist/**', '!**/*.map'])
             .pipe($.zip('Pinboard-Plus-' + manifest.version + '.zip'))
             .pipe(gulp.dest('package'));
});

gulp.task('build', (cb) => {
  gulp.series(
    'lint', 'chromeManifest',
    gulp.parallel('html', 'images', 'extras'),
    'size');
  cb();
});

gulp.task('default', gulp.series('clean'), cb => {
  gulp.series('build');
  cb();
});
