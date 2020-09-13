import { OutWinBase, ConfigIf } from "./outWinBase";
import * as Util from "./util";

export class OutputWin extends OutWinBase {
    constructor(config: ConfigIf) {
        super($("#winOutput"), config);

        $(document).ready(() => {
            window.onerror = this.handleWindowError.bind(this);
        });
    }

    handleScriptPrint(data: string) {
        let message = data;
        let output = JSON.stringify(message);
        this.$target.append(
            "<span style=\"color:orange\">"
            + Util.rawToHtml(output)
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    handleSendCommand(cmd: string) {
        this.$target.append(
            "<span style=\"color:yellow\">"
            + Util.rawToHtml(cmd)
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    handleScriptSendCommand(cmd: string) {
        this.$target.append(
            "<span style=\"color:cyan\">"
            + Util.rawToHtml(cmd)
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    handleTriggerSendCommands(data: string[]) {
        let html = "<span style=\"color:cyan\">";

        for (let i = 0; i < data.length; i++) {
            if (i >= 5) {
                html += "...<br>";
                break;
            } else {
                html += Util.rawToHtml(data[i]) + "<br>";
            }
        }
        this.$target.append(html);
        this.scrollBottom(false);
    }

    handleAliasSendCommands(orig: string, cmds: string[]) {
        let html = "<span style=\"color:yellow\">";
        html += Util.rawToHtml(orig);
        html += "</span><span style=\"color:cyan\"> --> ";

        for (let i = 0; i < cmds.length; i++) {
            if (i >= 5) {
                html += "...<br>";
                break;
            } else {
                html += Util.rawToHtml(cmds[i]) + "<br>";
            }
        }

        this.$target.append(html);
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

        this.$target.append(elem);
        this.scrollBottom(true);
    }

    handleTelnetConnect(): void {
        if (this.connIntervalId) {
            clearInterval(this.connIntervalId);
            this.connIntervalId = null;
        }
        this.$target.append(
            "<br/><span style=\"color:cyan\">"
            + "[[Telnet connesso]]"
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    handleTelnetDisconnect() {
        if (this.connIntervalId) {
            clearInterval(this.connIntervalId);
            this.connIntervalId = null;
        }
        this.$target.append(
            "<br/><span style=\"color:cyan\">"
            + "[[Telnet disconnesso]]"
            + "<br>"
        + "</span>");
        this.scrollBottom(true);
    }

    handleWsConnect() {
        this.$target.append(
            "<br/><span style=\"color:cyan\">"
            + "[[Websocket connesso]]"
            + "<br>"
            + "</span>");
        this.scrollBottom(false);
    }

    handleWsDisconnect() {
        if (this.connIntervalId) {
            clearInterval(this.connIntervalId);
            this.connIntervalId = null;
        }
        this.$target.append(
            "<br/><span style=\"color:cyan\">"
            + "[[Websocket disconnesso]]"
            + "<br>"
            + "</span>");
        this.scrollBottom(false);
    }

    handleTelnetError(data: string) {
        this.$target.append(
            "<br/><span style=\"color:red\">"
            + "[[Telnet errore:" + "<br>"
            + data + "<br>"
            + "]]"
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    handleWsError() {
        this.$target.append(
            "<br/><span style=\"color:red\">"
            + "[[Websocket errore]]"
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    private handleWindowError(message: any, source: any, lineno: any, colno: any, error: any) {
        this.$target.append(
            "<br/><span style=\"color:red\">"
            + "[[Web Client Errore:<br>"
            + message + "<br>"
            + source + "<br>"
            + lineno + "<br>"
            + colno + "<br>"
            + "]]"
            + "<br>"
            + "</span>"
        );
        this.scrollBottom(true);
    }

    handleScriptEvalError(err: any) {
        let msg = Util.rawToHtml(err.toString());
        let stack = Util.rawToHtml(err.stack);

        this.$target.append(
            "<br/><span style=\"color:red\">"
            + "[[Errore evaluazione Script:<br>"
            + err.toString() + "<br>"
            + "<br>"
            + stack + "<br>"
            + "]]"
            + "<br>"
            + "</span>"
        );
        this.scrollBottom(true);
    }

    handleScriptError(err: any) {
        let msg = Util.rawToHtml(err.toString());
        let stack = Util.rawToHtml(err.stack);

        this.$target.append(
            "<br/><span style=\"color:red\">"
            + "[[Errore Script:<br>"
            + err.toString() + "<br>"
            + "<br>"
            + stack + "<br>"
            + "]]"
            + "<br>"
            + "</span>"
        );
        this.scrollBottom(true);
    }
}
