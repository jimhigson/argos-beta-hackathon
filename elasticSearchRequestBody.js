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

      /* this needs elastic search 1.1 which currently isn't on vichub  
      "aggregations": {
         "sigTermFromCat": {"significant_terms": {"field": "category", "size": 10}},
         "sigTermFromName": {"significant_terms": {"field": "productTitle", "size": 10}},
         "priceSpread": {"percentiles": {"field": "price", "percents": [33, 50, 66] }},
         "categories": { "terms": { "field": "category" }}
      },*/

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
