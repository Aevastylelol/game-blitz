const gulp = require('gulp');

const gulp_util = require('gulp-util');
const gulp_rename = require('gulp-rename')

const del = require('del');

const vinyl_named = require('vinyl-named');
const webpack = require('webpack');
const webpack_stream = require('webpack-stream');
const webpack_gcc = require('google-closure-compiler-js').webpack;

const gulp_pug = require('gulp-pug');

const gulp_stylus = require('gulp-stylus');

const gulp_imagemin = require('gulp-imagemin');

const browser = require('browser-sync').create();

const is_production = (process.env.NODE_ENV === 'production');

gulp.task('remove', () => {
    return del('dist', { force: true });
});

gulp.task('typescript', () => {
    const done = (err, stats) => {
        if (err) {
            throw new gulp_util.PluginError('webpack', err);
        }
        gulp_util.log('[webpack]', stats.toString({
            colors: true
        }));
    };

    const config = {
        resolve: {
            extensions: ['.ts']
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: [
                        {
                            loader: 'awesome-typescript-loader'
                        }
                    ],
                    exclude: /node_modules/
                }
            ]
        }
    };

    return gulp.src('src/main.ts')
        .pipe(vinyl_named())
        .pipe(webpack_stream(config, null, done))
        .pipe(gulp.dest('dist'));
});

gulp.task('pug', () => {
    return gulp.src('src/main.pug')
        .pipe(gulp_pug())
        .pipe(gulp_rename('index.html'))
        .pipe(gulp.dest('dist'));
});

gulp.task('stylus', () => {
    return gulp.src('src/main.styl')
        .pipe(gulp_stylus({
            compress: is_production
        }))
        .pipe(gulp.dest('dist'))
});

gulp.task('sound', () => {
    return gulp.src('src/sound/music/**/*.mp3')
        .pipe(gulp.dest('dist/sound'))
});

gulp.task('fonts', () => {
    return gulp.src('src/ui/fonts/**/*.{eot,otf,ttf,woff}')
        .pipe(gulp.dest('dist/fonts'))
});

gulp.task('image', () => {
    return gulp.src('src/**/*.{jpg,png,svg,gif}')
        .pipe(gulp_imagemin())
        .pipe(gulp_rename({ dirname: '' }))
        .pipe(gulp.dest('dist/image'));
});

gulp.task('build', gulp.series('remove', gulp.parallel('typescript', 'pug', 'stylus', 'sound', 'fonts', 'image')));

const server = () => {
    const config = {
        server: {
            baseDir: 'dist'
        }
    };

    browser.init(config);
};

const reload = (done) => {
    browser.reload();
    done();
};

const watch = () => {
    gulp.watch('src/**/*.ts', gulp.series('typescript', reload));
    gulp.watch('src/**/*.pug', gulp.series('pug', reload));
    gulp.watch('src/**/*.styl', gulp.series('stylus', reload));
    gulp.watch('src/sound/music/**/*.mp3', gulp.series('sound', reload));
    gulp.watch('src/ui/fonts/**/*.{eot,otf,ttf,woff}', gulp.series('fonts', reload));
    gulp.watch('src/**/*.{jpg,png,svg,gif}', gulp.series('image', reload));
};

gulp.task('dev', gulp.series('build', gulp.parallel(server, watch)));

gulp.task('demo', gulp.series('build', server));