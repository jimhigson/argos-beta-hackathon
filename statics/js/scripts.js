
$(document).ready(function ($) {

   var searchBox = $('input.main-search');
   var results = $('#auto-complete');
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
            $.each(data['hits']['hits'], function () {

               var source = this['_source'];

               thisResult =    '<div class="searchResultBox">'
                                + '<img src="http://www.argos.co.uk/' + source['imgUrl'] + '">'
                                + '<div class="description">'
                                   + '<h3>' + source['productTitle'] + '</h3>'
                                   + '<span>£' + Number(source['price']).toFixed(2) + '</span>'
                                + '</div>'
                             + '</div>';

               results.append(thisResult);

               currentAjax = null;
            });
         });
      } else {
         results.html('');
      }
   }

   searchBox.keyup(updateAutoComplete);
   updateAutoComplete();
});
