/**
 * Interface to Signal K server data streams.
 *
 * Applications deploying this class can extend the class using the following
 * simple pattern:
 *
 * super(host, port).waitForConnection().then(_ => {
 *     // do application specific stuff
 * });
 */

class SignalK {

    /**
     * Create a new SignalK object and associate it with the Signal K server
     * identified by <host>:<port>.  The constructor attempts to establish a
     * connection ito the server asynchronously and will typically return
     * before the putative connection is in a usable state.  The
     * waitForConnection method can be used to manage this eventuality.
     */
    constructor(host, port) {
        //console.log("SignalK(%s,%s,%s)...", JSON.stringify(hosts), getFilter);
        this.host = host;
        this.port = parseInt(port);

        this.ws = null;
        this.directory = {};

        if ((host !== undefined) && (port !== undefined)) {
		    console.log("SignalK: opening websocket connection to %s on port %s", host, port);
       	    this.ws = new WebSocket("ws://" + host + ":" + port + "/signalk/v1/stream?subscribe=none");
            var _this = this;
            this.ws.onopen = function(evt) { console.log("SignalK: websocket connection established"); }
            this.ws.onerror = function(evt) { console.log("SignalK: websocket connection failed."); this.ws = null; }
            this.ws.onmessage = function(evt) { 
                //console.log("SignalK: websocket message received %s", JSON.stringify(evt.data));
                var data = JSON.parse(evt.data);
                if ((data.updates !== undefined) && (data.updates.length > 0)) {
                    data.updates.forEach(update => {
                        var source = update["$source"];
                        var timestamp = update["timestamp"];
   	                    if ((update.values !== undefined) && (update.values.length > 0)) {
                            update.values.forEach(updateValue => {
   		                        var path = updateValue.path;
   		                        var value = updateValue.value;
   		                        if ((path !== undefined) && (value !== undefined) && (_this.directory[path] !== undefined)) {
                                    _this.directory[path].forEach(callback => callback({ "source": source, "timestamp": timestamp, "value": value }));
                                }
                            });
                        }
                    });
                }
            }
        } else {
            console.log("SignalK: invalid host specification");
        }
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
                    v = (_filter !== undefined)?_filter(v):v.value;
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
        var _filter = filter;
        this.registerCallback(path, function(v) { element.innerHTML = (_filter !== undefined)?_filter(v):v; });
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
            callback((filter !== undefined)?filter(v):v);
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

    waitForConnection(timeout=500) {
        const poll = resolve => {
            if (this.ws.readyState === WebSocket.OPEN) { resolve(); } else { setTimeout(_ => poll(resolve), timeout); }
        }
        return new Promise(poll);
    }

}

