
export function messagebox(title: string, text: string, callback:(val:string)=>void, okbuttontext:string, cancelbuttontext:string, width:number, height:number): any {

    let win = document.createElement("div");
    win.style.display = "none";
    win.className = "winMessagebox";
    document.body.appendChild(win);
    okbuttontext = okbuttontext == undefined ? "OK" : okbuttontext;
    cancelbuttontext = cancelbuttontext == undefined ? "Annulla" : cancelbuttontext;

    win.innerHTML = `
    <!--header-->
    <div id="title"></div>
    <!--content-->
    <div>
        <div>
            <div class="messageboxtext" id="message">
                
            </div>
            <div class="messageboxbuttons">
                <button id="accept" class="acceptbutton greenbutton"></button>
                <button id="cancel" class="cancelbutton redbutton"></button>
            </div>
        </div>
    </div>
    `;
    
    let $win = $(win);
    let result = "";

    const acceptButton = $("#accept", $win);
    const cancelButton = $("#cancel", $win);
    const titleText = $("#title", $win);
    const messageText = $("#message", $win);

    (<any>$win).jqxWindow({minWidth: width || 250, minHeight: height || 150, showCollapseButton: false, isModal: true, resizable: false});

    $(acceptButton).text(okbuttontext);
    if (!okbuttontext) $(acceptButton).hide();
    $(cancelButton).text(cancelbuttontext);
    if (!cancelbuttontext) $(cancelButton).hide();

    $(acceptButton).click(() => {
        result = (okbuttontext);
        (<any>$win).jqxWindow("close");
    });
    $(cancelButton).click(() => {
        result = (cancelbuttontext);
        (<any>$win).jqxWindow("close");
    });
    $(titleText).text(title);
    $(messageText).html(text.replace(/\n/g, "<br/>"));

    (<any>$win).jqxWindow("open");
    (<any>$win).jqxWindow('bringToFront');
    (<any>$win).on("close", () => {
        if (callback) callback(result);
        (<any>$win).jqxWindow("destroy");
    });

    $(acceptButton).focus();

    if (!height) {
        (<any>$win).find('.jqx-window-content').append('<div id="bottomOfContent"></div>');

        // get new height based on position of marker
        var newHeight = $(messageText).height() + $('.messageboxbuttons', $win).height() + 50;

        // apply new height
        (<any>$win).jqxWindow({height: newHeight});
    }
}