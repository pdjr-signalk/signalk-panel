class SignalK {

    /**
     * Create a new SignalK object and associate it with a Signal K server.
     *
     * <host> is the hostname or IP address of the Signal K server.
     *
     * <port> is the port number on which the Signal K server listens.
     *
     * <getFilter> is a function which can be used to return functions which
     * perform useful conversions on Signal K data values.
     *
     * <createWidget> is a function which creates widgets for displaying
     * Signal K data in real time.
     */

	constructor(host="localhost", port=3000, getFilter, createWidget) {
        //console.log("SignalK(%s,%s,%s,%s)...", host, port, getFilter, createWidget);
        this.directory = {};
        this.host = host;
        this.port = port;
        this.getFilter = getFilter;
        this.createWidget = createWidget;
	}

    /**
     * Insert Signal K data values into the DOM.
     *
     * <root> identifies the DOM sub-tree which should be processed.
     *
     * <className> selects the entities in the DOM which are candidates
     * for processing.
     *
     * Elements selected by <className> will only be processed if they contain
     * a data-source attribute which specifies the Signal K data path to the
     * value to be interpolated. Interpolation involves asynchronously
     * retrieving the specified value and writing it into the DOM as the
     * selected element's only content.  For example, the following SPAN
     * element could be used to display Signal K's idea of the host vessel name
     * or an advisory message if the vessel name is not defined.
     *
     * <span class="signalk" data-source="name">VESSEL NAME NOT FOUND</span>
     *
     * Optionally, an element can include a data-filter attribute that specifies
     * a function which should be used to manipulate the data value that is
     * returned from Signal K before interpolation.  Such functions must have
     * been available by calling the <getFilter> function supplied when the
     * SignalK object was instantiated.  The data-filter attribute must have
     * the following format:
     *
     * data-filter="filter[,param...][;filter[,param...]...]"
     *
     * Where <filter> is the name of a required filter and param is an optional
     * list of supplementary arguments which will be appended to the filter
     * call after the Signal K value.
     */

    interpolateValues(root, className="signalk") {
        var fspec, fspecparts, path, poptions, soptions;
        var elements = root.getElementsByClassName(className);
        [...elements].forEach(element => {
            if (element.hasAttribute("data-source")) {
                try {
                    soptions = JSON.parse(element.getAttribute("data-source"));
                } catch(e) {
                    soptions = null;
                    console.log("error parsing %s", element.getAttribute("data-source"));
                }
                if ((soptions != null) && ((path = soptions['signalk']) != null)) {
                    httpGetAsync("http://" + this.host + ":" + this.port + "/signalk/v1/api/vessels/self/" + path, (v) => {
                        v = v.replace(/"/g, ""); // strip quotes
                        if (element.hasAttribute("data-filter")) {
                            if (this.ffactory != null) {
                                var filters = element.getAttribute("data-filter").split(";");
                                filters.forEach(filter => {
                                    fspecparts = filter.split(",");
                                    var func = this.getFilter(fspecparts[0], fspecparts.slice[1]);
                                    v = func(v);
                                });
                            } else {
                                console.log("ignoring filter beacause the filter library is missing");
                            }
                        }
                        element.innerHTML = v.replace(/"/g, "");
                    });
                }
            }
        });
    }

    /**
     * Process the DOM subtree identified by <root>, calling the <createWidget>
     * function for each element selected by <className>.  Selected elements
     * must contain both 'data-source' and 'data-param' attributes: data-source
     * identifies a Signal K data path which will supply regularly updated values
     * to the Widget returned by <createWidget>; data-param furnishes options
     * which select and configure the Widget that will be created.
     * 
     * entities identified by <className> with HTML fragments created by
     * the <createWidget> function. A directory is built which associates
     * Signal K data paths with the Widget instances returned by <createWidget>
     * which supports the update() interface function. 
     *
     * <className> entities must include two attributes.  The data-source
     * attribute identifies the Signal K path
     *
     *
     */

    registerWidgets(root, className="widget") {
        var path, options, soptions, woptions, widget;
        var elements = root.getElementsByClassName(className);
        [...elements].forEach(element => {
            if (element.hasAttribute("data-source")) {
                try {
                    soptions = JSON.parse(element.getAttribute("data-source"));
                } catch(e) {
                    soptions = null;
                    console.log("error parsing %s", element.getAttribute("data-source"));
                }
                if ((soptions != null) && ((path = soptions.signalk) != null)) {
                    if (!this.directory[path]) this.directory[path] = [];
                    if (element.hasAttribute("data-params")) {
                        var params = element.getAttribute("data-params");
                        try {
                            woptions = JSON.parse(params);
                        } catch(e) {
                            woptions = null;
                            console.log("error parsing %s", attribute.value);
                        }
                        if (woptions != null) {
                            if ((widget = this.createWidget(element, woptions, this.getFilter)) != null) {
                                this.directory[path].push(widget);
                            }
                        }
                    }
                }
            }
        });
    }

	subscribe() {
    	if ("WebSocket" in window) {
		    console.log("SignalK: opening websocket connection to " + this.host + " on port " + this.port);
       		var ws = new WebSocket("ws://" + this.host + ":" + this.port + "/signalk/v1/stream?subscribe=none");
            var directory = this.directory;

        	ws.onopen = function(evt) {
                if (Object.keys(directory).length > 0) {
			        console.log("SignalK: websocket connection established, subscribing to deltas");
            	    var subscriptions = Object.keys(directory).map(v => ({ "path": v, "minPeriod": 1000, "policy": "instant" }));
            	    var msg = { "context": "vessels.self", "subscribe": subscriptions };
            	    ws.send(JSON.stringify(msg));
                } else {
                    console.log("SignalK: there are no configured data consumers");
                }
        	};
        
	        ws.onmessage = function(evt) {
            	var data = JSON.parse(evt.data);
            	if ((data.updates !== undefined) && (data.updates.length > 0)) {
               		if ((data.updates[0].values !== undefined) && (data.updates[0].values.length > 0)) {
               			var path = data.updates[0].values[0].path;
               			var value = data.updates[0].values[0].value;
               			if ((path) && (value)) directory[path].forEach(widget => {
                            widget.update(value);
                        });
               		}
            	}
    		}
        }
	}

}

