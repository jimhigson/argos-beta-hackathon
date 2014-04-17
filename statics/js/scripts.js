/* ALL JQUERY
 ========================================= */

$(document).ready(function ($) {

   var searchBox = $('input.main-search');
   
   function updateAutoComplete() {

      if (searchBox.val()) {
         var searchURL = '/find/' + searchBox.val();

         $.ajax({
            url: searchURL
         }).done(function (data) {
            $('#auto-complete').html('');
            $.each(data['hits']['hits'], function () {

               var source = this['_source'];

               thisResult = '<div class="searchResultBox cf">';
               thisResult += '<div class="sImg"><img src="http://www.argos.co.uk/' + source['imgUrl'] + '"></img></div>'
               thisResult += '<h3>' + source['productTitle'] + '</h3>';
               thisResult += '<span>£' + source['price'] + '</span></div>';

               $('#auto-complete').append(thisResult);
            });
         });
      } else {
         $('#auto-complete').html('');
      }
   }

   searchBox.keyup(updateAutoComplete);
   updateAutoComplete();
});
