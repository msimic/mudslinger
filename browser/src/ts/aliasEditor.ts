import { AliasManager } from "./aliasManager";
import { TrigAlEditBase, TrigAlItem } from "./trigAlEditBase";

export class AliasEditor extends TrigAlEditBase {
    constructor(private aliasManager: AliasManager) {
        super("Alias");
    }

    protected defaultPattern: string = null;

    protected defaultValue: string = 
              "Scrivi qui il valore dell'alias.\n"
            + "Puo' essere 1 o piu' comandi, includendo i parametri (e.g. $1).\n\n"
            + "Per gli alias non-regex, usa $1 nel valore per rappresentare l'argomento intero dato al commando.\n"
            + "Esempio: Alias pattern 's', alias valore 'say $1', "
            + "poi fai 's asadf dfdfa' e 'say asadf dfdfa' verra mandato.\n\n"
            + "Per alias regex, usa $numero per rappresentare i match del tuo regex.\n"
            + "Esempio: Alias pattern 's (\\w+)', alias valore 'say $1', "
            + "poi fai 's asadf' e 'say asadf' verra' mandato.";

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

    protected getList() {
        let aliases = this.aliasManager.aliases;
        let lst = [];
        for (let i = 0; i < aliases.length; i++) {
            lst.push((aliases[i].id || aliases[i].pattern)  + (aliases[i].class ? " <" + aliases[i].class + ">": ""));
        }

        return lst;
    }

    protected getItem(ind: number) {
        let aliases = this.aliasManager.aliases;
        if (ind < 0 || ind >= aliases.length) {
            return null;
        } else {
            return aliases[ind];
        }
    }

    protected saveItem(ind: number, alias: TrigAlItem) {
        if (ind < 0) {
            // New alias
            this.aliasManager.aliases.push(alias);
        } else {
            // Update alias
            this.aliasManager.aliases[ind] = alias;
        }
        this.aliasManager.saveAliases();
    }

    protected deleteItem(ind: number) {
        this.aliasManager.aliases.splice(ind, 1);
        this.aliasManager.saveAliases();
    }
}