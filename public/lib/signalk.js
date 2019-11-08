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
     * getValue asynchronously requests a Signal K path value.  The returned
     * result is parsed to JSON, optionally filtered by an external function
     * and returned to the client application via a callback.
     *
     * @param path - Signal K path to be interrogated.
     * @param callback - client callback function.
     * @param filter - optional filter function used to pre-process the value passed to callback.
     */

    getValue(path, callback, filter=this.getFilter("identity")) {
        this.httpGetAsync("http://" + this.host + ":" + this.port + "/signalk/v1/api/vessels/self/" + path.replace(/\./g, "/"), (v) => {
            try { v = JSON.parse(v); } catch { }
            callback(filter(v));
        });
    }

    /**
     * interpolateValue is a convenience function which recover a Signal K
     * value using getValue and interpolates the result directly into a
     * specified DOM element.
     *
     * @param path - Signal K path to be interrogated.
     * @param element - DOM element whose content will be overwritten.
     * @param filter - optional filter function used to pre-process the recover path value before interpolation.
     */

    interpolateValue(path, element, filter=this.getFilter("identity")) {
        //console.log("interpolateValue(%s,%s,%s)...", path, JSON.stringify(element), JSON.stringify(filter));
        this.getValue(path, function(v) { element.innerHTML = v; }, filter);
    }

    /**
     * registerCallback subscribes a callback function so that it will be
     * invoked each time a specified Signal K path value is updated. The delta
     * values returned by the Signal K server are converted to JSON and
     * optionally filters by an external function before being passed to the
     * callback.
     *
     * @param path - Signal K path to be interrogated.
     * @param callback - client callback function.
     * @param filter - optional filter function used to pre-process delta values before they are passed to callback.
     */
    
    registerCallback(path, callback, filter) {
        if (!this.directory[path]) this.directory[path] = [];
        this.directory[path].push(function(v) {
            try { v = JSON.parse(v); } catch { }
            if (filter) v = filter(v);
            if (typeof callback === "object") callback.update(v);
            if (typeof callback === "function") callback(v);
        });
    }

    /**
     * registerInterpolation is a convenience function which subscribes for
     * updates on a Signal K path and interpolates delta values directly into
     * a specified DOM element.
     *
     * @param path - Signal K path to be interrogated.
     * @param element - DOM element whose content will be overwritten.
     * @param filter - optional filter function used to pre-process delta values before interpolation.
     */

    registerInterpolation(path, element, filter=this.getFilter("identity")) {
        this.registerCallback(path, function(v) { element.innerHTML = v; }, filter);
    }

	subscribe() {
    	if ("WebSocket" in window) {
		    console.log("SignalK: opening websocket connection to " + this.host + " on port " + this.port);
       		var ws = new WebSocket("ws://" + this.host + ":" + this.port + "/signalk/v1/stream?subscribe=none");
            var directory = this.directory;

        	ws.onopen = function(evt) {
                var deltaCount = Object.keys(directory).length;
                if (deltaCount) {
			        console.log("SignalK: websocket connection established, subscribing to %d delta(s)", deltaCount);
            	    var subscriptions = Object.keys(directory).map(v => ({ "path": v, "minPeriod": 1000, "policy": "instant" }));
            	    var msg = { "context": "vessels.self", "subscribe": subscriptions };
            	    ws.send(JSON.stringify(msg));
                } else {
                    console.log("SignalK: there are no configured data consumers");
                }
        	};
        
	        ws.onmessage = function(evt) {
            	var data = JSON.parse(evt.data);
            	if ((data.updates !== undefined) && (data.updates.length > 0)) data.updates.forEach(update => {
               		if ((update.values !== undefined) && (update.values.length > 0)) update.values.forEach(updateValue => {
               			var path = updateValue.path;
               			var value = updateValue.value;
               			if ((path !== undefined) && (value !== undefined)) directory[path].forEach(callback => {
                            callback(value);
                        });
                    });
               	});
    		}
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
}

