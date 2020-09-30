import { EventHook } from "./event";
import { TrigAlItem } from "./trigAlEditBase";
import { ClassManager } from "./classManager";
import { EvtScriptEmitPrint, EvtScriptEmitToggleTrigger } from "./jsScript";
import { ProfileManager } from "./profileManager";
import { Mudslinger } from "./client";

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

    constructor(private jsScript: ScriptIf, private config: ConfigIf, private baseConfig: ConfigIf, private classManager: ClassManager, private profileManager:ProfileManager) {
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

    private charSent = false;
    private passSent = false;
    private handleAutologin(line: string) {
        if (!this.profileManager.getCurrent()) {
            return;
        }

        if (line.match(/^Che nome vuoi usare ?/)) {
            const prof = this.profileManager.getProfile(this.profileManager.getCurrent());
            if (prof.autologin && prof.char && !this.charSent) {
                this.charSent = true;
                setTimeout(()=>{ this.charSent = false;}, 1000);
                this.EvtEmitTriggerCmds.fire({orig: 'autologin', cmds: [prof.char]});
            }
        } else if (line.match(/^Inserisci la sua password:/)) {
            const prof = this.profileManager.getProfile(this.profileManager.getCurrent());
            if (prof.autologin && prof.pass && !this.passSent) {
                this.passSent = true;
                setTimeout(()=>{ this.passSent = false;}, 1000);
                const pass = Mudslinger.decrypt(prof.pass);
                this.EvtEmitTriggerCmds.fire({orig: 'autologin', cmds: [pass, 'i', 'i', 'i']});
            }
        }
    }

    public runTrigger(trig:TrigAlItem, line:string) {
        if (trig.regex) {
            let match = line.match(trig.pattern);
            if (!match) {
                return;
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

    public buffer:string;
    public line:string;

    public handleBuffer(line: string, raw:string): string {
        this.line = null;
        this.buffer = null;
        if (this.config.getDef("triggersEnabled", true) !== true) return null;
        this.buffer = raw;
        this.line = line;
        this.handleAutologin(line);

        for (let i = 0; i < this.allTriggers.length; i++) {
            let trig = this.allTriggers[i];
            if (!trig.enabled || (trig.class && !this.classManager.isEnabled(trig.class))) continue;
            if (!trig.is_prompt) continue;
            this.runTrigger(trig, line);
        }
        return this.buffer;
    }

    public handleLine(line: string, raw:string): string {
        this.line = null;
        this.buffer = null;
        if (this.config.getDef("triggersEnabled", true) !== true) return null;
        this.buffer = raw;
        this.line = line;
        for (let i = 0; i < this.allTriggers.length; i++) {
            let trig = this.allTriggers[i];
            if (!trig.enabled || (trig.class && !this.classManager.isEnabled(trig.class))) continue;
            if (trig.is_prompt) continue;
            this.runTrigger(trig, this.line);
        }
        return this.buffer;
    }

    private doReplace(sBuffer:string, positions:number[], positionsText:number[], sText:string, sWhat:string, sWith:string) {
        let rx = new RegExp(sWhat, 'gi');
        let matches = rx.exec(sText);
        if (matches && matches.length) {
            let start = matches.index;
            let end = start + matches[0].length-1;
            let closeTags = [];
            let openTags = [];
            
            let bufferStart = positions[positionsText[start]];
            let bufferEnd = positions[positionsText[end]];
            if (sBuffer[bufferEnd]=="&") bufferEnd+=3;
            let charsBefore = [];
            let chars = [];
            
            for (let i = 0; i < bufferStart; i++) {
                charsBefore.push(sBuffer[i]);
            }
            
            let intag = false;
            let closingTag = false;
            let tag = "";
            let spaceFound = false;
            for (let i = bufferStart; i < bufferEnd; i++) {
                if (sBuffer[i] == "<") {
                    tag = "";
                    spaceFound = false;
                    intag = true;
                    if (i+1 <= bufferEnd && sBuffer[i+1]=="/") {
                        closingTag = true;
                    i++;
                    }
                    continue;
                }
                if (intag) {
                    if (sBuffer[i] == ">") {
                        if (closingTag) {
                            closeTags.push(tag);
                        } else {
                            openTags.push(tag);
                        }
                        closingTag = false;
                        intag = false;
                    }
                    else {
                        if (sBuffer[i]==" ") {
                            spaceFound = true;
                        }
                        if (!spaceFound) {
                            tag+=sBuffer[i];
                        }
                    }   
                }
            }
            
            chars.push(sWith);
            
            for (let i = 0; i < openTags.length; i++) {
                charsBefore.push("<" + openTags[i] + ">");
            }
            
            for (let i = 0; i < closeTags.length; i++) {
                chars.push("</" + closeTags[i] + ">");
            }
            
            for (let i = bufferEnd+1; i < sBuffer.length; i++) {
                chars.push(sBuffer[i]);
            }
            
            return [...charsBefore,...chars].join("");
        }
        return sBuffer;
    }

    private htmlEscapes = {
        '&lt;': '<',
        '&gt;': '>',
        /*'&#39;': "'",
        '&#34;': '"',*/
        '&amp;': "&"
    };

    htmlDecode(s:string, i:number):[string,string] {
      for (const key in this.htmlEscapes) {
          if (Object.prototype.hasOwnProperty.call(this.htmlEscapes, key)) {
              const element = <string>((<any>this.htmlEscapes)[key]);
                const sub = s.substr(i, key.length);
                if (sub == key) {
                    return [element, key];
                }
          }
      }
      return null;
    }

    htmlEncode(s:string, i:number):[string,string] {
        for (const key in this.htmlEscapes) {
            if (Object.prototype.hasOwnProperty.call(this.htmlEscapes, key)) {
                const element = <string>((<any>this.htmlEscapes)[key]);
                  const sub = s.substr(i, 1);
                  if (sub == element) {
                      return [key, element];
                  }
            }
        }
        return null;
      }

    private stripHtml(sText:string):string {
        let intag = false;
        let positions = [];
        for (var i = 0; i < sText.length; i++) {
            if (sText[i] == "<") intag = true;
            if (!intag) {
                positions.push(sText[i]);
            }
            if (sText[i] == ">") intag = false;
        }
        return positions.join("");
    }

    public subBuffer(sWhat: string, sWith: string) {
        let buffer = this.buffer;
        let text = this.line.split("\n")[0];
        let intag = false;
        let positions = [];
        let positionsText = [];
        let offset = 0;
        let htmltext = "";

        for (var i = 0; i < text.length; i++) {
            const val = this.htmlEncode(text, i);
            if (val) {
                htmltext += val[0];
                positionsText.push(i+offset);
                offset+=val[0].length-1;
            } else {
                htmltext += text[i];
                positionsText.push(i+offset);
            }
        }

        for (var i = 0; i < buffer.length; i++) {
            if (buffer[i] == "<") intag = true;
            if (!intag) {
                positions.push(i);
            }
            if (buffer[i] == ">") intag = false;
        }

        this.line = text.replace(new RegExp((sWhat), 'gi'), (sWith.indexOf("<span")!=-1 ? this.stripHtml(sWith) : sWith));
        this.buffer = this.doReplace(buffer, positions, positionsText, text, sWhat, sWith);
    }
    
    gag() {
        this.buffer = "";
        this.line = "";
    }
}

