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
                    if ((e.checked != e.defaultChecked) && e.checked) changed.push([ e.name, (e.checked)?"1":"0" ]);
                    break;
                default:
                    break;
            }
        });

        if (changed.length > 0) {
            if (confirm("Save changes?")) {
                [...changed].forEach(([n,v]) => {
                    window.localStorage.setItem(n, v);
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
        PageUtils.walk(document, "alert", element => {
            var row = this.tableRow(element);
            row.classList.add(rowstyle[0]);
            body.appendChild(row);
            rowstyle = rowstyle.push(rowstyle.shift());
        });
        return(body);
    }

    tableRow(element) {
        var row = document.createElement("div");
        row.className = "table-row";

        row.appendChild(this.nameCell(element));
        row.appendChild(this.testCell(element));
        row.appendChild(this.thresholdCell(element));
        row.appendChild(this.disabledCell(element));
        row.appendChild(this.activeCell(element));

        return(row);
    }

    nameCell(element) {
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-name";
        cell.appendChild(document.createTextNode(element.id));
        return(cell);
    }

    testCell(element) {
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-test";
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
        cell.className = "table-cell alert-editor-threshold";
        var input = document.createElement("input");
        input.setAttribute("name", element.id + "-threshold");
        input.setAttribute('type', 'number');
        input.setAttribute('value', window.localStorage.getItem(element.id + "-threshold"));
        cell.appendChild(input);
        return(cell);
    }

    disabledCell(element) {
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-disabled";
        var input = document.createElement("input");
        input.setAttribute("name", element.id + "-disabled");
        input.setAttribute('type', 'checkbox');
        input.checked = (window.localStorage.getItem(element.id + "-disabled") == "1");
        input.defaultChecked = (window.localStorage.getItem(element.id + "-disabled") == "1");
        cell.appendChild(input);
        return(cell);
    }

    activeCell(element) {
        var cell = document.createElement("div");
        cell.className = "table-cell alert-editor-active " + element.id;
        if (element.classList.contains("alert-cancelled")) cell.classList.add("alert-cancelled");
        return(cell);
    }

}
