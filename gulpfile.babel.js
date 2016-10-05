/* eslint-disable import/no-extraneous-dependencies */

import gulp from 'gulp';

import babel from 'gulp-babel';

gulp.task('transpile', () =>
    gulp.src('./src/**/*.js')
      .pipe(babel())
      .pipe(gulp.dest('./dist'))
);

gulp.task('watch', ['build'], () => {
  gulp.watch('./src/**/*.js', ['transpile']);
});

gulp.task('build', ['transpile']);
