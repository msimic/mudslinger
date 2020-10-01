import { Mudslinger } from "./client";
import { EventHook } from "./event";
import { UserConfig } from "./userConfig";
import { messagebox } from "./messagebox";
import { AppInfo } from "./appInfo";
import { WindowData } from "./windowManager";

export class Profile {
    public name:string;
    public host:string;
    public port:string;
    public autologin: boolean;
    public char:string;
    public pass:string;
    public windows:WindowData[];
}

export class ProfileManager {
    private appInfo = AppInfo;
    public evtProfileChanged = new EventHook<{[k: string]: any}>();
    private _current : string = null;
    private _activeConfig:UserConfig = new UserConfig();
    private profiles:Map<string,Profile> = new Map<string,Profile>();
    private configs:Map<string,UserConfig> = new Map<string,UserConfig>();

    public constructor(private baseConfig:UserConfig) {
        this.load();
    }

    private activeChanged = (v:string):string => {
        const ac = this.getCurrentConfig();
        ac.copy(v);
        return v;
    }

    public saveWindows(windows:WindowData[]) {
        if (!this._current) return;

        var p = this.getProfile(this.getCurrent());
        p.windows = windows;
        this.saveProfiles();
    }

    public get activeConfig():UserConfig {
        return this._activeConfig;
    }

    public load() {
        const pstr = localStorage.getItem("profiles");
        let last = localStorage.getItem("lastProfile");
        if (pstr) {
            try {
                this.profiles = new Map(JSON.parse(pstr));
                for (const iterator of this.profiles) {
                    this.configs.set(iterator[0], this.createConfig(localStorage.getItem("config_" + iterator[0]), iterator[0]));
                }
            } catch (err) {
                messagebox("Errore", "Non riesco a leggere i profili", null, "Ok", "", null, null);
            }
        }
        if (last && !this.profiles.has(last)) {
            last = "";
            messagebox("Errore", "Non riesco a trovare il profilo usato precedentemente. Uso il base.", null, "Ok", "", null, null);
        }
        this.setCurrent(last ?? "");
    }

    private saveConfigToStorage(key:string): (val: string) => string {
        return (val: string):string => {
            localStorage.setItem("config_" + key, val);
            this.saveProfiles();
            return val;
        };
    }

    public getProfile(name:string):Profile {
        return this.profiles.get(name);
    }

    public getProfiles():string[] {
        let profiles:string[] = [];
        this.profiles.forEach((v,k)=>{
            profiles.push(k);
        });
        return profiles;
    }

    public setCurrent(name:string) {
        if (this._current != name) {
            this._current = name;
            // todo raise events
            this.evtProfileChanged.fire({current: name});
            this.saveProfiles();
            this.activeConfig.init(this.getCurrentConfig().saveConfig(), this.activeChanged);
            this.setTitle();
        }
    }

    public setTitle() {
        if (this._current) {
            document.title = `${this.appInfo.AppTitle} - ${this._current}`;
        } else {
            document.title = `${this.appInfo.AppTitle} - Server Live`;
        }
    }

    public getCurrent():string {
        return this._current;
    }
    
    private createConfig(str:string, val:string):UserConfig {
        const cfg = new UserConfig();
        cfg.init(str,this.saveConfigToStorage(val));
        Mudslinger.setDefaults(cfg);
        return cfg;
    }

    public create(profile:Profile) {
        this.profiles.set(profile.name, profile);
        const cfg = this.createConfig(null, profile.name);
        this.configs.set(profile.name, cfg);
        this.setCurrent(profile.name);
        this.saveProfiles();
    }

    public rename(profile:Profile, oldname:string) {
        var cfg = this.getConfigFor(oldname);
        if (cfg) {
            const cfgValues = cfg.saveConfig();
            cfg.init(cfgValues,this.saveConfigToStorage(profile.name));
        } else  {
            cfg = this.createConfig(null, profile.name);
        }
        this.configs.delete(oldname);
        localStorage.removeItem("config_" + oldname);
        this.profiles.delete(oldname);
        this.profiles.set(profile.name, profile);
        this.configs.set(profile.name, cfg);
        this.saveProfiles();
        if (this._current == oldname) {
            this.setCurrent(profile.name);
        }
        this.load();
    }

    public delete(profile:Profile) {
        this.configs.delete(profile.name);
        this.profiles.delete(profile.name);
        localStorage.removeItem("config_" + profile.name);
        if (this._current == profile.name)
            this.setCurrent("");

        this.saveProfiles();
        this.load();
    }

    public getCurrentConfig():UserConfig {
        if (!this._current) return this.baseConfig;
        return this.configs.get(this._current);
    }

    public getConfigFor(name:string):UserConfig {
        if (!name) return this.baseConfig;
        return this.configs.get(name);
    }

    private inSaving = false;
    public saveProfiles() {
        if (this.inSaving) return;
        this.inSaving = true;
        try {
            localStorage.setItem("profiles", JSON.stringify([...this.profiles]));
            localStorage.setItem("lastProfile", this._current);
            this.configs.forEach((v) => {
                v.saveConfig();
            });
        } finally {
            this.inSaving = false;
        }
    }
}
