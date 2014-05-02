module.exports = function (term, minPrice, maxPrice, category) {

   var json = {
      min_score: 0.4,
      size: 100, // how many results?

      "highlight": {
         "fields": {
            "productTitle": {},
            "summaryText": {}
         }
      },
      query: {
         "query_string": {
            "fields": ["productId^4", "productTitle^5", "category^3", "summaryText"],
            "query": term + '*'
         }
      },

      "aggregations": {
         "sigTermFromCat": {"significant_terms": {"field": "category", "size": 4}},
         "sigTermFromName": {"significant_terms": {"field": "productTitle", "size": 4}},
         "priceSpread": {"percentiles": {"field": "price", "percents": [33, 50, 66] }}
      },

      "filter": {
         and: [
            {  "range": {
               "price": {
                  "from": minPrice,
                  "to": maxPrice
               }
            }
            }
         ]
      }
   };

   if( category ) {
      json.filter.and.push({
         term: {
            category: category.toLowerCase()
         }
      });
   }
   
   return json;
   
};
