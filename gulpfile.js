
//Fonstyle запускать вручную gulp Fontstyle

import fs from "fs";
// let fs = require('fs');
import gulp from "gulp";
import plumber from "gulp-plumber";
import sourcemap from "gulp-sourcemaps";
import less from "gulp-less";
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass( dartSass );
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import csso from "gulp-csso";
import sync from "browser-sync";
import rename from "gulp-rename";
import imagemin from "gulp-imagemin";
import webp from "gulp-webp";
import svgstore from "gulp-svgstore";
import posthtml from "gulp-posthtml";
import include from "posthtml-include";
import fileinclude from "gulp-file-include";
import del from "del";
import uglify from "gulp-uglify";
import htmlmin from "gulp-htmlmin";
import ttf2woff from 'gulp-ttf2woff';
import ttf2woff2 from 'gulp-ttf2woff2';
import group_media from 'gulp-group-css-media-queries';
import webpcss from 'gulp-webp-css';
import webphtml from 'gulp-webp-html';

//HTML

export const pages = () => {
  return gulp.src(['build/**/*.html'])
  .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
  .pipe(rename({
      extname: ".min.html"
    }))
  .pipe(gulp.dest('build'));
}


export const html = () => {
  return gulp.src(["source/*.html", "!source/_*.html"])
  .pipe(fileinclude({
    prefix: '@@',
    basepath: '@file'
  }))
  .pipe(posthtml([include()]))
  .pipe(webphtml())
  .pipe(gulp.dest("build"))
  // .pipe(gulp.src(['build/**/*.html', "!build/**/*min.html"]))
  // .pipe(htmlmin({
  //     collapseWhitespace: true,
  //     removeComments: true
  //   }))
  // .pipe(rename({
  //     extname: ".min.html"
  //   }))
  // // .pipe(gulp.src("source/*.html"))
  // .pipe(gulp.dest('build'))
  .pipe(sync.stream());
}

//CSS
export const css = () => {
  // return gulp.src("source/less/style.less")
  return gulp.src("source/scss/style.scss")
  .pipe(plumber())
  .pipe(sourcemap.init())
  .pipe(group_media())
  .pipe(sass())
  // .pipe(less())
  .pipe(postcss([
    autoprefixer({
        overrideBrowserlist: ["last 5 versions"],
        cascade: true
    })
  ]))
  .pipe(webpcss())
  .pipe(gulp.dest("build/css"))// неминифицированная версия css
  .pipe(csso())
  .pipe(rename("style.min.css"))
  .pipe(sourcemap.write("."))
  .pipe(gulp.dest("build/css"))
  .pipe(sync.stream());
}

//IMG&WEBP

export const images = () => {
  return gulp.src("source/img/**/*.{png,jpg,svg}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"))
    .pipe(gulp.src("source/img/**/*.{png,jpg}"))
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("build/img"));
}

//FONTS

export const fonts = () => {
  return gulp.src("source/fonts/*")
      .pipe(ttf2woff())
      .pipe(gulp.dest("build/fonts"))
      .pipe(gulp.src("source/fonts/*"))
      .pipe(ttf2woff2())
      .pipe(gulp.dest("build/fonts"));
}

export const fontsStyle = (done) => {
  let file_content = fs.readFileSync("source/scss/fonts.scss");
  if (file_content == '') {
    fs.writeFile("source/scss/fonts.scss", '', cb);
    return fs.readdir("build/fonts", function (err, items) {
      if (items) {
        let c_fontname;
        for (var i=0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile("source/scss/fonts.scss", '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
  done();
}
        
function cb() { 
}

//SVG_Sprite

export const sprite = () => {
  return gulp.src("build/img/icon-*.svg")
  .pipe(svgstore({
    inlineSvg: true,
    copyAttrs: true
  }))
  .pipe(rename("sprite.svg"))
  .pipe(gulp.dest("build/img"));
}

//JS

export const scripts = () => {
  return gulp.src('source/js/**/*.js')
    .pipe(fileinclude())
    .pipe(gulp.dest('build/js')) // неминифицированная версия js
    .pipe(uglify())
    .pipe(rename({
      extname: ".min.js"
    }))
    .pipe(gulp.dest('build/js'))
    .pipe(sync.stream())
}

//COPY
export const copy = () => {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/img/**",
    "source/js/**",
    "source/*.ico"
  ], {base: "source"
})
.pipe(gulp.dest("build"));
}

//CLEAN

export const clean = () => {
  return del("build");
}

//WATCH

export const watch = () => {
  // server.init({
  //   server: "build/",
  // });

  gulp.watch("source/scss/**/*.scss", gulp.series("css"));
  gulp.watch("source/img/icon-*.svg", gulp.series("sprite", "html","refresh"));
  gulp.watch("source/*.html", gulp.series("html",'refresh'));
  // gulp.watch("source/fonts", gulp.series("fonts", 'fontsStyle', 'refresh'));
  // gulp.series(copy);
}

//SERVER

export const server = () => {
  sync.init({
      ui: false,
      notify: false,
      server: {
          baseDir: 'build'
      }
  });
};

// REFRESH

export const refresh = () => {
  sync.reload();
  done();
}


//DEFAULT

export default gulp.series(
    clean,
    copy,
    css,
    fonts,
    images,
    sprite,
    scripts,
    html,
    pages,
    gulp.parallel(
    server,
    watch
    )
);
