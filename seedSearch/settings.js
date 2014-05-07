module.exports = {
   "settings": {
      "analysis": {
         "filter": {
            "synonyms_expand": {
               "synonyms": JSON.parse( require('fs').readFileSync('synonymns.json') ),
               "type": "synonym"
            }
         },
         "analyzer": {
            "synonyms_expand": {
               "filter": [
                  "standard",
                  "lowercase",
                  "stop",
                  "synonyms_expand"
               ],
               "type": "custom",
               "tokenizer": "standard"
            }
         }
      }
   },
   "mappings": {
      "products": {
         "properties": {

            "category": {
               "type": "string",
               "analyzer" : "synonyms_expand"
            },
            "imgUrl": {
               "type": "string"
            },
            "price": {
               "type": "double"
            },
            "productId": {
               "type": "string"
            },
            "productTitle": {
               "type": "string",
               "analyzer" : "synonyms_expand"
            },
            "summary": {
               "type": "string"
            },
            "summaryText": {
               "type": "string",
               "analyzer" : "synonyms_expand"
            }
         }
      }
   }
};
