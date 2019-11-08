class Widget {

    constructor(parentNode, widgetOptions, widgetComponentCreateFunction, getFilterFunction) {
        console.log("Widget(%s,%s)...", parentNode, JSON.stringify(widgetOptions)); 

        this.parentNode = parentNode;
        this.innerHtml = parentNode.innerHTML.trim();
        this.widgetComponentCreateFunction = widgetComponentCreateFunction;
        this.timestamp = undefined;
        this.latest = undefined;
        this.components = [];
        this.card = undefined;

        this.parentNode.innerHTML = "";
        this.card = document.createElement("div"); 
        this.card.className = "widget-card";

        console.log(">>>>>>>> " + JSON.stringify(Object.keys(widgetOptions)));
        for (var componentName of Object.keys(widgetOptions)) {
            var component = widgetComponentCreateFunction(componentName, this.innerHtml, widgetOptions, getFilterFunction);
            if (component != undefined) {
                this.card.appendChild(component.getTree());
                this.components.push(component);
            }
        }

        this.parentNode.appendChild(this.card);
    }


    update(value) {
        //console.log("Widget.update(%s)...", JSON.stringify(value));

        this.timestamp = Date().now;
        this.latest = value;
        this.components.forEach(component => component.update(value));
    }

}

