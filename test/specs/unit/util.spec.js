describe('our generic util functions', function() {
      
   describe('batching an array', function() {
   
      var batchArray = require('../../../src/util.js').batchArray;
      
      it('works with empty arrays!', function() {
         expect(batchArray([], 10)).toEqual([]);
      });
      
      it('works when the number of elements passed in is less than the batch size', function() {
         expect(batchArray(['abc'], 10)).toEqual([
            ['abc']
         ]);
      });
      
      it('works when the number of elements passed in is an exact multiple of the batch size', function() {
         expect(batchArray(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], 3)).toEqual([
            ['a','b','c'],
            ['d','e','f'],
            ['g','h','i']
         ]);
      });

      it('works when the number of elements passed in is not exactly divisible by the batch size', function() {
         expect(batchArray(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], 7)).toEqual([
            ['a', 'b', 'c', 'd','e','f', 'g'],
            ['h', 'i']
         ]);
      });
      
      
      
   });
   
});
