//anedosekin version
/*@cc_on
@if (@_jscript_version <= 5.7)
	alert("Ваш браузер MS Internet Explorer не поддерживается. Сейчас поддерживаются последние версии Mozilla Firefox, Webkit( Google Chrome, Apple Safari, Yandex browser)")
@end
@*/
/*
	textContent = V
	getAttribute = A
	getIntAttribute = Ai
	getElementById = I
	querySelector = QS
		All	QSA

проверка атрибута hasA
инкремент атрибута incA
переключение атрибута
		toggleA (1 значение - remove, 2 значения - переключение)
установка атрибута
		setA
*/

// GLOBALS 

function I(id) { return document.getElementById(id) }
function B() { return document.body }
function QS(s) { return document.querySelector(s); }
function QSA(s) { return document.querySelectorAll(s); }

if(!document.head) document.head = document.getElementsByTagName('head')[0];

Element.prototype.B = function() { return this; }
/*
	in onload we should(!) use this.B()
	so if we are in window (page body), it give us body
	but, if we move body content to container (with onload attribute) it give us container itself
*/


var toggle = "toggle";

window.safeClose = function ( closeParent ) {
	/* killFrame(parent, frameElement) || */
	this.open('javascript:"<script'+'>close()<'+'/script>"',closeParent? '_parent': '_self');
}

if(!String.prototype.trim) String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g,''); }
if(!String.prototype.trimLeft) String.prototype.trimLeft = function () { return this.replace(/^\s+/,''); };
if(!String.prototype.trimRight) String.prototype.trimRight = function () { return this.replace(/\s+$/,''); };
String.prototype.trimBOM = function() { return (document.all&&!window.opera)? this : this.substr(this.indexOf('<')) }
String.prototype.beginsWith = function(s) { return this.length >= s.length && this.substr(0, s.length) === s; }

String.prototype.Div = function(div, div_empty) { return this!=""? this+div : 
								div_empty !== undefined? div_empty : ""; }

String.prototype.lpad = function(n,z) { z = z || ' ';
								return this.length >=n ? this : (Array(n).join(z)+this).slice(-n);
							}
							
String.prototype.replaceAll = function (p, v) { return this.split(p).join(v); }

String.prototype.evalParts = function(eval_here) {
	return this.replace(/\{\{(.*?)\}\}/g, function(a, b) { return eval_here ? eval_here.evalHere(b) : eval(b) });
}

String.x_tagsToReplace = {  '&': '&amp;', '<': '&lt;', '>': '&gt;' };
String.f_replaceTag = function (tag) { return String.x_tagsToReplace[tag] || tag; }
String.prototype.html = function () {   return this.replace(/[&<>]/g, String.f_replaceTag);  }

Element.prototype.getXYsum = function() {
		var r = { x: 0, y: 0 }
		var e = this;
		do {
			var w = (e.ownerDocument.parentWindow || e.ownerDocument.defaultView);
			do { 
				r.x += (e.offsetLeft>=0 ? e.offsetLeft : 0); 
				r.y += (e.offsetTop>=0 ? e.offsetTop : 0); 
			} while(e = e.offsetParent);
		} while( w != window && (e = w.frameElement) && e.tagName == "IFRAME" );
		return r;
	}

Element.prototype.getXY =  function () {
	var elem = this;
	var box = elem.getBoundingClientRect();

	var body = document.body;
	var docElem = document.documentElement;

	var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
	var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

	var clientTop = docElem.clientTop || body.clientTop || 0;
	var clientLeft = docElem.clientLeft || body.clientLeft || 0;

	var top  = box.top +  scrollTop - clientTop;
	var left = box.left + scrollLeft - clientLeft;

	return { x: Math.round(left), y: Math.round(top) }
}

!function(undef){
	if( document.createElement('div').firstElementChild===undef ){
		Object.defineProperty(Element.prototype, 'firstElementChild', {
			get : function () { // faster then this.children[0]
				var el = this.firstChild;
				while(el) { if(el.nodeType===1)	return el;
					el = el.nextSibling;
				}
				return null;
			}
		});
		Object.defineProperty(Element.prototype, 'lastElementChild', {
			get : function () {
				var el = this.lastChild;
				while(el) { if(el.nodeType===1) return el;
					el = el.previousSibling;
				}
				return null;
			}
		});
		Object.defineProperty(Element.prototype, 'nextElementSibling', {
			get : function () {
				var el = this.nextSibling;
				while(el) { if(el.nodeType===1) return el;
					el = el.nextSibling;
				}
				return null;
			}
		});
		Object.defineProperty(Element.prototype, 'previousElementSibling', {
			get : function () {
				var el = this.previousSibling;
				while(el){	if(el.nodeType===1) return el;
					el = el.previousSibling;
				}
				return null;
			}
		});
		Object.defineProperty(Element.prototype, 'childElementCount', {
			get : function () {
				var cnt = 0;
				for(var el = this.firstChild; el; el = el.nextSibling)
					if(el.nodeType===1) ++cnt;
				return cnt;
			}
		});
	}
}();

if (Object.defineProperty && Object.getOwnPropertyDescriptor &&
     Object.getOwnPropertyDescriptor(Element.prototype, "textContent") &&
    !Object.getOwnPropertyDescriptor(Element.prototype, "textContent").get)
  (function() {
    var innerText = Object.getOwnPropertyDescriptor(Element.prototype, "innerText");
    Object.defineProperty(Element.prototype, "textContent",
      { // It won't work if you just drop in innerText.get
        // and innerText.set or the whole descriptor.
        get : function() {
          return innerText.get.call(this)
        },
        set : function(x) {
          return innerText.set.call(this, x)
        }
      }
    );
  })();

Element.prototype.A = function(name) { return this.getAttribute(name || this.lastAttr ); }
Element.prototype.setA = function(name, v) { this.setAttribute(name || this.lastAttr , v); return this; }
Element.prototype.presentA = function(name, v) {
	if(v && !this.hasA(name)) this.setAttribute(name, '');
	if(!v && this.hasA(name)) this.removeAttribute(name);
	return this; 
}

Element.prototype.Ai = function(name) { return +this.A(name); }
Element.prototype.incA = function(name, diff) { diff = diff || 1; 
		var v = this.Ai(name); return this.setA(name, v + diff); 
	}
