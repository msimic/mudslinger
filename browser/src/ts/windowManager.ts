import { CustomWin } from "./customWindow";
import { EventHook } from "./event";
import { ProfileManager } from "./profileManager";

export interface WindowData {
    name: string;
    x:number;
    y:number;
    w:number;
    h:number;
    visible:boolean;
    collapsed:boolean;
}

export interface WindowDefinition {
    window: JQuery;
    output: CustomWin;
    data: WindowData
}

export class WindowManager {

    public windows: Map<string, WindowDefinition> = new Map<string, WindowDefinition>();
    public EvtEmitWindowsChanged = new EventHook<string[]>();

    constructor(private profileManager:ProfileManager) {
        profileManager.evtProfileChanged.handle((ev:{[k: string]: any})=>{
            this.load();
        });
        this.load();
    }

    public load() {
        let cp:string;
        if (!(cp = this.profileManager.getCurrent())) {
            this.deleteWindows();
            return;
        }

        let wnds = this.profileManager.getProfile(cp).windows;

        this.deleteWindows();

        if (wnds) for (const iterator of wnds) {
            this.windows.set(iterator.name, {
                window: null,
                output: null,
                data: iterator
            });
        }
        this.triggerChanged();
    }

    public triggerChanged() {
        this.EvtEmitWindowsChanged.fire([...this.windows.keys()]);
    }

    profileDisconnected() {
        for (const w of this.windows) {
            if (w[1].window) {
                w[1].window.hide();
            }
        }
    }

    profileConnected() {
        for (const w of this.windows) {
            if (w[1].data.visible) {
                let wnd = this.createWindow(w[1].data.name);
                wnd.window.show();
            }
        }
    }

    private deleteWindows() {
        this.windows.forEach((v, k) => {
            if (v.window)
                (<any>v.window).jqxWindow("destroy");
            if (v.output)
                delete v.output;
        });
        this.windows.clear();
    }

    public createWindow(name:string):WindowDefinition {

        if (this.windows.has(name) && this.windows.get(name).output) {
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

        const defaults = this.windows.get(name);

        const w = (<any>$win).jqxWindow({width: 450, height: 150, showCollapseButton: true, autoOpen: false});

        if (defaults && defaults.data) {
            (<any>$win).jqxWindow('move', defaults.data.x, defaults.data.y);
            (<any>$win).jqxWindow('resize', defaults.data.w, defaults.data.h);
        }

        let self = this;
        w.on('moved', function (event:any) {
            let data = self.windows.get(name).data;
            data.x = event.args.x;
            data.y = event.args.y;
            self.save();
        });

        w.on('resized', function (event:any) {
            let data = self.windows.get(name).data;
            data.w = event.args.width;
            data.h = event.args.height;
            self.save();
        });

        w.on('open', function (event:any) {
            if (!$(event.target).data("firsttime")) {
                $(event.target).data("firsttime",true);
                if (defaults && defaults.data) {
                    if (defaults.data.collapsed) {
                        setTimeout(() => { (<any>w).jqxWindow('collapse'); }, 200);
                    }
                }
            }
            let data = self.windows.get(name).data;
            data.visible = true;
            self.save();
        });

        w.on('close', function (event:any) {
            let data = self.windows.get(name).data;
            data.visible = false;
            self.save();
        });

        w.on('collapse', function (event:any) {
            let data = self.windows.get(name).data;
            data.collapsed = true;
            self.save();
        });

        w.on('expand', function (event:any) {
            let data = self.windows.get(name).data;
            data.collapsed = false;
            self.save();
        });

        const winOutput = new CustomWin("win-"+name, this.profileManager.activeConfig)

        const def: WindowDefinition = {
            window: w,
            output: winOutput,
            data: {
                name: name,
                w: 450,
                h: 150,
                x: 100,
                y: 100,
                visible: true,
                collapsed: false
            }
        }
        this.windows.set(name, def);

        if ((defaults && defaults.data.visible)||!defaults) {
            this.show(name);
        }

        if (defaults && defaults.data.collapsed) {
            (<any>$win).jqxWindow('collapse');
        }
        
        def.data.w = w.jqxWindow('width');
        def.data.w = w.jqxWindow('height');
        let pos = w.offset();
        def.data.x = pos.left;
        def.data.y = pos.top;
        def.data.collapsed = w.jqxWindow('collapsed');
        def.data.visible = true;

        this.save();

        this.EvtEmitWindowsChanged.fire([...this.windows.keys()]);
        return def;
    }

    public save() {
        var wnds = [...this.windows.values()].map(v => v.data);
        this.profileManager.saveWindows(wnds);
    }

    public show(window:string) {
        var w = this.windows.get(window);
        if (!w.output) {
            w = this.createWindow(window);
        }
        (<any>w.window).jqxWindow("open");
        (<any>w.window).jqxWindow('bringToFront');
    }

    private hide(window:string) {
        var w = this.windows.get(window);
        (<any>w.window).jqxWindow("close");
    }
}
