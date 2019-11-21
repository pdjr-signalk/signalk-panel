class WidgetComponent {

    static createWidgetComponent(parentNode, type, parameters, getFilterFunction) {
        //console.log("createWidgetComponent(%s,%s,%s)...", parentNode, type, JSON.stringify(parameters));

        var retval = undefined;

        switch (type) {
            case "alert":
                retval = new AlertComponent(parentNode, parameters, getFilterFunction);
                break;
            case "scale":
                retval = new ScaleComponent(parentNode, parameters, getFilterFunction);
                break;
            case "cursor":
                retval = new CursorComponent(parentNode, parameters, getFilterFunction);
                break;
            case "text":
                retval = new TextComponent(parentNode, parameters, getFilterFunction);
                break;
            case "indicator":
                retval = new IndicatorComponent(parentNode, parameters, getFilterFunction);
                break;
            default:
                break;
        }

        return(retval);
    }

    constructor (parentNode, parameters, getFilterFunction) {
        this.parentNode = parentNode;
        this.tree = undefined;
        this.updateFunction = undefined;
    }

    getTree() {
        return(this.tree);
    }

    update(value) {
        if (this.updateFunction !== undefined) this.updateFunction(value);
    }

    resolveValue(name, args, fallback) {
        //console.log("resolveValue(%s,%s,%s)...", name, JSON.stringify(args), fallback);

        var retval = fallback;
        var key = Object.keys(args).reduce((a,v) => { return((v.includes("!" + name))?v:a); }, undefined);

        if (key) {
            retval = PageUtils.getStorageItem(key, args[key]);
        } else {
            retval = args[name];
        }
        return(retval);
    }
            

}

class AlertComponent extends WidgetComponent {

    constructor(parentNode, parameters, getFilterFunction) {
        console.log("AlertComponent(%s,%s)...", parentNode, JSON.stringify(parameters));

        super(parentNode, parameters, getFilterFunction);

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
            var parameters = parameters;
            super.updateFunction = function(v) {
                var test = parameters.getParameter("alert-test")[0];
                var threshold = parameters.getParameter("alert-threshold", parseFloat);
                var disabled = parameters.getParameter("alert-disabled", parseInt);
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

    constructor(parentNode, parameters) {
        //console.log("ScaleComponent(%s,%s)...", parentNode, parameters);

        super(parentNode, parameters);

        var direction = (parentNode.classList.contains("vertical"))?"vertical":"horizontal";
        var navigation = parentNode.classList.contains("navigation");
        var selector = parameters.getParameter("units")[0];
        var scale = parameters.getParameter("scales")[selector];

        var div = document.createElement("div");
        div.className = "widget-component widget-scale" + ((direction == "horizontal")?" widget-horizontal":" widget-vertical");

        for (var i = 0; i <= scale.ticks; i++) {
            var tick = document.createElement("div");
            var tickValue = Number(scale.min) + (((scale.max - scale.min) / scale.ticks) * i);
            tick.setAttribute("data-tick-value", Math.abs(tickValue));
            tick.className = "widget-scale-tick";
            if (navigation && (tickValue < 0)) tick.classList.add("port");
            if (navigation && (tickValue > 0)) tick.classList.add("starboard");
            
            if (direction == "horizontal") {
                tick.style.width = ((i / scale.ticks) * 100) + "%";
            } else {
                tick.style.height = ((i / scale.ticks) * 100) + "%";
            }
            div.appendChild(tick); 
        }
        super.tree = div;
    }

}

class CursorComponent extends WidgetComponent {

    constructor(parentNode, parameters, filterFunction) {
        //console.log("CursorComponent(%s,%s)...", parentNode, parameters);

        super(parentNode, parameters, filterFunction);

        var direction = (parentNode.classList.contains("vertical"))?"vertical":"horizontal";

        var div = document.createElement("div");
        div.className = "widget-component widget-cursor " + ((direction == "horizontal")?"widget-horizontal":"widget-vertical");
        super.tree = div;

        var func = filterFunction(parameters.getParameter("filter") + "Percent", parameters);
        if (func) {
            if (direction == "horizontal") {
                super.updateFunction = function(v) {
                    div.style.width = func(v) + "%";
                };
            } else {
                super.updateFunction = function(v) {
                    div.style.height = func(v) + "%";
                };
            }
        }
    }

}

class TextComponent extends WidgetComponent {

    constructor(parentNode, parameters, filterFunction) {
        //console.log("TextComponent(%s,%s)...", parentNode, parameters);

        super(parentNode, parameters, filterFunction);

        var direction = (parentNode.classList.contains("vertical"))?"vertical":"horizontal";

        var table  = document.createElement("div");
        table.className = "widget-component widget-text";
        var cell = document.createElement("div");
        cell.className = "widget-text-cell";
        table.appendChild(cell);
        var span = document.createElement("span");
        span.innerHTML = "???";
        var found = parentNode.innerHTML.match(/(.*)---(.*)/);
        if ((found) && (found.length >= 2)) cell.appendChild(document.createTextNode(found[1]));
        cell.appendChild(span);
        if ((found) && (found.length >= 3)) cell.appendChild(document.createTextNode(found[2]));
        super.tree = table;

        var func = filterFunction(parameters.getParameter("filter"), parameters);
        if (func) {
            super.updateFunction = function(v) {
                v = func(v);
                span.innerHTML = (v.startsWith("-"))?v.substr(1):v;
            };
        }
    }

}

class IndicatorComponent extends WidgetComponent {

    constructor(parentNode, parameters, filterFunction) {
        console.log("IndicatorComponent(%s,%s)...", parentNode, JSON.stringify(parameters));

        super(parentNode, parameters, filterFunction);

        var onclass = parameters.getParameter("onclass") || "widget-indicator-on";
        var onvalue = parameters.getParameter("onvalue") || "";
        var offclass = parameters.getParameter("offclass") || "widget-indicator-off";
        var offvalue = parameters.getParameter("offvalue") || ""
        var notification = parentNode.innerHTML.includes("---");

        var div = document.createElement("div");
        div.className = "widget-component " + ((notification)?"widget-notification":"widget-indicator");
        var span = document.createElement("span"); 
        span.innerHTML = "";
        var found = parentNode.innerHTML.match(/(.*)---(.*)/);
        if ((found) && (found.length >= 2)) div.appendChild(document.createTextNode(found[1]));
        div.appendChild(span);
        if ((found) && (found.length >= 3)) div.appendChild(document.createTextNode(found[2]));
        super.tree = div;

        if (parameters.getParameter("filter") !== undefined) {
            var func = filterFunction(parameters.getParameter("filter"));
            if (func) {
                super.updateFunction = function(v) {
                    if (func(v)) {
                        if (notification) span.innerHTML = r;
                        div.classList.remove(offclass);
                        div.classList.add(onclass);
                    } else {
                        if (notification) span.innerHTML = "";
                        div.classList.remove(onclass);
                        div.classList.add(offclass);
                    }
                }
            }
        }
    }

}
