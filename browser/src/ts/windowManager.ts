import { CustomWin } from "./customWindow";
import { ProfileManager } from "./profileManager";

export interface WindowDefinition {
    name: string;
    window: JQuery;
    output: CustomWin;
}

export class WindowManager {

    private windows: Map<string, WindowDefinition> = new Map<string, WindowDefinition>();

    constructor(private profileManager:ProfileManager) {
    }

    public createWindow(name:string):WindowDefinition {

        if (this.windows.has(name)) {
            return this.windows.get(name);
        }

        let win = document.createElement("div");
        win.style.display = "none";
        win.className = "win-"+name + " customWindow";
        document.body.appendChild(win);

        win.innerHTML = `
        <!--header-->
        <div>${name}</div>
        <!--content-->
        <div>
            <div class="${$("#winOutput")[0].classList}" id="win-${name}"></div>
        </div>
        `;

        const $win = $(win);
        const w = (<any>$win).jqxWindow({width: 450, height: 150, showCollapseButton: true});
        const winOutput = new CustomWin("win-"+name, this.profileManager.activeConfig)

        const def: WindowDefinition = {
            name: name,
            window: w,
            output: winOutput
        }
        this.windows.set(name, def);
        this.show(name);
        return def;
    }

    public show(window:string) {
        var w = this.windows.get(window);
        (<any>w.window).jqxWindow("open");
        (<any>w.window).jqxWindow('bringToFront');
    }

    private hide(window:string) {
        var w = this.windows.get(window);
        (<any>w.window).jqxWindow("close");
    }
}
