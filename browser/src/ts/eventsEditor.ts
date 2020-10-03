import * as Util from "./util";
import { JsScript, ScriptEvent, ScripEventTypes, ScriptEventsIta } from "./jsScript";
import { messagebox } from "./messagebox";
declare let CodeMirror: any;

export class EventsEditor {
    protected $win: JQuery;

    protected $listBox: JQuery;
    protected $type: JQuery;
    protected $condition: JQuery;
    protected $value: JQuery;
    protected $id: JQuery;
    protected $className: JQuery;
    protected $enabled: JQuery;
    protected $newButton: JQuery;
    protected $deleteButton: JQuery;
    protected $mainSplit: JQuery;
    protected $saveButton: JQuery;
    protected $cancelButton: JQuery;
    $filter: JQuery;
    list: string[];
    values:ScriptEvent[];
    prev: ScriptEvent;
    codeMirror: any;
    $codeMirrorWrapper: JQuery;
    $dummy: JQuery;

    /* these need to be overridden */
    protected getList(): Array<string> {
        this.list = this.script.getEvents().map(v=> v.id || (v.type + " (" + v.condition + ")"));
        return this.list;
    }

    protected getItem(ind: number): ScriptEvent {
        return this.values[ind];
    }

    protected saveItem(ev: ScriptEvent): void {
        if (this.prev) {
            this.script.delEvent(this.prev);
        }
        this.script.addEvent(ev);
        this.script.save();
    }
    protected deleteItem(ev: ScriptEvent): void {
        this.script.delEvent(ev);
        this.script.save();
    }

    protected Filter(str:string) {
        $("li", this.$listBox).each((i,e) => {
            const visible = !str || $(e).text().match(new RegExp(str, 'gi')) != null;
            if (visible) {
                $(e).show();
            }
            else {
                $(e).hide();
            }
        })
    }

