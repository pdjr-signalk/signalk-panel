class Panel extends SignalK {

    static createPanel(container, host, port) {
        return(new Panel(container, host, port));
    }

    constructor(container, host, port) {
        super(host, port).waitForConnection().then(_ => {
            // Initialise page helper library
            var pageutils = new PageUtils({ "overlayOnLoad": function(r) { }});
            var functionfactory = new FunctionFactory();

            // Load document fragments
            PageUtils.include(document);

            // Load application configuration into local storage
            PageUtils.walk(document, "storage-config", element => LocalStorage.initialise(element));

            // Populate page with local storage item values
            PageUtils.walk(document, "storage-item-value", element => element.innerHTML = LocalStorage.getAtom(element.getAttribute("data-storage-item-name")));

            // Populate page with static values derived from Signal K server
            PageUtils.walk(document, "signalk-static", element => {
                var path = PageUtils.getAttributeValue(element, "data-signalk-path");
                var filter = functionfactory.getFilter(PageUtils.getAttributeValue(element, "data-filter"));
                super.interpolateValue(path, element, filter);
            });

            // Populate page with dynamic values derived from Signal K server
            PageUtils.walk(document, "signalk-dynamic", element => {
                var path = PageUtils.getAttributeValue(element, "data-signalk-path");
                var filter = functionfactory.getFilter(PageUtils.getAttributeValue(element, "data-filter"));
                super.registerCallback(path, function(v) { alert("Hello"); });
            });

            // Populate page with widgets
            PageUtils.wildWalk(document, "widget-", element => {
                var widgetType = element.className.split(" ").reduce((a,v) => { return((v.startsWith("widget-"))?v.substr(7):undefined); }, undefined);
                if (widgetType != undefined) {
                    if (element.hasAttribute("data-parameters")) {
                        var params = Parameters.parse(element.getAttribute("data-parameters"));
                        var source = Parameters.get(params, "source");
                        var filter = Parameters.get(params, "filter");
                        if (source !== undefined) {
                            super.registerCallback(source, Widget.createWidget(element, widgetType, params, functionfactory.getFilter(filter, params)));
                        }
                    } 
                }
            });
        });

    }

    connectionLost() {
        if (confirm("Server connection lost! Reconnect?")) {
            window.location = window.location;
        }
    }

}
