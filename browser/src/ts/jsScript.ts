import { isNumeric } from "jquery";
import { AliasManager } from "./aliasManager";
import { ClassManager } from "./classManager";
import { EventHook } from "./event";
import { OutputManager } from "./outputManager";
import { TrigAlItem } from "./trigAlEditBase";
import { TriggerManager } from "./triggerManager";

export let EvtScriptEmitCmd = new EventHook<{owner:string, message:string}>();
export let EvtScriptEmitPrint = new EventHook<{owner:string, message:string, window?:string}>();
export let EvtScriptEmitError = new EventHook<{owner:string, err:any}>();
export let EvtScriptEmitCls = new EventHook<{owner:string, window?:string}>();
export let EvtScriptEmitEvalError = new EventHook<any>();
export let EvtScriptEmitToggleAlias = new EventHook<{owner:string, id:string, state:boolean}>();
export let EvtScriptEmitToggleTrigger = new EventHook<{owner:string, id:string, state:boolean}>();
export let EvtScriptEmitToggleClass = new EventHook<{owner:string, id:string, state:boolean}>();

export let EvtScriptEvent = new EventHook<{event:ScripEventTypes, condition:string, value:any}>();

export interface PropertyChanged {
    obj: any;
    propName: any;
    oldValue: any;
    newValue: any;
}

declare interface ScriptThis {
    startWatch(onWatch:(ev:PropertyChanged)=>void) : void;
    [prop:string]:any;
}

let startWatch = function (this : ScriptThis, onWatch:(ev:PropertyChanged)=>void) {

    var self = <any>this;

    if (!self.watchTask) {
        self._oldValues = [];

        for (var propName in self) {
            self._oldValues[propName] = self[propName];
        }


        setInterval(function () {
            for (var propName in self) {
                var propValue = self[propName];
                if (typeof (propValue) != 'function') {


                    var oldValue = self._oldValues[propName];

                    if (propValue != oldValue) {
                        self._oldValues[propName] = propValue;

                        onWatch({ obj: self, propName: propName, oldValue: oldValue, newValue: propValue });

                    }

                }
            }
        }, 30);
    }
}

function makeScript(owner:string, text: string, argsSig: string,
    classManager: ClassManager,
    aliasManager: AliasManager,
    triggerManager: TriggerManager,
    outputManager: OutputManager) {

    let _scriptFunc_: any;
    let own = owner;

    /* Scripting API section */
    const color = function(sText: string, sColor:string, sBackground:string, bold:boolean, underline:boolean, blink:boolean) {
        let classes = "";
        if (blink) {
            classes += "blink ";
        }
        if (underline) {
            classes += "underline "
        }
        let styles = "display: inline-block;";
        if (sColor) {
            styles += "color:" + sColor + ";"
        }
        if (sBackground) {
            styles += "background-color:" + sBackground + ";"
        }
        /*if (underline) {
            styles += "border-bottom-style:solid;border-bottom-width:1px;border-bottom-color:" + (sColor || "white") + ";";
        }*/
        let content = (bold ? "<b>" : "") + sText + (bold ? "</b>" : "");
        let span = `<span class="${classes}" style="${styles}">${content}</span>`;
        return span;
    };
    const sub = function(sWhat: string, sWith:string) {
        if (triggerManager) triggerManager.subBuffer(sWhat, sWith);
    };
    const gag = function() {
        if (triggerManager) triggerManager.gag();
    };
    const cap = function(window:string) {
        if (triggerManager) {
            outputManager.sendToWindow(window, triggerManager.line, triggerManager.buffer);
        }
    };
    const send = function(cmd: string) {
        EvtScriptEmitCmd.fire({owner: own, message: cmd.toString()});
    };
    const print = function(message: string, window?:string) {
        EvtScriptEmitPrint.fire({owner: own, message: message.toString(), window: window});
    };
    const cls = function(window?:string) {
        EvtScriptEmitCls.fire({owner: own, window: window});
    };
    const toggleTrigger = function(id:string, state: boolean) {
        EvtScriptEmitToggleTrigger.fire({owner: own, id: id, state: state});
    };
    const toggleAlias = function(id:string, state: boolean) {
        EvtScriptEmitToggleAlias.fire({owner: own, id: id, state: state});
    };
    const toggleClass = function(id:string, state: boolean) {
        EvtScriptEmitToggleClass.fire({owner: own, id: id, state: state});
    };

    const classEnabled = function(id:string):boolean {
        if (classManager) return classManager.isEnabled(id);
        return true;
    };

    const triggerEnabled = function(id:string):boolean {
        if (triggerManager) return triggerManager.isEnabled(id);
        return true;
    };

    const aliasEnabled = function(id:string):boolean {
        if (aliasManager) return aliasManager.isEnabled(id);
        return true;
    };

    const getTrigger = function(id:string):TrigAlItem {
        if (triggerManager) return triggerManager.getById(id);
        return null;
    };

    const getAlias = function(id:string):TrigAlItem {
        if (aliasManager) return aliasManager.getById(id);
        return null;
    };

    /* end Scripting API section */

    try {
        eval("_scriptFunc_ = function(" + argsSig + ") {\"use strict\";\n" + text + "\n}");
    }
    catch (err) {
        EvtScriptEmitEvalError.fire(err);
        return null;
    }

    return _scriptFunc_.bind(this);;
}

