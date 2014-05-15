describe('requesting from the stock API', function() {

   it('makes request to correct URI when on the happy path', function() {

      stockApiRequester( [1,2,3], aStoreNumber, parseResponseStub );

      waitsFor(function(){ return requestStub.called; }, 'the callback to have been called');

      expect(requestStub.firstCall.args[0].url).toBe('https://api.homeretailgroup.com/stock/argos?apiKey=uk4tbngzceyxpwwvfcbtkvkj');      
      
   });
   
   it('fills in with unknown when there is a http error', function() {

      stockApiRequester( ['12345','abcdef','xyz'], aStoreNumber, parseResponseStub );

      waitsFor(function(){ return parseResponseStub.called; }, 'the callback to have been called');

      runs(function() {
        console.log('in runs');
        // expect(callbackStub.)
      })
      
   });

   it('fills in with unknown when there is a parse error', function() {
   });

   // --------------- end of tests -----------------

   var proxyquire = require('proxyquire'),
       sinon = require('sinon'),
       aStoreNumber = 3,

       requestStub, 
       parseResponseStub,
       callbackStub,
       stockApiRequester;


    beforeEach(function() {
      requestStub = sinon.stub();
      parseResponseStub = sinon.stub();
      callbackStub = sinon.stub();

      stockApiRequester = proxyquire( '../../../src/stockApi/stockApiRequester.js', {
         'request':                    requestStub,
         './parseStockApiResponse.js': parseResponseStub
      });

      // requestStub.withArgs([1,2,3], 3, parseResponseStub).callsArgWithAsync(2, [{partNumber:1, availability:'available'}, {partNumber:2, availability:'out-of-stock'}]);
      // parseResponseStub.withArgs('12345', 'abcdef', 'xyz').callsArgWithAsync(2, [{partNumber:1, availability:'available'}, {partNumber:2, availability:'out-of-stock'}]);
    });
});