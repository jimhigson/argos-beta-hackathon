var request = require('request'),
    parseXmlStringToJs = require('xml2js').parseString;

module.exports = function getStockInfo(req, res) {

   var partNumbers = req.params.partNumbers.split(','),
       storeNumber = req.params.storeNumber,
       avilabilityMap = [];

   var reponseXML = makeXMLRequestBody(partNumbers, storeNumber, function(xml) {

      parseXmlStringToJs(xml, function(err, result) {

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
};
