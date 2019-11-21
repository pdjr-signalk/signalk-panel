/**
 * AlertEditor implements a simple interactive form for editing the settings
 * of an application's AlertWidgets.
 *
   AlertEditor will only work for
 * AlertWidgets which store their configuration data in the LocalSession
 * cache.
 *
 * When instantiated the editor scans the host document for all AlertWidget's
 * that meet the above criteria and builds a DOM tree consisting of a table of
 * user-editable widget settings. The tree has the following general structure.
 *
 * DIV .table.alert-editor
 *   DIV .table-head
 *     DIV .table-row
 *       DIV .table-cell (repeats for each attribute column title)
 *   DIV .table-body
 *     DIV .table-row.alert-editor-entry-[a|b] (repeats for each AlertWidget in the host document)
 *       DIV .table-cell.alert-editor-name 
 *       DIV .table-cell.alert-editor-test 
 *         LABEL
 *           INPUT .{alert-element-id}-test
 *       DIV .table-cell.alert-editor-threshold
 *         INPUT .{alert-element-id}-threshold
 *       DIV .table-cell.alert-editor-disabled
 *         INPUT .{alert-element-id}-disabled
 *       DIV .table-cell.alert-editor-active
 *
 * The returned AlertEditor instance offers
 * just two public methods:
 */

class AlertEditor { 

    static createAlertEditor() {
        return(new AlertEditor());
    } 

    constructor() {
        //console.log("AlertEditor()...");

        this.tree = document.createElement("div");
        this.tree.className = "table alert-editor";
        this.tree.setAttribute("data-overlay-title", "ALERT SETTINGS");
        this.tree.appendChild(this.tableHead());
        this.tree.appendChild(this.tableBody());
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

    tableHead() {
        var head = document.createElement("div"); head.className = "table-head";
        [ "Alert name", "Test", "Threshold", "Disabled", "Active" ].forEach(value => {
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
        PageUtils.walk(document, "widget-alert", element => {
            var row = this.tableRow(element.id, Parameters.createParameters(element.getAttribute("data-parameters")));
            row.classList.add(rowstyle[0]);
            body.appendChild(row);
            rowstyle = rowstyle.push(rowstyle.shift());
        });
        return(body);
    }

    tableRow(id, parameters) {
        var row = document.createElement("div");
        row.className = "table-row";
        row.appendChild(this.nameCell(id, parameters));
        row.appendChild(this.testCell(id, parameters));
        row.appendChild(this.thresholdCell(id, parameters));
        row.appendChild(this.disabledCell(id, parameters));
        row.appendChild(this.activeCell(id, parameters));
        return(row);
    }

    nameCell(id, parameters) {
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-name";
        cell.appendChild(document.createTextNode(id));
        return(cell);
    }

    testCell(id, parameters) {
        var tests = parameters.getParameter("alert-test");
        var test = tests[0];
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-test";
        tests.sort().forEach(label => {
            var input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.setAttribute("name", parameters.getParamString() + ".alert-test");
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
        
    thresholdCell(id, parameters) {
        var threshold = parameters.getParameter("alert-threshold", parseFloat);
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-threshold";
        var input = document.createElement("input");
        input.setAttribute("name", parameters.getParamString() + ".alert-threshold");
        input.setAttribute('type', 'number');
        input.setAttribute('value', threshold);
        cell.appendChild(input);
        return(cell);
    }

    disabledCell(id, parameters) {
        var disabled = parameters.getParameter("alert-disabled");
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-disabled";
        var input = document.createElement("input");
        input.setAttribute("name", parameters.getParamString() + ".alert-disabled");
        input.setAttribute('type', 'checkbox');
        input.checked = (disabled == "1");
        input.defaultChecked = (disabled == "1");
        cell.appendChild(input);
        return(cell);
    }

    activeCell(id, parameters) {
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-active " + (parameters.getParamString() + "-alert");
        if (document.getElementById(id).classList.contains("alert-active")) cell.classList.add("alert-active");
        return(cell);
    }

}
