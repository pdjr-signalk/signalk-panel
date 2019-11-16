class WidgetComponent {

    static createWidgetComponent(componentName, parentNode, widgetOptions, getFilterFunction) {
        //console.log("createWidgetComponent(%s,%s,%s)...", componentName, parentNode, JSON.stringify(widgetOptions));

        var retval = undefined;

        switch (componentName) {
            case "alert":
                retval = new AlertComponent(parentNode, widgetOptions, getFilterFunction);
                break;
            case "scale":
                retval = new ScaleComponent(parentNode, widgetOptions, getFilterFunction);
                break;
            case "cursor":
                retval = new CursorComponent(parentNode, widgetOptions, getFilterFunction);
                break;
            case "text":
                retval = new TextComponent(parentNode, widgetOptions, getFilterFunction);
                break;
            case "indicator":
                retval = new IndicatorComponent(parentNode, widgetOptions, getFilterFunction);
                break;
            default:
                break;
        }

        return(retval);
    }

    constructor (parentNode, widgetOptions, getFilterFunction) {
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

    initialiseLocalStorage(name, defaultValue) {
        //console.log("initialiseLocalStorage(%s,%s)...", name, defaultValue);
        if (window.localStorage.getItem(name) == undefined) window.localStorage.setItem(name, defaultValue);
        if (window.localStorage.getItem(name) == undefined) throw("error processing session storage item '" + name + "'");
        return;
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

    constructor(parentNode, widgetOptions, getFilterFunction) {
        //console.log("AlertComponent(%s,%s)...", parentNode, JSON.stringify(widgetOptions));

        super(parentNode, widgetOptions, getFilterFunction);

        try {
            super.initialiseLocalStorage(parentNode.id + "-test", widgetOptions["alert"]["defaults"]["test"]);
            super.initialiseLocalStorage(parentNode.id + "-threshold", widgetOptions["alert"]["defaults"]["threshold"]);
            super.initialiseLocalStorage(parentNode.id + "-disabled", widgetOptions["alert"]["defaults"]["disabled"]);

            // Update parentNode class membership
            //
            parentNode.classList.add("alert", parentNode.id);

            // Add event listener to parentNode so that alerts can be cancelled
            //
            parentNode.addEventListener("click", function(e) { 
                var elems = document.getElementsByClassName(parentNode.id);
                //Array.prototype.forEach.call(elems, e => {
                [...elems].forEach(e => {
                    if (parentNode.classList.contains("alert-cancelled")) {
                        e.classList.remove("alert-cancelled");
                    } else {
                        e.classList.add("alert-cancelled");
                    }
                });
            });

            if (widgetOptions["alert"]["function"]) {
                var func = getFilterFunction(widgetOptions["alert"]["function"]);
                if (func) {
                    var parentNode = parentNode;
                    super.updateFunction = function(v) {
                        var elems = document.getElementsByClassName(parentNode.id);
                        if (window.localStorage.getItem(parentNode.id + "-disabled") == "0") {
                            if (func(v)) {
                                [...elems].forEach(e => { e.classList.add("alert-active"); if (e != parentNode) e.classList.add("alert-cancelled"); });
                            } else {
                                [...elems].forEach(e => { e.classList.remove("alert-active"); e.classList.remove("alert-cancelled"); });
                            }
                        } else {
                            parentNode.classList.add("alert-disabled");
                            [...elems].forEach(e => { e.classList.remove("alert-active"); e.classList.remove("alert-cancelled"); });
                        }
                    }
                }
            }
        } catch(e) {
        }
    }

}

class ScaleComponent extends WidgetComponent {

    constructor(parentNode, widgetOptions, getFilterFunction) {
        console.log("ScaleComponent(%s,%s)...", parentNode, JSON.stringify(widgetOptions));

        super(parentNode, widgetOptions, getFilterFunction);

        var direction = (widgetOptions.direction)?widgetOptions.direction:"horizontal";
        var selector = super.resolveValue("selector", widgetOptions.scale);
        var settings = widgetOptions.scale.settings;
        if ((settings !== undefined) && (selector !== undefined)) {
            var scale = PageUtils.getStorageItem(selector);
            if ((scale !== undefined) && (settings[scale] !== undefined)) {
                var [min,max,ticks] = settings[scale];
                PageUtils.setStorageItem(selector.split("!")[0] + "!scale-min", min);
                PageUtils.setStorageItem(selector.split("!")[0] + "!scale-max", max);
            } else {
                console.log("ignoring malformed definition for ScaleComponent");
            }
        } else {
            console.log("ScaleComponent: configuration error (required attributes are missing)");
        }

        var div = document.createElement("div");
        div.className = "widget-component widget-scale" + ((direction == "horizontal")?" widget-horizontal":" widget-vertical");

        for (var i = 0, tick; i <= ticks; i++) {
            tick = document.createElement("div");
            tick.className = "widget-scale-tick";
            tick.setAttribute("data-tick-value", Math.abs(Number(min) + (((max - min) / ticks) * i)));
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

    constructor(parentNode, widgetOptions, getFilterFunction) {
        //console.log("CursorComponent(%s,%s)...", parentNode, JSON.stringify(widgetOptions));

        super(parentNode, widgetOptions, getFilterFunction);

        var direction = (widgetOptions.direction)?widgetOptions.direction:"horizontal";

        var div = document.createElement("div");
        div.className = "widget-component widget-cursor " + ((direction == "horizontal")?"widget-horizontal":"widget-vertical");
        super.tree = div;

        if (widgetOptions.cursor["function"]) {
            var func = getFilterFunction(widgetOptions.cursor["function"]);
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

}

class TextComponent extends WidgetComponent {

    constructor(parentNode, widgetOptions, getFilterFunction) {
        //console.log("TextComponent(%s,%s)...", parentNode, JSON.stringify(widgetOptions));

        super(parentNode, widgetOptions, getFilterFunction);

        var direction = (widgetOptions.direction)?widgetOptions.direction:"horizontal";

        var placeholder = (widgetOptions.text.placeholder)?widgetOptions.text.placeholder:"---";
        var classes = (widgetOptions.text.classes)?widgetOptions.text.classes:undefined;

        var table  = document.createElement("div");
        table.className = "widget-component widget-text" + ((classes)?(" " + classes):"");
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

        if (widgetOptions.text["function"]) {
            var func = getFilterFunction(widgetOptions.text["function"]);
            if (func) {
                super.updateFunction = function(v) {
                    span.innerHTML = func(v);
                };
            }
        }
    }

}

class IndicatorComponent extends WidgetComponent {

    constructor(parentNode, widgetOptions, getFilterFunction) {
        //console.log("IndicatorComponent(%s,%s)...", parentNode, JSON.stringify(widgetOptions));

        super(parentNode, widgetOptions, getFilterFunction);

        var placeholder = (widgetOptions.indicator.placeholder)?widgetOptions.indicator.placeholder:"---";
        var onclass = (widgetOptions.indicator.on["class"])?widgetOptions.indicator.on["class"]:"";
        var onvalue = (widgetOptions.indicator.on["value"])?widgetOptions.indicator.on["value"]:"";
        var offclass = (widgetOptions.indicator.off["class"])?widgetOptions.indicator.off["class"]:"";
        var offvalue = (widgetOptions.indicator.off["value"])?widgetOptions.indicator.off["value"]:"";

        var div = document.createElement("div");
        div.className = "widget-component " + ((parentNode.innerHTML.includes("---"))?"widget-notification":"widget-indicator");
        var span = document.createElement("span"); 
        span.innerHTML = "";
        var found = parentNode.innerHTML.match(/(.*)---(.*)/);
        if ((found) && (found.length >= 2)) div.appendChild(document.createTextNode(found[1]));
        div.appendChild(span);
        if ((found) && (found.length >= 3)) div.appendChild(document.createTextNode(found[2]));
        super.tree = div;

        if (widgetOptions.indicator["function"]) {
            var func = getFilterFunction(widgetOptions.indicator["function"]);
            if (func) {
                super.updateFunction = function(v) {
                    var r = func(v);
                    if (r) {
                        span.innerHTML = (typeof r === "string")?r:onvalue;
                        div.classList.remove(offclass);
                        div.classList.add(onclass);
                    } else {
                        span.innerHTML = "";
                        div.classList.remove(onclass);
                        div.classList.add(offclass);
                    }
                }
            }
        }
    }

}
