describe('parsing stock api responses', function() {
   
   var parseStockApiResponse = require('../../../parseStockApiResponse.js');
   
   it('does something', function() {
      
      var sampleXml = 
         '<?xml version="1.0" encoding="UTF-8"?>' +
         '<stk:Stock xmlns:stk="http://schemas.homeretailgroup.com/stock" xmlns:bsk="http://schemas.homeretailgroup.com/basket" xmlns:loc="http://schemas.homeretailgroup.com/location" xmlns:cmn="http://schemas.homeretailgroup.com/common" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://schemas.homeretailgroup.com/stock stock-v1.xsd" uri="http://api.homeretailgroup.com/stock/argos" version="1" brand="argos">' +
         '<stk:AvailabilityList>' +
         '   <stk:Availability>' +
         '      <bsk:Basket>' +
         '         <bsk:ItemList>' +
         '            <cmn:Item uri="http://api.homeretailgroup.com/product/argos/123" id="123" brand="argos" type="product" isReservable="true" isOrderable="true">' +
         '               <cmn:Quantity type="requested">1</cmn:Quantity>' +
         '               <cmn:Quantity type="available">1</cmn:Quantity>' +
         '               <cmn:Status timestamp="2014-05-12T14:04:35.430Z">available</cmn:Status>' +
         '               <cmn:EarliestCollectionDate>2014-05-15T00:00:00.0Z</cmn:EarliestCollectionDate>' +
         '               <cmn:LatestCollectionDate>2014-05-17T00:00:00.0Z</cmn:LatestCollectionDate>' +
         '            </cmn:Item>' +
         '            <cmn:Item uri="http://api.homeretailgroup.com/product/argos/456" id="456" brand="argos" type="product" isReservable="true" isOrderable="true">' +
         '               <cmn:Quantity type="requested">1</cmn:Quantity>' +
         '               <cmn:Quantity type="available">1</cmn:Quantity>' +
         '               <cmn:Status timestamp="2014-05-12T14:04:35.430Z">available</cmn:Status>' +
         '               <cmn:EarliestCollectionDate>2014-05-15T00:00:00.0Z</cmn:EarliestCollectionDate>' +
         '               <cmn:LatestCollectionDate>2014-05-17T00:00:00.0Z</cmn:LatestCollectionDate>' +
         '            </cmn:Item>' +
         '         </bsk:ItemList>' +
         '      </bsk:Basket>' +
         '   </stk:Availability>' +
         '</stk:AvailabilityList>' +
         '</stk:Stock>';
      
      var returnedJson;
      
      parseStockApiResponse( sampleXml, function(err, json) {
         returnedJson = json;
      });

      waitsFor(function() {
         return !!returnedJson;
      }, 'the json version of the XML to be available');

      runs(function() {
         expect(returnedJson).toEqual([
            {'partNumber':'123',
             'availability':'available'},
            {'partNumber':'456',
               'availability':'available'}
         ]);
      });
   });
   
});
