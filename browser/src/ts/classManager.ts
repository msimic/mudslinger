import { EventHook } from "./event";
import { TrigAlItem } from "./trigAlEditBase";
import { EvtScriptEmitPrint, EvtScriptEmitToggleClass, EvtScriptEvent, ScripEventTypes } from "./jsScript";

export interface ConfigIf {
    set(key: string, val: Map<string, Class>): void;
    getDef(key: string, def: boolean): boolean;
    get(key: string): Map<string, Class>;
    evtConfigImport: EventHook<{[k: string]: any}>;
}

export interface Class{
    name: string;
    enabled: boolean;
}

export class ClassManager {
    public EvtEmitTriggerCmds = new EventHook<{orig: string, cmds: string[]}>();

    public classes: Map<string, Class> = new Map<string, Class>();

    constructor(private config: ConfigIf) {
        EvtScriptEmitToggleClass.handle(this.onToggle, this);
        this.loadClasses();
    }

    private onToggle(data: {owner: string, id:string, state:boolean}) {
        this.Toggle(data.id, data.state);
        const msg = "La classe " + data.id + " e' ora " + (this.isEnabled(data.id) ? "ABILITATA" : "DISABILITATA");
        if (this.config.getDef("debugScripts", false)) EvtScriptEmitPrint.fire({owner:"ClassManager", message: msg});
    }

    public Delete(id:string) {
        this.classes.delete(id);
    }
    public Create(id:string, val:boolean) {
        this.classes.set(id, {
            name: id,
            enabled: val
        });
        this.saveClasses();
    }
    public Toggle(id: string, val:boolean):void {
        if (!this.classes.has(id)) {
            this.Create(id, val == undefined ? true : val);
            this.saveClasses();
            return;
        }
        const cls = this.classes.get(id);
        if (val == undefined) {
            val = !cls.enabled;
        }
        cls.enabled = val;
        EvtScriptEvent.fire({event: ScripEventTypes.ClassChanged, condition: id, value: cls.enabled});
    }

    public isEnabled(id: string):boolean {
        if (this.classes.has(id)) {
            return this.classes.get(id).enabled;
        }
        return true;
    }

    public saveClasses() {
        this.config.set("classes", this.classes);
    }

    private loadClasses() {
        this.classes = this.config.get("classes") ? new Map<string, Class>(this.config.get("classes")) : new Map<string, Class>();
    }
}

