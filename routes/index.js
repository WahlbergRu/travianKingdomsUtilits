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
var rp = require('request-promise');

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
  WahlbergRu2: {
    "controller":"troops",
    "action":"startFarmListRaid",
    "params":{
      "listIds":[4659,4660,4661],
      "villageId":537346086
    },
    "session":"59b90efaaac63ee8e55a"
  },
  RinRu2: {
    "controller": "troops",
    "action": "startFarmListRaid",
    "params": {
      "listIds": [3980, 4198],
      "villageId": 538230833
    },
    "session": "d52d052c7f00d7dfc346"
  },
  FirelanRu2_15ka: {
    "controller": "troops",
    "action": "startFarmListRaid",
    "params": {
      "listIds": [4758, 4759],
      "villageId": 538165296
    },
    "session": "c9b63e02995600fa1fea"
  },

  FirelanRu2: {
    "controller": "troops",
    "action": "startFarmListRaid",
    "params": {
      "listIds": [4760, 4761],
      "villageId": 537870367
    },
    "session": "c9b63e02995600fa1fea"
  },
  Serb: {
    "controller":"troops",
    "action":"startFarmListRaid",
    "params":{
      "listIds":[3997],
      "villageId":536035298
    },
    "session":"834ac16106c46d3c30bc"}
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
  httpRequest = function (obj){
    return rp({
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      uri: 'http://' + serverDomain + '.travian.com/api/?c='+ obj.controller +'&a='+ obj.action +'&' + timeForGame,
      body: JSON.stringify(obj),
      json: true // Automatically parses the JSON string in the response
    })
  },
  //fixedTime - фиксированное время
  //randomTime - разброс
  autoFarmList = function (fixedTime, randomTime, listPayload, serverDomain, init) {

    var lastDataFromList = {
      "controller": "cache",
      "action": "get",
      "params": {
        "names": []
      },
      "session": listPayload.session
    };

    for (var i = 0; i < listPayload.params.listIds.length; i++) {
      var obj = "Collection:FarmListEntry:" + listPayload.params.listIds[i];
      lastDataFromList.params.names.push(obj);
    }

    var percentLose = 0.75;

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
      var now = new Date();
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


      setTimeout(checkList, rand);

    };

    var checkList = function () {

      function start(counter, countMax, timeout, clearTimer, func, obj) {

        if (counter < countMax){

          setTimeout(function () {
            // Do Something Here
            // Then recall the parent function to
            // create a recursive loop.
            // console.log(counter);

            if (func){func(obj, counter);}

            counter++;
            start(counter, countMax, timeout, clearTimer, func, obj);

          }, timeout);

        } else{

          console.log('Цикл проверки закончен');
          RecallFunction();
          clearTimeout(clearTimer);

        }

      }

      function rowInListChanger(body, i, j){
        var objFromCache = body.cache[j].data.cache[i],
          lastReport = objFromCache.data.lastReport;

        // console.log(j, i);

        var newObjUnits = {
          "controller": "farmList",
          "action": "editTroops",
          "params": {
            "entryIds": [objFromCache.data.entryId],
            "units": objFromCache.data.units
          },
          "session": listPayload.session
        };

        var romeTroops = {
          1: 50,
          2: 20,
          3: 50,
          4: 0,
          5: 100,
          6: 70
        };

        if (!lastReport) return false;
        // console.log(lastReport);
        if (lastReport.notificationType == '1') {
          var sum = 0;

          for (var unitKey in objFromCache.data.units) {
            sum += parseInt(objFromCache.data.units[unitKey]);
          }

          //Если полный хабар то увеличиваем счётчик юнита
          if (lastReport.capacity === lastReport.raidedResSum) {
            for (var unitKey in objFromCache.data.units) {

              if (objFromCache.data.units[unitKey] != 0) {
                objFromCache.data.units[unitKey]++;
              }

              // console.log('Зелёный лог: увеличилось на 1 юнита');

            }
          }

          //Если хабар не полный, то грузподъемность пополам
          else if (lastReport.capacity / 2 > lastReport.raidedResSum || sum > 10) {
            if (objFromCache.data.units[unitKey] != 0) {
              objFromCache.data.units[unitKey]--;
            }

            // console.log('Зелёный лог: уменьшилось на 1 юнита');

          }

          else {
            // console.log('Зелёный лог: оставить без изменений');
            return false;
          }

        }
        else if (lastReport.notificationType == '2') {
          var capacity = 0;

          for (var unitKey in objFromCache.data.units) {
            // console.log(parseInt(objFromCache.data.units[unitKey]));
            // console.log(romeTroops[unitKey]);
            capacity += parseInt(objFromCache.data.units[unitKey]) * romeTroops[unitKey];
          }

          //Если потери будут меньше чем указанный процент, то кол-во юнитов увеличивается в два раза

          // console.log('Capacity: ' + capacity);
          // console.log('LastReport: ' + lastReport.capacity * percentLose);
          if (capacity > lastReport.capacity * percentLose && capacity/4 < lastReport.capacity * percentLose) {
            for (var unitKey in objFromCache.data.units) {
              objFromCache.data.units[unitKey] *= 2
            }
            // console.log('Жёлтый лог: отправлен запрос');
          } else {

            for (var unitKey in objFromCache.data.units) {
              sum += parseInt(objFromCache.data.units[unitKey]);
              objFromCache.data.units[unitKey] = 0;
            }

            objFromCache.data.units[1] = 1;

            // console.log('Жёлтый лог: убран');
          }
        }
        else if (lastReport.notificationType == '3'){

          var sum = 0;

          for (var unitKey in objFromCache.data.units) {
            sum += parseInt(objFromCache.data.units[unitKey]);
            objFromCache.data.units[unitKey] = 0;
          }

          objFromCache.data.units[1] = 1;

          if (sum == 1) {
            // console.log('Красный лог: оставлен без изменения');
            return false;
          } else {
            // console.log('Название деревни' + objFromCache.data.villageName);
            // console.log('Красный лог: отправлен запрос');
          }
        }

        // console.log(newObjUnits);

        httpRequest(newObjUnits).then(
          function (body) {
            // console.log(body);
          },
          function (err) {
            // console.log(err);
          }
        );
      }

      function listTimer(body, i){
        var j = 0;
        var diffI = 0;
        var sum = body.cache[0].data.cache.length;

        for (var k = 1; k < body.cache.length;k++ ) {
          if (i >= sum){
            diffI = sum;
            sum += body.cache[k].data.cache.length;
            j++;
          }
        }

        // console.log(sum);

        var rowInListChangerTimerObj = rowInListChanger(body, i-diffI , j);
      }
      // console.log(timerObj);

      httpRequest(lastDataFromList)
      .then(function (body) {
        var counter = 0;
        var countMax = 0;

        for (var i = 0; i < body.cache.length; i++) {
          countMax += body.cache[i].data.cache.length;
        }

        var listTimerObj = start(counter, countMax,  1000, listTimerObj, listTimer, body);


      })
      .catch(function (err) {
        // console.log(err);
        // POST failed...
      });
      
    };

    checkList();


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
            oasis();
          });
      });
  };


