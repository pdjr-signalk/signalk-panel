class Panel {

    static createPanel(container, options) {
        var client = null;

        if (window.parent.window.SignalkClient) {
            client = window.parent.window.SignalkClient;
        } else {
            if ((options.server) && (options.port)) {
                client = new SignalkClient(options.server, options.port);
            }
        }
        return(new Panel(container, client));
    }

    constructor(container, signalkClient) {
        if (!container) throw "Panel: the supplied panel container does not exist";
        if (!signalkClient) throw "Panel: bad or missing SignalK client interface";
        signalkClient.waitForConnection().then(_ => {
            // Initialise page helper library
            this.pageutils = new PageUtils({ "overlayOnLoad": function(r) { }});
            this.functionfactory = new FunctionFactory();
            this.localStorage = StructuredStorage.create(window.localStorage, "pdjr");

            // Load document fragments
            PageUtils.include(document);

            // Load application configuration into local storage
            PageUtils.walk(document, "storage-config", element => this.localStorage.initialise(element));

            // Populate page with local storage item values
            PageUtils.walk(document, "storage-item-value", element => element.innerHTML = this.localStorage.getValue(element.getAttribute("data-storage-item-name")));

            // Populate page with static values derived from Signal K server
            PageUtils.walk(document, "signalk-static", element => {
                var path = PageUtils.getAttributeValue(element, "data-signalk-path");
                var filter = this.functionfactory.getFilter(PageUtils.getAttributeValue(element, "data-filter"));
                signalkClient.interpolateValue(path, element, filter);
            });

            // Populate page with dynamic values derived from Signal K server
            PageUtils.walk(document, "signalk-dynamic", element => {
                var path = PageUtils.getAttributeValue(element, "data-signalk-path");
                var filter = this.functionfactory.getFilter(PageUtils.getAttributeValue(element, "data-filter"));
                signalkClient.registerCallback(path, function(v) { alert("Hello"); });
            });

            // Populate page with widgets
            PageUtils.wildWalk(document, "widget-", element => {
                if (element.hasAttribute("data-source")) this.localStorage.setAsAttributes(element.getAttribute("data-source"), element); 
                if (element.hasAttribute("data-signalk-path")) {
                    signalkClient.registerCallback(element.getAttribute("data-signalk-path"), Widget.createWidget(element, element.getAttribute("data-filter")));
                }
            });
        });

    }

    connectionLost() {
        if (confirm("Server connection lost! Reconnect?")) {
            window.location = window.location;
        }
    }

    rightClick(e) {
        alert("Hello");
    }

}
