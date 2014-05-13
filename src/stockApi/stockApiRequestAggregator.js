var stockApiRequester = require('./stockApiRequester.js'),
    batchArray = require('../util.js').batchArray,
    barrier = require('../barrier.js'),
    batchSize = 10;


module.exports.request = function(partNumbers, storeNumber, callback) {

   var batches = batchArray(partNumbers, batchSize),
       data = [];
   
   var bar = barrier(function() {
      callback(data);
   });
   
   batches.forEach(function(batch) {
      
      console.log('requesting', JSON.stringify(batch));

      stockApiRequester(batch, storeNumber, bar.add(function(stockJson) {
         
         // once here, there will be no errors - if an error occurred the stockJson
         // will contain 'unknown' for the product. Hence, this function takes
         // no err parameter
         data = data.concat(stockJson);
      }));
   });
};

module.exports.setBatchSize = function(n) {
   batchSize = n;
};
