var express = require('express');
var router = express.Router();

var apiData = {
  gameworld: null,
  players: null,
  alliances: null,
  map: null,
  fromGame: null
};

var apiKey = {};
var request = require('request');
var http = require('http');
var _ = require('underscore');
//var rp = require('request-promise');


request
.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'http://ks2-ru.travian.com/api/external.php?action=requestApiKey&email=allin.nikita@yandex.ru&siteName=borsch&siteUrl=http://borsch-label.com&public=true'
}, function(error, response, body){

  apiKey = JSON.parse(body);
  console.log('Получили токен');

  request
  .get({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url:     'http://ks2-ru.travian.com/api/external.php?action=getMapData&privateApiKey='+apiKey.response.privateApiKey
  }, function(error, response, body) {
    var toJson = JSON.parse(body);
    apiData.players = JSON.stringify(toJson.response.players);
    apiData.alliances = JSON.stringify(toJson.response.alliances);
    apiData.gameworld = JSON.stringify(toJson.response.gameworld);

    var oasisArr = [];
    var oasisObj = JSON.parse(JSON.stringify(toJson.response.map.cells));
    var j = 0;
    for (var i = 0; i < oasisObj.length; i++) {
      if (oasisObj[i].oasis != 0) {
        oasisArr[j] = 'MapDetails:'+oasisObj[i].id;
        j++;
      }
    }

    var oasisAnimal = [];
    var k = 0;
    console.log('Сформировали массив');

    var session = {"controller":"cache","action":"get","params":{"names":oasisArr},"session":"9996a9e26c484fde56e0"};

    request
    .post({
      headers: {
        'Content-Type' : 'application/json'
      },
      url: 'http://ks2-ru.travian.com/api/?c=cache&a=get&t1452017888439',
      body: JSON.stringify(session)
    },function(error, response, body){
      //console.log(response);
      var jsonBody = JSON.parse(body);

      var map = [];
      var defenseTable = [
          {Infantry: 25, Mounted: 20},
          {Infantry: 35, Mounted: 40},
          {Infantry: 40, Mounted: 60},
          {Infantry: 66, Mounted: 55},
          {Infantry: 70, Mounted: 33},
          {Infantry: 80, Mounted: 70},
          {Infantry: 140, Mounted: 200},
          {Infantry: 380, Mounted: 240},
          {Infantry: 170, Mounted: 250},
          {Infantry: 440, Mounted: 520}
      ];
      var l=0;


      for (var m=0; m < jsonBody.cache.length; m++){
        for (var k=0; k < toJson.response.map.cells.length; k++){
          if (toJson.response.map.cells[k].id == jsonBody.cache[m].data.troops.villageId){

            var avgMaxDpsInfantry = 0;
            var avgAllDpsInfantry = 0;
            var avgMaxDpsMounted = 0;
            var avgAllDpsMounted = 0;
            var troopsCounter = 0;
            var minTroopsCounter = 1000000;
            var toIntUnits = 0;
            var counterAnimalType = 0;

            for (var counterUnits in jsonBody.cache[m].data.troops.units){
              if (jsonBody.cache[m].data.troops.units.hasOwnProperty(counterUnits)) {
                toIntUnits = parseInt(jsonBody.cache[m].data.troops.units[counterUnits],10);
                if (toIntUnits!=0 &&
                    minTroopsCounter>toIntUnits){
                  minTroopsCounter = toIntUnits;
                }
                if(toIntUnits){counterAnimalType++}
                troopsCounter     += toIntUnits;
                avgAllDpsInfantry += jsonBody.cache[m].data.troops.units[counterUnits] * defenseTable[counterUnits-1].Infantry;
                avgAllDpsMounted  += jsonBody.cache[m].data.troops.units[counterUnits] * defenseTable[counterUnits-1].Mounted;
              }
            }

            avgAllDpsInfantry=(avgAllDpsInfantry/troopsCounter).toFixed(1);
            avgAllDpsMounted =(avgAllDpsMounted /troopsCounter).toFixed(1);

            if (troopsCounter===0){
              break;
            }

            map[l]={
              x: toJson.response.map.cells[k].x,
              y: toJson.response.map.cells[k].y,
              animal: jsonBody.cache[m].data.troops.units,
              counterAnimalType: counterAnimalType,
              avgAllDps: avgAllDpsInfantry+'/'+avgAllDpsMounted,
              avgAllDpsInfantry: avgAllDpsInfantry,
              avgAllDpsMounted: avgAllDpsMounted
            };

            l++;
            break;
          }
        }
      }

      map = _.sortBy(map, 'avgAllDpsInfantry').reverse();


      apiData.map = JSON.stringify(map);
      //console.log(apiData.map);
      //console.log(jsonBody.cache);
      //console.log(toJson.response.map.cells);
      console.log('Создали объект');

    });
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('index', {
    title: 'Animal search',
    gameworld: apiData.gameworld,
    players: apiData.players,
    alliances: apiData.alliances,
    map: apiData.map
  });

});

module.exports = router;
