module.exports.batchArray = function( array, batchSize ) {
   
   var result = [];
   
   for(var i = 0; i < array.length ; i += batchSize) {
      
      result.push( array.slice( i, i+batchSize ) );
   }
   
   return result;
   
};
