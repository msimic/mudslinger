import { getUrlParameter } from "./util";

import { UserConfig } from "./userConfig";
import { AppInfo } from "./appInfo";

import { AliasEditor } from "./aliasEditor";
import { AliasManager } from "./aliasManager";
import { CommandInput } from "./commandInput";
import { JsScript, EvtScriptEmitCmd, EvtScriptEmitPrint, EvtScriptEmitEvalError } from "./jsScript";
import { JsScriptWin } from "./jsScriptWin";
import { MenuBar } from "./menuBar";

import { Mxp } from "./mxp";
import { OutputManager } from "./outputManager";
import { OutputWin } from "./outputWin";
import { Socket } from "./socket";
import { TriggerEditor } from "./triggerEditor";
import { TriggerManager } from "./triggerManager";
import { AboutWin } from "./aboutWin";
import { ConnectWin } from "./connectWin";
import { ContactWin } from "./contactWin";
import * as apiUtil from "./apiUtil";


declare let configClient: any;


export class Client {
    private aliasEditor: AliasEditor;
    private aliasManager: AliasManager;
    private commandInput: CommandInput;
    private jsScript: JsScript;
    private jsScriptWin: JsScriptWin;
    private menuBar: MenuBar;
    private mxp: Mxp;
    private outputManager: OutputManager;
    private outputWin: OutputWin;
    private socket: Socket;
    private triggerEditor: TriggerEditor;
    private triggerManager: TriggerManager;
    private aboutWin: AboutWin;
    private connectWin: ConnectWin;
    private contactWin: ContactWin;

    private serverEcho = false;

    constructor() {
        this.aboutWin = new AboutWin();
        this.jsScript = new JsScript();
        this.contactWin = new ContactWin();

        this.jsScriptWin = new JsScriptWin(this.jsScript);
        this.triggerManager = new TriggerManager(this.jsScript);
        this.aliasManager = new AliasManager(this.jsScript);

        this.commandInput = new CommandInput(this.aliasManager);

        this.outputWin = new OutputWin(this.triggerManager);

        this.aliasEditor = new AliasEditor(this.aliasManager);
        this.triggerEditor = new TriggerEditor(this.triggerManager);

        this.outputManager = new OutputManager(this.outputWin);

        this.mxp = new Mxp(this.outputManager);
        this.socket = new Socket(this.outputManager, this.mxp);
        this.connectWin = new ConnectWin(this.socket);
        this.menuBar = new MenuBar(this.socket, this.aliasEditor, this.triggerEditor, this.jsScriptWin, this.aboutWin, this.connectWin);

        // MenuBar events
        this.menuBar.EvtChangeDefaultColor.handle((data: [string, string]) => {
            this.outputManager.handleChangeDefaultColor(data[0], data[1]);
        });

        this.menuBar.EvtChangeDefaultBgColor.handle((data: [string, string]) => {
            this.outputManager.handleChangeDefaultBgColor(data[0], data[1]);
        });

        this.menuBar.EvtContactClicked.handle(() => {
            this.contactWin.show();
        });

        // Socket events
        this.socket.EvtServerEcho.handle((val: boolean) => {
            // Server echo ON means we should have local echo OFF
            this.serverEcho = val;
        });

        this.socket.EvtTelnetConnect.handle((val: [string, number]) => {
            this.serverEcho = false;
            this.menuBar.handleTelnetConnect();
            this.outputWin.handleTelnetConnect();
            apiUtil.clientInfo.telnetHost = val[0];
            apiUtil.clientInfo.telnetPort = val[1];

            apiUtil.apiPostClientConn();
        });

        this.socket.EvtTelnetDisconnect.handle(() => {
            this.menuBar.handleTelnetDisconnect();
            this.outputWin.handleTelnetDisconnect();
            apiUtil.clientInfo.telnetHost = null;
            apiUtil.clientInfo.telnetPort = null;
        });

        this.socket.EvtTelnetError.handle((data: string) => {
            this.outputWin.handleTelnetError(data);
        });

        this.socket.EvtMxpTag.handle((data: string) => {
            this.mxp.handleMxpTag(data);
        });

        this.socket.EvtWsError.handle((data) => {
            this.outputWin.handleWsError();
        });

        this.socket.EvtWsConnect.handle((val: {sid: string}) => {
            apiUtil.clientInfo.sid = val.sid;
            this.outputWin.handleWsConnect();
        });

        this.socket.EvtWsDisconnect.handle(() => {
            apiUtil.clientInfo.sid = null;
            this.menuBar.handleTelnetDisconnect();
            this.outputWin.handleWsDisconnect();
        });

        this.socket.EvtSetClientIp.handle((ip: string) => {
            apiUtil.clientInfo.clientIp = ip;
        });

        // CommandInput events
        this.commandInput.EvtEmitCmd.handle((data: string) => {
            if (true !== this.serverEcho) {
                this.outputWin.handleSendCommand(data);
            }
            this.socket.sendCmd(data);
        });

        this.commandInput.EvtEmitAliasCmds.handle((data) => {
            this.outputWin.handleAliasSendCommands(data.orig, data.commands)
            for (let cmd of data.commands) {
                this.socket.sendCmd(cmd);
            }
        });

        // Mxp events
        this.mxp.EvtEmitCmd.handle((data) => {
            if (data.noPrint !== true) {
                this.outputWin.handleSendCommand(data.value);
            }
            this.socket.sendCmd(data.value);

            // noPrint is used only for MXP <version>, which we don't want to track
            if (data.noPrint !== true) {
                apiUtil.apiPostMxpSend();
            }
        });

        // JsScript events
        EvtScriptEmitCmd.handle((data: string) => {
            this.outputWin.handleScriptSendCommand(data);
            this.socket.sendCmd(data);
        });

        EvtScriptEmitPrint.handle((data: string) => {
            this.outputWin.handleScriptPrint(data);
        });

        EvtScriptEmitEvalError.handle((data: {stack: any}) => {
            this.outputWin.handleScriptEvalError(data)
        });

        // TriggerManager events
        this.triggerManager.EvtEmitTriggerCmds.handle((data: string[]) => {
            this.outputWin.handleTriggerSendCommands(data);
            for (let cmd of data) {
                this.socket.sendCmd(cmd);
            }
        });

        // Prevent navigating away accidentally
        window.onbeforeunload = () => {
            return "";
        };

        this.socket.open();
    
        let hostParam: string = getUrlParameter("host");
        let portParam: string = getUrlParameter("port");

        if (hostParam !== undefined && portParam !== undefined)
        {
            let host = hostParam.trim();
            let port = Number(portParam);
            this.socket.openTelnet(host, port);

        } else {
            this.connectWin.show();
        }
    }

    public readonly UserConfig = UserConfig;
    public readonly AppInfo = AppInfo;
}
