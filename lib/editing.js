function findSaveCmd(e) {
	while(e && !e.getAttribute("cmd"))e = e.parentNode;
	return e && e.getAttribute("cmd");
}
function findRid(e) {
	while(e && !e.getAttribute("rid"))e = e.parentNode;
	return e && e.getAttribute("rid");
}
function findSaveCmdElem(e) {
	while(e && !e.getAttribute("cmd"))e = e.parentNode;
	return e;
}


function makeSaveFunc(obj, rid, v, title) {
	return function(req) {
		var txt = req.responseText;
		var m;
		if(m = txt.match(/^E: (.*)/))
			alert("Error: " + m[1]);
			// revert?
		else if(m = txt.match(/^D:/)) {
			obj.parentNode.removeChild(obj);
			refreshControls();
			recalcParentSize();
		} else if(m = txt.match(/^U:/)) {
			//already everything done
			if(obj.getAttribute("onedit")) {
				obj.onedit_func = eval("var eval_f = function(rid,text, title){"+obj.getAttribute("onedit")+"}; eval_f")
				obj.onedit_func(rid, v, title);
			}
			recalcParentSize();
		}
		else if(m = txt.match(/^I: (.*) (.*)/)) {
			if(rid) { //from listItemWorker
				var g = cloneTableRow(findPrevious(obj, "TABLE"));
				g.setAttribute("rid", m[1]);
				g.setAttribute("cmd", m[2]);
				if(T(g,"A"))
					saveControlVal( T(g,"A"), rid, v, title, true);
				if(g.getAttribute("onadd")) {
					g.onadd_func = eval('var eval_f = function(rid){'+g.getAttribute("onadd")+'}; eval_f');
					g.onadd_func(rid);
				}
			} else {
				var g = findSaveCmdElem(obj);
				g.setAttribute("rid", m[1]);
				g.setAttribute("cmd", m[2]);
			}
			refreshControls();
			recalcParentSize();
		}
	}
}

function makeSaveXFunc(obj) {
	return function(req) {
		var txt = req.responseText;
		var m;
		if(m = txt.match(/^E: (.*)/))
			alert("Error: " + m[1]);
			// revert?
		else if(m = txt.match(/^U:/)) {
			//already everything done
			recalcParentSize();
		}
		else if(m = txt.match(/^I: (.*) (.*)/)) {
			var p = findSaveCmdElem(obj);
			for(var e = obj; e != p; e = e.parentNode)
				if(e.getAttribute("cmd")!=null) break;
			if(e != p)
				obj = e;
			if(obj.tagName == "INPUT" && obj.type == "radio") {
				var c = findElem(obj, "FORM") || document.body;
				var coll = c.querySelectorAll('input[type="radio"][name="'+obj.name+'"]');
				for(var i = 0; i < coll.length; ++i)
					coll[i].setAttribute("cmd", m[2]);
			}
			else
				obj.setAttribute("cmd", m[2]);
		}
	}
}

function clearError(e) {
	SetClass(e,"hasError", false);
}

function setCtrlError(e) {
	SetClass(e,"hasError", true);
	return false;
}

function date(y,m,d) { return new Date(y,m-1,d); }
function today() { return new Date(); }
function this_year() { return (new Date()).getFullYear(); }


function collectFVfromCont(c) {
	var fv = {};
	var a = c.getElementsByTagName("*");
	for(var i = 0; i < a.length; ++i)
		if(a[i].getAttribute("check_unique")!=null)
			fv[a[i].name] = a[i].getAttribute("rid") || a[i].value;
	return fv;
}
function allFirstInSecond(fv1, fv2) {
	for(var i in fv1)
		if(!(i in fv2 && fv1[i] == fv2[i]))
			return false;
	return true;
}

function testUniqueRowInCont(e, fv) {
	e = findSaveCmdElem(e);
	if(!fv)
		fv = collectFVfromCont(e);
	var hasElems = false;
	for(var i in fv) 	hasElems = true;
	if(!hasElems) return true; //nothing to check;
	for(var x =  e.parentNode.firstChild; x ; x = x.nextSibling)
	{
		if(!x.tagName || x === e) continue;
		var fv2 = collectFVfromCont(x);
		if(allFirstInSecond(fv, fv2) && allFirstInSecond(fv2, fv)) {
			alert("Уже есть!");
			return false;
		}
	}
	return true;
}

