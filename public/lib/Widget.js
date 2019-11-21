class Widget {

    static createWidget(parentNode, type, parameters, createWidgetComponent, getFilter) {
        return(new Widget(parentNode, type, parameters, createWidgetComponent, getFilter));
    }

    constructor(parentNode, type, parameters, createWidgetComponent, getFilter) {
        //console.log("Widget(%s,%s,%s)...", parentNode, type, JSON.stringify(parameters)); 

        this.parentNode = parentNode;
        this.type = type;
        this.parameters = parameters;
        this.createWidgetComponent = createWidgetComponent;
        this.getFilter = getFilter;
        this.components = [];

        switch (type) {
            case "alert":
                this.components.push(createWidgetComponent(parentNode, "alert", parameters, getFilter));
                break;
            case "cursor":
                this.components.push(createWidgetComponent(parentNode, "cursor", parameters, getFilter));
                break;
            case "gauge":
                this.components.push(createWidgetComponent(parentNode, "scale", parameters, getFilter));
                this.components.push(createWidgetComponent(parentNode, "cursor", parameters, getFilter));
                break;
            case "indicator":
                this.components.push(createWidgetComponent(parentNode, "indicator", parameters, getFilter));
                break;
            case "scale":
                this.components.push(createWidgetComponent(parentNode, "scale", parameters, getFilter));
                break;
            case "textgauge":
                this.components.push(createWidgetComponent(parentNode, "text", parameters, getFilter));
                this.components.push(createWidgetComponent(parentNode, "scale", parameters, getFilter));
                this.components.push(createWidgetComponent(parentNode, "cursor", parameters, getFilter));
                break;
            case "text":
                this.components.push(createWidgetComponent(parentNode, "text", parameters, getFilter));
                break;
            case "textcursor":
                this.components.push(createWidgetComponent(parentNode, "text", parameters, getFilter));
                this.components.push(createWidgetComponent(parentNode, "cursor", parameters, getFilter));
                break;
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
