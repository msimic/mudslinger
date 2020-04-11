import { Telnet, NegotiationData, Cmd, CmdName, Opt, OptName } from "./telnetlib";
import { EventHook } from "./event";
import { UserConfig } from "./userConfig";
import { AppInfo } from "./appInfo";


const TTYPES: string[] = [
    "Mudslinger",
    "ANSI",
    "-256color"
];


export class TelnetClient extends Telnet {
    public EvtServerEcho = new EventHook<boolean>();

    public clientIp: string;

    private ttypeIndex: number = 0;

    private doNewEnviron: boolean = false;

    constructor(writeFunc: (data: ArrayBuffer) => void) {
        super(writeFunc);

        this.EvtNegotiation.handle((data) => { this.onNegotiation(data); });
    }

    private writeNewEnvVar(varName: string, varVal: string) {
        this.writeArr([
            Cmd.IAC, Cmd.SB, Opt.NEW_ENVIRON,
            NewEnv.IS, NewEnv.VAR
            ].concat(
                arrayFromString(varName),
                [NewEnv.VALUE],
                arrayFromString(varVal)));
    }

    private handleNewEnvSeq(seq: number[]): void {
        let actions = parseNewEnvSeq(seq);

        let varFuncs: {[k: string]: () => string} = {
            'IPADDRESS': () => { return this.clientIp; },
            'CLIENT_NAME': () => { return TTYPES[0]; },
            'CLIENT_VERSION': () => {
                return `${AppInfo.Version.Major}.${AppInfo.Version.Minor}.${AppInfo.Version.Revision}`;
            }
        };

        for (let i = 0; i < actions.length; i++) {
            let [action, varType, varName] = actions[i];
            if (action !== NewEnv.SEND) {
                console.error("Unexpected action:", actions[i]);
                continue;
            }

            if (varName === "") {
                if (varType === null) {
                    /* send all var and uservar */
                    for (let k in varFuncs) {
                        this.writeNewEnvVar(k, varFuncs[k]());
                    }
                    /* we don't support any USERVAR */
                } else if (varType === NewEnv.VAR) {
                    /* send all VAR */
                    for (let k in varFuncs) {
                        this.writeNewEnvVar(k, varFuncs[k]());
                    }
                } else if (varType === NewEnv.USERVAR) {
                    /* we don't support any USERVAR */
                }
            } else if (varType === NewEnv.VAR) {
                if (varName in varFuncs) {
                    this.writeNewEnvVar(varName, varFuncs[varName]());
                }
            } else if (varType === NewEnv.USERVAR) {
                /* we don't support any USERVAR */
            }
        }
    }

    private onNegotiation(data: NegotiationData) {
        let {cmd, opt} = data;
        // console.log(CmdName(cmd), OptName(opt));

        if (cmd === Cmd.WILL) {
            if (opt === Opt.ECHO) {
                this.EvtServerEcho.fire(true);
                this.writeArr([Cmd.IAC, Cmd.DO, Opt.ECHO]);
            } else if (opt === Opt.SGA) {
                this.writeArr([Cmd.IAC, Cmd.DO, Opt.SGA]);
            } else {
                this.writeArr([Cmd.IAC, Cmd.DONT, opt]);
            }
        } else if (cmd === Cmd.WONT) {
            if (opt === Opt.ECHO) {
                this.EvtServerEcho.fire(false);
                this.writeArr([Cmd.IAC, Cmd.DONT, Opt.ECHO]);
            }
        } else if (cmd === Cmd.DO) {
            if (opt === Opt.TTYPE) {
                this.writeArr([Cmd.IAC, Cmd.WILL, Opt.TTYPE]);
            } else if (opt == Opt.NEW_ENVIRON) {
                this.writeArr([Cmd.IAC, Cmd.WILL, Opt.NEW_ENVIRON]);
                this.doNewEnviron = true;
            } else if (opt === ExtOpt.MXP && UserConfig.getDef("mxpEnabled", true) === true) {
                this.writeArr([Cmd.IAC, Cmd.WILL, ExtOpt.MXP]);
            } else {
                this.writeArr([Cmd.IAC, Cmd.WONT, opt]);
            }
        } else if (cmd === Cmd.DONT) {
            if (opt === Opt.NEW_ENVIRON) {
                this.doNewEnviron = false;
            }
        } else if (cmd === Cmd.SE) {
            let sb = this.readSbArr();

            if (sb.length < 1) {
                return;
            }

            if (sb.length === 2 && sb[0] === Opt.TTYPE && sb[1] === SubNeg.SEND) {
                let ttype: string;
                if (this.ttypeIndex >= TTYPES.length) {
                    ttype = this.clientIp || "UNKNOWNIP";
                } else {
                    ttype = TTYPES[this.ttypeIndex];
                    this.ttypeIndex++;
                }
                this.writeArr( ([Cmd.IAC, Cmd.SB, Opt.TTYPE, SubNeg.IS]).concat(
                    arrayFromString(ttype),
                    [Cmd.IAC, Cmd.SE]
                ));
            } else if (this.doNewEnviron && sb.length > 0 && sb[0] == Opt.NEW_ENVIRON) {
                let seq = sb.slice(1);
                this.handleNewEnvSeq(seq);
            }
        }
    }
}

export namespace ExtOpt {
    export const MSDP = 69;
    export const MCCP = 70;
    export const MSP = 90;
    export const MXP = 91;
    export const ATCP = 200;
}

export namespace SubNeg {
    export const IS = 0;
    export const SEND = 1;
    export const ACCEPTED = 2;
    export const REJECTED = 3;
}

export namespace NewEnv {
    export const IS = 0;
    export const SEND = 1;
    export const INFO = 2;

    export const VAR = 0;
    export const VALUE = 1;
    export const ESC = 2;
    export const USERVAR = 3;
}

function arrayFromString(str: string): number[] {
    let arr = new Array(str.length);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = str.charCodeAt(i);
    }

    return arr;
}

export function parseNewEnvSeq(seq: number[]): [number, number, string][] {
    let rtn: [number, number, string][] = [];

    let i: number = 0;

    let firstAct: number = null;
    let act: number = null;
    let varType: number = null;
    let varName: string = null;
    
    while (true) {
        if (act !== null && varType !== null && varName !== null) {
            rtn.push([act, varType, varName]);
            act = null;
            varType = null;
            varName = null;
        }

        if (i >= seq.length) {
            if (act != null) {
                rtn.push([act, varType, varName || ""]);
            }
            break;
        }
        
        if (act === null) {
            let first = seq[i];
            if (firstAct === null) {
                /* We are at the very start of sequence so it has to be a SEND */
                act = first;
                firstAct = act;
                i++;

                if (act !== NewEnv.SEND) {
                    console.error("Only NEW-ENVIRON SEND is supported but got", act);
                    break;
                }
            } else if (first === firstAct) {
                /* Some servers will repeat the SEND for each request, some won't */
                act = firstAct;
                i++;
                continue;
            } else {
                act = firstAct;
                continue;
            }
        } else if (varType === null) {
            varType = seq[i];
            if (varType !== NewEnv.VAR && varType !== NewEnv.USERVAR) {
                console.error("Only NEW-ENVIRON VAR and USERVAR are supported but got", varType);
                break;
            }
            i++;
            continue;
        } else {
            let start = i;
            while (i < seq.length && seq[i] >=32 && seq[i] <= 127) {
                i++;
            }
            let varNameArr = seq.slice(start, i);
            varName = String.fromCharCode.apply(String, varNameArr);
        }
    }

    return rtn;
}