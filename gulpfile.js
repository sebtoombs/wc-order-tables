const { src, dest, parallel, series } = require('gulp');
//const gulp = require('gulp');
const gulpZip = require('gulp-zip');
const del = require('del')
const es = require('event-stream');
var gulpSass = require('gulp-sass');

sass.compiler = require('node-sass');

function sass() {
    return src('./src/*.scss')
        .pipe(gulpSass({outputStyle: 'compressed'}).on('error', gulpSass.logError))
        .pipe(dest('./'));
}

async function cleanBuild() {
  await del('./build', {force: true})
}

async function clean() {
   await del('./dist', {force:true})
}

function copy(cb) {
    es.concat(
        src('./views/*')
            .pipe(dest('./dist/views/')),

        src('./vendor/*')
            .pipe(dest('./dist/vendor/')),

        src(['./kd-wc-order-tables.php', './order-table.css', './order-table.js', './order-table.vue', './order-table-print.css'])
            .pipe(dest('./dist/'))
    ).on('end', cb);
}

function zip() {
    return src('./dist/**')
        .pipe(gulpZip('kd-wc-order-tables.zip'))
        .pipe(dest('./build/'))
}

exports.sass = sass
exports.clean = clean
exports.copy = copy
exports.zip = zip
exports.default = series(parallel(cleanBuild, clean), sass, copy, zip, clean)