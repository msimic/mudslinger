import { messagebox } from "./messagebox";

export function replaceLtGt(text: string): string {
    return text.replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
}

export function replaceAmp(text: string): string {
    return text.replace(/&/g, "&amp;");
}

export function replaceLf(text: string): string {
    // We are presumably already stripping out CRs before this
    return text.replace(/\n/g, "<br>");
}

export function rawToHtml(text: string): string {
    if (typeof text != "string") {
        text = JSON.stringify(text);
        text = text.slice(1, text.length-1);
    }
    return text;
    return replaceLf(
            replaceLtGt(
            replaceAmp(text)));
}

export function stripHtml(sText:string):string {
    let intag = false;
    let positions = [];
    for (var i = 0; i < sText.length; i++) {
        if (sText[i] == "<") intag = true;
        if (!intag) {
            positions.push(sText[i]);
        }
        if (sText[i] == ">") intag = false;
    }
    return positions.join("");
}

export function Acknowledge(ack:string, str:string) {
    const val = localStorage.getItem('ack_'+ack);
    if (val == 'true') return;
    messagebox("Informazione", str, () => {
        localStorage.setItem('ack_'+ack, "true");
    }, "OK", "", 500, null);
}

// https://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
export function utf8encode(str: string): Uint8Array {
    let utf8: number[] = [];

    for (let i = 0; i < str.length; ++i) {
        let charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6), 
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >>18), 
                      0x80 | ((charcode>>12) & 0x3f), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
    }

    return new Uint8Array(utf8);
}

/* https://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript */
export function utf8decode(array: Uint8Array): { result: string; partial: Uint8Array } {
    let out, i, len, c;
    let char2, char3, char4;

    out = "";
    len = array.length;
    i = 0;
    while(i < len) {
        c = array[i++];
    
        switch(c >> 4)
        { 
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12: case 13:
                // 110x xxxx   10xx xxxx
                if ( (i + 1) > len) {
                    return { result: out, partial: array.slice(i - 1) };
                }
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                if ( (i + 2) > len) {
                    return { result: out, partial: array.slice(i - 1) };
                }
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) |
                               ((char2 & 0x3F) << 6) |
                               ((char3 & 0x3F) << 0));
                break;
            case 15:
                // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
                if ( (i + 3) > len) {
                    return { result: out, partial: array.slice(i - 1) };
                }
                char2 = array[i++];
                char3 = array[i++];
                char4 = array[i++];
                out += String.fromCodePoint(((c & 0x07) << 18) | ((char2 & 0x3F) << 12) | ((char3 & 0x3F) << 6) | (char4 & 0x3F));

                break;
        }
    }

    return { result: out, partial: null };
}

declare let CodeMirror: any;

export function addIntellisense(editor:any) {
    $.ajax("./modules/ecmascript.json").done(function(code:any) {
        let server = new CodeMirror.TernServer({defs: [code]});
        editor.setOption("extraKeys", {
            "Ctrl-Space": function(cm:any) { /*server.complete(cm);*/ cm.showHint({hint: server.getHint, completeSingle:false}); },
            "Ctrl-I": function(cm:any) { server.showType(cm); },
            "Ctrl-O": function(cm:any) { server.showDocs(cm); },
            "Alt-.": function(cm:any) { server.jumpToDef(cm); },
            "Alt-,": function(cm:any) { server.jumpBack(cm); },
            "F2": function(cm:any) { server.rename(cm); },
            "Ctrl-.": function(cm:any) { server.selectName(cm); }
        })
        editor.on("cursorActivity", function(cm:any) { server.updateArgHints(cm); });
        var ExcludedIntelliSenseTriggerKeys:{[k: string]: string} =
        {
            "8": "backspace",
            "9": "tab",
            "13": "enter",
            "16": "shift",
            "17": "ctrl",
            "18": "alt",
            "19": "pause",
            "20": "capslock",
            "27": "escape",
            "32": "space",
            "33": "pageup",
            "34": "pagedown",
            "35": "end",
            "36": "home",
            "37": "left",
            "38": "up",
            "39": "right",
            "40": "down",
            "45": "insert",
            "46": "delete",
            "50": "quote",
            "91": "left window key",
            "92": "right window key",
            "93": "select",
            "107": "add",
            "109": "subtract",
            "110": "decimal point",
            "111": "divide",
            "112": "f1",
            "113": "f2",
            "114": "f3",
            "115": "f4",
            "116": "f5",
            "117": "f6",
            "118": "f7",
            "119": "f8",
            "120": "f9",
            "121": "f10",
            "122": "f11",
            "123": "f12",
            "144": "numlock",
            "145": "scrolllock",
            "186": "semicolon",
            "187": "equalsign",
            "188": "comma",
            "189": "dash",
            /*"190": "period",*/
            "191": "slash",
            "192": "graveaccent",
            "220": "backslash",
            "222": "quote"
        }

        editor.on("keyup", function(editor:any, event:any)
        {
            var __Cursor = editor.getDoc().getCursor();
            var __Token = editor.getTokenAt(__Cursor);

            let prevent = ['[',']','-','+','=','>','<','!','(',')','{','}'];

            if (!editor.state.completionActive && !(event.ctrlKey||event.altKey||event.shiftKey) &&
                !ExcludedIntelliSenseTriggerKeys[<string>(event.keyCode || event.which).toString()] && !(prevent.indexOf(__Token.string)!=-1)
                /*(__Token.type == "tag" || __Token.string == " " || __Token.string == "<" || __Token.string == "/")*/)
            {
                editor.showHint({hint: server.getHint, completeSingle:false});
            }
        });
    });
}
