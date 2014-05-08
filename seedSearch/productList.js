var PRODUCTS_XML = 'http://www.argos.co.uk/product.xml';
var PRODUCTS_XML2 = 'http://www.argos.co.uk/product2.xml';

var request = require('request'),
    cheerio = require('cheerio');

require('colors');

function requestXml(xmlUrl, notifyWhenAdded) {

   var urls = [];
   
   console.log('getting'.grey, xmlUrl);
   
   request(xmlUrl, function (err, responseXml) {

      console.log('got the xml from'.grey, xmlUrl);

      //var doc = new dom().parseFromString(responseXml.body);
      var $ = cheerio.load(responseXml.body);

      $('loc').map(function (i, ele) {
         urls.push($(ele).text());
      });
      
      notifyWhenAdded(undefined, urls);
   });
}


function getProductList(callback) {

   var xmlFilesLoaded = 0;
   var masterUrls = [];
   
   function notifyCallbackIfAllXmlsAreLoaded( err, urlsFromOneFile ) {
      xmlFilesLoaded++;

      masterUrls = masterUrls.concat(urlsFromOneFile);
      
      if( xmlFilesLoaded == 2 ) {
         
         var productIds = masterUrls.map(function(url) {
            return /\d{4,10}/.exec(url)[0];
         });
         
         callback(undefined, productIds);
      }
   }
   
   requestXml(PRODUCTS_XML, notifyCallbackIfAllXmlsAreLoaded);
   requestXml(PRODUCTS_XML2, notifyCallbackIfAllXmlsAreLoaded);
}

module.exports = getProductList;