    constructor(private script:JsScript) {
        const title: string = "Eventi";
        let myDiv = document.createElement("div");
        myDiv.style.display = "none";
        document.body.appendChild(myDiv);
        this.$win = $(myDiv);
        myDiv.innerHTML = `
        <!--header-->
        <div>${title}</div>
        <!--content-->
        <div>
            <div class="winEvents-mainSplit">
                <!--left panel-->
                <div class="left-pane">
                    <div class="buttons">
                        <label class="filter-label">Filtra:</label>
                        <input class="winEvents-filter" type="text" placeholder="<filtro>"/>
                    </div>
                    <div class="list">
                        <ul size="2" class="winEvents-listBox select" style="height: 100%;box-sizing: border-box;"></ul>
                    </div>
                    <div class="buttons">
                        <button title="Crea nuovo" class="winEvents-btnNew greenbutton">Aggiungi</button>
                        <button title="Elimina selezionato" class="winEvents-btnDelete redbutton">Elimina</button>
                    </div>
                </div>
                <!--right panel-->
                <div class="right-pane">
                    <div class="pane-header">
                        <div class="pane-optional">
                            <!--<label>Tipo: <input style="margin:3px;" type="text" class="winEvents-type fill-width" disabled></label>-->
                            <div class="select-box">
                                <div class="inner-box">       
                                <label for="win-events" class="label select-box1"><span class="label-desc"></span> </label>
                                <select id="win-events" size=1" class="dropdown winEvents-type"></select>
                                </div>
                            </div>
                            <label>Condizione: <input style="margin:3px;" type="text" class="winEvents-condition fill-width" disabled placeholder="(condizione)" title="La condizione richiesta affinche l'evento scatti (dipende dal tipo evento)."></label>
                            <label>ID: <input type="text" style="width:150px;margin:3px;" class="winEvents-id" disabled placeholder="(opzionale)" title="L'ID per riferire in script."></label>
                            <label>Classe: <input type="text" style="width:150px;margin:3px;" class="winEvents-className" disabled placeholder="(opzionale)" title="Se appartiene a una classe specifica"></label>
                        </div>
                        <div class="pane-options">
                            <label>
                                Abilitato
                                <input type="checkbox" title="Se disabilitato non scatta" class="winEvents-chkEnabled" disabled />
                            </label>
                        </div>
                    </div>
                    <div class="pane-content-title">
                        <span>Azioni:</span>
                    </div>
                    <div class="pane-content">
                        <textarea class="winEvents-dummy" style="width: 100%;height: 100%;" disabled></textarea>
                        <textarea class="winEvents-scriptArea" disabled></textarea>
                    </div>               
                    <div class="pane-footer">
                        <button class="winEvents-btnSave bluebutton" disabled>Salva</button>
                        <button class="winEvents-btnCancel" disabled>Annulla</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        $(document).mouseup(function (e)
        {
            var container = $(".select-box");

            if (container.has(e.target).length === 0)
            {
                container.removeClass("open");
            }
        });


        $("select", this.$win).on("click" , function() {
  
            $(this).parent(".select-box").toggleClass("open");
            
          });

        $("select", this.$win).on("change" , function() {
  
            var selection = $(this).find("option:selected").text(),
                labelFor = $(this).attr("id"),
                label = $("[for='" + labelFor + "']");
              
            label.find(".label-desc").html(selection);
              
          });

          $("select", this.$win).on("focus" , function() {
            $(this).parent().addClass("focused");  
          });

          $("select", this.$win).on("blur" , function() {
            $(this).parent().removeClass("focused");              
          });

        this.$mainSplit = $(myDiv.getElementsByClassName("winEvents-mainSplit")[0]);
        this.$newButton = $(myDiv.getElementsByClassName("winEvents-btnNew")[0]);
        this.$deleteButton = $(myDiv.getElementsByClassName("winEvents-btnDelete")[0]);
        this.$listBox = $(myDiv.getElementsByClassName("winEvents-listBox")[0]);
        this.$type = $(myDiv.getElementsByClassName("winEvents-type")[0]);
        this.$value = $(myDiv.getElementsByClassName("winEvents-scriptArea")[0]);
        this.$dummy = $(myDiv.getElementsByClassName("winEvents-dummy")[0]);
        this.$condition = $(myDiv.getElementsByClassName("winEvents-condition")[0]);
        this.$id = $(myDiv.getElementsByClassName("winEvents-id")[0]);
        this.$enabled = $(myDiv.getElementsByClassName("winEvents-chkEnabled")[0]);
        this.$className = $(myDiv.getElementsByClassName("winEvents-className")[0]);
        this.$saveButton = $(myDiv.getElementsByClassName("winEvents-btnSave")[0]);
        this.$cancelButton = $(myDiv.getElementsByClassName("winEvents-btnCancel")[0]);
        this.$filter = $(myDiv.getElementsByClassName("winEvents-filter")[0]);
        this.$filter.keyup((e)=> {
            this.Filter($(e.target).val());
        });

        const win_w = $(window).innerWidth()-20;
        const win_h = $(window).innerHeight()-20;

        (<any>this.$win).jqxWindow({width: Math.min(600, win_w), height: Math.min(500, win_h), showCollapseButton: true});

        (<any>this.$mainSplit).jqxSplitter({
            width: "100%",
            height: "100%",
            orientation: "vertical",
            panels: [{size: "25%"}, {size: "75%"}]
        });

        this.codeMirror = CodeMirror.fromTextArea(
            this.$value[0], {
                mode: {name: "javascript", globalVars: true},
                theme: "neat",
                autoRefresh: true, // https://github.com/codemirror/CodeMirror/issues/3098
                matchBrackets: true,
                lineNumbers: true,
                extraKeys: {"Ctrl-Space": "autocomplete"},
            }
        );
        Util.addIntellisense(this.codeMirror);
        this.$codeMirrorWrapper = $(this.codeMirror.getWrapperElement());
        this.$codeMirrorWrapper.height("100%");
        

        this.$listBox.click(this.itemClick.bind(this));
        this.$newButton.click(this.handleNewButtonClick.bind(this));
        this.$deleteButton.click(this.handleDeleteButtonClick.bind(this));
        this.$saveButton.click(this.handleSaveButtonClick.bind(this));
        this.$cancelButton.click(this.handleCancelButtonClick.bind(this));
        this.load(null);
        this.setEditorDisabled(true);

    }

    private load(val:string) {
        this.$type.empty();
        let base = $(`<option value="">[seleziona tipo evento]</option>`);
        this.$type.append(base);

        for (const enumMember in ScripEventTypes) {
            var isValueProperty = parseInt(enumMember, 10) >= 0
            if (isValueProperty) {
                let enumStr = ScripEventTypes[enumMember];
                $(this.$type).append(`<option value="${ScripEventTypes[enumMember]}" ${enumStr==this.$type.val()}>${ScriptEventsIta.nameof(enumMember)}</option>`);
            }
        }

        this.$type.change();
    }

    private itemClick(e:MouseEvent) {
        var item = $(e.target);
        if (item.is("li")) {
            item.addClass('selected');
            item.siblings().removeClass('selected');
            const index = item.parent().children().index(item);
            this.$listBox.data("selectedIndex", index);
        } else {
            item.children().removeClass('selected');
            this.$listBox.data("selectedIndex", -1);
        }
        this.handleListBoxChange();
    }

    private setEditorDisabled(state: boolean): void {
        this.$type.prop("disabled", state);
        this.$value.prop("disabled", state);
        this.$id.prop("disabled", state);
        this.$condition.prop("disabled", state);
        this.$enabled.prop("disabled", state).change();
        this.$className.prop("disabled", state);
        this.$saveButton.prop("disabled", state);
        this.$cancelButton.prop("disabled", state);
        this.$codeMirrorWrapper.prop("disabled", state);
        if (state) {
            this.$dummy.show();
            this.$codeMirrorWrapper.hide();
        } else {
            this.$dummy.hide();
            this.$codeMirrorWrapper.show();
        }
    }

    private selectNone(): void {
        this.$listBox.data("selectedIndex", -1);
        this.$listBox.children().removeClass('selected');
    }

    private clearEditor(): void {
        this.$type.val("");
        this.load("");
        this.$value.val("");
        this.$type.change();
        this.$type.trigger("change");
        this.codeMirror.setValue("");
        this.$id.val("");
        this.$condition.val("");
        this.$enabled.prop("checked", true);
        this.$className.val("");
    }

    private updateListBox() {
        this.list = this.getList();
        this.values = this.script.getEvents();
        let html = "";
        for (let i = 0; i < this.list.length; i++) {
            html += "<li>" + Util.rawToHtml(this.list[i]) + "</option>";
        }
        this.$listBox.html(html);
    };

    private handleSaveButtonClick() {
        let ind = this.$listBox.data("selectedIndex");
        let v:ScriptEvent;

        if (!this.$type.val()) {
            messagebox("Errore", "Devi selezionare il tipo evento!", () =>{}, "OK", "", 200, null);
            return;
        }

        this.$value.val(this.codeMirror.getValue());
        if (!this.$value.val()) {
            messagebox("Errore", "Devi dare la script per l'evento!", () =>{}, "OK", "", 200, null);
            return;
        }

        if (ind == -1) {
            v = { type: null, condition: null, id: null, value: null, class: null, enabled: false};
        } else {
            v = this.getItem(ind);
        }

        v.type = this.$type.val();
        v.condition = this.$condition.val();
        v.id = this.$id.val();
        v.value = this.codeMirror.getValue() || this.$value.val();
        v.enabled = this.$enabled.is(":checked");
        v.class = this.$className.val();
        v.script = null;
        this.saveItem(v);

        this.selectNone();
        this.clearEditor();
        this.setEditorDisabled(true);
        this.updateListBox();
    }

    private handleCancelButtonClick() {
        this.clearEditor();
        this.selectNone();
        this.setEditorDisabled(true);
    }

    private handleNewButtonClick() {
        this.clearEditor();
        this.setEditorDisabled(false);
        this.selectNone();
    }

    private handleDeleteButtonClick() {
        let ind = this.$listBox.data("selectedIndex");
        if (ind == undefined || ind < 0) return;

        this.deleteItem(this.getItem(ind));

        this.clearEditor();
        this.selectNone();
        this.setEditorDisabled(true);
        this.updateListBox();
    }

    private handleListBoxChange() {
        let ind = this.$listBox.data("selectedIndex");
        let item = this.getItem(ind);
        this.prev = item;

        if (!item) {
            this.clearEditor();
            this.setEditorDisabled(true);
            return;
        }
        this.setEditorDisabled(false);
        this.load(item.type);
        this.$type.val(item.type);
        this.$type.change();
        this.$type.trigger("change");
        this.$id.val(item.id);
        this.$className.val(item.class);
        this.$condition.val(item.condition);
        this.$enabled.prop("checked", item.enabled);
        this.$value.val(item.value);
        this.codeMirror.setValue(item.value);
        this.$codeMirrorWrapper.show();
        this.codeMirror.refresh();
    }

    public show() {
        this.clearEditor();
        this.setEditorDisabled(true);
        this.updateListBox();

        (<any>this.$win).jqxWindow("open");
        (<any>this.$win).jqxWindow("bringToFront");
    }
}
