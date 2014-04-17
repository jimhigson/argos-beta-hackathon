var PORT = 6677,
    ELASTIC_SEARCH_HOST = 'http://beta.vichub.co.uk:9200/argos',

    express = require('express'),
    request = require('request'),
    consolidate = require('consolidate');

var app = express();

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

function renderPage(res, term) {
   res.render('page', {startTerm:(term || '')});
}

function unencodeTerm(raw) {
   return raw.replace(/_/g, ' ');
}

app.engine('handlebars', consolidate.handlebars);
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

app
   .get('/', function(req, res) {
      // legacy URL (already given to some people) - redirect / to /search
      res.redirect('/search'); 
   })
   .get('/search', function(req, res) {
      renderPage(res);
   })   
   .get('/search/:term', function(req, res) {
      renderPage(res, unencodeTerm(req.params.term));
   })
   .get('/find/:term', function(req, res){
      
      var startTime = Date.now(),
          query = unencodeTerm(req.params.term);
      
      var queryTerms = priceRange(query);
      
      var requestBodyJson = {
         query: {
            "filtered": {
               "query":{
                  "query_string": {
                     "fields": ["productId^8", "productTitle^8", "summaryText"],
                     "query": queryTerms.term + '*'
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
   })
   .use(express.static('statics'));

app.listen(PORT);
console.log('server started'.green);
