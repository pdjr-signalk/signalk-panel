class Widget {

    constructor(parentNode, widgetOptions, createWidgetComponent, getFilterFunction) {
        //console.log("Widget(%s,%s)...", parentNode, JSON.stringify(widgetOptions)); 

        this.parentNode = parentNode;
        this.widgetOptions = widgetOptions;
        this.createWidgetComponent = createWidgetComponent;
        this.getFilterFunction = getFilterFunction;

        this.components = [];

        for (var componentName of Object.keys(widgetOptions)) {
            var component = createWidgetComponent(componentName, parentNode, widgetOptions, getFilterFunction);
            if (component) this.components.push(component);
        }

        if (this.components.reduce((a,c) => ((c.getTree() !== undefined) || a), false)) {
            var card = document.createElement("div");
            card.className = "widget-card";
            this.components.filter(component => (component.getTree() !== undefined)).forEach(component => {
                card.appendChild(component.getTree());
            });
            this.parentNode.innerHTML = "";
            this.parentNode.appendChild(card);
        }
    }

    update(value) {
        //console.log("Widget.update(%s)...", JSON.stringify(value));

        this.timestamp = Date().now;
        this.latest = value;
        this.components.forEach(component => component.update(value));
    }

}
