#! /usr/local/bin/node

var request = require('request');
var cheerio = require('cheerio');
require('colors');

function loadProductIds( start, end ) {
   
   var fs = require('fs');
   var allIds = JSON.parse(fs.readFileSync('numbers.json'));

   start = start || 0;
   end = end || allIds.length;
   
   return allIds.slice(start, end);
}

function scrapeProductPrice($) {
   
   var priceMatch = $('span.price').first().text().trim().match(/[\d.]+/);
   
   return priceMatch ? Number(priceMatch[0]) : 0; // the regex doesn't match on some pages
}

function scrapeProductPage(productId, $) {
   return {
      productId: productId,
      productTitle: $('#pdpProduct h1.fn').text().trim(),
      price: scrapeProductPrice($),
      summary: $('.fullDetails').html(),
      summaryText: $('.fullDetails').text(),
      imgUrl: $('#mainimage').attr('src')
   };
}

function fetchAndScrapeProduct( productId, callback ) {

   var url = 'http://www.argos.co.uk/static/Product/partNumber/' + productId + '.htm';
   
   request(url, function (error, response, body) {
      
      if (!error && response.statusCode == 200) {
         var $ = cheerio.load(body);

         try {
            callback(undefined, scrapeProductPage(productId, $));
         } catch(e) {
            callback(e);
         }
      } else {
         var errorMsg = 'could not fetch ' + url + ':' + error; 
         callback(errorMsg);
      }
   })
}

var productIds = loadProductIds(0, 50);

require('http').globalAgent.maxSockets = 50;

var itemsSoFar = 0;

productIds.forEach(function(productId){
   fetchAndScrapeProduct(productId, function(err, productJson) {

      if( err ) {
         console.log('error fetching product'.red, err);
      }
      
      var url = 'http://localhost:9200/argos/products/' + productId;
      
      request({
         url: url,
         method:'PUT',
         body: JSON.stringify( productJson )
      }, function(error, res, body) {
         
         var statusFirstChar = String(res.statusCode)[0];
         
         if (error || statusFirstChar != '2') {
            var errorMsg = 'could not PUT into index ' + url + ':' + error;
            console.log(errorMsg.red, '\n', productJson, '\n', res.statusCode, body);
         } else {
            
            itemsSoFar++;
            
            var percent = Math.round( 100 * itemsSoFar/productIds.length );
            console.log(String(itemsSoFar).blue, '(' + String(percent).green + '%) put item', url.blue);
         }
      });


      

   });
});
