class Panel {

    /**
     * createPanel instantiates a new Panel() using either a SignalkClient
     * interface object registered as a window global in some parent of the
     * current document or, optionally and as a fallback, a new SignalkClient
     * made just for this page.
     *
     * @param container - a <div> element in the DOM which should house the
     *   new panel.
     * @param options - an optional object of the form { server: s, port: p }
     *   where s specifies the server name and p specifies ther server port
     *   to which a new, private, SignalkClient should bei connected.  If
     *   options is not supplied then createPanel can only succeed if there
     *   is parent document supplying a global SignalkClient. 
     * @returns - new connected Panel instance.
     */
    static create(container, options) {
        if (window.parent.window.SignalkClient) {
            return(new Panel(container, window.parent.window.SignalkClient));
        }

        if (options) {
            if ((options.server) && (options.port)) {
                return(new Panel(container, new SignalkClient(options.server, options.port)));
            } else {
                throw "Panel: invalid options aregument to .createPanel()";
            }
        }

        return(null);
    }

    constructor(container, signalkClient) {

        if (typeof container === 'string') container = document.querySelector(container);
        if (!container) throw "Panel: bad or missing container";

        if (!signalkClient) throw "Panel: bad or missing SignalkClient interface object";

        signalkClient.waitForConnection().then(_ => {
            // Initialise page helper library
            this.functionfactory = new FunctionFactory();
            this.localStorage = StructuredStorage.create(window.localStorage, "pdjr");

            // Keep loading fragments until there's nothing left to load...
            while (PageUtils.walk(container, "[data-include]", element => {
                PageUtils.include(element, element.getAttribute('data-include'));
                element.removeAttribute('data-include');
            }));

            // Load application configuration into local storage
            PageUtils.walk(container, ".storage-config", element => this.localStorage.initialise(element));

            // Populate page with local storage item values
            PageUtils.walk(container, ".storage-item-value", element => element.innerHTML = this.localStorage.getValue(element.getAttribute("data-storage-item-name")));

            // Populate page with static values derived from Signal K server
            PageUtils.walk(container, ".signalk-static", element => {
                var path = element.getAttribute('data-signalk-path');
                var filter = this.functionfactory.getFilter(element.getAttribute('data-filter'));
                signalkClient.interpolateValue(path, element, filter);
            });

            // Populate page with dynamic values derived from Signal K server
            PageUtils.walk(container, ".signalk-dynamic", element => {
                var path = element.getAttribute('data-signalk-path');
                var filter = this.functionfactory.getFilter(element.getAttribute('data-filter'));
                signalkClient.registerCallback(path, function(v) { alert("Hello"); });
            });

            // Populate page with widgets
            PageUtils.walk(container, "[class*=widget-]", element => {
                if (element.hasAttribute('data-source')) this.localStorage.setAsAttributes(element.getAttribute('data-source'), element); 
                if (element.hasAttribute('data-signalk-path')) {
                    signalkClient.registerCallback(element.getAttribute('data-signalk-path'), Widget.createWidget(element, element.getAttribute('data-filter')));
                }
            });
        });

    }

}
