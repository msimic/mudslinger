import { TrigAlEditBase, TrigAlItem } from "./trigAlEditBase";
import { TriggerManager } from "./triggerManager";

export class TriggerEditor extends TrigAlEditBase {
    constructor(private triggerManager: TriggerManager) {
        super("Triggers");
    }

    protected defaultValue: string =
         "Scrivi qui il valore del tuo trigger.\n"
        + "Puo' essere 1 o piu' comandi, includento di parametri (e.g. $1) per trigger regex.\n\n"
        + "Per trigger regex, usa $numero per rappresentare i match della tua regex.\n"
        + "Esempio: Trigger pattern '(\\w+) e' arrivato.', trigger value 'say Ciao $1', "
        + "in seguito se 'Vodur e' arrivato.' arriva dal mud, 'say Ciao Vodur' verra' mandato.";

    protected defaultScript: string =
    "/* Scrivi la tua script qui.\n"
    + "Questo e' il codice javascript che verra eseguito quando l'alias viene lanciato.\n"
    + "Non puoi creare variabili globali.\n"
    + "Usa 'var' per creare variabili locali.\n"
    + "Aggiungi valori a 'this' per interagire tra piu script.\n"
    + "Esempio: this.mio_valore = 123;\n"
    + "Ogni script lanciata usa lo stesso 'this'.\n"
    + "\n"
    + "Usa la funzione send() per lanciare comandi al mud. Esempio: send('kill orc');\n"
    + "Usa la funzione print() per per echo in locale. Esempio: print('Arrivato un avversario!!');\n"
    + "Per alias regex, 'match' sara il l'array risultato di match della regex, con \n"
    + "gli indici che sono i gruppi della regex.\n"
    + "*/\n";

    protected defaultPattern: string = null;

    protected getList() {
        let triggers = this.triggerManager.triggers;
        let lst = [];
        for (let i = 0; i < triggers.length; i++) {
            lst.push((triggers[i].id || triggers[i].pattern) + (triggers[i].class ? " <" + triggers[i].class + ">": ""));
        }

        return lst;
    }

    protected getItem(ind: number) {
        let triggers = this.triggerManager.triggers;
        if (ind < 0 || ind >= triggers.length) {
            return null;
        } else {
            return triggers[ind];
        }
    }

    protected saveItem(ind: number, trigger:TrigAlItem) {
        if (ind < 0) {
            // New trigger
            this.triggerManager.triggers.push(trigger);
        } else {
            // Update trigger
            this.triggerManager.triggers[ind] = trigger;
        }
        this.triggerManager.saveTriggers();
    }

    protected deleteItem(ind: number) {
        this.triggerManager.triggers.splice(ind, 1);
        this.triggerManager.saveTriggers();
    }
}