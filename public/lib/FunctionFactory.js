class FunctionFactory {

    static getFilter(name, args) {
        //console.log("FunctionFactory.getFilter(%s,%s)...", name, JSON.stringify(args));
        return((FunctionFactory.filters[name])?FunctionFactory.filters[name](args):FunctionFactory.filters["identity"](args));
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

    static filters = {

        "notification":         function(args=[]) {
                                    var level = (args.length > 0)?args[0]:"alert";
                                    return(
                                        function(v) {
                                            console.log(JSON.stringify(v));
                                            return((v.state == level)?v.message:null);
                                        }
                                    );
                                },

        "identity":             function(args=[]) {
                                    return(
                                        function(v) {
                                            return(v);
                                        }
                                    );
                                },

        "getDate":              function(args=[]) {
                                    return(
                                        function(v) {
                                            return(v.substr(0, v.indexOf('T')));
                                        }
                                    ); 
                                },

        "getTime":              function(args=[]) {
                                    return(
                                        function(v) {
                                            return(v.substr(v.indexOf('T')+1));
                                        }
                                    ); 
                                },

        "multiplier":           function(args=[]) {
                                    var multiplier = (args.length > 0)?args[0]:1;
                                    var places = (args.length > 1)?args[1]:0;
                                    return(
                                        function(v) {
                                            if (multiplier.startsWith('#')) {
                                                var e = document.getElementById(multiplier.substring(1));
                                                if (e) multiplier = e.textContent;
                                            }
                                            return((v * multiplier).toFixed(places));
                                        }
                                    ); 
                                },
 
        "offset":               function(args=[]) {
                                    var offset = (args.length > 0)?args[0]:0;
                                    var places = (args.length > 1)?args[1]:0;
                                    return(
                                        function(v) {
                                            return((Number(v) + offset).toFixed(places));
                                        }
                                    );
                                },

        "percent":              function(args=[]) {
                                    var min = (args.length > 0)?args[0]:0;
                                    var max = (args.length > 1)?args[1]:100;
                                    var invert = ((args.length) && (args.invert == 1))?true:false;
                                    return(
                                        function(v) {
                                            v = Math.round((parseFloat(v) / (max - min)) * 100);
                                            v = (v < 0)?0:((v > 100)?100:v); 
                                            return((invert)?(100 - v):v); 
                                        }
                                    );
                                },

        "rudderAngle":          function(args=[]) {
                                    var places = (args.length > 0)?args[0]:0;
                                    return(
                                        function(v) {
                                            return(Math.abs(v * 57.2958).toFixed(places));
                                        }
                                    );
                                },

        "rudderPercent":        function(args=[]) {
                                    var min = (args.length > 0)?args[0]:0;
                                    var max = (args.length > 1)?args[1]:40;
                                    return(
                                        function(v) {
                                            return((((v * 57.2958) / (max - min)) * 100) + 50);
                                        }
                                    );
                                },

        "temperature":          function(args=[]) {
                                    var factor = (args.length > 0)?args[0]:1;
                                    var offset = (args.length > 1)?args[1]:-273;
                                    var places = (args.length > 2)?args[2]:1;
                                    return(
                                        function(v) {
                                            return(Number(((v + offset) * factor) / 10).toFixed(places));
                                        }
                                    );
                                },

        "temperaturePercent":   function(args=[]) {
                                    var min = (args.length > 0)?args[0]:273;
                                    var max = (args.length > 1)?args[1]:313;
                                    return(
                                        function(v) {
                                            v = Math.round(((Number(v) - min) / (max - min)) * 10);
                                            return((v < 0)?0:((v > 100)?100:v));
                                        }
                                    );
                                },

        "toDegrees":            function(args=[]) {
                                    return(
                                        function(v) {
                                            return(("00" + (Math.round(v * 57.2958) % 360)).slice(-3));
                                        }
                                    );
                                },

        "toLatitude":           function(args=[]) {
                                    return(
                                        function({ latitude, longitude }) {
                                            return(FunctionFactory.degToDMS(latitude, { "hemis": ['N','S'] })); 
                                        }
                                    );
                                },

        "toLongitude":          function(args=[]) {
                                    return(
                                        function({ latitude, longitude }) {
                                            return(FunctionFactory.degToDMS(longitude, { "hemis": ['E','W'] })); 
                                        }
                                    );
                                },

        "loAlarm":              function(args=[]) {
                                    var threshold = (args.length > 0)?args[0]:1;
                                    return(
                                        function(v) {
                                            return(v < threshold);
                                        }
                                    );
                                }, 

        "hiAlarm":              function(args=[]) {
                                    var threshold = (args.length > 0)?args[0]:1;
                                    return(
                                        function(v) {
                                            return(v > threshold);
                                        }
                                    );
                                } 
    } 

}
