
$(document).ready(function ($) {

   var resultTemplate = Handlebars.compile( $('template#resultTemplate').html() );
      
   var currentStore;
   
   var searchBox = $('input.mainSearch');
   var storeSearch = $('.storeSearch');
   var results = $('#results');
   var storesAutocomplete = $('#storesAutocomplete');
   var categories = $('#categories');
   var currentAjax = null;

   function handleProductAjaxResult(data) {
      results.html('');

      data.results.forEach( function (result) {

         results.append(resultTemplate(result));

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
      if( currentStore && $('.searchResultBox').length > 0 ) {
         var productList = $('.searchResultBox').toArray().map(function(ele) {
            return $(ele).data('productid');
         });
         
         var availabilityUrl = '/stockInfo/' + currentStore + '/' + productList.join(',');
         
         console.log('I need to hit', availabilityUrl);
         $.ajax( availabilityUrl )
         .done( function( result ) {
               
            console.log(result);               
               
            result.forEach(function( productAvailability ) {

               var productElement = $('[data-productId=' + productAvailability.partNumber + ']');
               
               if( productAvailability.availability == 'out-of-stock' ) {
                  
                  
                  productElement.addClass('outOfStock');
                  
                  console.log(productAvailability.partNumber + ' is out of stock');
               } else {

                  productElement.removeClass('outOfStock');
               }
            });
               
            console.log('I got back', result);
         });
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
   storeSearch.focus(function() {
      storeSearch.val('');
   });
   
   updateAutoComplete();
   $('#search').sticky();
   
   $('#storesAutocomplete').on('click', '.storeResult', function( evt ) {
      currentStore = $(event.target).data('storeid');

      console.log('your store is now', currentStore);
      
      storeSearch.val( $(event.target).data('name') );

      showAvailability();
      hideStoreAutocomplete();
   });
});
