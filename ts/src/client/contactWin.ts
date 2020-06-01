import { apiPostContact } from "./apiUtil";


export class ContactWin {
    private $win: JQuery;

    private emailInput: HTMLInputElement;
    private textArea: HTMLTextAreaElement;
    private sendButton: HTMLButtonElement;
    private infoDiv: HTMLDivElement;

    constructor() {
        let win = document.createElement("div");
        win.style.display = "none";
        win.className = "winContact";
        document.body.appendChild(win);

        win.innerHTML = `
        <!--header-->
        <div>CONTACT</div>
        <!--content-->
        <div>
            <div style="display:flex;flex-direction:column;height:100%">
                <p>
                Use this form to report issues, make suggestions, or provide other feedback.
                If you would like a reply to your message, be sure to enter your email address.
                </p>
                </br>
                <div>Your email address (optional):</div>
                <input class="winContact-inpEmail">
                </br>
                <div>Your message: </div>
                <textarea class="winContact-text" style="flex:1;resize:none;height:100%"></textarea>
                <div class="winContact-info"></div>
                </br>
                <button class="winContact-btnSend" style="width:100%">SEND</button>
            </div>
        </div>
        `;

        this.$win = $(win);
        this.emailInput = win.getElementsByClassName("winContact-inpEmail")[0] as HTMLInputElement;
        this.textArea = win.getElementsByClassName("winContact-text")[0] as HTMLTextAreaElement;
        this.sendButton = win.getElementsByClassName("winContact-btnSend")[0] as HTMLButtonElement;
        this.infoDiv = win.getElementsByClassName("winContact-info")[0] as HTMLDivElement;

        (<any>this.$win).jqxWindow({width: 450, height: 400});
        $(this.sendButton).click(this.handleSendButtonClick.bind(this));
    }

    private handleSendButtonClick() {
        this.infoDiv.textContent = "";

        let msg = this.textArea.value;
        if (msg.trim() === "") {
            this.infoDiv.textContent = "Please enter a message!";
            this.infoDiv.style.color = "red";
            return;
        }

        let email = this.emailInput.value;

        this.emailInput.disabled = true;
        this.textArea.disabled = true;
        this.sendButton.disabled = true;

        this.infoDiv.textContent = "Sending message...";
        this.infoDiv.style.color = "";

        (async() => {
            try {
                let resp = await apiPostContact(msg, email);
                if (resp.data.sent) {
                    this.infoDiv.textContent = "Message was sent! Thanks for the feedback.";
                    this.infoDiv.style.color = "";
                    this.textArea.value = "";
                } else {
                    throw "";
                }
            } catch(err) {
                this.infoDiv.textContent = "Message could not be sent...Please try again later.";
                this.infoDiv.style.color = "red";
            }
            this.emailInput.disabled = false;
            this.textArea.disabled = false;
            this.sendButton.disabled = false;
        })();
    }

    public show() {
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
