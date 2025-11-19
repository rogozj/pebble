/*Last setting (the unknown) set as default 1
 * Modify configuration options in line 384 as needed and replace this file in the Maurice.pbw Get your own Open Weather API KEY and replace it in line 239 to get working weather updates
 * Maurice Watchface Configuration Options
 *
 * The settings string is a 19-character string stored in localStorage under "mauricesettings".
 *           INV SEK LNG HVIB ACT_H DF C/F GPS LOUT WU WS FNT BAT BTV ???
 * Default: "0   1   00  0    0822  0  0   1   0    1  0  0   0   0   1"
 * My mod.: "0   1   21  0    0822  1  0   1   4    1  0  0   1   1   1"
 * Each position controls a specific feature, as described below, based on analysis of pebble-js-app.js
 * and maurice.c (https://github.com/zalewszczak/pebble/blob/master/maurice/src/maurice.c).
 *
 * settings[0]: Invert Display
 *   '0': Normal display
 *   '1': Inverted display
 *
 * settings[1]: Show Seconds
 *   '0': Seconds not displayed.
 *   '1': Seconds displayed in time format.
 *
 * settings[2:3]: Language Possible settings 00 to 31
00 - English
01 - Albanian
02 - Catalan
03 - Croatian
04 - Czech
05 - Danish
06 - Dutch
07 - Estonian
08 - Finish
09 - French
10 - German
11 - Hungarian
12 - Icelandic
13 - Indonesian
14 - Irish
(below not tested but should be like this; logical order of languages from lang.h)
15 - Italian
16 - Latvian
17 - Lithuanian
18 - Malay
19 - Maltese
20 - Norvegian
21 - Polish (tested)
22 - Portugese
23 - Romanian
24 - Slovak
25 - Slovenian
26 - Spanish
27 - Swedish
28 - Turkish (tested)
29 - Vietnamese (not sure, it shows somethig different than in lang.h)
 *
 * settings[4]: Hourly Vibration
 *   '0': No Hourly vibration.
 *   '1': Vibrate once every Hour.
 *
 * settings[5:6]: Weather Update Start Hour
 *   Two-digit hour (00-23, e.g., "08" for 8 AM) for when weather updates start.
 *   Used in isActiveHour to determine active weather fetch window.
 *
 * settings[7:8]: Weather Update End Hour
 *   Two-digit hour (00-23, e.g., "22" for 10 PM) for when weather updates end.
 *   Used in isActiveHour. If start equals end, weather updates are active 24/7.
 *
 * settings[9]: Date Format
 *   Single digit (0-5) selecting the date format:
 *     "0": day dd (e.g., TUE 09)
 *     "1": dd month (e.g., 16 SEP)
 *     "2": month dd (e.g., SEP 16)
 *     "3": dd mm (e.g., 16 09)
 *     "4": mm dd (e.g., 09 16)
 *     "5": blank (e.g., nothing)
 *
 * settings[10]: Temperature Units
 *   '0': Celsius (metric, subtracts 273.15 Kelvin).
 *   '1': Fahrenheit (imperial, uses &units=imperial in API call).
 *   Used in fetchOWeather and fetchYWeather for temperature display.
 *
 * settings[11]: Automatic Location
 *   '0': Use manual location (manuallatitude, manuallongitude).
 *   '1': Use GPS for automatic location.
 *   Used in getLocationForWeather to choose location method.
 *
 * settings[12]: Layout
 *   Single digit (0-7)
 *     "0": On top: pebble logo with battery bar. On the bottom date and weather (TUE 16; cloud 16C)
 *     "1": On top: digital watch. On the bottom date and weather (16 SEP; cloud 15C)
 *     "2": On top: battery indicator under "12", digital watch. On the bottom date and weather (16 SEP; cloud 15C)
 *     "3": On top: weather (cloud, 16C). On the bottom: date (16 SEP)
 *     "4": On top: battery indicator under "12", weather (cloud, 16C). On the bottom: date (16 SEP)
 *     "5": On top: battery indicator under "12", blank (logo gone). On the bottom: date and weather (16 SEP; cloud 15C)
 *     "6": On top: blank (logo gone). On the bottom: date and weather (16 SEP; cloud 15C)
 *     "7": On top: pebble logo without battery indicator. On the bottom: date and weather (16 SEP; cloud 15C)
 *
 * settings[13]: Weather On/Off
 *   '0': Weather updates disabled.
 *   '1': Weather updates enabled (fetches during active hours).
 *   Used in getLocationForWeather and interval function.
 *
 * settings[14]: Weather Source
 *   '0': Use OpenWeatherMap (requires API key).
 *   '1': Use Yahoo Weather (via YQL query, deprecated and may not work).
 *   Used in getLocationForWeather to select fetchOWeather or fetchYWeather.
 *
 * settings[15]: Font for Digital Clock, Date and Temperature
 *   '0': Use 8 segment display font (Radioland.ttf).
 *   '1': Use regular font (less fancy; easier to read).
 *
 * settings[16]: Show battery icon when battery is low
 *   '0': Do not show battery icon when battery is low
 *   '1': Show battery icon when battery is low (in top right corner)
 *
 * settings[17]: Vibrate when Bluetooth disconnected
 *   '0': Do not vibrate on Bluetooth disconnection
 *   '1': Vibrate when Bluetooth is disconnected
 *
 * settings[18]: ?
 *
 * Additional Settings (stored in localStorage):
 * - mauricelatitude: Latitude for manual weather location (e.g., "40.7128").
 *   Used when settings[11] = '0'.
 * - mauricelongitude: Longitude for manual weather location (e.g., "-74.0060").
 *   Used when settings[11] = '0'.
 * - mauricelocation: Location name for Yahoo Weather (e.g., "New York, NY").
 *   Used when settings[14] = '1'.
 * - mauricefetchtime: Weather update interval in minutes (1-180, default: 60).
 */

