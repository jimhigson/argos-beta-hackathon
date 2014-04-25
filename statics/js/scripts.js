
$(document).ready(function ($) {

   var searchBox = $('input.main-search');
   var storeSearch = $('store-search');
   var results = $('#results');
   var categories = $('#categories');
   var currentAjax = null;

   function handleAjaxResult(data) {
      results.html('');
      data.hits.hits.forEach( function (hit) {

         var productTitleHtml = (hit.highlight && hit.highlight.productTitle) || hit._source.productTitle,
            productUrl = 'http://www.argos.co.uk/static/Product/partNumber/' + hit._source.productId + '.htm';

         var hitHtml =    '<div class="searchResultBox">'
            + '<img data-src="http://www.argos.co.uk/' + hit._source['imgUrl'] + '">'
            + '<div class="description">'
            + '<h3><a href="'+ productUrl +'">' + productTitleHtml + '</a></h3>'
            + '<span>£' + Number(hit._source['price']).toFixed(2) + '</span>'
            + '</div>'
            + '</div>';

         results.append(hitHtml);

         currentAjax = null;
      });
      results.find('img').unveil();

      /*
       if( data.categories.length > 1 ) {
       data.categories.forEach(function (cat) {
       var catNameInUrl = makeInputUrlFriendly(cat.name),
       catLink = '/search/' + catNameInUrl + '/' + queryTerm,
       catHtml = '<span class="category">' +
       '<a href="' + catLink + '">' + cat.name + '</a>' +
       //'<button class="close">' +
       '</span>';

       categories.append(catHtml);
       });
       }

      categories.html('');*/
   }   
   
   function sanitiseQueryTerm(term) {
      return term.trim().replace(/\s+/g, '_').replace(/\//g, '');
   }
   
   function makeInputUrlFriendly(input) {
      return input.replace(/\s/g, '_');
   }
   
   function updateAutoComplete() {

      var queryTerm = sanitiseQueryTerm(searchBox.val());
      
      if (queryTerm) {
         
         var searchURL = '/search/' + queryTerm + '?json=true';

         if( currentAjax ) {
            currentAjax.abort();
         }

         currentAjax = $.ajax({
            url: searchURL
         }).done(handleAjaxResult);
      } else {
         results.html('');
      }
   }
   
   function updateStoreAutoComplete() {
      console.log(this);
   }

   searchBox.keyup(updateAutoComplete);
   storeSearch.keyup(updateStoreAutoComplete);
   
   updateAutoComplete();
   
   $('#search').sticky();
});
