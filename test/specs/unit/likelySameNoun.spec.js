describe('likely same noun', function() {
   
   var likelySameNoun = require('../../../likelySameNoun.js');
   var eachWordIsOnlyASynonymWithItself = function( a ){ return [a] };
   
   it('recognises identical strings', function() {
      var test = likelySameNoun(eachWordIsOnlyASynonymWithItself);
      
      expect(test('tree', 'tree')).toBe(true);
   });

   it('recognises plural on left with s', function() {
      var test = likelySameNoun(eachWordIsOnlyASynonymWithItself);
      expect(test('trees', 'tree')).toBe(true);
   });
   
   it('recognises plural on right with s', function() {
      var test = likelySameNoun(eachWordIsOnlyASynonymWithItself);
      expect(test('tree', 'trees')).toBe(true);
   });

   it('recognises two plurals', function() {
      var test = likelySameNoun(eachWordIsOnlyASynonymWithItself);
      expect(test('trees', 'trees')).toBe(true);
   });   

   it('recognises plurals with -y and -ie', function() {
      var test = likelySameNoun(eachWordIsOnlyASynonymWithItself);
      expect(test('baby', 'babies')).toBe(true);
   });

   it('recognises plurals with -ie and -y', function() {
      var test = likelySameNoun(eachWordIsOnlyASynonymWithItself);
      expect(test('baby', 'babies')).toBe(true);
   });   

   it('knows that different things are different', function() {
      var test = likelySameNoun(eachWordIsOnlyASynonymWithItself);
      expect(test('tree', 'bee')).toBe(false);
   });

   it('knows that different things are different if one is plural', function() {
      var test = likelySameNoun(eachWordIsOnlyASynonymWithItself);
      expect(test('trees', 'bee')).toBe(false);
   });

});