var weathersleep = false;
var ready = false;
var settings;
var manuallongitude;
var manuallatitude;
var manuallocation;
var fetchtime = 60;

function iconFromWeatherId(weatherId) {
  if (weatherId < 300) {
    return 7;
  } else if (weatherId < 400) {
    return 6;
  } else if (weatherId == 511) {
    return 8;
  } else if (weatherId < 600) {
    return 6;
  } else if (weatherId < 700) {
    return 8;
  } else if (weatherId < 800) {
    return 10;
  } else if (weatherId == 800) {
    return 1;
  } else if (weatherId == 801) {
    return 2;
  } else if (weatherId < 900) {
    return 5;
  } else  {
    return 0;
  }
}

function translateYWeather(code){
  if ( code < 5){
    return 7;
  } else if ( code < 13){
    return 6;
  } else if ( code < 19){
    return 8;
  } else if ( code < 23){
    return 10;
  } else if ( code < 25){
    return 2;
  } else if ( code < 26){
    return 9;
  } else if ( code < 27){
    return 5;
  } else if ( code < 28){
    return 4;
  } else if ( code < 29){
    return 2;
  } else if ( code < 30){
    return 4;
  } else if ( code < 31){
    return 2;
  } else if ( code < 32){
    return 3;
  } else if ( code < 33){
    return 1;
  } else if ( code < 34){
    return 3;
  } else if ( code < 35){
    return 1;
  } else if ( code < 36){
    return 6;
  } else if ( code < 37){
    return 1;
  } else if ( code < 40){
    return 7;
  } else if ( code < 41){
    return 6;
  } else if ( code < 44){
    return 8;
  } else if ( code < 45){
    return 5;
  } else if ( code < 46){
    return 7;
  } else if ( code < 47){
    return 8;
  } else if ( code < 48){
    return 7;
  } else {
    return 0;
  }
}

function fetchWeather(latitude, longitude) {
  fetchOWeather(latitude, longitude);
}