Element.prototype.hasA = function(name) { this.lastAttr = name; return this.A(name)!=null? this : null; }
Element.prototype.toggleA = function(name, val1, val2) { 
	var v = this.A(name);
	if(val2 != undefined)
		return this.setA(name, v == val1 ? val2 : val1);
	else
		if(v == val1)
			this.removeAttribute(name);
		else
			this.setAttribute(name, val1);
	return this;
}

Element.prototype.regE = function(name, str) {
	if(this.A('on'+name)) this.setA(this.getA('on'+name)+';'+str);
	else this.setA('on'+name, str);
	return this;
}

Element.prototype.evalHere = function(str, def) { 
	var r = eval(str && str.charAt(0)=='@'?this.A(str.substr(1)):str);
	return def !== undefined && (r === undefined || r === null)? def : r; 
}


Element.prototype.V = function() { 
	return this.tagName == "INPUT" && this.type=="checkbox"? (this.checked ? this.value : '')
		: this.tagName == "INPUT" || this.tagName == "TEXTAREA" || this.tagName == "SELECT" ? this.value 
		: this.textContent; 
}
Element.prototype.Vn = function() { return +this.V().replace(/\s/g,''); }
Element.prototype.Vi = function() { return parseInt(this.V()); }

Element.prototype.setV = function(v) {
	if(this.tagName == "INPUT" && this.type=="checkbox") this.checked = !!v;
	else if(this.tagName == "INPUT" || this.tagName == "SELECT") 
		this.setA('value', this.value = v);
	else if(this.tagName == "TEXTAREA")
		this.textContent = this.value = v;
	else this.textContent = v;
	return this;
}

Element.prototype.callchange = function() {
	if(this.onchange) this.onchange();
}

Element.prototype.insertBeforeIt = function(e) { this.parentNode.insertBefore(e, this); return e; }
Element.prototype.insertAfterIt = function(e) { this.parentNode.insertBefore(e, this.nextSibling); return e; }
Element.prototype.prependChild = function(e) { this.insertBefore(e, this.firstChild); return e; }
Element.prototype.removeIt = function() { this.parentNode.removeChild(this); return this; }
Element.prototype.closeIt = function(modalRet) {
	if(!this.hasA("multi")) {	
		if(this.hasA("display"))
			this.setD(false);
		else
			this.removeIt();
	}
	if(this.hasA("modal")) { 
		//window.currentModal = this.prevModal;
		if(this.covers)
			for(var i = 0; i < this.covers.length; ++i)
				this.covers[i].removeIt();
		this.covers = [];
		if(this.lastFocused) this.lastFocused.safeFocus();
	}
	if(this.defer) {
		var d = this.defer; this.defer = null;
		d.resolve(modalRet);
	}
	return this;
}

document.QS = Element.prototype.QS = function(s) { return this.querySelector(s); }
document.QSA = Element.prototype.QSA = function(s) { return this.querySelectorAll(s); }
document.QSattr = Element.prototype.QSattr = function(a, v) { 
		var r = v === undefined? this.QS('['+a+']') : this.QS('['+a+'="'+v+'"]'); 
		if(r) r.lastAttr = a;
		return r;
	}
	
Element.prototype.QSattrWide = function (a) {
		if(this.hasA(a)) return this;
		var e = this.firstElementChild;
		while(e && !e.hasA(a))
			e = e.nextElementSibling;
		if(e) return e;
		for(var e = this.firstElementChild; e; e = e.nextElementSibling) {
			var r = e.QSattrWide(a);
			if(r) return r;
		}
		return null;
	}

Element.prototype.QSattrPrevious =  function (a) {
		var lvl = this;
		var s;
		do {
			e = lvl;
			while(e = e.previousElementSibling)
				if(s = e.QSattrWide(a)) return s;
		} while(lvl = lvl.parentNode);
	}



Element.prototype.attrUpward = 
Element.prototype.UA = 
	function(attr, notempty) {
		var e = this;
		while(e && e.nodeType == 1 && 
			(!e.hasA(attr) || notempty && !e.A(attr))) 
			e = e.parentNode;
		if( e && e.nodeType == 1 ) { e.lastAttr = attr; return e }
		return null;
}
Element.prototype.tagUpward = 
Element.prototype.UT = 
	function(tag,attr) {
		var e = this;
		while(e && (e.tagName != tag || attr && !e.hasA(attr)))
			e = e.parentNode;
		return e && e.nodeType == 1 ? e : null;
}

Element.prototype.refreshDisplay = function() {}

Element.prototype.setD = function(st) {
	if(st === toggle)
		this.setD(this.A("display")=="N");
	else
		this.setA("display",st?"Y":"N");

	this.refreshDisplay();
	var a = this.QSA('[content-resizable]');
	for(var i = 0; i < a.length; ++i)
		X.autoResizeOnEvent(null, a[i]);

	return this;
}

Element.prototype.setDC = function(st) {
	if(st === toggle)
		this.setDC(this.A("display_content")=="N");
	else
		this.setA("display_content",st?"Y":"N");
	return this;
}

Element.prototype.setDN = function(st) {
	if(st === toggle)
		this.setDN(this.A("display_next")!="Y");
	else {
		var m = this.nextElementSibling;
		if(st && m.A('ref')) {
			var e = this;
			m.setA('ref-src', m.evalHere(m.V()));
			reloadElement(m).done(function(txt) { e.setDN(true); });
		} else {
			this.setA("display_next",st?"Y":"N");
			var a = m.QSA('[content-resizable]');
			for(var i = 0; i < a.length; ++i)
				X.autoResizeOnEvent(null, a[i]);
		}
	}
	return this;
}

Element.prototype.setDN_TR = function(st) {
	if(st === toggle)
		this.setDN_TR(this.A("display_next_row")!="Y");
	else {
		var m = this.nextElementSibling;
		if(st && m.A('ref')) {
			var e = this;
			m.setA('ref-src', m.evalHere(m.V()));
			reloadElement(m).done(function(txt) { e.setDN_TR(true); });
		} else {
			this.setA("display_next_row",st?"Y":"N");
			var this_tr = this.UT('TR');
			if(st) {
				var nr = document.createElement('TR');
				nr.className = 'transit_row';
				this_tr.insertAfterIt(nr);
				var td = document.createElement('TD');
				td.setAttribute('colspan', '100');
				nr.appendChild(td);
				td.appendChild(m);
				this.insertAfterIt(document.createElement('DIV'));
				var a = m.QSA('[content-resizable]');
				for(var i = 0; i < a.length; ++i)
					X.autoResizeOnEvent(null, a[i]);
				this_tr.presentA('joined_with_next_row', true);
			} else {
				var m = this_tr.nextElementSibling.firstChild.firstChild;
				this.nextSibling.removeIt();
				this.insertAfterIt(m);
				this_tr.nextElementSibling.removeIt();
				this_tr.presentA('joined_with_next_row', false);
			}
		}
	}
	return this;
}

