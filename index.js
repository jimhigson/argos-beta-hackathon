var PORT = 6677,
    //ELASTIC_SEARCH_HOST = 'http://beta.vichub.co.uk:9200/argos',
    ELASTIC_SEARCH_HOST = 'http://localhost:9200/argos',

    express = require('express'),
    request = require('request'),
    consolidate = require('consolidate'),
    parseString = require('xml2js').parseString;

var cmdLineParams = require('minimist')(process.argv.slice(2)),
    isProd = (cmdLineParams.env == 'prod'),

    SCRIPTS = isProd? ['/js-concat/all.js'] : require('./jsSourcesList.js'),
    STYLESHEETS = isProd? ["/css-min/all.css"] : ["/css/reset.css", "/css/style.css"];

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

   
   res.render('page', {
      startTerm:(term || ''),
      scripts:SCRIPTS,
      stylesheets:STYLESHEETS
   });
}

function unencodeTerm(raw) {
   if( !raw ) {
      return raw;
   } else {
      return raw.replace(/_/g, ' ');
   }
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
   .get('/search/:term',            servePageOrJson )
   .get('/search/:category/:term',  servePageOrJson )
   .get('/stores/:term', serveStoreJson)
   .get('/stockInfo/:storeNumber/:partNumbers', getStockInfo )
   .use(express.static('statics'));

app.listen(PORT);
console.log('server started'.green, 'in', (isProd? 'production':'dev').green, 'mode');

function serveStoreJson(req, res) {
   
   var term = req.params.term;

   request({

      url: ELASTIC_SEARCH_HOST + '/stores/_search?q=' + term + '*',

   }, function (error, _, responseBodyJson) {

      var responseObj = JSON.parse(responseBodyJson);

      res.setHeader('Content-Type', 'application/json');

      if( !responseObj.error ) {
         res.send(responseObj);
      } else {
         res.send(responseObj.status, responseObj);
      }
   });   
}

function servePageOrJson(req, res) {

   var term     = unencodeTerm(req.params.term),
       category = unencodeTerm(req.params.category);
   
   console.log(
      'Searching for',
      ("'" + term + "'").blue,
      'in category',
      ("'" + category + "'").blue
   );

   if( req.query.json == 'true' ) {
      serveJson(req, res, term, category);
   } else {
      renderPage(res, term, category);
   }
}

function analyseCategories( response ) {
   
   var cats = {},
       orderedCats = [];
   
   response.hits.hits.forEach(function( item ) {

      var categoryName = item._source.category; 
      cats[categoryName] = cats[categoryName]? cats[categoryName]+1 : 1; 
   });

   for( var name in cats ) {
      orderedCats.push( {name: name, number:cats[name]} );
   }
   
   return orderedCats.sort(function(a,b) {
      return b.number - a.number;
   });
}

function serveJson(req, res, query, category) {

   var queryTerms = priceRange(query);
   
   var requestBodyJson = {
      min_score: 0.4,
      size: 100, // how many results?
      
      "highlight": {
         "fields": {
            "productTitle": {},
            "summaryText": {}
         }
      },
      query: {
            "query_string": {
                  "fields": ["productId^4", "productTitle^5", "category^3", "summaryText"],
                  "query": queryTerms.term + '*'
               }
      },

      "facets" : {
         "category" : {
            "terms" : {
               "field" : "category",
               "size" : 10
            }
         }
      },

      "filter": {
         and:[
            {  "range": {
                  "price": {
                     "from": queryTerms.minPrice,
                     "to": queryTerms.maxPrice
                  }
               }
            }
         ]
      }
   };
   
   if( category ) {
      requestBodyJson.filter.and.push({
         term: {
            category: category.toLowerCase()
         }
      });
   }
   
   request({

      url: ELASTIC_SEARCH_HOST + '/products/_search',
      method: 'GET',
      body: JSON.stringify(requestBodyJson)

   }, function (error, _, responseBodyJson) {
            
      var responseObj = JSON.parse(responseBodyJson);
      responseObj.request = requestBodyJson;

      res.setHeader('Content-Type', 'application/json');
      
      if( !responseObj.error ) {
         // Analyse categories
         responseObj.categories = analyseCategories(responseObj);

         // Clean up JSON
         for(var i = 0; i < responseObj.hits.hits.length; ++i) {
            delete responseObj.hits.hits[i]._source.summary;
            delete responseObj.hits.hits[i]._source.summaryText;
            //delete responseObj.hits.hits[i].highlight.summaryText;
         }

         res.send(responseObj);
      } else {
         res.send(responseObj.status, responseObj);
      }
   });
}

function getStockInfo(req, res) {

   var partNumbers = req.params.partNumbers.split(',');
   var storeNumber = req.params.storeNumber;
   var avilabilityMap = [];

   var reponseXML = makeXMLRequestBody(partNumbers, storeNumber, function(xml) {

      parseString(xml, function(err, result) {
         
         try {

            for (var i = 0; i < result['stk:Stock']['stk:AvailabilityList'][0]['stk:Availability'][0]['bsk:Basket'][0]['bsk:ItemList'][0]['cmn:Item'].length; i++) {
               var stockItem = result['stk:Stock']['stk:AvailabilityList'][0]['stk:Availability'][0]['bsk:Basket'][0]['bsk:ItemList'][0]['cmn:Item'][i];

               var partNumber = stockItem.$.id;
               var availability = stockItem['cmn:Status'][0]._;

               avilabilityMap.push({partNumber: partNumber, availability: availability});
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(avilabilityMap);
         } catch(e) {
            // Make this never happen, Steven!
            console.log('something went wrong handling a response');
            res.setHeader('Content-Type', 'application/json');
            res.send([]);
         }
      })
   });
}

function makeXMLRequestBody(partNumbers, storeNumber, callback) {

   //Start of XML request
   var xmlRequest = '<?xml version="1.0" encoding="UTF-8"?><stk:Stock brand="argos" version="1"\
   xsi:schemaLocation="http://schemas.homeretailgroup.com/stock stock-v1.xsd"\
   xmlns:bsk="http://schemas.homeretailgroup.com/basket"\
   xmlns:cmn="http://schemas.homeretailgroup.com/common"\
   xmlns:loc="http://schemas.homeretailgroup.com/location"\
   xmlns:stk="http://schemas.homeretailgroup.com/stock"\
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\
   <stk:LocationList>';

   // Store to search
   xmlRequest += '<loc:Location uri="http://api.homeretailgroup.com/location/argos/store/'+storeNumber+'"/></stk:LocationList><bsk:Basket version="1"><bsk:ItemList>';

   // Loop and add items to request stock info for
   for(var i = 0; i < partNumbers.length; ++i) {
      xmlRequest += '<cmn:Item type="product" uri="http://api.homeretailgroup.com/product/argos/' + partNumbers[i] + '" id="' + partNumbers[i] + '"><cmn:Quantity type="requested">1</cmn:Quantity></cmn:Item>';
   }
   // End of XML request
   xmlRequest += '</bsk:ItemList></bsk:Basket></stk:Stock>';

   request({
      url: 'http://api.homeretailgroup.com/stock/argos?apiKey=uk4tbngzceyxpwwvfcbtkvkj',
      method: 'POST',
      body: xmlRequest
   }, function(error, response) {
      callback(response.body);
   });
}
