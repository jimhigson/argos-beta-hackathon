var PORT = 80;
var express = require('express');

var app = express();
var request = require('request');

app
   .use(express.static('statics'))
   .get('/', function(req, res){
      res.send({ some: 'json' });
   })
   .get('/search/:term', function(req, res){

      var searchTerm = req.params.term;
      
      var requestBodyJson = {
         "query" : {
            "query_string" : {
               "fields" : ["productTitle^5", "summaryText"],
               "query" : searchTerm
            } 
         }            
      }         
      ;
      
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
