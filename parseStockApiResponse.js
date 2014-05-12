var xml2js = require('xml2js');

var XML_2_JS_OPTIONS = {

   tagNameProcessors: [xml2js.processors.stripPrefix],
   attrNameProcessors: [xml2js.processors.stripPrefix]
};

module.exports = function(xml, callback) {

   var availabilityMap = [];
   
   xml2js.parseString(xml, XML_2_JS_OPTIONS, function(err, result) {

      try {

         var items = result.Stock.AvailabilityList[0].Availability[0].Basket[0].ItemList[0].Item;

         items.forEach(function(stockItem) {

            var partNumber = stockItem.$.id;
            var availability = stockItem.Status[0]._;

            availabilityMap.push({partNumber: partNumber, availability: availability});
         });

         callback(undefined, availabilityMap);
      } catch(e) {
         // Make this never happen, Steven!

         callback(e);
      }
   })
};
