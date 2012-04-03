window.addEvent('domready',function() {

  $('something').addEvent('click',function(event) {
    event.stop();
    var x = $('xpartial').retrieve('XPartial');
    x.refresh();
  });

});
