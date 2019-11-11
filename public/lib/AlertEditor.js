class AlertEditor { 

    static createAlertEditor() {
        return(new AlertEditor());
    } 

    constructor() {
        //console.log("AlertEditor()...");

        this.tree = undefined;

        var table = document.createElement("div");
        table.className = "table alert-editor w3-theme-dark";
        table.setAttribute("data-overlay-title", "ALERT SETTINGS");

        table.appendChild(this.tableHead());
        table.appendChild(this.tableBody());

        this.tree = table;
    }

    getTree() { 
        return(this.tree);
    }

    onClose() {
        var rows = this.tree.getElementsByTagName("input");
        var changed = [];

        [...rows].forEach(e => {
            switch (e.type.toLowerCase()) {
                case 'number':
                    if (e.value != e.defaultValue) changed.push([ e.name, e.value ]);
                    break;
                case 'checkbox':
                    if (e.checked != e.defaultChecked) changed.push([ e.name, (e.checked)?"1":"0" ]);
                    break;
                case 'radio':
                    if ((e.checked != e.defaultChecked) && e.checked) changed.push([ e.name, (e.checked)?"1":"0" ]);
                    break;
                default:
                    break;
            }
        });

        if (changed.length > 0) {
            if (confirm("Save changes?")) {
                [...changed].forEach(([n,v]) => {
                    console.log("%s %s", n, v);
                    window.localStorage.setItem(n, v);
                });
            }
        }
    }

    tableHead() {
        var thead = document.createElement("div");
        thead.className = "table-head";
        [ "Alert name", "Test", "Threshold", "Disabled" ].forEach(value => {
            var cell = document.createElement("div"); 
            cell.className = "table-cell";
            cell.appendChild(document.createTextNode(value));
            thead.appendChild(cell);
        });
        return(thead);
    }

    tableBody() {
        var tbody = document.createElement("div");
        var rowstyle = [ "w3-theme-l1", "w3-theme-d1" ];
        tbody.className = "table-body";
        PageUtils.walk(document, "alert", element => {
            var row = this.tableRow(element);
            row.classList.add(rowstyle[0]); rowstyle = rowstyle.push(rowstyle.shift());
            tbody.appendChild(this.tableRow(element));
        });
        return(tbody);
    }


    tableRow(element) {
        var row = document.createElement("div");
        row.className = "table-row " + element.id;
        if (element.classList.contains("alert-cancelled")) row.classList.add("alert-cancelled");

        row.appendChild(this.nameCell(element));
        row.appendChild(this.testCell(element));
        row.appendChild(this.thresholdCell(element));
        row.appendChild(this.disabledCell(element));

        return(row);
    }

    nameCell(element) {
        var cell = document.createElement("div");
        cell.className = "table-cell";
        cell.appendChild(document.createTextNode(element.id));
        return(cell);
    }

    testCell(element) {
        var cell = document.createElement("div");
        cell.className = "table-cell center";
        [ "eq", "gt", "lt" ].forEach(label => {
            var input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.setAttribute("name", element.id + "-test");
            input.setAttribute("value", label);
            input.checked = (window.localStorage.getItem(element.id + "-test") == label);
            input.defaultChecked = (window.localStorage.getItem(element.id + "-test") == label);
            var elabel = document.createElement("label");
            elabel.appendChild(document.createTextNode(label)); 
            elabel.appendChild(input);
            cell.appendChild(elabel);
        });
        return(cell);
    }
        
    thresholdCell(element) {
        var cell = document.createElement("div");
        cell.className = "table-cell";
        var input = document.createElement("input");
        input.setAttribute("name", element.id + "-threshold");
        input.setAttribute('type', 'number');
        input.setAttribute('value', window.localStorage.getItem(element.id + "-threshold"));

        cell.appendChild(input);
        return(cell);
    }

    disabledCell(element) {
        var cell = document.createElement("div");
        cell.className = "table-cell center";
        var input = document.createElement("input");
        input.setAttribute("name", element.id + "-disabled");
        input.setAttribute('type', 'checkbox');
        input.checked = (window.localStorage.getItem(element.id + "-disabled") == "1");
        input.defaultChecked = (window.localStorage.getItem(element.id + "-disabled") == "1");
        cell.appendChild(input);
        return(cell);
    }

}
