$(document).ready( function() {
    $('.form-horizontal').on('click', 'button', function(event) {
        event.preventDefault();
        
        let element = $("#email-to");
        let email = $("#inputStreamingEmail").val();
        let uuid = $('#inputStreamingId').attr("placeholder");
        
        $.ajax({
            url : '/send-email-guest/',
            type : 'GET',
            data : {
                email : email,
                uuid : uuid
                },
            success : function(response){
                element.html(response);
            }
        });
    });
});

