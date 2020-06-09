import * as triggerManager from "../src/ts/triggerManager";
import { TrigAlItem } from "../src/ts/trigAlEditBase";

export function test() {

let testConfig = (triggers: TrigAlItem[]): triggerManager.ConfigIf => {
    
    let triggers_ = triggers;
    let enabled_: boolean;
    let rtn = {
        get: (key: "triggers") => { return triggers_; },
        set: (key: "triggers", val: TrigAlItem[]) => { triggers_ = val; },
        getDef: (key: "triggersEnabled", def: boolean) => {
            return enabled_ !== undefined ? enabled_ : def;
        },
        setEnabled_: (val: boolean) => { enabled_ = val; }
    }

    return rtn;
}

class TestBasicScript implements triggerManager.ScriptIf {
    public calls: [string, string][] = [];
    public scriptCalls: string[] = [];

    makeScript(text: string, argsSig: string): any {
        this.calls.push([text, argsSig]);
        return (cmd: string) => { this.scriptCalls.push(cmd); }
    }
}

class TestRegexScript implements triggerManager.ScriptIf {
    public calls: [string, string][] = [];
    public scriptCalls: [RegExpMatchArray, string][] = [];

    makeScript(text: string, argsSig: string): any {
        this.calls.push([text, argsSig]);
        return (match: RegExpMatchArray, cmd: string) => {
            this.scriptCalls.push([match, cmd]);
        }
    }
}

class CmdCatcher {
    public cmds: string[] = [];
    constructor(private mgr: triggerManager.TriggerManager) {
        this.mgr.EvtEmitTriggerCmds.handle((cmds) => {
            this.cmds = this.cmds.concat(cmds);
        });
    }
}

QUnit.module("triggerManager");

QUnit.test("basic noscript", (assert: Assert) => {
    let trigs: TrigAlItem[] = [{
        pattern: "test1", value: "do\na\nthing", regex: false, is_script: false
    }];
    let cfg = testConfig(trigs);
    let mgr = new triggerManager.TriggerManager(null, cfg);
    let catcher = new CmdCatcher(mgr);

    mgr.handleLine("123 test1 456 more");
    assert.equal(catcher.cmds.length, 3);
    assert.deepEqual(catcher.cmds, ['do', 'a', 'thing']);
});

QUnit.test("basic script", (assert: Assert) => {
    let trigs: TrigAlItem[] = [{
        pattern: "test1", value: "n/a 1", regex: false, is_script: true
    }];
    let cfg = testConfig(trigs);
    let scr = new TestBasicScript();
    let mgr = new triggerManager.TriggerManager(scr, cfg);

    {
        mgr.handleLine("123 test1 456 more");
        assert.equal(scr.calls.length, 1);
        assert.equal(scr.scriptCalls.length, 1);
        let call = scr.calls.pop();
        let scrCall = scr.scriptCalls.pop();
        assert.equal(call[0], "n/a 1");
        assert.equal(call[1], "line");
        assert.equal(scrCall, "123 test1 456 more");
    }
});

QUnit.test("regex noscript", (assert: Assert) => {
    let trigs: TrigAlItem[] = [{
        pattern: "test1 (\\d{3})\\s", value: "do\na$1\nthing", regex: true, is_script: false
    }];
    let cfg = testConfig(trigs);
    let mgr = new triggerManager.TriggerManager(null, cfg);
    let catcher = new CmdCatcher(mgr);
    
    mgr.handleLine("123 test1 456 more");
    assert.equal(catcher.cmds.length, 3);
    assert.deepEqual(catcher.cmds, ['do', 'a456', 'thing']);
});

QUnit.test("regex script", (assert: Assert) => {
    let trigs: TrigAlItem[] = [{
        pattern: "test1 (\\d{3})\\s", value: "n/a 1", regex: true, is_script: true
    }];
    let cfg = testConfig(trigs);
    let scr = new TestRegexScript();
    let mgr = new triggerManager.TriggerManager(scr, cfg);

    {
        mgr.handleLine("123 test1 456 more");
        assert.equal(scr.calls.length, 1);
        assert.equal(scr.scriptCalls.length, 1);
        let call = scr.calls.pop();
        let scrCall = scr.scriptCalls.pop();
        assert.equal(call[0], "n/a 1");
        assert.equal(call[1], "match, line");
        assert.equal(scrCall[0][0], "test1 456 ");
        assert.equal(scrCall[0][1], "456");
        assert.equal(scrCall[1], "123 test1 456 more");
    }
});

} // function test
