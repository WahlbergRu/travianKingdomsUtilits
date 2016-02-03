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

var time = 't1453450032302';
var token = '7da3f5d226bcbf754d85';

var troops = {
  "controller":"troops",
  "action":"send",
  "params":{
    "destVillageId":"537346088",
    "villageId":537346086,
    "movementType":3,
    "redeployHero":false,
    "units":{
      "1":1,
      "2":0,
      "3":0,
      "4":0,
      "5":0,
      "6":0,
      "7":0,
      "8":0,
      "9":0,
      "10":0,
      "11":0
    },
    "spyMission":"resources"
  },
  "session":"c307436eb9c634ff5d12"};


var attackRequest = function(){
  request
  .post({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url:     'http://ks2-ru.travian.com/api/?c=troops&a=send&t1453450032302',
    body: JSON.stringify(troops)
  }, function(error, response, body) {
    console.log(response);
  });
};


for (var i = 0; i<30; i++){
  attackRequest();
}





/* GET home page. */
router.get('/send/', function(req, res, next) {

  res.render('sendAttack', {
    title: 'sendAttack'
  });

});

module.exports = router;
