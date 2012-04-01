var XPartial;

(function($) {

XPartial = new Class;

XPartial.extend({

  bind : function(hash) {
    if(!this.events) {
      this.events = [];
    }
    this.events.push(hash);
  },

  onReady : function(partial) {
    (this.events || []).each(function(event) {
      event.onInit.apply(event,[partial]);
    });
  },

  onDestroy : function(instance) {
    var partial = instance.getContainer();
    (this.events || []).each(function(event) {
      event.onDestroy.apply(event,[partial]);
    });
  }

});

XPartial.implement({

  Implements : [Options, Events], 

  options : {
    requestClass : Request,
    requestOptions : {
      method : 'GET'
    }
  },

  initialize : function(url,container,options) {
    this.url = url;
    this.container = $(container);
    this.setOptions(options);
  },

  load : function() {
    var options = this.options.requestOptions;
    var klass = this.options.requestClass;
    Object.append(options,{
      'url' : this.getURL(),
      'onSuccess' : this.onSuccess.bind(this),
      'onComplete' : this.onComplete.bind(this)
    });
    this.requester = new klass(options).send();
  },

  getURL : function() {
    return this.url;
  },

  getContainer : function() {
    return this.container;
  },

  onSuccess : function(html) {
    this.hide();
    this.xview = new XViewResponse(html);
    var content = this.xview.getHTML();
    this.setContent(content);
    this.fireEvent('success');
    this.loadAssets();
  },

  onComplete : function() {
    this.fireEvent('complete');
  },

  hide : function() {
    this.getContainer().setStyle('display','none');
  },

  show : function() {
    this.getContainer().setStyle('display','block');
  },

  setContent : function(html) {
    this.getContainer().set('html',html);
  },

  loadAssets : function() {
    var assets = this.getXView().getAssets();
    if(assets.length > 0) {
      Asset.load(assets,this.onReady.bind(this));
    }
    else {
      this.onReady();
    }
  },

  getXView : function() {
    return this.xview;
  },

  onRequest : function() {
    this.fireEvent('request');
  },

  onReady : function() {
    this.show();
    this.ready = true;
    XPartial.onReady(this.getContainer());
    this.fireEvent('ready');
  },

  isReady : function() {
    return this.ready;
  },

  destroy : function() {
    XPartial.onDestroy(this);
    this.getContainer().destroy();
  }

});

})(document.id,$$);

