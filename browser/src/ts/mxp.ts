import { EventHook } from "./event";
import stripAnsi from 'strip-ansi';
import { OutputManager } from "./outputManager";
import { OutWinBase } from "./outWinBase";
import { CommandInput } from "./commandInput";
import { JsScript } from "./jsScript";


// class DestWin extends OutWinBase {
//     constructor(name: string) {
//         let win = document.createElement("div");
//         win.innerHTML = `
//         <!--header-->
//         <div>${name}</div>
//         <!--content-->
//         <div>
//             <pre class="outputText mxp-dest-output"></pre>
//         </div>
//         `;

//         let cont = win.getElementsByClassName('outputText')[0];

//         (<any>$(win)).jqxWindow({
//             showCloseButton: false,
//             keyboardCloseKey: '' // to prevent close
//         });

//         super($(cont), UserConfig);
//     }
// }

export interface mxpElement {
    name: string;
    regex: RegExp;
    definition:string;
    att:string;
    flag:string;
    tag:string;
    empty:string;
    open:string;
    delete:string;
    closing:string;
}

export class Mxp {
    public EvtEmitCmd = new EventHook<{value: string, noPrint: boolean}>();

    private openTags: Array<string> = [];
    private elements:mxpElement[] = [];
    private tagHandlers: Array<(tag: string) => boolean> = [];
    private elementRegex:RegExp;
    private entityRegex:RegExp;

    // private destWins: {[k: string]: DestWin} = {};

