class Widget {

    static createWidget(parentNode, options, ffactory) {
        return(new Widget(parentNode, options, ffactory));
    }

    constructor(parentNode, options, ffactory) {
        //console.log("Widget(%s,%s,%s)...", JSON.stringify(parentNode), JSON.stringify(options), JSON.stringify(ffactory)); 

        this.parentNode = parentNode;
        this.timestamp = 0;
        this.latest = null;

        var innerHtml = parentNode.innerHTML.trim();
        parentNode.innerHTML = "";
        this.updateFunction = {
            "hgauge": Widget.makeHgauge,
            "digital": Widget.makeDigital,
            "indicator": Widget.makeIndicator,
            "label": Widget.makeLabel,
            "vgauge": Widget.makeVgauge
        }[options.type](parentNode, options, innerHtml, ffactory);
    }

    static makeVgauge(parentNode, options, innerHtml, ffunc) {
        //console.log("Widget.makeVgauge(%s, %s, %s)...", JSON.stringify(parentNode), JSON.stringify(options), innerHtml);
        var retval = null, functions = [], func, card;

        if (options.range) {
            var card = document.createElement("div"); card.className = "widget-vgauge-card";
            //if ((options.scroller) && (func = makeScroller(card, options))) functions.push(func);
            //if ((options.grid) && (func = makeGrid(card, options.range.min, options.range.max, options.ticks))) functions.push(func);
            if ((options.cursor1) && (func = makeCursor(card, options.cursor1))) functions.push(func);
            //if ((options.cursor2) && (func = makeCursor(card, options.cursor2))) functions.push(func);
            if ((options.label) && (func = makeGaugeLabel(card, options.label, innerHtml))) functions.push(func);
            parentNode.appendChild(card);
            retval = function(v) { functions.map(f => f(v)); }
        }
        return(retval)

        function makeCursor(parentNode, options) {
            //console.log("makeCursor(%s,%s)...", JSON.stringify(parentNode), JSON.stringify(options));

            var retval = null;
            var cursor = document.createElement("div"); cursor.classList.add("widget-vgauge-cursor");
            if (options.color) cursor.classList.add(options.color);
            parentNode.appendChild(cursor);
            if (options["function"]) {
                var fargs = options["function"].split(",");
                var func = ffunc(fargs[0], fargs.slice(1));
                if (func) retval = function(v) { cursor.style.minHeight = func(v) + "%"; };
            }
            return(retval);
        }

        function makeGaugeLabel(parentNode, options, innerHtml) {
            //console.log("makeGaugeLabel(%s,%s,%s)...", JSON.stringify(parentNode), JSON.stringify(options), innerHtml);

            var retval = null;
            var label = document.createElement("div"); label.classList.add("widget-hgauge-label");
            var found = innerHtml.match(/(.*)---(.*)/);
            var span = document.createElement("span"); span.innerHTML = "***";
            if (found.length >= 2) label.appendChild(document.createTextNode(found[1]));
            label.appendChild(span);
            if (found.length >= 3) label.appendChild(document.createTextNode(found[2]));
            parentNode.appendChild(label);
            if (options["function"]) {
                var fargs = options["function"].split(",");
                var func = ffunc(fargs[0], fargs.slice(1));
                if (func != null) retval = function(v) { span.innerHTML = func(v); };
            }
            return(retval);
        }
    }

