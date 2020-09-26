import { Profile, ProfileManager } from "./profileManager";
import { messagebox } from "./messagebox";
import { ProfileWindow } from "./profileWindow";
import { Client } from "./client";
import { Acknowledge } from "./util";
import { Mudslinger } from "./client";

export class ProfilesWindow {
    private $win: JQuery;

    private profileList: JQuery;
    private createButton: HTMLButtonElement;
    private editButton: HTMLButtonElement;
    private deleteButton: HTMLButtonElement;
    private connectButton: HTMLButtonElement;

    constructor(private manager:ProfileManager, private profileWin:ProfileWindow, private client:Client) {
        let win = document.createElement("div");
        win.style.display = "none";
        win.className = "winProfiles";
        document.body.appendChild(win);

        win.innerHTML = `
        <!--header-->
        <div>Profilo / Personaggio</div>
        <!--content-->
        <div>
            <div style="display:flex;flex-direction:column;height:100%">
                <div>
                    <div class="select-box">
                        <div class="inner-box">       
                        <label for="profiles" class="label select-box1"><span class="label-desc"></span> </label>
                        <select id="profiles" size=1" class="dropdown winProfiles-profiles"></select>
                        </div>
                    </div>
                    <div id='jqxComboBox'></div>
                </div>
                <div>
                    <button title="Crea profilo" class="winProfiles-crea greenbutton">+</button>
                    <button title="Cancella selezionato" class="winProfiles-elimina redbutton">X</button>
                    <button title="Modifica selezionato" class="winProfiles-modifica yellowbutton">...</button>
                    <button class="winProfiles-connect bluebutton">Connettiti</button>
                </div>
            </div>
        </div>
        `;

        this.$win = $(win);

        $(document).mouseup(function (e)
        {
            var container = $(".select-box");

            if (container.has(e.target).length === 0)
            {
                container.removeClass("open");
            }
        });


        $("select", this.$win).on("click" , function() {
  
            $(this).parent(".select-box").toggleClass("open");
            
          });

        $("select", this.$win).on("change" , function() {
  
            var selection = $(this).find("option:selected").text(),
                labelFor = $(this).attr("id"),
                label = $("[for='" + labelFor + "']");
              
            label.find(".label-desc").html(selection);
              
          });

          $("select", this.$win).on("focus" , function() {
            $(this).parent().addClass("focused");  
          });

          $("select", this.$win).on("blur" , function() {
            $(this).parent().removeClass("focused");              
          });

        this.profileList = $(win.getElementsByClassName("winProfiles-profiles")[0] as HTMLSelectElement);
        this.createButton = win.getElementsByClassName("winProfiles-crea")[0] as HTMLButtonElement;
        this.editButton = win.getElementsByClassName("winProfiles-modifica")[0] as HTMLButtonElement;
        this.deleteButton = win.getElementsByClassName("winProfiles-elimina")[0] as HTMLButtonElement;
        this.connectButton = win.getElementsByClassName("winProfiles-connect")[0] as HTMLButtonElement;
        this.profileList.width("100%");
        this.load();
        
        (<any>this.$win).jqxWindow({width: 270, height: 120, showCollapseButton: true});
        $(this.createButton).click(this.handleNew.bind(this));
        $(this.connectButton).click(this.handleConnectButtonClick.bind(this));
        $(this.editButton).click(this.handleEditButtonClick.bind(this));
        $(this.deleteButton).click(this.handleDeleteButtonClick.bind(this));
    }

    private load() {
        this.profileList.empty();
        let base = $(`<option value="">[Profilo Base]</option>`);
        this.profileList.append(base);

        for (const iterator of this.manager.getProfiles()) {
            const selected = this.manager.getCurrent() == iterator ? "selected" : "";
            $(this.profileList).append(`<option value="${iterator}" ${selected}>${iterator}</option>`);
        }

        let nuovo = $(`<option value="-1">&lt;... Crea nuovo ...&gt;</option>`);
        this.profileList.append(nuovo);

        this.profileList.val(this.manager.getCurrent()).change();
        this.profileList.change(() => { 
            var val = this.profileList.val();
            this.handleSelectClick(val);
        });
    }

