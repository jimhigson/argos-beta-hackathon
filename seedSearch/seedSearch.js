#! /usr/local/bin/node

var MAX_SIMULTANEOUS_PAGE_REQUESTS = 50;
var MAX_REQUEST_FREQUENCY_MS = 50;
var ELASTIC_SEARCH_URL = 'http://localhost:9200';
var LIVE_SITE_TIMEOUT = 4000; // 4 seconds before we give up

var request = require('request');
var scraper = require('./scraper.js');
var fs = require('fs');
require('http').globalAgent.maxSockets = MAX_SIMULTANEOUS_PAGE_REQUESTS;
require('colors');

var argv = require('minimist')(process.argv.slice(2));

var gaveRange = (argv.startIndex !== undefined && argv.endIndex !== undefined);

if(!argv.all && !argv.setup && !gaveRange && !argv.indexStores) {
   console.log('not enough parameters. Call like:\n' +
      '\tseedSearch.js --indexStores \n' +
      '\tseedSearch.js --setup \n' +
      '\tseedSearch.js --startIndex 0 --endIndex 50 \n' +
      '\tseedSearch.js --all \n ');
   process.exit(1);
}

if( argv.indexStores ) {

   var stores = JSON.parse(fs.readFileSync('stores.json'));
   
   stores.forEach(function(store) {

      var url = ELASTIC_SEARCH_URL + '/argos/stores/' + store.id;
      
      request({
         url: url,
         method: 'PUT',
         body: JSON.stringify(store)
      }, function(err, responseJson) {
         if( err ) {
            console.log(String(err).red);
         } else {
            console.log('put store', store.name.blue);
         }
      });
   });
   
   return;
}

if( argv.setup ) {
   console.log('setting up mappings etc');

   var config = require('./settings.js');
   
   request({
      url:     ELASTIC_SEARCH_URL + '/argos/',
      method:  'PUT',
      body:    JSON.stringify(config)
   }, function(err, responseJson) {
      if( err ) {
         console.log(String(err).red);
      } else {
         console.log('done ok'.green);
         console.log(responseJson.body);
      }
   });
   
   return;
}

function loadAllProductIds( callback ) {
      
   fs.readFile('numbers.json', function( err, fileContents ) {
      
      callback( err, JSON.parse(fileContents) );
   });
}

function loadProductIdsInRange( start, end, callback ) {
   
   loadAllProductIds( function( err, fullList ) {
      
      callback(err, fullList.slice(start, end));
      
   });
}

function requestWasSuccessful(res) {
   var firstChar = String(res.statusCode)[0];
   return firstChar == '2';
}

function fetchAndScrapeProduct( productId, callback ) {

   var url = 'http://www.argos.co.uk/static/Product/partNumber/' + productId + '.htm';
   
   request(
      {  method:  'GET',
         url:     url,
         timeout: LIVE_SITE_TIMEOUT
      },
      function (error, res, body) {
            
         if (!error && requestWasSuccessful(res)) {
   
            try {
               var productInfo = scraper(productId, body);
               
               productInfo.legacyUrl = url;
               
               callback(undefined, productInfo);
            } catch(e) {
               failedToScrape(e);
            }
         } else {
            failedToScrape(error);
         }
      }
   );
   
   function failedToScrape(error){
      var errorMsg = 'could not process ' + url + ':' + error;
      callback(errorMsg);      
   }
}

function startRequesting( err, productsIdsToRequest ) {

   var numberOfRequests = productsIdsToRequest.length;
   var itemsSoFar = 0;
   var failedProducts = [];
   var numberOfPendingRequests = 0;

   var interval = setInterval(requestNextIfMoreAreNeeded, MAX_REQUEST_FREQUENCY_MS);

   function requestNextIfMoreAreNeeded() {

      var unrequestedProducts = (productsIdsToRequest.length != 0),
         hasRequestSlots = numberOfPendingRequests < MAX_SIMULTANEOUS_PAGE_REQUESTS;

      if (!unrequestedProducts) {

         clearInterval(interval);
         console.log('All products have been requested.');

      } else {

         if (hasRequestSlots) {
            spiderNextProduct();
         }
      }
   }

   function elasticSearchProductUrl(productId) {
      return ELASTIC_SEARCH_URL + '/argos/products/' + productId;
   }

   function handleElasticSearchPutResponse(error, res, body) {

      var url = res.request.uri.href;

      numberOfPendingRequests--;

      if (error || !requestWasSuccessful(res)) {
         var productJson = res.request.body.toString(),
            errorMsg = 'Could not PUT into index ' + url + ':' + error;

         console.log('ERROR'.red, errorMsg, '\n', productJson, '\n', res.statusCode, body);
         return;
      }

      itemsSoFar++;
      var percent = Math.round( 100 * itemsSoFar/numberOfRequests );
      console.log(String(itemsSoFar).blue, '(' + String(percent).green + '%) PUT item', String(url));

      if( numberOfPendingRequests == 0 && productsIdsToRequest.length == 0 ) {
         console.log('All products PUT to ElasticSearch');
         if( failedProducts.length ) {
            console.log('there were some failures:'.red, failedProducts);
         }
         process.exit(0);
      }

   }

   function spiderNextProduct() {
      var productId = productsIdsToRequest.pop();

      numberOfPendingRequests++;

      fetchAndScrapeProduct(productId, function(err, productJson) {

         if( err ) {
            numberOfPendingRequests--;
            console.log('ERROR'.red, 'could not get data from product', productId, err);
            failedProducts.push(productId);
            return;
         }

         var url = elasticSearchProductUrl(productId);

         request({
            url: url,
            method:'PUT',
            body: JSON.stringify( productJson )
         }, handleElasticSearchPutResponse);
      });
   }
   
}

if( gaveRange ) {
   loadProductIdsInRange(argv.startIndex, argv.endIndex, startRequesting)
} else {
   loadAllProductIds(startRequesting);
}

