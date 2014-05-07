describe('providing synonym lists', function() {

   var synonymsOf = require('../../../synonymsOf.js');
   
   it('can handle a single line of two words', function() {
      var get = synonymsOf([
         'tv, television'
      ]);
      
      expect(get('tv')).toEqual(['tv', 'television']);
      expect(get('television')).toEqual(['tv', 'television']);
   });

   it('can handle a single line of three words', function() {
      var get = synonymsOf([
         'tv, television, telly'
      ]);

      expect(get('tv'))
         .toEqual(['tv', 'television', 'telly']);
      expect(get('television'))
         .toEqual(['tv', 'television', 'telly']);
      expect(get('telly'))
         .toEqual(['tv', 'television', 'telly']);
   });

   it('can provide a zero-length list of syns', function() {
      var get = synonymsOf([
         'tv, television, telly'
      ]);

      expect(get('alien')).toEqual([]);
   });

   it('can work in a system with no syns setup', function() {
      var get = synonymsOf([]);

      expect(get('alien')).toEqual([]);
   });   

   describe('handling error cases', function() {

      it('throws on duplicate words on a line', function () {
         expect(function() {
            var get = synonymsOf([
               'tv, tv, telly'
            ]);
            
            get('tv');
         }).toThrow();
      });

      it('throws on duplicate words across lines', function () {
         expect(function() {
            var get = synonymsOf([
               'tv, television',
               'television, goggle box'
            ]);

            get('television');
         }).toThrow();
      });      
   });
   
});