export interface Variable {
    Name: string;
    Class: string;
    Value: any;
}

export interface ConfigIf {
    set(key: string, val: [string, Variable][]): void;
    set(key: string, val: [string, ScriptEvent[]][]): void;
    getDef(key: string, def: any): any;
    get(key: string): Map<string, Variable>;
    evtConfigImport: EventHook<{[k: string]: any}>;
}

export enum ScripEventTypes {
    VariableChanged,
    ConnectionState,
    SettingChanged,
    ClassChanged,
    TriggerFired
}

export class ScriptEventsIta {
    public static nameof(index:string):string {
        const itaNames = [
            'Variabile cambiata',
            'Stato conessione cambiato',
            'Impostazione cambiata',
            'Stato classe cambiato',
            'Trigger scattato'
        ];
        return itaNames[Number(index)];
    }
};

export interface ScriptEvent {
    type: string;
    condition: string;
    value: string;
    id: string,
    class: string;
    enabled: boolean;
    script?: Function;
}

export class JsScript {
    private scriptThis: ScriptThis = {
        startWatch: startWatch
    }; /* the 'this' used for all scripts */
    private classManager: ClassManager;
    private aliasManager: AliasManager;
    private triggerManager: TriggerManager;
    private outputManager: OutputManager;
    private variables: Map<string, Variable>;
    private eventList: ScriptEvent[] = [];
    private events: Map<string, ScriptEvent[]> = new Map<string, ScriptEvent[]>();
    private self = this;
    constructor(private config: ConfigIf) {
        this.load();
        config.evtConfigImport.handle(() => {
            this.load();
        }, this);
        this.scriptThis.startWatch((e)=>{
            //console.debug(e.propName + ": " + e.newValue);
            //this.aliasManager.checkAlias("on"+e.propName + " " + e.oldValue);
            EvtScriptEvent.fire({event: ScripEventTypes.VariableChanged, condition: e.propName, value: e});
        });
        EvtScriptEvent.handle((e) => {
            this.eventFired(e)
        });
    }

    eventFired(e: any) {
        let evt = ScripEventTypes[e.event];
        let cond = e.condition;
        let val = e.value;
        this.onEvent(<string>evt, cond, val);
    }

    checkEventCondition(ev:ScriptEvent, condition:string):boolean {
        return ev.condition == condition;
    }

    triggerEvent(ev:ScriptEvent, param:any) {
        if (!ev.script) {
            ev.script = this.makeScript("event " +ev.type, ev.value, "args");
        }
        ev.script(param);
    }

    onEvent(type:string, condition:string, param:any) {
        if (!this.events.has(type)) return;

        const evts = this.events.get(type);
        for (const ev of evts) {
            if (ev.enabled && this.checkEventCondition(ev, condition) && (!ev.class || this.classManager.isEnabled(ev.class))) {
                this.triggerEvent(ev, param);
            }
        }
    }

