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

var time = 't1455210552230';
var token = '98dc2dabea300ac75442';
var serverDomain = 'ks2-ru';

var troops = {
  "controller":"troops",
  "action":"send",
  "params":{
    "catapultTargets": [99],
    "destVillageId":"537247789",
    "villageId":537346086,
    "movementType":3,
    "redeployHero":false,
    "units":{
      "1":340,
      "2":0,
      "3":0,
      "4":0,
      "5":0,
      "6":0,
      "7":0,
      "8":10,
      "9":0,
      "10":0,
      "11":0
    },
    "spyMission":"resources"
  },
  "session":token};


var attackRequest = function(){
  request
  .post({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url:     'http://'+ serverDomain + '.travian.com/api/?c=troops&a=send&'+time,
    body: JSON.stringify(troops)
  }, function(error, response, body) {
    console.log(response);
  });
};


for (var i = 0; i<27; i++){
  attackRequest();
}





/* GET home page. */
router.get('/send/', function(req, res, next) {

  res.render('sendAttack', {
    title: 'sendAttack'
  });

});

module.exports = router;
