var cheerio = require('cheerio');

function scrapeProductPrice($) {

   var priceMatch = $('span.price').first().text().trim().match(/[\d.]+/);

   return priceMatch ? Number(priceMatch[0]) : 0; // the regex doesn't match on some pages
}

function stripTrailingDot(str){
   return str.replace(/.$/, '');
}

function scrapeProductname($){
   try {

      var productName = $('#pdpProduct h1.fn').text().trim();

      return stripTrailingDot(productName);
   }catch(e) {
      throw new Error('could not get product name ' + e);
   }
}

function scrapeSummary($) {
   try {
      return $('.fullDetails').html().trim();
   }catch(e) {
      throw new Error('could not get summary from html' + 
                        $('.fullDetails').html() + e);
   }
}

function scrapeSummaryText($) {
   try {
      return $('.fullDetails').text().trim();
   }catch(e) {
      throw new Error('could not get summary text ' + e);
   }
}

function scrapeSummaryFirstParagraph($) {
   try {
      return $('.fullDetails p').text().trim();
   }catch(e) {
      throw new Error('could not get summary first paragraph text ' + e);
   }
}

function scrapeCategory($) {
   var metaData, category;
   try {

      metaData = $('meta[name=keywords]').attr('content'),
      category = metaData && metaData.split(',')[0].trim();

      return category;

   } catch(e) {
      throw new Error('could not get category from keywords "' 
         + metaData + '"' );
   }
}

module.exports = function scrapeProductPage(productId, body) {

   var $ = cheerio.load(body);

   return {
      productId:                 productId,
      productTitle:              scrapeProductname($),
      price:                     scrapeProductPrice($),
      summary:                   scrapeSummary($),
      summaryText:               scrapeSummaryText($),
      summaryFirstParagraph:     scrapeSummaryFirstParagraph($),
      imgUrl:                    'http://www.argos.co.uk/' + $('#mainimage').attr('src'),
      category:                  scrapeCategory($)
   };
};
