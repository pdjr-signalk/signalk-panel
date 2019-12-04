class WidgetComponent {

    static createWidgetComponent(parentNode, type, params) {
        //console.log("createWidgetComponent(%s,%s,%s)...", parentNode, type, JSON.stringify(params));

        var retval = undefined;

        switch (type) {
            case "alert":
                retval = new AlertComponent(parentNode, params);
                break;
            case "scale":
                retval = new ScaleComponent(parentNode, params);
                break;
            case "cursor":
                retval = new CursorComponent(parentNode, params);
                break;
            case "text":
                retval = new TextComponent(parentNode, params);
                break;
            case "indicator":
                retval = new IndicatorComponent(parentNode, params);
                break;
            default:
                break;
        }

        return(retval);
    }

    constructor(parentNode, params) {
        this.parentNode = parentNode;
        this.params = params;

        this.tree = undefined;
        this.updateFunction = undefined;
    }

    getTree() {
        return(this.tree);
    }

    update(value) {
        if (this.updateFunction !== undefined) this.updateFunction(value);
    }

    resetAnimation(element) {
        element.style.animation = 'none';
        element.offsetHeight; /* trigger reflow */
        element.style.animation = null; 
    }

}

class AlertComponent extends WidgetComponent {

    constructor(parentNode, params) {
        //console.log("AlertComponent(%s,%s)...", parentNode, JSON.stringify(params));

        super(parentNode, params);

        try {

            // Update parentNode class membership
            //
            var alertClass = parentNode.id;
            parentNode.classList.add(alertClass);

            // Add event listener to parentNode so that alerts can be cancelled
            //
            parentNode.addEventListener("click", function(e) { 
                var elems = document.getElementsByClassName(alertClass);
                [...elems].forEach(e => {
                    if (parentNode.classList.contains("alert-cancelled")) {
                        e.classList.remove("alert-cancelled");
                    } else {
                        e.classList.add("alert-cancelled");
                    }
                });
            });

            var parentNode = parentNode;
            var params = params;
            super.updateFunction = function(v) {
                var test = params["alert-test"][0];
                var threshold = parseFloat(params["alert-threshold"]);
                var disabled = parseInt(params["alert-disabled"]);
                var elems = document.getElementsByClassName(alertClass);
                if (!disabled) {
                    if (((test == "lt") && (v < threshold)) || ((test == "eq") && (v == threshold)) || ((test == "gt") && (v > threshold))) {
                        [...elems].forEach(e => { e.classList.add("alert-active"); if (e != parentNode) e.classList.add("alert-cancelled"); });
                    } else {
                        [...elems].forEach(e => { e.classList.remove("alert-active"); e.classList.remove("alert-cancelled"); });
                    }
                } else {
                    parentNode.classList.add("alert-disabled");
                    [...elems].forEach(e => { e.classList.remove("alert-active"); e.classList.remove("alert-cancelled"); });
                }
            }
        } catch(e) {
        }
    }

}

class ScaleComponent extends WidgetComponent {

    constructor(parentNode, params) {
        //console.log("ScaleComponent(%s,%s)...", parentNode, params);

        super(parentNode, params);

        var direction = (parentNode.classList.contains("vertical"))?"vertical":"horizontal";
        var navigation = parentNode.classList.contains("navigation");

        var div = document.createElement("div");
        div.className = "widget-component widget-scale" + ((direction == "horizontal")?" widget-horizontal":" widget-vertical");

        var min = parseFloat(params.min) || 0;
        var max = parseFloat(params.max) || 100;
        var ticks = parseInt(params.ticks) || 10;

        for (var i = 0; i <= ticks; i++) {
            var tick = document.createElement("div");
            var tickValue = Number(min) + (((max - min) / ticks) * i);
            tick.setAttribute("data-tick-value", Math.abs(tickValue));
            tick.className = "widget-scale-tick";
            if (navigation && (tickValue < 0)) tick.classList.add("port");
            if (navigation && (tickValue > 0)) tick.classList.add("starboard");
            
            if (direction == "horizontal") {
                tick.style.width = ((i / ticks) * 100) + "%";
            } else {
                tick.style.height = ((i / ticks) * 100) + "%";
            }
            div.appendChild(tick); 
        }
        super.tree = div;
    }

}

