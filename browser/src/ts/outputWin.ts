import { OutWinBase, ConfigIf } from "./outWinBase";
import { TriggerManager } from "./triggerManager";
import * as Util from "./util";

export class OutputWin extends OutWinBase {
    constructor(config: ConfigIf, private triggerManager:TriggerManager) {
        super($("#winOutput"), config);

        $(document).ready(() => {
            window.onerror = this.handleWindowError.bind(this);
        });

        triggerManager.EvtEmitTriggerOutputChanged.handle((data)=> {
            this.outputChanged([data.line, data.buffer]);
        });
    }

    handleScriptPrint(owner:string, data: string) {
        this.append(
            "<span style=\"color:orange\">" /*+ owner + ": "*/
            + Util.rawToHtml(data)
            + "<br>"
            + "</span>", true);
        this.scrollBottom(true);
    }

    handleSendCommand(cmd: string) {
        this.append(
            "<span style=\"color:yellow\">"
            + Util.rawToHtml(cmd)
            + "<br>"
            + "</span>", true);
        this.scrollBottom(true);
    }

    handleScriptSendCommand(owner:string, cmd: string) {
        if (!this.debugScripts) return;
        this.append(
            "<span style=\"color:cyan\">[" + owner /*": "
            + Util.rawToHtml(cmd)*/
            + "]<br>"
            + "</span>", true);
        this.scrollBottom(true);
    }

    handleTriggerSendCommands(orig:string, cmds:string[]) {
        if (!this.debugScripts) return;
        let html = "<span style=\"color:magenta\">[" + orig + "]<br></span>";

        /*for (let i = 0; i < data.length; i++) {
            if (i >= 5) {
                html += "...<br>";
                break;
            } else {
                html += Util.rawToHtml(data[i]) + "<br>";
            }
        }*/
        this.append(html, true);
        this.scrollBottom(false);
    }

    handleAliasSendCommands(orig: string, cmds: string[]) {
        if (!this.debugScripts) return;
        let html = "<span style=\"color:cyan\">[" + orig+ "]<br></span>";
        /*html += Util.rawToHtml(orig);
        html += "</span><span style=\"color:cyan\"> --> ";

        for (let i = 0; i < cmds.length; i++) {
            if (i >= 5) {
                html += "...<br>";
                break;
            } else {
                html += Util.rawToHtml(cmds[i]) + "<br>";
            }
        }
        */
        this.append(html, true);
        this.scrollBottom(true);
    }

    private connIntervalId: number = null;

    handleTelnetTryConnect(host: string, port: number): void {
        if (this.connIntervalId) {
            clearInterval(this.connIntervalId);
            this.connIntervalId = null;
        }

        let elem = document.createElement("span");
        if (host && port) {
            elem.innerHTML = "<br/><span style='color:cyan'>"
                + "[[Connesione telnet a " + host + ":" + port.toString()
                + "<span class='conn-dots'></span>"
                + "]]<br>";
        }
        else {
            elem.innerHTML = "<br/><span style='color:cyan'>"
                + "[[Connessione telnet "
                + "<span class='conn-dots'></span>"
                + "]]<br>";
        }

        let dots = elem.getElementsByClassName('conn-dots')[0] as HTMLSpanElement;

        this.connIntervalId = setInterval(() => dots.textContent += '.', 1000);

        this.append(elem, true);
        this.scrollBottom(true);
    }

    handleTelnetConnect(): void {
        if (this.connIntervalId) {
            clearInterval(this.connIntervalId);
            this.connIntervalId = null;
        }
        this.append(
            "<br/><span style=\"color:cyan\">"
            + "[[Telnet connesso]]"
            + "<br>"
            + "</span>", true);
        this.scrollBottom(true);
    }

    handleTelnetDisconnect() {
        if (this.connIntervalId) {
            clearInterval(this.connIntervalId);
            this.connIntervalId = null;
        }
        this.append(
            "<br/><span style=\"color:cyan\">"
            + "[[Telnet disconnesso]]"
            + "<br>"
        + "</span>", true);
        this.scrollBottom(true);
    }

    handleWsConnect() {
        this.append(
            "<br/><span style=\"color:cyan\">"
            + "[[Websocket connesso]]"
            + "<br>"
            + "</span>", true);
        this.scrollBottom(false);
    }

    handleWsDisconnect() {
        if (this.connIntervalId) {
            clearInterval(this.connIntervalId);
            this.connIntervalId = null;
        }
        this.append(
            "<br/><span style=\"color:cyan\">"
            + "[[Websocket disconnesso]]"
            + "<br>"
            + "</span>", true);
        this.scrollBottom(false);
    }

    handleTelnetError(data: string) {
        this.append(
            "<br/><span style=\"color:red\">"
            + "[[Telnet errore:" + "<br>"
            + data + "<br>"
            + "]]"
            + "<br>"
            + "</span>", true);
        this.scrollBottom(true);
    }

    handleWsError() {
        this.append(
            "<br/><span style=\"color:red\">"
            + "[[Websocket errore]]"
            + "<br>"
            + "</span>", true);
        this.scrollBottom(true);
    }

    private handleWindowError(message: any, source: any, lineno: any, colno: any, error: any) {
        this.append(
            "<br/><span style=\"color:red\">"
            + "[[Web Client Errore:<br>"
            + message + "<br>"
            + source + "<br>"
            + lineno + "<br>"
            + colno + "<br>"
            + "]]"
            + "<br>"
            + "</span>", true
        );
        this.scrollBottom(true);
    }

    handleScriptEvalError(err: any) {
        let msg = Util.rawToHtml(err.toString());
        let stack = Util.rawToHtml(err.stack);

        this.append(
            "<br/><span style=\"color:red\">"
            + "[[Errore evaluazione Script:<br>"
            + err.toString() + "<br>"
            + "<br>"
            + stack + "<br>"
            + "]]"
            + "<br>"
            + "</span>", true
        );
        this.scrollBottom(true);
    }

    handleScriptError(err: any) {
        let msg = Util.rawToHtml(err.toString());
        let stack = Util.rawToHtml(err.stack);

        this.append(
            "<br/><span style=\"color:red\">"
            + "[[Errore Script:<br>"
            + err.toString() + "<br>"
            + "<br>"
            + stack + "<br>"
            + "]]"
            + "<br>"
            + "</span>", true
        );
        this.scrollBottom(true);
    }
}
