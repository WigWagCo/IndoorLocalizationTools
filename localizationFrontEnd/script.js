var app = angular.module('plunker', []);

// mapping between bulb IP address and location name
var BULB_LOCATION_MAPPINGS = {
    'aaaa::2a5:900:a1:23a8': 'Bathroom',
    'aaaa::2a5:900:b1:5d50': 'Kitchen',
    'aaaa::2a5:900:f8:7029': 'Living Room',
    'aaaa::2a5:900:8f:29ef': 'Living Room',
    'aaaa::2a5:900:a4:25bc': 'Bathroom'
}

// mapping between presence tag IP address and person name
var PRESENCE_TAG_PERSON_MAPPINGS = {
    'aaaa::2a5:9ff:400:666': 'John',
    'aaaa::2a5:9ff:400:667': 'Jordan',
    'aaaa::2a5:9ff:400:668': 'Yash',
    'aaaa::2a5:9ff:400:669': 'Wallet'
}

var getNearestNode = function(rssi_map) {
    var mappings = [ ];

    for(var ip in rssi_map) {
        mappings.push({ ip: ip, value: rssi_map[ip] });
    }

    return mappings.sort(function(a, b) {
        return a.value - b.value;
    }).map(function(a) {
        return a.ip;
    })[0] || null; 
}