function checkCtrl(e) {
	if(e.getAttribute("fctl") == null) return true;
	var eval_context = e;
	var ckdefs = {};
	ckdefs.type = e.getAttribute("vtype");
	ckdefs.required = e.getAttribute("required") != null;
	ckdefs.sp = e.getAttribute("keep_sp") != null;
	ckdefs.min = eval('('+e.getAttribute("vmin")+')');
	ckdefs.max = eval('('+e.getAttribute("vmax")+')');
	ckdefs.re = eval('('+e.getAttribute("re")+')');
	ckdefs.dummy_value = e.getAttribute("dummy_value");
	if(e.getAttribute("vfunc"))
		e.check_func = eval('var eval_f = function(){ return '+e.getAttribute("vfunc")+'; }; eval_f');

	if(e.tagName == "A" && e.getAttribute("rid")!=null && ckdefs.required && 
		e.getAttribute("rid").match(/^0*$/)) return setCtrlError(e);
	if(e.tagName == "A")
		return true;
	if(!e.value) return !ckdefs.required || setCtrlError(e);
	if(e.tagName == "SELECT" && ckdefs.required && 
		e.value.match(/^0*$/)) return setCtrlError(e);
	var v = e.value;
	if( ( ckdefs.type!=null && ckdefs.type != 'S' ) 
		|| !ckdefs.sp
		)
		v = v.replace(/^\s*(.*)\s*$/, "$1").replace(/\s+/g,' ');
	e.value = v;
	if((ckdefs.type || e.tagName == "INPUT") && v.length > 1000) return setCtrlError(e);
	var sv = v;
	if(ckdefs.type == 'I') {
		if(parseInt(v)+"" != v) return setCtrlError(e);
		sv = parseInt(v);
	}
	if(ckdefs.type == 'N') {
		if(!v.match(/\d+(\.\d*)?/)) return setCtrlError(e);
		sv = parseFloat(v);
	}
	if(ckdefs.type == 'PRU') {
		var sn = v.replace(/\s/g,"");
		var sn = sn.replace(/^\+7/,"");
		var sn = sn.replace(/\D/g,"");
		var sn = sn.replace(/^[78](\d{10})/,"$1");

		if(sn.length == 10) {
			e.value = '+7 '+sn;
		} else {
			return setCtrlError(e);
		}
	}
	if(ckdefs.type == 'D') {
		if(!validate_date(e)) return setCtrlError(e);
		var d = parseDateInStruct(e.value);
		e.value = digits2(d.d)+'.'+digits2(d.m)+'.'+d.y;
		sv = DateObj(d);
	}
	if(ckdefs.min != undefined && ckdefs.min != null && sv < ckdefs.min) return setCtrlError(e);
	if(ckdefs.max != undefined && ckdefs.max != null && sv > ckdefs.max) return setCtrlError(e);
	if(ckdefs.re && !v.match(ckdefs.re)) return setCtrlError(e);
	if(e.check_func && !e.check_func()) return setCtrlError(e);
	if(ckdefs.dummy_value && e.value == ckdefs.dummy_value)  return setCtrlError(e);
	if(e.getAttribute("check_unique")!=null && !testUniqueRowInCont(e)) return setCtrlError(e);
	return true;
}

function getCtrlValue(e, rid, txt) {
	var val = null;
	var pval = null;
	if(e.getAttribute("save_val")!=null) {
		val = pval = e.getAttribute("save_val");
	} else if(e.tagName == "BUTTON" && HasClass(e,"checkbox3")) {
		val = ({ "?" : "", "нет" : "0", "да" : "1" })[pval = getInnerText(e)];
	} else if(e.tagName == "INPUT" && e.type == "checkbox") {
		val = e.checked?"1":"";
		pval = e.checked?"да":"нет";
	} else if(e.tagName == "INPUT" && e.getAttribute("vtype")=='D') {
		val = e.value ? printDate(parseDateInStruct(e.value)) : "";
		pval = e.value;
	} else if(e.tagName == "INPUT" || e.tagName == "TEXTAREA") {
		pval = val = e.value;
	} else if(e.tagName == "A") { //rel
		if(rid) {
			val = rid;
			pval = txt;
		} else
			pval = getInnerText( e );
	} else if(e.tagName == "SELECT") {
		val = e.options[e.selectedIndex].value;
		pval = getInnerText(e.options[e.selectedIndex]);
	}
	return { val: val, pval: pval };
}