Element.prototype.setTabCurrent = function(attr, state) {
	var e = this.attrUpward('tabheader').QS('[tabcurrent]');
	if(e) e.removeAttribute('tabcurrent');
	this.setAttribute('tabcurrent', '');	
	this.attrUpward(attr).setA(attr, state);
	X.resizeAllResizable(this.attrUpward(attr));
}

Element.prototype.safeFocus = function () { this.focus(); }

Element.prototype.showXModal = function() {
	this.setA("modal", 'Y').setD(true);
	
	this.covers = [];
	for(var e = this;  e && e.offsetParent; e = e.offsetParent) {
		var cover = document.createElement("DIV");
		cover.className = "coverBox";
		if(!e.offsetParent.offsetParent)
			cover.style.position = 'fixed';
		e.insertBeforeIt(cover);
		this.covers.push(cover);
	}

	this.lastFocused = g_lastFocusedElement;
	//this.prevModal = window.currentModal;
	//window.currentModal = this;

	//this.style.zIndex = this.prevModal? +this.prevModal.style.zIndex + 2 : 10000;
	//this.cover.style.zIndex = +this.style.zIndex - 1;

	var tf = this.tofocus || this.QS("A,INPUT,TEXTAREA,SELECT");
	if(!tf) {
		tf = document.createElement('A');
		tf.href = 'javascript:undefined';
		this.prependChild(tf);
	}
	tf.safeFocus();
	this.defer = X.new_defer();
	return this.defer.promice;
}

Element.prototype.closeModal = function(ret) { this.attrUpward('modal').closeIt(ret); }

function blockEvent(e) {
	if (e.stopPropagation) e.stopPropagation()
	else e.cancelBubble=true
	if (e.preventDefault) e.preventDefault()
	else e.returnValue = false
	return e;
}
function stopPropagation(e) {
	if (e.stopPropagation) e.stopPropagation()
	else e.cancelBubble=true
}
function getMouseDocPos(e) {
	var posx = 0;
	var posy = 0;
	if (!e) var e = window.event;
	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	}
	else if (e.clientX || e.clientY) 	{
		posx = e.clientX + document.body.scrollLeft
			+ document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop
			+ document.documentElement.scrollTop;
	}
	// posx and posy contain the mouse position relative to the document
	return { x: posx, y: posy };
}

//globalEvents

/*@cc_on
(function() {
	function f() {
			//var a = document.getElementsByTagName("*");
			//for(var i = 0; i < a.length; ++i)
			//	a[i].className = a[i].className;
			var df = f.fc;
			f.fc = null;
			if(df) 
				try { df.focus(); }
				catch(e) { f.fc = df; }
		}
	Element.prototype.safeFocus = function () { 
		try { this.focus(); }
		catch(e) { f.fc = this; }
	}
	Element.prototype.refreshDisplay = function() {
			if(this.style) this.className = this.className
			for(var v = this.firstElementChild; v; v = v.nextElementSibling)
				v.refreshDisplay()
	}
	setInterval( f, 100);
})();
@*/


function G_regEvent(name, phase, f) {
	var freg = function(event) {
		var e = event || window.event;
		var target = e.target || e.srcElement;
		f(e, target);
	}
	var obj = { message: window, load: window, popstate: window }[name] || document;
	if (obj.addEventListener) obj.addEventListener(name, freg, phase);
	else if( obj.attachEvent ) obj.attachEvent('on'+(name==='focus'?'focusin':name), freg);
}

var g_lastFocusedElement = null;
G_regEvent('focus', true, function ( e, togo ) {
	//X.log(togo,window.g_lastFocusedElement);
		if(togo) {
			if(window.g_lastFocusedElement && 
				window.g_lastFocusedElement.attrUpward("modal") &&
				window.g_lastFocusedElement.attrUpward("modal").A('display')==='Y' &&
				!(togo.attrUpward && togo.attrUpward("modal"))
						//FIXME: we should prevent fcous stealing with another modal!
				)
				window.g_lastFocusedElement.focus();
			else
				if(togo.attrUpward)
					window.g_lastFocusedElement = togo;
			//X.log(togo, document.activeElement);
		}
});

G_regEvent('click', false, function ( e, elm ) {
	//X.log('cl', e, elm);
	if(elm.hasA("close-box")) {
		var etest = document.createElement("DIV");
			etest.id = "testPopuframe";
			etest.style.top = 0;
			etest.style.left = "-1px";
			etest.style.height = "0px";
			etest.style.width = elm.offsetWidth+"px";
			etest.setA("close-box","Y");
		elm.prependChild(etest);
		var tst = document.elementFromPoint(e.clientX,e.clientY);
		etest.removeIt();
		if(tst && tst.id == etest.id)
			elm.closeIt();
	
	} 
	else if(elm.className == "coverBox") {
		var qc = g_lastFocusedElement && 
			g_lastFocusedElement.attrUpward("modal") && 
			g_lastFocusedElement.attrUpward("modal").hasA("quick-close");
		if(qc)
			qc.closeIt();
	}
});

G_regEvent('keydown', false, function ( e, elm ) {
	if(e.keyCode == 27) {
		var ec = elm.attrUpward("quick-close") || elm.attrUpward("close-on-esc");
		if(ec)
			ec.closeIt();
	}
});

G_regEvent('mousedown', false, function (e, elm) { 
	if(elm.tagName == "TEXTAREA")
		elm.stv = elm.offsetWidth + "x" + elm.offsetHeight; 
});
G_regEvent('mouseup', false, function (e, elm) { 
	if(elm.tagName == "TEXTAREA")
		if(elm.stv != elm.offsetWidth + "x" + elm.offsetHeight) recalcParentSize(); 
});


String.prototype.URLParam = function (param, def)
	{
		var url = this;
		var re = new RegExp( "[?&]" + param + "=([^&]*)" );
		var mm = url.match(re);
		if( mm )
			return decodeURIComponent( mm[1] );
		return def;
	}

