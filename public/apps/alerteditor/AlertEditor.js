class AlertEditor extends SignalK { 

    static create(container, host, port) {
        return(new AlertEditor(container, host, port));
    } 

    constructor(container, host, port) {
        super(host, port).waitForConnection().then(_ => {
            this.container = container;
            this.alerts = this.getAlertsFromLocalStorage();

            container.appendChild(this.createTable());
            var _this = this; window.close = function() { _this.onClose(); }
        });
    }

    getAlertsFromLocalStorage() {
        var retval = {};
        Object.keys(window.localStorage).forEach(key => {
            var parts = key.split(".");
            if ((parts.length == 2) && (parts[1].startsWith("alert-"))) {
                if (retval[parts[0]] === undefined) retval[parts[0]] = {};
                retval[parts[0]][parts[1]] = LocalStorage.getItem(parts[0], parts[1]);
            }
        });
        return(retval);
    }

    onClose() {
        var inputs = this.container.getElementsByTagName("input");
        var changed = [];

        [...inputs].forEach(e => {
            switch (e.type.toLowerCase()) {
                case 'number':
                    if (e.value != e.defaultValue) changed.push([ e.name, e.value ]);
                    break;
                case 'checkbox':
                    if (e.checked != e.defaultChecked) changed.push([ e.name, (e.checked)?"1":"0" ]);
                    break;
                case 'radio':
                    if ((e.checked != e.defaultChecked) && e.checked) changed.push([ e.name, e.value ]);
                    break;
                default:
                    break;
            }
        });

        if (changed.length > 0) {
            if (confirm("Save changes?")) {
                [...changed].forEach(([n,v]) => {
                    switch (n.split('.')[1]) {
                        case "alert-disabled":
                            LocalStorage.setItem(n, v);
                            break;
                        case "alert-test":
                            var testArr = LocalStorage.getItem(n);
                            for (var i = 0; ((i < testArr.length) && (testArr[0] != v)); i++) testArr.push(testArr.shift());
                            LocalStorage.setItem(n, JSON.stringify(testArr));
                            break;
                        case "alert-threshold":
                            LocalStorage.setItem(n, v);
                            break;
                        default:
                            break;
                    }
                });
            }
        }
    }

    createTable() {
        var table = document.createElement("div");
        table.className = "table alert-editor";
        table.setAttribute("data-overlay-title", "ALERT SETTINGS");
        table.appendChild(this.tableHead());
        table.appendChild(this.tableBody());
        return(table);
    }

    tableHead() {
        var head = document.createElement("div"); head.className = "table-head";
        [ "Alert name", "Test", "Threshold", "Disabled" ].forEach(value => {
            var cell = document.createElement("div");
            cell.className = "table-cell";
            cell.appendChild(document.createTextNode(value));
            head.appendChild(cell);
        });
        return(head);
    }

    tableBody() {
        var rowstyle = [ "table-row-a", "table-row-b" ];
        var body = document.createElement("div");
        body.className = "table-body";
            
        Object.keys(this.alerts).forEach(key => {
            var row = this.tableRow(key);
            row.classList.add(rowstyle[0]);
            body.appendChild(row);
            rowstyle.push(rowstyle.shift());
        });
        return(body);
    }

    tableRow(key) {
        var row = document.createElement("div");
        row.className = "table-row ";
        row.appendChild(this.nameCell(key));
        row.appendChild(this.testCell(key));
        row.appendChild(this.thresholdCell(key));
        row.appendChild(this.disabledCell(key));
        return(row);
    }

    nameCell(key) {
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-name";
        cell.appendChild(document.createTextNode(key));
        return(cell);
    }

    testCell(key) {
        var tests = this.alerts[key]["alert-test"];
        var test = tests[0];
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-test";
        tests.sort().forEach(label => {
            var input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.setAttribute("name", key + ".alert-test");
            input.setAttribute("value", label);
            input.checked = (test == label);
            input.defaultChecked = (test == label);
            var elabel = document.createElement("label");
            elabel.appendChild(document.createTextNode(label)); 
            elabel.appendChild(input);
            cell.appendChild(elabel);
        });
        return(cell);
    }
        
    thresholdCell(key) {
        var threshold = this.alerts[key]["alert-threshold"];
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-threshold";
        var input = document.createElement("input");
        input.setAttribute("name", key + ".alert-threshold");
        input.setAttribute('type', 'number');
        input.setAttribute('value', threshold);
        cell.appendChild(input);
        return(cell);
    }

    disabledCell(key) {
        var disabled = this.alerts[key]["alert-disabled"];
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-disabled";
        var input = document.createElement("input");
        input.setAttribute("name", key + ".alert-disabled");
        input.setAttribute('type', 'checkbox');
        input.checked = (disabled == "1");
        input.defaultChecked = (disabled == "1");
        cell.appendChild(input);
        return(cell);
    }

}
