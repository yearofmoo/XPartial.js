var XPartial = new Class;

XPartial.extend({

  supportsAssets : function() {
    return Asset && typeOf(Asset.load) == 'function';
  }

});

XPartial.implement({

  Implements : [Options, Events, Chain],

  Binds : ['onRequest','onResponse','onComplete','onFailure','onAnimationComplete'],

  options : {
    className : 'xpartial',
    storageKeyName : 'XPartial',
    swapper : 'Fade',
    loadingClassName : 'loading',
    preserveHeightBetweenRequests : true,    
    applyXViewHeadersToElement : 'id,className',
    revealWhenReady : true,
    elementOptions : {

    },
    revealFxOptions : {

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

  getAnimator : function() {
    if(!this.animator) {
      this.animator = new Fx.Reveal(this.getElement(),this.options.revealFxOptions);
      this.animator.addEvents({
        'complete':this.onAnimationComplete
      });
    }
    return this.animator;
  },

  getAnimationDirection : function() { 
    return this.animationDirection;
  },
  
  setAnimationDirection : function(dir) {
    this.animationDirection = dir;
  },

  onAnimationComplete : function() {
    switch(this.getAnimationDirection()) {
      case 'reveal':
        this.onShow();
        this.onAfterShow();
      break;
      case 'dissolve':
        this.onHide();
        this.onAfterHide();
      break;
    }
  },

  toElement : function() {
    return this.getElement();
  },

  build : function() {
    if(!this.element) {
      this.element = new Element('div');
    }

    this.customizeElement();

    if(this.options.container) {
      this.element.inject(this.options.container);
    }

    this.element.store(this.options.storageKeyName,this);
    if(!this.inner) {
      var inner = this.createInnerElement();
      this.setInner(inner);
    }

    this.element.set('reveal',this.options.revealFxOptions);
  },

  customizeElement : function() {
    if(this.options.elementOptions) {
      this.element.set(this.options.elementOptions);
    }
    if(this.options.className) {
      this.element.addClass(this.options.className);
    }
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
    this.empty();
    if(!this.options.revealWhenReady) {
      this.show();
      this.showLoading();
    }
    this.fireEvent('request',[this.getElement()]);
  },

  onComplete : function() {
    if(this.options.revealWhenReady) {
      this.reveal();
      this.hideLoading(true);
    }
    else {
      this.show();
      this.hideLoading();
    }
    this.callChain();
    this.fireEvent('complete',[this.getElement()]);
    this.requested = true;
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
      var cache = [];
      headers.each(function(header) {
        var value = xview.getHeader(header);
        if(value) {
          cache.push(header);
          if(header == 'className') {
            element.addClass(value);
          }
          else {
            element.set(header,value);
          }
        }
      },this);
      if(cache.length > 0) {
        this.cachedXViewHeaders = cache;
      }
    }
  },

  stripXViewHeaders : function() {
    if(this.cachedXViewHeaders) {
      var element = this.getElement();
      this.cachedXViewHeaders.each(function(header) {
        element.set(header,null);
      },this);
      this.cachedXViewHeaders = null;
      this.customizeElement();
    }
  },

  getSwapper : function() {
    if(!this.swapper) {
      this.swapper = new Fx.Swap(this.getElement(),this.options.fxOptions);
      this.swapper.setSwapper(this.options.swapper);
    }
    return this.swapper;
  },

  swap : function(html,fn) {
    var element = this.createInnerElement(html);
    var swapper = this.getSwapper();
    swapper.swap(element);
    swapper.chain(function() {
      this.setInner(element);
      fn();
    }.bind(this));
  },

  replace : function(element,fn) {
    if(this.isVisible() && this.getSwapper()) {
      this.swap(element,fn);
    }
    else {
      this.setContent(element);
      fn();
    }
  },

  onResponse : function(html) {
    var xview = new XView(html);
    this.showLoading();
    this.replace(xview.getContentHTML(),function() {
      this.applyXViewHeaders(xview);
      var assets = xview.getAssets();
      if(XPartial.supportsAssets() && assets && assets.length > 0) {
        Asset.load(assets,this.onComplete);
      }
      else {
        this.onComplete();
      }
    }.bind(this));
  },

  hasPreviousRequest : function() {
    return this.requested;
  },

  load : function(url,method,data) {
    if(this.hasPreviousRequest() && this.options.preserveHeightBetweenRequests) {
      this.stripXViewHeaders();
    }
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
    this.getInner().empty();
  },

  setContent : function(html) {
    this.empty();
    var elm = this.getInner();
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

  getInner : function() {
    return this.inner;
  },

  setInner : function(element) {
    if(this.inner) {
      this.inner.destroy();
    }
    this.inner = element;
  },

  createInnerElement : function(html) {
    return new Element('div.inner').set('html',html).inject(this.getElement());
  },

  showLoading : function(fast) {
    return;
    var element = this.getElement();
    element.addClass(this.options.loadingClassName);
    var spinner = element.get('spinner');
    spinner.setOptions(this.options.spinnerOptions);
    spinner.position();
    spinner.show(fast ? true : false);
    this.fireEvent('showLoading',[element]);
  },

  hideLoading : function(fast) {
    return;
    var element = this.getElement();
    element.removeClass(this.options.loadingClassName);
    var spinner = element.get('spinner');
    spinner.hide(fast ? true : false);
    this.fireEvent('hideLoading',[element]);
  },

  show : function() {
    this.onBeforeShow();
    this.getElement().setStyle('display','block');
    this.onShow();
    this.onAfterShow();
  },

  isVisible : function() {
    return this.getElement().getStyle('display') == 'block';
  },

  isHidden : function() {
    return !this.isVisible();
  },

  reveal : function() {
    this.onBeforeShow();
    this.setAnimationDirection('reveal');
    this.getAnimator().reveal();
  },

  hide : function() {
    this.onBeforeHide();
    this.getElement().setStyle('display','none');
    this.onHide();
    this.onAfterHide();
  },

  dissolve : function() {
    this.onBeforeHide();
    this.setAnimationDirection('dissolve');
    this.getAnimator().dissolve();
  },

  isLoading : function() {
    return this.getElement().hasClass(this.options.loadingClassName);
  },

  isReady : function() {
    return this.ready;
  },

  onBeforeShow : function() {
    this.fireEvent('beforeShow');
  },

  onBeforeHide : function() {
    this.fireEvent('beforeHide');
  },

  onHide : function() {
    this.fireEvent('hide');
  },

  onAfterShow : function() {
    this.fireEvent('afterShow');
  },

  onAfterHide : function() {
    this.fireEvent('afterHide');
  },

  onShow : function() {
    this.fireEvent('show');
  },

  destroy : function() {
    var element = this.getElement();
    element.eliminate(this.options.storageKeyName);
    element.destroy();
    delete this.element;
  }

});
