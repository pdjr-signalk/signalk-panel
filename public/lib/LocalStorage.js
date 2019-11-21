class LocalStorage {

    static initialise(root, force=false) {
        //console.log("LocalStorage.initialise(%s,%s)...", root, force);

        var elements = root.getElementsByClassName("storage-item");
        [...elements].forEach(element => {
            var name = element.getAttribute("data-name");
            var value = element.getAttribute("data-value");
            if ((name !== undefined) && (value !== undefined)) {
                if (element.parentNode.classList.contains("storage-group")) {
                    if (element.parentNode.hasAttribute("data-name")) {
                        name = element.parentNode.getAttribute("data-name") + "." + name;
                    }
                }
                if ((window.localStorage.getItem(name) == null) || force) {
                    window.localStorage.setItem(name, value);
                }
            }
            root.remove();
        });
    }

    static getAllItems(classname) {
        var retval = {};
        Object.keys(window.localStorage).forEach(key => {
            if (key.startsWith(classname + ".")) {
                var value = LocalStorage.getItem(key);
                retval[key.split(".")[1]] = value;
            }
        });
        return(retval);
    }

    static getItem(classname, name, parser) {
        //console.log("LocalStorage.getItem(%s,%s,%s)...", classname, name, parser);

        var key = (name === undefined)?classname:(classname + "." + name);
        var value = window.localStorage.getItem(key) || "";
        if (value.startsWith('{') || value.startsWith('[')) {
            value = JSON.parse(value);
        } else {
            if (parser !== undefined) value = parser(value);
        }
        return(value);
    }

    static getAtom(classname, name, parser) {
        var value = LocalStorage.getItem(classname, name);
        if (Array.isArray(value)) value = value[0];
        return((parser !== undefined)?parser(value):value);
    }

    static setItem(classname, name, value) {
        classname = (value === undefined)?classname:(classname + "." + name);
        value = (value === undefined)?name:value;
        window.localStorage.setItem(classname, value);
    }

}