function saveControlVal(e, rid, txt, ttl, ensuring) {
	if(e.tagName == "A" && rid) { //rel
		e.setAttribute("rid", rid);
		setInnerText( e, txt);
		e.title = ttl;
	}
	
	if(!checkCtrl(e)) return;
	
	var pv = getCtrlValue(e, rid, txt);

	var name = e.name.replace(/\*[^*]+\*/, "");

	if(valuePropogationMap[name]) {
		var a = valuePropogationMap[name];
		for(var i = 0; i < a.length; ++i)
			setInnerText( a[i], pv.pval);
	}
	if(!ensuring)
		refreshControls();
	if(ensuring) return;

	autoResizeOnEvent(null, e);

	var eval_context = e;
	var fv = eval("("+e.getAttribute("def_vals")+")") || {};
	var sfunc = null;
	if(e.getAttribute("xform")!=null) { //XFORM
		if(e.getAttribute("cmd")) {
			//existing val! everything done!
		} else {
			// findSaveCmd give us insert cmd!
			//change link field to our storage field
			var ex = findSaveCmdElem(e);
			var lnk = ex.getAttribute("link");
			fv[ lnk ] = findRid(e);
			fv[ ex.getAttribute("xparam") ||  
					lnk.replace(/\.[^.]*$/, "."+ formDefFldNames["xparam"]) 
				] = e.getAttribute("xform");
		}
		sfunc = makeSaveXFunc(e);
	} else { //NORMAL FORM
		sfunc = makeSaveFunc(e);
	}
	var uri = findSaveCmd(e);
	if(GetUrlParam(uri,"key_vals")=="__~~~") { // insert
		var eval_context = findSaveCmdElem(e);
		var fv_def = eval("("+eval_context.getAttribute("def_vals")+")");
		if(fv_def)
			for(var i in fv_def)
				if( !(i in fv) )
					fv[i] = fv_def[i];
		
	}

	fv[ name ] = pv.val;
	RequestLongURI(SetUrlParam(uri, "fieldvals", EncodeMap(fv)), sfunc);
}

/*
*/
function listItemWorker(src, e, rid) {
	var rt = e && (e.getAttribute("rt") || getInnerText(e));
	if(src.getAttribute("onchoose") || 
		T(src.parentNode,"A") && T(src.parentNode,"A").getAttribute("onchoose")) 
	{
		var ce = src.getAttribute("onchoose")? src : T(src.parentNode,"A");
		var f = ce.getAttribute("onchoose");
		ce.onselect_func = eval("var eval_f = function(rid,text, title){"+f+"}; eval_f")
		ce.onselect_func(rid, rt, e.title);
		return;
	}
	if(src.getAttribute("add") != null) {
		var t = findPrevious(src, "TABLE");
		var ex = findFirstExample(t);
		var uri = findSaveCmd( ex );
		var a = T(ex,"A");
		if(a && a.getAttribute("check_unique")!=null) {
			var fv = collectFVfromCont(ex);
			fv[a.name] = rid;
			if(!testUniqueRowInCont(ex, fv))  return;
		}
		var thisExampleRow = ex;
		var eval_context = findSaveCmdElem(ex);
		var fv = eval("("+eval_context.getAttribute("def_vals")+")") || {}
		fv[ex.getAttribute("link")] = findRid(src);
		if(a)
			fv[a.name] = rid;
		uri = SetUrlParam(uri, "fieldvals", EncodeMap(fv));
		sendRequest( uri, makeSaveFunc(src, rid, e && rt || rid, e && e.title) )
	} else {
		saveControlVal(T(src.parentNode,"A"), rid, rt, e.title);
	}
}

function moveRowUpDown(e, diff) {
	var r = findSaveCmdElem(e);
	if(!diff) return;
	if(r.sectionRowIndex >= r.parentNode.rows.length && diff>0) return;
	if(r.sectionRowIndex <= 1 && diff<0) return;
	var toExch = r.parentNode.rows[ r.sectionRowIndex + diff ];
	if(diff>0) r.parentNode.insertBefore(toExch, r);
	else r.parentNode.insertBefore(r, toExch);
	
	var uri = r.getAttribute("cmd");
	uri = SetUrlParam(uri, "target", "rep_ren");
	var keys = []; var levs= [];
	for(var i = 1; i < r.parentNode.rows.length; ++i) {
		keys.push( EncodeValList([r.parentNode.rows[i].getAttribute("rid")]) );
		levs.push("0");
	}
	uri = SetUrlParam( uri, "key_vals", EncodeValList( keys ) );
	uri = SetUrlParam( uri, "r_levs", EncodeValList( levs ) );
	sendRequest(uri, function() {});
}

