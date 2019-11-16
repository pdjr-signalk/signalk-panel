class Overlay {

    static createOverlay(source) {
        return(new Overlay(source));
    }

    constructor(source) {
        //console.log("Overlay(%s)...", source);

        this.overlay = document.getElementById("overlay");
        this.container = document.getElementById("overlay-container");
        this.sources = (Array.isArray(source))?source:[source];
        this.currentObject = undefined;

        var _this = this;
        var es = document.getElementsByClassName("overlay-close");
        [...es].forEach(e => { e.addEventListener("click", function(e) { _this.close(); }); }); 
        var es = document.getElementsByClassName("overlay-next");
        [...es].forEach(e => { e.addEventListener("click", function(e) { _this.displaySource("next"); }); }); 
        var es = document.getElementsByClassName("overlay-prev");
        [...es].forEach(e => { e.addEventListener("click", function(e) { _this.displaySource("prev"); }); }); 

        this.displaySource();
        this.overlay.style.display = "flex";
    }

    displaySource(which=undefined) {
        //console.log(JSON.stringify(this.sources));

        this.closeCurrentSource();
        if (which == "next") this.sources.push(this.sources.shift());
        if (which == "prev") this.sources.unshift(this.sources.pop());
        if (typeof this.sources[0] == "function") {
            this.currentObject = this.sources[0]();
            this.container.appendChild(this.currentObject.getTree());
        } else {
            this.currentObject = undefined;
            this.container.innerHTML = this.httpGet(this.sources[0]);
        }

        var titles = document.querySelectorAll('[data-overlay-title]');
        var title = (titles.length > 0)?titles[0].getAttribute("data-overlay-title"):"***";
        var span = document.getElementById('overlay-title');
        while (span.firstChild) span.removeChild(span.firstChild );
        span.appendChild(document.createTextNode(title));
    }

    closeCurrentSource() {
        if (this.container.firstChild) this.container.removeChild(this.container.firstChild );
        if (this.currentObject !== undefined) { this.currentObject.onClose(); this.currentObject = undefined; }
    }

    close() {
        this.closeCurrentSource();
        this.overlay.style.display = "none";
    }

    loadHTML(container, url, classname, callback) {
        if (container) {
            this.httpGetAsync(url, (content) => {
                if (content) {
                    container.innerHTML = content;
                    if (classname) container.classname = classname;
                    if (callback) callback(container);
                }
            });
        }
    }

    httpGetAsync(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) callback(xmlHttp.responseText);
        }
        xmlHttp.open("GET", theUrl, true); // true for asynchronous 
        xmlHttp.send(null);
    }

    httpGet(theUrl) {
        //console.log("httpGet(%s)...", theUrl);

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
        xmlHttp.send( null );
        return xmlHttp.responseText;
    }

}
