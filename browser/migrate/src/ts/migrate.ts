import axios from 'axios';

let redirTo = "https://mudslinger.net/play/";
let migrateToUrl = "https://mudslinger.net/migrate/";
let migrateApi = "https://api.mudslinger.net/client/migrate";

// let redirTo = "http://msdev2.fern.rooflez.com/play/";
// let migrateToUrl = "http://msdev2.fern.rooflez.com/migrate/";
// let migrateApi = "http://api.msdev2.fern.rooflez.com/client/migrate";


async function migrateFromFunc() {
    let params = new URLSearchParams(location.search);
    if (params.has("complete")) {
        localStorage.removeItem("userConfig");
        let resp = await axios.post(migrateApi, {
            migr_id: params.get("migrId"),
            complete: true
        });
        params.delete("complete");
        params.delete("migrId");
    }

    let userConfigStr = localStorage.getItem("userConfig");

    if (!userConfigStr) {
        // No settings to migrate, just redirect
        let newUrl = new URL(redirTo);
        newUrl.search = params.toString();
        location.replace(newUrl.toString());
        return;
    }

    localStorage.setItem("userConfigMigrateBackup", userConfigStr);

    let resp = await axios.post(migrateApi, {
        config: userConfigStr
    });

    let migrId = resp.data.migr_id;

    let newUrl = new URL(migrateToUrl);
    newUrl.search = location.search;
    newUrl.searchParams.append("migrId", migrId);
    newUrl.searchParams.append("fromUrl", location.href);
    console.log("Redirect to", newUrl.toString());
    location.replace(newUrl.toString());
}

async function migrateToFunc() {
    let params = new URLSearchParams(location.search);
    let migrId = params.get("migrId");
    let resp = await axios.get(migrateApi, {
        params: {
            migr_id: migrId
        }
    });
    let config = resp.data.config;
    localStorage.setItem("userConfig", config);

    let newUrl = new URL(params.get("fromUrl"));
    newUrl.searchParams.append("complete", "true");
    newUrl.searchParams.append("migrId", migrId);
    console.log("Redirect to", newUrl.toString());
    location.replace(newUrl.toString());
}

export namespace MudslingerMigrate {
    export let migrateFrom = migrateFromFunc;
    export let migrateTo = migrateToFunc;
}

(<any>window).MudslingerMigrate = MudslingerMigrate;