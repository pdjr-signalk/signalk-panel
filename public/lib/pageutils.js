class PageUtils {

	constructor(options) {
        PageUtils.overlayOnLoad = (options.overlayOnLoad)?options.overlayOnLoad:null;
	}


	/**
	 * include - searches a DOM sub-tree identifying DIVs which contain
	 * a "data-include" attribute referencing an external HTML file which
	 * is loaded as the content of DIV.
	 *
	 * root - the root element of the tree to be processed.
	 */

	static include(root) {
    	var elements = root.getElementsByTagName("div");
    	[...elements].forEach(element => {
       		var path = element.getAttribute("data-include");
       		if (path) {
           			var html = PageUtils.httpGet(path);
                    if (html) {
          			    element.innerHTML = html;
           			    element.parentNode.replaceChild(element.children[0], element);
                    } else {
                        console.log("PageUtils::include: error loading " + path);
                    }
       		}
    	});
	}

	static addHandler(root, selectorclass, eventtype, func) {
		var elements = root.getElementsByClassName(selectorclass);
		[...elements].forEach(element => {
    		if (element.hasAttribute("data-params")) {
        		try {
                    options = JSON.parse(element.getAttribute("data-params"));
                } catch(e) {
                    options = null;
                }
                if (options) {
				    element.addEventListener(eventtype, function(evt) { func(evt.target, params); });
				}
		    }
		});
	}

    static openOverlay(root, path) {
	    if (root != null) {
            var containers = root.getElementsByClassName("overlay-container");
            if (containers.length > 0) {
	            root.style.display = "flex";
                var currentContentPath = containers[0].getAttribute("data-path") || "";
                if (currentContentPath != path) {
                    var content = httpGet(path);
                    if (content) {
                        containers[0].innerHTML = "";
                        containers[0].setAttribute("data-path", path);
                        containers[0].innerHTML = content;
                    }
                    var titles = document.querySelectorAll('[data-overlay-title]');
                    var title = (titles.length > 0)?titles[0].getAttribute("data-overlay-title"):"***";
                    var span = document.getElementById('overlay-title');
                    while (span.firstChild) span.removeChild(span.firstChild );
                    span.appendChild(document.createTextNode(title));
                    if (this.overlayOnLoad) this.overlayOnLoad(root);
                }
            }
        }
    }

    static closeOverlay(root) {
        if (root != null) {
            root.style.display = "none";
        }
    }

    static loadHTML(container, url, classname, callback) {
        if (container) {
            httpGetAsync(url, (content) => {
                if (content) {
                    container.innerHTML = content;
                    if (classname) container.classname = classname;
                    if (callback) callback(container);
                }
            });
        }
    }

    static httpGetAsync(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) callback(xmlHttp.responseText);
        }
        xmlHttp.open("GET", theUrl, true); // true for asynchronous 
        xmlHttp.send(null);
    }

    static httpGet(theUrl) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
        xmlHttp.send( null );
        return xmlHttp.responseText;
    }

    static activateEventListeners(classname, eventtype, callback) {
        var elements = document.getElementsByClassName(classname);
        for (var i = 0; i < elements.length; i++) elements[i].addEventListener(eventtype, callback);
    }

}
