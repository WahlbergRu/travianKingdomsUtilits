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

var timeForGame = 't' + Date.now();
var token = '89d2a7ada5501b855b12';
var serverDomain = 'ks3-ru';

var troops = {
  "controller": "troops",
  "action": "send",
  "params": {
    "catapultTargets": [99],
    "destVillageId": "537247789",
    "villageId": 537346086,
    "movementType": 3,
    "redeployHero": false,
    "units": {
      "1": 340,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0,
      "8": 10,
      "9": 0,
      "10": 0,
      "11": 0
    },
    "spyMission": "resources"
  },
  "session": token
};
var listPayload = {
  WahlbergRu3_15ka: {
    "controller": "troops",
    "action": "startFarmListRaid",
    "params": {
      "listIds": [2487],
      "villageId": 536166362
    },
    "session": "681e7f6a3a59a197fbff"
  },
  WahlbergRu3_start: {
    "controller": "troops",
    "action": "startFarmListRaid",
    "params": {
      "listIds": [383],
      "villageId": 535936992
    },
    "session": "681e7f6a3a59a197fbff"
  },
  RinRu2: {
    "controller": "troops",
    "action": "startFarmListRaid",
    "params": {
      "listIds": [3980],
      "villageId": 538230833
    },
    "session": "16847d7bd64735e7d7c7"
  },
  FirelanRu2_15ka: {
    "controller": "troops",
    "action": "startFarmListRaid",
    "params": {
      "listIds": [4099],
      "villageId": 538165296
    },
    "session": "f7a363ff96fe8e876af4"
  },
  FirelanRu2: {
    "controller": "troops",
    "action": "startFarmListRaid",
    "params": {
      "listIds": [4099],
      "villageId": 537870367
    },
    "session": "f7a363ff96fe8e876af4"
  }
};

