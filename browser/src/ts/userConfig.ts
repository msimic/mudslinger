import { EventHook } from "./event";


export namespace UserConfig {
    let cfgVals: {[k: string]: any};
    let setHandlers: {[k: string]: EventHook<any>} = {};

    let saveFunc: (v: string) => void;

    export function init(userConfigStr: string, saveFunc_: (v: string) => void) {
        saveFunc = saveFunc_;

        if (userConfigStr) {
            cfgVals = JSON.parse(userConfigStr);
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
        const prev = cfgVals[key];
        cfgVals[key] = val;
        saveConfig();
        if (prev != val && key in setHandlers) {
            setHandlers[key].fire(val);
        }
    }

    function saveConfig() {
        saveFunc(JSON.stringify(cfgVals));
    }
}
