import { EventHook } from "./event";
import { TrigAlItem } from "./trigAlEditBase";
import { ClassManager } from "./classManager";
import { EvtScriptEmitPrint, EvtScriptEmitToggleTrigger } from "./jsScript";

export interface ConfigIf {
    set(key: string, val: TrigAlItem[]): void;
    getDef(key: string, def: boolean): boolean;
    get(key:string): TrigAlItem[];
    evtConfigImport: EventHook<{[k: string]: any}>;
}

export interface ScriptIf {
    makeScript(owner:string, text: string, argsSig: string): any;
}

export class TriggerManager {
    public EvtEmitTriggerCmds = new EventHook<{orig: string, cmds: string[]}>();

    public triggers: Array<TrigAlItem> = null;
    public allTriggers: Array<TrigAlItem> = null;

    constructor(private jsScript: ScriptIf, private config: ConfigIf, private baseConfig: ConfigIf, private classManager: ClassManager) {
        /* backward compatibility */
        let savedTriggers = localStorage.getItem("triggers");
        if (savedTriggers) {
            this.config.set("triggers", JSON.parse(savedTriggers));
            localStorage.removeItem("triggers");
        }

        this.loadTriggers();
        config.evtConfigImport.handle(() => {
            this.loadTriggers();
            this.saveTriggers();
        }, this);
        EvtScriptEmitToggleTrigger.handle(this.onToggle, this);
    }

    private onToggle(data: {owner: string, id:string, state:boolean}) {
        this.setEnabled(data.id, data.state);
        if (this.config.getDef("debugScripts", false)) {
            const msg = "Trigger " + data.id + " e' ora " + (this.isEnabled(data.id) ? "ABILITATO" : "DISABILITATO");
            EvtScriptEmitPrint.fire({owner:"TriggerManager", message: msg});
        }
    }

    public setEnabled(id:string, val:boolean) {
        const t = this.getById(id);
        if (!t) {
            if (this.config.getDef("debugScripts", false)) {
                const msg = "Trigger " + id + " non esiste!";
                EvtScriptEmitPrint.fire({owner:"TriggerManager", message: msg});
            }    
            return;
        }
    }

    public getById(id:string):TrigAlItem {
        for (let index = 0; index < this.triggers.length; index++) {
            const element = this.triggers[index];
            if (element.id == id) return element;
        }
        return null;
    }

    public isEnabled(id:string):boolean {
        const t = this.getById(id);
        return t && t.enabled;
    }

    public contains(pattern:string, maxIndex:number) {
        for (let index = 0; index < Math.min(maxIndex, this.allTriggers.length); index++) {
            const element = this.allTriggers[index];
            if (element.pattern == pattern) return true;
        }
        return false;
    }

    public mergeTriggers() {
        var triggers = $.merge([], this.config.get("triggers") || []);
        triggers = $.merge(triggers, this.baseConfig.get("triggers") || []);
        this.allTriggers = triggers;
        for (let index = 0; index < this.allTriggers.length; index++) {
            const element = this.allTriggers[index];
            if (element && index>0 && this.contains(element.pattern, index)) {
                this.allTriggers.splice(index, 1);
                index--;
                continue;
            }
        }
    }

    public saveTriggers() {
        this.config.set("triggers", this.triggers);
        this.mergeTriggers();
    }

    private loadTriggers() {
        this.triggers = this.config.get("triggers") || [];
        this.mergeTriggers();
    }

    public handleLine(line: string): void {
        if (this.config.getDef("triggersEnabled", true) !== true) return;
//        console.log("TRIGGER: " + line);
        for (let i = 0; i < this.allTriggers.length; i++) {
            let trig = this.allTriggers[i];
            if (!trig.enabled || (trig.class && !this.classManager.isEnabled(trig.class))) continue;
            if (trig.regex) {
                let match = line.match(trig.pattern);
                if (!match) {
                    continue;
                }

                if (trig.is_script) {
                    if (!trig.script) trig.script = this.jsScript.makeScript(trig.id || trig.pattern, trig.value, "match, line");
                    if (trig.script) {
                        trig.script(match, line); 
                    } else {
                        throw `Trigger '${trig.pattern}' is script but the script cannot be initialized`;
                    }
                } else {
                    let value = trig.value;

                    value = value.replace(/\$(\d+)/g, function(m, d) {
                        return match[parseInt(d)] || "";
                    });

                    let cmds = value.replace("\r", "").split("\n");
                    this.EvtEmitTriggerCmds.fire({orig: trig.id || trig.pattern, cmds: cmds});
                }
            } else {
                if (line.includes(trig.pattern)) {
                    if (trig.is_script) {
                        if (!trig.script) trig.script = this.jsScript.makeScript(trig.id || trig.pattern, trig.value, "line");
                        if (trig.script) {
                            trig.script(line); 
                        } else {
                            throw `Trigger '${trig.pattern}' is script but the script cannot be initialized`;
                        }
                    } else {
                        let cmds = trig.value.replace("\r", "").split("\n");
                        this.EvtEmitTriggerCmds.fire({orig: trig.id || trig.pattern, cmds: cmds});
                    }
                }
            }
        }
    }
}