function autoFarmFinder(xCor, yCor, name){
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
            session: token
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
                  for (var j = 0; j < item.data.villages.length; j++) {
                    var obj = item.data.villages[j];
                    allGreyVillages.push(obj);
                  }
                }
              });

              var sortedAllGreyVillages = _.sortBy(allGreyVillages, function(villages){
                var len = Math.sqrt(Math.pow(villages.coordinates.x - xCor, 2) + Math.pow(villages.coordinates.y - yCor, 2));
                return len;
              });

              console.log('Количество ' + sortedAllGreyVillages.length);

              var listLength = Math.ceil(sortedAllGreyVillages.length/100);


              var listIndex = 0;
              var listId = [];

              var count = 0;

              for (var i = 0; i < listLength; i++) {

                var listObj = {
                  "controller":"farmList",
                  "action":"createList",
                  "params":{"name":name + ' ' + i},
                  "session":token
                };

                request
                .post({
                  headers: {'content-type' : 'application/x-www-form-urlencoded'},
                  url:     'http://'+serverDomain+'.travian.com/api/?c=farmList&a=createList&'+timeForGame,
                  body:    JSON.stringify(listObj)
                }, function(error, response, body)
                {
                    listId.push(JSON.parse(body).cache[0].data.cache[0].data.listId);
                    count++;

                    if (listId.length == listLength){
                      addToFarmList();
                    }
                });

              }

              function addToFarmList(){
                console.log(listId);
                for (var i = 0; i < sortedAllGreyVillages.length; i++) {
                  var villageId = sortedAllGreyVillages[i].villageId;

                  if (i%100 == 0  && i!=0){
                    listIndex++
                  }

                  //console.log(listIndex);

                  var farmListPayload = {
                    "controller":"farmList",
                    "action":"moveEntry",
                    "params":{
                      "villageId":villageId,
                      "newListId":listId[listIndex],
                      "entryId":0
                    },
                    "session": token
                  };

                  request
                  .post({
                    headers: {'content-type' : 'application/x-www-form-urlencoded'},
                    url:     'http://'+serverDomain+'.travian.com/api/?c=farmList&a=moveEntry&'+timeForGame,
                    body:    JSON.stringify(farmListPayload)
                  }, function(error, response, body) {
                    //console.log(body);
                  });

                  //TODO: доделать таймаут

                }
              }

            });
          //console.log(toJson.response.alliances);
          //console.log(JSON.stringify(toJson.response.gameworld));
        }
      )
    }
  )
}



var timeForGame = 't' + Date.now();
var token = '4c7c3f52925117163c02';
var serverDomain = 'ks2-ru';

// autoFarmFinder('49', '41', 'Мур, детка');

autoFarmList(3600, 600, listPayload.RinRu2, 'ks2-ru', true);
autoFarmList(7200, 600, listPayload.FirelanRu2_15ka, 'ks2-ru', true);
autoFarmList(3600, 600, listPayload.FirelanRu2, 'ks2-ru', true);
// autoFarmList(3600, 600, listPayload.WahlbergRu2, 'ks2-ru', true);

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
