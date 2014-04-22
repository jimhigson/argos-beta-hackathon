
$(document).ready(function ($) {

   var searchBox = $('input.main-search');
   var results = $('#results');
   var categories = $('#categories');
   var currentAjax = null;

   function sanitiseQueryTerm(term) {
      return term.trim().replace(/\s+/g, '_').replace(/\//g, '');
   }
   
   function updateAutoComplete() {

      var queryTerm = sanitiseQueryTerm(searchBox.val());
      
      if (queryTerm) {
         
         var searchURL = '/find/' + queryTerm;

         if( currentAjax ) {
            currentAjax.abort();
         }

         currentAjax = $.ajax({
            url: searchURL
         }).done(function (data) {
            results.html('');
            data.hits.hits.forEach( function (hit) {

               var productTitleHtml = (hit.highlight && hit.highlight.productTitle) || this._source.productTitle;
               
               var hitHtml =    '<div class="searchResultBox">'
                                + '<img data-src="http://www.argos.co.uk/' + hit._source['imgUrl'] + '">'
                                + '<div class="description">'
                                   + '<h3>' + productTitleHtml + '</h3>'
                                   + '<span>£' + Number(hit._source['price']).toFixed(2) + '</span>'
                                + '</div>'
                             + '</div>';

               results.append(hitHtml);

               currentAjax = null;
            });
            results.find('img').unveil();

            categories.html('');
            
            if( data.categories.length > 1 ) {
               data.categories.forEach(function (cat) {

                  var catHtml = '<span class="category">' +
                     '<a href="#">' + cat.name + '</a>' +
                     '<button class="close">' +
                     '</span>';

                  categories.append(catHtml);
               });
            }

         });
      } else {
         results.html('');
      }
   }

   searchBox.keyup(updateAutoComplete);
   updateAutoComplete();
   
   $('#search').sticky();
});
