import * as jsScript from "../src/ts/jsScript";

export function test() {

let sends: string[];
let prints: string[];
let evalErrors: {}[];

jsScript.EvtScriptEmitCmd.handle((data) => { sends.push(data); });
jsScript.EvtScriptEmitPrint.handle((data) => { prints.push(data); });
jsScript.EvtScriptEmitEvalError.handle((data) => { evalErrors.push(data); });

let clss: jsScript.JsScript;

QUnit.module("jsScript", {
    beforeEach: (assert: Assert) => {
        sends = [];
        prints = [];
        evalErrors = [];
        clss = new jsScript.JsScript();
    }
});

QUnit.test("send", (assert: Assert) => {
    let scr = clss.makeScript(`
        send('hello world');
        send('second message');
        send('third mess');
    `, "");
    scr();
    assert.equal(sends.length, 3);
    assert.equal(sends[0], "hello world");
    assert.equal(sends[1], "second message");
    assert.equal(sends[2], "third mess");
});

QUnit.test("print", (assert: Assert) => {
    let scr = clss.makeScript(`
        print('hello world');
        print('second message');
        print('third mess');
    `, "");
    scr();
    assert.equal(prints.length, 3);
    assert.equal(prints[0], "hello world");
    assert.equal(prints[1], "second message");
    assert.equal(prints[2], "third mess");
});

QUnit.test("eval error", (assert: Assert) => {
    let scr = clss.makeScript(`
        print('hello world
    `, "");
    assert.equal(null, scr);
    assert.equal(evalErrors.length, 1);
});

QUnit.test("comment regression 1", (assert: Assert) => {
    // Comment on last line was creating eval error due to makeScript
    // not appending newline to the script text
    let scr = clss.makeScript(`
        send('hello world');
        // a comment`, "");
    assert.notEqual(scr, null);
    scr();
    assert.equal(sends[0], 'hello world');
});

QUnit.test("this", (assert: Assert) => {
    let sthis = clss.getScriptThis();
    clss.makeScript(
        `this.abc = 123;`,
        "")();
    assert.equal(sthis.abc, 123);

    clss.makeScript(
        `this.abc += 123;`,
        "")();
    assert.equal(sthis.abc, 246);

    clss.makeScript(
        `this.incrabc = () => { this.abc += 1; }`,
        "")();
    
    clss.makeScript(
        `this.incrabc();`,
        "")();
    assert.equal(sthis.abc, 247);
});

QUnit.test("args eval error", (assert: Assert) => {
    let scr = clss.makeScript(`
        print('hello world');
    `, "{}}}");
    assert.equal(null, scr);
    assert.equal(evalErrors.length, 1);
});

QUnit.test("basic args", (assert: Assert) => {
    clss.makeScript(`
        print(myarg1 + myarg2 + myarg3);
    `, "myarg1,myarg2,myarg3")(
        'abc', 'def', 'ghi'
        );

    assert.equal(prints.length, 1);
    assert.equal(prints[0], 'abcdefghi');
});



} // function test
