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




/* GET home page. */
router.get('/send/', function(req, res, next) {

  res.render('sendAttack', {
    title: 'sendAttack'
  });

});

module.exports = router;