String.prototype.setURLParam =  function( param, val )
	{
		var url = this;
		if( !param )
			alert( "SetUrlParam: empty param name" )

		val = encodeURIComponent( val );

		var re = new RegExp( "(.*[?&]" + param + "=)[^&]*(.*)" );
		var m;
		if(m = url.match(re))
			return m[1] + val + m[2];
		m = url.match(/^(.*\?)(.*)/)
		return (m? m[1] + m[2].Div("&") : url+"?")
			+ param + "=" + val;
	}

Number.prototype.pad = function(n) { var s = ('000000000000000000000000000000000000000000000000000000000000').slice(-n); 
		return (s + this.toString()).slice(-n);  }
Number.prototype.prettyFormat = function(digits, delims) {
	if(isNaN(this)) return "";
	delims = delims || " .";
	var m = this.toString().match(/(\d*)(?:\.(\d*))?/);
	var m1 = m[1] || "0";
	var m2 = m[2] || "";
	m1 = m1.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1'+delims[0])
	if(digits && m2.length > digits) { 
		var m2x = (+m2.substr(0,digits+1) + 5)/10;
		m2 = m2x.toString();
	}
	return m1+(m2?(delims[1]||".")+m2:"");
}

// modal
//	1) close on click outside / lost focus on window (no close button)
//	2) close with button and esc
//	3) close with button only
//	if 2-3 open when 1 open, it closed!
//	submenu hover or click and download

var X = {};
X.isFunction = function(obj) { return typeof obj === 'function'; }
X.isObject = function(obj) { return obj === Object(obj); }
X.isArray = Array.isArray || function(obj) { return {}.toString.call(obj) == '[object Array]'; }
X.isEmpty = function(val) { return val === undefined || val === null || val === ""; }
X.isRegExp = function(obj) { return {}.toString.call(obj) == "[object RegExp]"; }

if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (!X.isFunction(this)) {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }
    var fToBind = this, 
        fNOP = function () {},
        nThis = this instanceof fNOP && oThis
                         ? this
                         : oThis;

    if(arguments.length==1)
    var fBound = function () {
          return fToBind.apply(nThis, arguments);
        };
    else {
    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fBound = function () {
          return fToBind.apply(nThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };
    }
 
    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();
 
    return fBound;
  };
}

X.log = function() {
	if(window.console && window.console.log && window.console.log.apply)
		window.console.log.apply(window.console, arguments);
}

X.test_seq = 0;

X.asyncCall = (function() {
		var dc = "defer call";
		var msgs = [];

		G_regEvent('message', false, function(e) {
			if(/*e.source == window &&*/ e.data === dc) {
				var nmsgs = msgs.splice(0,msgs.length);
				var f;
				while(f = nmsgs.shift()) 
					try {
						//X.log('AM', f.test_seq, f.debug_marker);
						f();
					} catch(err) {
						X.log("async:", err);
					}
			}
		});

		return function(f, deb) {
			f.test_seq = ++ X.test_seq;
			f.debug_marker = deb;
			//X.log('AC', f.test_seq, deb);
			if (!X.isFunction(f))
				throw new TypeError("asyncCall - what is trying to be used for not callable");
			if(msgs.push(f)==1)
				window.postMessage(dc, "*")
		}
	})();
X.asyncCall.window = window;
	
(function(){
		//if(window.setImmediate)
		//	X.asyncCall = window.setImmediate.bind(window);
		var atest = true;
		X.asyncCall(function() { atest = false; });
		if(!atest) X.asyncCall = function(f) { window.setTimeout(f, 0); }
})();

X.new_defer = function() {
		function check(promice) {
			if(promice.then.done)
				throw "resolving alredy resolved promice";
		}
		var process;
		function new_promice() {
			return { then: function (ok,err) 
				{ if(!this.then.calls) this.then.calls = [];
					var ret = new_promice();
					this.then.calls.push(
						{resolve: ok, reject: err, ret: ret }
					)
					if(this.then.done) {
					  //alredy processed
					  X.asyncCall( 
					    process.bind(this, this.then.done, this.then.value, true) 
					  );
					}
					return ret;
				},
			  fail: function(f) { return this.then(null, f) },
			  done: function(f) { return this.then(f, null) }
			}
		}
		process = function(reason, val, again) { !again && check(this);
			var then = this.then;
			if(!then.calls && !then.chain && reason === 'reject')
				throw val;
			//console.log('process '+reason)
			then.done = reason;
			then.value = val;
			var calls = then.calls ? then.calls.splice(0,then.calls.length) : [];
			var e;
			while(e = calls.shift()) {
				var nreason = reason;
				var nval = val;
				if(e[reason])
					try {
						nval = e[reason](val);
						nreason = 'resolve';
					} catch(err) { 
						nval = err; 
						nreason = 'reject';
					}
				if (nval && X.isFunction(nval.then)) {
					//chain
					nval.then.chain = e.ret;
				} else
					process.call(e.ret, nreason, nval);
			}
			if(then.chain)
				process.call(then.chain, reason, val); 
		}
	return {
		resolve: function(val) { check(this.promice);
			X.asyncCall( process.bind(this.promice, 'resolve', val ) );
		},
		reject: function(val) { check(this.promice);
			X.asyncCall( process.bind(this.promice, 'reject', val ) );
		},
		promice: new_promice()
	}
}

X.delay = function(ms) {
	var df = X.new_defer();
	setTimeout(df.resolve.bind(df) , ms);
	return df.promice;
}

X.defer = function(val) {
	var df = X.new_defer();
	X.asyncCall( df.resolve.bind(df, val), 'defer' );
	return df.promice;
}

Function.prototype.once = function() {
	var fn = this;
	var called = false;
	var value;
	return function() {
		if(called) return value;
		called = true;
		return value = fn.apply(this, arguments);
	}
}

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  //
X.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
X.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };
  
X.joinPromices = function(p1, p2) {
	var df = X.new_defer();
	var v = { p1: null, p2: null }
	p1.then(
		function(x) { v.p1 = true; v.first = x; if(v.p2 !== null) if(v.p2) df.resolve(v); else df.reject(v) } 
		, function(x) { v.p1 = false; v.first_error = x; if(v.p2 !== null) df.reject(v) } 
		)
	p2.then(
		function(x) { v.p2 = true; v.second = x; if(v.p1 !== null) if(v.p1) df.resolve(v); else df.reject(v) } 
		, function(x) { v.p2 = false; v.second_error = x; if(v.p1 !== null) df.reject(v) } 
		)
	return df.promice;
}

