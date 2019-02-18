var OVERLAY_DICTIONARY = {};

FUNCTIONS = {

    openOverlay: function(target, dictionary) {
	    var overlay = document.getElementById("overlay");
        var overlayHtml = dictionary.overlay;
        var overlayWidth = dictionary.width;
        var overlayHeight = dictionary.height;
	    if (overlayWidth) overlay.style.width = overlayWidth;
	    if (overlayHeight) overlay.style.height = overlayHeight;
	    OVERLAY_DICTIONARY = dictionary;
	    if (overlay.classList[0] != overlayHtml) {
	        overlay.style.display = "block";
	        loadHTML(overlay, overlayHtml, overlayHtml, (container) => {
                walkTheDOM(container, (node) => {
                    if ((node.classList) && (node.classList.contains("button"))) activateElement(node, "click", FUNCTIONS);
                });
	            if (dictionary.furtheraction) FUNCTIONS[dictionary.furtheraction[0]](target, dictionary);
	        });
	    }
	    dragElement(overlay);
    
        function walkTheDOM(node, func) {
            func(node);
            node = node.firstChild;
            while (node) {
                walkTheDOM(node, func);
                node = node.nextSibling;
            }
        }
    },
    closeOverlay: function(target, dictionary) {
        var overlay = document.getElementById("overlay");
        OVERLAY_DICTIONARY = {};
        overlay.style.display = "none";
        overlay.classList.forEach(name => overlay.classlist.remove(name));
        overlay.innerHTML = "";
    },
    toggleOverlay: function(target, dictionary) {
        if ((overlay.style.display == "none") || (overlay.style.display == "")) {
            FUNCTIONS.openOverlay(target, dictionary);
        } else {
            FUNCTIONS.closeOverlay(target, dictionary);
        }
    },
    expandContractOverlay: function(target, dictionary) {
        if (target.classList.contains("overlay-fullscreen")) {
            target.classList.remove("overlay-fullscreen");
        } else {
            target.classList.add("overlay-fullscreen");
        }
    },
    displaySensorLog: function(target, dictionary) {
        //console.log("displaySensorLog(%s,%s)...", JSON.stringify(target), JSON.stringify(dictionary));
        var buttons = document.getElementsByClassName("sensorlog-button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.remove("lcars-selected");
            if (buttons[i].id == dictionary.chart) buttons[i].classList.add("lcars-selected");
        };
        var img = document.getElementById("overlay-sensorlog");
        img.setAttribute("src", "/signalk-sensor-log/charts/" + OVERLAY_DICTIONARY.group + "." + dictionary.chart + ".svg");
    }
}
