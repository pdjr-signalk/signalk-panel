// Initialise page immediately it has loaded.
//
function init() {
    // Stop the browser from displaying the right-click context menu.
    document.addEventListener("contextmenu", (e) => { contextHandler(e); e.preventDefault(); });
    window.event.cancelBubble = true;
    
    LOCALSTORAGE = window.localStorage;

    var signalk = new SignalK("192.168.1.1", 3000, FunctionFactory.getFilter, Widget.createWidget);
    var pageutils = new PageUtils({ "overlayOnLoad": function(r) { }});

    PageUtils.include(document);

    PageUtils.walk(document, "signalk", function(element) {
        var path = PageUtils.getAttributeValue(element, "data-signalk-path");
        var filter = FunctionFactory.getFilter(PageUtils.getAttributeValue(element, "data-filter"));
        signalk.interpolateValue(path, element, filter);
    });
    
    PageUtils.wildWalk(document, "widget", function(element) {
        var signalkPath = PageUtils.getAttributeValue(element, "data-signalk-path");
        var widgetOptions = PageUtils.getAttributeValue(element, "data-widget-options");
        if ((signalkPath) && (widgetOptions)) {
            signalk.registerCallback(signalkPath, new Widget(element, widgetOptions, WidgetComponent.createWidgetComponent, FunctionFactory.getFilter));
        }
    });

    signalk.subscribe();
}
