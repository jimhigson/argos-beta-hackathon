var request = require('request'),
    handlebars = require('handlebars'),
    fs = require('fs'),
    parseStockApiResponse = require('./parseStockApiResponse.js'),
    requestXmlBodyTemplate = handlebars.compile( fs.readFileSync('src/stockApi/requestTemplate.handlebars', 'utf-8')),
    API_KEY = 'uk4tbngzceyxpwwvfcbtkvkj',
    API_ROOT = 'https://api.homeretailgroup.com/',
    batchArray = require('../util.js').batchArray,
    barrier = require('../barrier.js'),
    BATCH_SIZE = 10;

function requestXmlBody(partNumbers, storeNumber) {
   return requestXmlBodyTemplate({
      storeNumber: storeNumber,
      partNumbers: partNumbers
   });
}

function handleError( err, partNumbersBatch, storeNumber, callback ) {

   console.error('error getting stock status for products with numbers', partNumbersBatch, 'at store number', storeNumber, err);

   var stockUnknownJson = partNumbersBatch.map(function(partNumber) {
      return { partNumber: partNumber,
         availability: 'unknown'
      };
   });

   callback(undefined, stockUnknownJson);
}

function makeBatchRequest( partNumbersBatch, storeNumber, callback ) {

   request({

      url: API_ROOT + 'stock/argos?apiKey=' + API_KEY,
      method: 'POST',
      body: requestXmlBody(partNumbersBatch, storeNumber)

   }, function (httpErr, response) {

      if (!httpErr) {

         var xml = response.body;

         parseStockApiResponse(xml, function (parseErr, json) {

            if (!parseErr) {
               callback(json);
            } else {
               handleError(parseErr, partNumbersBatch, storeNumber, callback);
            }
         });
      } else {

         handleError(httpErr, partNumbersBatch, storeNumber, callback);
      }
   });
}

module.exports = function getStockInfoMiddleware(req, res) {

   var partNumbers = req.query.partNumbers.split(','),
       storeNumber = req.query.storeNumber,
       batches = batchArray(partNumbers, BATCH_SIZE);

   res.setHeader('Content-Type', 'application/json');

   var data = [];
   
   var bar = barrier(function() {
      res.send(data);
   });
   
   batches.forEach(function(batch) {
      
      console.log('requesting', JSON.stringify(batch));
      
      makeBatchRequest(batch, storeNumber, bar.add(function(stockJson) {
         
         // once here, there will be no errors - if an error occurred the stockJson
         // will contain 'unknown' for the product. Hence, this function takes
         // no err parameter
         data = data.concat(stockJson);
      }));
   });

};
