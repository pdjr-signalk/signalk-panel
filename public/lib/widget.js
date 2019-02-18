                
class Widget {

    constructor(parentNode, options) {
        this.parentNode = parentNode;
        this.components = {};
        this.timestamp = 0;
        this.latest = null;

        var innerHtml = this.parentNode.innerHTML.trim();
        var found = innerHtml.match(/(.*)---(.*)/);
        this.parentNode.innerHTML = "";
        if (Object.keys(options).includes("data-widget-hgauge")) {
            var card = document.createElement("div"); card.className = "widget-hgauge-card";
	        if (Object.keys(options).includes("data-widget-scroller")) {
	            var div = document.createElement("div"); div.className = "widget-scroller"; div.style.display = "table";
	            var row = document.createElement("div"); row.style.display = "table-row";
	            div.appendChild(row);
	            if (options["data-widget-scroller"]["resolution"]) {
	                var nelems = options["data-widget-scroller"]["resolution"][0] || 40;
	                for (var i = 0; i < nelems; i++) {
	                    var ediv = document.createElement("div"); ediv.style.display = "table-cell"; ediv.className = "widget-scroller-cell";
	                    var bar = document.createElement("div"); bar.className= "widget-scroller-bar";
	                    ediv.appendChild(bar);
	                    row.appendChild(ediv);
	                }
	                card.appendChild(div);
	                this.components["scroller"] = Widget.makeComponent(div, options["data-widget-scroller"]);
	                var interval = options["data-widget-scroller"]["resolution"][1] || 5;
	                this.latest = 0;
	                setInterval(() => {
	                    var floater = this.components.scroller.element.childNodes[0].childNodes[0];
	                    this.components.scroller.element.childNodes[0].removeChild(floater);
	                    floater.childNodes[0].style.height = this.components.scroller.filter(this.latest) + "%";
	                    this.components.scroller.element.childNodes[0].appendChild(floater);
	                }, (interval * 1000));
	            }
	        }
            var cursor = document.createElement("div"); cursor.className = "widget-hgauge-cursor";
            card.appendChild(cursor);
            this.parentNode.appendChild(card);
            this.components["hgauge"] = Widget.makeComponent(cursor, options["data-widget-hgauge"]);
        }
        if (Object.keys(options).includes("data-widget-digital")) {
            var div = document.createElement("div"); div.className = "widget-digital";
            var span = document.createElement("span"); span.innerHTML = "???";
            if (found.length >= 2) div.appendChild(document.createTextNode(found[1]));
            div.appendChild(span);
            if (found.length >= 3) div.appendChild(document.createTextNode(found[2]));
            this.parentNode.appendChild(div);
            this.components["digital"] = Widget.makeComponent(span, options["data-widget-digital"]);
        }
        if (Object.keys(options).includes("data-widget-indicator")) {
            var div = document.createElement("div"); div.className = "widget-indicator";
            this.parentNode.appendChild(div);
            this.components["indicator"] = Widget.makeComponent(div, options["data-widget-indicator"]);
        }
        if (Object.keys(options).includes("data-widget-label")) {
            this.parentNode.innerHTML = innerHtml;
            this.components["label"] = Widget.makeComponent(this.parentNode, options["data-widget-label"]);
        }
    }

    getType() {
        return(this.type);
    }

    updateWidget(value) {
        //console.log("Widget.updateWidget(%s)...", JSON.stringify(value));
        this.timestamp = Date().now;
        this.latest = value;
        Object.keys(this.components).forEach(key => {
            var element = this.components[key].element;
            var filter = this.components[key].filter;
            var alarmFunction = this.components[key].alarmFunction;
            var state = this.components[key].state;
            if (key == "digital") {
                element.innerHTML = filter(this.latest);
            } else if (key == "hgauge") {
                element.style.width = filter(this.latest) + "%";
            } else if (key == "indicator") {
                state(element, filter(this.latest));
            } else if (key == "label") {
                alarmFunction(filter(this.latest), element);
            } else {
                ;
            }
        });

        if ((this.lothreshold) && (Number(this.latest) < this.lothreshold)) {
            this.parentNode.classList.add('lcars-alarmlo');
        } else if ((this.hithreshold) && (Number(this.latest) > this.hithreshold)) {
            this.parentNode.classList.add('lcars-alarmhi');
        } else { 
            this.parentNode.classList.remove('lcars-alarmlo');
            this.parentNode.classList.remove('lcars-alarmhi');
        }

    }

    hasTimedout() {
        return((this.timestamp + this.timeout) < Date().now);
    }

