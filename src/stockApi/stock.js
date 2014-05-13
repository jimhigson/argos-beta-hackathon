var request = require('request'),
    handlebars = require('handlebars'),
    fs = require('fs'),
    parseStockApiResponse = require('./parseStockApiResponse.js'),
    requestXmlBodyTemplate = handlebars.compile( fs.readFileSync('src/stockApi/requestTemplate.handlebars', 'utf-8') );

module.exports = function getStockInfo(req, res) {

   var partNumbers = req.params.partNumbers.split(','),
       storeNumber = req.params.storeNumber;

   makeXMLRequestBody(partNumbers, storeNumber, function( xml ) {

      parseStockApiResponse(xml, function(err, stockJson) {

         res.setHeader('Content-Type', 'application/json');
         res.send(stockJson);
      });
   });

   function requestXmlBody(partNumbers, storeNumber) {
      return requestXmlBodyTemplate({
         storeNumber: storeNumber,
         partNumbers: partNumbers
      });
   }
   
   function makeXMLRequestBody(partNumbers, storeNumber, callback) {

      //Start of XML request
      request({
         url: 'https://api.homeretailgroup.com/stock/argos?apiKey=uk4tbngzceyxpwwvfcbtkvkj',
         method: 'POST',
         body: requestXmlBody(partNumbers, storeNumber)
      }, function(error, response) {
         callback(response.body);
      });
   }
};
