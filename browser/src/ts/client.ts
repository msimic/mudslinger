import { UserConfig } from "./userConfig";
import { AppInfo } from "./appInfo";

import { AliasEditor } from "./aliasEditor";
import { AliasManager } from "./aliasManager";
import { CommandInput } from "./commandInput";
import { JsScript, EvtScriptEmitCmd, EvtScriptEmitPrint, EvtScriptEmitEvalError, EvtScriptEmitError } from "./jsScript";
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
import { StatusWin } from "./statusWin";
import axios from 'axios';
import * as apiUtil from "./apiUtil";


interface ConnectionTarget {
    host: string,
    port: number
}

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

    constructor(private connectionTarget: ConnectionTarget) {
        this.aboutWin = new AboutWin();
        this.jsScript = new JsScript();
        this.contactWin = new ContactWin();

        this.jsScriptWin = new JsScriptWin(this.jsScript);
        this.triggerManager = new TriggerManager(
            this.jsScript, UserConfig);
        this.aliasManager = new AliasManager(
            this.jsScript, UserConfig);

        this.commandInput = new CommandInput(this.aliasManager);

        this.outputWin = new OutputWin(UserConfig);

        this.aliasEditor = new AliasEditor(this.aliasManager);
        this.triggerEditor = new TriggerEditor(this.triggerManager);

        this.outputManager = new OutputManager(this.outputWin, UserConfig);

        this.mxp = new Mxp(this.outputManager);
        this.socket = new Socket(this.outputManager, this.mxp);
        this.connectWin = new ConnectWin(this.socket);
        this.menuBar = new MenuBar(this.aliasEditor, this.triggerEditor, this.jsScriptWin, this.aboutWin);

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

        this.menuBar.EvtConnectClicked.handle(() => {
            if (this.connectionTarget) {
                this.socket.openTelnet(
                    this.connectionTarget.host,
                    this.connectionTarget.port
                );
            } else {
                this.connectWin.show();
            }
        });

        this.menuBar.EvtDisconnectClicked.handle(() => {
            this.socket.closeTelnet();
        });

        // Socket events
        this.socket.EvtServerEcho.handle((val: boolean) => {
            // Server echo ON means we should have local echo OFF
            this.serverEcho = val;
        });

        this.socket.EvtTelnetTryConnect.handle((val: [string, number]) => {
           this.outputWin.handleTelnetTryConnect(val[0], val[1]); 
        });

        var preventNavigate = (e:any) => {
            e.preventDefault();
            e.returnValue = "";
            return "";
        };

        this.socket.EvtTelnetConnect.handle((val: [string, number]) => {
            // Prevent navigating away accidentally
            window.addEventListener("beforeunload", preventNavigate);
            this.serverEcho = false;
            this.menuBar.handleTelnetConnect();
            this.outputWin.handleTelnetConnect();
            apiUtil.clientInfo.telnetHost = val[0];
            apiUtil.clientInfo.telnetPort = val[1];

            apiUtil.apiPostClientConn();
        });

        this.socket.EvtTelnetDisconnect.handle(() => {
            // allow navigating away
            window.removeEventListener("beforeunload", preventNavigate);
            this.menuBar.handleTelnetDisconnect();
            this.outputWin.handleTelnetDisconnect();
            apiUtil.clientInfo.telnetHost = null;
            apiUtil.clientInfo.telnetPort = null;
        });

        this.socket.EvtTelnetError.handle((data: string) => {
            this.outputWin.handleTelnetError(data);
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

        EvtScriptEmitError.handle((data: {stack: any}) => {
            this.outputWin.handleScriptError(data)
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

        // OutputWin events
        this.outputWin.EvtLine.handle((line: string) => {
            this.triggerManager.handleLine(line);
        });

        // OutputManager events
        this.outputManager.EvtNewLine.handle(() => {
            this.mxp.handleNewline();
        });

        this.outputManager.EvtMxpTag.handle((data: string) => {
            this.mxp.handleMxpTag(data);
        });

        this.socket.open().then((success) => {
            if (!success) { return; }
            
            if (this.connectionTarget) {
                this.socket.openTelnet(
                    this.connectionTarget.host,
                    this.connectionTarget.port);

            } else {
                this.connectWin.show();
            }
        });
    }

    public readonly UserConfig = UserConfig;
    public readonly AppInfo = AppInfo;
}

function profileConfigSave(profileId: string, val:string) {
    let statusWin = new StatusWin();
    statusWin.setContent('Saving profile...')
    statusWin.show();
    
    (async () => {
        try {
            await apiUtil.apiPostProfileConfig(profileId, val);
            statusWin.destroy();
        } catch(err) {
            // TODO: handle not logged in 
            statusWin.setContent('Could not save profile.\n\n' + err);
        }
    })();
}

function makeCbLocalConfigSave(): (val: string) => void {
    let localConfigAck = localStorage.getItem("localConfigAck");

    return (val: string) => {
        localStorage.setItem('userConfig', val);
        if (!localConfigAck) {
            let win = document.createElement('div');
            let profileMessage = `
                <p>
                    You can convert this to a permanent profile from the
                    <a target="_blank" href="/user/profiles">Profiles</a> page after
                    registering and logging in.
                </p>`;
            if (!apiUtil.enabled) {
                profileMessage = "";
            }
            win.innerHTML = `
                <!--header-->
                <div>INFO</div>
                <!--content-->
                <div>
                <p>
                    Your settings are being saved to the browser <b>localStorage</b>,
                    so won't be available when playing from other devices.
                </p>
                ${profileMessage}

                </div>
            `;
            (<any>$(win)).jqxWindow({
                closeButtonAction: 'close'
            });

            localConfigAck = "true";
            localStorage.setItem('localConfigAck', localConfigAck);
        }
    };
}

export namespace Mudslinger {
    export let client: Client;
    export async function GetLocalClientConfig() {
        let axinst = axios.create({
            validateStatus: (status) => {
                return status === 200;
            }
        });
        return axinst.get('./client.config.json');
    };

    function setDefault(key:string, value:any) {
        if (UserConfig.get(key) == undefined) {
            UserConfig.set(key, value);
        }
    }

    function setDefaults() {
        setDefault("text-color", "green-on-black");
        setDefault("colorsEnabled", true);
        setDefault("wrap-lines", true);
        setDefault("utf8Enabled", false);
        setDefault("mxpEnabled", true);
        setDefault("enable-aliases", true);
        setDefault("enable-triggers", true);
        setDefault("font-size", "small");
        setDefault("font", "Courier");
    }

    export function runClient(connectionTarget: ConnectionTarget, profile:any) {
        client = new Client(connectionTarget);
        setDefaults();
        document.title = client.AppInfo.AppTitle;
        if (profile) {
            document.title += ` - ${profile.name}`;
        }
    }

    export async function init() {
        let connectionTarget: ConnectionTarget;
        let params = new URLSearchParams(location.search);
        let profileId = params.get('profile');
        let profile: any;
        if (profileId) {
            let statusWin = new StatusWin();
            statusWin.setContent('Loading profile...')
            statusWin.show();
            try {
                let resp = await apiUtil.apiGetProfile(profileId);
                profile = resp.data;
                statusWin.destroy();
            } catch(err) {
                if (err.response.status == 403) {
                    statusWin.setContent(
                        'Must log in.' +
                        '<br>' +
                        '<br>' +
                        '<a href="/auth/login">CLICK HERE TO LOG IN</a>');
                } else {
                    statusWin.setContent('Could not load profile.\n\n' + err);
                }
                return;
            }
            connectionTarget = {
                host: profile.host.trim(),
                port: profile.port
            }
        }
        
        if (!profile && params.has('host') && params.has('port')) {
            connectionTarget = {
                host: params.get('host').trim(),
                port: Number(params.get('port').trim())
            }
        }
        else if (!profile && params.has('host') && params.get('host').trim()=="auto") {
            connectionTarget = {
                host: null,
                port: 0
            }
        }

        if (profile) {
            UserConfig.init(profile.config, (val: string): void => {
                profileConfigSave(profileId, val)
            });
        } else {
            UserConfig.init(localStorage.getItem("userConfig"), makeCbLocalConfigSave());
        }

        
        GetLocalClientConfig().then(resp => {
            if (resp && resp.data) {
                const cfg = resp.data;
                if (cfg.apiBaseUrl) {
                    // enable api and override base url
                    apiUtil.setApiBaseUrl(cfg.apiBaseUrl);
                    apiUtil.setEnabled(true);
                } else {
                    // local config with no api url means api disabled
                    apiUtil.setEnabled(false);
                }
            } else {
                // we got nothing, work as before
                apiUtil.setEnabled(true);
            }
        }, () => {
            // we got error fetching client config, work the API as normal
            apiUtil.setEnabled(true);
        }).then(() => {
            runClient(connectionTarget, profile);
        },
        (err) => {
            console.log("Failed loading local config: " + err);
            runClient(connectionTarget, profile); // run even if fetching the local config fails and fallback to previous behavior with the API
        })
    }
}

(<any>window).Mudslinger = Mudslinger;