var lastSelect = null;
function selBigListItem(e, rid) { listItemWorker(lastSelect, e, rid); }


var lastMenu = null;
function setWithMenu(e, flt, m) {
	if(!m) m = T(e.parentNode, "MENU");
	lastSelect = e;
	lastMenu = m;
	var a = m.getElementsByTagName("LI");
	if(!a.length) return;
	var html = "#"+("")+"<table class=menutable>";
	var texts = []
	for(var i = 0; i < a.length; ++i)
		if(!flt || flt(a[i])) 
			texts.push({idx:i,txt:a[i].innerHTML});

	texts.sort(function(x,y) { if(x.txt<y.txt) return -1;if(x.txt>y.txt) return 1;return 0;})
	
	for(var i = 0; i < texts.length; ++i)
			html += "<tr><td><a href='#' onclick='cmd_target().selAddMenuItem("+texts[i].idx+"); hideMenuChain(); return false;'>"+
				texts[i].txt+"</a>\n";
	html += "</table>";
	OpenMenuId(e, html);
}
function addWithMenu(e, flt) {
	setWithMenu(e, flt, T(T(findFirstExample(findPrevious(e, "TABLE")),"A"),"MENU"));
}
function selAddMenuItem(i) {
	var m = lastMenu;
	var a = m.getElementsByTagName("LI");
	selBigListItem( a[i], a[i].getAttribute("value") );
}

function delDataRow(e) {
	var uri = findSaveCmd(e);
	sendRequest( uri, makeSaveFunc(findSaveCmdElem(e)) )
}
function sortSelect(s)
{
	if(s.getAttribute("nosort") != null) return;
	var oldchoose = s.selectedIndex;
	var ops = [];
	for(var i=0;i<s.options.length;++i) {
		ops.push({idx:i,opt:s.options[i]})
	}
	ops.sort(function(x,y) {var xx=x.opt.innerHTML;var yy=y.opt.innerHTML;if(xx<yy) return -1; if(xx>yy)return 1; return 0;});
	var newchoose = null;
	while (s.options.length > 0) s.options[0] = null;
	for(var i=0;i<ops.length;++i) {
		if(ops[i].idx==oldchoose) newchoose = i;
		s.options.add(ops[i].opt);
	}
	s.selectedIndex = newchoose;
}
function getApproxLength(e) {
	var ml = e.getAttribute("maxlength");
	if(ml) { 
		var ml = parseInt(ml);
		if(ml && ml < 100000) return ml;
	}
	var eval_context = e;
	var type = e.getAttribute("vtype");
	if(type =='D') return 10;
	var vmin = (eval('('+e.getAttribute("vmin")+')') || "")+"";
	var vmax = (eval('('+e.getAttribute("vmax")+')') || "")+"";
	if(vmin || vmax) return Math.max(vmin.length, vmax.length);
	var re = e.getAttribute("re");
	if(re && re.match(/^\/\^(\.|\[.*\]|\\d)\{(\d*,)?(\d+)\}\$\/$/)) return parseInt(RegExp.$3)
	return 0;
}

