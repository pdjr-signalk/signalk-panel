class FunctionFactory {

    static getFilter(fspec = { "name": "identity" }) {
        //console.log("FunctionFactory.getFilter(%s)...", JSON.stringify(fspec));
        var retval = undefined;
        try {
            if (fspec.name) retval = FunctionFactory.filters[fspec.name](fspec);
        } catch {
            console.log("error parsing filter specification %s", fspec);
        }
        return(retval);    
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

    static decodeValue(v, parser) {
        if (typeof v == "string") {
            switch (v.charAt(0)) {
                case '#': v = document.getElementById(v.substr(1)).innerHTML;
                    break;
                case '!': v = window.localStorage.getItem(v.substr(1));
                    break;
                default:
                    break;
            }
        }
        return((parser)?parser(v):v);
    }


    static filters = {

        "test":                 function(args={}) {
                                    var test = (args.test)?args.test:"eq";
                                    var threshold = (args.threshold)?args.threshold:0;
                                    return(
                                        function(v) {
                                            v = parseFloat("" + v);
                                            var _test = FunctionFactory.decodeValue(test);
                                            var _threshold = FunctionFactory.decodeValue(threshold, parseFloat);
                                            switch (_test) {
                                                case "eq": return(v == _threshold); break;
                                                case "lt": return(v < _threshold); break;
                                                case "gt": return(v > _threshold); break;
                                                default: break;
                                            }
                                            return(false);
                                        }
                                    );
                                },

        "getfield":             function(args={}) {
                                    var fname = (args.fname)?args.fname:"value";
                                    return(
                                        function(v) {
                                            return((typeof v === "object")?v[fname]:v);
                                        }
                                    );
                                },

        "notification":         function(args={}) {
                                    var level = (args.level)?args.level:"alert";
                                    return(
                                        function(v) {
                                            console.log(JSON.stringify(v));
                                            return((v.state == level)?v.message:null);
                                        }
                                    );
                                },

        "identity":             function(args={}) {
                                    var places = (args.places)?args.places:undefined;
                                    var pad = (args.pad)?args.pad:undefined;
                                    return(
                                        function(v) {
                                            if (typeof v === "number") {
                                                if (places) v = v.toFixed(places);
                                                if (pad) while (("" + v).length < pad) v = " " + v;
                                            }
                                            return(v);
                                        }
                                    );
                                },

        "getDate":              function(args={}) {
                                    return(
                                        function(v) {
                                            return(v.substr(0, v.indexOf('T')));
                                        }
                                    ); 
                                },

        "getTime":              function(args={}) {
                                    return(
                                        function(v) {
                                            return(v.substr(v.indexOf('T')+1));
                                        }
                                    ); 
                                },

        "multiply":             function(args={}) {
                                    var factor = (args.factor)?args.factor:1;
                                    var places = (args.places)?args.places:0;
                                    return(
                                        function(v) {
                                            if ((typeof factor === "string") && factor.startsWith('#')) {
                                                var e = document.getElementById(factor.substring(1));
                                                if (e) factor = parseInt(e.textContent);
                                                console.log("***************** " + factor);
                                            }
                                            return((v * factor).toFixed(places));
                                        }
                                    ); 
                                },
 
        "offset":               function(args={}) {
                                    var offset = (args.offset)?args.offset:0;
                                    var places = (args.places)?args.places:0;
                                    return(
                                        function(v) {
                                            return((Number(v) + offset).toFixed(places));
                                        }
                                    );
                                },

        "percent":              function(args={}) {
                                    var min = (args.min)?args.min:0;
                                    var max = (args.max)?args.max:100;
                                    var invert = (args.invert)?args.invert:0;
                                    return(
                                        function(v) {
                                            v = Math.round((parseFloat(v) / (max - min)) * 100);
                                            v = (v < 0)?0:((v > 100)?100:v); 
                                            return((invert)?(100 - v):v); 
                                        }
                                    );
                                },

        "rudderAngle":          function(args={}) {
                                    var places = (args.places)?args.places:0;
                                    return(
                                        function(v) {
                                            return(Math.abs(v * 57.2958).toFixed(places));
                                        }
                                    );
                                },

        "rudderPercent":        function(args={}) {
                                    var min = (args.min)?args.min:0;
                                    var max = (args.max)?args.max:40;
                                    return(
                                        function(v) {
                                            return((((v * 57.2958) / (max - min)) * 100) + 50);
                                        }
                                    );
                                },

        "temperature":          function(args={}) {
                                    var factor = (args.factor)?args.factor:1;
                                    var offset = (args.offset)?args.offset:-273;
                                    var places = (args.places)?args.places:1;
                                    return(
                                        function(v) {
                                            return(Number(((v + offset) * factor) / 10).toFixed(places));
                                        }
                                    );
                                },

        "temperaturePercent":   function(args={}) {
                                    var min = (args.length > 0)?args[0]:273;
                                    var max = (args.length > 1)?args[1]:313;
                                    return(
                                        function(v) {
                                            v = Math.round(((Number(v) - min) / (max - min)) * 10);
                                            return((v < 0)?0:((v > 100)?100:v));
                                        }
                                    );
                                },

        "toDegrees":            function(args={}) {
                                    return(
                                        function(v) {
                                            return(("00" + (Math.round(v * 57.2958) % 360)).slice(-3));
                                        }
                                    );
                                },

        "toLatitude":           function(args={}) {
                                    return(
                                        function({ latitude, longitude }) {
                                            return(FunctionFactory.degToDMS(latitude, { "hemis": ['N','S'] })); 
                                        }
                                    );
                                },

        "toLongitude":          function(args={}) {
                                    return(
                                        function({ latitude, longitude }) {
                                            return(FunctionFactory.degToDMS(longitude, { "hemis": ['E','W'] })); 
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
