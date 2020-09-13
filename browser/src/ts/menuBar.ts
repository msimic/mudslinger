import { EventHook } from "./event";

import { UserConfig } from "./userConfig";

import { AliasEditor } from "./aliasEditor";
import { TriggerEditor } from "./triggerEditor";
import { JsScriptWin } from "./jsScriptWin";
import { AboutWin } from "./aboutWin";

export class MenuBar {
    public EvtChangeDefaultColor = new EventHook<[string, string]>();
    public EvtChangeDefaultBgColor = new EventHook<[string, string]>();
    public EvtContactClicked = new EventHook<void>();
    public EvtConnectClicked = new EventHook<void>();
    public EvtDisconnectClicked = new EventHook<void>();
    private clickFuncs: {[k: string]: (value:any) => void} = {};
    private optionMappingToStorage = new Map([
        ["connect", ""],
        ["aliases", ""],
        ["triggers", ""],
        ["script", ""],
        ["config", ""],
        ["text-color", ""],
        ["white-on-black", "text-color"],
        ["green-on-black", "text-color"],
        ["black-on-gray", "text-color"],
        ["black-on-white", "text-color"],
        ["wrap-lines", "wrap-lines"],
        ["enable-color", "colorsEnabled"],
        ["enable-utf8", "utf8Enabled"],
        ["enable-mxp", "mxpEnabled"],
        ["enable-aliases", "aliasesEnabled"],
        ["enable-triggers", "triggersEnabled"],
        ["extra-small-font", "font-size"],
        ["small-font", "font-size"],
        ["normal-font", "font-size"],
        ["large-font", "font-size"],
        ["extra-large-font", "font-size"],
        ["courier", "font"],
        ["consolas", "font"],
        ["monospace", "font"],
        ["about", ""],
        ["docs", ""],
        ["contact", ""],
        ["profiles", ""],
    ]); 

    private attachMenuOption(name:string, element:Element, checkbox:Element) {
        const clickable = name in this.clickFuncs;
        const storageKey = this.optionMappingToStorage.get(name);
        if (checkbox && storageKey) {
            const storageVal = UserConfig.get(storageKey);
            const onStorageChanged:(val:string)=>void = (storageVal) => {
                if (storageVal) {
                    $(checkbox).attr('checked', storageVal);
                    $(element).data("checked", storageVal);
                    if (clickable) this.clickFuncs[name](storageVal);
                } else if (storageVal != undefined) {
                    $(checkbox).removeAttr('checked');
                    $(element).data("checked", false);
                    if (clickable) this.clickFuncs[name](storageVal);
                }
                if (storageVal != undefined) console.log(`${name} set to ${storageVal}`);
            };
            onStorageChanged(storageVal);
            UserConfig.onSet(storageKey, onStorageChanged);
            $(checkbox).change((event: JQueryEventObject) => {
                UserConfig.set(storageKey, (<any>event.target).checked);
                if (clickable) this.clickFuncs[name]((<any>event.target).checked);
            });
        } else if (storageKey) {
            if (clickable) this.clickFuncs[name](UserConfig.get(storageKey));
        }
        if (clickable) {
            console.log(`Attaching menu item ${name}`);
            let x = $(element);
            $(element).click((event: JQueryEventObject) => {
                if (!event.target || event.target.tagName != "LI") return;
                if (!checkbox && storageKey) {
                    UserConfig.set(storageKey, name);
                    this.clickFuncs[name](name);
                } else {
                    this.clickFuncs[name]($(element).data("checked"));
                }
            });
        };
    }

    constructor(
        private aliasEditor: AliasEditor,
        private triggerEditor: TriggerEditor,
        private jsScriptWin: JsScriptWin,
        private aboutWin: AboutWin,
        ) 
    {
        <JQuery>((<any>$("#menuBar")).jqxMenu());
        this.makeClickFuncs();

        $("[data-option-name]").each((i, e) => {
            const name = $(e).data("option-name");
            const chk = $(e).find("input[type='checkbox']")[0];
            this.attachMenuOption(name, e, chk);
        });
    }

