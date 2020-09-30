import { ConfigIf, OutWinBase } from "./outWinBase";

export class CustomWin extends OutWinBase {
    constructor(elementName:string, config: ConfigIf) {
        super($("#"+elementName), config);
    }

    public write(text:string, buffer:string) {
        this.lineText = text;
        this.appendBuffer = buffer;
        this.appendToCurrentTarget(buffer);
        this.newLine();
        this.outputDone();
    }
}