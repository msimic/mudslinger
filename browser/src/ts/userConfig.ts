import { EventHook } from "./event";


export namespace UserConfig {
    let cfgVals: {[k: string]: any};
    let setHandlers: {[k: string]: EventHook<any>} = {};
    export const evtConfigImport = new EventHook<{[k: string]: any}>();

    let saveFunc: (v: string) => void;

    export function init(userConfigStr: string, saveFunc_: (v: string) => void) {
        saveFunc = saveFunc_;

        if (userConfigStr) {
            cfgVals = JSON.parse(userConfigStr);
        } else {
            cfgVals = {};
        }
    }

    export function remove(nameFilter:RegExp, cb:()=>void) {
        for (const key in cfgVals) {
            if (Object.prototype.hasOwnProperty.call(cfgVals, key)) {
                const element = cfgVals[key];
                if (nameFilter.test(key)) {
                    delete cfgVals[key];
                }
            }
        }
        cb();
        for (const key in setHandlers) {
            if (Object.prototype.hasOwnProperty.call(setHandlers, key)) {
                const element = setHandlers[key];
                setHandlers[key].fire(get(key));
            }
        }
    }

    export function onSet(key: string, cb: (val: any) => void) {
        if (key in setHandlers === false) {
            setHandlers[key] = new EventHook<any>();
        }
        if (cb) {
            setHandlers[key].handle(cb);
        } else {
            delete setHandlers[key];
        }
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

    export function exportToFile() {
        let data = "data:text/json;charset=utf-8," + JSON.stringify(cfgVals, null, 2);
        let uri = encodeURI(data);
        let link = document.createElement("a");
        link.setAttribute("href", uri);
        link.setAttribute("download", "userConfig.json");
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    export function importFromFile() {
        let inp: HTMLInputElement = document.createElement("input");
        inp.type = "file";
        inp.style.visibility = "hidden";

        inp.addEventListener("change", (e: any) => {
            let file = e.target.files[0];
            if (!file) {
                return;
            }

            let reader = new FileReader();
            reader.onload = (e1: any) => {
                let text = e1.target.result;
                let vals = JSON.parse(text);
                cfgVals = vals;
                evtConfigImport.fire(vals);
                // saveConfig();
            };
            reader.readAsText(file);

        });

        document.body.appendChild(inp);
        inp.click();
        document.body.removeChild(inp);
    }
}
