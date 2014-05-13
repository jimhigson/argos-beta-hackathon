describe('parsing stock api responses', function() {
   
   var parseStockApiResponse = require('../../../parseStockApiResponse.js');

   var returnedError,
       returnedJson;

   function somethingToHaveBeenGivenToTheCallback() {
      return returnedJson || returnedError;
   }
   
   beforeEach(function() {
      returnedError = undefined;
      returnedJson = undefined;
   });   
   
   describe('error cases', function() {

      it('handles invalid xml', function() {

         var invalidXml = 'w>hat a lovel=y day!';

         parseStockApiResponse( invalidXml, function(err, json) {
            returnedError = err;
            returnedJson = json;
         });

         waitsFor(somethingToHaveBeenGivenToTheCallback, 'the json version of the XML to be available');

         runs(function() {
            expect(returnedError).toBeDefined();
            expect(returnedJson).toBeUndefined();
         });
      });

      it('handles xml that is valid but not as expected', function() {

         var invalidXml = '<?xml version="1.0" encoding="UTF-8"?>' +
                          '<shop><street><house></house></street></shop>';

         parseStockApiResponse( invalidXml, function(err, json) {
            returnedError = err;
            returnedJson = json;
         });

         waitsFor(somethingToHaveBeenGivenToTheCallback, 'the json version of the XML to be available');

         runs(function() {
            expect(returnedError).toBeDefined();
            expect(returnedJson).toBeUndefined();
         });
      });      
   });
   
   
   it('can parse an available item', function() {
      
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
         '         </bsk:ItemList>' +
         '      </bsk:Basket>' +
         '   </stk:Availability>' +
         '</stk:AvailabilityList>' +
         '</stk:Stock>';
            
      parseStockApiResponse( sampleXml, function(err, json) {
         returnedJson = json;
      });

      waitsFor(somethingToHaveBeenGivenToTheCallback, 'the json version of the XML to be available');

      runs(function() {
         expect(returnedError).toBeUndefined();
         expect(returnedJson).toEqual([
            {'partNumber':'123',
             'availability':'available'}
         ]);
      });
   });

   it('can parse an out-of-stock item', function() {

      var sampleXml =
         '<?xml version="1.0" encoding="UTF-8"?>' +
         '<stk:Stock xmlns:stk="http://schemas.homeretailgroup.com/stock" xmlns:bsk="http://schemas.homeretailgroup.com/basket" xmlns:loc="http://schemas.homeretailgroup.com/location" xmlns:cmn="http://schemas.homeretailgroup.com/common" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://schemas.homeretailgroup.com/stock stock-v1.xsd" uri="http://api.homeretailgroup.com/stock/argos" version="1" brand="argos">' +
         '<stk:AvailabilityList>' +
         '   <stk:Availability>' +
         '      <bsk:Basket>' +
         '         <bsk:ItemList>' +
         '            <cmn:Item uri="http://api.homeretailgroup.com/product/argos/123" id="123" brand="argos" type="product" isReservable="true" isOrderable="true">' +
         '               <cmn:Quantity type="requested">1</cmn:Quantity>' +
         '               <cmn:Quantity type="available">0</cmn:Quantity>' +
         '               <cmn:Status timestamp="2014-05-12T14:04:35.430Z">out-of-stock</cmn:Status>' +
         '               <cmn:EarliestCollectionDate>2014-05-15T00:00:00.0Z</cmn:EarliestCollectionDate>' +
         '               <cmn:LatestCollectionDate>2014-05-17T00:00:00.0Z</cmn:LatestCollectionDate>' +
         '            </cmn:Item>' +
         '         </bsk:ItemList>' +
         '      </bsk:Basket>' +
         '   </stk:Availability>' +
         '</stk:AvailabilityList>' +
         '</stk:Stock>';

      parseStockApiResponse( sampleXml, function(err, json) {
         returnedJson = json;
      });

      waitsFor(somethingToHaveBeenGivenToTheCallback, 'the json version of the XML to be available');

      runs(function() {
         expect(returnedError).toBeUndefined();
         expect(returnedJson).toEqual([
            {'partNumber':'123',
               'availability':'out-of-stock'}
         ]);
      });
   });

   it('can parse one out-of-stock item and one available item', function() {

      var sampleXml =
         '<?xml version="1.0" encoding="UTF-8"?>' +
         '<stk:Stock xmlns:stk="http://schemas.homeretailgroup.com/stock" xmlns:bsk="http://schemas.homeretailgroup.com/basket" xmlns:loc="http://schemas.homeretailgroup.com/location" xmlns:cmn="http://schemas.homeretailgroup.com/common" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://schemas.homeretailgroup.com/stock stock-v1.xsd" uri="http://api.homeretailgroup.com/stock/argos" version="1" brand="argos">' +
         '<stk:AvailabilityList>' +
         '   <stk:Availability>' +
         '      <bsk:Basket>' +
         '         <bsk:ItemList>' +
         '           <cmn:Item uri="http://api.homeretailgroup.com/product/argos/123" id="123" brand="argos" type="product" isReservable="true" isOrderable="true">' +
         '               <cmn:Quantity type="requested">1</cmn:Quantity>' +
         '               <cmn:Quantity type="available">1</cmn:Quantity>' +
         '               <cmn:Status timestamp="2014-05-12T14:04:35.430Z">available</cmn:Status>' +
         '               <cmn:EarliestCollectionDate>2014-05-15T00:00:00.0Z</cmn:EarliestCollectionDate>' +
         '               <cmn:LatestCollectionDate>2014-05-17T00:00:00.0Z</cmn:LatestCollectionDate>' +
         '            </cmn:Item>' +
         '            <cmn:Item uri="http://api.homeretailgroup.com/product/argos/123" id="456" brand="argos" type="product" isReservable="true" isOrderable="true">' +
         '               <cmn:Quantity type="requested">1</cmn:Quantity>' +
         '               <cmn:Quantity type="available">0</cmn:Quantity>' +
         '               <cmn:Status timestamp="2014-05-12T14:04:35.430Z">out-of-stock</cmn:Status>' +
         '               <cmn:EarliestCollectionDate>2014-05-15T00:00:00.0Z</cmn:EarliestCollectionDate>' +
         '               <cmn:LatestCollectionDate>2014-05-17T00:00:00.0Z</cmn:LatestCollectionDate>' +
         '            </cmn:Item>' +
         '         </bsk:ItemList>' +
         '      </bsk:Basket>' +
         '   </stk:Availability>' +
         '</stk:AvailabilityList>' +
         '</stk:Stock>';

      parseStockApiResponse( sampleXml, function(err, json) {
         returnedJson = json;
      });

      waitsFor(somethingToHaveBeenGivenToTheCallback, 'the json version of the XML to be available');

      runs(function() {
         expect(returnedError).toBeUndefined();
         expect(returnedJson).toEqual([
            {'partNumber':'123',
               'availability':'available'},
            {'partNumber':'456',
               'availability':'out-of-stock'}
         ]);
      });
   });
   
   
   
});
