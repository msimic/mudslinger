export class StatusWin {
    private $win: JQuery;

    constructor() {
        let win = document.createElement("div");
        win.style.display = "none";
        win.className = "winStatus";
        document.body.appendChild(win);

        win.innerHTML = `
        <!--header-->
        <div>STATUS</div>
        <!--content-->
        <div></div>
        `;

        this.$win = $(win);

        (<any>this.$win).jqxWindow({
            isModal: true,
            showCloseButton: false,
            keyboardCloseKey: '' // to prevent close
        });
    }

    public setContent(val: string) {
        (<any>this.$win).jqxWindow({"content": val});
    }

    public show() {
        (<any>this.$win).jqxWindow("open");
        (<any>this.$win).jqxWindow("bringToFront");
    }

    public destroy() {
        (<any>this.$win).jqxWindow("destroy");
    }
}