var fixedTimeGenerator = function (seconds) {
    //Точное кол-во seconds секунд
    return parseInt(1000 * seconds);
  },
  getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  randomTimeGenerator = function (seconds) {
    //Рандом число в пределах seconds секунд
    return parseInt(getRandomInt(-1000, 1000) * seconds);
  },
  //fixedTime - фиксированное время
  //randomTime - разброс
  autoFarmList = function (fixedTime, randomTime, listPayload, serverDomain, init) {

    var startFramListRaid = function () {
      request
        .post({
          headers: {'content-type': 'application/x-www-form-urlencoded'},
          url: 'http://' + serverDomain + '.travian.com/api/?c=troops&a=send&' + timeForGame,
          body: JSON.stringify(listPayload)
        }, function (error, response, body) {
          console.info('Фарм лист пошёл! ' + listPayload.session);
          //console.info(body);
        })
    };

    var RecallFunction = function () {
      now = new Date();
      var rand = fixedTimeGenerator(fixedTime) + randomTimeGenerator(randomTime);
      console.log('Время выхода ' + now.toString());
      var tempTime = now.valueOf() + rand;
      var dateNext = new Date(tempTime);
      console.log('Следующее время запуска ' + dateNext.toString());
      //console.log(now+rand);

      if (init) {
        startFramListRaid();
      } else {
        console.info('Инциализации нету');
      }

      init = true;

      now = 't' + now;
      setTimeout(RecallFunction, rand);
    };

    RecallFunction();
  },
  attackRequest = function () {
    request
      .post({
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        url: 'http://' + serverDomain + '.travian.com/api/?c=troops&a=send&' + timeForGame,
        body: JSON.stringify(troops)
      }, function (error, response, body) {
        console.log(response);
      });
  },
  getAnimals = function () {
    request
      .get({
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        url: 'http://' + serverDomain + '.travian.com/api/external.php?action=requestApiKey&email=allin.nikita@yandex.ru&siteName=borsch&siteUrl=http://borsch-label.com&public=true'
      }, function (error, response, body) {

        apiKey = JSON.parse(body);
        console.log('Получили токен');
        //console.log(apiKey);

        request
          .get({
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            url: 'http://' + serverDomain + '.travian.com/api/external.php?action=getMapData&privateApiKey=' + apiKey.response.privateApiKey
          }, function (error, response, body) {
            var toJson = JSON.parse(body);
            apiData.players = JSON.stringify(toJson.response.players);
            apiData.alliances = JSON.stringify(toJson.response.alliances);
            apiData.gameworld = JSON.stringify(toJson.response.gameworld);

            function oasis() {

              var oasisArr = [];
              var oasisObj = JSON.parse(JSON.stringify(toJson.response.map.cells));
              var j = 0;
              for (var i = 0; i < oasisObj.length; i++) {
                if (oasisObj[i].oasis != 0) {
                  oasisArr[j] = 'MapDetails:' + oasisObj[i].id;
                  j++;
                }
              }

              var oasisAnimal = [];
              var k = 0;
              console.log('Сформировали массив');

              var session = {"controller": "cache", "action": "get", "params": {"names": oasisArr}, "session": token};

              request
              .post({
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  url: 'http://' + serverDomain + '.travian.com/api/?c=cache&a=get&' + timeForGame,
                  body: JSON.stringify(session)
              }, function (error, response, body) {
                console.log(response);
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
                var l = 0;


                for (var m = 0; m < jsonBody.cache.length; m++) {
                  for (var k = 0; k < toJson.response.map.cells.length; k++) {
                    if (toJson.response.map.cells[k].id == jsonBody.cache[m].data.troops.villageId) {

                      var avgMaxDpsInfantry = 0;
                      var avgAllDpsInfantry = 0;
                      var avgMaxDpsMounted = 0;
                      var avgAllDpsMounted = 0;
                      var troopsCounter = 0;
                      var minTroopsCounter = 1000000;
                      var toIntUnits = 0;
                      var counterAnimalType = 0;

                      for (var counterUnits in jsonBody.cache[m].data.troops.units) {
                        if (jsonBody.cache[m].data.troops.units.hasOwnProperty(counterUnits)) {
                          toIntUnits = parseInt(jsonBody.cache[m].data.troops.units[counterUnits], 10);
                          if (toIntUnits != 0 &&
                            minTroopsCounter > toIntUnits) {
                            minTroopsCounter = toIntUnits;
                          }
                          if (toIntUnits) {
                            counterAnimalType++
                          }
                          troopsCounter += toIntUnits;
                          avgAllDpsInfantry += jsonBody.cache[m].data.troops.units[counterUnits] * defenseTable[counterUnits - 1].Infantry;
                          avgAllDpsMounted += jsonBody.cache[m].data.troops.units[counterUnits] * defenseTable[counterUnits - 1].Mounted;
                        }
                      }

                      avgAllDpsInfantry = (avgAllDpsInfantry / troopsCounter).toFixed(1);
                      avgAllDpsMounted = (avgAllDpsMounted / troopsCounter).toFixed(1);

                      if (avgAllDpsInfantry.length < 5) {
                        avgAllDpsInfantry = '0' + avgAllDpsInfantry
                      }

                      if (avgAllDpsMounted.length < 5) {
                        avgAllDpsMounted = '0' + avgAllDpsMounted
                      }

                      if (troopsCounter === 0) {
                        break;
                      }

                      map[l] = {
                        x: toJson.response.map.cells[k].x,
                        y: toJson.response.map.cells[k].y,
                        animal: jsonBody.cache[m].data.troops.units,
                        counterAnimalType: counterAnimalType,
                        avgAllDps: avgAllDpsInfantry + '/' + avgAllDpsMounted,
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
            }
          });
      });
  };


function autoFarmFinder(){
  request
    .get({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url:     'http://'+serverDomain+'.travian.com/api/external.php?action=requestApiKey&email=allin.nikita@yandex.ru&siteName=borsch&siteUrl=http://borsch-label.com&public=true'
    }, function(error, response, body){

      apiKey = JSON.parse(body);
      console.log('Получили токен');

      request
        .get({
          headers: {'content-type' : 'application/x-www-form-urlencoded'},
          url:     'http://'+serverDomain+'.travian.com/api/external.php?action=getMapData&privateApiKey='+apiKey.response.privateApiKey
        }, function(error, response, body) {

          var jsonBody = JSON.parse(body);
          var players = _.pluck(jsonBody.response.players, 'playerId');

          for (var i = 0; i < players.length; i++) {
            players[i] = 'Player:'+players[i];
          }

          var payload = {
            controller: "cache",
            action: "get",
            params: {names: players},
            session: "546c413eb453c50d0ccc"
          };

          console.log('Сфоримировали массив игроков');

          request
            .post({
              headers: {'content-type' : 'application/x-www-form-urlencoded'},
              url:     'http://'+serverDomain+'.travian.com/api/?c=cache&a=get&'+timeForGame,
              body:    JSON.stringify(payload)
            }, function(error, response, body) {
              var allVillages = JSON.parse(body);
              var allGreyVillages = [];
              allVillages.cache.forEach(function(item, i, arr){
                if (item.data.active == 0){
                  allGreyVillages.push(item);
                }
              });

              console.log(allGreyVillages.length);
              console.log(allVillages.cache.length);
            });
          //console.log(toJson.response.alliances);
          //console.log(JSON.stringify(toJson.response.gameworld));
        }
      )
    }
  )
}
//autoFarmFinder();

autoFarmList(3600, 600, listPayload.WahlbergRu3_15ka, 'ks3-ru', true);
autoFarmList(3600, 600, listPayload.WahlbergRu3_start, 'ks3-ru', true);
autoFarmList(3600, 600, listPayload.RinRu2, 'ks2-ru', true);
autoFarmList(3600, 600, listPayload.FirelanRu2_15ka, 'ks2-ru', true);
autoFarmList(3600, 600, listPayload.FirelanRu2, 'ks2-ru', true);


//getAnimals();


/* GET home page. */
router.get('/', function (req, res, next) {

  res.render('index', {
    title: 'Animal search',
    gameworld: apiData.gameworld,
    players: apiData.players,
    alliances: apiData.alliances,
    map: apiData.map
  });

});

module.exports = router;