    private makeClickFuncs() {
        this.clickFuncs["connect"] = (val) => {
            if (val) {
                this.EvtDisconnectClicked.fire();
            }
            else {
                this.EvtConnectClicked.fire();
            }
        };

        this.clickFuncs["wrap-lines"] = (val) => {
            if (!val) {
                $("#winOutput").addClass("output-prewrap");
            } else {
                $("#winOutput").removeClass("output-prewrap");
            }
        };

        var removeFontSizes = () => {
            $("#winOutput").removeClass("extra-small-text");
            $("#winOutput").removeClass("small-text");
            $("#winOutput").removeClass("normal-text");
            $("#winOutput").removeClass("large-text");
            $("#winOutput").removeClass("extra-large-text");
        };

        var removeFonts = () => {
            $("#winOutput").removeClass("courier");
            $("#winOutput").removeClass("consolas");
            $("#winOutput").removeClass("monospace");
        };

        this.clickFuncs["enable-color"] = (val) => {
            if (val) {
                this.EvtChangeDefaultColor.fire(["white", "low"]);
                this.EvtChangeDefaultBgColor.fire(["black", "low"]);
            }
        }

        this.clickFuncs["courier"] = (val) => {
            if (val == "courier") {
                removeFonts();
                $("#winOutput").addClass("courier");
            }
        };

        this.clickFuncs["consolas"] = (val) => {
            if (val == "consolas") {
                removeFonts();
                $("#winOutput").addClass("consolas");
            }
        };

        this.clickFuncs["monospace"] = (val) => {
            if (val == "monospace") {
                removeFonts();
                $("#winOutput").addClass("monospace");
            }
        };

        this.clickFuncs["extra-small-font"] = (val) => {
            if (val == "extra-small-font") {
                removeFontSizes();
                $("#winOutput").addClass("extra-small-text");
            }
        };

        this.clickFuncs["small-font"] = (val) => {
            if (val == "small-font") {
                removeFontSizes();
                $("#winOutput").addClass("small-text");
            }
        };

        this.clickFuncs["normal-font"] = (val) => {
            if (val == "normal-font") {
                removeFontSizes();
                $("#winOutput").addClass("normal-text");
            }
        };

        this.clickFuncs["large-font"] = (val) => {
            if (val == "large-font") {
                removeFontSizes();
                $("#winOutput").addClass("large-text");
            }
        };

        this.clickFuncs["extra-large-font"] = (val) => {
            if (val == "extra-large-font") {
                removeFontSizes();
                $("#winOutput").addClass("extra-large-text");
            }
        };

        this.clickFuncs["aliases"] = (val) => {
            this.aliasEditor.show();
        };

        this.clickFuncs["triggers"] = (val) => {
            this.triggerEditor.show();
        };

        this.clickFuncs["colorsEnabled"] = (val) => {
            if (val) {
                UserConfig.set("text-color", undefined);
            }
        };

        this.clickFuncs["green-on-black"] = (val) => {
            if (val == "green-on-black") {
                this.EvtChangeDefaultColor.fire(["green", "low"]);
                this.EvtChangeDefaultBgColor.fire(["black", "low"]);
            }
        };

        this.clickFuncs["white-on-black"] = (val) => {
            if (val == "white-on-black") {
                this.EvtChangeDefaultColor.fire(["white", "low"]);
                this.EvtChangeDefaultBgColor.fire(["black", "low"]);
            }
        };

        this.clickFuncs["black-on-gray"] = (val) => {
            if (val == "black-on-gray") {
                this.EvtChangeDefaultColor.fire(["black", "low"]);
                this.EvtChangeDefaultBgColor.fire(["white", "low"]);
            }
        };

        this.clickFuncs["black-on-white"] = (val) => {
            if (val == "black-on-white") {
                this.EvtChangeDefaultColor.fire(["black", "low"]);
                this.EvtChangeDefaultBgColor.fire(["white", "high"]);
            }
        };

        this.clickFuncs["script"] = (val) => {
            this.jsScriptWin.show();
        };

        this.clickFuncs["about"] = (val) => {
            this.aboutWin.show();
        };

        this.clickFuncs["contact"] = (val) => {
            this.EvtContactClicked.fire(null);
        };
    }

    handleTelnetConnect() {
        $("#menuBar-conn-disconn").text("Disconnetti");
        $("#menuBar-conn-disconn").data("checked", true);
    }

    handleTelnetDisconnect() {
        $("#menuBar-conn-disconn").text("Connetti");
        $("#menuBar-conn-disconn").data("checked", false);
    }
}
