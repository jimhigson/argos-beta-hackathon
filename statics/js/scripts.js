
$(document).ready(function ($) {

   var currentStore;
   
   var searchBox = $('input.mainSearch');
   var storeSearch = $('.storeSearch');
   var results = $('#results');
   var storesAutocomplete = $('#storesAutocomplete');
   var categories = $('#categories');
   var currentAjax = null;

   function handleProductAjaxResult(data) {
      results.html('');
      var hits = data.hits.hits;
      hits.forEach( function (hit) {

         var product = hit._source,
             productTitleHtml = (hit.highlight && hit.highlight.productTitle) || product.productTitle,
             productUrl = 'http://www.argos.co.uk/static/Product/partNumber/' + product.productId + '.htm';

         var hitHtml =     '<div class="searchResultBox" data-productId="' + product.productId + '">'
                           + '<img data-src="http://www.argos.co.uk/' + product['imgUrl'] + '">'
                           + '<div class="description">'
                           + '<h3><a href="'+ productUrl +'">' + productTitleHtml + '</a></h3>'
                           + '<span>£' + Number(product['price']).toFixed(2) + '</span>'
                           + '</div>'
                           + '</div>';

         results.append(hitHtml);

         currentAjax = null;
      });
      results.find('img').unveil();

      showAvailability();
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
   
   function showAvailability() {
      // request availability of stock items if we have a store:
      if( currentStore ) {
         var productList = $('.searchResultBox').toArray().map(function(ele) {
            return $(ele).data('productid');
         });
         
         var availabilityUrl = '/stockInfo/' + currentStore + '/' + productList.join(',');
         
         console.log('I need to hit', availabilityUrl);
         /*$.ajax( availabilityUrl, function() {

          });*/
      }
   }
   
   function handleStoreRequest(data) {
      storesAutocomplete.html('');   
      data.hits.hits.forEach( function (hit) {
         var store = hit._source;
         
         
         var html =     '<div class="storeResult" ' +
            '                  data-storeId="' + store.id + '"' + 
            '                  data-name="' + store.name + '"' +
                         '">' + 
                           store.name + 
                        '</div>';   
         storesAutocomplete.append(html);   
      });   
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
         }).done(handleProductAjaxResult);
      } else {
         results.html('');
      }
   }
   
   
   function updateStoreKeyUp() {
      
      var queryTerm = sanitiseQueryTerm(storeSearch.val());

      if (queryTerm) {

         storesAutocomplete.show();

         var storesURL = '/stores/' + queryTerm;

         if( currentAjax ) {
            currentAjax.abort();
         }

         currentAjax = $.ajax({
            url: storesURL
         }).done(handleStoreRequest);
      } else {
         storesAutocomplete.html('');
      }
   }
   
   function hideStoreAutocomplete() {
      storesAutocomplete.hide();
   }

   searchBox.keyup(updateAutoComplete);
   storeSearch.keyup(updateStoreKeyUp);
   
   updateAutoComplete();
   $('#search').sticky();
   
   $('#storesAutocomplete').on('click', '.storeResult', function( evt ) {
      currentStore = $(event.target).data('storeid');

      storeSearch.val( $(event.target).data('name') );

      hideStoreAutocomplete();
      
      console.log('your store is now', currentStore);
   });
});
