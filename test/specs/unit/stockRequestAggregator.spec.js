describe('providing a facility to check stock', function() {



   
   it( 'gives a single callback after making multiple requests', function() {

      stockApiRequestAggregator.setBatchSize(4);

      // for this test we don't care about the actual results contents - always give the same
      whenRequestingProducts(sinon.match.any).theServiceReturns([{partNumber:1, availability:'available'}]);

      stockApiRequestAggregator.request([1,2,3,4,5,6,7,8,9,10,11,12], aStoreNumber, resultsCallback);

      waitsFor(function(){ return resultsCallback.called; }, 'the callback to have been called');

      runs(function() {
         expect( resultsCallback.callCount ).toBe(1);
      });
   });   
   

   it( 'can aggregate into really small batches and combine the results', function() {
      
      stockApiRequestAggregator.setBatchSize(2);

      whenRequestingProducts([1,2]).theServiceReturns([{partNumber:1, availability:'available'}, {partNumber:2, availability:'out-of-stock'}]);
      whenRequestingProducts([3])  .theServiceReturns([{partNumber:3, availability:'available'}]);

      stockApiRequestAggregator.request([1,2,3], aStoreNumber, resultsCallback);
      
      waitsFor(function(){ return resultsCallback.called; }, 'the callback to have been called');
      
      runs(function() {
         expect(resultsCallback.firstCall.args[0]).toEqual([
            {partNumber:1, availability:'available'},
            {partNumber:2, availability:'out-of-stock'},
            {partNumber:3, availability:'available'}
         ]);
      });
   });

   // --------------- end of tests -----------------

   var proxyquire = require('proxyquire'),
      sinon = require('sinon'),
      aStoreNumber = 123;

   var stockApiRequestorStub,
      resultsCallback,
      stockApiRequestAggregator;

   beforeEach(function() {
      stockApiRequestorStub = sinon.stub();
      resultsCallback = sinon.stub();

      stockApiRequestAggregator = proxyquire(  '../../../src/stockApi/stockApiRequestAggregator',
         {'./stockApiRequester.js': stockApiRequestorStub}
      );
   });   
   
   
   function whenRequestingProducts( productNumbers ) {
      return {
         'theServiceReturns':function( result ) {
            stockApiRequestorStub.withArgs(productNumbers, aStoreNumber).callsArgWithAsync(2, result);
         }
      }
   }
   
});
