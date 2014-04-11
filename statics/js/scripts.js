/* ALL JQUERY
   ========================================= */
   
   
jQuery.noConflict();
jQuery(document).ready(function($){

    $('input.main-search').keyup(function() {

    	if($(this).val() !== '') {
	    	var searchURL = document.location.origin + '/search/*' + $(this).val() + '*';

	    	$.ajax({
	    		url: searchURL
	    	}).done(function(data) {
	    		$('#auto-complete').html('');
	    		$.each(data['hits']['hits'], function() {
	    			console.log(this['_source']['productTitle']);

	    			thisResult =  '<div class="sImg"><div class="searchResultBox"></div>';
	    			thisResult += '<img src="http://www.argos.co.uk/' + this['_source']['imgUrl'] +  '"></img>'
	    			thisResult += '<h3>' + this['_source']['productTitle'] + '</h3>';
	    			thisResult += '<span>£' + this['_source']['price'] +  '</span>';

	    			//console.log(thisResult);
	    			$('#auto-complete').append(thisResult);
	    		});
	    	});
    	} else {
    		$('#auto-complete').html('');
    	}


        $('#auto-complete').fadeIn('slow');

    });

    $('input.main-search').focusout(function() {

        $('#auto-complete').fadeOut('slow');

    });
		

}); /* end of as page load scripts */