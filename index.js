var PORT = 6677;
var express = require('express');

var app = express();
var request = require('request');

app
   .use(express.static('statics'))
   .get('/', function(req, res){
      res.send({ some: 'json' });
   })
   .get('/search/:term', function(req, res){

      var requestBodyJson = {
         query: {
            "match": {
               productId: req.params.term
               //summaryText: req.params.term
            }
         }
      };
      
      request({
         
         url: 'http://localhost:9200/argos/products/_search',
         method:'GET',
         body: JSON.stringify( requestBodyJson )
         
      }, function(error, _, responseBodyJson) {
         res.setHeader('Content-Type', 'application/json');
         res.send(responseBodyJson);
      });
   });

app.listen(PORT);
