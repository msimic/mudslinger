declare let configClient: any;

export type apiCallback = (status: number, data: any) => void;

export namespace clientInfo {
    export let sid: string = null;
    export let clientIp: string = null;
    export let telnetHost: string = null;
    export let telnetPort: number = null;
}

export function apiPostUserConfig(cfgVals: string) {
    apiPost('/usage/user_config', {
        sid: clientInfo.sid,
        vals: cfgVals,
        time_stamp: new Date()
    });
}

export function apiPostMxpSend() {
    apiPost('/usage/mxp_send', {
        sid: clientInfo.sid,
        from_addr: clientInfo.clientIp,
        to_addr: clientInfo.telnetHost,
        to_port: clientInfo.telnetPort,
        time_stamp: new Date()
    });
}

export function apiPostContact(message: string, email: string, cb?: apiCallback) {
    apiPost('/usage/contact', {
        "message": message,
        "email": email,
        "client_info": {
            sid: clientInfo.sid,
            from_addr: clientInfo.clientIp,
            to_addr: clientInfo.telnetHost,
            to_port: clientInfo.telnetPort
        }
    }, cb);
}

export function apiPost(path: string, data: any, cb?: apiCallback): void {
    if (!configClient.apiHost) {
        return;
    }

    let xhr = new XMLHttpRequest();

    let jsonData = JSON.stringify(data);

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.status !== 200) {
                console.error("apiPost status ", xhr.status);
                if (cb) {
                    cb(xhr.status, null);
                }
            } else {
                let val = JSON.parse(xhr.responseText);
                if (cb) {
                    cb(xhr.status, val);
                }
            }
        }
    };

    xhr.addEventListener('error', (event) => {
        console.error('apiPost error:', event);
        if (cb) {
            cb(xhr.status, null);
        }
    });

    xhr.open('POST',
        location.protocol + "//" +
        configClient.apiHost +
        ":" +
        (configClient.apiPort || location.port) +
        path);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(jsonData);
}
