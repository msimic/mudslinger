import * as sinon from "sinon";
// import * as io from "socket.io-client";
import * as contactWin from "../../src/client/contactWin";

declare let configClient: any;

export function test() {

let xhr: sinon.SinonFakeXMLHttpRequestStatic;
let requests: sinon.SinonFakeXMLHttpRequest[];

let configClientOrig: any;

let win: contactWin.ContactWin;

QUnit.module("contactWin", {
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

        win = new contactWin.ContactWin();
    },
    afterEach: (assert: Assert) => {
        xhr.restore();
        win.destroy();
    }
});

QUnit.test("no message", (assert: Assert) => {
    let emailInput = document.getElementsByClassName("winContact-inpEmail")[0] as HTMLInputElement;
    let textArea = document.getElementsByClassName("winContact-text")[0] as HTMLTextAreaElement;
    let sendButton = document.getElementsByClassName("winContact-btnSend")[0] as HTMLButtonElement;
    let infoDiv = document.getElementsByClassName("winContact-info")[0] as HTMLDivElement;

    win.show();

    emailInput.value = "abc@123.com";
    textArea.value = "\n\n\n    ";

    sendButton.click();

    assert.equal(requests.length, 0);
    assert.equal(infoDiv.textContent, "Please enter a message!");
});

QUnit.test("sent", (assert: Assert) => {
    let emailInput = document.getElementsByClassName("winContact-inpEmail")[0] as HTMLInputElement;
    let textArea = document.getElementsByClassName("winContact-text")[0] as HTMLTextAreaElement;
    let sendButton = document.getElementsByClassName("winContact-btnSend")[0] as HTMLButtonElement;
    let infoDiv = document.getElementsByClassName("winContact-info")[0] as HTMLDivElement;

    win.show();

    textArea.value = "this is my message";

    sendButton.click();

    assert.equal(requests.length, 1);
    requests[0].respond(200, {"Content-Type": "application/json"}, '{"sent": true}');
    assert.equal(infoDiv.textContent, "Message was sent! Thanks for the feedback.");
});

QUnit.test("not sent", (assert: Assert) => {
    let emailInput = document.getElementsByClassName("winContact-inpEmail")[0] as HTMLInputElement;
    let textArea = document.getElementsByClassName("winContact-text")[0] as HTMLTextAreaElement;
    let sendButton = document.getElementsByClassName("winContact-btnSend")[0] as HTMLButtonElement;
    let infoDiv = document.getElementsByClassName("winContact-info")[0] as HTMLDivElement;

    win.show();

    textArea.value = "this is my message";

    sendButton.click();

    assert.equal(requests.length, 1);
    requests[0].respond(200, {"Content-Type": "application/json"}, '{"sent": false}');
    assert.equal(infoDiv.textContent, "Message could not be sent...Please try again later.");
});

QUnit.test("400", (assert: Assert) => {
    let emailInput = document.getElementsByClassName("winContact-inpEmail")[0] as HTMLInputElement;
    let textArea = document.getElementsByClassName("winContact-text")[0] as HTMLTextAreaElement;
    let sendButton = document.getElementsByClassName("winContact-btnSend")[0] as HTMLButtonElement;
    let infoDiv = document.getElementsByClassName("winContact-info")[0] as HTMLDivElement;

    win.show();

    textArea.value = "this is my message";

    sendButton.click();

    assert.equal(requests.length, 1);
    requests[0].respond(400, null, null);
    assert.equal(infoDiv.textContent, "Message could not be sent...Please try again later.");
});

QUnit.test("error", (assert: Assert) => {
    let emailInput = document.getElementsByClassName("winContact-inpEmail")[0] as HTMLInputElement;
    let textArea = document.getElementsByClassName("winContact-text")[0] as HTMLTextAreaElement;
    let sendButton = document.getElementsByClassName("winContact-btnSend")[0] as HTMLButtonElement;
    let infoDiv = document.getElementsByClassName("winContact-info")[0] as HTMLDivElement;

    win.show();

    textArea.value = "this is my message";

    sendButton.click();

    assert.equal(requests.length, 1);
    requests[0].error();
    assert.equal(infoDiv.textContent, "Message could not be sent...Please try again later.");
});

} // function  test
