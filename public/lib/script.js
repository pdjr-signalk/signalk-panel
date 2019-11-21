// Initialise page immediately it has loaded.
//
function init() {
    // Stop the browser from displaying the right-click context menu.
    document.addEventListener("contextmenu", (e) => { contextHandler(e); e.preventDefault(); });
    window.event.cancelBubble = true;
    
    var signalk = new SignalK("192.168.1.1", 3000, FunctionFactory.getFilter, Widget.createWidget);
    var pageutils = new PageUtils({ "overlayOnLoad": function(r) { }});

    PageUtils.include(document);
    PageUtils.walk(document, "storage-config", element => LocalStorage.initialise(element));
    PageUtils.walk(document, "storage-item-value", element => {
        element.innerHTML = LocalStorage.getAtom(element.getAttribute("data-storage-item-name"))
    });

    PageUtils.wildWalk(document, "signalk-", element => {
        if (element.classList.contains("signalk-static")) {
            var path = PageUtils.getAttributeValue(element, "data-signalk-path");
            var filter = FunctionFactory.getFilter(PageUtils.getAttributeValue(element, "data-filter"));
            signalk.interpolateValue(path, element, filter);
        }
        if (element.classList.contains("signalk-dynamic")) {
            var path = PageUtils.getAttributeValue(element, "data-signalk-path");
            var filter = FunctionFactory.getFilter(PageUtils.getAttributeValue(element, "data-filter"));
            signalk.registerCallback(path, function(v) { alert("Hello"); });
        }
    });

    PageUtils.wildWalk(document, "widget-", element => {
        var widgetType = element.className.split(" ").reduce((a,v) => { return((v.startsWith("widget-"))?v.substr(7):undefined); }, undefined);
        if (widgetType != undefined) {
            if (element.hasAttribute("data-parameters")) {
                var params = Parameters.createParameters(element.getAttribute("data-parameters"));
                var source = params.getParameter("source");
                if (source !== undefined) {
                    signalk.registerCallback(source, Widget.createWidget(element, widgetType, params, WidgetComponent.createWidgetComponent, FunctionFactory.getFilter));
                }
            } 
        }
    });

    signalk.subscribe();

}
