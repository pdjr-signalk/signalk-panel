class SignalK {

    /**
     * Create a new SignalK object and associate it with a Signal K server.
     *
     * <host> is the hostname or IP address of the Signal K server.
     *
     * <port> is the port number on which the Signal K server listens.
     *
     */

    constructor(hosts=[[ location.hostname, location.port ]], callback) {
        //console.log("SignalK(%s,%s,%s)...", JSON.stringify(hosts), getFilter);
        this.hosts = hosts;
        this.callback = callback;
        this.ws = null;
        this.directory = {};

		console.log("SignalK: opening websocket connection to " + this.hosts[0][0] + " on port " + this.hosts[0][1]);
        var [ host, port ] = this.hosts.shift();
       	this.ws = new WebSocket("ws://" + host + ":" + port + "/signalk/v1/stream?subscribe=none");

        var _this = this;
        this.ws.onopen = function(evt) { _this.onopen(evt); };
        this.ws.onerror = function(evt) { this.onerror(evt); };
        this.ws.onmessage = function(evt) { _this.onmessage(evt); };
    }

    onopen(evt) {
	    console.log("SignalK: websocket connection established");
        if (this.callback !== undefined) this.callback();
    }

    onerror(evt) {
        console.log("SignalK: websocket connection failed.");
        this.ws = null;
        if (this.hosts.length > 0) {
            var [ host, port ] = this.hosts.shift();
            this.ws = new WebSocket("ws://" + host + ":" + port + "/signalk/v1/stream?subscribe=none");
        }
    }

	onmessage(evt) {
        //console.log("SignalK: websocket message received %s", JSON.stringify(evt.data));
        var data = JSON.parse(evt.data);
        if ((data.updates !== undefined) && (data.updates.length > 0)) data.updates.forEach(update => {
            var source = update["$source"];
            var timestamp = update["timestamp"];
       	    if ((update.values !== undefined) && (update.values.length > 0)) update.values.forEach(updateValue => {
       		    var path = updateValue.path;
       		    var value = updateValue.value;
       		    if ((path !== undefined) && (value !== undefined) && (this.directory[path] !== undefined)) {
                    this.directory[path].forEach(callback => callback({ "source": source, "timestamp": timestamp, "value": value }));
                }
            });
        });
    }

    /**
     * registerCallback subscribes the client component <callback> so that it
     * will be invoked each time a specified Signal K <path> value is updated.
     * <callback> can reference either a function or an object instance in
     * which case the object must provide a function called update which will
     * be used as the callback.
     *
     * Delta values returned by the Signal K server are converted to JSON and
     * optionally filtered by an external <filter> before being passed to the
     * callback.
     *
     * @param path - Signal K path on which updates will trigger callback.
     * @param callback - client callback object or function.
     * @param filter - optional filter function used to pre-process delta
     * values before they are passed to callback.
     */
    registerCallback(path, callback, filter) {
        //console.log("registerCallback(%s,%s,%s)...", path, callback, filter);

        if (this.ws != null) {
            if (this.directory[path] === undefined) {
                this.directory[path] = [];
                var subscriptions = [ { "path": path, "minPeriod": 1000, "policy": "instant" } ];
                var msg = { "context": "vessels.self", "subscribe": subscriptions };
                this.ws.send(JSON.stringify(msg));
        	}

            var _filter = filter;
            var _callback = callback;

            if (!this.directory[path].includes(callback)) {
                this.directory[path].push(v => {
                    if (_filter === undefined) v = v.value;
                    switch (typeof _callback) {
                        case "object": _callback.update(v); break;
                        case "function": _callback(v); break;
                        default: break;
                    }
                });
            } else {
                console.log("SignalK: refusing to register a duplicate callback");
            }
        } else {
            console.log("SignalK: cannot register callback because websocket is not open");
        }
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

    registerInterpolation(path, element, filter) {
        this.registerCallback(path, function(v) { element.innerHTML = v; }, filter);
    }

    deregisterCallback(path, callback) {
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

    getValue(path, async, callback, filter) {
        this.httpGet(this.normalisePath(path), async, (v) => {
            v = JSON.parse(v);
            if (typeof v === "object") v = v.value;
            callback(filter(v));
        });
    }

    getObject(path, async, callback, filter) {
        this.httpGet(this.normalisePath(path), async, (v) => {
            v = JSON.parse(v);
            callback(filter(v));
        });
    }

    getValues(path, async, callback) {
        this.httpGet(this.normalisePath(path), async, (v) => {
            v = JSON.parse(v);
            if (typeof v === "object") v = v.values;
            callback(v);
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

    interpolateValue(path, element, async, filter) {
        //console.log("interpolateValue(%s,%s,%s)...", path, JSON.stringify(element), JSON.stringify(filter));
        this.getValue(path, async, function(v) { element.innerHTML = v; }, filter);
    }

    


    httpGet(theUrl, async, callback) {
        var xmlHttp = new XMLHttpRequest();
        if (async) {
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) callback(xmlHttp.responseText);
            }
        }
        xmlHttp.open("GET", theUrl, async);
        xmlHttp.send();
        if (!async) {
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) callback(xmlHttp.responseText);
        }
    }

    normalisePath(path) {
        var retval = "/signalk/v1/api/vessels/self/";
        var parts = path.split("[");
        retval += parts[0].replace(/\./g, "/");
        if (parts[1] !== undefined) retval += ("[" + parts[1]);
        return(retval);
    }

}

