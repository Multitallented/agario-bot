var gulp = require('gulp');
var concat = require('gulp-concat');


gulp.task('scripts', function() {
	return gulp.src('src/**/*.js')
		.pipe(concat('Bot.js'))
		.pipe(gulp.dest('.'));
});

gulp.task('default', ['scripts'], function() {
	gulp.watch('src/**/*', function(event) {
		gulp.run('scripts');
	});
});