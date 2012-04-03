var XPartial = new Class;

XPartial.extend({

  supportsAssets : function() {
    return Asset && typeOf(Asset.load) == 'function';
  }

});

XPartial.implement({

  Implements : [Options, Events, Chain],

  Binds : ['onRequest','onResponse','onComplete','onFailure'],

  options : {
    className : 'xpartial',
    storageKeyName : 'XPartial',
    loadingClassName : 'loading',
    applyXViewHeadersToElement : 'id,className',
    elementOptions : {

    },
    spinnerOptions : {
      style : {
        opacity : 0.5
      }
    }
  },

  initialize : function(element,options) {

    if(!window.Elements || typeOf(window.Elements.from) != 'function') {
      throw new Error('XPartial: MooTools-more is not included');
    }
    if(!window.XView || typeOf(window.XView) != 'class') {
      throw new Error('XPartial: XView.js is not included');
    }

    if(arguments.length == 2) {
      this.element = document.id(element);
    }
    else {
      options = element;
    }

    this.setOptions(options);
    this.build();
    this.hide();
  },

  toElement : function() {
    return this.getElement();
  },

  build : function() {
    if(!this.element) {
      this.element = new Element('div');
    }
    if(this.options.elementOptions) {
      this.element.set(this.options.elementOptions);
    }
    if(this.options.className) {
      this.element.addClass(this.options.className);
    }
    this.element.store(this.options.storageKeyName,this);
  },

  getRequester : function() {
    if(!this.requester) {
      this.requester = new Request({
        'onCancel':this.onCancel,
        'onSuccess':this.onResponse,
        'onFailure':this.onFailure,
        'onRequest':this.onRequest
      });
    }
    return this.requester;
  },

  onCancel : function() {
    this.hideLoading();
    this.fireEvent('cancel',[this.getElement()]);
  },

  onFailure : function() {
    this.empty();
    this.fireEvent('failure',[this.getElement()]);
  },

  onRequest : function() {
    this.ready = false;
    this.show();
    this.showLoading();
    this.fireEvent('request',[this.getElement()]);
  },

  onComplete : function() {
    this.hideLoading();
    this.show();
    this.callChain();
    this.fireEvent('complete',[this.getElement()]);
    this.ready = true;
  },

  applyXViewHeaders : function(xview) {
    var headers = this.options.applyXViewHeadersToElement;
    if(headers) {
      if(typeOf(headers) == 'string') {
        headers = headers.split(',');
      }
      else if(typeOf(headers) != 'array') {
        headers = [headers];
      }
      var element = this.getElement();
      headers.each(function(header) {
        var value = xview.getHeader(header);
        if(value) {
          if(header == 'className') {
            element.addClass(value);
          }
          else {
            element.set(header,value);
          }
        }
      },this);
    }
  },

  onResponse : function(html) {
    var xview = new XView(html);
    this.setContent(xview.getContent());
    this.showLoading();
    this.applyXViewHeaders(xview);

    var assets = xview.getAssets();
    if(XPartial.supportsAssets() && assets && assets.length > 0) {
      Asset.load(assets,this.onComplete);
    }
    else {
      this.onComplete();
    }
  },

  load : function(url,method,data) {
    this.getRequester().setOptions({
      url : url,
      method : method || 'GET',
      data : data
    }).send();
    return this;
  },

  cancel : function() {
    if(this.isLoading()) {
      this.getRequester().cancel();
    }
  },

  refresh : function() {
    this.getRequester().send();
  },

  empty : function() {
    this.getElement().empty();
  },

  setContent : function(html) {
    this.empty();
    var elm = this.getElement();
    if(typeOf(html) == 'element') {
      elm.adopt(html);
    }
    else {
      elm.set('html',html);
    }
  },

  getElement : function() {
    return this.element;
  },

  showLoading : function() {
    var element = this.getElement();
    element.addClass(this.options.loadingClassName);
    var spinner = element.get('spinner');
    spinner.setOptions(this.options.spinnerOptions);
    spinner.position();
    spinner.show();
    this.fireEvent('showLoading',[element]);
  },

  hideLoading : function() {
    var element = this.getElement();
    element.removeClass(this.options.loadingClassName);
    element.unspin();
    this.fireEvent('hideLoading',[element]);
  },

  show : function() {
    this.getElement().setStyle('display','block');
  },

  hide : function() {
    this.getElement().setStyle('display','none');
  },

  isLoading : function() {
    return this.getElement().hasClass(this.options.loadingClassName);
  },

  isReady : function() {
    return this.ready;
  },

  destroy : function() {
    var element = this.getElement();
    element.eliminate(this.options.storageKeyName);
    element.destroy();
    delete this.element;
  }

});
