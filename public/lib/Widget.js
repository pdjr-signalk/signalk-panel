class Widget {

    static createWidget(parentNode, type, params, filter) {
        //console.log("createWidget(%s,%s,%s)...", parentNode, type, JSON.stringify(params)); 
        return(new Widget(parentNode, type, params, filter));
    }

    constructor(parentNode, type, params, filter) {
        //console.log("Widget(%s,%s,%s)...", parentNode, type, JSON.stringify(params)); 

        this.parentNode = parentNode;
        this.type = type;
        this.params = params;
        this.filter = filter;
        this.components = [];

        switch (type) {
            case "alert":
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "alert", params));
                break;
            case "cursor":
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "cursor", params));
                break;
            case "gauge":
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "scale", params));
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "cursor", params));
                break;
            case "indicator":
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "indicator", params));
                break;
            case "scale":
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "scale", params));
                break;
            case "textgauge":
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "text", params));
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "scale", params));
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "cursor", params));
                break;
            case "text":
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "text", params));
                break;
            case "textcursor":
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "text", params));
                this.components.push(WidgetComponent.createWidgetComponent(parentNode, "cursor", params));
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
        this.components.forEach(component => component.update((this.filter !== undefined)?this.filter(value):value));
    }

}
