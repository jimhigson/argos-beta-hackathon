/* ALL JQUERY
   ========================================= */
   
   
jQuery.noConflict();
jQuery(document).ready(function($){

    $('input.main-search').keypress(function() {

        $('#auto-complete').fadeIn('slow');

    });

    $('input.main-search').focusout(function() {

        $('#auto-complete').fadeOut('slow');

    });
		

}); /* end of as page load scripts */