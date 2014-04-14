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

function scrapeProductPage( productId, callback ) {

   var url = 'http://www.argos.co.uk/static/Product/partNumber/' + productId + '.htm';
   
   request(url, function (error, response, body) {
      
      if (!error && response.statusCode == 200) {
         var $ = cheerio.load(body);
         
         var priceMatch = $('span.price').first().text().trim().match(/[\d.]+/);
         var price = priceMatch ? priceMatch[0] : 0; // regex doesn't match on some pages  
         
         callback({
            productId: productId,
            productTitle:$('#pdpProduct h1.fn').text().trim(),
            price: price,
            summary: $('.fullDetails').html(),
            summaryText: $('.fullDetails').text(),
            imgUrl: $('#mainimage').attr('src')
         })
      } else {
         console.log('oh dear, something terrible'.red);
      }
   })
}

var productIds = loadProductIds();

require('http').globalAgent.maxSockets = 50;

var itemsSoFar = 0;

productIds.forEach(function(productId){
   scrapeProductPage(productId, function(productJson) {

      var url = 'http://localhost:9200/argos/products/' + productId;
      
      request({
         url: url,
         method:'PUT',
         body: JSON.stringify( productJson )
      });

      itemsSoFar++;
      var percent = Math.round( 100 * itemsSoFar/productIds.length );
      
      console.log(String(itemsSoFar).blue, '(' + String(percent).green + '%) put item', url.blue);
   });
});
