
$(document).ready(function ($) {

   var searchBox = $('input.main-search');
   var results = $('#results');
   var currentAjax = null;

   function updateAutoComplete() {

      if (searchBox.val()) {
         var searchURL = '/find/' + searchBox.val();

         if( currentAjax ) {
            currentAjax.abort();
         }

         currentAjax = $.ajax({
            url: searchURL
         }).done(function (data) {
            results.html('');
            data.hits.hits.forEach( function (hit) {

               var productTitleHtml = (hit.highlight && hit.highlight.productTitle) || this._source.productTitle;
               
               thisResult =    '<div class="searchResultBox">'
                                + '<img data-src="http://www.argos.co.uk/' + hit._source['imgUrl'] + '">'
                                + '<div class="description">'
                                   + '<h3>' + productTitleHtml + '</h3>'
                                   + '<span>£' + Number(hit._source['price']).toFixed(2) + '</span>'
                                + '</div>'
                             + '</div>';

               results.append(thisResult);

               currentAjax = null;
            });

            results.find('img').unveil();
         });
      } else {
         results.html('');
      }
   }

   searchBox.keyup(updateAutoComplete);
   updateAutoComplete();
   
   $('#search').sticky();
});
