var request = require('request'),
    xml2js = require('xml2js');

var XML_2_JS_OPTIONS = {

   tagNameProcessors: [xml2js.processors.stripPrefix],
   attrNameProcessors: [xml2js.processors.stripPrefix]
};

module.exports = function getStockInfo(req, res) {

   var partNumbers = req.params.partNumbers.split(','),
       storeNumber = req.params.storeNumber,
       avilabilityMap = [];

   makeXMLRequestBody(partNumbers, storeNumber, function(xml) {

      console.log(xml);
      
      xml2js.parseString(xml, XML_2_JS_OPTIONS, function(err, result) {
         
         try {
            
            var items = result.Stock.AvailabilityList[0].Availability[0].Basket[0].ItemList[0].Item;
            
            for (var i = 0; i < items.length; i++) {
               var stockItem = items[i];

               var partNumber = stockItem.$.id;
               var availability = stockItem.Status[0]._;

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
