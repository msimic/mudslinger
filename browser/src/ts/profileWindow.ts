import { Profile, ProfileManager } from "./profileManager";
import { messagebox } from "./messagebox";

export class ProfileWindow {
    private $win: JQuery;

    private $name: JQuery;
    private $char: JQuery;
    private $pass: JQuery;
    private $serverList: JQuery;
    private $autoLogin: JQuery;
    private okButton: HTMLButtonElement;
    private cancelButton: HTMLButtonElement;
    private profile:Profile;
    private callback:(profile:Profile) => void;

    constructor(private manager:ProfileManager) {
        let win = document.createElement("div");
        win.style.display = "none";
        win.className = "winProfile";
        document.body.appendChild(win);

        win.innerHTML = `
        <!--header-->
        <div>Profilo</div>
        <!--content-->
        <div>
            <div style="display:flex;flex-direction:column;height:100%">
                <div>
                    <input id="nomeprofilo" title="Il nome del profilo" placeholder="&lt;Il nome del profilo&gt;"type="text"/>
                    <div class="select-box">       
                        <label for="serverName" class="label select-box1"><span class="label-desc"></span> </label>
                        <select id="serverName" size=1" class="dropdown serverName">
                        </select>
                    </div>
                    <div id='jqxComboBox'></div>
                    <input id="nomepg" title="Il nome del personaggio" placeholder="&gt;Il nome del personaggio&lt;" type="text"/>
                    <input id="password" title="La password del personaggio" placeholder="&lt;Password: opzionale se non vuoi autologin&gt;" type="password"/>
                    <label>
                        Autologin
                        <input type="checkbox" class="winProfile-autologin" />
                    </label>
                </div>
                <div class="messageboxbuttons">
                    <button title="Applica" class="acceptbutton greenbutton">Accetta</button>
                    <button title="Annulla" class="cancelbutton redbutton">Annulla</button>
                </div>
            </div>
        </div>
        `;

        this.$win = $(win);
        this.$autoLogin = $(".winProfile-autologin", this.$win);

        $("select", this.$win).on("click" , function() {
  
            $(this).parent(".select-box").toggleClass("open");
            
          });

        $("select", this.$win).on("change" , function() {
  
            var selection = $(this).find("option:selected").text(),
                labelFor = $(this).attr("id"),
                label = $("[for='" + labelFor + "']");
              
            label.find(".label-desc").html(selection);
              
          });


        this.$serverList = $(win.getElementsByClassName("serverName")[0] as HTMLSelectElement);
        this.$name = $("#nomeprofilo", this.$win);
        this.$char = $("#nomepg", this.$win);
        this.$pass = $("#password", this.$win);
        this.okButton = win.getElementsByClassName("acceptbutton")[0] as HTMLButtonElement;
        this.cancelButton = win.getElementsByClassName("cancelbutton")[0] as HTMLButtonElement;
        
        (<any>this.$win).jqxWindow({width: 370, height: 220, showCollapseButton: true});
        $(this.okButton).click(this.handleOk.bind(this));
        $(this.cancelButton).click(this.handleCancelClick.bind(this));
    }

    private handleOk() {
        if (!this.$name.val() || this.$name.val().length < 3) {
            this.handleError("Il profilo deve avere almeno 3 caratteri!");
            return;
        }
        if (this.$autoLogin.prop("checked")==true && (!this.$char.val() || this.$char.val().length < 3)) {
            this.handleError("Se usi autologin devi dare il nome del pg (con almeno tre lettere).");
            return;
        }
        if (this.$autoLogin.prop("checked")==true && (!this.$pass.val() || this.$pass.val().length < 3)) {
            this.handleError("Se usi autologin devi dare la password del pg (con almeno tre lettere).");
            return;
        }
        this.apply();
        this.hide();
        this.callback(this.profile);
    }

    private handleCancelClick() {
        this.hide();
    }

    private handleError(error:string) {
            messagebox("Errore", `
            <b>${error}</b>
            `, () => {}, "Ok", "", 380, null);
    }

    private apply() {
        this.profile.host = "mud.temporasanguinis.it";
        if (this.$serverList.val() == "Live") {
            this.profile.port = "4000";
        } else {
            this.profile.port = "6000";
        }
        this.profile.autologin = this.$autoLogin.prop('checked');
        this.profile.name = this.$name.val();
        this.profile.char = this.$char.val();
        this.profile.pass = this.$pass.val();
    }

    private load() {
        let serverName = this.profile.port == "6000" ? "Tester" : "Live";
        this.$serverList.empty();
        let base = $(`<option value="Live" ${serverName=="Live"?"selected":""}>Live</option>`);
        this.$serverList.append(base);
        let test = $(`<option value="Test" ${serverName=="Tester"?"selected":""}>Tester</option>`);
        this.$serverList.append(test);
        this.$serverList.val(serverName).change();
        this.$autoLogin.prop('checked', this.profile.autologin);
        this.$name.val(this.profile.name ?? "");
        this.$char.val(this.profile.char ?? "");
        this.$pass.val(this.profile.pass ?? "");
    }

    public show(profile:Profile, callback:(profile:Profile) => void) {
        this.profile = profile;
        this.callback = callback;
        this.load();
        (<any>this.$win).jqxWindow("open");
        (<any>this.$win).jqxWindow('bringToFront');
    }

    public destroy() {
        (<any>this.$win).jqxWindow("destroy");
    }

    private hide() {
        (<any>this.$win).jqxWindow("close");
    }
}