X.XHR = function(method, url, content, headers) {
	var df = X.new_defer();

	var xhr = new XMLHttpRequest();
	xhr.open(method, url, true);
	if(headers)
		for(var i in headers)
			xhr.setRequestHeader(i, headers[i]);
	//xhr.setRequestHeader("",)//accept and so on
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
//??	xhr.send(content || null);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState === 4) { // request complete
		if (xhr.status === 200 || xhr.status === 0 && xhr.responseText) {
			// done
			//TODO: md5 check
			df.resolve(xhr.responseText);
		}
		else { // fail
			df.reject(xhr.status+" "+xhr.statusText);
		}
	  }
	}
	xhr.send(content || null); //??
	df.promice.object = xhr;
	return df.promice;
}

X.XHRsync = function(method, url, content, headers) {
	var xhr = new XMLHttpRequest();
	xhr.open(method, url, false);
	if(headers)
		for(var i in headers)
			xhr.setRequestHeader(i, headers[i]);
	//xhr.setRequestHeader("",)//accept and so on
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	//??xhr.send(content || null);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState === 4) { // request complete
		if (xhr.status === 200 || xhr.status === 0 && xhr.responseText) {
			// done
			//TODO: md5 check
		}
		else { // fail
			throw (xhr.status+" "+xhr.statusText);
		}
	  }
	}
	xhr.send(content || null); //??
	return xhr.responseText;
}

X.mixin = function(def, o) {
	for(var i in def)
		if(def.hasOwnProperty(i))
			o[i] = def[i]
	return o;
}
X.clone = function(src) {
	if(Object(src)!==src) return src;
	return X.mixin(src, src.constructor());
}
X.extend = function(src, dst) { return X.mixin(src, X.clone(dst)); }

X.OID = (function() { var oid = 0; 
	return function(obj) { return obj.oid || (obj.oid = "-" + ++oid); }
})();

/*
CID рассчитан на случай, когда храним числами
число получается так
SID.patform+CID
*/

X.cid = {
	seq: 0,
	reset: function() { this.seq = 0; },
	make: function() {
		var r = Object(++this.seq);
		r.cidArea = this;
		r.toJSON = function() { 
			var c = this.cidArea.seq.toString();
			return {cid: "0."+this.cidArea.platform+this.valueOf().toString().lpad(c.length,'0') }; 
		}
		return r;
	},
	platform: "000"
}

function date(y,m,d) { return new Date(y,m-1,d); }
function today(y, m, d) { var t = new Date(); return new Date(t.getFullYear()+(y||0),t.getMonth()+(m||0),t.getDate()+(d||0)); }
function this_year() { return (new Date()).getFullYear(); }

Date.smartParse = function (s, as_struct) {
	if(!s) return null;
	var parsed = {y:null,m:null,d:null,h:null,mm:null,s:null}
	//matching date
	if(s.match(/\b(\d|\d\d)[ .\/-](\d{1,2})[ .\/-](\d{4})\b/)) {
		parsed.y = parseInt(RegExp.$3,10)
		parsed.m = parseInt(RegExp.$2,10)
		parsed.d = parseInt(RegExp.$1,10)
	}
	else
	if(s.match(/\b(\d{4})[.-](\d{1,2})[.-](\d|\d\d)\b/)) {
		parsed.y = parseInt(RegExp.$1,10)
		parsed.m = parseInt(RegExp.$2,10)
		parsed.d = parseInt(RegExp.$3,10)
	}
	
	if(s.match(/\b(\d|0\d|1\d|2[0-3]):([0-5]\d)(:([0-5]\d))?\b/)) {
		parsed.h = parseInt(RegExp.$1,10)
		parsed.mm = parseInt(RegExp.$2,10)
		if(RegExp.$4)
			parsed.s = parseInt(RegExp.$4,10)
	}
	//value with human understanding of month numbers (1-12)
	return as_struct? parsed :
		new Date(parsed.y, parsed.m-1, parsed.d, parsed.h, parsed.mm, parsed.s);
}

Date.prototype.formatDate = function (fmt) {
	var d = this;
	if(fmt === "DMY")
		return (d.getDate()+100+"").substr(1) + '.' + (d.getMonth()+101+"").substr(1) + '.' +d.getFullYear();
	return d.getFullYear() + "-" + (d.getMonth()+101+"").substr(1) + "-" + (d.getDate()+100+"").substr(1);
}
Date.prototype.formatDateTime = function (fmt) { var d = this; return d.formatDate(fmt) + ' ' + d.getHours().pad(2) + ':' + d.getMinutes().pad(2); }
Date.prototype.formatDateTimeSec = function (fmt) { var d = this; return d.formatDateTime(fmt)  + ':' + d.getSeconds().pad(2); }


X.createTextPlace = function (e)
	{
		var tp = document.createElement("DIV")
		tp.style.visibility = "hidden"
		tp.style.whiteSpace = "pre"
		tp.style.position = "absolute"
		document.body.appendChild(tp)
		var st = e.currentStyle?e.currentStyle : getComputedStyle(e,"font")
		for(var cc in st)
			if(cc.match(/^font./))
				tp.style[cc] = st[cc]
		return tp;
	}

X.resizeInput = function (e) {
		var tp = X.createTextPlace(e)
		var tn = document.createTextNode(e.value)
		tp.appendChild(tn)
		var s = tp.offsetWidth
		tp.removeChild(tn)
		var mw = e.readOnly ? 1 : 100
		if(e.A("minw")) {
			var tn = document.createTextNode(e.A("minw"))
			tp.appendChild(tn)
			mw = tp.offsetWidth
			tp.removeChild(tn)
		}
		s = Math.max(s,mw);
		e.style.width = (s+10)+"px"
		//if("value" in e) e.value = e.value;
		tp.removeIt();
		recalcParentSize();
	}
X.rta = 0;
X.resizeTextArea = function (e) {
		++X.rta;
		e.style.overflow = 'hidden';
		e.style.width = '100%';
		e.style.width = e.offsetWidth+'px';
		e.style.height = '14px';
		var sh = -1;
		while(sh < e.scrollHeight) 
			sh = e.scrollHeight;
		e.style.height = (sh+5)+'px'
		e.style.width = '100%';
		e.style.overflowX = 'auto';
		e.style.overflowY = 'hidden';
		recalcParentSize();
	}
