class WidgetFactory {

    static createWidgetFactory(createWidget, ffactory) {
        return(new WidgetFactory(createWidget, ffactory));
    }

    constructor(ffactory=null) {
        this.ffactory = ffactory;
    }

    createWidget(parentNode, options) {
        return(this.widget.createWidget(parentNode, options, ffunc));
    }

}
