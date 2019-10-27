const DEBUG = false;

class PageUtils {

	constructor() {
		console.log("PageUtils: library initialised successfully");
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
            			var html = httpGet(path);
            			element.innerHTML = (html)?html:("<!-- ERROR: unable to GET " + path + " -->");
            			element.parentNode.replaceChild(element.children[0], element);
        		}
    		});
	}

	function addHandler(root, selectorclass, eventtype, func) {
		var elements = root.getElementsByClassName(selectorclass);
		[...elements].forEach(element => {
    			if (element.hasAttribute("data-params")) {
        			try { options = JSON.parse(element.getAttribute("data-params")); } catch(e) { options = null; }
        			if (options) {
					element.addEventListener(eventtype, function(evt) {
						func(evt.target, params); 
					});
				}
			}
		});
	}

}