function fetchOWeather(latitude, longitude) {
  if(!latitude||!longitude||latitude=="undefined"||longitude=="undefined"){
    console.log("Pebble JS: Location not set");
    Pebble.sendAppMessage({
       "icon":11,
       "temperature":" LOC"});
    return;
  }

  var response;
  var req = new XMLHttpRequest();
  var imperial = "";
  var degrees = "C";
  var kelvins = 273.15;
  if(settings.substring(10,11)=='1'){
    imperial = "&units=imperial";
    degrees = "F";
    kelvins = 0.0;
  }
  req.open('GET', "http://api.openweathermap.org/data/2.5/weather?" +
    "lat=" + latitude + "&lon=" + longitude + imperial + "&appid=getyourownkeyforfreeandputithere", true);
  req.onload = function(e) {
    if (req.readyState == 4) {
      if(req.status == 200) {
        //console.log("Pebble JS: open weather api response: " + req.responseText);
        console.log("Pebble JS: Got weather from openweather.");
        response = JSON.parse(req.responseText);
        var temperature, icon, city, description, icon_n;
        temperature = Math.round(response.main.temp - kelvins);
        icon = iconFromWeatherId(response.weather[0].id);
        icon_n = response.weather[0].icon;
        if(icon_n == "01n")icon = 3;
        if(icon_n == "02n")icon = 4;
        console.log("Pebble JS: temp = " + temperature + ", icon_n = " + icon_n + ", icon = " + icon);
          Pebble.sendAppMessage({
            "icon":icon,
            "temperature":" " + temperature + degrees});
        

      } else {
        console.log("Pebble JS: Error processing weather:" + req.readyState + ", HTTP code: " + req.status);
        Pebble.sendAppMessage({
          "icon":11,
          "temperature":" W" + req.status});
        
      }
    }
  }
  req.onerror = function(e) {
    console.log("Pebble JS: Error downloading weather: " + req.status);
        Pebble.sendAppMessage({
          "icon":11,
          "temperature":" DT"+req.status}); //0 means timeout
  }
  req.send(null);
}

function fetchYWeather() {
  var response;
  var req = new XMLHttpRequest();
  var degrees = "C";
  if(settings.substring(10,11)=='1'){
    degrees = "F";
  }

  if(!manuallocation||manuallocation==""){
    console.log("Pebble JS: Location not set");
    Pebble.sendAppMessage({
       "icon":11,
       "temperature":" LOC"});
    return;
  }

  var locationQuery = escape("select item from weather.forecast where woeid in (select woeid from geo.places where text='" + manuallocation + "') and u='" + degrees.toLowerCase() + "'"),
     locationUrl = "http://query.yahooapis.com/v1/public/yql?q=" + locationQuery + "&format=json";
  req.open('GET', locationUrl, true);
  req.onload = function(e) {
    if(req.readyState == 4){
      if(req.status == 200){
        //console.log("Pebble JS: req.responseText=" + req.responseText);
        console.log("Pebble JS: Got weather from yahoo.");
        response = JSON.parse(req.responseText);
        var temperature, code, icon;
        try{
          temperature = Math.round(response.query.results.channel[0].item.condition.temp);
          code = response.query.results.channel[0].item.condition.code;
        }catch(err){
          try{
            temperature = Math.round(response.query.results.channel.item.condition.temp);
            code = response.query.results.channel.item.condition.code;
          }catch(err){
            console.log("Pebble JS: Can't fetch weather for location: " + manuallocation);
            Pebble.sendAppMessage({
              "icon":11,
              "temperature":" 404"});
            return;
          }
        }
        icon = translateYWeather(code);
        console.log("Pebble JS: temp = " + temperature + ", code = " + code + ", icon = " + icon);
        Pebble.sendAppMessage({
            "icon":icon,
            "temperature":" " + temperature + degrees});
      }else{
        console.log("Pebble JS: req.status=" + req.status);
        console.log("Pebble JS: req.responseText=" + req.responseText);
        Pebble.sendAppMessage({
          "icon":11,
          "temperature":" W" + req.status});
      }
    }else{
      console.log("Pebble JS: req.readystate=" + req.readystate);
      console.log("Pebble JS: locationUrl=" + locationUrl);
      Pebble.sendAppMessage({
        "icon":11,
        "temperature":" W" + req.status});
    }
  }
  req.onerror = function(e) {
    console.log("Pebble JS: Error downloading weather: " + req.status);
        Pebble.sendAppMessage({
          "icon":11,
          "temperature":" DT"+req.status}); //0 means timeout
  }
  req.send(null);
}

