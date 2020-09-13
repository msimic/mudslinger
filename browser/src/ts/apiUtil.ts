import axios from 'axios';

export let enabled = true;
export let apiBaseUrl: string = null;

export namespace clientInfo {
    export let sid: string = null;
    export let clientIp: string = null;
    export let telnetHost: string = null;
    export let telnetPort: number = null;
}

export function setEnabled(val : boolean) {
    enabled = val;
    if (!enabled) {
        $("[data-require-api='true']").hide();
    } else {
        $("[data-require-api='true']").show();
    }
}

export function getApiBaseUrl() {
    return apiBaseUrl || "./";
}

export function setApiBaseUrl(val: string) {
    apiBaseUrl = val;
}

export function createApiUrl(val: string) {
    return getApiBaseUrl() + val;
}

let axinst = axios.create({
    validateStatus: (status) => {
        return status === 200;
    }
});

export async function apiGetClientConfig() {
    if (!enabled)
        return axinst.get('./client.config.json');
    else
        return axinst.get(createApiUrl('client/client_config'));
}

export async function apiGetProfile(profileId: string) {
    if (!enabled) return null
    else
    return axinst.get(createApiUrl('user/get_profile'), {
        params: {
            id: profileId
        }
    });
}

export async function apiPostProfileConfig(profileId: string, val: string) {
    if (!enabled) return null
    else
    return axinst.post(createApiUrl('user/save_profile_config'), {
        id: profileId,
        config: val
    });
}

export async function apiPostUserConfig(cfgVals: string) {
    if (!enabled) return null
    else
    return axinst.post(createApiUrl('usage/user_config'), {
        sid: clientInfo.sid,
        vals: cfgVals,
        time_stamp: new Date()
    });
}

export async function apiPostMxpSend() {
    if (!enabled) return null
    else
    return axinst.post(createApiUrl('usage/mxp_send'), {
        sid: clientInfo.sid,
        from_addr: clientInfo.clientIp,
        to_addr: clientInfo.telnetHost,
        to_port: clientInfo.telnetPort,
        time_stamp: new Date()
    });
}

export async function apiPostClientConn() {
    if (!enabled) return null
    else
    return axinst.post(createApiUrl('usage/client_conn'), {
        sid: clientInfo.sid,
        from_addr: clientInfo.clientIp,
        to_addr: clientInfo.telnetHost,
        to_port: clientInfo.telnetPort,
        time_stamp: new Date()
    });
}

export async function apiPostContact(message: string, email: string) {
    if (!enabled) return null
    else
    return axinst.post(createApiUrl('client/contact'), {
        "message": message,
        "email": email,
        "client_info": {
            sid: clientInfo.sid,
            from_addr: clientInfo.clientIp,
            to_addr: clientInfo.telnetHost,
            to_port: clientInfo.telnetPort
        }
    });
}

export namespace TestFixture {
    export function GetAxios() { return axinst; }
}