X.resizeFuncTable = {
		'INPUT':X.resizeInput,
		'input':X.resizeInput,
		'TEXTAREA':X.resizeTextArea,
		'textarea':X.resizeTextArea
	}
X.autoResizeOnEvent = function(e, ele) {
		var f;
		if(ele.hasA("resize-handler")) {
			f = ele.evalHere("@resize-handler");
		} else
			f = X.resizeFuncTable[ele.tagName];
		if(!f || !ele.hasA('content-resizable')) return;
		if(ele || e.keyCode==35 || e.keyCode==36 || e.keyCode==13) {
			X.defer(ele).done(f);
		}
	}
X.args = function(args,src) { for(var i=0;i<args.length;++i) args[i] = src[i] }

G_regEvent('keydown', false, X.autoResizeOnEvent);

function recalcParentSize() { /*stub*/}

function copyScript(e, dst, wnd) {
	var df = X.new_defer();
	if(e.src) {
		if(!wnd.document.querySelector('SCRIPT[src="'+e.getAttribute('src')+'"]')) {
			e.onload_func = function(s) { 
				  if (!s.done && (!s.readyState || s.readyState.match(/loaded|complete/))) {
					s.onload = s.onreadystatechange = null;
					s.done = true;
					df.resolve();
				  }
			  }
			var s = wnd.document.createElement("SCRIPT");
			s.type = e.type;
			s.done = false;
			s.onload = s.onreadystatechange = function() { e.onload_func(s); }
			s.src = e.src;
			dst.parentNode.insertBefore(s, dst);
			return df.promice;
		}
	} else {
		var s = wnd.document.createElement("SCRIPT");
		s.id = e.id;
		s.type = e.type;
		s.text = e.innerHTML;
		dst.parentNode.insertBefore(s, dst);
	}
	df.resolve();
	return df.promice;
}

function unframeWithXHR(url) {
	var frame = frameElement;
	var pw = parent;
	if(pw.document.getElementById('tinymce')) {
		B().innerHTML = location.search;
		return;
	}
	X.XHR('GET', url).done(function(html) {
		//var m = html.match(/[<]HEAD(\s[^>]*)?>([\s\S]*)(<\/HEAD>)?/i)//m[2]
		var m = /[<]head>([\s\S]*?)(?:<\/head>|<body>)/ig.exec(html);
		var p = X.defer();
		if(m) {
			var te = document.createElement("DIV");
			te.innerHTML = /*@cc_on "<div>ie8 visible elem before script and link tags</div>"+@*/m[1];
			for(var e = te.firstChild; e; e = e.nextSibling)
				if(e.tagName == 'STYLE' || e.tagName == 'LINK')
					frame.parentNode.insertBefore(e.cloneNode(true), frame);
				else if(e.tagName == 'SCRIPT')
					p = X.joinPromices(p, copyScript(e, frame, pw));
		}
		return X.joinPromices(p, X.defer(html));
	}).done(function(v) { var html = v.second;
		var d = pw.document.createElement('DIV');
		frame.parentNode.insertBefore(d, frame);		
		pw.setBodyToContaner(d, html);		
		var sa = d.querySelectorAll('SCRIPT');
		var sat = []; for(var  i = 0; i < sa.length; ++i) sat.push(sa[i]);
		for(var  i = 0; i < sat.length; ++i)
		{
			if(
				sat[i].type == 'text/javascript'
				&&
				sat[i].getAttribute('safe-to-copy')==null
			) {
				alert('unsafe script inside copied body');
				throw 'unsafe script inside copied body'+sat[i];
			}
			copyScript(sat[i], sat[i], parent); //async
			sat[i].parentNode.removeChild(sat[i]);
		}
		pw.X.resizeAllResizable(d);
		pw.prepareControls(d, true);
		
		frame.parentNode.removeChild(frame);
	})	
}

function unframe(frame_or_event) {
	//X.log("UF-first");
	if(frame_or_event && !frame_or_event.tagName) { //from onload with event
		if(frameElement.getAttribute('unframe') == null 
			&& !frameElement.name.match(/^unframe-/)
			&& !frameElement.title.match(/^unframe-/)
		) return;
		if(parent.document.getElementById('tinymce')) {
			B().innerHTML = location.search;
			return;
		}
		//X.log("UF-defer");
		X.asyncCall(unframe);
		return;
	}
	var frame = frame_or_event || frameElement;
	var framewnd = frame.contentWindow;
	//X.log("UF-real");
	var pw = framewnd.parent;
	//copy head
	var h = framewnd.document.head;
	var p = X.defer();
	
	for(var e = h.firstChild; e; e = e.nextSibling)
		if(e.tagName == 'STYLE' || e.tagName == 'LINK')
			frame.parentNode.insertBefore(e.cloneNode(true), frame);
		else if(e.tagName == 'SCRIPT')
			p = X.joinPromices(p, copyScript(e, frame, pw));

	p.done(function() {
		//copy body
		var d = pw.document.createElement(frame.getAttribute('unframe') || 'DIV');
		/*@cc_on d.innerHTML = framewnd.document.body.innerHTML; @*/
		frame.parentNode.insertBefore(d, frame);
		var te = framewnd.document.body;
		for(i = 0; i < te.attributes.length; ++i) {
			d.setAttribute(te.attributes[i].nodeName, te.attributes[i].nodeValue)
		}
		/*@cc_on if(false) @*/		
		d.innerHTML = framewnd.document.body.innerHTML;
		
		var sa = d.querySelectorAll('SCRIPT');
		var sat = []; for(var  i = 0; i < sa.length; ++i) sat.push(sa[i]);
		for(var  i = 0; i < sat.length; ++i)
		{
			if(sat[i].getAttribute('safe-to-copy')==null) {
				alert('unsafe script inside copied body');
				throw 'unsafe script inside copied body'+sat[i];
			}
			copyScript(sat[i], sat[i], pw);
			sat[i].parentNode.removeChild(sat[i]);
		}
		pw.X.resizeAllResizable(d);
		frame.parentNode.removeChild(frame);
	});
}

if(frameElement)
	G_regEvent('load', false, unframe);

