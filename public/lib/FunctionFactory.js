class FunctionFactory {

    static getFilter(name="identity", context) {
        //console.log("FunctionFactory.getFilter(%s,%s)...", name, context);

        return(FunctionFactory.filters[name](context));
    }

    static percent(v, min, max) {
        v = Math.round(((v - min) / (max - min)) * 100);
        return((v < 0)?0:((v > 100)?100:v)); 
    }


    static degToDMS(v, args={ "hemis": ["N", "S"] }) {  
        var h = args["hemis"][(v >= 0)?0:1];
        var d = Math.floor(v);  
        var minfloat = (v - d) * 60;  
        var m = Math.floor(minfloat);  
        var secfloat = (minfloat - m) * 60;  
        var s = Math.round(secfloat);  
        var ds = Math.round((secfloat - s) * 10);
      
        if (s == 60) { m++; s=0; }  
        if (m==60) { d++; m=0; }  
        return ("" + ("00" + d).slice(-3) + '&deg;' + ("0" + m).slice(-2) + '\'' + ("0" + s).slice(-2) + '.' + ds + '"' + h);  
    }

    static decodeContext(context) {
        var retval = {};
        var parts = context.split(";");
        parts.forEach(part => {
            var obj = {};
            try { obj = JSON.parse(part); } catch(e) { obj = LocalStorage.getAllItems(part); }
            Object.keys(obj).forEach(key => { retval[key] = obj[key]; });
        });
        Object.keys(retval).forEach(key => {
            if (retval[key].startsWith('#')) retval[key] = document.getElementById(retval[key].substr(1)).innerHTML;
        });
        return(retval);
    }

    static filters = {

        "multiply":             function(parameters) {
                                    var parameters = parameters;
                                    return(
                                        function(v) {
                                            var factor = parameters.getParameter("factor");
                                            var offset = parameters.getParameter("offset");
                                            var places = parameters.getParameter("places");
                                            return(((v * factor) + offset).toFixed(places));
                                        }
                                    );
                                },

        "multiplyPercent":      function(parameters) {
                                    var parameters = parameters;
                                    return(
                                        function(v) {
                                            v = (FunctionFactory.getFilter("multiply", parameters))(v);
                                            var min = parameters.getParameter("min");
                                            var max = parameters.getParameter("max"); 
                                            return(FunctionFactory.percent(v, min, max));
                                        }
                                    );
                                },

        "getValue":             function(context) {
                                    return(
                                        function(v) {
                                            return(v.value);
                                        }
                                    );
                                },

        "test":                 function(args={}) {
                                    var args = args;
                                    return(
                                        function(v) {
                                            v = parseFloat(v);
                                            var retval = false;
                                            var _args = FunctionFactory.resolveValues(args);
                                            var threshold = parseFloat(_args.threshold);
                                            switch (_args.test) {
                                                case "eq": retval = (v == threshold); break;
                                                case "lt": retval = (v < threshold); break;
                                                case "gt": retval = (v > threshold); break;
                                                default: break;
                                            }
                                            return(retval);
                                        }
                                    );
                                },

        "notification":         function(args={}) {
                                    var level = (args.level)?args.level:"alert";
                                    return(
                                        function(v) {
                                            return((v.state == level)?v.message:null);
                                        }
                                    );
                                },

        "identity":             function(context) {
                                    return(
                                        function(v) {
                                            return((typeof v === "string")?v.trim():v);
                                        }
                                    );
                                },

        "date":                 function(context) {
                                    return(
                                        function(v) {
                                            return(v.substr(0, v.indexOf('T')));
                                        }
                                    );
                                },

        "time":                 function(context) {
                                    return(
                                        function(v) {
                                            return(v.substr(v.indexOf('T')+1));
                                        }
                                    );
                                },

        "latitude":             function(context) {
                                    return(
                                        function({ latitude, longitude }) {
                                            return(FunctionFactory.degToDMS(latitude, { "hemis": ['N','S'] })); 
                                        }
                                    );
                                },

        "longitude":            function(context) {
                                    return(
                                        function({ latitude, longitude }) {
                                            return(FunctionFactory.degToDMS(longitude, { "hemis": ['E','W'] })); 
                                        }
                                    );
                                },

        "degrees":              function(context) {
                                    var context = context;
                                    return(
                                        function(v) {
                                            return(("00" + (Math.round(v * 57.2958) % 360)).slice(-3));
                                        }
                                    );
                                },

        "loAlarm":              function(args={}) {
                                    var threshold = (args.threshold)?args.threshold:1;
                                    return(
                                        function(v) {
                                            return(v < threshold);
                                        }
                                    );
                                }, 

        "hiAlarm":              function(args={}) {
                                    var threshold = (args.threshold)?args.threshold:1;
                                    return(
                                        function(v) {
                                            return(v > threshold);
                                        }
                                    );
                                } 
    } 

}
