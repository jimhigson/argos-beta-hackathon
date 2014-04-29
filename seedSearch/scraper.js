var cheerio = require('cheerio');

function scrapeProductPrice($) {

   var priceMatch = $('span.price').first().text().trim().match(/[\d.]+/);

   return priceMatch ? Number(priceMatch[0]) : 0; // the regex doesn't match on some pages
}

function stripTrailingDot(str){
   return str.replace(/.$/, '');
}

function scrapeProductname($){
   var productName = $('#pdpProduct h1.fn').text().trim();

   return stripTrailingDot(productName);
}

module.exports = function scrapeProductPage(productId, body) {

   var $ = cheerio.load(body);

   var metaData = $('meta[name=keywords]').attr('content'),
      category = metaData && metaData.split(',')[0].trim();

   return {
      productId:                 productId,
      productTitle:              scrapeProductname($),
      price:                     scrapeProductPrice($),
      summary:                   $('.fullDetails').html().trim(),
      summaryText:               $('.fullDetails').text().trim(),
      summaryFirstParagraph:     $('.fullDetails p').text().trim(),
      imgUrl:                    $('#mainimage').attr('src'),
      category:                  category
   };
};