var g_fdate = "";
var valuePropogationMap = {}
function prepareControls(cnt) {
	if(!cnt && g_fdate) SetClass(document.body, "RO", true);
	cnt = cnt || document;
	var addMenu = [];
	var a = cnt.getElementsByTagName("*");
	for(var i = 0; i < a.length; ++i)
	{
		var e = a[i];
		if(e.getAttribute("xvalue")) {
			var eval_context = e;
			var v = eval('('+e.getAttribute("xvalue")+')') || { value: "", cmd: "" };
			if(e.tagName == "INPUT" && e.type=="radio")
				e.setAttribute("svalue", v.value);
			else if(e.tagName == "INPUT" && e.type=="checkbox")
				e.checked = v.value != "";
			else
				e.value = v.value;
			e.setAttribute("cmd", v.cmd); 
		}
	}
	for(var i = 0; i < a.length; ++i)
	{
		var e = a[i];
		if(e.getAttribute("source_ctl")) {
			var n = e.getAttribute("source_ctl");
			(valuePropogationMap[n] || (valuePropogationMap[n] = [])).push(e);
		}
	}
	for(var i in valuePropogationMap)
		if(document.getElementsByName(i).length)
			saveControlVal( document.getElementsByName(i)[0], null,null, null, true);
	refreshControls();
	for(var i = 0; i < a.length; ++i)
	{
		var e = a[i];
		if(e.getAttribute("fctl") != null) { //our ctrl
			var eval_context = e;
			var lock_edit = eval(e.getAttribute("lock_edit") || "g_fdate");
			var len = getApproxLength(e);
			if(e.tagName == "BUTTON" && HasClass(e,"checkbox3")) {
				setClonableHandler(e, "onclick", "show3stateMenu(this)");
				if(getInnerText(e)=="") { 
					setInnerText(e, "?");
				}
			} else 
			if(e.tagName == "INPUT" && e.type=="radio") {
				setClonableHandler(e, "onclick", "saveControlVal(this)");
				e.checked = e.getAttribute("value") == e.getAttribute("svalue");
			} else
			if(e.tagName == "INPUT" && e.getAttribute("vtype")=='D') {
				if(e.value) {
					var d = parseDateInStruct(e.value);
					e.value = digits2(d.d)+'.'+digits2(d.m)+'.'+d.y;
				}
				setClonableHandler(e,"onchange", "saveControlVal(this)");
				setClonableHandler(e,"onfocus", "clearError(this)");
				e.setAttribute("size", 10);
				e.setAttribute("maxlength", 10);
			} else 
			if(e.tagName == "INPUT" || e.tagName == "TEXTAREA" || e.tagName == "SELECT") {
				setClonableHandler(e,"onchange", "saveControlVal(this)");
				setClonableHandler(e,"onfocus", "clearError(this)");
				if(len) {
					e.setAttribute("size", len);
					e.setAttribute("maxlength", len);
				} else {
					if(e.tagName == "INPUT" || e.getAttribute("vtype") == 'S') {
						e.setAttribute("maxlength", 1000);
					}
				}
				if(e.tagName == "SELECT") {
					sortSelect(e);
				}
			} else 
				if(e.tagName == "MENU" && !lock_edit) {
					addMenu.push(e);
				}

			if(lock_edit && e.tagName != "MENU" && e.tagName != "A") {
				//read only
				var x = document.createElement("SPAN");
				x.className = e.className;
				if(e.tagName ==  "TEXTAREA")
					x.style.whiteSpace = "pre-wrap";
				if(e.tagName == "INPUT" && e.type == "radio")
					setInnerText(x, e.checked? '●': '○' );
				else
					setInnerText(x, getCtrlValue(e).pval.replace(/\s*$/mg,""));
				e.parentNode.insertBefore(x, e);
				e.parentNode.removeChild(e);
			}
		}
		autoResizeOnEvent(null, e);
	}
	for(var i = 0; i < addMenu.length; ++i) {
		var ne = document.createElement("DIV");
		ne.innerHTML = "<button type=button>...</button>";
		ne = ne.firstChild;
		setClonableHandler(ne,"onclick", "setWithMenu(this)");
		addMenu[i].parentNode.insertBefore(ne, addMenu[i]);
	}
	var toMove = [];
	var a = cnt.getElementsByTagName("*");
	for(var i = 0; i < a.length; ++i)
	{
		var e = a[i];
		if(e.getAttribute("move_point")) {
			var n = e.getAttribute("move_point");
			var x = T(n) || I(n);
			if(x)
				if(x.tagName == "TD")
					toMove.push( { to: e, str: x.innerHTML } );
				else
					toMove.push( { to: e, from: x } );
		}
	}
	for(var i = 0; i < toMove.length; ++i)
		if(toMove[i].from) {
			var c = toMove[i].from;
			toMove[i].to.appendChild(toMove[i].from);
		}
		else
			toMove[i].to.innerHTML = toMove[i].str;
	
	var pp = I("toptext");
	if(pp && frameElement && "page_top_helps" in parent)
		pp.innerHTML = parent.page_top_helps[pp.getAttribute("page_name")] || pp.getAttribute("page_name");

	recalcParentSize();
}

var g_refreshControlHandlers = [];
function addRefreshControlsFunc(f) { g_refreshControlHandlers.push(f); }
function refreshControls() {
	for(var i = 0; i < g_refreshControlHandlers.length; ++i)
		g_refreshControlHandlers[i]();
}

function TA_MD_handler(ev) { var e = (ev||event); e = e.target || e.srcElement;
	if(e.tagName == "TEXTAREA")
		e.stv = e.offsetWidth + "x" + e.offsetHeight; 
}
function TA_MU_handler(ev) { var e = (ev||event); e = e.target || e.srcElement;
	if(e.tagName == "TEXTAREA")
		if(e.stv != e.offsetWidth + "x" + e.offsetHeight) recalcParentSize(); 
}

