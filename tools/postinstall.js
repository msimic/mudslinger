let fs = require("fs-extra");

let flnameConfigClient = "configClient.js"
let flnameConfigClientDefault = "configClient.default.js"

let flnameConfigServer = "static/public/configServer.js"
let flnameConfigServerDefault = "configServer.default.js"

// To be run from package root, paths accordingly
fs.createReadStream("node_modules/jquery/dist/jquery.min.js").pipe(fs.createWriteStream('static/public/jquery.min.js'));

fs.copySync("node_modules/jqwidgets-framework/jqwidgets", "static/public/jqwidgets");

fs.copySync("node_modules/codemirror/addon", "static/public/codemirror/addon");
fs.copySync("node_modules/codemirror/keymap", "static/public/codemirror/keymap");
fs.copySync("node_modules/codemirror/lib", "static/public/codemirror/lib");
fs.copySync("node_modules/codemirror/mode", "static/public/codemirror/mode");
fs.copySync("node_modules/codemirror/theme", "static/public/codemirror/theme");

fs.copySync("node_modules/codemirror/LICENSE", 'static/public/codemirror/LICENSE');

fs.copySync("node_modules/qunit/qunit", 'static/test/qunit');

// Don't want to overwrite existing config file if any
if (!fs.existsSync(flnameConfigClient)) {
    fs.createReadStream(flnameConfigClientDefault).pipe(fs.createWriteStream(flnameConfigClient));
    console.log("Copying " + flnameConfigClientDefault + " to " + flnameConfigClient);
}

if (!fs.existsSync(flnameConfigServer)) {
    fs.createReadStream(flnameConfigServerDefault).pipe(fs.createWriteStream(flnameConfigServer));
    console.log("Copying " + flnameConfigServerDefault + " to " + flnameConfigServer);
}
