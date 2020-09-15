import { TrigAlItem } from "./trigAlEditBase";
import { EventHook } from "./event";
import { ClassManager } from "./classManager";
import { EvtScriptEmitPrint, EvtScriptEmitToggleAlias } from "./jsScript";

export interface ConfigIf {
    set(key: string, val: TrigAlItem[]): void;
    getDef(key: string, def: boolean): boolean;
    get(key:string): TrigAlItem[];
    evtConfigImport: EventHook<{[k: string]: any}>;
}

export interface ScriptIf {
    makeScript(owner:string, text: string, argsSig: string): any;
}

export class AliasManager {
    public aliases: Array<TrigAlItem> = null;

    constructor(private jsScript: ScriptIf, private config: ConfigIf, private classManager:ClassManager) {
        this.loadAliases();
        config.evtConfigImport.handle(() => {
            this.loadAliases();
            this.saveAliases();
        }, this);
        EvtScriptEmitToggleAlias.handle(this.onToggle, this);
    }

    private onToggle(data: {owner: string, id:string, state:boolean}) {
        this.setEnabled(data.id, data.state);
        if (this.config.getDef("debugScripts", false)) {
            const msg = "Alias " + data.id + " e' ora " + (this.isEnabled(data.id) ? "ABILITATO" : "DISABILITATO");
            EvtScriptEmitPrint.fire({owner:"AliasManager", message: msg});
        }
    }

    public setEnabled(id:string, val:boolean) {
        const t = this.getById(id);
        if (!t) {
            if (this.config.getDef("debugScripts", false)) {
                const msg = "Alias " + id + " non esiste!";
                EvtScriptEmitPrint.fire({owner:"AliasManager", message: msg});
            }    
            return;
        }
    }

    public getById(id:string):TrigAlItem {
        for (let index = 0; index < this.aliases.length; index++) {
            const element = this.aliases[index];
            if (element.id == id) return element;
        }
        return null;
    }

    public isEnabled(id:string):boolean {
        const t = this.getById(id);
        return t && t.enabled;
    }

    public saveAliases() {
        this.config.set("aliases", this.aliases);
    }

    private loadAliases() {
        this.aliases = this.config.get("aliases") || [];
    }

    // return the result of the alias if any (string with embedded lines)
    // return true if matched and script ran
    // return null if no match
    public checkAlias(cmd: string): boolean | string {
        if (this.config.getDef("aliasesEnabled", true) !== true) return null;

        for (let i = 0; i < this.aliases.length; i++) {
            let alias = this.aliases[i];
            if (!alias.enabled || (alias.class && !this.classManager.isEnabled(alias.class))) continue;
            if (alias.regex) {
                let re = alias.pattern.charAt(0) == "^" ? alias.pattern : ("^" + alias.pattern);
                let alias_match:RegExpMatchArray;
                alias_match = cmd.match(re);
                if (!alias_match || alias_match == undefined) {
                    continue;
                }
                if (alias.is_script) {
                    if (!alias.script) {
                        alias.script = this.jsScript.makeScript(alias.id || alias.pattern, alias.value, "match, input");
                    }
                    if (alias.script) { alias.script(alias_match, cmd); };
                    return true;
                } else {
                    let value = alias.value;

                    value = value.replace(/\$(\d+)/g, function(m, d) {
                        return alias_match[parseInt(d)] || "";
                    });
                    return value;
                }
            } else {
                let re = "^" + alias.pattern + "\\s*(.*)$";
                let match = cmd.match(re);
                if (!match) {
                    continue;
                }

                if (alias.is_script) {
                    if (!alias.script) {
                        alias.script = this.jsScript.makeScript(alias.id || alias.pattern, alias.value, "input");
                    }
                    if (alias.script) { alias.script(cmd); };
                    return true;
                } else {
                    let value = alias.value.replace("$1", match[1] || "");
                    return value;
                }
            }
        }
        return null;
    };
}
