var WIDGET_DIRECTORY = {};

// Initialise page immediately it has loaded.
//
function init() {
    // Stop the browser from displaying the right-click context menu.
    document.addEventListener("contextmenu", (e) => { contextHandler(e); e.preventDefault(); });

    // Process "<div data-include=" tags by interpolating HTML fragments into page.
    interpolate();
    // Process "<div data-path=" tags by interpolating widgets and associating with Signal K updates.
    WIDGET_DIRECTORY = configure();
    // Process "<div class="button... data-button=" tags by associating with event handler.
    activate("button", "click", FUNCTIONS);
    
    httpGetAsync("/signalk/v1/api/vessels/self/name/", (v) => { document.getElementById("vesselName").innerHTML = v.replace(/"/g, ""); });
    
    // Connect to Signal K server and start processing received data.
    //
    updateStateFromWebSocket(WIDGET_DIRECTORY);
}

/**
 * Load external HTML fragments and interpolate them into the main document.
 * This include mechanism is triggered by a tag of the form:
 *   <div data-include="path/to/HTMLfragment"></div>
 * The entire tag is replaced by the referenced content, or by an XML
 * comment if the content cannot be loaded.
 */
function interpolate() {
    var elements = document.getElementsByTagName("div");
    [...elements].forEach(element => {
        var path = element.getAttribute("data-include");
        if (path) {
            var html = httpGet(path);
            element.innerHTML = (html)?html:("<!-- ERROR: unable to GET " + path + " -->");
            element.parentNode.replaceChild(element.children[0], element);
        }
    });
}

/**
 * Populate the document with widgets and associate these with their defined
 * data sources, returning a dictionary which maps data paths to associated
 * widgets.
 *
 * The process is triggered by a DIVs which contain at least a "data-source"
 * attribute.  This attribute value must have the form "provider:path", where
 * provider identifies a source of real-time data and "path" selects the data
 * required.
 *
 * DIVs may also contain one or more attributes of the form "data-widget-type"
 * where type identifies a particular type if user-interface object supported
 * by the widget.js library.  The attribute value provides configuration
 * options for the widget (see widget.js for details).
 *
 * configure() returns a data structure which maps paths to widgets.
 */
function configure() {
    var retval = {};
    var elements = document.getElementsByTagName("div");
    [...elements].forEach(element => {
        var soptions = objectify(element.getAttribute("data-source"));
        var woptions = {};

        for (var att, i = 0, atts = element.attributes, n = atts.length; i < n; i++) {
            att = atts[i];
            if (att.nodeName.startsWith("data-widget-")) {
                woptions[att.nodeName] = objectify(att.value);
            }
        }

        if ((soptions != null) && (woptions != {})) {
            var path = (soptions.signalk)?soptions.signalk[0]:null;
            if (path) {
                var widget = new Widget(element, woptions);
                if (widget) {
                    if (path in retval) {
                        retval[path].push({ "pathoptions": soptions, "element": element, "widget": widget });
                    } else {
                        retval[path] = [ { "pathoptions": soptions, "element": element, "widget": widget } ];
                    }
                }
            }
        }
    });
    return(retval);
}

/**
 * Processes the document for elements of a defined class and associates with
 * them and event handler for a particular type of event.  Selected elements
 * must contain a tag named "data-button" which provides configuration for
 * actions to be performed by the specified handler. 
 */
function activate(selectorclass, eventtype, dictionary) {
    var elements = document.getElementsByClassName(selectorclass);
    [...elements].forEach(element => {
        activateElement(element, eventtype, dictionary);
    });
}

function activateElement(element, eventtype, dictionary) {
    //console.log("activateElement(%s,%s,%s)...", JSON.stringify(element), eventtype, JSON.stringify(dictionary));
    var optionstring = element.getAttribute("data-button");
    if (optionstring) {
        var options = objectify(optionstring);
        if ((options.action) && (Object.keys(dictionary).includes(options.action[0]))) {
            element.addEventListener(eventtype, function(evt) {
                dictionary[options.action[0]](evt.target, options);
            });
        }
    }
}

function updatePath(dictionary, path, value) {
    if (dictionary[path]) {
        dictionary[path].forEach(({ element, widget }) => {
            widget.updateWidget(value);
        });
    } else {
        console.log("updatePath: %s not found in dictionary", path);
    }
}

function updateStateFromWebSocket(dictionary) {
    if ("WebSocket" in window) {
        var ws = new WebSocket("ws://"+window.location.hostname+":"+window.location.port+"/signalk/v1/stream?subscribe=none");
        ws.onopen = function(evt) {
            var subscriptions = Object.keys(dictionary).map(v => ({ "path": v, "minPeriod": 1000, "policy": "instant" }));
            var msg = {
                "context": "vessels.self",
                "subscribe": subscriptions
            };
            ws.send(JSON.stringify(msg));
        };
        
        ws.onmessage = function(evt) {
            var data = JSON.parse(evt.data);
            if ((data.updates !== undefined) && (data.updates.length > 0)) {
                if ((data.updates[0].values !== undefined) && (data.updates[0].values.length > 0)) {
                    var path = data.updates[0].values[0].path;
                    var value = data.updates[0].values[0].value;
                    if ((path) && (value)) updatePath(dictionary, path, value);
                }
            }
        }
    }
}

function objectify(string) {
    var retval = null;
    if (string) {
        retval = {};
        string.split(",").forEach(property => {
            var parts = property.split(":");
            retval[parts[0]] = parts.slice(1);
        });
    }
    return(retval);
}
