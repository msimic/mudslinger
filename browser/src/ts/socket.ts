import { EventHook } from "./event";

import * as io from "socket.io-client";
import { Mxp } from "./mxp";
import { OutputManager } from "./outputManager";
import { IoEvent } from "../../../common/src/ts/ioevent";
import { TelnetClient } from "./telnetClient";
import { utf8decode, utf8encode } from "./util";
import { UserConfig } from "./userConfig";
import * as apiUtil from "./apiUtil";


export class Socket {
    public EvtServerEcho = new EventHook<boolean>();
    public EvtTelnetTryConnect = new EventHook<[string, number]>();
    public EvtTelnetConnect = new EventHook<[string, number]>();
    public EvtTelnetDisconnect = new EventHook<void>();
    public EvtTelnetError = new EventHook<string>();
    public EvtWsError = new EventHook<any>();
    public EvtWsConnect = new EventHook<{sid: string}>();
    public EvtWsDisconnect = new EventHook<void>();
    public EvtSetClientIp = new EventHook<string>();

    private ioConn: SocketIOClient.Socket;
    private ioEvt: IoEvent;
    private telnetClient: TelnetClient;
    private clientIp: string;

    constructor(private outputManager: OutputManager, private mxp: Mxp) {
    }

    public async open() {
        let res;
        try {
            res = await apiUtil.apiGetClientConfig();
        } catch (err) {
            this.EvtWsError.fire(err);
            return false;
        }

        let ioUrl = location.protocol + "//" +
            (res.data.socket_io_host) +
            ":" +
            (res.data.socket_io_port || location.port) +
            "/telnet";
        console.log("Connecting to telnet proxy server at", ioUrl);
        this.ioConn = io.connect(ioUrl);

        this.ioConn.on("connect", () => {
            this.EvtWsConnect.fire({sid: this.ioConn.id});
        });

        this.ioConn.on("disconnect", () => {
            this.EvtWsDisconnect.fire(null);
        });

        this.ioConn.on("error", (msg: any) => {
            this.EvtWsError.fire(msg);
        });

        this.ioConn.on("connect_error", (msg: any) => {
            this.EvtWsError.fire(msg);
        });

        this.ioEvt = new IoEvent(this.ioConn);

        this.ioEvt.srvTelnetOpened.handle((val: [string, number]) => {
            this.telnetClient = new TelnetClient((data) => {
                this.ioEvt.clReqTelnetWrite.fire(data);
            });
            this.telnetClient.clientIp = this.clientIp;

            this.telnetClient.EvtData.handle((data) => {
                // this.handleTelnetData(data);
                this.outputManager.handleTelnetData(data);
            });

            this.telnetClient.EvtServerEcho.handle((data) => {
                this.EvtServerEcho.fire(data);
            });

            this.EvtTelnetConnect.fire(val);
        });

        this.ioEvt.srvTelnetClosed.handle(() => {
            this.telnetClient = null;
            this.EvtTelnetDisconnect.fire(null);
        });

        this.ioEvt.srvTelnetError.handle((data) => {
            this.EvtTelnetError.fire(data);
        });

        this.ioEvt.srvTelnetData.handle((data) => {
            if (this.telnetClient) {
                this.telnetClient.handleData(data);
            }
        });

        this.ioEvt.srvSetClientIp.handle((ipAddr: string) => {
            let re = /::ffff:(\d+\.\d+\.\d+\.\d+)/;
            let match = re.exec(ipAddr);
            if (match) {
                ipAddr = match[1];
            }

            this.clientIp = ipAddr;
            if (this.telnetClient) {
                this.telnetClient.clientIp = ipAddr;
            }
            this.EvtSetClientIp.fire(this.clientIp);
        });

        return true;
    }

    public openTelnet(host: string, port: number) {
        this.EvtTelnetTryConnect.fire([host, port]);
        this.ioEvt.clReqTelnetOpen.fire([host, port]);
    }

    public closeTelnet() {
        this.ioEvt.clReqTelnetClose.fire(null);
    }

    sendCmd(cmd: string) {
        cmd += "\r\n";
        let arr: Uint8Array;
        if (UserConfig.get("utf8Enabled") === true) {
            arr = utf8encode(cmd);
        } else {
            arr = new Uint8Array(cmd.length);
            for (let i = 0; i < cmd.length; i++) {
                arr[i] = cmd.charCodeAt(i);
            }
        }

        this.ioEvt.clReqTelnetWrite.fire(arr.buffer);
    }
}
