#! /usr/local/bin/node

var request = require('request');
var cheerio = require('cheerio');

var productIds = [
   1021569,
   1026179,
   8505590,
   5598263
];

function loadProductIds( limit ) {
   var fs = require('fs');
   var allIds = JSON.parse(fs.readFileSync('numbers.json'));
   
   return limit? allIds.slice(0, limit) : allIds;
}

function scrapeProductPage( productId, callback ) {

   var url = 'http://www.argos.co.uk/static/Product/partNumber/' + productId + '.htm';
   
   request(url, function (error, response, body) {
      
      if (!error && response.statusCode == 200) {
         var $ = cheerio.load(body);
         
         callback({
            productId: productId,
            productTitle:$('#pdpProduct h1.fn').text().trim(),
            price: $('span.price').first().text().trim(),
            summary: $('.fullDetails').html(),
            summaryText: $('.fullDetails').text(),
            imgUrl: $('#mainimage').attr('src')
         })
      } else {
         console.log('oh dear, something terrible');
      }
   })
}

var productIds = loadProductIds( 50 );

productIds.forEach(function(productId){
   scrapeProductPage(productId, function(productJson) {

      var url = 'http://localhost:9200/argos/products/' + productId;
      
      request({
         url: url,
         method:'PUT',
         body: JSON.stringify( productJson )
      });
      
      console.log('put item', url);
   });
});
