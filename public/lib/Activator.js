class Activator {

	constructor(getFilter) {
        this.getFilter = getFilter;
	}

    interpolateValues(root, className="signalk", interpolationFunction) {
        var elements = root.getElementsByClassName(className);
        [...elements].forEach(element => {
            if (element.hasAttribute("data-source")) {
                try {
                    var soptions = JSON.parse(element.getAttribute("data-source"));
                    var path = ((soptions) && (soptions.signalk))?soptions.signalk:null;
                } catch(e) {
                    console.log("error parsing %s", element.getAttribute("data-source"));
                    break;
                }
                if (path) {
                    var compositefilter = null;
                    if (element.hasAttribute("data-filter")) {
                        var filters = element.getAttribute("data-filter").split(";");
                        [...filters].forEach(filter => {
                            fspecparts = filter.split(",");
                            var func = this.getFilter(fspecparts[0], fspecparts.slice[1]);
                            compositeFilter = (compositeFilter == null)?func:function(v) { func(compositeFilter(v)) };
                        });
                    interpolationFunction(path, element, compositeFilter);
                }
            }
        });
    }

    registerWidgets(root, className="widget", registrationFunction, widgetCreationFunction) {
        var path, options, soptions, woptions, widget;
        var elements = root.getElementsByClassName(className);
        [...elements].forEach(element => {
            if (element.hasAttribute("data-source")) {
                try {
                    soptions = JSON.parse(element.getAttribute("data-source"));
                    path = ((soptions) && (soptions.signalk))?soptions.signalk:null;
                } catch(e) {
                    console.log("error parsing %s", element.getAttribute("data-source"));
                    break;
                }
                if (path) {
                    if (element.hasAttribute("data-params")) {
                        try {
                            woptions = JSON.parse(element.getAttribute("data-params");
                        } catch(e) {
                            console.log("error parsing %s", attribute.value);
                            break;
                        }
                        if ((widget = widgetCreationFunction(element, woptions, this.getFilter)) != null) {
                            registrationFunction(path, widget.update);
                        } else {
                            console.log("error creating widget");
                            break;
                        }
                    }
                }
            }
        });
    }

}