    private profileCreateChar:string = `Creare un profilo non vuol dire create un personaggio.
    I personaggi devono essere creati nel terminale del gioco.
    
    Un profilo viene legato a uno (o piu') personaggi gia esistenti.
    
    Il profilo base connette sempre al server live. E puo' contenere alias e trigger
    basilari usabili da tutti gli altri profili. Premi il bottone per modificare il profilo
    base per ulteriori informazioni.`;

    private handleNew() {
        const prof = new Profile();
        this.load();
        this.profileWin.show(prof, (p) => {
            prof.pass = Mudslinger.encrypt(prof.pass);
            this.manager.create(prof);
            this.load();
        });
    }

    private handleSelectClick(val:string) {
        if (val == "-1") {
            this.handleNew();
        }
    }

    private handleConnectButtonClick() {
        if (this.profileList.val() != "-1") this.manager.setCurrent(this.profileList.val());
        let connectProfile = () => {
            if (!this.manager.getCurrent()) {
                this.client.connect({host: "mud.temporasanguinis.it", port: 4000});
                this.hide();
            } else {
                const cp = this.manager.getProfile(this.manager.getCurrent());
                this.client.connect({host: cp.host, port: Number(cp.port)});
                this.hide();
            }
        };

        if (this.client.connected) messagebox("Avvertenza", `Sei gia' connesso.

            Se preferisci disconnetterti in modo normale dal gioco premi No.
            Se invece vuoi forzare la disconessione premi Si.

            <b>Vuoi forzare la disconessione?</b>
            `, (v) => {
                if (v == "Si") {
                    this.client.disconnect();
                    connectProfile();
                }
            }, "No", "Si", 480, null);
        else {
            connectProfile();
        }
    }

    private handleEditButtonClick() {
        if (!this.profileList.val()) {
            messagebox("Avvertenza", `Il profilo base non puo' essere modificato.
            Esso connette al server principale senza nessun autologin.
            Quello che puo' essere fatto e' importare i trigger e alias raccomandati.

            N.b.: Gli alias e trigger del profilo base sono acessibili in tutti i profili/personaggi.
                  Si puo' sopprimere i trigger e alias di base con alias e trigger di pattern identico
                  creati nel profilo privato del personaggio.

            <b>Vuoi importare i trigger e alias raccomandati nel profilo base?</b>
            `, () => {}, "Si", "No", 480, null);
        } else {
            const prof = this.manager.getProfile(this.profileList.val());
            const oldName = this.profileList.val();
            const oldPass = prof.pass;
            this.profileWin.show(prof, (p) => {
                if (oldPass != p.pass) {
                    p.pass = Mudslinger.encrypt(p.pass);
                }
                if (oldName != p.name) {
                    this.manager.rename(p, oldName);
                } else {
                    this.manager.saveProfiles();
                }
                this.load();
            });
        }
    }

    private handleDeleteButtonClick() {
        if (this.profileList.val()=="-1") { return;}
        if (!this.profileList.val()) {
            messagebox("Avvertenza",
            `Il profilo base non puo' essere cancellato.
            Se volevi cancellare un'altro profilo, prima selezionalo.
            `, () => {}, "Ok", "", 280, 140);
        } else {
            messagebox("Domanda",
            `<b>Sei sicuro di voler cancellare
            il profilo <u>${this.profileList.val()}</u></b>?

            N.B: un profilo cancellato cancella anche i trigger e gli alias in esso.
                 Non c'e' modo di recuperarlo una volta cancellato.
            `, (v) => {
                if (v == "Si") {
                    this.manager.delete(this.manager.getProfile(this.profileList.val()));
                    this.load();
                }
            }, "Si", "No", 380, null);
        }
    }

    public show() {
        this.load();
        Acknowledge("profileCreateChar", this.profileCreateChar);
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
