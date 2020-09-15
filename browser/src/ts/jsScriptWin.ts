import {JsScript} from "./jsScript";

declare let CodeMirror: any;

export class JsScriptWin {
    private $win: JQuery;
    private codeMirror: any = null;
    private $runButton: JQuery;

    constructor(private jsScript: JsScript) {
        let win = document.createElement("div");
        win.style.display = "none";
        win.className = "winJsScript";
        document.body.appendChild(win);

        win.innerHTML = `
        <!--header-->
        <div>JAVASCRIPT SCRIPT</div>
        <!--content-->
        <div>
            <div class="right-pane">
                <div class="pane-header">
                    <span>Il codice della script da eseguire:</span>
                </div>                    
                <div class="pane-content">
                    <textarea class="winJsScript-code"></textarea>
                </div>
                <div class="pane-footer">
                    <button class="winJsScript-btnRun">ESEGUI SCRIPT</button>
                </div>
            </div>
        </div>
        `;

        this.$win = $(win);
        this.$runButton = $(win.getElementsByClassName("winJsScript-btnRun")[0]);
        const win_w = $(window).innerWidth()-20;
        const win_h = $(window).innerHeight()-20;

        (<any>this.$win).jqxWindow({width: Math.min(550, win_w), height: Math.min(400, win_h)});

        this.codeMirror = CodeMirror.fromTextArea(
            win.getElementsByClassName("winJsScript-code")[0], {
                mode: "javascript",
                theme: "neat",
                autoRefresh: true, // https://github.com/codemirror/CodeMirror/issues/3098
                matchBrackets: true,
                lineNumbers: true
            }
        );

        this.$runButton.click(this.handleRunButtonClick.bind(this));
    }

    private handleRunButtonClick() {
        let code_text = this.codeMirror.getValue();
        let script = this.jsScript.makeScript("Script", code_text, "");
        if (script) { script(); };
    }

    public show() {
        (<any>this.$win).jqxWindow("open");
        (<any>this.$win).jqxWindow("bringToFront");
    }
}
