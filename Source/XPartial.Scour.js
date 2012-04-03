Scour.Global.defineRole('XPartial',function(element,options) {

  var partial;
  var href = element.get('href');
  var inject = options.get('target');
  var target = inject ? 'inside' : 'after';

  element.addEvent('click',function(event) {
    event.stop();
    partial = new XPartial;
    $(partial).inject(inject || element,target);
    partial.load(href);
  });

});
