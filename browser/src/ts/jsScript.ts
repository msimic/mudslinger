import { AliasManager } from "./aliasManager";
import { ClassManager } from "./classManager";
import { EventHook } from "./event";
import { TrigAlItem } from "./trigAlEditBase";
import { TriggerManager } from "./triggerManager";

export let EvtScriptEmitCmd = new EventHook<{owner:string, message:string}>();
export let EvtScriptEmitPrint = new EventHook<{owner:string, message:string}>();
export let EvtScriptEmitError = new EventHook<any>();
export let EvtScriptEmitEvalError = new EventHook<any>();
export let EvtScriptEmitToggleAlias = new EventHook<{owner:string, id:string, state:boolean}>();
export let EvtScriptEmitToggleTrigger = new EventHook<{owner:string, id:string, state:boolean}>();
export let EvtScriptEmitToggleClass = new EventHook<{owner:string, id:string, state:boolean}>();

function makeScript(owner:string, text: string, argsSig: string,
    classManager: ClassManager,
    aliasManager: AliasManager,
    triggerManager: TriggerManager) {

    let _scriptFunc_: any;
    let own = owner;

    /* Scripting API section */
    const send = function(cmd: string) {
        EvtScriptEmitCmd.fire({owner: own, message: cmd});
    };
    const print = function(message: string) {
        EvtScriptEmitPrint.fire({owner: own, message: message});
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

export class JsScript {
    private scriptThis: any = {}; /* the 'this' used for all scripts */
    private classManager: ClassManager;
    private aliasManager: AliasManager;
    private triggerManager: TriggerManager;

    getScriptThis() { return this.scriptThis; }

    public makeScript(owner:string, text: string, argsSig: string): any {
        try {
        let scr = makeScript.call(this.scriptThis, owner, text, argsSig, this.classManager, this.aliasManager, this.triggerManager);
        if (!scr) { return null; }
        return (...args: any[]) => {
            try {
                scr(...args);
            } catch (err) {
                EvtScriptEmitError.fire(err);
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
}