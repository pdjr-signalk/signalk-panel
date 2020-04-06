class Gnss extends SignalK {

    static create(container, host, port) {
        return(new Gnss(container, host, port));
    }

    constructor(parentNode, host, port) {
        super(host, port).waitForConnection().then(_ => {
            this.parentNode = parentNode;
            this.table = document.createElement("div"); this.table.className = "table"; this.parentNode.appendChild(this.table);
            this.sources = {};
            this.makeTableHeader(this.table, [ "Receiver", "Last update", "Position", "Integrity", "Type of fix", "Quality", "PDOP|Position Dilution of Position", "HDOP|Horizontal Dilution of Position" ]);
            this.subscribe(this.table, [ "navigation.position", "navigation.gnss.integrity", "navigation.gnss.type", "navigation.gnss.methodQuality", "navigation.gnss.positionDilution", "navigation.gnss.horizontalDilution" ]);
        });
    }

    makeTableHeader(container, headings) {
        var group = document.createElement("div"); group.className = "table-header-group";
        var row = document.createElement("div"); row.className = "table-row";
        headings.forEach(heading => {
            var parts = heading.split("|");
            var cell = document.createElement("div");
            cell.className = "table-cell w3-theme-d1";
            if (parts[1] !== undefined) cell.setAttribute("title", parts[1]);
            cell.appendChild(document.createTextNode(parts[0]));
            row.appendChild(cell);
        });
        group.appendChild(row);
        container.appendChild(group);
    }

    subscribe(container, paths) {
        var group = document.createElement("div"); group.className = "table-row-group";
        paths.forEach(path => {
            var token = path.split(".").pop();
            var _this = this;
            super.registerCallback(path, function(v) {
                if (_this.sources[v.source] === undefined) _this.makeSource(group, v.source, paths);
                _this.sources[v.source][token].innerHTML = (typeof v.value === "object")?"Received":v.value;
                _this.sources[v.source][token].style.animation = 'none';
                _this.sources[v.source][token].offsetHeight; /* trigger reflow */
                _this.sources[v.source][token].style.animation = null; 
                _this.sources[v.source]["timestamp"].innerHTML = v.timestamp.split(".")[0];
                _this.sources[v.source]["timestamp"].style.animation = 'none';
                _this.sources[v.source]["timestamp"].offsetHeight; /* trigger reflow */
                _this.sources[v.source]["timestamp"].style.animation = null; 
            }, function(v) { return(v); });
        });
        container.appendChild(group);
    }

    makeSource(table, source, paths) {
        //console.log("makeSource(%s,%s)...", source, paths);
        this.sources[source] = {};
        var row = document.createElement("div"); row.id = source; row.className = "table-row";
        var cell = document.createElement("div"); cell.className = "table-cell w3-theme-l1";
        cell.appendChild(document.createTextNode(source));
        row.appendChild(cell);
        cell = document.createElement("div"); cell.className = "table-cell w3-theme-l1 timeout";
        cell.appendChild(document.createTextNode("---"));
        row.appendChild(cell);
        this.sources[source]["timestamp"] = cell;
        this.sources[source]["row"] = row;

        row.appendChild(cell);
        [...paths].forEach(path => {
            var token = path.split(".").pop();
            var cell = document.createElement("div"); cell.className = "table-cell w3-theme-l1 timeout";
            row.appendChild(cell);
            this.sources[source][token] = cell; 
        });
        table.appendChild(row);
    }

}