    static makeHgauge(parentNode, options, innerHtml, ffunc) {
        //console.log("Widget.makeHgauge(%s, %s, %s)...", JSON.stringify(parentNode), JSON.stringify(options), innerHtml);

        var retval = null, functions = [], func, card;
        if (options.range) {
            var card = document.createElement("div"); card.className = "widget-hgauge-card";
            //if ((options.scroller) && (func = makeScroller(card, options))) functions.push(func);
            if ((options.grid) && (func = makeGrid(card, options.range.min, options.range.max, options.ticks))) functions.push(func);
            if ((options.cursor1) && (func = makeCursor(card, options.cursor1))) functions.push(func);
            if ((options.cursor2) && (func = makeCursor(card, options.cursor2))) functions.push(func);
            if ((options.label) && (func = makeGaugeLabel(card, options.label, innerHtml))) functions.push(func);
            parentNode.appendChild(card);
            retval = function(v) { functions.map(f => f(v)); }
        }
        return(retval)

        function makeGrid(parentNode, min = 0, max = 100, ticks = 10, labels = true) {
            //console.log("makeGrid(%s,%s,%s,%s,%s)...", JSON.stringify(parentNode), min, max, ticks, labels);

            var grid = document.createElement("div"); grid.classList.add("widget-hgauge-grid");
            for (var i = 1, tick; i < ticks; i++) {
                tick = document.createElement("div"); tick.classList.add("widget-hgauge-grid-tick");
                tick.setAttribute("data-tick-value", Math.abs(Number(min) + (((max - min) / ticks) * i)));
                tick.style.width = ((i / ticks) * 100) + "%";
                grid.appendChild(tick); 
            }
            parentNode.appendChild(grid);
            return(null);
        }

        function makeCursor(parentNode, options) {
            //console.log("makeCursor(%s,%s)...", JSON.stringify(parentNode), JSON.stringify(options));

            var retval = null;
            var cursor = document.createElement("div"); cursor.classList.add("widget-hgauge-cursor");
            if (options.color) cursor.classList.add(options.color);
            parentNode.appendChild(cursor);
            if (options["function"]) {
                var fargs = options["function"].split(",");
                var func = ffunc(fargs[0], fargs.slice(1));
                if (func) retval = function(v) { cursor.style.width = func(v) + "%"; };
            }
            return(retval);
        }

        function makeGaugeLabel(parentNode, options, innerHtml) {
            //console.log("makeGaugeLabel(%s,%s,%s)...", JSON.stringify(parentNode), JSON.stringify(options), innerHtml);

            var retval = null;
            var label = document.createElement("div"); label.classList.add("widget-hgauge-label");
            var found = innerHtml.match(/(.*)---(.*)/);
            var span = document.createElement("span"); span.innerHTML = "***";
            if (found.length >= 2) label.appendChild(document.createTextNode(found[1]));
            label.appendChild(span);
            if (found.length >= 3) label.appendChild(document.createTextNode(found[2]));
            parentNode.appendChild(label);
            if (options["function"]) {
                var fargs = options["function"].split(",");
                var func = ffunc(fargs[0], fargs.slice(1));
                if (func != null) retval = function(v) { span.innerHTML = func(v); };
            }
            return(retval);
        }

        function makeScroller(parentNode, options) {
/*
            return(null);
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
	                    floater.childNodes[0].style.height = this.components.scroller.updateFunction(this.latest) + "%";
	                    this.components.scroller.element.childNodes[0].appendChild(floater);
	                }, (interval * 1000));
	            }
	        }
            return(null);
*/
        }

    }
       
    static makeDigital(parentNode, options, innerHtml, ffunc) {
        //console.log("Widget.makeDigital(%s, %s, %s)...", JSON.stringify(parentNode), JSON.stringify(options), innerHtml);

        var retval = null;
        var found = innerHtml.match(/(.*)---(.*)/);
        var div = document.createElement("div"); div.className = "widget-digital";
        var span = document.createElement("span"); span.innerHTML = "***";
        if (found.length >= 2) div.appendChild(document.createTextNode(found[1]));
        div.appendChild(span);
        if (found.length >= 3) div.appendChild(document.createTextNode(found[2]));
        parentNode.appendChild(div);
        if (options["function"]) {
            var fargs = options["function"].split(",");
            var func = ffunc(fargs[0], fargs.slice(1));
            if (func != null) retval = function(v) { span.innerHTML = func(v); };
        }
        return(retval);
    }

    static makeIndicator(parentNode, options, innerHtml, ffunc) {
        //console.log("Widget.makeIndicator(%s,%s)...", JSON.stringify(parentNode), JSON.stringify(options));
        var retval = null;
        var div = document.createElement("div"); div.className = "widget-indicator";
        parentNode.appendChild(div);
        if (options["function"]) {
            var fargs = options["function"].split(",");
            var func = ffunc(fargs[0], fargs.slice(1));
            var states = options.state || { "on": "on", "off": "off" };
            if (func != null) retval = function(v) {
                div.classList.remove(options.state.on);
                div.classList.remove(options.state.off);
                if (func(v) != 0) { div.classList.add(options.state.on); } else { div.classList.add(options.state.off); }
            }
        }
        return(retval);
    }

    static makeLabel(parentNode, options, innerHtml, ffunc) {
        var retval = function(v) { return(v); };
        parentNode.innerHTML = innerHtml;
        if (options["function"]) {
            var fargs = options["function"].split(",");
            var func = ffunc(fargs[0], fargs.slice(1));
            var states = options.state;
            if ((func != null) && (states != null)) retval = function(v) {
                if (states.on) parentNode.classList.remove(states.on);
                if (states.off) parentNode.classList.remove(states.off);
                if (func(v)) { if (states.on) parentNode.classList.add(states.on); } else { if (states.off) parentNode.classList.add(states.off); }
            }
        }
        return(retval);
    }

    getType() {
        return(this.type);
    }

    update(value) {
        //console.log("Widget.update(%s)...", JSON.stringify(value));

        this.timestamp = Date().now;
        this.latest = value;
        if (this.updateFunction != null) {
            this.updateFunction(value);
        } else {
            console.log("missing update function for value %s", value);
        }
    }

    hasTimedout() {
        return((this.timestamp + this.timeout) < Date().now);
    }

    toString() {
        return(JSON.stringify(this));
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

}
