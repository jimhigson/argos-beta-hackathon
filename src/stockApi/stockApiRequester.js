var parseStockApiResponse = require('./parseStockApiResponse.js'),
    handlebars = require('handlebars'),
    request = require('request'),
    fs = require('fs'),
    API_KEY = 'uk4tbngzceyxpwwvfcbtkvkj',
    API_ROOT = 'https://api.homeretailgroup.com/',       

    requestXmlBodyTemplate = handlebars.compile( fs.readFileSync('src/stockApi/requestTemplate.handlebars', 'utf-8'));

function handleError( err, partNumbersBatch, storeNumber, callback ) {

   console.error('error getting stock status for products with numbers', partNumbersBatch, 'at store number', storeNumber, err);

   var stockUnknownJson = partNumbersBatch.map(function(partNumber) {
      return { partNumber: partNumber,
         availability: 'unknown'
      };
   });

   callback(undefined, stockUnknownJson);
}
       
function requestXmlBody(partNumbers, storeNumber) {
   return requestXmlBodyTemplate({
      storeNumber: storeNumber,
      partNumbers: partNumbers
   });
}

module.exports = function stockApiRequester( partNumbers, storeNumber, callback ) {

   request({

      url: API_ROOT + 'stock/argos?apiKey=' + API_KEY,
      method: 'POST',
      body: requestXmlBody(partNumbers, storeNumber)

   }, function (httpErr, response) {

      if (!httpErr) {

         var xml = response.body;

         parseStockApiResponse(xml, function (parseErr, json) {

            if (!parseErr) {
               callback(json);
            } else {
               handleError(parseErr, partNumbers, storeNumber, callback);
            }
         });
      } else {

         handleError(httpErr, partNumbers, storeNumber, callback);
      }
   });
}
