/* ALL JQUERY
 ========================================= */

$(document).ready(function ($) {

   var searchBox = $('input.main-search');
   var results = $('#auto-complete');
   
   function updateAutoComplete() {

      if (searchBox.val()) {
         var searchURL = '/find/' + searchBox.val();

         $.ajax({
            url: searchURL
         }).done(function (data) {
            results.html('');
            $.each(data['hits']['hits'], function () {

               var source = this['_source'];

               thisResult = '<div class="searchResultBox cf">';
               thisResult += '<div class="sImg"><img src="http://www.argos.co.uk/' + source['imgUrl'] + '"></img></div>'
               thisResult += '<h3>' + source['productTitle'] + '</h3>';
               thisResult += '<span>£' + source['price'] + '</span></div>';

               results.append(thisResult);
            });
         });
      } else {
         results.html('');
      }
   }

   searchBox.keyup(updateAutoComplete);
   updateAutoComplete();
});
