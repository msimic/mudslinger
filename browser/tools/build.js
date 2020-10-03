const del = require('del');
const fs = require('fs');
const fsx = require('fs-extra');
const path = require('path');
const minify = require('@node-minify/core');
const noCompress = require('@node-minify/no-compress');
const cleanCSS = require('@node-minify/clean-css');
const terser = require('@node-minify/terser');
const htmlMinifier = require('@node-minify/html-minifier');

function minifyHtml(next) {
    minify({
        compressor: htmlMinifier,
        input: './buildfiles/index-prod.html',
        output: './dist/index.html',
        options: {
            'minifyURLs': true,
            'collapseWhitespace': true,
            'collapseInlineTagWhitespace': false,
            'caseSensitive': false,
            'minifyJS': true,
            'minifyCSS': true,
            'sortAttributes': true,
            'sortClassName': true,
        },
        callback: function(err, min) {if (!err && next) next();}
      });
}

function minifyTern(next) {
    minify({
        compressor: terser,
        input: ['./dist/tern_module.js'],
        output: './dist/tern_module.min.js',
        callback: function(err, min) { if (!err && next) next();}
      });
}

function minifyCodemirror(next) {
    minify({
        compressor: terser,
        input: ['./dist/codemirror_module.js'],
        output: './dist/codemirror_module.min.js',
        callback: function(err, min) { if (!err && next) next();}
      });
}

function minifyJqWidgets(next) {
    minify({
        compressor: terser,
        input: ['./dist/jqwidgets_module.js'],
        output: './dist/jqwidgets_module.min.js',
        callback: function(err, min) { if (!err && next) next();}
      });
}

function minifyCss(next) {
    minify({
        compressor: cleanCSS,
        input: [
            './static/public/codemirror/lib/codemirror.css',
            './static/public/codemirror/theme/neat.css',
            './static/public/codemirror/addon/hint/show-hint.css',
            './static/public/codemirror/addon/dialog/dialog.css',
            './static/public/codemirror/addon/tern/tern.css',
            './static/public/jqwidgets/styles/jqx.base.css'],
        output: './dist/modules.min.css',
        callback: function(err, min) { if (!err && next) next();}
      });
}

function mergeTern(next) {
    minify({
    compressor: noCompress,
    input: ['./tern/acorn.js','./tern/acorn-loose.js','./tern/walk.js','./tern/signal.js','./tern/tern.js','./tern/def.js','./tern/comment.js','./tern/infer.js','./tern/doc_comment.js'],
    output: './dist/tern_module.js',
    callback: function(err, min) { if (!err && next) next(); }
    });
}

function mergeJqwidgets(next) {
    minify({
    compressor: noCompress,
    input: [
        './static/public/jqwidgets/jqxcore.js',
        './static/public/jqwidgets/jqxmenu.js',
        './static/public/jqwidgets/jqxwindow.js',
        './static/public/jqwidgets/jqxsplitter.js'],
    output: './dist/jqwidgets_module.js',
    callback: function(err, min) { if (!err && next) next(); }
    });
}

function mergeCodemirror(next) {
    minify({
    compressor: noCompress,
    input: [
        './static/public/codemirror/lib/codemirror.js',
        './static/public/codemirror/addon/display/autorefresh.js',
        './static/public/codemirror/mode/javascript/javascript.js',
        './static/public/codemirror/addon/hint/show-hint.js',
        './static/public/codemirror/addon/hint/javascript-hint.js',
        './static/public/codemirror/addon/dialog/dialog.js',
        './static/public/codemirror/addon/tern/tern.js'],
    output: './dist/codemirror_module.js',
    callback: function(err, min) { if (!err && next) next(); }
    });
}

mergeTern(
    () => mergeCodemirror(
        () => mergeJqwidgets(
            () => minifyCss(
                () => minifyTern(
                    () => minifyCodemirror(
                        () => minifyJqWidgets(
                            )))))));

function copyToPublic() {
    fs.mkdirSync("dist/public/modules/images", { recursive: true });
    fs.mkdirSync("dist/public/css", { recursive: true });
    let distFiles = [
        './dist/codemirror_module.min.js',
        './dist/corejs.min.js',
        './dist/jquery.min.js',
        './dist/jqwidgets_module.min.js',
        './dist/modules.min.css',
        './dist/tern_module.min.js',
        './src/ecmascript.json'
    ];

    for (const file of distFiles) {
        console.log(`copying file ${file}`);
        fs.copyFileSync(file, './dist/public/modules/' + path.basename(file));
    }

    let imageFiles = [
        'static/public/jqwidgets/styles/images/close.png',
        'static/public/jqwidgets/styles/images/icon-up.png',
        'static/public/jqwidgets/styles/images/icon-right.png',
    ];

    for (const file of imageFiles) {
        console.log(`copying file ${file}`);
        fs.copyFileSync(file, 'dist/public/modules/images/' + path.basename(file));
    }

    fs.copyFileSync('static/public/index.html', 'dist/public/index.html');
    console.log(`copying file index.html`);

    const folders = [
        {
        path: './static/public/css',
        regex: /^.*\..*$/i,
        outputFolder: './dist/public/css'
        },
        {
        path: './static/public',
        regex: /^mudslinger.*\.js$/i,
        outputFolder: './dist/public'
        },
        {
            path: './static/public',
            regex: /^.*\.json$/i,
            outputFolder: './dist/public'
        }
    ];

    folders.forEach(folder => {
        fsx.readdirSync(folder.path).forEach(file => {
        if (folder.regex.test(file)) {
            console.log(`copying file ${file}`);
            fsx.copy(`${folder.path}/${file}`, `${folder.outputFolder}/${file}`)/*
            .then(() => console.log('success!'))
            .catch(err => console.error(err));*/
        }
        });
    });
}


(async () => {
    try {
        await del("dist/public");
        console.log(`dist/public is deleted!`);
        copyToPublic();
        console.log(`Build done in: dist/public!`);
    } catch (err) {
        console.error(`Error while deleting dist/public.`);
    }
})();