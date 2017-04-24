// onClick on 'Browse' load the internal page
$(function(){
    $('#browse_app').click(function(){
        $(window).load('../dist/index.html');
    });
});
