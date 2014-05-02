describe('likely same noun', function() {
   
   var likelySameNoun = require('../../../likelySameNoun.js');
   
   it('recognises identical strings', function() {
      expect(likelySameNoun('tree', 'tree')).toBe(true);
   });

   it('recognises plural on left with s', function() {
      expect(likelySameNoun('trees', 'tree')).toBe(true);
   });
   
   it('recognises plural on right with s', function() {
      expect(likelySameNoun('tree', 'trees')).toBe(true);
   });

   it('recognises two plurals', function() {
      expect(likelySameNoun('trees', 'trees')).toBe(true);
   });   

   it('recognises plurals with -y and -ie', function() {
      expect(likelySameNoun('baby', 'babies')).toBe(true);
   });

   it('recognises plurals with -ie and -y', function() {
      expect(likelySameNoun('baby', 'babies')).toBe(true);
   });   

   it('knows that different things are different', function() {
      expect(likelySameNoun('tree', 'bee')).toBe(false);
   });

   it('knows that different things are different if one is plural', function() {
      expect(likelySameNoun('trees', 'bee')).toBe(false);
   });

});
