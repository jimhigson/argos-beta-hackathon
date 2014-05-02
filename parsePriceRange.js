module.exports = function parsePriceRange(query) {

   function withoutMatchingText(match, text) {
      return match
         ? text.substring(0, match.index) + text.substring(match.index+match[0].length)
         : text
         ;
   }

   var LESS_THAN_PATTERN = /(?:for )?(?:less than|<|under|cheaper than) £?(\d+(.\d+)?)/,
      MORE_THAN_PATTERN = /(?:for )?(?:more than|>|over|at least|above) £?(\d+(.\d+)?)/,
      minPriceMatch = MORE_THAN_PATTERN.exec(query),
      maxPriceMatch = LESS_THAN_PATTERN.exec(query);

   return {
      maxPrice : (maxPriceMatch? Number(maxPriceMatch[1]).toFixed(2) : "1000000.00"),
      minPrice : (minPriceMatch? Number(minPriceMatch[1]).toFixed(2) : "0.01"),
      term:
         withoutMatchingText( minPriceMatch,
            withoutMatchingText( maxPriceMatch, query )
         ).trim()
   };
};