function locationSuccess(pos) {
  var coordinates = pos.coords;
  console.log('Pebble JS: location success!');
  fetchWeather(coordinates.latitude, coordinates.longitude);
}

function locationError(err) {
  console.warn('location error (' + err.code + '): ' + err.message);
  Pebble.sendAppMessage({
    "icon":11,
    "temperature":" GPS"
  });
}

var locationOptions = { "timeout": 15000, "maximumAge": 60000 }; 

function getLocationForWeather(){
  if(settings.substring(13,14)=='0')return;//weather off

  if(settings.substring(14,15)=='1'){
    //yahoo
    fetchYWeather();
  }else if(settings.substring(11,12)=='1'){
    //location automatic
    console.log("Pebble JS: fetching weather for automatic location...");
    window.navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
  }else{
    //location manual
    console.log("Pebble JS: fetching weather for manual location: lat " + manuallatitude + ", lng " + manuallongitude);
    fetchWeather(manuallatitude, manuallongitude);
  }
}

Pebble.addEventListener("ready",
                        function(e) {
                          console.log("Pebble JS reading settings...");
                          settings = localStorage.getItem("mauricesettings");
                          if (!settings||settings==""||settings.length<19) {
                            settings = "0121008221014100111";
                          }
                          console.log("Pebble JS: settings are: " + settings + ", sending settings.");
                          manuallongitude = localStorage.getItem("mauricelongitude");
                          manuallatitude = localStorage.getItem("mauricelatitude");
                          manuallocation = localStorage.getItem("mauricelocation");
                          fetchtime = localStorage.getItem("mauricefetchtime");
                          if (!manuallocation||manuallocation=="") {
                            manuallocation = "";
                          }

                          Pebble.sendAppMessage({"settings":translateForPebble()},
                            function(e) {
                              console.log("Pebble JS: settings delivered.");
                              getLocationForWeather();
                            },
                            function(e) {
                              console.log("Peble JS: unable to deliver settings, " +e.error.message);
                              getLocationForWeather(); //because, why not?
                            }
                          );

                          console.log("Pebble JS: ready and up.");
                          ready = true;

                          if (!fetchtime||fetchtime=="undefined"||fetchtime<=0||fetchtime>180) { 
                            //undefined from settings website will crash pebble
                            fetchtime = 60; //minutes
                          }

                          console.log("Pebble JS: Fetch time: " + fetchtime);

                          window.setInterval(function(){
                                if(settings.substring(13,14)=='0')return;

                                if(isActiveHour()){
                                  console.log("Pebble JS: Active hour, refreshing weather");
                                  weathersleep = false;
                                  getLocationForWeather();
                                }else if(weathersleep==false){
                                  console.log("Pebble JS: Inactive hour, putting watch to sleep");
                                  weathersleep = true;
                                  Pebble.sendAppMessage({
                                    "icon":12,
                                    "temperature":" --"});
                                }else{
                                  console.log("Pebble JS: Inactive hour, watch sleeping");
                                }
                          }, 60000*fetchtime);

                          //getLocationForWeather();
                        });

Pebble.addEventListener("appmessage",
                        function(e) {
                          console.log("Pebble JS: got message!");
                        });

Pebble.addEventListener("showConfiguration", function() {
  console.log("Pebble JS: showing configuration");
  Pebble.openURL(encodeURI("http://zalew.net.pl/pebble/maurice310.php?&settings=" + settings + "&longitude=" + manuallongitude + "&latitude=" + manuallatitude + "&location=" + manuallocation + "&fetchtime=" + fetchtime));
});

Pebble.addEventListener("webviewclosed", function(e) {
  console.log("Pebble JS: configuration closed");
  var configuration = JSON.parse(e.response);
  //Pebble.sendAppMessage(configuration);

  settings = configuration["settings"];
  Pebble.sendAppMessage({"settings":translateForPebble()});
  manuallongitude = configuration["longitude"];
  manuallatitude = configuration["latitude"];
  manuallocation = configuration["location"];
  fetchtime = configuration["fetchtime"];
  localStorage.setItem("mauricesettings", settings);
  localStorage.setItem("mauricelongitude", manuallongitude);
  localStorage.setItem("mauricelatitude", manuallatitude);
  localStorage.setItem("mauricelocation", manuallocation);
  localStorage.setItem("mauricefetchtime", fetchtime);
  console.log("Pebble JS: new configuration is: " + settings);
  console.log("Pebble JS: new location is: " + manuallongitude + "," + manuallatitude + ", " + manuallocation);
});

