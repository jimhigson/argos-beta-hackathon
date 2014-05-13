
$(document).ready(function ($) {

   var resultTemplate = Handlebars.compile( $('template#resultTemplate').html() );
      
   var currentStore;
   
   var searchBox = $('input.mainSearch');
   var storeSearch = $('.storeSearch');
   var results = $('#results');
   var storesAutocomplete = $('#storesAutocomplete');
   var categories = $('#categories');
   var currentRestTransport = null;
   
   function showAvailability() {
      // request availability of stock items if we have a store:
      if( currentStore && $('.searchResultBox').length > 0 ) {
         var productList = $('.searchResultBox').toArray().map(function(ele) {
            return $(ele).data('productid');
         });
         
         var availabilityUrl = '/stockInfo/?storeNumber=' + currentStore + '&partNumbers=' + productList.join(',');
         
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
      hideStoreAutocomplete()
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
        if (data.hits.hits.length > 0) {
            storesAutocomplete.show();
        }

   }
   
   function sanitiseQueryTerm(term) {
      return term.trim().replace(/\s+/g, '_').replace(/\//g, '');
   }
   
   function makeInputUrlFriendly(input) {
      return input.replace(/\s/g, '_');
   }

   function clearResultsHtml() {
      results.html('');
   }
   
   function showProductAjaxResult(result) {

      var resultEle = $(resultTemplate(result));
      resultEle.find('img').unveil();
      results.append(resultEle);
   }   
   
   function handleResultsFromProductRest(transport) {
      
      transport
         .start( function(){
            clearResultsHtml();
         })
         .node('!results.*', showProductAjaxResult)
         .done(function(){
            currentRestTransport = null;
            showAvailability();
         });
   }
   
   function searchURL(term) {
      return '/search/' + term + '?json=true';
   }
   
   function loadSearchResults() {

      var queryTerm = sanitiseQueryTerm(searchBox.val());
      
      if (queryTerm) {
         
         if( currentRestTransport ) {
            currentRestTransport.abort();
         }

         currentRestTransport = oboe({
            url: searchURL(queryTerm)
         });
         
         handleResultsFromProductRest(currentRestTransport);

      } else {
         clearResultsHtml();
      }
   }
   
   
   function updateStoreKeyUp() {
      
      var queryTerm = sanitiseQueryTerm(storeSearch.val());

      if (queryTerm) {

         var storesURL = '/stores/' + queryTerm;

         if( currentRestTransport ) {
            currentRestTransport.abort();
         }

         currentRestTransport = $.ajax({
            url: storesURL
         }).done(handleStoreRequest);
      } else {
          hideStoreAutocomplete();
      }
   }
   
   function hideStoreAutocomplete() {
      storesAutocomplete.html('');
      storesAutocomplete.hide();
   }

   searchBox.keyup(loadSearchResults);
   storeSearch.keyup(updateStoreKeyUp);
   storeSearch.focus(function() {
      storeSearch.val('');
   });
   
   $('#results').on('click', '.searchResultBox:not(.outOfStock) button.reserve.inactive', function() {
      
      if(!currentStore) {
         return;
      }
      
      var reserveButton = $(this),
          productItem = reserveButton.closest('.searchResultBox'),
          productId = productItem.data('productid');
      
      console.log('you want to reserve product', productId);

      reserveButton.removeClass('inactive');
      reserveButton.addClass('waiting');
      
      var reservationUrl = '/makeReservationStub/' + productId + '?storeId=' + currentStore;
      
      oboe(reservationUrl)
         .node('reservationNumber[*]', function(reservationCode){
            console.log('the code is', reservationCode);
            
            reserveButton.find('.number').text(reservationCode);
         })
         .done(function() {
            reserveButton.removeClass('waiting');
            reserveButton.addClass('done');
         });
   });
   
   loadSearchResults();
   $('#search').sticky();
   
   $('#storesAutocomplete').on('click', '.storeResult', function() {
      currentStore = $(event.target).data('storeid');

      $('body').attr('data-storeId', currentStore);
      console.log('your store is now', currentStore);
      
      storeSearch.val( $(event.target).data('name') );

      showAvailability();
      hideStoreAutocomplete();
   });
      
});