class CursorComponent extends WidgetComponent {

    constructor(parentNode, params) {
        //console.log("CursorComponent(%s,%s)...", parentNode, params);

        super(parentNode, params);

        var direction = (parentNode.classList.contains("vertical"))?"vertical":"horizontal";

        var div = document.createElement("div");
        div.className = "widget-component widget-cursor " + ((direction == "horizontal")?"widget-horizontal":"widget-vertical");
        super.tree = div;

        var funcra = super.resetAnimation;
        var min = parseFloat(params.min) || 0;
        var max = parseFloat(params.max) || 100; 
        if (direction == "horizontal") {
            super.updateFunction = function(v) {
                v = Math.round(((v - min) / (max - min)) * 100);
                v = ((v < 0)?0:((v > 100)?100:v)); 
                div.style.width = v + "%";
                funcra(div);
            };
        } else {
            super.updateFunction = function(v) {
                v = Math.round(((v - min) / (max - min)) * 100);
                v = ((v < 0)?0:((v > 100)?100:v)); 
                div.style.height = v + "%";
                funcra(div);
            };
        }
    }

}

class TextComponent extends WidgetComponent {

    constructor(parentNode, params) {
        //console.log("TextComponent(%s,%s)...", parentNode, params);

        super(parentNode, params);

        var direction = (parentNode.classList.contains("vertical"))?"vertical":"horizontal";

        var table  = document.createElement("div");
        table.className = "widget-component widget-text";
        var cell = document.createElement("div");
        cell.className = "widget-text-cell timeout";
        table.appendChild(cell);
        var span = document.createElement("span");
        span.innerHTML = "???";
        var found = parentNode.innerHTML.match(/(.*)---(.*)/);
        if ((found) && (found.length >= 2)) cell.appendChild(document.createTextNode(found[1]));
        cell.appendChild(span);
        if ((found) && (found.length >= 3)) cell.appendChild(document.createTextNode(found[2]));
        super.tree = table;

        var rafunc = super.resetAnimation;
        super.updateFunction = function(v) {
            span.innerHTML = (v.charAt(0) == "-")?v.substr(1):v;
            rafunc(cell);
        }
    }

}

class IndicatorComponent extends WidgetComponent {

    constructor(parentNode, params) {
        //console.log("IndicatorComponent(%s,%s)...", parentNode, JSON.stringify(params));

        super(parentNode, params);

        var onclass = params.onclass || "widget-indicator-on";
        var onvalue = params.onvalue || "";
        var offclass = params.offclass || "widget-indicator-off";
        var offvalue = params.offvalue || ""
        var notification = parentNode.innerHTML.includes("---");

        var div = document.createElement("div");
        div.className = "widget-component " + ((notification)?"widget-notification":"widget-indicator");
        //var span = document.createElement("span"); 
        //span.innerHTML = "";
        //var found = parentNode.innerHTML.match(/(.*)---(.*)/);
        //if ((found) && (found.length >= 2)) div.appendChild(document.createTextNode(found[1]));
        //div.appendChild(span);
        //if ((found) && (found.length >= 3)) div.appendChild(document.createTextNode(found[2]));
        super.tree = div;

        var rafunc = super.resetAnimation;
        super.updateFunction = function(v) {
            if (v) {
                if (notification) div.innerHTML = onvalue;
                div.classList.remove(offclass);
                div.classList.add(onclass);
            } else {
                if (notification) div.innerHTML = offvalue;
                div.classList.remove(onclass);
                div.classList.add(offclass);
            }
        }
    }

}
