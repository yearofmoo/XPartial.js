Scour.Global.defineRole('XPartial',function(element,options) {

  var partial;
  var href = element.get('href');

  element.addEvent('click',function(event) {
    event.stop();
    partial = new XPartial;
    partial.load(href);
  });

});
