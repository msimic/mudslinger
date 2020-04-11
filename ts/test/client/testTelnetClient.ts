import { parseNewEnvSeq, NewEnv } from "../../src/client/telnetClient";

export function test() {

QUnit.module("NEW-ENVIRON");

/* 
Per: https://tintin.mudhalla.net/rfc/rfc1572/

    IAC SB NEW-ENVIRON SEND IAC SE
    IAC SB NEW-ENVIRON SEND VAR IAC SE
    IAC SB NEW-ENVIRON SEND USERVAR IAC SE
    IAC SB NEW-ENVIRON SEND VAR USERVAR IAC SE
*/

QUnit.test("parse send all", (assert: Assert) => {
    let input = [NewEnv.SEND];
    let exp: [number, number, string][] = [
        [NewEnv.SEND, null, ""],
    ]

    let result = parseNewEnvSeq(input);
    assert.deepEqual(result, exp);
});

QUnit.test("parse send all var", (assert: Assert) => {
    let input = [NewEnv.SEND, NewEnv.VAR];
    let exp: [number, number, string][] = [
        [NewEnv.SEND, NewEnv.VAR, ""],
    ]

    let result = parseNewEnvSeq(input);
    assert.deepEqual(result, exp);
});

QUnit.test("parse send all uservar", (assert: Assert) => {
    let input = [NewEnv.SEND, NewEnv.USERVAR];
    let exp: [number, number, string][] = [
        [NewEnv.SEND, NewEnv.USERVAR, ""],
    ]

    let result = parseNewEnvSeq(input);
    assert.deepEqual(result, exp);
});

QUnit.test("parse send all var and uservar", (assert: Assert) => {
    let input = [NewEnv.SEND, NewEnv.USERVAR, NewEnv.VAR];
    let exp: [number, number, string][] = [
        [NewEnv.SEND, NewEnv.USERVAR, ""],
        [NewEnv.SEND, NewEnv.VAR, ""],
    ]

    let result = parseNewEnvSeq(input);
    assert.deepEqual(result, exp);
});


/*
Per: https://tintin.mudhalla.net/protocols/mnes/

    server - IAC   SB NEW-ENVIRON SEND VAR "CLIENT_NAME" SEND VAR "CLIENT_VERSION" IAC SE
    server - IAC   SB NEW-ENVIRON SEND VAR "CHARSET" IAC SE
*/
QUnit.test("parse send single var", (assert: Assert) => {
    let input = [NewEnv.SEND, NewEnv.VAR].concat(arrayFromString("CHARSET"));
    let exp: [number, number, string][] = [
        [NewEnv.SEND, NewEnv.VAR, "CHARSET"],
    ];

    let result = parseNewEnvSeq(input);
    assert.deepEqual(result, exp);
});

QUnit.test("parse send single uservar", (assert: Assert) => {
    let input = [NewEnv.SEND, NewEnv.USERVAR].concat(arrayFromString("CHARSET"));
    let exp: [number, number, string][] = [
        [NewEnv.SEND, NewEnv.USERVAR, "CHARSET"],
    ];

    let result = parseNewEnvSeq(input);
    assert.deepEqual(result, exp);
});

QUnit.test("parse send multi var (repeated send)", (assert: Assert) => {
    let input = [NewEnv.SEND, NewEnv.VAR].concat(
        arrayFromString("CLIENT_NAME"),
        [NewEnv.SEND, NewEnv.VAR],
        arrayFromString("CLIENT_VERSION"));
    let exp: [number, number, string][] = [
        [NewEnv.SEND, NewEnv.VAR, "CLIENT_NAME"],
        [NewEnv.SEND, NewEnv.VAR, "CLIENT_VERSION"],
    ];

    let result = parseNewEnvSeq(input);
    assert.deepEqual(result, exp);
});

QUnit.test("parse send multi var (single send)", (assert: Assert) => {
    let input = [NewEnv.SEND, NewEnv.VAR].concat(
        arrayFromString("CLIENT_NAME"),
        [NewEnv.VAR],
        arrayFromString("CLIENT_VERSION"));
    let exp: [number, number, string][] = [
        [NewEnv.SEND, NewEnv.VAR, "CLIENT_NAME"],
        [NewEnv.SEND, NewEnv.VAR, "CLIENT_VERSION"],
    ];

    let result = parseNewEnvSeq(input);
    assert.deepEqual(result, exp);
});

/*
per: https://tintin.mudhalla.net/rfc/rfc1572/

    SEND VAR "USER" VAR "ACCT" VAR USERVAR
    [ The server has now explicitly asked for the USER and ACCT
         variables, the default set of well known environment variables,
         and the default set of user defined variables.  Note that the
         client includes the USER information twice; once because it was
         explicitly asked for, and once because it is part of the
         default environment.  ]
 */

 QUnit.test("parse send example 1", (assert: Assert) => {
    let input = [NewEnv.SEND, NewEnv.VAR].concat(
        arrayFromString("USER"),
        [NewEnv.VAR],
        arrayFromString("ACCT"),
        [NewEnv.VAR],
        [NewEnv.USERVAR]);
    let exp: [number, number, string][] = [
        [NewEnv.SEND, NewEnv.VAR, "USER"],
        [NewEnv.SEND, NewEnv.VAR, "ACCT"],
        [NewEnv.SEND, NewEnv.VAR, ""],
        [NewEnv.SEND, NewEnv.USERVAR, ""],
    ];

    let result = parseNewEnvSeq(input);
    assert.deepEqual(result, exp);
});

};

function arrayFromString(str: string): number[] {
    let arr = new Array(str.length);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = str.charCodeAt(i);
    }

    return arr;
}