function translateForPebble(){
  var result = 0;

  if(settings.substring(0,1)=='1'){
    result += Math.pow(2,31);
  }

  if(settings.substring(1,2)=='1'){
    result += Math.pow(2,30);
  }

  var tmp = parseInt(settings.substring(2,4), 10).toString(2);
  //console.log("Pebble JS: " + parseInt(settings.substring(2,4), 10) + " tobits: " + tmp);
  for(var i = tmp.length-1; i>=0; i--){
    if(tmp[i]==1){
      result += Math.pow(2,25+(5-tmp.length)+i);
    }
  }

  if(settings.substring(4,5)=='1'){
    result += Math.pow(2,24);
  }

  var tmp = parseInt(settings.substring(5,7), 10).toString(2);
  //console.log("Pebble JS: " + parseInt(settings.substring(5,7), 10) + " tobits: " + tmp);
  for(var i = tmp.length-1; i>=0; i--){
    if(tmp[i]==1){
      result += Math.pow(2,19+(5-tmp.length)+i);
    }
  }

  tmp = parseInt(settings.substring(7,9), 10).toString(2);
  //console.log("Pebble JS: " + parseInt(settings.substring(7,9), 10) + " tobits: " + tmp);
  for(var i = tmp.length-1; i>=0; i--){
    if(tmp[i]==1){
      result += Math.pow(2,14+(5-tmp.length)+i);
    }
  }

  tmp = parseInt(settings.substring(9,10), 10).toString(2);
  //console.log("Pebble JS: " + parseInt(settings.substring(9,10), 10) + " tobits: " + tmp);
  for(var i = tmp.length-1; i>=0; i--){
    if(tmp[i]==1){
      result += Math.pow(2,11+(3-tmp.length)+i);
    }
  }

  if(settings.substring(10,11)=='1'){
    result += Math.pow(2,10);
  }
  
  if(settings.substring(11,12)=='1'){
    result += Math.pow(2,9);
  }

  tmp = parseInt(settings.substring(12,13), 10).toString(2);
  //console.log("Pebble JS: " + parseInt(settings.substring(12,13), 10) + " tobits: " + tmp);
  for(var i = tmp.length-1; i>=0; i--){
    if(tmp[i]==1){
      result += Math.pow(2,6+(3-tmp.length)+i);
    }
  }
  
  if(settings.substring(13,14)=='1'){
    result += Math.pow(2,5);
  }
  
  if(settings.substring(14,15)=='1'){
    result += Math.pow(2,4);
  }
  
  if(settings.substring(15,16)=='1'){
    result += Math.pow(2,3);
  }
  
  if(settings.substring(16,17)=='1'){
    result += Math.pow(2,2);
  }
  
  if(settings.substring(17,18)=='1'){
    result += Math.pow(2,1);
  }
  
  if(settings.substring(18,19)=='1'){
    result += Math.pow(2,0);
  }

  console.log("Pebble JS: translated settings(" + settings + "): " + result);

  return result;
}

function isActiveHour() {
  var currentdate = new Date(); 
  var hour = currentdate.getHours();
  var activestart = parseInt(settings.substring(5,7), 10);
  var activeend = parseInt(settings.substring(7,9), 10);

  if(activestart==activeend){
    //console.log(activestart + "=="+ activeend);
    //24h active
    return true;
  }

  if(activestart>activeend){
    if(hour>=activestart-1||hour<=activeend-1){
      //console.log(hour + ">=" + activestart+ "-1||" + hour + "<=" + activeend + "-1");
      return true;
    }
  }else if(hour>=activestart-1&&hour<=activeend-1){
    //console.log(hour + ">=" + activestart+ "-1&&" + hour + "<=" + activeend + "-1");
    return true;
  }

  return false;
}