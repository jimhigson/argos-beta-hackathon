var PORT = 6677,
    //ELASTIC_SEARCH_HOST = 'http://beta.vichub.co.uk:9200/argos',
    ELASTIC_SEARCH_HOST = 'http://localhost:9200/argos',

    express = require('express'),
    request = require('request'),
    oboe = require('oboe'),
    consolidate = require('consolidate'),
    parseString = require('xml2js').parseString,
   
    parsePriceRange = require('./parsePriceRange.js'),
    elasticSearchRequestBody = require('./elasticSearchRequestBody.js'),
    likelySameNoun = require('./likelySameNoun.js'),
   
    cmdLineParams = require('minimist')(process.argv.slice(2)),
    isProd = (cmdLineParams.env == 'prod'),

    SCRIPTS = isProd? ['/js-concat/all.js'] : require('./jsSourcesList.js'),
    STYLESHEETS = isProd? ["/css-min/all.css"] : ["/css/reset.css", "/css/style.css"],

    app = express();

require('colors');

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
      sendResultsJsonToClient(req, res, term, category);
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

function sendResultsJsonToClient(req, res, query, category) {

   var queryTerms = parsePriceRange(query),
       requestBody = elasticSearchRequestBody(
                         queryTerms.term,
                         queryTerms.minPrice,
                         queryTerms.maxPrice,
                         category );
   
   res.setHeader('Content-Type', 'application/json');

   var searchResults = [],
       relatedTerms = [];
  
   oboe({
      url: ELASTIC_SEARCH_HOST + '/products/_search',
      method:'POST',
      body: JSON.stringify(requestBody)

   }).node('!error', function(error) {
      res.send('400', error);
      
   }).node('!hits..{price productTitle}', function( result ) {

      searchResults.push( prepareSearchResultForFrontEnd( result ) );

   }).node('!aggregations..{key score}', function( aggregationResult, path ) {
      
      relatedTerms.push({
         key:aggregationResult.key,
         score: aggregationResult.score,
         source:path[1]
      });
      
   }).done(function() {
      
      var responseObject = {
         results : searchResults,
         relatedTerms: postProcessRelatedTerms(queryTerms.term, relatedTerms)
      };
      
      res.send(200, responseObject);
   }).fail(function(e) {
      res.send(400, 'there was a failure');
      console.log('there was a failure'.red);
   });
}

function postProcessRelatedTerms( query, terms ) {
   
   var differentFromQuery = terms.filter(function(term) {
      return !likelySameNoun(query, term.key);
   });
   
   var unduplicated = [];

   differentFromQuery.forEach(function(term) {
      var isDuplicate = unduplicated
                           .some(   function( existingTerm ){
                                       return likelySameNoun(existingTerm.key, term.key);
                                    });
      
      if(!isDuplicate) {
         unduplicated.push(term);
      }
   });
   
   var sorted = unduplicated.sort(function(a,b){
      return b.score - a.score;
   }); 
   
   return sorted;
}

function highlightedProductTitle(elasticSearchHit) {
   return (elasticSearchHit.highlight && elasticSearchHit.highlight.productTitle) || elasticSearchHit.productTitle
}

function prepareSearchResultForFrontEnd( elasticSearchHit ) {
   

   elasticSearchHit.highlightedProductTitle = highlightedProductTitle( elasticSearchHit );
   elasticSearchHit.formattedPrice = '£' + Number(elasticSearchHit.price).toFixed(2);
   
   return elasticSearchHit;
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
