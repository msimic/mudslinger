import * as aliasManager from "../src/ts/aliasManager";
import { TrigAlItem } from "../src/ts/trigAlEditBase";

export function test() {

QUnit.module("aliasManager");

let testConfig = (aliases: TrigAlItem[]): aliasManager.ConfigIf => {
    
    let aliases_ = aliases;
    let enabled_: boolean;
    let rtn = {
        get: (key: "aliases") => { return aliases_; },
        set: (key: "aliases", val: TrigAlItem[]) => { aliases_ = val; },
        getDef: (key: "aliasesEnabled", def: boolean) => {
            return enabled_ !== undefined ? enabled_ : def;
        },
        setEnabled_: (val: boolean) => { enabled_ = val; }
    }

    return rtn;
}

class TestBasicScript implements aliasManager.ScriptIf {
    public calls: [string, string][] = [];
    public scriptCalls: string[] = [];

    makeScript(text: string, argsSig: string): any {
        this.calls.push([text, argsSig]);
        return (cmd: string) => { this.scriptCalls.push(cmd); }
    }
}

class TestRegexScript implements aliasManager.ScriptIf {
    public calls: [string, string][] = [];
    public scriptCalls: [RegExpMatchArray, string][] = [];

    makeScript(text: string, argsSig: string): any {
        this.calls.push([text, argsSig]);
        return (match: RegExpMatchArray, cmd: string) => {
            this.scriptCalls.push([match, cmd]);
        }
    }
}

QUnit.test("basic noscript", (assert: Assert) => {
    let aliases: TrigAlItem[] = [{
        pattern: "test1", value: "do a thing", regex: false, is_script: false
    }, {
        pattern: "test2", value: "do a thing $1", regex: false, is_script: false
    }];
    let cfg = testConfig(aliases);
    let mgr = new aliasManager.AliasManager(null, cfg);

    let result = mgr.checkAlias("test1 123 456 more");
    assert.equal(result, "do a thing");

    result = mgr.checkAlias("test2 123 456 more");
    assert.equal(result, "do a thing 123 456 more");
});

QUnit.test("basic script", (assert: Assert) => {
    let aliases: TrigAlItem[] = [{
        pattern: "test1", value: "n/a 1", regex: false, is_script: true
    }, {
        pattern: "test2", value: "n/a 2", regex: false, is_script: true
    }];
    let cfg = testConfig(aliases);
    let scr = new TestBasicScript();
    let mgr = new aliasManager.AliasManager(scr, cfg);

    {
        let result = mgr.checkAlias("test1 123 456 more");
        assert.strictEqual(result, true);
        assert.equal(scr.calls.length, 1);
        assert.equal(scr.scriptCalls.length, 1);
        let call = scr.calls.pop();
        let scrCall = scr.scriptCalls.pop();
        assert.equal(call[0], "n/a 1");
        assert.equal(call[1], "input");
        assert.equal(scrCall, "test1 123 456 more");
    }

    {
        let result = mgr.checkAlias("test2");
        assert.strictEqual(result, true);
        assert.equal(scr.calls.length, 1);
        assert.equal(scr.scriptCalls.length, 1);
        let call = scr.calls.pop();
        let scrCall = scr.scriptCalls.pop();
        assert.equal(call[0], "n/a 2");
        assert.equal(call[1], "input");
        assert.equal(scrCall, "test2");
    }
});

QUnit.test("regex noscript", (assert: Assert) => {
    let aliases: TrigAlItem[] = [{
        pattern: "test1", value: "do a thing", regex: true, is_script: false
    }, {
        pattern: "abc([a-z]+)", value: "do a thing $1", regex: true, is_script: false
    }, {
        pattern: "abc ([a-z])([a-z])([a-z])([a-z])([a-z])([a-z])([a-z])([a-z])([a-z])",
        value: "do a thing $1 $2 $3 $4 $5 $6 $7 $8 $9", regex: true, is_script: false
    }];
    let cfg = testConfig(aliases);
    let mgr = new aliasManager.AliasManager(null, cfg);

    let result = mgr.checkAlias("test1 123 456 more");
    assert.equal(result, "do a thing");

    result = mgr.checkAlias("abcdef");
    assert.equal(result, "do a thing def");

    result = mgr.checkAlias("abc defghijkl");
    assert.equal(result, "do a thing d e f g h i j k l");
});

QUnit.test("regex script", (assert: Assert) => {
    let aliases: TrigAlItem[] = [{
        pattern: "test1", value: "n/a 1", regex: true, is_script: true
    }, {
        pattern: "abc([a-z]+)", value: "n/a 2", regex: true, is_script: true
    }];
    let cfg = testConfig(aliases);
    let scr = new TestRegexScript();
    let mgr = new aliasManager.AliasManager(scr, cfg);

    {
        let result = mgr.checkAlias("test1 123 456 more");
        assert.strictEqual(result, true);
        assert.equal(scr.calls.length, 1);
        assert.equal(scr.scriptCalls.length, 1);
        let call = scr.calls.pop();
        let scrCall = scr.scriptCalls.pop();
        assert.equal(call[0], "n/a 1");
        assert.equal(call[1], "match, input");
        assert.equal(scrCall[0], "test1");
        assert.equal(scrCall[1], "test1 123 456 more");
    }

    {
        let result = mgr.checkAlias("abcdef");
        assert.strictEqual(result, true);
        assert.equal(scr.calls.length, 1);
        assert.equal(scr.scriptCalls.length, 1);
        let call = scr.calls.pop();
        let scrCall = scr.scriptCalls.pop();
        assert.equal(call[0], "n/a 2");
        assert.equal(call[1], "match, input");
        assert.equal(scrCall[0][0], "abcdef");
        assert.equal(scrCall[0][1], "def");
        assert.equal(scrCall[1], "abcdef");
    }
});

} // function test
