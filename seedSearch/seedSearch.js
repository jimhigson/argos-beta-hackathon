#! /usr/local/bin/node

var MAX_SIMULTANEOUS_PAGE_REQUESTS = 50;
var MAX_REQUEST_FREQUENCY_MS = 50;
var ELASTIC_SEARCH_URL = 'http://localhost:9200';

var request = require('request');
var cheerio = require('cheerio');
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

   request({
      url:     ELASTIC_SEARCH_URL + '/argos/',
      method:  'PUT',
      body:    fs.readFileSync('settings.json')
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

function loadAllProductIds() {
   
   var fs = require('fs');
   return JSON.parse(fs.readFileSync('numbers.json'));
}

function loadProductIdsInRange( start, end ) {
   
   return loadAllProductIds().slice(start, end);
}

function scrapeProductPrice($) {
   
   var priceMatch = $('span.price').first().text().trim().match(/[\d.]+/);
   
   return priceMatch ? Number(priceMatch[0]) : 0; // the regex doesn't match on some pages
}

function stripTrailingDot(str){
   return str.replace(/.$/, '');
}

function scrapeProductname($){
   var productName = $('#pdpProduct h1.fn').text().trim();
   
   return stripTrailingDot(productName);
}

function scrapeProductPage(productId, $) {

   var metaData = $('meta[name=keywords]').attr('content'),
       category = metaData && metaData.split(',')[0].trim();
   
   return {
      productId:                 productId,
      productTitle:              scrapeProductname($),
      price:                     scrapeProductPrice($),
      summary:                   $('.fullDetails').html(),
      summaryText:               $('.fullDetails').text(),
      summaryFirstParagraph:     $('.fullDetails p').text(),
      imgUrl:                    $('#mainimage').attr('src'),
      category:                  category
   };
}

function fetchAndScrapeProduct( productId, callback ) {

   var url = 'http://www.argos.co.uk/static/Product/partNumber/' + productId + '.htm';
   
   request(url, function (error, res, body) {
      
      if (!error && requestSuccessful(res)) {
         var $ = cheerio.load(body);

         try {
            var productInfo = scrapeProductPage(productId, $);
            
            productInfo.legacyUrl = url;
            
            callback(undefined, productInfo);
         } catch(e) {
            callback(e);
         }
      } else {
         var errorMsg = 'could not fetch ' + url + ':' + error; 
         callback(errorMsg);
      }
   })
}


var productsIdsToRequest = gaveRange? loadProductIdsInRange(argv.startIndex, argv.endIndex) : loadAllProductIds();
var numberOfRequests = productsIdsToRequest.length; 
var itemsSoFar = 0;

var pendingRequests = 0;

var interval = setInterval(function() {
   
   var unrequestedProducts = (productsIdsToRequest.length != 0),
       hasRequestSlots = pendingRequests < MAX_SIMULTANEOUS_PAGE_REQUESTS;
   
   if( !unrequestedProducts ) {
      
      clearInterval(interval);
      console.log('All products have been requested.');
      
   } else {

      if( hasRequestSlots ) {
         spiderNextProduct();
      }
   }
}, MAX_REQUEST_FREQUENCY_MS);

function elasticSearchProductUrl(productId) {
   return ELASTIC_SEARCH_URL + '/argos/products/' + productId;
}

function requestSuccessful(res) {
   var firstChar = String(res.statusCode)[0];
   return firstChar == '2';
}

function handleElasticSearchPutResponse(error, res, body) {
   
   var url = res.request.uri.href;
   
   pendingRequests--;
   
   if (error || !requestSuccessful(res)) {
      var productJson = res.request.body.toString(),
          errorMsg = 'Could not PUT into index ' + url + ':' + error;
      
      console.log('ERROR'.red, errorMsg, '\n', productJson, '\n', res.statusCode, body);
      return;
   }

   itemsSoFar++;
   var percent = Math.round( 100 * itemsSoFar/numberOfRequests );
   console.log(String(itemsSoFar).blue, '(' + String(percent).green + '%) PUT item', String(url));

   if( pendingRequests == 0 && productsIdsToRequest.length == 0 ) {
      console.log('All products PUT to ElasticSearch');
      process.exit(0);
   }
   
}

function spiderNextProduct() {
   var productId = productsIdsToRequest.pop();
   pendingRequests++;

   fetchAndScrapeProduct(productId, function(err, productJson) {
      
      console.log(productJson);

      if( err ) {
         console.log('ERROR'.red, 'could not fetch product', productId, err);
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
