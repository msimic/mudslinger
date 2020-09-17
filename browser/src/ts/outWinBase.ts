import * as Util from "./util";
import { colorIdToHtml } from "./color";
import { EventHook } from "./event";

export interface ConfigIf {
    onSet(key: string, cb: (val: any) => void): void;
    getDef(key: string, def: any): any;
}

export class OutWinBase {
    public EvtLine = new EventHook<string>();

    protected debugScripts = false;

    private colorsEnabled: boolean;
    private copyOnMouseUp: boolean;
    private logTime: boolean;

    private lineCount: number = 0;
    private maxLines: number = 5000;

    private onMouseUp = () => {
        document.execCommand('copy');
        $("#cmdInput").focus();
    }

    constructor(rootElem: JQuery, private config: ConfigIf) {
        this.$rootElem = rootElem;
        this.$targetElems = [rootElem];
        this.$target = rootElem;
        this.maxLines = config.getDef("maxLines", 1000);
        this.debugScripts = config.getDef("debugScripts", true);
        config.onSet("debugScripts", (val) => {
            this.debugScripts = val;
        });

        this.$rootElem.mouseup((event)=> {
            document.execCommand('copy');
            $("#cmdInput").focus();
        });

        // direct children of the root will be line containers, let"s push the first one.
        this.pushElem($("<span>").appendTo(rootElem));

        this.$rootElem.bind("scroll", (e: any) => { this.handleScroll(e); });

        this.colorsEnabled = this.config.getDef("colorsEnabled", true);
        this.copyOnMouseUp = this.config.getDef("copyOnMouseUp", true);
        this.logTime = this.config.getDef("logTime", false);
        this.config.onSet("logTime", (v) => {
            this.logTime = v;
        });
        
        if (this.copyOnMouseUp) {
            this.$rootElem.mouseup(this.onMouseUp);
        }

        this.config.onSet("maxLines", (val: any) => { this.setMaxLines(val); });

        this.config.onSet("colorsEnabled", (val: any) => { this.setColorsEnabled(val); });
        this.config.onSet("copyOnMouseUp", (val: any) => { 
            this.copyOnMouseUp = val;
            this.$rootElem[0].removeEventListener("mouseup", this.onMouseUp);
            if (this.copyOnMouseUp) {
                this.$rootElem[0].addEventListener("mouseup", this.onMouseUp);
            }
        });
    }


    public setMaxLines(count: number) {
        this.maxLines = count;
    }

    private setColorsEnabled(val: boolean) {
        if (val === this.colorsEnabled) {
            return;
        }

        this.colorsEnabled = val;

        for (let colorId in colorIdToHtml) {
            let colorHtml = colorIdToHtml[colorId];

            this.$rootElem.find(".fg-" + colorId).css("color", this.colorsEnabled ? colorHtml : "");
            this.$rootElem.find(".bg-" + colorId).css("background-color", this.colorsEnabled ? colorHtml : "");
            this.$rootElem.find(".bb-" + colorId).css("border-bottom-color", this.colorsEnabled ? colorHtml : "");
        }
    }

    private blink: boolean;
    private underline: boolean;
    private fgColorId: string;
    private bgColorId: string;

    public setBlink(value: boolean) {
        this.blink = value;
    }

    public setUnderline(value: boolean) {
        this.underline = value;
    }

    public setFgColorId(colorId: string) {
        this.fgColorId = colorId;
    }

    public setBgColorId(colorId: string) {
        this.bgColorId = colorId;
    };

    // handling nested elements, always output to last one
    private $targetElems: JQuery[];
    private underlineNest = 0;
    protected $target: JQuery;
    private $rootElem: JQuery;

    private scrollLock = false; // true when we should not scroll to bottom
    private handleScroll(e: any) {
        let scrollHeight = this.$rootElem.prop("scrollHeight");
        let scrollTop = this.$rootElem.scrollTop();
        let outerHeight = this.$rootElem.outerHeight();
        let is_at_bottom = outerHeight + scrollTop + 8 >= scrollHeight;

        this.scrollLock = !is_at_bottom;
    }

