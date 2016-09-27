$(document).ready( function() {
    
    // Send email request function
    $('.form-horizontal').on('click', 'button', function(event) {
        event.preventDefault();
        
        let element = $("#email-to");
        let email = $("#inputStreamingEmail").val();
        let uuid = $('#inputStreamingId').attr("placeholder");

        let validation = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    
        if (validation.test(email)) {
            $.ajax({
                url : '/send-email-guest/',
                type : 'GET',
                data : {
                    email : email,
                    uuid : uuid
                    },
                success : function(response){
                    element.html(response);
                    $('#modal-success').modal('show');
                    
                }
            });
        }
        else {
            $("#email-to-error").html(email);
            $('#modal-error').modal('show');
        }
    });
});

