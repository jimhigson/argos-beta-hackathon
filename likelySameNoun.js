/**
 * Returns true if the two terms are likely to be plural/singular forms of each other
 * Doesn't understand English in more than an approximate probabilistic way
 *
 *  likelySameNoun('shower', 'showers')      // gives true
 *  likelySameNoun('tree', 'showers')        // gives false
 *
 * @param {String} term1
 * @param {String} term2
 */
module.exports = function likelySameNoun(synonymnMatcher) {

   return function(term1, term2) {
      if (term1 == term2) {
         return true;
      }

      if (pluralOf(term1, term2) || pluralOf(term2, term1)) {
         return true;
      }

      return false;
   }
};

function pluralOf(a, b) {

   // synonymn (cycle vs bicycle)
   // in wider context: match against all terms of query, not just first one

   if (a + 's' == b) {
      return true;
   }

   if (a.replace(/y$/, 'ies') == b) {
      return true;
   }

   return false;
}
