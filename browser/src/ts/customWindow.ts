import { ConfigIf, OutWinBase } from "./outWinBase";
import { stripHtml } from "./util";

export class CustomWin extends OutWinBase {
    constructor(elementName:string, config: ConfigIf) {
        super($("#"+elementName), config);
    }

    public write(text:string, buffer:string) {
        this.lineText = text.indexOf("<span")!=-1 ? stripHtml(text) : text;
        this.appendBuffer = buffer;
        this.appendToCurrentTarget(this.appendBuffer);
        this.newLine();
        this.outputDone();
    }

    public writeLine(text:string, buffer:string) {
        this.lineText = text.indexOf("<span")!=-1 ? stripHtml(text) : text;
        this.appendBuffer = buffer+"<br>";
        this.appendToCurrentTarget(this.appendBuffer);
        this.newLine();
        this.outputDone();
    }
}