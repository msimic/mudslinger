import { UserConfig } from "./userConfig";
import { AppInfo } from "./appInfo";
// @ts-ignore
import * as Fingerprint2 from "@fingerprintjs/fingerprintjs";
import {Md5} from 'ts-md5/dist/md5';
import * as aesjs from "aes-js";
import { AliasEditor } from "./aliasEditor";
import { AliasManager } from "./aliasManager";
import { CommandInput } from "./commandInput";
import { JsScript, EvtScriptEmitCmd, EvtScriptEmitPrint, EvtScriptEmitEvalError, EvtScriptEmitError } from "./jsScript";
import { JsScriptWin } from "./jsScriptWin";
import { MenuBar } from "./menuBar";
import { ClassManager } from "./classManager";
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
import { ProfilesWindow } from "./profilesWindow";
import { ProfileManager } from "./profileManager";
import { ProfileWindow } from "./profileWindow";
import { Acknowledge } from "./util";


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
    private profilesWin: ProfilesWindow;
    private profileWin:ProfileWindow;
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
    private classManager: ClassManager;
    private serverEcho = false;

    private _connected = false;
    public get connected():boolean {
        return this._connected;
    }
    public set connected(v:boolean) {
        this._connected = v;
    }

    public disconnect() {
        this.socket.closeTelnet();
    }

    public connect(ct?:ConnectionTarget) {
        if (ct) {
            this.connectionTarget = ct;
        }
        if (this.connectionTarget) {
            this.socket.openTelnet(
                this.connectionTarget.host,
                this.connectionTarget.port
            );
        } else {
            this.connectWin.show();
        }
    }

    constructor(private connectionTarget: ConnectionTarget, private baseConfig:UserConfig, private profileManager:ProfileManager) {
        this.aboutWin = new AboutWin();
        this.jsScript = new JsScript();
        this.contactWin = new ContactWin();
        this.profileWin = new ProfileWindow(this.profileManager);
        this.profilesWin = new ProfilesWindow(this.profileManager, this.profileWin, this);
        this.classManager = new ClassManager(this.profileManager.activeConfig);
        this.jsScriptWin = new JsScriptWin(this.jsScript);
        this.triggerManager = new TriggerManager(
            this.jsScript, this.profileManager.activeConfig, baseConfig, this.classManager, profileManager);
        this.aliasManager = new AliasManager(
            this.jsScript, this.profileManager.activeConfig, baseConfig, this.classManager);
        this.jsScript.setClassManager(this.classManager);
        this.jsScript.setTriggerManager(this.triggerManager);
        this.jsScript.setAliasManager(this.aliasManager);

        this.commandInput = new CommandInput(this.aliasManager);

        this.outputWin = new OutputWin(this.profileManager.activeConfig);

        this.aliasEditor = new AliasEditor(this.aliasManager);
        this.triggerEditor = new TriggerEditor(this.triggerManager);

        this.outputManager = new OutputManager(this.outputWin, this.profileManager.activeConfig);

        this.mxp = new Mxp(this.outputManager, this.commandInput, this.jsScript);
        this.socket = new Socket(this.outputManager, this.mxp, this.profileManager.activeConfig);
        this.connectWin = new ConnectWin(this.socket);

        this.menuBar = new MenuBar(this.aliasEditor, this.triggerEditor, this.jsScriptWin, this.aboutWin, this.profilesWin, this.profileManager.activeConfig);

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
            this.connect();
        });

        this.menuBar.EvtDisconnectClicked.handle(() => {
            this.disconnect();
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
            this.connected = true;
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
            this.connected = false;
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
                this.commandInput.execCommand(cmd);
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
        EvtScriptEmitCmd.handle((data:{owner:string, message:string}) => {
            this.outputWin.handleScriptSendCommand(data.owner, data.message);
            this.commandInput.execCommand(data.message);
            //this.socket.sendCmd(data);
        });

        EvtScriptEmitPrint.handle((data:{owner:string, message:string}) => {
            this.outputWin.handleScriptPrint(data.owner, data.message);
        });

        EvtScriptEmitError.handle((data: {stack: any}) => {
            this.outputWin.handleScriptError(data)
        });

        EvtScriptEmitEvalError.handle((data: {stack: any}) => {
            this.outputWin.handleScriptEvalError(data)
        });

        // TriggerManager events
        this.triggerManager.EvtEmitTriggerCmds.handle((data: {orig:string, cmds:string[]}) => {
            this.outputWin.handleTriggerSendCommands(data.orig, data.cmds);
            for (let cmd of data.cmds) {
                this.commandInput.execCommand(cmd);
            }
            /*for (let cmd of data) {
                this.socket.sendCmd(cmd);
            }*/
        });

        // OutputWin events
        this.outputWin.EvtLine.handle((line: string) => {
            this.triggerManager.handleLine(line);
        });

        this.outputWin.EvtBuffer.handle((line: string) => {
            this.triggerManager.handleBuffer(line);
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

function makeCbLocalConfigSave(): (val: string) => string {
    let localConfigAck = localStorage.getItem("localConfigAck");

    return (val: string):string => {
        localStorage.setItem('userConfig', val);
        if (!localConfigAck) {
            let win = document.createElement('div');
            let profileMessage = ``;
            win.innerHTML = `
                <!--header-->
                <div>INFO</div>
                <!--content-->
                <div>
                <p>
                    Le tue impostazioni verranno salvate in <b>locale</b> nel tuo browser,
                    e non potrai accederci da altri senza esportare e importare.
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
        return val;
    };
}

export namespace Mudslinger {
    export let client: Client;
    export let baseConfig = new UserConfig();
    export let profileManager:ProfileManager = null;
    export async function GetLocalClientConfig() {
        let axinst = axios.create({
            validateStatus: (status) => {
                return status === 200;
            }
        });
        return axinst.get('./client.config.json');
    };

    export async function GetLocalBaseConfig() {
        let axinst = axios.create({
            validateStatus: (status) => {
                return status === 200;
            }
        });
        return axinst.get('./baseConfig.json');
    };

    function setDefault(cfg:UserConfig, key:string, value:any) {
        if (cfg.get(key) == undefined) {
            cfg.set(key, value);
        }
    }

    export function setDefaults(cfg:UserConfig) {
        setDefault(cfg, "text-color", "white-on-black");
        setDefault(cfg, "wrap-lines", true);
        setDefault(cfg, "utf8Enabled", false);
        setDefault(cfg, "mxpEnabled", true);
        setDefault(cfg, "enable-aliases", true);
        setDefault(cfg, "enable-triggers", true);
        setDefault(cfg, "font-size", "small");
        setDefault(cfg, "font", "Consolas");
        setDefault(cfg, "colorsEnabled", true);
        setDefault(cfg, "logTime", false);
        setDefault(cfg, "debugScripts", false);
    }

    function onPreloaded() {
        $(".preloading").addClass("preloaded");
    }

    export function runClient() {
        let connectionTarget: ConnectionTarget;
        let params = new URLSearchParams(location.search);

        baseConfig.init(localStorage.getItem("userConfig"), makeCbLocalConfigSave());
        setDefaults(baseConfig);
        profileManager = new ProfileManager(baseConfig);
        
        if (params.has('host') && params.get('host').trim()=="auto") {
            connectionTarget = {
                host: null,
                port: 0
            }
        } else if (params.has('host') && params.has('port')) {
            connectionTarget = {
                host: params.get("host").trim(),
                port: Number(params.get("port").trim())
            }
        } else if (profileManager.getCurrent()) {
            const sprof = profileManager.getCurrent();
            const prof = profileManager.getProfile(sprof);
            connectionTarget = {
                host: prof.host.trim(),
                port: Number(prof.port.trim())
            }
        } else {
            connectionTarget = {
                host: "mud.temporasanguinis.it",
                port: 4000
            }
        }
        profileManager.setTitle();
        console.log(connectionTarget);
        client = new Client(connectionTarget, baseConfig, profileManager);
        onPreloaded();
    }

    interface component {
        key:string;
        value:any;
    }

    export function decrypt(text: string):string {
        var key = aesjs.utils.hex.toBytes(localStorage.getItem("browserHash"));
        var encryptedBytes = aesjs.utils.hex.toBytes(text);
    
        // The counter mode of operation maintains internal state, so to
        // decrypt a new instance must be instantiated.
        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
        var decryptedBytes = aesCtr.decrypt(encryptedBytes);
        
        // Convert our bytes back into text
        var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
        //console.log(decryptedText);
        return decryptedText;
    }

    export function encrypt(text: string):string {
        var key = aesjs.utils.hex.toBytes(localStorage.getItem("browserHash"));

        var textBytes = aesjs.utils.utf8.toBytes(text);
        
        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
        var encryptedBytes = aesCtr.encrypt(textBytes);
        
        var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
        //console.log(encryptedHex);
        return encryptedHex;
    }

    export async function initEncryption(browserHash:string) {
        const prevHash = localStorage.getItem("browserHash");
        if (prevHash!=null && prevHash != browserHash) {
            Acknowledge("hashChanged", `La configurazione del PC o del browser e' cambiata.
            Le password che erano state salvate per i profili sono state invalidate e dovrai rimetterle.
            
            <b>E' una misura di sicurezza</b> per prevenire furti di password
            che vengono salvate nel browser e criptate con il suo numero identificativo.`);
            localStorage.removeItem("ack_hashChanged");
        }
        localStorage.setItem("browserHash", browserHash);
    }

    export async function initClient() {
        return GetLocalClientConfig().then(resp => {
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
            runClient();
        },
        (err) => {
            console.log("Failed loading local config: " + err);
            runClient(); // run even if fetching the local config fails and fallback to previous behavior with the API
        });
    }

    export async function init() {
        let componentsFetched = async (components:component[]) => {
            let hashStr = "";
            for (const iterator of components) {
                hashStr+=iterator.key+iterator.value;
            }
            hashStr = Md5.hashStr(hashStr).toString();

            await initEncryption(hashStr);
            await initClient();
        };

        if ((<any>window).requestIdleCallback) {
            (<any>window).requestIdleCallback(function () {
                Fingerprint2.get(function (components:component[]) {
                  componentsFetched(components);
                })
            })
        } else {
            setTimeout(function () {
                Fingerprint2.get(function (components:component[]) {
                    componentsFetched(components);
                })  
            }, 500)
        }
    }
}

(<any>window).Mudslinger = Mudslinger;