    // elem is the actual jquery element
    public pushElem(elem: JQuery) {
        this.writeBuffer();

        this.$target.append(elem);
        this.$targetElems.push(elem);
        this.$target = elem;

        if (elem.hasClass("underline")) {
            this.underlineNest += 1;
        }
    }

    public popElem() {
        this.writeBuffer();

        let popped = this.$targetElems.pop();
        this.$target = this.$targetElems[this.$targetElems.length - 1];

        if (popped.hasClass("underline")) {
            this.underlineNest -= 1;
        }

        return popped;
    }

    private appendBuffer = "";
    private lineText = ""; // track full text of the line with no escape sequences or tags
    public addText(txt: string) {
        this.lineText += txt;
        let html = Util.rawToHtml(txt);
        let spanText = "<span";

        let classText = "";
        if (this.underline && this.colorsEnabled) {
            classText += "underline ";
        }
        if (this.blink && this.colorsEnabled) {
            classText += "blink ";
        }
        if (this.fgColorId) {
            classText += "fg-" + this.fgColorId + " ";
        }
        if (this.bgColorId) {
            classText += "bg-" + this.bgColorId + " ";
        }
        if (this.underlineNest > 0) {
            classText += "bb-" + this.fgColorId + " ";
        }

        if (classText !== "") {
            spanText += " class=\"" + classText + "\"";
        }

        let styleText = "";

        if (this.underlineNest > 0) {
            styleText += "border-bottom-style:solid;";
            styleText += "border-bottom-width:1px;";
            if (this.colorsEnabled) {
                styleText += "border-bottom-color:" + colorIdToHtml[this.fgColorId] + ";display: inline-block;";
            }
        }

        if (this.colorsEnabled) {
            
            if (this.fgColorId) {
                styleText += "color:" + colorIdToHtml[this.fgColorId] + ";";
            }
            if (this.bgColorId) {
                styleText += "background-color:" + colorIdToHtml[this.bgColorId] + ";";
            }
        }

        if (styleText !== "") {
            spanText += " style=\"" + styleText + "\"";
        }

        spanText += ">";
        spanText += html;
        spanText += "</span>";
        this.appendBuffer += spanText;

        if (txt.endsWith("\n")) {
            this.append(this.appendBuffer);
            this.appendBuffer = "";
            this.newLine();
        }
    };

    private padStart(str:string, targetLength:number, padString:string) {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (str.length >= targetLength) {
            return String(str);
        } else {
            targetLength = targetLength - str.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(str);
        }
    };

    protected append(o: any) {
        if (o == "<span></span>") {
            debugger;
        }
        if (this.logTime && o) {
            const time = this.padStart(new Date().toISOString().split("T")[1].split("Z")[0] + " ", 12, " ");
            this.$target.append('<span class="timeLog">' + time + "</span>");
        }
        this.$target.append(o);
    }

    private newLine() {
        this.popElem(); // pop the old line
        this.pushElem($("<span>").appendTo(this.$target));

        this.EvtLine.fire(this.lineText);
        this.lineText = "";

        this.lineCount += 1;
        if (this.lineCount > this.maxLines) {
            this.$rootElem.children(":lt(" +
                (this.maxLines / 2) +
                ")"
            ).remove();
            this.lineCount = (this.maxLines / 2);
        }
    }

    private writeBuffer() {
        if (this.appendBuffer != "<span></span>") this.$target.append(this.appendBuffer);
        this.appendBuffer = "";
    };

    public outputDone() {
        this.writeBuffer();
        this.scrollBottom();
    };

    private scrollRequested = false;
    private privScrolBottom() {
        // console.time("_scroll_bottom");
        let elem = this.$rootElem;
        elem.scrollTop(elem.prop("scrollHeight"));
        this.scrollLock = false;
        this.scrollRequested = false;
        // console.timeEnd("_scroll_bottom");
    };

    protected scrollBottom(force: boolean = false) {
        if (this.scrollLock && force !== true) {
            return;
        }
        if (this.scrollRequested) {
            return;
        }

        requestAnimationFrame(() => this.privScrolBottom());
        this.scrollRequested = true;
    }
}