if (document.addEventListener) document.addEventListener('mouseup', TA_MU_handler, false);
else if( document.attachEvent ) document.attachEvent('onmouseup', TA_MU_handler);
if (document.addEventListener) document.addEventListener('mousedown', TA_MD_handler, false);
else if( document.attachEvent ) document.attachEvent('onmousedown', TA_MD_handler);

var currentBoolChoose = null;
function show3stateMenu(e) {
	currentBoolChoose = e;
	OpenMenuId(e, "#<style>.boolChoose { border: 1px solid black; background: white; }"+
	" .\\? .x, .да .t, .нет .f { display: none; }"+
	"</style>"+
	"<div class='boolChoose'>"+
	"<table class='"+getInnerText(e)+"'>"+
		"<tr class=x><td><a href='javascript:cmd_target().chooseEmpty(); hideMenuChain()'>?</a>"+
		"<tr class=f><td><a href='javascript:cmd_target().chooseFalse(); hideMenuChain()'>нет</a>"+
		"<tr class=t><td><a href='javascript:cmd_target().chooseTrue(); hideMenuChain()'>да</a>"+
	"</table></div>")
}
function chooseEmpty() { var e= currentBoolChoose; setInnerText(e, "?"); saveControlVal(e); }
function chooseFalse() { var e= currentBoolChoose; setInnerText(e, "нет"); saveControlVal(e); }
function chooseTrue() { var e= currentBoolChoose; setInnerText(e, "да"); saveControlVal(e); }

var errCtrls = [];
function checkThisCard() {
	errCtrls = [];
	var a = document.getElementsByTagName("*");
	var ind = true;
	for(var i = 0; i < a.length; ++i)
		if(!checkCtrl(a[i])) {
			ind = false;
			errCtrls.push(a[i]);
		}
	if(!ind) { 
		alert("Поля форм содержат недопустимые данные. Проверьте еще раз.")
		return ind;
	}
	if("checkCardEx" in window)
		ind = checkCardEx();
	if(ind)
		alert("Основные формальные проверки успешно выполнены")
	return ind;
}

var sureText = "Вы уверены?"

function makeReady(e,dt,fld, close) {
	if(!checkThisCard(e)) return;
	if(!confirm(sureText)) return;
	
	var uri = findSaveCmd(e);
	var mp = {};
	mp[fld] = dt;
	uri = SetUrlParam(uri, "fieldvals", EncodeMap(mp));
	sendRequest( uri, function() { if(close) window_close(); else 
		if("selfRef" in window)
			OpenLongURI(selfRef, "_self");
		else
			document.location.reload(); 
	} );
}
function makeEdit(e, fld) {
	if(!confirm(sureText)) return;

	var uri = findSaveCmd(e);
	var mp = {};
	mp[fld] = "";

	uri = SetUrlParam(uri, "fieldvals", EncodeMap(mp));
	sendRequest( uri, function() { 
		if("selfRef" in window)
			OpenLongURI(selfRef, "_self");
		else
			document.location.reload(); 
	} );
}

function delCard(e, f) {
	if(!confirm(sureText)) return;
	var uri = findSaveCmd(e);
	sendRequest( uri, f );
}
function findOrg(e) { openPopupFrame( lastSelect = e, location_dir+"?target=exec&m=tables_common&f=choose_org") }
function findPers(e) { openPopupFrame( lastSelect = e, location_dir+"?target=exec&m=persons&f=choose_person") }

function OpenHelp(e) {
	openPopupFrame(e, location_dir+"rc/templates/free/common/inline_help.htm")
}

function fileUploaded(e) {
	var err = e.contentWindow.document.getElementById("ErrBox");
	var errtxt = err && getInnerText(err) || ""
	if(!errtxt) {
		if(T(e.parentNode, 'DIV'))
			T(e.parentNode, 'DIV').style.display='none';
	} else {
		alert(errtxt);
	}
	var dl = e.contentWindow.document.getElementById("lob_download");
	if(dl) {
		var a = T(e.parentNode, 'A');
		if(a) {
			a.style.display='inline';
			a.href=dl.href;
		} else {
			var i = T(e.parentNode, 'IMG');
			i.style.display='inline';
			i.src=dl.href;
		}
	}
}

function testAndAlert(v,a) {
	if(!v) alert(a);
	return !!v;
}

function openRid(e, uri) {
	if(e.tagName == 'A' && e.getAttribute('href') == '#' ) e.setAttribute('href', "javascript:undefined");
	openPopupFrame(e, uri.replace("$XX$", e.getAttribute("rid")))
}