app.controller('MainController', function($scope, $http) {

    var canvas=document.getElementById("canvas");
    var ctx=canvas.getContext("2d");
    var cw=canvas.width;
    var ch=canvas.height;

    $scope.rssi_map = null;
    var rssi_map = null;

    var m = [];

                this.interval = setInterval(function(){

                    $http.get('/localizationMap').success(function(res) {
                        ctx.clearRect(0, 0, cw, ch);
                    $scope.rssi_map = res;
                    rssi_map = res;
                    console.log(rssi_map);

                    var root_x = 500;
                    var root_y = 500;
                    var radius = 10;
                    var font = "10px Arial";

                    var factor = 10;

                    ctx.beginPath();
                    ctx.arc(root_x, root_y, radius, 0, 2 * Math.PI);
                    ctx.fillStyle="blue";
                    ctx.fill();

                    function multiply(a, b) {
                        var aNumRows = 2, aNumCols = 2,
                            bNumRows = 2, bNumCols = 1,
                            m = new Array(aNumRows);  // initialize array of rows
                        for (var r = 0; r < aNumRows; ++r) {
                            m[r] = new Array(bNumCols); // initialize the current row
                            for (var c = 0; c < bNumCols; ++c) {
                                m[r][c] = 0;             // initialize the current cell
                                for (var i = 0; i < aNumCols; ++i) {
                                    m[r][c] += a[r][i] * b[i][c];
                                }
                            }
                        }
                        return m;
                    }

                    function drawEdge(to, from, ln) {
                      ctx.beginPath();
                      ctx.lineJoin="round";
                      ctx.moveTo(to.x,to.y);
                      ctx.lineTo(from.x,from.y);
                      ctx.fillText(ln, (to.x + from.x) / 2, (to.y + from.y ) / 2);
                      ctx.stroke();
                    }

                    var numOfNodes = 5;
                    var deg = 360/numOfNodes;
                    var x = (3.14/180)*deg;  //radians
                    var n = 0;
                    Object.keys(rssi_map).forEach(function(key) {

                        // var a = [[Math.cos(n*x), - Math.sin(n*x)], [Math.sin(n*x), Math.cos(n*x)]];
                        // var b = [[rssi_map[key]], [0]];
                        if(typeof m[key] == 'undefined') {
                            m[key] = [];
                        }
                        m[key][0] = rssi_map[key] * Math.cos(n*x) * factor + root_x;
                        m[key][1] = rssi_map[key] * Math.sin(n*x) * factor + root_y;

                        console.log('rssi value: ', rssi_map[key]);
                        // var m = multiply(a, b);
                        console.log('vertice: ', m);
                        // console.log(m);

                        ctx.beginPath();
                        ctx.arc(m[key][0], m[key][1], radius, 0, 2 * Math.PI);
                        ctx.fillStyle="red";
                        ctx.fill();
                          ctx.font= font;
                          ctx.fillText(BULB_LOCATION_MAPPINGS[key] + '(' + key + ')', m[key][0] - radius/2 , m[key][1] + 2*radius);
                          ctx.stroke();

                        drawEdge({x: root_x, y: root_y}, {x: m[key][0], y: m[key][1]}, rssi_map[key]);
                        n++;
                    });

                    var i =0;
                    Object.keys(personMap).forEach(function(personName){
                          person[i] = personName;
                          location[i] = personMap[personName];
                          console.log('person: ' + person[i] + ' location ' + location[i]);


                          ctx.beginPath();
                          ctx.fillStyle="blue";
                          ctx.font= "20px Arial";
                          ctx.fillText(person[i]+' is in '+ location[i], 800, 900+i*20);
                          ctx.stroke();

                          i++;
                    });  
                });}, 200);

                this.interval1 = setInterval(function(){

                $http.get('/presenceMap').success(function(res) {
                    $scope.rssi_map = res;
                    rssi_map = res;
                    console.log(rssi_map);

                    // var root_x = 500;
                    // var root_y = 500;
                    var radius = 10;
                    var font = "10px Arial";

                    var factor = 30;

                    // ctx.beginPath();
                    // ctx.arc(root_x, root_y, radius, 0, 2 * Math.PI);
                    // ctx.fillStyle="green";
                    // ctx.fill();

                    function multiply(a, b) {
                        var aNumRows = 2, aNumCols = 2,
                            bNumRows = 2, bNumCols = 1,
                            m = new Array(aNumRows);  // initialize array of rows
                        for (var r = 0; r < aNumRows; ++r) {
                            m[r] = new Array(bNumCols); // initialize the current row
                            for (var c = 0; c < bNumCols; ++c) {
                                m[r][c] = 0;             // initialize the current cell
                                for (var i = 0; i < aNumCols; ++i) {
                                    m[r][c] += a[r][i] * b[i][c];
                                }
                            }
                        }
                        return m;
                    }

                    function drawEdge(to, from, ln) {
                      ctx.beginPath();
                      ctx.lineJoin="round";
                      ctx.moveTo(to.x,to.y);
                      ctx.lineTo(from.x,from.y);
                      ctx.fillText(ln, (to.x + from.x) / 2, (to.y + from.y ) / 2);
                      ctx.stroke();
                    }



                    Object.keys(rssi_map).forEach(function(tag) {
                        var result = getNearestNode(rssi_map[tag])
                        console.log('nearest node: ', result + ' distance: ', rssi_map[tag][result]);

                        ctx.beginPath();
                        ctx.arc(m[result][0] + rssi_map[tag][result]*10, m[result][1] + rssi_map[tag][result]*10, radius, 0, 2 * Math.PI);
                        ctx.fillStyle="green";
                        ctx.fill();
                          ctx.font= font;
                          ctx.fillText(PRESENCE_TAG_PERSON_MAPPINGS[tag]  + '(' + tag + ')', m[result][0] + rssi_map[tag][result]*10 - radius/2 , m[result][1] + rssi_map[tag][result]*10 + 2*radius);
                          ctx.stroke();

                        drawEdge({x: m[result][0], y: m[result][1]}, {x: m[result][0] + rssi_map[tag][result]*10, y: m[result][1] + rssi_map[tag][result]*10}, rssi_map[tag][result]);

                    });

                    // var numOfNodes = 5;
                    // var deg = 360/numOfNodes;
                    // var x = (3.14/180)*deg;  //radians
                    // var n = 0;


                });}, 200);

            // $scope.person = [];
            // $scope.location = [];

            var person = [];
            var location = [];
            var personMap;
            this.interval2 =  setInterval(function(){
                    $http.get('/personMap').success(function(res) {  
                           personMap = res;

                            // $scope.apply;         
                     });
            }, 200);

                //this.endLongPolling = function(){ clearInterval(this.interval);};
});