class FunctionFactory {

    static getFilter(fspec = { "name": "identity" }) {
        //console.log("FunctionFactory.getFilter(%s)...", JSON.stringify(fspec));

        var retval = undefined;
        
        try {
            if (fspec["name"]) {
                retval = FunctionFactory.filters[fspec.name](fspec);
            }
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

    static resolveValues(args) {
        var values = {};
        Object.keys(args).filter(name => (name != "name")).forEach(name => {
            if (!name.includes("!")) {
                var value = args[name];
                if (value !== undefined) value = (("" + value).includes("!"))?PageUtils.getStorageItem(value):value;
                values[name] = value;
            } else {
                var nameparts = name.split("!");
                values[nameparts[1]] = PageUtils.getStorageItem(name, args[name]);
            }
        });
        return(values);
    }
        
        


    static filters = {

        "sog":                  function(args={}) {
                                    var args = args;
                                    return(
                                        function(v) {
                                            var v = parseFloat(v);
                                            var _args = FunctionFactory.resolveValues(args);
                                            var retval = v;
                                            switch (_args.units) {
                                                case "kts": retval = (v * 0.539957); break;
                                                case "mph": retval = (v * 0.621371); break;
                                                case "mps": retval = (v * 0.277778); break;
                                                default: break;
                                            }
                                            return(retval.toFixed(parseInt(_args.places)));
                                        }
                                    );
                                },

        "depth":                function(args={}) {
                                    var args = args;
                                    return(
                                        function(v) {
                                            var v = parseFloat(v);
                                            var _args = FunctionFactory.resolveValues(args);
                                            var units = _args.units;
                                            var places = parseInt(_args.places);
                                            var retval = v;
                                            switch (units) {
                                                case "ft": retval = (v * 3.28084); break;
                                                case "ftm": retval = (v * 0.546807); break;
                                                default: break;
                                            }
                                            return((Math.round(retval * (10 * places)) / (10 * places)).toFixed(places));
                                        }
                                    );
                                },

        "percent":              function(args={}) {
                                    var args = args;
                                    return(
                                        function(v) {
                                            var v = parseFloat(v);
                                            var _args = FunctionFactory.resolveValues(args);
                                            var min = parseFloat(_args.min);
                                            var max = parseFloat(_args.max);
                                            var invert = parseInt(_args.invert);
                                            var retval = v;
                                            retval = Math.round((v / (max - min)) * 100);
                                            retval = (retval < 0)?0:((retval > 100)?100:retval); 
                                            return((args.invert)?(100 - retval):retval); 
                                        }
                                    );
                                },

        "rateOfTurn":           function(args={}) {
                                    var args = args;
                                    return(
                                        function(v) {
                                            var v = parseFloat(v);
                                            var _args = FunctionFactory.resolveValues(args);
                                            var retval = parseFloat(v);
                                            return((Math.abs(v * 57.2958) * 60).toFixed(parseInt(_args.places)));
                                        }
                                    );
                                },

        "rateOfTurnPercent":    function(args={}) {
                                    var args = args;
                                    return(
                                        function(v) {
                                            var v = parseFloat(v);
                                            var _args = FunctionFactory.resolveValues(args);
                                            return(Math.round((((v * 57.2958 * 60) / (parseFloat(_args.max) - parseFloat(_args.min))) * 100) + 50));
                                        }
                                    );
                                },

        "rudderAngle":          function(args={}) {
                                    var args = args;
                                    return(
                                        function(v) {
                                            var v = parseFloat(v);
                                            var _args = FunctionFactory.resolveValues(args);
                                            return(Math.abs(v * 57.2958).toFixed(parseInt(_args.places)));
                                        }
                                    );
                                },

        "rudderPercent":        function(args={}) {
                                    var args = args;
                                    return(
                                        function(v) {
                                            var v = parseFloat(v);
                                            var _args = FunctionFactory.resolveValues(args);
                                            return((((v * 57.2958) / (parseFloat(_args.max) - parseFloat(_args.min))) * 100) + 50);
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

        "temperature":          function(args={}) {
                                    var args = args;
                                    return(
                                        function(v) {
                                            v = parseFloat(v);
                                            var _args = FunctionFactory.resolveValues(args);
                                            var units = _args.units;
                                            var places = _args.places;
                                            switch (units) {
                                                case "C": retval = ((v -273) / 10); break;
                                                case "K": retval = (v / 10); break;
                                                default: retval = v; break;
                                            }
                                            return(retval.toFixed(places));
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
