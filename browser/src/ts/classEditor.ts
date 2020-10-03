import * as Util from "./util";
import { JsScript, Variable } from "./jsScript";
import { Class, ClassManager } from "./classManager";
import { messagebox } from "./messagebox";
declare let CodeMirror: any;

export class ClassEditor {
    protected $win: JQuery;

    protected $listBox: JQuery;
    protected $name: JQuery;
    protected $value: JQuery;
    protected $newButton: JQuery;
    protected $deleteButton: JQuery;
    protected $mainSplit: JQuery;
    protected $saveButton: JQuery;
    protected $cancelButton: JQuery;
    $filter: JQuery;
    list: string[];
    values:Class[];
    prevName: string;

    /* these need to be overridden */
    protected getList(): Array<string> {
        this.list = [...this.classManager.classes.keys()];
        return this.list;
    }

    protected getItem(ind: number): Class {
        return this.values[ind];
    }

    protected saveItem(cls: Class): void {
        if (this.prevName != cls.name && this.classManager.classes.has(this.prevName)) {
            this.classManager.Delete(this.prevName);
        }
        this.classManager.classes.set(cls.name, cls);
        this.classManager.saveClasses();
    }
    protected deleteItem(cls: Class): void {
        this.classManager.Delete(cls.name);
        this.classManager.saveClasses();
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

    constructor(private classManager:ClassManager) {
        const title: string = "Classi";
        let myDiv = document.createElement("div");
        myDiv.style.display = "none";
        document.body.appendChild(myDiv);
        this.$win = $(myDiv);
        myDiv.innerHTML = `
        <!--header-->
        <div>${title}</div>
        <!--content-->
        <div>
            <div class="winClass-mainSplit">
                <!--left panel-->
                <div class="left-pane">
                    <div class="buttons">
                        <label class="filter-label">Filtra:</label>
                        <input class="winClass-filter" type="text" placeholder="<filtro>"/>
                    </div>
                    <div class="list">
                        <ul size="2" class="winClass-listBox select"  style="height: 100%;box-sizing: border-box;"></ul>
                    </div>
                    <div class="buttons">
                        <button title="Crea nuova" class="winClass-btnNew greenbutton">Aggiungi</button>
                        <button title="Elimina selezionata" class="winClass-btnDelete redbutton">Elimina</button>
                    </div>
                </div>
                <!--right panel-->
                <div class="right-pane">
                    <div class="pane-header">
                        <div class="pane-optional">
                            <label>Nome: <input type="text" class="winClass-name fill-width" disabled></label>
                            <label>
                                Abilitata
                                <input type="checkbox" title="Se disabilitata trigger/alias nella classe sono disabilitati" class="winClass-chkEnabled" disabled />
                            </label>
                        </div>
                    </div>                    
                    <div class="pane-footer">
                        <button class="winClass-btnSave bluebutton" disabled>Salva</button>
                        <button class="winClass-btnCancel" disabled>Annulla</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        this.$mainSplit = $(myDiv.getElementsByClassName("winClass-mainSplit")[0]);
        this.$newButton = $(myDiv.getElementsByClassName("winClass-btnNew")[0]);
        this.$deleteButton = $(myDiv.getElementsByClassName("winClass-btnDelete")[0]);
        this.$listBox = $(myDiv.getElementsByClassName("winClass-listBox")[0]);
        this.$name = $(myDiv.getElementsByClassName("winClass-name")[0]);
        this.$value = $(myDiv.getElementsByClassName("winClass-chkEnabled")[0]);
        this.$saveButton = $(myDiv.getElementsByClassName("winClass-btnSave")[0]);
        this.$cancelButton = $(myDiv.getElementsByClassName("winClass-btnCancel")[0]);
        this.$filter = $(myDiv.getElementsByClassName("winClass-filter")[0]);
        this.$filter.keyup((e)=> {
            this.Filter($(e.target).val());
        });

        const win_w = $(window).innerWidth()-20;
        const win_h = $(window).innerHeight()-20;

        (<any>this.$win).jqxWindow({width: Math.min(400, win_w), height: Math.min(300, win_h), showCollapseButton: true});

        (<any>this.$mainSplit).jqxSplitter({
            width: "100%",
            height: "100%",
            orientation: "vertical",
            panels: [{size: "50%"}, {size: "50%"}]
        });

        this.$listBox.click(this.itemClick.bind(this));
        this.$newButton.click(this.handleNewButtonClick.bind(this));
        this.$deleteButton.click(this.handleDeleteButtonClick.bind(this));
        this.$saveButton.click(this.handleSaveButtonClick.bind(this));
        this.$cancelButton.click(this.handleCancelButtonClick.bind(this));

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
        this.$name.prop("disabled", state);
        this.$value.prop("disabled", state);
        this.$saveButton.prop("disabled", state);
        this.$cancelButton.prop("disabled", state);
    }

    private selectNone(): void {
        this.$listBox.data("selectedIndex", -1);
        this.$listBox.children().removeClass('selected');
    }

    private clearEditor(): void {
        this.$name.val("");
        this.$value.val("");
    }

    private updateListBox() {
        this.list = this.getList();
        this.values = [...this.classManager.classes.values()];
        let html = "";
        for (let i = 0; i < this.list.length; i++) {
            html += "<li>" + Util.rawToHtml(this.list[i]) + "</option>";
        }
        this.$listBox.html(html);
    };

    private handleSaveButtonClick() {
        let ind = this.$listBox.data("selectedIndex");
        let v:Class;

        if (!this.$name.val()) {
            messagebox("Errore", "La classe deve avere un nome!", () =>{}, "OK", "", 200, null);
            return;
        }

        if (ind == -1) {
            v = {name: null, enabled: false};
        } else {
            v = this.getItem(ind);
        }

        v.name = this.$name.val();
        v.enabled = this.$value.is(":checked");
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
        this.prevName = item.name;

        if (!item) {
            this.clearEditor();
            this.setEditorDisabled(true);
            return;
        }
        this.setEditorDisabled(false);
        this.$name.val(item.name);
        this.$value.prop("checked", item.enabled).trigger("change");
    }

    public show() {
        this.clearEditor();
        this.setEditorDisabled(true);
        this.updateListBox();

        (<any>this.$win).jqxWindow("open");
        (<any>this.$win).jqxWindow("bringToFront");
    }
}
