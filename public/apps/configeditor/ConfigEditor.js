class ConfigEditor extends SignalK { 

    static create(container, host, port) {
        return(new ConfigEditor(container, host, port));
    } 

    constructor(container, host, port) {
        super(host, port).waitForConnection().then(_ => {
            this.functionFactory = new FunctionFactory();
            this.sources = this.loadSourcesFromLocalStorage();
            this.selectedSource = null;
            
            var _this = this;
            this.selectPopulate(document.getElementById("source-list"), this.sources, ["New source"]);
            this.selectPopulate(document.getElementById("filter-list"), this.functionFactory.getFilterNames());
            super.getEndpoints(endpoints => {
                this.selectPopulate(document.getElementById("path-list"), endpoints.sort(), [""]);
                document.getElementById("source-list").disabled = false;
                document.getElementById("path-list").disabled = false;
            });

            this.addEventListeners();
        });
    }

    addEventListeners() {
        var _this = this;
        document.getElementById("source-list").addEventListener("click", function() {
            _this.selectedSource = _this.sources[this.options[this.selectedIndex].value];
            if (!_this.selectContains(document.getElementById("path-list"), _this.selectedSource.getAttribute("data-signalk-path"))) _this.selectInsert(document.getElementById("path-list"), _this.selectedSource.getAttribute("data-signalk-path"));
            document.getElementById("path-list").value = _this.selectedSource.getAttribute("data-signalk-path");
            _this.updatePathMetaInfo(document.getElementById("path-list-help"), _this.selectedSource.getAttribute("data-signalk-path"));
            document.getElementById("filter-list").value = _this.selectedSource.getAttribute("data-filter");
            _this.displayEditor();
        });
        document.getElementById("path-list").addEventListener("click", function() {
            _this.selectedSource.setAttribute("data-signalk-path", this.options[this.selectedIndex].value);
            _this.updatePathMetaInfo(document.getElementById("path-list-help"), _this.selectedSource.getAttribute("data-signalk-path"));
        });
        document.getElementById("path-list").addEventListener("onpropertychange", function() {
            alert("Value change");
        });
        document.getElementById("filter-list").addEventListener("click", function() {
            _this.selectedSource.setAttribute("data-filter", this.options[this.selectedIndex].value);
            _this.updateEditor();
        });
        document.body.addEventListener("click", function(e) {
            if (e.target.matches(".btn-widget")) {
                var btn = e.target;
                e.stopPropagation();
                if (btn.classList.contains("active")) {
                    btn.classList.remove("active");
                } else {
                    btn.classList.add("active");
                }
                _this.updateModePanel();
            } else if (e.target.matches("#submit")) {
                if (_this.selectedSource) _this.selectedSource.saveToLocalStorage();
                _this.hideEditor();
            } else if (e.target.matches("#cancel")) {
                _this.hideEditor();
            }
        });
        document.getElementById("btn-mode-del").addEventListener("click", function(e) {
            var activeTabs = [...document.getElementsByClassName("mode-tab")].filter(tab => tab.classList.contains("active"));
            if (activeTabs.length == 1) {
                var modeName = activeTabs[0].getAttribute("href").substring(1);
                if (Object.keys(_this.selectedSource.getModes()).includes(modeName)) {
                    console.log(modeName);
                    _this.selectedSource.removeMode(modeName);
                    _this.updateModePanel();
                }
            }
        });
        document.getElementById("btn-mode-add").addEventListener("click", function(e) {
            var modeName = prompt("Enter new mode name", "");
            if (modeName) {
                modeName = modeName.trim();
                if (modeName.length) {
                    _this.selectedSource.setMode(modeName);
                    _this.updateModePanel(modeName);
                }
            }
        });
    }


    displayEditor() {
        //console.log("displayEditor()...");
        document.getElementById("editor-panel").classList.add("show");
        this.updateEditor();
    }

    hideEditor() {
        document.getElementById("source-list").value = document.getElementById("source-list").options[0].value;
        document.getElementById("path-list").value = document.getElementById("path-list").options[0].value;
        document.getElementById("editor-panel").classList.remove("show");
        this.selectedSource = null;
    }
    

    updateEditor() {
        //console.log("updateEditor()...");
        this.updateWidgetPanel();
        this.updateModePanel();
    }

    updateWidgetPanel() {
        //console.log("updateWidgetPanel()...");
        var container = document.getElementById("widget-panel");
        while (container.firstChild) container.removeChild(container.firstChild);
        Widget.availableComponents().sort().forEach(component => {
            var btn = PageUtils.createElement("button", component, "btn btn-outline-primary m-2 btn-widget", component, container);
            if (this.supportsWidget(component)) btn.classList.add("active");
        });
    }
        
    updateModePanel(selectedMode) {
        //console.log("updateModePanel()...");

        var modeList = document.getElementById("mode-list");
        while (modeList.firstChild) modeList.removeChild(modeList.firstChild);
        var modeContainer = document.getElementById("mode-container");
        while (modeContainer.firstChild) modeContainer.removeChild(modeContainer.firstChild);

        var active = (selectedMode)?false:true;
        var modes = this.selectedSource.getAttribute("data-widget-display-mode");
        if (modes) {
            Object.keys(this.selectedSource.getAttribute("data-widget-display-mode")).forEach(key => {
                if ((selectedMode) && (selectedMode == key)) active = true; 
                var lnk = PageUtils.createElement("a", "nav-" + key + "-tab", "mode-tab nav-item nav-link" + ((active)?" active":""), key, modeList);
                lnk.setAttribute("href", "#" + key);
                lnk.setAttribute("data-toggle", "tab");
                lnk.setAttribute("role", "tab");

                this.createModeTabContent(key, active, modeContainer);
                active = false;
            });
        }
    }

    updatePathMetaInfo(element, path) {
        element.innerHTML = "";
        super.getValue(path, function(v) {
            if ((v.meta) && (v.meta.units)) {
                element.innerHTML = "Server values are reported in " + v.meta.units;
            } else {
                element.innerHTML = "Server does not disclosed return value type or units";
            }
        }, v => v);
    }

    createModeTabContent(key, active, container) {
        //console.log("createModeTabContent(%s,%s,%s)...", key, active, container);
        var _this = this;
        var pnl = PageUtils.createElement("div", key , "tab-pane fade" + ((active)?" show active":""), null, container);
        var frm = PageUtils.createElement("form", null, "form-row", null, pnl);
        pnl.setAttribute("role", "tablist");

        var params = new Set(this.functionFactory.getFilter(this.selectedSource.getAttribute("data-filter")));
        frm.appendChild(this.createModeTabParameterGroup(key, Array.from(params)));

        Array.from(document.querySelectorAll(".btn-widget.active")).forEach(elem => {
            var ps = Widget.getParameterNamesForComponent(elem.id).filter(p => (!params.has(p)));
            ps.forEach(name => params.add(name));
            if (ps.length) frm.appendChild(this.createModeTabParameterGroup(key, ps, function(m,n,v) { _this.selectedSource.setAttribute("data-widget-display-mode",m,n,v); }));
        });
    }

    createModeTabParameterGroup(modeName, params, callback) {
        //console.log("createModeTabParameterGroup(%s,%s)...", modeName, JSON.stringify(params));

        var _callback = callback;
        var cnt = PageUtils.createElement("div", null, "border d-inline-flex border-secondary rounded p-1 m-1")
        Array.from(params).sort().forEach(param => {
            cnt.appendChild(this.createInputElement(param, this.selectedSource.getAttribute("data-widget-display-mode", modeName)[param], function(name, value) { _callback(modeName, name, value); }));
        });
        return(cnt);
    }

    createInputElement(name, value, callback) {
        //console.log("createInputElement(%s,%s)...", name, value);

        var _callback = callback;
        var fgp = PageUtils.createElement("div", null, "form-group m-1");
        var lbl = PageUtils.createElement("label", null, null, name, fgp); lbl.setAttribute("for", name);
        var inp = PageUtils.createElement("input", name, "form-control-sm", null, fgp);
        inp.value = value;
        inp.addEventListener("change", function() { _callback(this.id, this.value); }); 
        return(fgp)
    } 

    loadSourcesFromLocalStorage() {
        var retval = {};
        Object.keys(window.localStorage).forEach(key => {
            var parts = key.split(".");
            if (parts.length >= 2) {
                retval[parts[0]] = Source.createFromLocalStorage(parts[0]);
            }
        });
        return(retval);
    }

    selectPopulate(selectelement, values, extraValues, selectedValue) {
        //console.log("selectPopulate(%s,%s,%s,%s)...", listelement, JSON.stringify(values), JSON.stringify(extraValues), selectedValue);
        while (selectelement.firstChild) selectelement.removeChild(selectelement.firstChild);
        var data = (extraValues != null)?extraValues:[];
        if (selectelement) {
            if (Array.isArray(values)) {
                data = data.concat(values.sort());
            } else {
                if (typeof values === "object") data = data.concat(Object.keys(values).sort());
            }
            data.forEach(value => {
                var option = document.createElement("option");
                option.setAttribute("value", value);
                option.innerHTML = value;
                if ((selectedValue) && (value == selectedValue)) option.selected = true;
                selectelement.appendChild(option);
            });
        }
        return(values);
    }

    selectContains(selectelement, optionValue) {
        var retval = false;
        for (var i = 0; i < selectelement.options.length; i++) {
            retval |= (selectelement.options[i].value == optionValue);
        }
        return(retval);
    }

    selectInsert(selectelement, optionValue, selected=true) {
        var option = null;
        for (var i = 0; i < selectelement.options.length; i++) {
            if (selectelement.options[i].value > optionValue) {
                option = document.createElement("option"); option.setAttribute("value", optionValue); option.innerHTML = optionValue; 
                selectelement.insertBefore(option, selectelement.options[i]);
                break;
            }
        }
        if (option == null) {
            option = document.createElement("option"); option.setAttribute("value", optionValue); option.innerHTML = optionValue; 
            selectelement.insertAfter(option, selectelement.options[i]);
        }
        option.selected = selected;
        return(option);
    }
    

    /**
     * Returns true if the Widget identified by widgetName is supported by the
     * currently selected source object's parameter set.
     */
    supportsWidget(widgetName) {
        var retval = true;
        var widgetParameterNames = Widget.getParameterNamesForComponent(widgetName);
        
        if (widgetParameterNames.length > 0) {
            var modes = this.selectedSource.getAttribute("data-widget-display-mode");
            if (modes) { 
                var params = Array.from(new Set(Object.keys(modes).reduce((a,v) => { return(a.concat(Object.keys(modes[v]))); }, [])));
                if (widgetParameterNames.some(elem => (params.indexOf(elem) === -1))) retval = false;
            } else {
                retval = false;
            }
        }
        return(retval);
    }
        
}
