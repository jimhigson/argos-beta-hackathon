var PORT = 6677;
var ELASTIC_SEARCH_HOST = 'http://beta.vichub.co.uk:9200/argos';

var express = require('express');
var app = express();
var request = require('request');
require('colors');

function priceRange(query) {
   
   function withoutMatchingText(match, text) {
      return match
                     ? text.substring(0, match.index) + text.substring(match.index+match[0].length)
                     : text
                     ;
   }
   
   var LESS_THAN_PATTERN = /(?:for )?(?:less than|<|under|cheaper than) £?(\d+(.\d+)?)/,
       MORE_THAN_PATTERN = /(?:for )?(?:more than|>|over|at least|above) £?(\d+(.\d+)?)/,
       minPriceMatch = MORE_THAN_PATTERN.exec(query),
       maxPriceMatch = LESS_THAN_PATTERN.exec(query);
   
   return {
      maxPrice : (maxPriceMatch? Number(maxPriceMatch[1]).toFixed(2) : "1000000.00"),
      minPrice : (minPriceMatch? Number(minPriceMatch[1]).toFixed(2) : "0.01"),
      term: 
         withoutMatchingText( minPriceMatch, 
               withoutMatchingText( maxPriceMatch, query )
         ).trim()
   };
}

app
   .use(express.static('statics'))
   .get('/search/:term', function(req, res){

      var startTime = Date.now(),
          query = req.params.term;
      
      var queryTerms = priceRange(query);
      
      var requestBodyJson = {
         query: {
            "filtered": {
               "query":{
                  "query_string": {
                     "fields": ["productId^8", "productTitle^8", "summaryText"],
                     "query": queryTerms.term
                  }
               },
               "filter": {
                  "range": {
                     "price": {
                        "from": queryTerms.minPrice,
                        "to": queryTerms.maxPrice
                     }
                  }
               }
            }
         }
      };
      
      console.log( JSON.stringify( requestBodyJson ) );

      request({
         
         url: ELASTIC_SEARCH_HOST + '/products/_search',
         method:'GET',
         body: JSON.stringify( requestBodyJson )
         
      }, function(error, _, responseBodyJson) {
         
         console.log( JSON.parse(responseBodyJson) );
         
         res.setHeader('Content-Type', 'application/json');
         responseBodyJson.timeTaken = startTime - Date.now();
         res.send(responseBodyJson);
      });
   });

app.listen(PORT);
console.log('server started'.green);
