import { EventHook } from "./event";

import { UserConfig } from "./userConfig";

import { AliasEditor } from "./aliasEditor";
import { TriggerEditor } from "./triggerEditor";
import { JsScriptWin } from "./jsScriptWin";
import { AboutWin } from "./aboutWin";
import { Mudslinger } from "./client";
import { ProfilesWindow } from "./profilesWindow";

export class MenuBar {
    public EvtChangeDefaultColor = new EventHook<[string, string]>();
    public EvtChangeDefaultBgColor = new EventHook<[string, string]>();
    public EvtContactClicked = new EventHook<void>();
    public EvtConnectClicked = new EventHook<void>();
    public EvtDisconnectClicked = new EventHook<void>();
    private clickFuncs: {[k: string]: (value:any) => void} = {};
    private optionMappingToStorage = new Map([
        ["connect", ""],
        ["use-profile", ""],
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
        ["smallest-font", "font-size"],
        ["extra-small-font", "font-size"],
        ["small-font", "font-size"],
        ["normal-font", "font-size"],
        ["large-font", "font-size"],
        ["extra-large-font", "font-size"],
        ["courier", "font"],
        ["consolas", "font"],
        ["monospace", "font"],
        ["lucida", "font"],
        ["reset-settings", ""],
        ["import-settings", ""],
        ["export-settings", ""],
        ["log-time", "logTime"],
        ["debug-scripts", "debugScripts"],
        ["about", ""],
        ["docs", ""],
        ["contact", ""],
        ["profiles", ""],
    ]); 

    private attachMenuOption(name:string, element:Element, checkbox:Element) {
        const clickable = name in this.clickFuncs;
        const storageKey = this.optionMappingToStorage.get(name);
        if (checkbox && storageKey) {
            const storageVal = this.config.get(storageKey);
            const onStorageChanged:(val:string)=>void = (storageVal) => {
                if (storageVal) {
                    $(checkbox).attr('checked', storageVal);
                    $(checkbox).prop('checked', storageVal);
                    $(element)[0].setAttribute("data-checked", storageVal);
                    if (clickable) this.clickFuncs[name](storageVal);
                } else if (storageVal != undefined) {
                    $(checkbox).removeAttr('checked');
                    $(checkbox).prop('checked', storageVal);
                    $(element)[0].setAttribute("data-checked", "false");
                    if (clickable) this.clickFuncs[name](storageVal);
                }
                if (storageVal != undefined) console.log(`${name} set to ${storageVal}`);
            };
            onStorageChanged(storageVal);
            this.config.onSet(storageKey, onStorageChanged);
            $(checkbox).change((event: JQueryEventObject) => {
                this.config.set(storageKey, (<any>event.target).checked);
                if (clickable) this.clickFuncs[name]((<any>event.target).checked);
            });
        } else if (storageKey) {
            if (clickable) this.clickFuncs[name](this.config.get(storageKey));
        }
        if (clickable) {
            console.log(`Attaching menu item ${name}`);
            let x = $(element);
            $(element).click((event: JQueryEventObject) => {
                if (!event.target || event.target.tagName != "LI") return;
                if (!checkbox && storageKey) {
                    this.config.set(storageKey, name);
                    this.clickFuncs[name](name);
                } else {
                    this.clickFuncs[name]($(element)[0].getAttribute("data-checked"));
                }
            });
        };
    }

    private detachMenuOption(name:string, element:Element, checkbox:Element) {
        if (element) $(element).off("click");
        const storageKey = this.optionMappingToStorage.get(name);
        if (storageKey) this.config.onSet(storageKey, null);
        if (checkbox) $(checkbox).off("change");
    }

    private attachMenu() {
        $("[data-option-name]").each((i, e) => {
            const name = $(e)[0].getAttribute("data-option-name");
            const chk = $(e).find("input[type='checkbox']")[0];
            this.attachMenuOption(name, e, chk);
        });
    }

    private detachMenu() {
        $("[data-option-name]").each((i, e) => {
            const name = $(e)[0].getAttribute("data-option-name");
            const chk = $(e).find("input[type='checkbox']")[0];
            this.detachMenuOption(name, e, chk);
        });
    }

    constructor(
        private aliasEditor: AliasEditor,
        private triggerEditor: TriggerEditor,
        private jsScriptWin: JsScriptWin,
        private aboutWin: AboutWin,
        private profileWin: ProfilesWindow,
        private config: UserConfig
        ) 
    {
        <JQuery>((<any>$("#menuBar")).jqxMenu());
        this.makeClickFuncs();
        setTimeout(() => {
        this.attachMenu();
        this.handleNewConfig();
        }, 0);
    }

    public setConfig(newConfig:UserConfig) {
        if (this.config) {
            this.detachMenu();
            this.config.evtConfigImport.release(this.onImport);
        }
        this.config = newConfig;
        this.handleNewConfig();
        this.attachMenu();
    }

    private onImport = ()=> {
        this.detachMenu();
        this.attachMenu();
    }

    private handleNewConfig() {
        this.config.evtConfigImport.handle(this.onImport);
    }

    private isTrue(v:any):boolean {
        if (typeof v == "boolean") return v;
        if (typeof v == "string") return v == "true";
        return false;
    }

    private makeClickFuncs() {
        this.clickFuncs["connect"] = (val) => {
            if (this.isTrue(val)) {
                this.EvtDisconnectClicked.fire();
            }
            else {
                this.EvtConnectClicked.fire();
            }
        };

        this.clickFuncs["reset-settings"] = (val) => {
            this.config.remove(new RegExp("^(?!alias)(?!trigger)"), () => {Mudslinger.setDefaults(this.config)});
            location.reload();
        };

        this.clickFuncs["export-settings"] = () => {
            this.config.exportToFile();
        };

        this.clickFuncs["import-settings"] = () => {
            this.config.importFromFile();
        };

        this.clickFuncs["wrap-lines"] = (val) => {
            if (!this.isTrue(val)) {
                $("#winOutput").addClass("output-prewrap");
            } else {
                $("#winOutput").removeClass("output-prewrap");
            }
        };

        var removeFontSizes = () => {
            $("#winOutput").removeClass("smalles-text");
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
            $("#winOutput").removeClass("lucida");
        };

        this.clickFuncs["enable-color"] = (val) => {
            if (this.isTrue(val)) {
                this.EvtChangeDefaultColor.fire(["white", "low"]);
                this.EvtChangeDefaultBgColor.fire(["black", "low"]);
            }
        }

        this.clickFuncs["use-profile"] = (val) => {
            this.profileWin.show();
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

        this.clickFuncs["lucida"] = (val) => {
            if (val == "lucida") {
                removeFonts();
                $("#winOutput").addClass("lucida");
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

        this.clickFuncs["smallest-font"] = (val) => {
            if (val == "smallest-font") {
                removeFontSizes();
                $("#winOutput").addClass("smallest-text");
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
            if (this.isTrue(val)) {
                this.config.set("text-color", undefined);
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
        $("#menuBar-conn-disconn")[0].setAttribute("data-checked", "true");
    }

    handleTelnetDisconnect() {
        $("#menuBar-conn-disconn").text("Connetti");
        $("#menuBar-conn-disconn")[0].setAttribute("data-checked", "false");
    }
}