    constructor(private outputManager: OutputManager, private commandInput: CommandInput, private script: JsScript) {
        this.elementRegex = (/<!ELEMENT (?<name>(\w|_)+) +(('|")+(?<definition>([^"'])*)?('|")+)? ?(ATT='?(?<att>[^" ']*)'? ?)?(TAG='?(?<tag>[^" ']*)'? ?)?(FLAG=('|")?(?<flag>[^"']*)('|")? ?)?(?<open>OPEN)? ?(?<empty>EMPTY)? ?(?<delete>DELETE)? ?[^>]*>/gi);
        this.entityRegex = (/<!ENTITY +(?<name>(\w|_)+) +(('|")+(?<definition>([^>])*)?('|")+)? ?(?<private>PRIVATE)? ?(?<delete>DELETE)? ?(?<remove>REMOVE)? ?(?<add>ADD)?>/gi);
        this.makeTagHandlers();
    }

    private addElement(e:mxpElement):mxpElement {
        e = this.parseElement(e);
        this.elements.push(e);
        return e;
    }

    private parseElement(e: mxpElement):mxpElement {
        if (e.definition && e.definition.indexOf("<") > -1) {
            // replacement tags
            const tags = e.definition.match(/<([^>]+)>/g);
            if (tags && tags.length) {
                e.closing = '';
                for (let index = tags.length - 1; index >= 0; index--) {
                    const closeTag = "</" + tags[index].slice(1);
                    e.closing += closeTag;
                }
            }
        }
        e.regex = new RegExp('<' + e.name + '\\b[^>]*>([\\s\\S]*?)<\/' + e.name + '>', 'i');
        return e;
    }

    private makeTagHandlers() {

        this.elements = [];
        this.tagHandlers.push((t) => {
            if (t.match(/!element/i)) {
                var re = this.elementRegex; // (/<!ELEMENT (?<name>(\w|_)+) +(('|")+(?<definition>([^"'])*)?('|")+)? ?(ATT='?(?<att>[^" ']*)'? ?)?(TAG='?(?<tag>[^" ']*)'? ?)?(FLAG=('|")?(?<flag>[^"']*)('|")? ?)?(?<open>OPEN)? ?(?<empty>EMPTY)? ?(?<delete>DELETE)? ?[^>]*>/gi);
                re.lastIndex = 0;
                let m = re.exec(t);
                if (m) {
                    let ele = this.addElement(<mxpElement>(<any>m).groups);
                    //console.debug("Element: ", ele);
                    while (m = re.exec(t)) {
                        ele = this.addElement(<mxpElement>(<any>m).groups);
                        //console.debug("MXP Element: ", ele);
                    }
                    return true;
                }
            };
            return false;
        });

        this.tagHandlers.push((t) => {
            if (t.match(/<!entity/i)) {
                var re = this.entityRegex;
                re.lastIndex = 0;
                let m = re.exec(t);
                if (m) {
                    const def = (<any>m).groups.definition || '';
                    if (!this.script.getScriptThis()[(<any>m).groups.name]) {
                        this.script.getScriptThis()[(<any>m).groups.name] = "";
                    }
                    if ((<any>m).groups.delete) {
                        delete this.script.getScriptThis()[(<any>m).groups.name];
                    }
                    else if ((<any>m).groups.add) {
                        if (this.script.getScriptThis()[(<any>m).groups.name].length) {
                            this.script.getScriptThis()[(<any>m).groups.name] += "|";
                        }
                        this.script.getScriptThis()[(<any>m).groups.name]+=unescape(def.replace(/\\"/g, '"'));
                    }
                    else if ((<any>m).groups.remove) {
                        // todo remove from list instead of deleting
                        delete this.script.getScriptThis()[(<any>m).groups.name];
                    }
                    else {
                        this.script.getScriptThis()[(<any>m).groups.name] = unescape(def.replace(/\\"/g, '"'));
                    }
                    return true;
                }
            };
            return false;
        });

        this.tagHandlers.push((tag) => {
            let re = /^<version>$/i;
            let match = re.exec(tag);
            if (match) {
                this.EvtEmitCmd.fire({
                    value: "\x1b[1z<VERSION CLIENT=Mudslinger MXP=0.01>", // using closing line tag makes it print twice...
                    noPrint: true});
                    //console.debug("MXP Version");
                return true;
            }
            return false;
        });

        this.tagHandlers.push((tag) => {
            /* hande image tags */
            let re = /^<image ?(FName=["|']?([^ '"]+)["|']?)? ?url="([^">]*)">/i;
            let match = re.exec(tag);
            if (match) {
                /* push and pop is dirty way to do this, clean it up later */
                let elem = $("<img style=\"max-width:90%;max-height:70%;\" src=\"" + match[3] + match[2] + "\">");
                this.outputManager.pushMxpElem(elem);
                this.outputManager.popMxpElem();
                //console.debug("MXP Image: ", match[2] + match[1]);
                return true;
            }

            return false;
        });

        // this.tagHandlers.push((tag: string): boolean => {
        //     /* handle dest tags */
        //     let re = /^<dest (\w+)>$/i;
        //     let match = re.exec(tag);
        //     if (match) {
        //         let destName = match[1];
        //         this.openTags.push("dest");
        //         if (!this.destWins[destName]) {
        //             this.destWins[destName] = new DestWin(destName);
        //         }
        //         this.outputManager.pushTarget(this.destWins[destName]);
        //         return true;
        //     }

        //     re = /^<\/dest>$/i;
        //     match = re.exec(tag);
        //     if (match) {
        //         if (this.openTags[this.openTags.length - 1] !== "dest") {
        //             /* This may happen often for servers sending newline before closing dest tag */
        //         } else {
        //             this.openTags.pop();
        //             this.outputManager.popTarget();
        //         }
        //         return true;
        //     }

        //     return false;            
        // });

        this.tagHandlers.push((tag) => {
            let re = /^<a /i;
            let match = re.exec(tag);
            if (match) {
                this.openTags.push("a");
                let elem = $(tag);
                elem.attr("target", "_blank");
                elem.addClass("underline");

                this.outputManager.pushMxpElem(elem);
                return true;
            }

            re = /^<\/a>/i;
            match = re.exec(tag);
            if (match) {
                if (this.openTags[this.openTags.length - 1] !== "a") {
                    /* We actually expect this to happen because the mud sends newlines inside DEST tags right now... */
                    console.log("Got closing a tag with no opening tag.");
                } else {
                    this.openTags.pop();
                    this.outputManager.popMxpElem();
                }
                return true;
            }

            return false;
        });
        this.tagHandlers.push((tag) => {
            let re = /^<([bius])>/i;
            let match = re.exec(tag);
            if (match) {
                this.openTags.push(match[1]);
                let elem = $(tag);
                this.outputManager.pushMxpElem(elem);
                return true;
            }

            re = /^<\/([bius])>/i;
            match = re.exec(tag);
            if (match) {
                if (this.openTags[this.openTags.length - 1] !== match[1]) {
                    console.log("Got closing " + match[1] + " tag with no opening tag.");
                } else {
                    this.openTags.pop();
                    this.outputManager.popMxpElem();
                }
                return true;
            }

            return false;
        });
        this.tagHandlers.push((tag) => {
            let re = /^<send/i;
            let match = re.exec(tag);
            if (match) {
                
                /* just the tag */
                let tag_re = /^<send ?(?:href=)?(["'](.*)["'])?([^>]*)?>([^<]+)<\/send>/i;
                let tag_m = tag_re.exec(tag);
                if (tag_m) {
                    this.openTags.push("send");
                    let html_tag = "<a>";
                    let elem = $(html_tag);
                    const tagCommand = stripAnsi(tag_m[2] ? tag_m[2] : tag_m[4]);
                    elem[0].setAttribute("title", tagCommand);
                    elem.addClass("underline");
                    elem.addClass("clickable");
                    if (tag_m[3] && tag_m[3].match(/prompt/i)) {
                        elem.click(() => {
                            this.commandInput.setInput(tagCommand);
                        });
                    }
                    else {
                        elem.click(() => {
                            this.EvtEmitCmd.fire({value: tagCommand, noPrint: false});
                        });
                    }
                    this.outputManager.pushMxpElem(elem);
                    this.outputManager.handleTelnetData(this.str2ab(tag_m[4]));
                    this.openTags.pop();
                    this.outputManager.popMxpElem();
                    return true;
                }
            }

            re = /^<\/send>/i;
            match = re.exec(tag);
            if (match) {
                if (this.openTags[this.openTags.length - 1] !== "send") {
                    console.log("Got closing send tag with no opening tag.");
                } else {
                    this.openTags.pop();
                    let elem = this.outputManager.popMxpElem();
                    if (!elem[0].hasAttribute("title")) {
                        /* didn"t have explicit href so we need to do it here */
                        let txt = elem.text();
                        elem[0].setAttribute("title", txt);
                        elem.click(() => {
                            this.EvtEmitCmd.fire({value: txt, noPrint: false});
                        });
                    }
                }
                return true;
            }

            return false;
        });
    }

    str2ab(str:string) {
        var buf = new ArrayBuffer(str.length); // 2 bytes for each char
        var bufView = new Uint8Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++) {
          bufView[i] = str.charCodeAt(i);
        }
        return buf;
      }

    handleMxpTag(data: string) {
        let handled = false;

        for (var i = 0; i < this.elements.length; i++) {
            let tmp:RegExpMatchArray;
            if (this.elements[i].regex && (tmp = data.match(this.elements[i].regex))) {
                data = '';
                if (this.elements[i].definition) {
                    data += this.elements[i].definition;
                }
                handled = true;
                data += tmp[1];
                if (this.elements[i].closing) {
                    data += this.elements[i].closing;
                }
                if (this.elements[i].flag) {
                    const varName = this.elements[i].flag.replace(/^set /i, "");
                    tmp[1] = stripAnsi(tmp[1]);
                    this.script.getScriptThis()[varName] = tmp[1];
                    //console.debug("MXP set var: ", varName, tmp[1]);
                }
                //console.debug("MXP Parse Element: ", this.elements[i].name, data);
            }
        }

        if (handled) {
            this.outputManager.handleTelnetData(this.str2ab(data));
            return;
        }

        for (let ti = 0; ti < this.tagHandlers.length; ti++) {
            /* tag handlers will return true if it"s a match */
            if (this.tagHandlers[ti](data)) {
                handled = true;
                break;
            }
        }

        if (!handled) {
            console.log("Unsupported MXP tag: " + data);
            const re = /^<([a-zA-Z0-9]*)\b[^>]*>([\s\S]*?)<\/\1>/;
            const m = data.match(re);
            if (m && m.length >= 2) {
                data = m[2];
                this.outputManager.handleTelnetData(this.str2ab(data));
            }
        }
    };

    // Need to close any remaining open tags whe we get newlines
    public handleNewline() {
        if (this.openTags.length < 1) {
            return;
        }

        for (let i = this.openTags.length - 1; i >= 0; i--) {
            if (this.openTags[i] === "dest") {
                this.outputManager.popTarget();
            } else {
                this.outputManager.popMxpElem();
            }
        }
        this.openTags = [];
    };
}