    putEvents(events:ScriptEvent[]) {
        for (const ev of events) {
            this.addEvent(ev);
        }
    }

    clearEvents() {
        this.eventList = [];
        this.events.clear();
    }

    getEvents(Class?:string):ScriptEvent[] {
        let ret:ScriptEvent[] = [];
        for (const ev of this.events) {
            ret = ret.concat(ev[1]||[]);
        }
        return ret.filter(ev => ev.class == Class || !Class);
    }

    getEvent(id:string):ScriptEvent {
        return this.eventList.find(e => e.id == id) || null;
    }

    addEvent(ev:ScriptEvent) {
        this.eventList.push(ev);
        if (!this.events.has(ev.type)) {
            this.events.set(ev.type, []);
        }
        this.events.get(ev.type).push(ev);
    }

    delEvent(ev:ScriptEvent) {
        let ind = this.eventList.indexOf(ev);
        if (ind != -1) {
            this.eventList.splice(ind, 1);
        }
        if (this.events.has(ev.type)) {
            ind = this.events.get(ev.type).indexOf(ev);
            if (ind != -1) {
                this.events.get(ev.type).splice(ind, 1);
            }
        }
        if (this.eventList.length == 0) {
            this.events.clear();
        }
    }

    getVariables(Class?:string):Variable[] {
        return [...this.variables.values()].filter(v => v.Class == Class || !Class);
    }

    setVariable(variable:Variable) {
        if (isNumeric(variable.Value)) {
            variable.Value = Number(variable.Value);
        }
        this.variables.set(variable.Name, variable);
        this.scriptThis[variable.Name] = variable.Value;
    }

    delVariable(variable:Variable) {
        this.variables.delete(variable.Name);
        delete this.scriptThis[variable.Name];
    }

    setVariables(variables:Variable[]) {
        this.variables.clear();
        for (const v of variables) {
            this.setVariable(v);
        }
    }

    load() {
        this.clearEvents();
        let sc = this.config.getDef("script_events", []);
        this.events = new Map<string, ScriptEvent[]>(sc);
        for (const ev of this.events) {
            if (ev[1]) this.eventList.concat(ev[1]);
        }
        this.variables = new Map<string, Variable>(this.config.getDef("variables", []));
        for (const v of this.variables) {
            if (v[0] && v[1].Value) this.scriptThis[v[0]] = v[1].Value;
        }
    }

    save() {
        for (const key in this.scriptThis) {
            if (Object.prototype.hasOwnProperty.call(this.scriptThis, key)) {
                const element = this.scriptThis[key];
                if (typeof element != "function" && key != "oldValues" && key[0]!='_') {
                    let variable = this.variables.get(key) || { Name: key, Class: "", Value: null };
                    variable.Value = element;
                    variable.Name = variable.Name || key;
                    this.variables.set(key, variable);
                }
            }
        }
        for (const k of this.variables.keys()) {
            if (this.variables.get(k).Value == undefined || k == "oldValues" || k[0]=='_') {
                this.variables.delete(k);
            }
        }
        this.config.set("script_events", [...this.events]);
        this.config.set("variables", [...this.variables]);
    }

    public getScriptThis() { return this.scriptThis; }

    public makeScript(owner:string, text: string, argsSig: string): any {
        try {
        let scr = makeScript.call(this.scriptThis, owner, text, argsSig, this.classManager, this.aliasManager, this.triggerManager, this.outputManager);
        if (!scr) { return null; }
        return (...args: any[]) => {
            try {
                scr(...args);
            } catch (err) {
                EvtScriptEmitError.fire({owner:owner, err: err});
            }
        };
        } catch (err2) {
            EvtScriptEmitEvalError.fire(err2);
        }
    }

    public setClassManager(classManager:ClassManager) {
        this.classManager = classManager;
    }

    public setTriggerManager(triggerManager:TriggerManager) {
        this.triggerManager = triggerManager;
    }

    public setAliasManager(aliasManager:AliasManager) {
        this.aliasManager = aliasManager;
    }

    public setOutputManager(manager:OutputManager) {
        this.outputManager = manager;
    }
}