    toString() {
        return(JSON.stringify(this));
    }

    static makeComponent(element, options) {
        //console.log("makeComponent(%s,%s)...", JSON.stringify(element), JSON.stringify(options));
        return({
            "element": element,
            "filter": Widget.makeFilter(options["filter"]),
            "alarmFunction": Widget.getAlarmFunction(options["loalarm"], options["hialarm"]),
            "state": Widget.makeState(options["state"])
        });
    }

    static makeFilter([ name, arg1, arg2, arg3 ]) {
        //console.log("makeFilter(%s,%s,%s,%s)...", name, arg1, arg2, arg3);

        var retval = function(v) { return(v); }
        if (name) {
            if (name == "toPercent") {
                var min = arg1 || 0;
                var max = arg2 || 100;
                var invert = ((arg3) && (arg3 == "invert"))?true:false;
                retval = function(v) { var r = Math.round((v / (max - min)) * 100); r = (r < 0)?0:((r > 100)?100:r); return((invert)?(100 - r):r); };
            } else if (name == "getDate") {
                retval = function(v) { return(v.substr(0, v.indexOf('T'))); };
            } else if (name == "getTime") {
                retval = function(v) { return(v.substr(v.indexOf('T')+1)); };
            } else if (name == "toLatitude") {
                retval = function({ longitude, latitude }) { return(Widget.degToDMS(latitude, ['N','S'])); };
            } else if (name == "toLongitude") {
                retval = function({ longitude, latitude }) { return(Widget.degToDMS(longitude, ['E','W'])); };
            } else if (name == "toDegrees") {
                retval = function(radians) { return(("00" + (Math.floor(radians * 57.2958) % 360)).slice(-3)); };
            } else if (name == "multiplier") {
                var multiplier = arg1 || 1;
                var places = arg2 || 0;
                retval = function(v) { return((v * multiplier).toFixed(places)); };
            } else if (name == "offset") {
                console.log(arg1 + "," + arg2);
                var offset = Number(arg1) || 0;
                var places = Number(arg2) || 0;
                retval = function(v) { return((Number(v) + offset).toFixed(places)); };
            } else if (name == "identity") {
                var retval = function(v) { return((arg1)?v.toFixed(arg1):v); }
            }
        }
        return(retval);
    } 


    /**
     * Returns a function that can be used to test if an update value falls
     * outside some thresholds specified by loalarm and hialarm.  Each of
     * these arrays have the form [ threshold, style ] where threshold is the
     * boundary value that should be tested and style is a CSS style that
     * should be applied to some element when the threshold is transgressed.
     *
     * The returned function takes two arguments, a value and an optional
     * element.  If the value falls outside the threshold range, then the
     * style defined when the function was constructed is applied to element.
     * In any case, the returned function returns true if value is in an alarm
     * state, otherwise false.
     */
    static getAlarmFunction(loalarm, hialarm) {
        return(function(v, element) {
            var retval = false;
            if (element) {
                if (loalarm && (loalarm.length >= 2) && (v < Math.max(loalarm.filter(x => !isNaN(x))))) {
                    retval = true;
                    element.classList.add(loalarm[1]);
                } else if (hialarm && (hialarm.length >= 2) && (v > Math.min(hialarm.filter(x => !isNaN(x))))) {
                    retval = true;
                    element.classList.add(hialarm[1]);
                } else {
                    if (loalarm) element.classList.remove(loalarm.filter(x => isNaN(x)).join(' '));
                    if (hialarm) element.classList.remove(hialarm.filter(x => isNaN(x)).join(' '));
                }
            }
            return(retval);
        });
    }

    static makeState(states) {
        return(function(e, v) {
            if ((states) && (states.length == 2)) {
                e.classList.remove(states[0]);
                e.classList.remove(states[1]);
                e.classList.add((v)?states[0]:states[1]);
            }
        });
    }

    static degToDMS(deg, hemis) {  
        var h = hemis[(deg >= 0)?0:1];
        var d = Math.floor(deg);  
        var minfloat = (deg - d) * 60;  
        var m = Math.floor(minfloat);  
        var secfloat = (minfloat - m) * 60;  
        var s = Math.round(secfloat);  
        var ds = Math.round((secfloat - s) * 10);
      
        if (s == 60) { m++; s=0; }  
        if (m==60) { d++; m=0; }  
        return ("" + ("00" + d).slice(-3) + '&deg;' + ("0" + m).slice(-2) + '\'' + ("0" + s).slice(-2) + '.' + ds + '"' + h);  
    }

    static getSettingsMarkup() {

    }

}
