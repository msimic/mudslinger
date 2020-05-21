import * as sinon from "sinon";
// import * as io from "socket.io-client";
import * as apiUtil from "../../src/client/apiUtil";

declare let configClient: any;

export function test() {

let xhr: sinon.SinonFakeXMLHttpRequestStatic;
let requests: sinon.SinonFakeXMLHttpRequest[];

let configClientOrig: any;

QUnit.module("usage", {
    before: (assert: Assert) => {
        configClientOrig = configClient;
        configClient = {
            apiHost: "fakeHost"
        };
    },
    beforeEach: (assert: Assert) => {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];

        xhr.onCreate = (x) => {
            requests.push(x);
        };
    },
    afterEach: (assert: Assert) => {
        xhr.restore();
    }
});

QUnit.test("apiPost 200", (assert: Assert) => {
    let cb = sinon.spy();
    apiUtil.apiPost("/some/path", {some: "data", is: "here"}, cb);
    assert.equal(requests.length, 1);

    requests[0].respond(200, {"Content-Type": "application/json"}, '{"some": "return"}');
    assert.ok(cb.calledWith(200, {some: "return"}));
});

QUnit.test("apiPost 400", (assert: Assert) => {
    let cb = sinon.spy();
    apiUtil.apiPost("/some/path", {some: "data", is: "here"}, cb);
    assert.equal(requests.length, 1);

    requests[0].respond(400, null, null);
    assert.ok(cb.calledWith(400, null));
});

QUnit.test("apiPost error", (assert: Assert) => {
    let cb = sinon.spy();
    apiUtil.apiPost("/some/path", {some: "data", is: "here"}, cb);
    assert.equal(requests.length, 1);

    requests[0].error();
    assert.ok(cb.calledWith(0, null));
});

} // function  test
