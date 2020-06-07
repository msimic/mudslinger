import { EventHook } from "./event";
import { TrigAlItem } from "./trigAlEditBase";


export interface ConfigIf {
    set(key: "triggers", val: TrigAlItem[]): void;
    getDef(key: "triggersEnabled", def: boolean): boolean;
    get(key: "triggers"): TrigAlItem[];
}

export interface ScriptIf {
    makeScript(text: string, argsSig: string): any;
}

export class TriggerManager {
    public EvtEmitTriggerCmds = new EventHook<string[]>();

    public triggers: Array<TrigAlItem> = null;

    constructor(private jsScript: ScriptIf, private config: ConfigIf) {
        /* backward compatibility */
        let savedTriggers = localStorage.getItem("triggers");
        if (savedTriggers) {
            this.config.set("triggers", JSON.parse(savedTriggers));
            localStorage.removeItem("triggers");
        }

        this.loadTriggers();
    }

    public saveTriggers() {
        this.config.set("triggers", this.triggers);
    }

    private loadTriggers() {
        this.triggers = this.config.get("triggers") || [];
    }

    public handleLine(line: string): void {
        if (this.config.getDef("triggersEnabled", true) !== true) return;
//        console.log("TRIGGER: " + line);
        for (let i = 0; i < this.triggers.length; i++) {
            let trig = this.triggers[i];
            if (trig.regex) {
                let match = line.match(trig.pattern);
                if (!match) {
                    continue;
                }

                if (trig.is_script) {
                    let script = this.jsScript.makeScript(trig.value, "match, line");
                    if (script) { script(match, line); };
                } else {
                    let value = trig.value;

                    value = value.replace(/\$(\d+)/g, function(m, d) {
                        return match[parseInt(d)] || "";
                    });

                    let cmds = value.replace("\r", "").split("\n");
                    this.EvtEmitTriggerCmds.fire(cmds);
                }
            } else {
                if (line.includes(trig.pattern)) {
                    if (trig.is_script) {
                        let script = this.jsScript.makeScript(trig.value, "line");
                        if (script) { script(line); };
                    } else {
                        let cmds = trig.value.replace("\r", "").split("\n");
                        this.EvtEmitTriggerCmds.fire(cmds);
                    }
                }
            }
        }
    }
}

