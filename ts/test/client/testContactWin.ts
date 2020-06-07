import * as apiUtil from "../../src/client/apiUtil";
import * as moxios from "moxios";
import * as contactWin from "../../src/client/contactWin";


export function test() {

let win: contactWin.ContactWin;

QUnit.module("contactWin", {
    beforeEach: (assert: Assert) => {
        moxios.install(apiUtil.TestFixture.GetAxios());
        win = new contactWin.ContactWin();
    },
    afterEach: (assert: Assert) => {
        moxios.uninstall(apiUtil.TestFixture.GetAxios());
        win.destroy();
    },
});

QUnit.test("no message", (assert: Assert) => {
    let done = assert.async(1);

    let emailInput = document.getElementsByClassName("winContact-inpEmail")[0] as HTMLInputElement;
    let textArea = document.getElementsByClassName("winContact-text")[0] as HTMLTextAreaElement;
    let sendButton = document.getElementsByClassName("winContact-btnSend")[0] as HTMLButtonElement;
    let infoDiv = document.getElementsByClassName("winContact-info")[0] as HTMLDivElement;

    win.show();

    emailInput.value = "abc@123.com";
    textArea.value = "\n\n\n    ";

    sendButton.click();

    moxios.wait(() => {
        assert.equal(moxios.requests.count(), 0);
        assert.equal(infoDiv.textContent, "Please enter a message!");
        done();
    });
});

QUnit.test("sent", (assert: Assert) => {
    let done = assert.async(1);

    let textArea = document.getElementsByClassName("winContact-text")[0] as HTMLTextAreaElement;
    let sendButton = document.getElementsByClassName("winContact-btnSend")[0] as HTMLButtonElement;
    let infoDiv = document.getElementsByClassName("winContact-info")[0] as HTMLDivElement;

    win.show();

    textArea.value = "this is my message";

    sendButton.click();

    moxios.wait(() => {
        assert.equal(moxios.requests.count(), 1);
        let req = moxios.requests.mostRecent();
        req.respondWith({
            status: 200,
            response: {"sent": true}
        }).then(() => {
            assert.equal(infoDiv.textContent, "Message was sent! Thanks for the feedback.");
            done();
        });
    });
});

QUnit.test("not sent", (assert: Assert) => {
    let done = assert.async(1);

    let textArea = document.getElementsByClassName("winContact-text")[0] as HTMLTextAreaElement;
    let sendButton = document.getElementsByClassName("winContact-btnSend")[0] as HTMLButtonElement;
    let infoDiv = document.getElementsByClassName("winContact-info")[0] as HTMLDivElement;

    win.show();

    textArea.value = "this is my message";

    sendButton.click();

    moxios.wait(() => {
        assert.equal(moxios.requests.count(), 1);
        let req = moxios.requests.mostRecent();
        req.respondWith({
            status: 200,
            response: {"sent": false}
        }).then(() => {
            assert.equal(infoDiv.textContent, "Message could not be sent...Please try again later.");
            done();
        });
    });
});

QUnit.test("400", (assert: Assert) => {
    let done = assert.async(1);

    let textArea = document.getElementsByClassName("winContact-text")[0] as HTMLTextAreaElement;
    let sendButton = document.getElementsByClassName("winContact-btnSend")[0] as HTMLButtonElement;
    let infoDiv = document.getElementsByClassName("winContact-info")[0] as HTMLDivElement;

    win.show();

    textArea.value = "this is my message";

    sendButton.click();

    moxios.wait(() => {
        assert.equal(moxios.requests.count(), 1);
        let req = moxios.requests.mostRecent();
        req.respondWith({
            status: 400,
        }).then(() => {
            assert.equal(infoDiv.textContent, "Message could not be sent...Please try again later.");
            done();
        });
    });
});

} // function test
