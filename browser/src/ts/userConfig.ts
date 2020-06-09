import { EventHook } from "./event";
import { apiPostUserConfig } from "./apiUtil";


export namespace UserConfig {
    let cfgVals: {[k: string]: any};
    let setHandlers: {[k: string]: EventHook<any>} = {};

    export function init() {
        let userConfigStr = localStorage.getItem("userConfig");

        if (userConfigStr) {
            cfgVals = JSON.parse(userConfigStr);
            /* Wait a little bit so we can hopefully push an sid with the config */
            setTimeout(() => {
                apiPostUserConfig(userConfigStr);
            }, 5000);
            
        } else {
            cfgVals = {};
        }
    }

    export function onSet(key: string, cb: (val: any) => void) {
        if (key in setHandlers === false) {
            setHandlers[key] = new EventHook<any>();
        }
        setHandlers[key].handle(cb);
    }

    export function getDef(key: string, def: any): any {
        let res = cfgVals[key];
        return (res === undefined) ? def : res;
    }

    export function get(key: string): any {
        return cfgVals[key];
    }

    export function set(key: string, val: any) {
        cfgVals[key] = val;
        saveConfig();
        if (key in setHandlers) {
            setHandlers[key].fire(val);
        }
    }

    function saveConfig() {
        localStorage.setItem("userConfig", JSON.stringify(cfgVals));
    }
}
