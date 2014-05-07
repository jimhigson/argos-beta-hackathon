module.exports = function( synonymsList ) {
   
   var map = {};

   synonymsList.forEach( function(line) {
      
      var syns = line.split(/,\s+/);
      
      syns.forEach( function(word) {
         
         if( map[word] ) {
            throw new Error(word + ' is in the synonyms twice');
         }
         
         map[word] = syns;
      })
   });

   return function synonymsOf( word ) {
      return map[word] || [];
   }
};
