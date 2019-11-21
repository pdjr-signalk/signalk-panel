class Parameters {

    static createParameters(paramString) {
        return(new Parameters(paramString));
    }

    constructor(paramString) {
        //console.log("Parameters(%s)...", paramString);

        this.paramString = paramString;
        this.value = {};
    
        var paramStringParts = paramString.split(";");
        paramStringParts.forEach(part => {
            var obj = {};
            try { obj = JSON.parse(part); } catch(e) { obj = LocalStorage.getAllItems(part); }
            Object.keys(obj).forEach(key => { this.value[key] = obj[key]; });
        });
    }

    getParamString() {
        return(this.paramString);
    }

    getParameter(name, parser) {
        //console.log("getParameter(%s,%s)...", name, parser);

        var retval = this.value[name];
        if (retval !== undefined) {
            if ((typeof retval === "string") && (retval.charAt(0) == '#')) retval = document.getElementById(retval.substr(1)).innerHTML;
        } else {
            if (this.value.scales !== undefined) retval = this.value.scales[this.value.units[0]][name];
        }
        return((parser !== undefined)?parser(retval):retval);
    }

}
