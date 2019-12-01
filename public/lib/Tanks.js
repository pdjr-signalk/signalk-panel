class Tanks extends SignalK {

    static createTanks(container, host, port) {
        return(new Tanks(container, host, port));
    }

    constructor(parentNode, host, port) {
        super(host, port).waitForConnection().then(_ => {
            this.parentNode = parentNode;

            this.buildTable(PageUtils.createElement("div", null, "table fixed", null, this.parentNode));
        });
    }

    buildTable(table) {
        var tableHeader = PageUtils.createElement("div", null, "table-header-group", null, table);
        var tankNameHeaderRow = PageUtils.createElement("div", null, "table-row", null, tableHeader);
        var tankContentHeaderRow = PageUtils.createElement("div", null, "table-row", null, tableHeader);
        var tankCapacityHeaderRow = PageUtils.createElement("div", null, "table-row hidden", null, tableHeader);
        var tableBody = PageUtils.createElement("div", null, "table-row-group", null, table);
        var tankChartRow = PageUtils.createElement("div", null, "table-row", null, tableBody);

        var collation = [];
        super.getObject("tanks", true, tanks => {
            Object.keys(tanks).forEach(tankType => {
                Object.keys(tanks[tankType]).forEach(tankNumber => {
                    if (tanks[tankType][tankNumber]["capacity"]["value"] < 10000) {
                        collation.push({
                            "key": tankNumber + tankType,
                            "type": tankType,
                            "number": tankNumber,
                            "detail": tanks[tankType][tankNumber] 
                        });
                    }
                });
            });

            collation.sort((a,b) => (a.key < b.key)).forEach(entry => {
                console.log(JSON.stringify(entry));
                var tankPath = "tanks." + entry.type + "." + entry.number + ".currentLevel";
                var tankCapacity = entry.detail.capacity.value;
                PageUtils.createElement("div", null, "table-cell w3-theme-d1", this.legibleIdentifier(entry.type, entry.number), tankNameHeaderRow);
                var tankContentCell = PageUtils.createElement("div", null, "table-cell w3-theme-d1", null, tankContentHeaderRow);
                PageUtils.createElement("div", (entry.type + entry.number), "table-cell hidden", tankCapacity, tankCapacityHeaderRow);
                var tankChartCell = PageUtils.createElement("div", null, "table-cell w3-theme-l1 vertical", null, tankChartRow);
                tankChartCell.style.height = "80vh";
                var params = { "min": 0, "max": 100, "ticks": 10, "factor": 100.0, "offset": 0, "places": 0, "filter": "multiply" };
                super.registerCallback(tankPath, Widget.createWidget(tankChartCell, "gauge", params, FunctionFactory.getFilter("multiply", params)));
                var params = { "factor": "#" + entry.type + entry.number, "offset": 0, "places": 0, "filter": "multiply" };
                super.registerInterpolation(tankPath, tankContentCell, FunctionFactory.getFilter("multiply", params));
            });
        });
    }

    legibleIdentifier(type, number) {
        var retval = "Tank " + number;
        switch (type) {
            case "wasteWater": retval += " (Waste)"; break;
            case "freshWater": retval += " (Water)"; break;
            case "fuel": retval += " (Fuel)"; break;
            default:
        }
        return(retval);
    }

}
