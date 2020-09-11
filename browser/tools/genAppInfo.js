const fs = require("fs");

const pjson = require('../package.json');


let build = process.argv[2];
const { exec } = require("child_process");

exec(build, (error, stdout, stderr) => {
    const buildhash = stdout.trim().toString();
    if (error) {
        console.log(`Could not fetch build version: ${error.message}`);
        process.exit(1);
    }
    if (stderr) {
        console.log(`Could not fetch build version: ${stderr}`);
        process.exit(1);
    }
    let txt = `export namespace AppInfo {
        export let AppTitle: string = "Mudslinger Client";
        export let RepoUrl: string = "https://github.com/Odoth/mudslinger";
        export let Version: string = "${pjson.version}";
        export let Build: string = "${buildhash}";
    }`;
    
    fs.writeFileSync('src/ts/appInfo.ts', txt);
});