function checkAddress(e) {
	if(!e.value) return true;
	if(!e.value.match(/(^|\s|[,.])\d{6}(\s|[,.]|$)/)) return false; //has index
	return true;
}

function date2str(d) {
	return d.getFullYear() + "-" + (d.getMonth()+101+"").substr(1) + "-" + (d.getDate()+100+"").substr(1);
}

//XFORMS
	var formDefFldNames = { 'I': "enf_numw", 'N': "enf_numw",  'X': "enrel_dataw", 'R': "enrel_dataw", 'T': "enf_textw",
			'xparam' : "enrel_paramw" }
	
	function makeXFormElem(e, tablename) {
		if(e.constructor == Array) {
			var r = [];
			for(var i = 0; i < e.length; ++i)
				r.push(makeXFormElem(e[i]).ctrl);
			return { caption: e[0].caption, hint: e[0].hint, ctrl: r.join('') };
		}
		var fldpart = " xform='"+e.pid+"'"+
				" name='"+tablename+(formDefFldNames[e.type] || "enf_strw") + "' "+
					(e.cmd? " cmd='"+e.cmd+"'" : "") +
					(e.xvalue? " xvalue='"+e.xvalue+"'" : "");
		if(e.type == 'X') {
			var opts = [];
			for(var i = 0; i <e.values_array.length; ++i)
				opts.push(
				( e.values_array[i].k == e.value? "<option selected " : "<option " )
				+" value='"+e.values_array[i].k+"'>"
				+e.values_array[i].v
				+"</option>");
			return {caption: e.caption, hint: e.hint, 
				ctrl: "<select "+fldpart+" fctl nosort>"+opts.join('\n')+"\n</select>"
				};
		} 
		else if(e.type == 'R') {
			var opts = [];
			for(var i = 0; i <e.values_array.length; ++i)
				opts.push(
				"<input type='radio' "
				+fldpart.replace("name='","name='*"+e.name+"*")
				+" value='"+e.values_array[i].k+"' "
				+" svalue='"+e.value+"' "
				+" fctl>"
				+e.values_array[i].v
				);
			return {caption: e.caption, hint: e.hint, 
				ctrl: opts.join('<br>')
				};
		} 
		else if(e.type == '-') {
			return {caption: e.caption, hint: e.hint, ctrl: ''};
		} 
		else if(e.type == 'P') {
			return {caption: e.caption, hint: e.hint, ctrl: "<span move_point='"+e.name+"'></span>"};
		} 
		else if(e.type == 'B') {
			return { caption: e.caption, hint: e.hint,
					ctrl: "<BUTTON type='button' class='checkbox3' "+fldpart+"' fctl>"+(e.value||"")+"</BUTTON>" };
		} 
		else if(e.type == 'C') {
			return { caption: e.caption.charAt(0) == '.' ? "" : e.caption, hint: e.hint,
					ctrl: "<input type='checkbox' "+fldpart+" fctl "+(e.value == "да"?"checked":"")+">"+
					(e.caption.charAt(0) == '.' ? e.caption.substr(1) : "")
				};
		} 
		else {
			var p = 
				fldpart+
				(e.min?" vmin=\"unescape('"+escape(e.min)+"')\"":"") +
				(e.max?" vmax=\"unescape('"+escape(e.max)+"')\"":"") +
				(e.resize? " content-resizable ": "")
			var r;
			if(e.type=='L' || e.type=='T') {
				r = "<textarea "+p+(e.type=='T'?" keep_sp":"")+" fctl>"+StrToHtml(e.value||"")+"</textarea>";
			} else {
				p += " vtype='"+e.type+"'";
				r = "<input "+p+" value='"+StrToHtml(e.value||"")+"' fctl>";
			}
			return {caption: e.caption, hint: e.hint, ctrl: r};
		}
	}

	function makeXFormTableContent(formDef, formDataSrc, tablename) {
	 if(typeof formDataSrc == "string")
		 for(var i in formDef )
				formDef[i].xvalue = formDataSrc+'["'+i+'"]';
	 else
		 for(var i in formDef )
			if(i in formDataSrc) {
				formDef[i].value = formDataSrc[i].value;
				formDef[i].cmd = formDataSrc[i].cmd;
			}

		var a = [];
		for(var i in formDef)
			a[formDef[i].npp] = formDef[i];
		var c = [ [] ];
		var row = 0; var lcol = 1;
		for(var i = 1; i < a.length; ++i) {
			if(a[i].sl) { 
				if(!c[row][lcol])
					c[row][lcol] = [];
				else if(c[row][lcol].constructor != Array)
					c[row][lcol] = [ c[row][lcol] ];
				c[row][lcol].push(a[i]);
				continue;
			}
			lcol = a[i].col;
			if(c[row][a[i].col]) c[++row] = [];
			c[row][a[i].col] = a[i];
		}

		var tbl = "";
		for(var row = 0; row < c.length; ++row) {
			tbl += "<tr>\n"
			for(var col = 1; col < c[row].length; ++col) {
				var cdata = c[row][col] ? makeXFormElem(c[row][col], tablename) : { caption: '', hint: '', ctrl: ''}
				var top_capt = cdata.caption.charAt(0) == '/';
				var capt = top_capt && cdata.caption.substr(1) || cdata.caption;
				tbl += "<td class='tfcap' " + (top_capt && "colspan=2>" ||">") + capt + 
					(cdata.hint?"<div class=xform_hint>"+cdata.hint+"</div>" : "")
				+ (top_capt ? "<tr><td colspan=2>" : "<td>") +
				cdata.ctrl;
			}
			tbl += "</tr>\n"
		}
		return tbl;
	}
	
