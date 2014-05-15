describe('requesting from the stock API', function() {

   it('makes request to correct URI when on the happy path', function() {
      /*
      var stockApiRequester = proxyquire( '../../../src/stockApi/stockApiRequester.js', {
         'request':                    requestStub,
         './parseStockApiResponse.js': parseResponseStub
      });

      stockApiRequester( [1,2,3], aStoreNumber, callbackStub );

      expect(requestStub.firstCall.args[0].url).toBe('https://api.homeretailgroup.com/stock/argos?apiKey=uk4tbngzceyxpwwvfcbtkvkj');      
      */
   });
   
   it('fills in with unknown when there is a http error', function() {
      /*
      var stockApiRequester = proxyquire( '../../../src/stockApi/stockApiRequester.js', {
         'request':                    requestStub,
         './parseStockApiResponse.js': parseResponseStub
      });

      stockApiRequester( [1,2,3], aStoreNumber, callbackStub );

      waitsFor(function(){ return resultsCallback.called; }, 'the callback to have been called');

      runs(function() {
      })
      */
   });

   it('fills in with unknown when there is a parse error', function() {
   });

   // --------------- end of tests -----------------

   var proxyquire = require('proxyquire'),
       sinon = require('sinon'),
       aStoreNumber = 3,

       requestStub, 
       parseResponseStub,
       callbackStub;
});