X.resizeAllResizable = function(d) {
	var cs = d.QSA('[content-resizable]');
	for(var i = 0; i < cs.length; ++i)
		X.autoResizeOnEvent(null, cs[i]);
}

X.XHRfeedback = function(e, method, url, content, headers) {
	var n = document.createElement('DIV');
	n.className = 'loader';
	e.appendChild(n);
	var r = X.XHR(method, url, content, headers);
	var r1 = r.then(function(txt) { e.removeChild(n); return txt; }
			,function(txt) { e.removeChild(n); /*alert(txt);*/ throw txt; });
	r1.object = r.object;
	return r1;
}

function setBodyToContaner(e, html) {
	var m = html.match(/[<]BODY(\s[^>]*)?>([\s\S]*)(<\/BODY>)?/i)
	var body = m ? m[2].replace(/<\/BODY>\s*$/i,"") : html;
	var attrs = m && m[1] || "";
	//e.innerHTML = body;
	//e.innerHTML = '';
	var te = document.createElement("DIV");
	te.innerHTML = "<DIV "+attrs+"></DIV>";
	te = te.firstChild;
	for(var i = 0; i < te.attributes.length; ++i)
		e.setAttribute(te.attributes[i].nodeName, te.attributes[i].nodeValue)
	//te.innerHTML = body;
	e.innerHTML = body;
	//e.innerHTML = te.innerHTML;
	//e.innerHTML = '';
	//for(var i = te.firstChild; i; i = i.nextSibling)
	//	e.appendChild(i.cloneNode(true))
	e.evalHere("@onload");
}

function reloadElement(m) {
	m = m.attrUpward('ref-src');
	var u = m.A('ref')=='E' ? m.A('ref-src').evalParts(m) : m.A('ref-src');
	return X.XHR('GET', u)
		.done(function(txt) {
			m.setA('ref', '');
			setBodyToContaner(m, txt);
			prepareControls(m);
		});
}

Element.prototype.setTimer = function(id, func, ms) {
	var tid = 'timer-'+id;
	var e = this;
	if(this[tid]) {
		window.clearTimeout(this[tid])
	}
	if(ms!==undefined)
		this[tid] = window.setTimeout(
			func || 
			function() { e.evalHere('@on'+tid) }
			, ms
		)
}

Element.prototype.evalLink = function(event) {
	blockEvent(event);
	open(this.A('href').evalParts(this), this.A('target') || '_self');
}

X.lightEdit = function (e, event) {
	if(!(event instanceof Event)) {
		e.setA('lightedit-value', e.lighteditValue = event);
		e.evalHere('@onchange-lightedit');
		return;
	}
	var v = e.A('lightedit-value');
	if(event.type == "keydown") {
		if(!e.lighteditKeypress) {
			e.lighteditKeypress = function(ev){ return X.lightEdit(e, ev||window.event); };
			if (e.addEventListener) e.addEventListener( 'keypress', e.lighteditKeypress, false);
			else if( e.attachEvent ) e.attachEvent('onkeypress', e.lighteditKeypress);
		}
		//X.log('ev:KD:'+event.keyCode);
		switch(event.keyCode)
		{
			case 8: 
				X.lightEdit(e, v && v.substr(0,v.length-1) || '')
				blockEvent(event); break;
			case 13: 
				//blockEvent(event); 
				break;
			case 32:
				X.lightEdit(e, (v||'')+' ')
				blockEvent(event); 
				break;
			case 27: 
				X.lightEdit(e, '')
				blockEvent(event); break;
		}
		e.setTimer('clear-lightedit', function(){ 
			X.lightEdit(e, '')
		}, 1000);
	}
	else if(event.type=="keypress") {
		//X.log('ev:KP:'+event.keyCode)
		if(event.charCode)
			X.lightEdit(e, (v||'')+String.fromCharCode(event.charCode))
		blockEvent(event); 
	}
}


function prepareControls() { /*stub*/ }

X.requestSeqNum = function() {
	var s = +((document.cookie.match(/seq=(\d+)/) || [0,0])[1]);
	document.cookie = 'seq='+(s+1);
}

function STYLE_MODE(s)
{
	document.cookie = "OWNSTYLE="+s+"; path=/";
	return "Own style is "+(s ? s : "empty");
}
function DEBUG_MODE(on)
{
	on = on ? "true" : "";
	document.cookie = "DEBUG_MODE="+on+"; path=/";
	return "Debug mode is "+(on ?"ON":"OFF");
}

String.prototype.clean_pocket_replace = function(re, nv) {
	''.match(/-?/);
	return this.replace(re, nv);
}

X.callNearestHK = function (e, hk) {
	var b = null;
	for(;e; e = e.parentNode) {
		var a = e.QSA('[hotkey^="'+hk+'"]')
		for(var i =0; i < a.length; ++i) 
		if(a[i].getClientRects().length)
		{
			var h = a[i];
			if(h.A('hotkey')==hk) {
				if(h.hasA('onhotkey'))
					h.evalHere('@onhotkey', hk)
				else
				{
					    if (h.click) h.click();
					    else if (h.dispatchEvent) {
						var evt = document.createEvent("MouseEvents");
						evt.initMouseEvent("click", true, true, window,
						    0, 0, 0, 0, 0, false, false, false, false, 0, null);
						h.dispatchEvent(evt);
					    }
				}
				return false;
			}
			b = true;
		}
	}
	return b;
}

