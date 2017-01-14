/* eslint-disable import/no-extraneous-dependencies */

import gulp from 'gulp';

import babel from 'gulp-babel';
import fs from 'fs';
import path from 'path';

gulp.task('transpile', () =>
    gulp.src('./src/**/*.js')
      .pipe(babel())
      .pipe(gulp.dest('./dist'))
);

gulp.task('watch', ['build'], () => {
  gulp.watch('./src/**/*.js', ['transpile']);
});

gulp.task('link', () => {
  const files = fs.readdirSync(path.resolve(__dirname, './src'))
    .filter(f => f.endsWith('.js'));
  const packageJSON = require('./package.json');

  if (!fs.existsSync(path.resolve(__dirname, './dist'))) fs.mkdirSync(path.resolve(__dirname, './dist'));

  Object.keys(packageJSON.bin).forEach((binName) => {
    if (binName === 'electron-forge') return;

    if (packageJSON.bin[binName] === packageJSON.bin['electron-forge']) {
      files.forEach((fileName) => {
        fs.writeFileSync(
          path.resolve(__dirname, `./dist/${fileName.replace('electron-forge', binName)}`),
          `/* Auto-generated bin alias file */\nglobal.__LINKED_FORGE__ = true;\nrequire('./${fileName}');\n`
        );
      });
    }
  });
});

gulp.task('build', ['transpile', 'link']);