function findElemRE(e, t) {
	while(e && !e.tagName.match(t)) e = e.parentNode;
	return e;
}

function sortByCol(e) {
	e = findElemRE(e,/^(TD|TH)$/);
	var desc = !e.getAttribute("sort") ? 1 : e.getAttribute("sort") == "asc" ? -1 : 0;
	if(desc)
		e.setAttribute("sort", desc > 0 ? "asc" : "desc" );
	else
		e.removeAttribute("sort");
	var cidx = e.cellIndex;
	var a = [];
	var r = findElem(e,"TABLE").tBodies[0].rows;
	for(var i = 0; i < r.length; ++i)
		if(!HasClass(r[i],"sample"))
			a[i] = { txt: getInnerText(r[i].cells[cidx]), obj: r[i] };
	a = a.sort(function(x,y){ return (x.txt < y.txt? -1: x.txt < y.txt ? 0 : 1)*desc });
	for(var i = 0; i < a.length; ++i)
		a[i].obj.parentNode.appendChild(a[i].obj);
}

function filterByMode(rv, mode, v, re) {
	if(!v) return true;
	if(!mode) return rv.match(re);
	if(mode == "lt") return v < rv;
	if(mode == "le") return v <= rv;
	if(mode == "gt") return v > rv;
	if(mode == "ge") return v >= rv;
	return true;
}

function doFilterByCol(e) {
	var v = e.value;
	if(e.getAttribute("min_filter_length") && v.length < getIntAttribute("min_filter_length"))
		v = "";
	if(e.getAttribute("old_value")==v) return;
	e.setAttribute("old_value",v);
	var c = findElemRE(e,/^(TD|TH)$/);
	var mode = e.getAttribute("filterMode")||"";
	var cidx = c.cellIndex;
	var cidxf = "("+cidx+mode+")";
	var re = new RegExp("(^|\\s)"+quoteRegExp(v),"i");
	var r = findElem(e,"TABLE").tBodies[0].rows;
	for(var i = 0; i < r.length; ++i)
		if(!HasClass(r[i],"sample")) {
			var rv = getInnerText(r[i].cells[cidx]);
			var fh = r[i].getAttribute("filterHides") || "";
			if(filterByMode(rv,mode,v,re)) { //show
				if(fh.indexOf(cidxf)>=0)
					r[i].setAttribute("filterHides", fh.replace(cidxf,""));
			} else { //hide
				if(fh.indexOf(cidxf)<0)
					r[i].setAttribute("filterHides", fh+cidxf);
			}
		}
}

function startFilterByCol(e) {
	e = findElemRE(e,/^(TD|TH)$/);
	e.setAttribute("filterOn", "Y");
	var inps = e.querySelectorAll("[filterMode]");
	for(var i = 0; i < inps.length; ++i) {
		inps[i].onkeyup = function() { doFilterByCol(this); }
	}
	inps[0].focus();
}

function cancelFilterByCol(e) {
	var c = findElemRE(e,/^(TD|TH)$/);
	var inps = c.querySelectorAll("[filterMode]");
	for(var i = 0; i < inps.length; ++i) {
		var a = inps[i];
		a.removeAttribute("old_value");
		a.value = "";
		doFilterByCol(a);
	}
	c.removeAttribute("filterOn");
}