G_regEvent('keydown', true, function(event, e) {
//http://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
//http://www.openjs.com/scripts/events/keyboard_shortcuts/shortcut.js
//http://www.asquare.net/javascript/tests/KeyCode.html
	
	var kk = event.keyCode;
	var leaders = [];
	leaders[27] = 'ESC'
	leaders[192] = 'Ctrl-`'
	leaders[219] = 'Ctrl-['
	leaders[221] = 'Ctrl-]'
	leaders[186] = 	leaders[59] = 'Ctrl-;'
	leaders[222] = 'Ctrl-\''
	leaders[188] = 'Ctrl-,'
	leaders[190] = 'Ctrl-.'
	leaders[191] = 'Ctrl-/'
	leaders[220] = 'Ctrl-\\'

	if(!I('global-shortcut-helper') && leaders[kk] && (kk == 27 || event.ctrlKey)
		) { 
		if(!X.callNearestHK(document.activeElement, leaders[kk])) {
			blockEvent(event);
			return;
		}
		blockEvent(event);
		var ind = document.createElement('DIV');
		ind.id = 'global-shortcut-helper';
		ind.textContent = leaders[kk];
		B().appendChild(ind);
		ind.setTimer('cancel', function() { ind.removeIt(); }, 1000)
	} else {
		var ind;
		if(ind = I('global-shortcut-helper')) {
			var character = String.fromCharCode(kk).toLowerCase();
			
			var decoder = []
			decoder[186] = ';'
			decoder[187] = '+'
			decoder[188] = ','
			decoder[189] = '-'
			decoder[190] = '.'
			decoder[191] = '/'
			decoder[192] = '`'
			decoder[219] = '['
			decoder[220] = '\\'
			decoder[221] = ']'
			decoder[222] = '\''
			
			character = decoder[kk] || character;
			
			var s = ind.textContent + character;
			var hk = X.callNearestHK(document.activeElement, s);
			if(hk) {
				blockEvent(event);
				ind.textContent = s;
				ind.setTimer('cancel', function() { ind.removeIt(); }, 1000)
			} else {
				blockEvent(event);
				ind.setTimer('cancel');
				ind.removeIt();
			}
		}
	}
})
var d2 = (function() {
	function map(arr, func, context) { var x = []; for(var i=-1;++i<arr.length;) x.push( func.call( context || this, arr[i], i ) ); return x }
	function each(arr, func, context) { for(var i=-1;++i<arr.length;) func.call( context || this, arr[i], i ) }
	function make_elems( e ) { return map(e, function(d) { return new d2elem(d) }) }
	function d2elem( o ) {
		var self = this;
		self.elem = o;
		self.defunc = function(val) { return X.isFunction(val) ? val.call( self.elem, self.__data__, self.__i__ ) : val }
		self.J = function(d, i) {//join
			if(!arguments.length)
				return self.__data__;
			self.__data__ = d;
			self.__i__ = i;
			return self;
		}
		self.A = function(attr, value) {//attribute
			if(!self.elem) return self;
			if( value === undefined )
				return self.elem.A( attr );
			value = self.defunc( value );
			if(value === null || value === undefined)
				self.elem.removeAttribute(attr);
			else
				self.elem.setA(attr, value);
			return self;
		}
		self.H = function(html) { if(self.elem) {
				var before = self.elem.nextElementSibling;
				var parent = self.elem.parentNode;				
				parent.removeChild(self.elem);
				self.elem.innerHTML = self.defunc( html );
				parent.insertBefore(self.elem, before || null);
			}
			return self 
		}
		self.T = function(text) { 
			if(self.elem) {
				if(self.elem.textContent != undefined) {
					self.elem.textContent = self.defunc( text )
				}
				else if(self.elem.innerText != undefined)
					self.elem.innerText = self.defunc( text ); 
			}
			return self 
		}
		self.E = function() { return !self.elem }
		self.N = function() { return self.elem }
		self.V = function(v) {
			if(!self.elem) return self;
			if(v !== undefined) {
				self.elem.setV(v);
				return self;
			} else 
				return self.elem.V();
		}
		self.FOR = function(f) { f.call(self.elem, self.__data__, self.__i__); return self }
		self.CK = function(f,value) {//click
			if(!self.elem) return self;			
			if(value===undefined || self.defunc( value )) {
				self.elem.__click__ = function( ev ) { d2.event = ev; f.call(self.elem, self.__data__, self.__i__ ) };
				self.A("onclick", "return d2.CK( this, event || window.event )");
			}			
			return self
		}
		self.AP = function(tag) { return self.IN(tag) }
		self.IN = function(tag, b) {//insert
			if(!self.elem) return self;
			var e = document.createElement(tag);
			self.elem.insertBefore(e, X.isFunction(b) ? b.call(self.elem, self.__data__, self.__i__) : b || null);
			return new d2elem( e ).J(self.__i__, self.__data__);
		}
		self.R = function() { if(self.elem) self.elem.parentNode.removeChild(self.elem); return self }
		self.SA = function( s ) { return new d2actor( make_elems( self.elem.QSA( s ) ), self) }
		self.S = function( s ) { return new d2elem( self.elem.QS( s ) ).J(self.__i__,self.__data__) }
		return self;
	}
	function d2actor(elems, cont) {
		var self = this;
		self.cont = cont;
		self.elems = elems;
		self.FOR = function(f) { each(self.elems, function(e) { e.FOR(f) }); return self }
		self.H = function(html) { each(self.elems, function(e) { e.H(html) }); return self }
		self.A = function(attr, value) { each(self.elems, function(e) { e.A(attr, value) }); return self }
		self.T = function(text) { each(self.elems, function(e) { e.T(text) }); return self }
		self.E = function() { return !self.elems.length }
		self.V = function(value) { each(self.elems, function(e) { e.V(value) }); return self }
		self.CK = function(f,value) { each(self.elems, function(e) { e.CK(f,value) }); return self }
		self.N = function() { return self.elems[0] && self.elems[0].N() }
		self.AP = function(tag) {
			self.elems = map(self.elems, function(d, i) {
				var x;
				if(d && d.cont)
					x = d.AP( tag ).J( d.__data__ )
				else
					x = (d || self.cont).AP(tag).J( self.__data__ && self.__data__[i], i )
				return x 
			});
			return self
		}
		self.R = function() { each(self.elems, function(e) { e.R() }); return self }
		self.J = function(arr) {
			self.__data__ = X.isFunction(arr) ? self.__data__ : arr;
			each( self.__data__, function(d, i) { if(i >= self.elems.length) self.elems.push( undefined ) } );
			each( self.__data__, function(d, i) { 
				self.__data__[i] = X.isFunction(arr) ? map(d, function(dd) { return arr.call(this, dd, i) }) : d} );
			each( self.__data__, function( d, i ) { self.elems[i] && self.elems[i].J( d, i ) });
			return self
		}
		self.SA = function( s ) { return new d2actor(map(self.elems, function(d, i) { return d.SA( s ) }), self.cont).J(self.__data__) }
		return self;
	}
	function select( s ) { return new d2elem( X.isObject(s) ? s : document.QS( s ) ) }
	function selectall( s ) { return new d2actor( make_elems( document.QSA( s ) ), d2elem( document.body ) ) }
	return {
		S:select,
		SA:selectall,
		CK: function(o, e) { return o.__click__.call(o, e) }
	}
})();

