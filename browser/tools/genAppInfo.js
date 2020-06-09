const fs = require("fs");

const pjson = require('../package.json');


let build = process.argv[2];

let txt = `export namespace AppInfo {
    export let AppTitle: string = "Mudslinger Client";
    export let RepoUrl: string = "https://github.com/Odoth/mudslinger";
    export let Version: string = "${pjson.version}";
    export let Build: string = "${build}";
}`;

fs.writeFileSync('src/ts/appInfo.ts', txt);
