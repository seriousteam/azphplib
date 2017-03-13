
function findSaveCmdElem(e) { 
	while( (e = e.UA("cmd")) && !e.A() ) e = e.parentNode;
	if(e && e.A('cmd').charAt(0)==='@')
		return e.evalHere(e.A('cmd').substr(1))
	return e;
}

function findSaveCmd(e, fv) { 
	e = findSaveCmdElem(e); 
	return e && 
		( fv? 
			e.A("cmd").setURLParam('fieldvals', sas_coder.Map(fv))
		:
			e.A("cmd")
		);
}

//key_vals=__3HO1000IbuJf1G00Ak0A0AHM~~~&table=main.enpersons&target=qe_save

function takeRidFromCmd(s) {
	if(s.match(/\/s\/main\.[a-zA-Z_0-9]+\.syrecordidw\/([a-zA-Z_0-9-]*)$/))
		return RegExp.$1;
	var m = s.URLParam("key_vals","").match(/^__([^~]*)~~~$/);
	return m? m[1] : null;
}

function findRid(e) {
	while(e = findSaveCmdElem(e)) {
		var s = takeRidFromCmd(e.A("cmd"));
		if(s) return s;
		e = e.parentNode;
	}
	return null;
}

	function cloneSampleRow(toClone) {
		var g = toClone.cloneNode(true);
		//g.className = "";
		g.removeAttribute('sample');
		toClone.parentNode.appendChild(g);
		refreshControls();
		var a = g.QSA('[content-resizable]');
		for(var i = 0; i < a.length; ++i)
			X.autoResizeOnEvent(null, a[i]);
		return g;
	}
	
	function findPreviousSample(e) { 
		return e.QSattrPrevious('sample'); 
	}

function failFunc(err) {
	if(I('sending_indicator'))
		I('sending_indicator').incA('count', -1);
	X.log(err);
}

function setCmdSasSmart(e, c) {
	if(c && e.A('cmd').match(/\/s\/main\.[a-zA-Z_0-9]+\.syrecordidw\/([a-zA-Z_0-9-]*)$/)) {
		var m = c.URLParam("key_vals","").match(/^__([^~]*)~~~$/);
		c = e.A('cmd').replace(/\/[a-zA-Z_0-9-]*$/, "/"+m[1]);
	}
	e.setA("cmd",c);
}

function call_onserverrespose(obj, op) {
	if(op==='C') obj.evalHere("@oncreated")
	if(op==='U') obj.evalHere("@onupdated")
	if(op==='D') obj.evalHere("@ondeleted")
	if(op==='E') obj.evalHere("@onerror")
}

function parseSasResponse(txt, x_alert) {
	x_alert = x_alert || function() {}
	var m;
		if(m = txt.match(/(?:^|\n)(E): ([\s\S]*)/)) {
			x_alert("Error: " + m[2]);
			m.shift();
			return m;
			// revert?
		} else if(m = txt.match(/^(D):(?: (.*) (.*))?/)) {
			m.shift();
			return m;
		} else if(m = txt.match(/^(U):(?: (.*) (.*))?/)) {
			m.shift();
			return m;
		}
		else if(m = txt.match(/^(I): (.*) (.*)/)) {
			m.shift();
			return m;
		}
		else if(m = txt.match(/^(S): (.*?) (.*)/)) {
			m.shift();
			return m;
		}
		return [];
}

function makeSaveFunc(obj, clone) {
	if(I('sending_indicator'))
		I('sending_indicator').incA('count');
	return function(ptxt) { var txt = ptxt || '';
		if(I('sending_indicator'))
			I('sending_indicator').incA('count', -1);
		var m = parseSasResponse(txt, window.alert);
		switch(m.shift()) {
			case "D":
				if(m[1]) {
					setCmdSasSmart(obj, m[1]);
					call_onserverrespose(obj, 'U');
				} else {
					call_onserverrespose(obj, 'D');
					if(obj.hasA('joined_with_next_row')) obj.nextElementSibling.removeIt();
					obj.removeIt();
				}
				refreshControls();
				break;
			case "U":
				call_onserverrespose(obj, 'U');
				break;
			case "I":
				if(clone) { //from makeChoose
					obj = cloneSampleRow(findPreviousSample(obj));
					setCmdSasSmart(obj, m[1]);
					call_onserverrespose(obj, 'C');
				} else {
					var p = findSaveCmdElem(obj);
					for(var e = obj; e != p; e = e.parentNode)
						if(e.hasA("cmd")) break;
					obj = e; //this is an object with cmd placeholder or insert cmd
					setCmdSasSmart(obj, m[1]);
					call_onserverrespose(obj, 'U');
				}
				refreshControls();
				break;
		}
		recalcParentSize();
		return obj;
	}
}

function clearError(e) { e.setA("error", ""); return true; }
function setCtrlError(e) {
	if(e.UA("sample")) 
		return true;
	e.setA("error", "Y");
	if(e.hasA("control")) {
		(e.evalHere("@control")).setA("error", "Y");
	}
	return false; 
}

function collectFVfromCont(c) {
	var fv = {};
	var a = c.QSA("[check_unique]");
	for(var i = 0; i < a.length; ++i)
		fv[a[i].A("name")] = a[i].A("rid") || a[i].V();
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
	for(var i in fv) hasElems = true;
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
	if(!e.hasA("fctl") && !e.hasA("cctl")) return true;
	var ckdefs = {
		type : e.A("vtype"),
		required : e.hasA("required"),
		sp : e.hasA("keep_sp"),
		min : e.evalHere("@vmin"),
		max : e.evalHere("@vmax"),
		re : e.evalHere("@re"),
		dummy_value : e.A("dummy_value"),
		func : e.A("vfunc"),
		norm : e.A("vnorm")
	}

	if(e.tagName == "BUTTON" && ckdefs.required) {
		if(findPreviousSample(e).parentNode.children.length > (e.A("required")||1)) 
			return clearError(e);
		else
			return setCtrlError(e);
	}
	if(e.tagName == "A" && ckdefs.required && 
		(e.A("rid")||"").match(/^0*$/)) return setCtrlError(e);
	if(e.tagName == "A" || e.tagName == "LI")
		return true;
	var v = e.V();
	if(e.tagName != 'TR')
		e.setV(v);
	if(!v) return !ckdefs.required || setCtrlError(e);
	if(e.tagName == "SELECT" && ckdefs.required && 
		v.match(/^0*$/)) return setCtrlError(e);
	if( ( ckdefs.type!=null && ckdefs.type != 'S' ) 
		|| !ckdefs.sp
		) {
		v = v.replace(/\s+/g,' ').trim();
		e.setV(v);
	}
	if((ckdefs.type || e.tagName == "INPUT") && v.length > 1000) return setCtrlError(e);
	var sv = v;
	if(ckdefs.type == 'I') {
		sv = sv.replace(/\s/g,'');
		if(parseInt(sv)+"" != sv) return setCtrlError(e);
		sv = parseInt(sv);
	}
	if(ckdefs.type == 'N') {
		sv = sv.replace(/\s/g,'');
		if(!sv.match(/^(\d+(\.\d*)?|\.\d+)$/)) return setCtrlError(e);
		sv = parseFloat(sv);
	}
	if(ckdefs.type == 'PRU') {
		var sn = v.replace(/\s/g,"");
		var f1 = false;
		if(sn.match(/^\+/)) {
			var sn = '+'+sn.replace(/\D/g,"");
			f1 = true;
		} else {
			var sn = sn.replace(/\D/g,"");
			var sn = sn.replace(/^8?(\d{10})/,"+7 $1");
			f1 = true;
		}

		if(f1) {
			e.setV( v = sn );
		} else {
			return setCtrlError(e);
		}
	}
	if(ckdefs.type == 'D') {
		var d = Date.smartParse(e.V(), true);
		if(d.y==null || d.m==null || d.d==null) return setCtrlError(e)
		var dd = new Date(d.y,d.m-1,d.d)
		if( d.y!=dd.getFullYear() || (d.m-1)!=dd.getMonth() || d.d!=dd.getDate())
			return setCtrlError(e)
		var d = Date.smartParse(e.V());
		e.setV( v = d.formatDate('DMY') );
		sv = d;
	}
	if(ckdefs.type == 'DT') {
		var d = Date.smartParse(e.V(), true);
		if(d.y==null || d.m==null || d.d==null) return setCtrlError(e)
		var dd = new Date(d.y,d.m-1,d.d)
		if( d.y!=dd.getFullYear() || (d.m-1)!=dd.getMonth() || d.d!=dd.getDate())
			return setCtrlError(e)
		var d = Date.smartParse(e.V());
		e.setV( v = d.formatDateTime('DMY') );
		sv = d;
	}
	if(ckdefs.norm) {
		sv = v = e.evalHere(ckdefs.norm);
	}
	if(ckdefs.min != undefined && ckdefs.min != null && sv < ckdefs.min) return setCtrlError(e);
	if(ckdefs.max != undefined && ckdefs.max != null && sv > ckdefs.max) return setCtrlError(e);
	if(ckdefs.re && !v.match(ckdefs.re)) return setCtrlError(e);
	if(ckdefs.func && !e.evalHere(ckdefs.func)) return setCtrlError(e);
	if(ckdefs.dummy_value && v == ckdefs.dummy_value)  return setCtrlError(e);
	if(e.hasA("check_unique") && !testUniqueRowInCont(e)) return setCtrlError(e);
	return true;
}

function getCtrlValue(e) {
	var val = null;
	var pval = null;
	if(e.hasA("save_val")) {
		val = pval = e.A("save_val");
	} else if(e.tagName == "INPUT" && e.A("vtype")=='D') {
		val = e.value ? Date.smartParse(e.value).formatDate() : "";
		pval = e.value;
	} else if(e.tagName == "INPUT" && e.A("vtype")=='DT') {
		val = e.value ? Date.smartParse(e.value).formatDateTime() : "";
		pval = e.value;
	} else if(e.tagName == "INPUT" && (e.A("vtype")=='I'||e.A("vtype")=='N')) {
		val = e.value ? e.value.replace(/\s/g,'') : "";
		pval = e.value;
	} else if(e.tagName == "INPUT" && 
			({'2': 1, '3' : 1, '3M': 1, 'two': 1, 'three': 1, 'threeM': 1})[e.A("vtype")] ) {		
		var d = {'да':'1', '1':'1', '0':'0', 'нет':'0', '?':'', '':''};
		var t = {'да':'да', '1':'да', '0':'нет', 'нет':'нет', '?':'', '':''};
		d[e.A('checked-value')] = '1';
		d[e.A('unchecked-value')] = '0';
		t[e.A('checked-value')] = e.A('checked-value');
		t[e.A('unchecked-value')] = e.A('unchecked-value');
		delete d[null];delete t[null];
		val = e.A("vtype")[0]=='t' ? t[e.value] : d[e.value];		
		pval = e.value;
	} else if(e.tagName == "A") { //rel
		val = e.A("rid"); //rid is a value of A
		pval = e.V();
	} else if(e.tagName == "SELECT") {
		val = e.options[e.selectedIndex].value;
		pval = e.options[e.selectedIndex].text;
	} else {
		pval = val = e.V();
	}
	return { val: val, pval: pval };
}

function takeDefVals(e) {
	var a = e.attributes;
	var fv = {};
	var m;
	for (var i=0; i<a.length; ++i)
		if(m = a[i].nodeName.match(/^def(e?)-(.*)/))
			fv[ m[2] ] = m[1] ? e.evalHere(a[i].nodeValue) : a[i].nodeValue;

	if(e.hasA('auto-key')) {
		if( fv[e.A()] == undefined ) {
			fv[ '+'+e.A() ] = 'dummy';
		}
	}

	if(e.A("link") && !takeRidFromCmd(e.A("cmd")))
		fv[ e.A("link") ] = findRid(e);
	return fv;
}

function setRelV(e, list_item) {
		e
			.setA("rid", list_item.rid||'')
			.setV(list_item.text||'')
			.presentA('space_only', !e.V().trim());
		e.title = list_item.title;
	return e;
}

function saveControlVal(e) {
	//onchange here, we cah intercept this in check function
	if(!checkCtrl(e)) return;

	var pv = getCtrlValue(e);

	var name = e.A('name');
	if(e.hasA('field_part'))
		name = name + '('+e.A()+')'
	
	if(!name) return;//TODO: we call it sometimes with empty name - and crash further. so it's fixed this way
	
	var p = e;
	while(name.charAt(0)=='*') name = (p = p.parentNode.UA('name')).A();

	e.has_changes = true;
	
	e.inSave = true;
		refreshControls();
	e.inSave = false;	

	X.autoResizeOnEvent(null, e);
	
	var fv = takeDefVals(e);
	var ex = findSaveCmdElem(e);

	if(!ex) return;//TODO: our control is not inside of cmd. Just inside of form.

	if( !takeRidFromCmd(ex.A('cmd')) ) { // insert (XFORM too!)
		var fv_def = takeDefVals(ex); //use common defaults and link
		for(var i in fv_def)
			if( !(i in fv) )
				fv[i] = fv_def[i];
	}

	fv[ name ] = pv.val;

	var do_save = function() {
		return modificationRequest(ex, fv)
			.done(makeSaveFunc(e)).fail(failFunc);
	}
	do_save.fv = fv;
		
	if(e.hasA("onsave")) 
		return e.evalHere("@onsave", do_save);
	return do_save();
}


//take GET uri, but convert it to POST
function modificationRequest(e, fv, params) {
	if(e.tagName) e = findSaveCmdElem(e);
	var uri = e.tagName? findSaveCmd(e) : e;
	if(!modificationRequest.current) {
		//X.log('nd');
		modificationRequest.current = X.defer();
	}
	if(uri.charAt(0) == '-') {
		if(e.tagName) { if(!e.saveStorage) e.saveStorage = {}
			X.mixin(fv, e.saveStorage)
		}
		return modificationRequest.current = modificationRequest.current.done(
				function() { return ''; }
			);
	}
	if(fv) uri = uri.setURLParam('fieldvals', sas_coder.Map(fv));
	for(var i in params) uri = uri.setURLParam(i, params[i]);
	var q = "";
	if(uri.match(/^(.*?)\?([\s\S]*)/)) {
		uri = RegExp.$1;
		q = RegExp.$2;
	}
	return modificationRequest.current = modificationRequest.current.done(  
		function() {
			return X.POST( uri,  q, { 'Content-type': 'application/x-www-form-urlencoded' })
		}	
	)
}

function requestData(src, exprs) {
	if(X.isString(exprs)) exprs = [ exprs ];
	if(X.isArray(exprs)) {
		var r = {}
		for(var i = 0; i < exprs.length; ++i)
			r[exprs[i]] = ''
		exprs = r;
	}
	return modificationRequest(src, null, { def_vals: sas_coder.Map(exprs) })
		.done(function(r) { if(r) {
			var r = parseSasResponse(r)
			if(r.shift() === 'S') {
				r = sas_coder.DecodeValList(r[1]);
				var x = {}; var p = 0;
				for(var i in exprs) 
					x[i] = r[p++];
				return x;
			}
		}})
}

function suspendSave(e) { e = findSaveCmdElem(e);
	e.setA('cmd', '-'+e.A('cmd'));
	return e;
}
function resumeSave(e, always) { e = findSaveCmdElem(e);
	var a = QSA("[fctl],[cctl]")
	var ind = true;
	for(var i = 0; i < a.length; ++i)
		if(findSaveCmdElem(a[i]) == e && !checkCtrl(a[i]))
			ind = false;
	if(ind || always) {
		e.setA('cmd', e.A('cmd').substr(1));
		if( ind && e.A('cmd').charAt(0) != '-'  && e.saveStorage ) {
			var r = modificationRequest(e, e.saveStorage).done(function(txt) { return txt; });
			e.saveStorage = {}
			return r;
		}
	}
	return X.defer(ind);
}

function doAdd(src, rid, list_item) {
	var ex = src.A('add') === 'here' 
		? findSaveCmdElem(src) 
		: findPreviousSample(src);
	var a = !X.isObject(rid) && ex.QS("[main_rel]");
	var name = a && a.A("name");
	if(a && name && a.hasA("check_unique")) {
		var fv = collectFVfromCont(ex);
		fv[name] = rid;
		if(!testUniqueRowInCont(ex, fv)) return;
	}
	if(src.hasA("max_count") && ex) {
		var cnt = 0;
		for(var i=0;i<ex.parentNode.childNodes.length;++i) {
			var n = ex.parentNode.childNodes[i];
			if(n.tagName && n.hasA('cmd') && !n.hasA('sample')) {
				cnt++;
			}
		}
		if(cnt >= (+src.A("max_count"))) {
			alert("Больше "+src.A("max_count")+" добавить нельзя!");
			return;
		}
	}
	var ec = findSaveCmdElem(ex);
	var fv = takeDefVals(ec);
	if(name)
		fv[name] = rid;
	if(X.isObject(rid)) for(var i in rid) fv[i] = rid[i];
	return modificationRequest(ec, fv)
		.then( makeSaveFunc(src, src.A('add') !== 'here'), failFunc)
		.done(function(obj) {
			if(obj && src.A('add') !== 'here') {
				var actl = obj.QS("[main_rel]");
				if(actl && actl.A('name'))
					setRelV( actl, list_item || { rid: rid });
			}
			if(obj && X.isObject(rid)) 
				for(var i in rid) { var e = obj.QSname(i)
					if(e) e.setV(rid[i]);
				}
			return obj;
		})
}

function makeChoose(src, e, rid) {
	if(rid === undefined) rid = e.hasA("value-patch") ? e.A("value-patch") : e.hasA("value") ? e.A('value') : e.V();
	var list_item = {
		rid: rid,
		text: e && e.A && (e.hasA("rt") ? e.A() : ( e.V() || rid )), //?
		title: e && e.title
	}
	if(src.hasA("add")) {
		return doAdd(src, rid, list_item) //promise (obj) - cloned
	} else {
		src.focus();
		if(src.tagName == 'A') {
			setRelV( src, list_item);
			return saveControlVal(src); //promise (obj) - affected
		} else {
			src.setV(list_item.rid || list_item.text);
			src.callchange();
			return X.defer(src); //promise (obj) - affected
		}
	}
}
function startAddRow(src) { 
	if(src.A('add') == 'suspend') {
		var g = cloneSampleRow(findPreviousSample(src));
		var actl = g.QS("[main_rel]");
		if(actl && actl.A('name'))
			setRelV( actl, list_item);
		src.toSave = g;
		g.insert_initiator = src;
		!src.hasA("static") && src.setA('add', 'resume');
		suspendSave(g);
		var fv = takeDefVals(g);
		modificationRequest(g, fv);
		var defs = takeDefVals(src);
		for(var i in defs)
			if(g.QSname( i))
				g.QSname( i).setV( defs[i] );
		var tf = g.QS("[main-focus]") || g.QS("A,INPUT,TEXTAREA,SELECT");
		if(tf) tf.safeFocus();
		return X.defer(g);
	} 
	if(src.A('add') == 'resume') {
		var g = src.toSave || findSaveCmdElem(src);
		var f = makeSaveFunc(g);
		return resumeSave(g).done(function(ind_or_txt) {
			if(ind_or_txt) {
				src.toSave = null;
				!src.hasA("static") && src.setA('add', 'suspend');
				g.insert_initiator = null;
				f(ind_or_txt);
			} else {
				if(I('sending_indicator'))
					I('sending_indicator').incA('count', -1);
			}
			return g;
		})
	}
	return doAdd(src, '', {rid:''})
} 

function refreshNoRowStatus(e) { 
	e.presentA('no_rows', 
		e.tBodies? 
		!e.tBodies[0] || !e.tBodies[0].rows.length 
		|| e.tBodies[0].firstElementChild.hasA('sample') && e.tBodies[0].rows.length <= 1 
		: e.children.length === 0 || e.children.length === 1 && e.firstElementChild.hasA('sample')
	)	
}
function dyn_refresh(e) {
	dynamic( e.UA('dynamic') );
}
function dynamic(e) {
	var ref = e.evalHere("@dynamic");
	e.setA("loading","");
	if(ref) {
		X.GET(ref)
			.done(function(txt) {
				e.removeAttribute("loading");
				setBodyToContaner(e, txt);
				prepareControls(e);
			});
	}
}

function swapRows(a, b, f) {  // a- first or null b -second or null
	a = a && findSaveCmdElem(a);
	b = b && findSaveCmdElem(b);
	if(!a && !b) return;
	if(!b) {
		b = a.nextElementSibling;
		if(b && b.className == 'transit_row') b = b.nextElementSibling;
	}
	if(!a) {
		a = b.previousElementSibling;
		if(a && a.className == 'transit_row'
			|| a.hasA('sample')
		) a = a.previousElementSibling;
	}
	if(!a || !b) return;
	var b1 = b.hasA('joined_with_next_row') && b.nextElementSibling;
	a.insertBeforeIt(b);
	if(b1) b.insertAfterIt(b1);
	var fv = {}; fv[f] = -1;
	var anpp = a.A('npp');
	var bnpp = b.A('npp');
	return modificationRequest(a, fv)
		.done( function() { fv[f] = anpp; b.setA('npp', anpp);
			return modificationRequest(b, fv)
		})
		.done( function() { fv[f] = bnpp; a.setA('npp', bnpp);
			return modificationRequest(a, fv)
		})
}
function newNpp(e) {
	e = findSaveCmdElem(e);
	var npp = 0;
	for(e = e.parentNode.firstElementChild; e; e = e.nextElementSibling)
		npp = Math.max(npp, e.A('npp'))
	return npp+1
}

function moveRowUpDown(e, diff) {
	var r = findSaveCmdElem(e);
	if(!diff) return;
	if(r.sectionRowIndex >= r.parentNode.rows.length-1 && diff>0) return;
	if(r.sectionRowIndex <= 1 && diff<0) return;
	var toExch = r.parentNode.rows[ r.sectionRowIndex + diff ];
	if(diff>0) r.parentNode.insertBefore(toExch, r);
	else r.parentNode.insertBefore(r, toExch);
	
	var keys = []; var levs= [];
	for(var i = 1; i < r.parentNode.rows.length; ++i) {
		keys.push( sas_coder.ValList([r.parentNode.rows[i].A("rid")]) );
		levs.push("0");
	}
	modificationRequest(r, null, {
		target: "rep_ren"
		, key_vals: sas_coder.ValList( keys )
		, r_levs: sas_coder.ValList( levs )
		}
	).done(function(){});
}

function patchMenuItems(ns) {
	//TODO: sortSelect(e);
	var lis = ns.QSA('LI');
	var pmi = ns.A("patch_menuitem");
	if(pmi) for(var i = 0; i < lis.length; ++i) lis[i].evalHere(pmi);
	var lis = ns.QSA('LI');
	if(!ns.QS('A')) for(var j = 0; j < lis.length; ++j)
		lis[j].innerHTML = '<a href="javascript:menu;">'+lis[j].innerHTML+'</a>';
	var lis = ns.QSA('A[href="javascript:menu;"]');
	for(var j = 0; j < lis.length; ++j)
		lis[j].setA("onclick","this.closeModal(this); return false");
}

adviceIt = function(e) { 
	adviceIt = X.throttle(function(e) { return _adviceIt(e); }, 300) //once
	adviceIt(e);
}

function _adviceIt(e) {

	var choose = e.tagName != "MENU" && e.tagName != "DL";
	var m =  choose ? 
			(e.A("callmenu") == 'prepended-menu' ? e.previousElementSibling : e.nextElementSibling )
		: e;
	if( m.QS('[filter_def]') ) {
		var filterInput = m.QS('[filter_def]').QS('input[filter_ctrl=""]');
		filterInput.setV( e.V() );
		return applyFuncFilter( filterInput ).done(function() {
			if(m.A('display')=='N') {
				setWithMenu(e, undefined, true)
			}
		})
	} else {
		setWithMenu(e)
	}
}

function elemInShadow(cont, e) {
	while(e && e !== cont && !e.hasA('umbrella'))
		e = e.parentNode;
	return e && e !== cont;
}

function setWithMenu(btn, onchoose, dontreload) {
	if(btn.hasA('disabled')) return;
	var choose = btn.tagName != "MENU" && btn.tagName != "DL";
	var m =  choose ? 
			(btn.A("callmenu") == 'prepended-menu' ? btn.previousElementSibling : btn.nextElementSibling )
		: btn;
	var lastSelect =  choose ? 
			(btn.A("callmenu") == 'prepended-menu' ? m.nextElementSibling : m.previousElementSibling)
		: btn;
	if(m.A('ref') && !dontreload) {
		if(!m.A('ref-src')) m.setA('ref-src',  m.evalHere(m.V()));
		btn.setA('loading','');
		return reloadElement(m)
		.done(function(txt) {
			if(m.hasA('advice')) {
				return m.evalHere('@advice')
			}
		})
		.done(function(){
			btn.removeAttribute('loading');
			patchMenuItems(m);
			return setWithMenu(btn, onchoose, true);
		});
	}
	m.setA('umbrella','');
	var flt = m.A("filter");
	m.setD(false);
	if(m.tagName == 'MENU') {
		var a = m.QSA("A,[filter]");
		if(!a.length) return;
		if(flt) { m.tofocus = null;
			for(var i = 0; i < a.length; ++i) {
				var v = a[i].UA('value').evalHere(flt, null);
				a[i].UA('value').setD(v);
				if(v && !m.tofocus && a[i].tagName == 'A') m.tofocus = a[i];
			}
			if(!m.tofocus) return;
		}
		m.setA('quick-close', 'Y')
	} else {
		m.searchbox = m.QS('INPUT');
		m.refill = X.throttle(function() {
			if(flt)
				m.evalHere(flt).done(
					function(dd) {
						if(dd !== undefined) {
							setBodyToContaner(m.QS("DD"), dd);
							m.evalHere('@onfiltred');
						}
					}
				)
		}, 300);
		m.refill();
		m.setA('quick-close', 'Y').setA('close-box', 'Y')
	}
	return m.showXModal()
	  .done(function(e) {
		  if(choose) {
			if(!e) return X.defer();
			e =  e.UA('value-patch') || e.UA('value') || e; 
			if(lastSelect.A('transitButton'))
				lastSelect = lastSelect.previousElementSibling; 
			// autogenerated menu replaces onclick in affected 'A'
			// so, we have no chance intercept setWithMenu modal return 
			// and do something instead
			// so we use this event
			var def = function(src, val) { return makeChoose(src || lastSelect, val || e) }
			def.choose = e;
			if(lastSelect.hasA('onchoose'))
				return lastSelect.evalHere("@onchoose", def);
			else
				return def().done(function(obj){ return (onchoose||nop)(obj, e); });
		  }
		  return e;
	  });
}

function chooseWithLightEdit(e, re, sel) {
	var v = e.lighteditValue;
	if(v && v.match(re)) {
		v = RegExp.$1;
		sel = sel.replace('%', v);
		var a = (e.tagName == 'MENU' ? e : e.nextElementSibling).QSA(sel);
		if(a.length == 1) {
			if(e.tagName == 'MENU')
				a[0].closeModal(a[0]);
			else
				makeChoose(e, a[0]); 
			X.lightEdit(e, '')
			return true;
		}
		if(a.length == 0) {
			return true;
		}
		return true;
	}
	return false;
}


function delDataRow(e) {
	return modificationRequest(e)
		.done( makeSaveFunc(findSaveCmdElem(e)) ).fail(failFunc)
}
function doDelete(e, confirm_str) {
	if(confirm_str && !confirm(confirm_str)) return X.defer();
	e = findSaveCmdElem(e);
	if(e.insert_initiator) {
		e.insert_initiator.toSave = null;
		e.insert_initiator.setA('add', 'suspend');
		if(e.hasA('joined_with_next_row')) e.nextElementSibling.removeIt();
		e.removeIt();
		refreshControls();
		return X.defer();
	}
	return modificationRequest(e, null, {def_vals: '-'})
		.done( makeSaveFunc(e) ).fail(failFunc)
}
function sortSelect(s)
{
	if(s.hasA("nosort")) return;
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
	var ml = e.A("maxlength");
	if(ml) { 
		ml = +(ml);
		if(ml && ml < 1000) return ml;
	}
	var type = e.A("vtype");
	if(type =='D') return 10;
	if(type =='DT') return 16;
	if(type =='PRU') return 20;
	var vmin = e.evalHere("@vmin", "")+"";
	var vmax = e.evalHere("@vmax", "")+"";
	if(vmin || vmax) return Math.max(vmin.length, vmax.length);
	var re = e.A("re");
	if(re && re.match(/^\/\^(\.|\[.*\]|\\d)\{(\d*,)?(\d+)\}\$\/$/)) return +(RegExp.$3);
	return 0;
}
var ctrlMask={
	placehold:"_",
	maskPress:function (mask,input,ev)
	{
		this.repearIfNeed(input);		
		var event = ev||window.event;
		var cp=this.getCaretPosition(input);
		var val=input.value;
		var newval="";	
		//bck sps + del
		if (event.keyCode==8||event.keyCode==46)
		{	
			var dstart=-1,dend=-1;
			if (window.getSelection)
			{
				dstart=input.selectionStart;
				dend=input.selectionEnd;
			}
			else 
			{
				var txt = document.selection.createRange().text;
				dstart=cp-txt.length;
				dend=cp;
			}
			if (dend-dstart==0) this.delChar(input,cp,event.keyCode);
			else
			{
				this.setCaretPosition(input,dstart);
				for (var i=0;i<dend-dstart;i++) this.delChar(input,this.getCaretPosition(input),46);			
			}
			event.preventDefault ? event.preventDefault() : event.returnValue = false;
			return;
		}
	},
	delChar: function(input,cp,keyCode)
	{
		var newvalue=input.value;
		var prevval=input.value;
		if (keyCode==8&&cp>0) cp--;			
		if (!this.isSeparator(input.value.charAt(cp)))
		{
			//if (this.getCurMask(input,cp)!="")
			var plsh=this.placehold;
			if (this.getCurMask(input,cp)=="D"||this.getCurMask(input,cp)=="S") plsh="";
			if (cp<input.value.length&&cp>-1) newvalue=prevval.substring(0,cp)+plsh+prevval.substring(cp+1,prevval.length);
			input.value=newvalue;
		}
		if (keyCode==46&&((this.getCurMask(input,cp)!="S"&&this.getCurMask(input,cp)!="D")||this.isSeparator(prevval.charAt(cp)))) cp++;			
		this.setCaretPosition(input,cp);
	},
	newOnPaste:function (mask,input,ev)
	{	
		var clp="";
		this.repearIfNeed(input);
		var event = ev || window.event;	
		// if has selection
		var dstart=-1,dend=-1;
		var dl =0;
		if (window.getSelection)
		{
			dstart=input.selectionStart;
			dend=input.selectionEnd;
		}
		else 
		{
			var cp=this.getCaretPosition(input);
			var txt = document.selection.createRange().text;
			dstart=cp-txt.length;
			dend=cp;
		}
		if (dend-dstart>0) 
		{
			this.setCaretPosition(input,dstart);
			for (var i=0;i<dend-dstart;i++) this.delChar(input,this.getCaretPosition(input),46);
			this.setCaretPosition(input,dstart);			
		}		
		if (window.clipboardData!==undefined) clp=window.clipboardData.getData("Text");
		else clp=event.clipboardData.getData("text/plain");
		for (var i=0;i<clp.length;i++) this.pasteChar(input,mask,clp[i]);
		event.preventDefault ? event.preventDefault() : event.returnValue = false;
		input.setAttribute("RSH_lastval",input.value);
		return;
	},
	constructMask:function (mask,input)
	{
		var stpos=-1;
		var newvalue="";
		for (var i=0;i<mask.length;i++)
		{
			var cm=mask.charAt(i);
			if (this.isSeparator(cm)) newvalue+=cm;
			else
			{
				if (stpos==-1) stpos=i;
				if (cm=="d"||cm=="s") newvalue+=this.placehold;
			}
		}
		input.value=newvalue;
		this.setCaretPosition(input,stpos);	
	},
	getCurMask:function (input,curpos)
	{
		var maskcur=0;
		var inpcur=0;
		var atommask="";
		var mask=input.getAttribute("RSH_mask");
		while(maskcur<mask.length)
		{
			atommask=mask.charAt(maskcur);
			if (atommask=="") break;
			cstr=input.value.charAt(inpcur);			
			if (inpcur==curpos) return atommask;
			if (atommask=="s"||atommask=="d"||this.isSeparator(atommask)) 
			{
				maskcur++;
				inpcur++;
			}
			if (atommask=="S"||atommask=="D")
			{
				if (this.isSeparator(input.value.charAt(inpcur))) maskcur++;
				else inpcur++;
				//if (inpcur+1<input.value.length) if (this.isSeparator(input.value.charAt(inpcur+1))) maskcur++;
			}
						
		}
		return "";	
	},
	// return true if need event.prevent 
	pasteChar:function (input,mask,evkey)
	{
		var newvalue="";
		var atommask="";
		var prevval=input.value;
		curpos=this.getCaretPosition(input);
		var _nmask=this.getCurMask(input,curpos);
		if (this.isSeparator(prevval.charAt(curpos))&&
			((_nmask!="D"&&_nmask!="S")||this.isSeparator(evkey))) 
		{	
			curpos++;
			this.setCaretPosition(input,curpos);
			_nmask=this.getCurMask(input,curpos);
		}
		if (_nmask!=""&&evkey!="")
		{
			if (this.isSeparator(evkey))//this.isSeparator(prevval.charAt(curpos))
			{					
				//newvalue=prevval;
				//curpos+=1;						
				//this.setCaretPosition(input,curpos);
				return true;
			}
			else
			{
				var num=!isNaN(parseInt(evkey,10));
				if ((num && (_nmask=="d"||_nmask=="D"))||(!num&& (_nmask=="s"||_nmask=="S")))
				{
					var addpos=1;
					if (_nmask=="D"||_nmask=="S") addpos=0;
					newvalue=prevval.substring(0,curpos)+evkey+prevval.substring(curpos+addpos,prevval.length);
					input.value=newvalue;
					curpos++;
					this.setCaretPosition(input,curpos);
					return true;
				}
				if ((!num&&_nmask=="d")||(num&&_nmask=="s"))
				{
					//input.value=prevval;
					//this.setCaretPosition(input,curpos);			
					return true;
				}
			}
		}
		return false;
	},
	maskIt:function (mask,input,event)
	{	
		var newvalue="";		
		var evkey=null;
		var _nmask="";
		input.RSH_lastval=input.getAttribute("RSH_lastval");
		event = event || window.event;
		if (event!=null) evkey=this.getChar(event);
		//mozilla sux, ctrl+v
		if (event.which != null) if ((event.which==118||event.which==99||event.which==97||event.which==122)&&event.ctrlKey) return;
		if (evkey==null)
		{
			//mozilla sux, arrows
			if (event.keyCode>41&&event.keyCode<38)event.preventDefault ? event.preventDefault() : event.returnValue = false;
			return;
		}
		if (mask=="") return;
		else	
		{
			if (this.pasteChar(input,mask,evkey)) 
			{
				event.preventDefault ? event.preventDefault() : event.returnValue = false;
				return;
			}
		}
		event.preventDefault ? event.preventDefault() : event.returnValue = false;
		return;
	},
	isSeparator:function (str)
	{
		var separr=";:.-+() #,/\\[]%@*";
		return separr.indexOf(str)>=0;
	},
	getChar:function (event) {
	  if (event.which == null) {
		return String.fromCharCode(event.keyCode) // IE
	  } else if (event.which!=0 && event.charCode!=0) {
		return String.fromCharCode(event.which)   // the rest
	  } else {
		return null // special key
	  }
	},
	getCaretPosition:function  (oField) 
	{
	  // Initialize
	  var iCaretPos = 0;
	  // IE Support
	  if (document.selection) {
		// Set focus on the element
		oField.focus ();
		// To get cursor position, get empty selection range
		var oSel = document.selection.createRange ();
		// Move selection start to 0 position
		oSel.moveStart ('character', -oField.value.length);
		// The caret position is selection length
		iCaretPos = oSel.text.length;
	  }
	  // Firefox support
	  else if (oField.selectionStart || oField.selectionStart == '0')
		iCaretPos = oField.selectionStart;
	  // Return results
	  return (iCaretPos);
	},
	setCaretPosition:function  (ctrl, pos) 
	{
		if(ctrl.setSelectionRange)
		{
			ctrl.focus();
			ctrl.setSelectionRange(pos,pos);
		}
		else if (ctrl.createTextRange) {
			var range = ctrl.createTextRange();
			range.collapse(true);
			range.moveEnd('character', pos);
			range.moveStart('character', pos);
			range.select();
		}
	},
	getValue: function(input)
	{
		var mask="";
		if (input.hasAttribute("RSH_mask")) mask=input.getAttribute("RSH_mask");
		else return input.value;
		var val=input.value;
		var newval="";
		var newvalvclear="";
		for (var i=0;i<val.length;i++)
		{
			var chr=val.charAt(i);
			var msk=this.getCurMask(input,i);
			if (chr!=this.placehold)//&&(msk=="d"||msk=="s"||this.isSeparator(chr)))
			{
				newval+=chr;
				if (!this.isSeparator(chr)) newvalvclear+=chr;
			}
		}
		if (newvalvclear=="") return "";
		return newval;
	},
	ctchContextmenu: function(event,input)
	{
		//this.setCaretPosition(input,this.getCaretPosition(input));
		input.setAttribute("RSH_lastval",input.value);
	},
	testContain: function (input)
	{
		var mask="";
		if (input.hasAttribute("RSH_mask")) mask=input.getAttribute("RSH_mask");
		else return false;
		var val=input.value;
		var regx="";
		for (var i=0;i<mask.length;i++)
		{
			var msk=mask.charAt(i);			
			if (msk=="d") regx+="[\\d|"+this.placehold+"]";
			if (msk=="s") regx+="[\\D|"+this.placehold+"]";
			if (msk=="D") regx+="[\\d|"+this.placehold+"]*";
			if (msk=="S") regx+="[\\D|"+this.placehold+"]*";
			if (this.isSeparator(msk))
			{
				var specarr=["\\","+","*","|","/","(",")","{","}",".","?","[","]","^","?"];
				if (msk==" ") regx+="[\\s]";
				else
				{
					var t_t="";
					for (var j=0;j<specarr.length;j++) if (msk==specarr[j]) t_t="[\\"+specarr[j]+"]";
					if (t_t=="") regx+=msk;
					else regx+=t_t;
				}				
			}
		}
		var rg=new RegExp(regx,"i");
		if (rg.test(val)) return true;
		return false;		
	},
	repearIfNeed: function(input)
	{
		if (!this.testContain(input))
		{
			input.value="";
			this.constructMask(input.getAttribute("RSH_mask"),input);
			if (input.getAttribute("RSH_lastval")!="") 
			{
				this.setCaretPosition(input,0);
				for (var i=0;i<input.getAttribute("RSH_lastval").length;i++) 
					this.pasteChar(input,input.getAttribute("RSH_mask"),input.getAttribute("RSH_lastval")[i]);
			}
		}
		else input.setAttribute("RSH_lastval",input.value);
	},
	installMask: function(input,mask)
	{
		this.setCaretPosition(input,0);
		input.setAttribute("RSH_mask",mask);
		input.setAttribute("RSH_lastval","");
		var prevval=input.value;
		this.constructMask(mask,input);
		var masker = this;
		input.setAttribute("onkeypress","ctrlMask.maskIt('"+mask+"',this,event);");
		input.setAttribute("onkeydown","ctrlMask.maskPress('"+mask+"',this,event);");
		input.setAttribute("onpaste","ctrlMask.newOnPaste('"+mask+"',this,event);");
		//input.oncontextmenu=function (event){masker.ctchContextmenu(event,input);}		
		input.setAttribute("onblur","ctrlMask.repearIfNeed(this);");
		input.setAttribute("oncut","return false;");
		/*function(event)
		{
			var ev = event || window.event;
			ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
		}
		*/
		for (var i=0;i<prevval.length;i++) this.pasteChar(input,mask,prevval[i]);
	},
	uninstallMask: function (input)
	{
		input.removeAttribute("RSH_mask");
		input.removeAttribute("RSH_lastval");
		input.setAttribute("onkeypress","");
		input.setAttribute("onkeydown","");
		input.setAttribute("onpaste","");
		input.setAttribute("onblur","");
		input.setAttribute("oncut","");
		input.value="";
	},
	setValue: function (input,val)
	{
		this.setCaretPosition(input,0);
		var mask=input.getAttribute("RSH_mask");
		for (var i=0;i<val.length;i++) this.pasteChar(input,mask,val[i]);
	}
}
function uniname(name) {
	var elems;
	while((elems = document.QSA('[name="'+name+'"]')).length > 0) {
		name = name + elems.length;
	}
	return name;
}
function prepareControls(cnt, init) {

	var todel = [];

	var a = cnt.QSA("[xdata]");
	for(var i = 0; i < a.length; ++i)
	{
		var e = a[i];
		todel.push(e);
		var n = e.A('xdata');
		if(n=='-cmd') { e.parentNode.setA('cmd', e.V()); continue; }
		var c = findSaveCmdElem(e);
		if(n.charAt(0)=='-') { c.setA(n.substr(1), e.V()); continue; }
		c.setA('xdata-'+n, e.V());
		c.setA('xdata-'+n+'-cmd', e.A("cmd"));
	}

	var dyn = cnt.QSA("[dynamic]");
	for(var i=0;i<dyn.length;++i) {
		dynamic(dyn[i]);
	}
	function translateAttrs(s, d, attrs) {
		for(var i=0;i<attrs.length;++i) {
			d.setA(attrs[i], s.A(attrs[i]))
			s.removeAttribute(attrs[i])
		}
	}
	var themed = cnt.QSA("[theme][tag], [theme][list]");
	for(var i=0;i<themed.length;++i) {
		var elem = themed[i];
		var pair = elem.nextElementSibling;
		var container = document.createElement('DIV');
		translateAttrs(elem,container,['theme','label','wide','inline','tip'])
		elem.parentNode.insertBefore(container,elem);
		elem.remove()
		container.appendChild(elem);
		if( pair && (pair.tagName == 'DL' || pair.tagName == 'MENU') ) {
			pair.remove()
			container.appendChild(pair)
		}
		if(container.hasA('label')) {
			var label = document.createElement('LABEL');
			label.innerText = container.A('label');
			container.appendChild(label);
		}
		if(container.hasA('tip')) {
			var tip = document.createElement('SPAN').setA('tip',container.A());
			container.appendChild(tip);
		}
		if(elem.hasA('list')) {
			elem.setA('onrefresh',"this.setA('count', this.QSA('[list]>tbody>tr[cmd]:not([sample])').length)")
		}
	}
	var a = cnt.QSA("[tag]"); // convert <DFN tag="desired tag" attrs>value</DFN>
	for(var i = 0; i < a.length; ++i) {
		var e = a[i];
		if(e.hasA("tag-done")) continue;
		e.setA("tag-done", 'Y');
		
		var cc = findSaveCmdElem(e);
		var def_locker = cc && (cc =  cc.UA('locker'))? cc.A('locker') : '';
		
		if(e.evalHere("@readonly_if", def_locker)) continue;
		
		e.setA('unlocked','Y');
		
		if(e.tagName == 'DFN' || e.tagName == 'PRE' || e.tagName == 'LI') {
			var ne = document.createElement(e.A("tag") || (e.tagName == 'PRE'? 'textarea' : 'input'));
			if(e.tagName == 'LI')
				ne.setA('type', 'radio');
			for(var j = 0; j < e.attributes.length; ++j) 
				ne.setAttribute(e.attributes[j].nodeName, e.attributes[j].nodeValue)
			if(e.tagName == 'PRE')
				ne.setA('keep_sp','Y');
			if(ne.tagName == 'A' && !ne.hasA('href')) 
				ne.setA('href', 'javascript:undefined');
		} else if(e.tagName == 'A') {
			if(e.A('tag') != 'A') {
				var ne = document.createElement('INPUT');
				ne.type = 'hidden';
				ne.name = e.name;
				ne.setV( e.A('rid') );
			} 
			else ne = e;
			if(!e.hasA('href')) e.setA('href', 'javascript:undefined');
		} else 
			var ne = e;
		
		if(e.tagName == 'LI')
			e.insertBefore(ne, e.firstChild);
		else
			e.parentNode.insertBefore(ne,e);
		
		var ns = e.nextElementSibling;
		
		if(ns && ns.hasA('mctl'))
		if(ns.tagName == "MENU" || ns.tagName == "DL") {
			if(e.tagName != "BUTTON") {
				if(e.A('tag') == 'A' || true) { //new A-mode
					if(e.hasA('add_button')) {
						var b = document.createElement("BUTTON")
							.setA("type","button")
							.setA("onclick", "setWithMenu(this)")
							.setA("callmenu", '')
							.setA('transitButton', 'Y')
							.setA("onfocus", "clearError(this.previousElementSibling)");
						ns.insertBeforeIt(b);
					} else {
						if(ns.hasA('advice')) {
							ns.setA("advice","adviceIt(this.elementAdviced)")
							ne.setA("onkeyup", "adviceIt(this)")
							ne.adviceElement = ns
							ns.elementAdviced = ne
						} else {
							ne.setA("onclick", "setWithMenu(this)")
						}
						ne.setA("callmenu", 'prepended-menu')
							.presentA('space_only', !e.V().trim())
							.setA("onfocus", "clearError(this)")
							.setA("menuBefore", "Y");
						ns.setA("prepended-menu", "");
						//move before element
						ns.parentNode.insertBefore(ns,ne);
					}
				} 
			}
			if(ns.A('mctl')) {
				var msrc = document.QS(ns.A('mctl'));
				ns.innerHTML = msrc.innerHTML;
			}
			if(ns.tagName == "MENU") {
				patchMenuItems(ns);
				if(e.A('onkeydown') && e.A('onkeydown').trim().beginsWith("X.lightEdit"))
					ns
						.setA('onkeydown', e.A('onkeydown'))
						.setA('onchange-lightedit',  e.A('onchange-lightedit'));
			}
			if(ns.tagName == 'DL') {
				if(!ns.innerHTML)
					ns.innerHTML = "<DT><INPUT></DT><DD></DD>";
				var searchbox = ns.QS("INPUT");
				if(!searchbox) {
					ns.insertBefore(document.createElement("DT"), ns.firstChild);
					ns.QS('DT').innerHTML = "<INPUT>";
					searchbox = ns.QS("INPUT");
				}
				searchbox
					.setA("onkeyup", "this.parentNode.parentNode.refill()")
					.setA("onfocus","this.select()")
			}
		}
	
		if(ne.tagName == 'SELECT') {
			var m = ns.QSA('LI');
			var nv = null;
			for(j =0; j< m.length; ++j) {
				var o = new Option(m[j].V(), m[j].hasA("value-patch") ? m[j].A("value-patch") : m[j].A("value"));
				o.setA('rt', m[j].A('rt'));
				ne.options.add(o);
				if(m[j].className == 'selected' || ne.A('rid') == o.value)
					o.selected = o.defaultSelected = true;
			}
		} else
			if(ne !== e)
				if(e.tagName != 'LI' && e.A('type') !== 'radio')
					ne.setV( e.V() );
		
		if(e.tagName == 'DFN' || e.tagName == 'PRE')
			todel.push(e);
	}
	for(var i = 0; i < todel.length; ++i) todel[i].removeIt();
	todel = []
	
	var a = cnt.QSA("[lobload]");
	for(var i = 0; i < a.length; ++i) {
		var e = a[i];
		
		if(e.QS('form')) continue;
		
		var cc = findSaveCmdElem(e);
		var def_locker = cc && (cc =  cc.UA('locker'))? cc.A('locker') : '';
		
		if(e.evalHere("@readonly_if", def_locker)) continue;
		
		e.setA('unlocked','Y');
		framename = uniname('lobload_'+i);
		
		if(a[i].A('lobload')=='filer') {
			e.appendChild(
				document.createElement('BUTTON')
					.setA('type', 'button')
					.setA('onclick',"showFilerForm(this)")
					.setA('placeholder', a[i].A('placeholder')||'')
			);
			if(a[i].hasA('drop')) {
				e.appendChild(
					document.createElement('BUTTON')
						.setA('drop', a[i].A('drop'))
						.setA('type', 'button')
						.setA('onclick',"dropFiler(this)")
				);
			}		
			var ne = document.createElement('DIV')
				.setA('style', 'position:relative; display:inline-block')
				;
			
			ne.innerHTML = 
					'<div close-box=Y display=N modal=Y>'
					+'<form method="POST" enctype="multipart/form-data" target='+framename+' action=/az/server/php/filer.php>'
						+'<input type="hidden" name="fld" value="">'
						+'<input type="hidden" name="table" value="">'
						+(a[i].hasA('files') ? '<input type="hidden" name="file" value="">':'')
						+'<input type="hidden" name="key[]" value="">'
						+'<input type="file" name="file_data" value="Файл" onchange="onchooseFileForm(this)">'
					+'</form>'
					+'</div>';
			e.appendChild(ne);
		} else if(a[i].A('lobload')) {
			var b = a[i].QS('button[open]') 
				|| document.createElement('BUTTON')
					.setA('open', '')
					.setA('placeholder', a[i].A('placeholder')||'');
			e.appendChild( b
					.setA('type', 'button')
					.setA('onclick',"showFilerForm(this)")
			);
			if(a[i].hasA('drop') || a[i].QS('button[drop]')) {
				b = a[i].QS('button[drop]') 
					|| document.createElement('BUTTON').setA('drop', a[i].A('drop')||"×");
				e.appendChild( b
						.setA('type', 'button')
						.setA('onclick',"dropFiler(this)")
				);
			}		
			var ne = document.createElement('DIV')
				.setA('style', 'position:relative; display:inline-block')
				;
			
			ne.innerHTML = 
					'<div close-box=Y display=N modal=Y>'
					+'<form method="POST" enctype="multipart/form-data" target='+framename+' action="'+a[i].A('lobload')+'">'
						+'<input type="file" name="file_data" value="Файл" onchange="onchooseFileForm(this)">'
						+'<input type="hidden" name="lobarg" value="">'
					+'</form>'
					+'</div>';
			e.appendChild(ne);
		} else {
			var ne = document.createElement('DIV');
			ne.innerHTML = 
				'<button type=button onclick="showFileForm(this)"> </button>'
				+'<iframe width="1" height="1" style="display:none" '
				+' name='+framename+' ></iframe>'
				+'<div close-box=Y display=N modal=Y>'
				+'<form method="POST" enctype="multipart/form-data" target='+framename+' >'
				+'<input type="hidden" name="key_vals" value="__(XX)~~~">'
					+'<input type="hidden" name="field" value="">'
					+'<input type="hidden" name="table" value="">'
					+'<input type="hidden" name="cus_cap" value="">'
					+'<input type="hidden" name="get_from_ef" value="">'
					+'<input type="hidden" name="in_db" value="1">'
					+'<input type="hidden" name="lob_file_content" value="">'
					+'<input type="hidden" name="lob_mask" value="">'
					+'<input type="hidden" name="lob_readonly" value="">'
					+'<input type="hidden" name="lob_text_edit" value="">'
					+'<input type="hidden" name="refresh" value="">'
					+'<input type="hidden" name="Stream-Content-Type" value="">'
					+'<input type="hidden" name="Stream-filename" value="">'
					+'<input type="hidden" name="subop" value="file">'
					+'<input type="hidden" name="target" value="lob_ui">'
					+'<input type="file" name="file_data" value="Файл" onchange="onchooseFileForm(this)">'
				+'</form>'
				+'</div>';
			e.appendChild(ne);
		}
	}


	var a = cnt.QSA("[xvalue]");
	for(var i = 0; i < a.length; ++i)
	{
		var e = a[i];
		var v = e.evalHere("@xvalue", { value: "", cmd: "" });
		if(e.tagName == "INPUT" && e.type=="radio") {
			if(a.value == v.value) e.setA("checked", '');
		} else 
			e.setV(v.value === null ? '': v.value);
		e.setA("cmd", v.cmd); 
	}
	
	var a = cnt.QSA("[copy-of]");
	for(var i = 0; i < a.length; ++i) {
		var n = a[i].A('copy-of')
		var e = cnt.QSattr('copy-src',n) || cnt.QSname(n)
		if(e)
			a[i].setV(getCtrlValue(e).pval);
	}

	refreshControls(init);

	var a = cnt.QSA("[fctl]");
	for(var i = 0; i < a.length; ++i)
	{
		var e = a[i];
		if(e.A('fctl') == 'done') continue;
		e.setA('fctl', 'done');

		var len = getApproxLength(e);
		if(e.tagName == "INPUT")
			e.setA("onchange", "saveControlVal(this)");
		if(e.tagName == "INPUT" && (e.A("vtype")=="3M" || e.A("vtype")=="threeM")) {
			e.setA("onclick", "show3stateMenu(this)");
			e.setA("onkeydown", "keydown3stateMenu(event, this)");
			e.setA('readonly','Y');
			if(e.V()=="") e.setV("?");
		} else 
		if(e.tagName == "INPUT" && (e.A("vtype")=="3" || e.A("vtype")=="three")) {
			var ne = document.createElement("SPAN");
			e.hasA('style') && ne.setA( 'style', e.A('style') );
			e.hasA('disabled') && ne.setA( 'disabled', '' );
			ne.setA("bool-state", {'да':'yes','1':'yes', 'нет':'no','0':'no','':'?','?':'?'}[ e.V() ]);
			ne.innerHTML =
				'<a yes href="" onclick="bool3state(this);return false">да</a>/<a no href="" onclick="bool3state(this);return false">нет</a>';
			e.parentNode.insertBefore( ne, e);
			e.setA('control', 'this.previousSibling');
			e.setA('style', 'display:none');			
		} else
		if(e.tagName == "INPUT" && (e.A("vtype")=="2" || e.A("vtype")=="two") && e.type != 'hidden' && e.hasA("mkii")) {
			var ne = document.createElement("SPAN");
			e.hasA('style') && ne.setA( 'style', e.A('style') );
			e.hasA('disabled') && ne.setA( 'disabled', '' );
			var v1 = e.A('checked-value')!=null && e.A('checked-value') || e.A("vtype")=="two" && 'да' || '1';
			var v0 = e.A('unchecked-value')!=null && e.A('unchecked-value') || e.A("vtype")=="two" && 'нет' || '0';
			var checked = {'да':true,'1':true}
			checked[e.A('checked-value')] = true; delete checked[null];
			if(checked[e.V()]) {
				ne.setA('checked', '');
			}
			ne.setA('bool2', '');			
			ne.setA('checked-value', v1);
			ne.setA('unchecked-value', v0);
			ne.setA('onclick','bool2state(this);return false');
			e.parentNode.insertBefore( ne, e);
			e.setV(ne.hasA('checked') ? v1 : v0);
			e.setA('control', 'this.previousSibling');
			e.setA('style', 'display:none');
		} else
		if(e.tagName == "INPUT" && (e.A("vtype")=="2" || e.A("vtype")=="two") && e.type != 'hidden') {
			var ne = document.createElement("INPUT");
			ne.type = "checkbox";
			var v1 = e.A('checked-value')!=null && e.A('checked-value') || e.A("vtype")=="two" && 'да' || '1';
			var v0 = e.A('unchecked-value')!=null && e.A('unchecked-value') || e.A("vtype")=="two" && 'нет' || '0';
			var checked = {'да':true,'1':true}
			checked[e.A('checked-value')] = true; delete checked[null];
			if(checked[e.V()]) {
				ne.checked = true;
				ne.setA('checked', '');
			}
			ne.setA('checked-value', v1); ne.setA('unchecked-value', v0);
			ne.setA("onchange", "this.nextSibling.value = this.checked? this.A('checked-value'): this.A('unchecked-value'); this.nextSibling.callchange()");
			e.parentNode.insertBefore( ne, e);
			e.setA('control', 'this.previousSibling');
			e.setA('style','display:none');
		} else 
		if(e.tagName == "INPUT" && e.type=="radio") {
		} else 
		if(e.tagName == "INPUT" || e.tagName == "TEXTAREA" || e.tagName == "SELECT") {
			if(e.tagName == "INPUT" && e.A("vtype")=='D') {
				if( !(e.A("add_button")=='N'))//add_button=table
				{
					// set mask
					/*
					//need DMY
					if(e.value) 
					{
						var d = Date.smartParse(e.value);					
						e.setV( d.formatDate('DMY') );
					}					
					ctrlMask.installMask(e,'dd.dd.dddd');
					*/
					if(!e.hasA('disabled'))
						Calendar2.prepareCalendar(e, 'DMY');					
				}
				if(e.value) {
					var d = Date.smartParse(e.value);					
					e.setV( d.formatDate('DMY') );
				}
			}			
			e.setA("onchange", "saveControlVal(this)")
			 .setA("onfocus", "clearError(this)");
			if(len) {
				e.setAttribute("size", len);
				e.setAttribute("maxlength", len);
			} else {
				if(e.tagName == "INPUT" || e.A("vtype") == 'S') e.setA("maxlength", 1000);
			}
			if(e.tagName == "SELECT") sortSelect(e);
		} 
		X.autoResizeOnEvent(null, e);
	}
	for(var i = 0; i < todel.length; ++i) todel[i].removeIt();
	todel = []
	
	
	var toMove = [];
	var a = cnt.QSA("[move_point]");
	for(var i = 0; i < a.length; ++i)
	{
		var e = a[i];
		var n = e.A("move_point");
		var x = document.getElementsByName(n)[0] || I(n);
		if(x)
			if(x.tagName == "TD")
				toMove.push( { to: e, str: x.innerHTML } );
			else
				toMove.push( { to: e, from: x } );
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
		pp.innerHTML = parent.page_top_helps[pp.A("page_name")] || pp.A("page_name");

	window.D3C && D3C.setup();

	d2.SA("[qe-start]")
      .A("onclick", "QE10.show(this)");

	recalcParentSize();
		
}

function refreshControls(def) {
	var a = QSA("[onrefresh]");
	for(var i = 0; i < a.length; ++i)
		a[i].evalHere("@onrefresh", def)
}

var currentBoolChoose = null;
function show3stateMenu(e) {
	e.menu = e.parentNode.insertBefore(document.createElement('DIV'), e)
	e.menu.id = "boolChoose";
	e.menu.setA("quick-close", "Y");
	e.menu.className = "bc"+{'да':1, 'нет':0,'1':1,'0':0,'':'','?':'' }[getCtrlValue(e).val];
	setBodyToContaner(e.menu,  "<div id=boolChoosew><table>"+
		"<tr class=x><td><a href='javascript:undefined;' onclick='this.closeModal(null)'>?</a>"+
		"<tr class=f><td><a href='javascript:undefined;' onclick='this.closeModal(0)'>нет</a>"+
		"<tr class=t><td><a href='javascript:undefined;' onclick='this.closeModal(1)'>да</a>"+
		"</table></div>");
	e.menu.tofocus = e.menu.className == 'bc'? 
		e.menu.QS('.f A') : e.menu.QS('.x A');
	e.menu.showXModal().done(function(v) {
		if(v!==undefined) {
			//alert(v);
			e.setV(v==1? 'да' : v==0? 'нет' : '?'); 
			e.callchange();
		}
	});
}
function keydown3stateMenu(ev, e) {
	if(ev.keyCode == 8 || ev.keyCode == 46) { e.setV('?'); e.callchange(); }
	else if(ev.keyCode == 37) { e.setV('нет'); e.callchange(); }
	else if(ev.keyCode == 39) { e.setV('да'); e.callchange(); }
	else if(ev.keyCode == 32) { e.onclick(); }
}
function bool3state(o)
{
	var pn = o.parentNode;
	if(pn.hasA('disabled')) return;
	var state = o.A('yes')!=null && 'yes' || o.A('no')!=null && 'no' || "?" 
	if(pn.A('bool-state')==state) state = '?';
	pn.setA('bool-state', state);
	pn.nextSibling.value = {'yes':'да','no':'нет','?':'?'}[state];
	pn.nextSibling.callchange();
}
function bool2state(o,noform)
{
	if(o.hasA('disabled')) return;
	var target = noform ? o : o.nextSibling;
	target.value = !o.hasA('checked') ? o.A('checked-value'): o.A('unchecked-value');
	o.presentA('checked', !o.hasA('checked') );
	target.callchange();
}

function checkThisCard(e, msg) {
	e = findSaveCmdElem(e) || e;
	var a = e.QSA("[fctl],[cctl]");
	var ind = true;
	for(var i = 0; i < a.length; ++i)
		if(!checkCtrl(a[i]))
			ind = false;
	var a = e.QSA("[checkcard]")
	if(ind)
	for(var i = 0; i < a.length; ++i)
		if(!a[i].evalHere('@checkcard')) {
			ind = false;
		}
	if(msg === undefined) msg = "Основные формальные проверки успешно выполнены";
	if(!ind) alert("Поля форм содержат недопустимые данные. Проверьте еще раз.")
	if(ind && msg)
		alert(msg)
	if(!ind) {
		var a = e.QSA('[error="Y"]');
		for(var i = 0; i < a.length; ++i) {
			var v = a[i].UA('display');
			if(v) v.setD(true);
		}			
	}
	return ind;
}

var sureText = "Вы уверены?"

function makeReady(e, fld, dt, ext, stext) { if(stext === undefined) stext = sureText;
	if(stext && !checkThisCard(e)) return;
	if(stext && !confirm(sureText)) return;
	
	var mp = ext || {}; mp[fld] = dt;

	modificationRequest(e, mp)
		.done( function() {
			return e.evalHere('@onreadydone');
		})
		.done(function() { 
			document.location.reload(); 
		} );
}
function makeEdit(e, fld, stext) { if(stext === undefined) stext = sureText;
	if(stext && !confirm(sureText)) return;

	var mp = {}; mp[fld] = "";

	modificationRequest(e, mp)
		.done(function() { 
				document.location.reload(); 
		} );
}

function delCard(e, f, stext) { if(stext === undefined) stext = sureText;
	if(stext && !confirm(sureText)) return;
	modificationRequest(e)
		.done( f || function(){} );
}

function testAndAlert(v,a) {
	if(!v) alert(a);
	return !!v;
}

function checkAddress(e) {
	if(!e.value) return true;
	//if(!e.value.match(/(^|\s|[,.])\d{6}(\s|[,.]|$)/)) return false; //has index
	return true;
}

function setFilterInURI(uri, fv, par) {
	par = par || "ro_filter";
	var fp = uri.URLParam(par) || "";
	var fpa = sas_coder.DecodeValList(fp);
	if(fpa) {
		var r = []
		for(var i = 0; i < fpa.length; ++i) {
			var e = fpa[i];
			if(e.match(/\(([a-zA-Z_0-9]+)\)/)) {
				var pn  = RegExp.$1;
				var pv = fv[pn];
				if(pv != undefined && pv != null ) {
					if(typeof pv == "string") {
						r.push(fpa[i].replace('('+pn+')', pv ));
					} else {
						r.push(
							fpa[i].replace("=", 
								{ "~=": "contains", "^=": "begins" }[pv.op ] || pv.op 
							).replace('('+pn+')', pv.val )
						);
					}
				}
			} else
				r.push(fpa[i]);
		}
		uri = uri.setURLParam( par, sas_coder.ValList(r) );
	}
	return uri;
}

function xdata(e) { var c = findSaveCmdElem(e);
	return { value: c.A('xdata-'+e.A("name")), cmd: c.A('xdata-'+e.A("name")+'-cmd') }
}

function openURLinFrame(e, uri) {
//TODO: check our uri and redir to it!
	X.GET(uri)
	.done(function(html) {
		var c = document.createElement("DIV");
		c.setA("frameBox", 'Y')
		c.style.marginTop = e.offsetHeight+"px";
		e.parentNode.insertBefore(c, e);
		setBodyToContaner(c, html);
		c.setA("close-box", 'Y')
		return c.showXModal().done(function(){});
	});
}


var sas_coder = {
	ValList :  function ( vals, delim ) {
		var d = delim || '~';

		var t = [];
		for( var i = 0; i < vals.length; ++i )
			t.push(('_' + vals[i]).replaceAll(d, d + d ) + d);
		return t.join('');
	},
	UnDoubleCharSubstr : function (s, ch, off )
	{
		var t = "";
		var p = 0;
		var pos = off;
		do
		{
			p = pos;
			pos = s.indexOf( ch, p );
			if ( pos == -1)
				break;
			var n = pos + 1;
			if( s.charAt(n) == ch )
			{
				t += s.substr( p, n - p );
				pos = n + 1;
			}
			else 
			{
				t += s.substr( p, pos - p );
				return {position:++pos,value:t}
			}
		} while( pos != -1 );
		t += s.substr( p, pos );
		return {position:pos,value:t}
	},
	IsValList : function(str) {
		return str.charAt(0) == '_';
	},
	DecodeValList : function (str, delim)
	{
		console.log(str);
		var d = delim || '~';
		var values = []
		var len = str.length;
		var pos = 0;
		while( pos < len )
		{
			ret = this.UnDoubleCharSubstr(str, d, pos);
			pos = ret.position;
			if( pos == -1 || ret.value.charAt(0) != '_' ) alert('DecodeValList error:'+ret.value);
			values.push(ret.value.substr(1));
		}
		return values.length ? values : null;
	},
	DecodeMap : function (str, delim)
	{
		var a = this.DecodeValList(str,delim);
		var r = {};
		var re = /([^:]*(?:::[^:]*)*):([^:]*(?:::[^:]*)*)/;
		for(var i=0; i<a.length; i++) {
			var v = a[i];
			var m;
			if(m = v.match(re) ) {
				r[ m[1].replace(/::/g, ':') ] = m[2].replace(/::/g,':');
			}
		}
		return r;		
	},

	Pair: function ( name, val )  {  return name.replace( /:/g, '::' ) + ':' + (val+'').replace( /:/g, '::' ); },
	FieldOpValue: function ( field, op, val)  { return field + " " + op + " " + val; },
	
	Map:  function ( map ) {
		var vals = []
		for( var k in map ) vals.push( this.Pair(k, map[k]) )
		return this.ValList( vals )
	}
}

function showFileForm(e) {
	e = e.UA('lobload');
	e.QS('IFRAME').setA('onload',"fileUploaded(this)");
	e.QSattr('type','file').setA('accept', e.A('accept'));
	var m = e.A('name').match(/(.*)\.([^.]+)/);
	e.QSname('table').value = m[1];
	e.QSname('field').value = m[2];
	e.QSname('key_vals').value = 
		e.QSname('key_vals').value.replace('(XX)', e.A('rid'));
	var action = findSaveCmd(e).match(/^[^?]+/)[0];
	action = action.replace(/\/s\/(main\.[a-zA-Z_0-9]+\.syrecordidw\/[a-zA-Z_0-9-]*)$/, '/slob/$1');
	e.QS('FORM').setA('action', action);
	e.QS('[modal]').showXModal().done(function(dl){
		if(dl) {
			var a = e.UA('lobload').QS('A, IMG');
			//a.style.display='inline';
			if(a.A('lob-refresh') == 'stamp') {
				if(a.tagName == 'IMG') {
					var v = a.A('src').replace(/\?.*/,'')+ '?' + (new Date()).getTime();
					a.setA('src', v);
				}
			} else {
				if(a.tagName == 'A')	a.href=dl.href;
				else a.setA('src', dl.href);
			}
		}
	});
}

function onchooseFileForm(e) {
	if(!e.value) return;
	var c = e.UA('lobload');
	var ft = c.A('filetypes').split('|');
	for(var i = 0; i< ft.length; ++i)
		ft[i] = '\\.'+ft[i];
	if(e.files && e.files.length && c.A("max-size") != null ) {
		var max;
		if( max = c.A("max-size").match(/^\s*(\d+)\s*([mk])?/i) ) {			
			if(+max[1]*{ "m":1024*1024, "k":1024, "": 1 }[max[2] && max[2].toLowerCase() || ""] < e.files[0].size ) {
				alert("Размер файла превосходит "+c.A("max-size") );
				return;
			}			
		} else
			console.log("Bad max-size value");
	} 
	if(e.value.match(new RegExp('('+ft.join('|')+')$', 'i')) == null) {
		alert('Не тот тип файла: нужен '+c.A('filetypes'));
		return;
	}
	if(c.A('lobarg'))
		c.QSname( 'lobarg').setV(c.evalHere('@lobarg'));
	e.UT('FORM').submit();	 
}

function showFilerForm(e) {
	e = e.UA('lobload');
	var dv = e.QS('IFRAME');
	if(!dv) {
		var fn = uniname('lload_');
		dv = document.createElement('SPAN');
		e.QS('FORM').parentNode.appendChild(dv);
		dv.innerHTML =
			'<iframe src=about:blank width="1" height="1" style="display:none" '
			+' name='+fn+' onload="fileUploaded(this)"></iframe>'
	} else
		fn = dv.A('name')
	e.QS('FORM').setA('target', fn);
	e.QSattr('type','file').setA('accept', e.A('accept'));
	e.QSattr('type','file').value = null;
	var z = e.QS('[href]');
	if(z && e.QSname('table')) {
		e.QSname('table').value = z.A('href').URLParam('table');
		e.QSname('fld').value = z.A('href').URLParam('fld');
		e.QSname('key[]').value = findRid(e);
		if(e.hasA('files'))
			e.QSname('file').value = z.A('href').URLParam('file');
	}
	return e.QS('[modal]').showXModal().done(function(dl){
		if(dl) {
			var a = e.UA('lobload').QS('A, IMG');
			//a.style.display='inline';
			if(a.tagName == 'A')	a.href=dl.href;
			else a.setA('src', dl.href);
		}
	});
}
function dropFiler(e) {
	e = e.UA('lobload');
	var dv = e.QS('IFRAME');
	if(!dv) {
		var fn = uniname('lload_');
		dv = document.createElement('SPAN');
		e.QS('FORM').parentNode.appendChild(dv);
		dv.innerHTML =
			'<iframe src=about:blank width="1" height="1" style="display:none" '
			+' name='+fn+' onload="fileUploaded(this)"></iframe>'
	} else
		fn = dv.A('name')
	e.QS('FORM').setA('target', fn);
	var z = e.QS('[href]');
	if(z && e.QSname('table')) {
		e.QSname('table').value = z.A('href').URLParam('table');
		e.QSname('fld').value = z.A('href').URLParam('fld');
		e.QSname('key[]').value = findRid(e);
		if(e.hasA('files'))
			e.QSname('file').value = z.A('href').URLParam('file');
	}
	e.QSname('file_data').value = null;
	if(e.A('lobarg'))
		e.QSname( 'lobarg').setV(e.evalHere('@lobarg'));
	X.defer().done( function() { e.QS('FORM').submit() } );
}

function fileUploaded(e) { 
	if(!e.firstShot) { e.firstShot = true; return; }
	var err = e.contentWindow.document.getElementById("ErrBox");
	var errtxt = err && (err.innerText || err.textContent) || ""
	if(!errtxt) {
		e.UA('lobload').QS('[modal]').closeModal(
			e.contentWindow.document.getElementById("lob_download")
		);
		e.UA('lobload').evalHere("@onfileok", e.contentWindow);
	}
	else
		alert(errtxt);
}

function clearFilter(e) {
	e = e.UA('filter_def');
	var a = e.QSA('[filter_ctrl]');
	for(var i =0; i < a.length; ++i) 
	{ a[i].value = ''; 
		if(a[i].nextElementSibling && a[i].nextElementSibling.hasA('filter_txt')) 
			a[i].nextElementSibling.textContent = ''; 
	}
	applyFilter(e);
}

applyFilterT = function(e) { 
	applyFilterT = X.throttle(function(e) { return applyFilter(e); }) //once
	applyFilterT(e);
}

function patchSelfRef(ref) {
	if(!ref.match(/(.*)\?(.*)/)) return ref;
	var uri = RegExp.$1;
	ref = RegExp.$2;
	
	var m = {}
	var a = ref.split('&');
	for(var i = 0; i < a.length; ++i)
		if(a[i].match(/^([^=]+)=(.*)/)
		&& !(RegExp.$1 in m)) m[RegExp.$1] = RegExp.$2;
	a = [];
	for(var i in m) 
		a.push(i+'='+m[i]);
	return uri+'?'+a.join('&');
}

function applyFilter(e, offset, place) {
	e = e.UA('filter_def');
	var uri = e.A('filter_def');
	if(e.prevRequest) e.prevRequest.object.abort();
	var mode = {}
	var a = e.QSA('[filter_ctrl]');
	for(var i =0; i < a.length; ++i)
		mode[ a[i].A('filter_ctrl') ] = a[i].value && a[i].value.trim() || undefined;

	var flt = setFilterInURI(uri, mode).URLParam('ro_filter');
	uri = patchSelfRef(e.A('selfref')).setURLParam('filter', flt);
	if(offset) {
		if(typeof offset == "number")
			if(uri.URLParam('pgoffset'))
				var pos = +uri.URLParam('pgoffset') + offset;
			else
				var pos = offset;
		else
			pos = + offset.A('href').URLParam('pgoffset');
		if(pos<0) pos = 0;
		uri = uri.setURLParam('pgoffset', pos);
	} else
		if(uri.URLParam('pgoffset')) uri = uri.setURLParam('pgoffset', 0);
	e.prevRequest = X.XHRfeedback(place||e,'GET', uri);
	e.prevRequest.done(function(txt) {
		e.prevRequest = null;
		txt = txt.match(/[<]!--FILTRED:-->([\s\S]*?)[<]!--FILTRED.-->/)[1];
		setBodyToContaner(I('filtred'), txt);
	});
}
function snapshot(o) 
{	
	var filter = o.QSattrPrevious('filter_def') || this;
	var a = document.createElement('a');
	var attrs = 
	[].slice.call(filter.QSA('[filter_ctrl]'))
	.map(function(f) {
		return f.A("filter_ctrl") && { name :"h_"+f.A("filter_ctrl"), value: f.value } || undefined;
	}).forEach(function(attr) {
		attr && a.setA(attr.name, attr.value)
	})
	a.setA("onclick","callsnapshot(this)");
	a.setA("history", filter.QSA('[history]').length);
	a.innerHTML = o.UA("rt") && o.UA("rt").A("rt") || filter.QSA('[history]').length;
	filter.appendChild(a);
}
function clearsnapshot(filter)
{
	[].slice.call(this.QSA("[history]"))
	.forEach(function(e) {	e.removeIt() });
	[].slice.call(this.QSA("[filter_ctrl]"))
	.forEach(function(f) {	if(f.A("filter_ctrl"))	f.value = ""; });
}
function callsnapshot(o)
{
	var filter = o.UA('filter_def');
	var current = +o.A("history");
	[].slice.call(filter.QSA("[history]"))
	.forEach(function(e) {	if((+e.A("history"))>=current) { e.removeIt() }	})
	for(var i=0;i<o.attributes.length;++i) {
		var m;
		if(m = o.attributes[i].nodeName.match(/^h_(.*)$/)) {
			filter.QS('[filter_ctrl="'+m[1]+'"]').value = o.attributes[i].nodeValue;
		}
	}
	applyFuncFilter(filter);
}
function stage(o)
{
	var filter = o.QSattrPrevious('filter_def');
	var value = o.UT('TR').A(filter.A("stage-source") || 'value');

	var s = {};
	for(var i=0;i<filter.attributes.length;++i) {
		var m;
		if(m = filter.attributes[i].nodeName.match(/^stage-(\d+)(?:-([a-z0-9_]*))?/i)) {
			var stage = s[+m[1]] || (s[+m[1]] = { idx:+m[1], mask: undefined, ctrls : [] });				
			if(m[2]===undefined) {
				stage.mask = "/"+filter.attributes[i].nodeValue+"/";
			} else {
				stage.ctrls.push({name : m[2], value: filter.attributes[i].nodeValue })
			}
		}
	}
	var stages = [];
	for(var i in s) { stages.push(s[i])	}
	stages.sort(function(a,b) { return a.idx-b.idx })
	for(var i=0; i<stages.length; ++i) {
		if(value.match(eval(stages[i].mask))) {
			stages[i].ctrls.forEach(function(ct) {
				filter.QS('[filter_ctrl="'+ct.name+'"]').value = 
					value.replace(eval(stages[i].mask), ct.value);
			})
			break;
		}
	}	
	applyFuncFilter(filter);
}
function funtionalFilter(sp, params) {
	var s = sp;
	function prepareStrings(x, arr) {
		return x.replace(/'[^']*(''[^']*)*?'/g, function(a) {
			arr.push(a); return "C("+(arr.length-1)+")";
			});
	}
	function prepareFields(x) { return x.replace(/[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+/ig, function(a) { return "F('"+a+"')"; }); }
	function prepareParams(x) { return x.replace(/\?[a-z_0-9]+/ig, function(a) { return "P('"+a.substr(1)+"')"; }); }

	var strings = [];
	s = prepareStrings(s, strings);
	s = s.replace(/([a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+)\s*=\s*('\d*'|\?[a-z_0-9]+|\d+(\.\d*)?|C\(\d+\))/ig, "EQ($1,$3)");
	s = s.replace(/([a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+)\s*=\s*([a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+)/ig, "EQ($1,$3)");
	s = s.replace(/([a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+)\s*!=\s*('\d*'|\?[a-z_0-9]+|\d+(\.\d*)?|C\(\d+\))/ig, "NE($1,$3)");
	s = s.replace(/([a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+)\s*\^=\s*('\d+'|\?[a-z_0-9]+)/ig, "BEGINS($1,$3)");
	s = s.replace(/([a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+)\s*\*=\s*('\d+'|\?[a-z_0-9]+)/ig, "CONTAINS($1,$3)");
	s = s.replace(/([a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+)\?/ig, "ISNULL($1)");
	s = s.replace(/([a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+)!/ig, "ISNOTNULL($1)");
	s = prepareParams(s);
	s = prepareFields(s);
	function A(a) { 
		if(!X.isArray(a)) return a;
		var b = []
		for(var i = 0; i < a.length; ++i) {
			var c = A(a[i]);
			if(c !== undefined) b.push( '(' + c + ')' );
		}
		if(!b.length) return undefined;
		if(b.length==1) return b[0];
		return b.join(' AND ');
	}
	function C(n) { return "'"+n+"'"; }
	function F(n) { return n; }
	function P(n) {
		return params[n] === undefined ? undefined : '?'+n; 
	}
	function NOT(e) { e = A(e); return e === undefined? e : 'NOT ('+e+')'; }
	function ISNULL(e) { return e === undefined? e : e+' IS NULL'; }
	function ISNOTNULL(e) { return e === undefined? e : e+' IS NOT NULL'; }
	function ALL() { 
		var b = []
		for(var i = 0; i < arguments.length; ++i) b.push( A(arguments[i]) );
		for(var i = 0; i < b.length; ++i) if(b[i] === undefined) return undefined;
		return A(b);
	}
	function AND() { 
		var b = []
		for(var i = 0; i < arguments.length; ++i) b.push( A(arguments[i]) );
		return A(b);
	}
	function OR() { 
		var a = []
		for(var i = 0; i < arguments.length; ++i) a.push( A(arguments[i]) );
		var b = []
		for(var i = 0; i < a.length; ++i) if(a[i] !== undefined) b.push('(' + a[i] + ')');
		if(!b.length) return undefined;
		if(b.length == 1) return b[0];
		return b.join(' OR '); 
	}
	function EQ(a,b) { return a === undefined || b === undefined ? undefined : a+' = '+b; }
	function NE(a,b) { return a === undefined || b === undefined ? undefined : a+' <> '+b; }
	function LT(a,b) { return a === undefined || b === undefined ? undefined : a+' < '+b; }
	function LE(a,b) { return a === undefined || b === undefined ? undefined : a+' <= '+b; }
	function GT(a,b) { return a === undefined || b === undefined ? undefined : a+' > '+b; }
	function GE(a,b) { return a === undefined || b === undefined ? undefined : a+' >= '+b; }
	function BEGINS(a,b) { return a === undefined || b === undefined ? undefined : a+' LIKE '+b+"||'%'"; }
	function CONTAINS(a,b) { return a === undefined || b === undefined ? undefined : 'UPPER('+a+") LIKE UPPER('%'||"+b+"||'%')"; }
	function LIKE(a,b) { return a === undefined || b === undefined ? undefined : a+" LIKE "+b; }
	function CONCAT(a,b) { return a === undefined || b === undefined ? undefined : a+" || "+b; }
	function COALESCE(a,b) { return a === undefined || b === undefined ? undefined : "COALESCE(" +a+", "+b+")"; }
	function SUBSTR(a,p,l) { return a === undefined ? undefined : "SUBSTR("+a+", "+p+", "+l+")"; }
	function TITLE(a) { return a === undefined ? undefined : "TITLE("+a+")"; }
	function UPPER(e) { return e === undefined? e : 'UPPER ('+e+')'; }
	function YEAR(e) { return e === undefined? e : 'YEAR ('+e+')'; }
	function SMART_DATE(e) { return e === undefined? e : e.charAt(0) == '?' ? '?-d-'+e.substr(1): e; }
	function TO_DATE(e) { return e === undefined? e : 'TO_DATE('+e+')'; }
	function UNPACK_PARAM(e) { return e === undefined? e : e.charAt(0) == '?' ? '?-v-'+e.substr(1): e; }
	function IS_CHECKED(c, e) { return c === undefined? c : e;}
	function IF(p, e) { return IS_CHECKED(p, e); }
	function IF_NOT(p, e) { return p !== undefined? undefined : e;}	
	function TRUE() { return '1=1'; }
	function FALSE() { return '1=0'; }
	function IN(e, a) {
		var b = []
		for(var i = 0; i < a.length; ++i) if(a[i] !== undefined) b.push(a[i]);
		if(!b.length) return undefined;
		return e === undefined? e : e+' IN ( '+b.join(', ')+' )'; 
	}
	function NOTIN(e, a) {
		var b = []
		for(var i = 0; i < a.length; ++i) if(a[i] !== undefined) b.push(a[i]);
		if(!b.length) return undefined;
		return e === undefined? e : e+' NOT IN ( '+b.join(', ')+' )'; 
	}
	function SELECT_OP(op, s, w) { w = A(w);
		var sel = strings[+s.substr(1, s.length-2)];
		sel = sel.substr(1, sel.length-2).replace(/''/g,'\'');
		return op === undefined? op : 
			w === undefined? w :
			w === ''? op+'(SELECT '+(sel)+' )' :
			op+'(SELECT '+(sel)+' WHERE '+w+' )'; 
	}
	function EXP() {//@string | @field | @param ,...,...,...
		var result = [];
		for(var i=0;i<arguments.length;++i) {
			var s = arguments[i];
			if(s===undefined)
				return undefined
			if(s.charAt(0)=="'") {
				s = strings[+s.substr(1, s.length-2)];
				s = s.substr(1, s.length-2).replace(/''/g,'\'');
				
			}
			result.push(s)
		}
		return result.join('')
	}
	function TODAY(dayOffset) { return today(0,0,dayOffset).formatDate(); }
	function THIS_YEAR() { return this_year()+''; }

	function SELECT(s, w) { return SELECT_OP( '', s, w); }
	function INSELECT(e, s, w) { return SELECT_OP( e === undefined ? e : e+ ' IN ', s, w); }
	function NOTINSELECT(e, s, w) { return SELECT_OP( e === undefined ? e : e+ ' NOT IN ', s, w); }
	function EXISTS(s, w) { return SELECT_OP(  'EXISTS', s, w); }
	function NOTEXISTS(s, w) { return SELECT_OP(  'NOT EXISTS', s, w); } 
	function CASE(p, v) {
	// @(param) name, 
	// @(string)|(array of strings) value
	// @(expression) when param===value[0]...@(expression) when param===value[N]
	// [@(expression) for default]
		if(p===undefined) return p
		var args = [] ;
		var param = paramsBack(p, params, args);
		p = param === '?' ? args[0] : param;
		v = X.isArray(v) ? v : [v];
		v = v.map(function(s) {
			s = strings[+s.substr(1, s.length-2)];
			return s.substr(1, s.length-2).replace(/''/g,'\'');
		})
		e = [].slice.call(arguments,2)
		for(var i=0;i<v.length;++i) {
			if(p === v[i]) return e[i] || undefined
		}
		return e.length>1 && e[e.length-1] || undefined
	}

	s = A(eval(s));
	
	if(!s) return;

	function paramsBack(s, params, args) { return s.replace(/\?(-[a-z]+-)?([a-z_0-9]+)/ig, function(a, t, n) { 
		var v = params[n];
		if(t == '-d-')
			v = Date.smartParse(v).formatDate();
		if(t == '-v-')
			return '\''+v.replace(/'/g,'\'\'')+'\'';
		args.push(v);
		return '?'; }); }
	
	var args = [];
	s = paramsBack(s, params, args);

	function stringsBack(s, arr) { return s.replace(/'(\d+)'/g, function(a, n) { return arr[+n]; }); }
	s = stringsBack(s, strings);
	
	
	return { where: "WHERE "+s, args: args};
}

function getFuncFilterMode(e) {
	var mode = {}
	var a = e.QSA('[filter_ctrl]');
	for(var i = -1; i < a.length; ++i) {
		if( i == -1)
			if(e.searchbox) var fc = e.searchbox; else continue;
		else
			var fc = a[i];
		if(fc.A('filter_ctrl')) {
			mode[ fc.A('filter_ctrl') ] = 
				(
				fc.type==='checkbox' ? fc.checked && fc.value :
				fc.hasA('rid') ? fc.A('rid') :
				fc.value && fc.value.trim() 
				)|| undefined;
			fc.setA('filter_ctrl_value', mode[ fc.A('filter_ctrl') ] || '');
		}
		else {
			var processedValue = { value: fc.value }
			var aa = i == -1 ? e.attributes : fc.attributes;
			var ab = [];
			var ac = [];
			for (var j=0; j<aa.length; ++j)
				if(m = aa[j].nodeName.match(/^filter_ctrl-(\d+)-(.*)/)) ab[+m[1]] = aa[j];
				else if(m = aa[j].nodeName.match(/^filter_ctrl-(.*)/)) ac.push(aa[j]);
			aa = ab.concat(ac);
			for (var j=0; j<aa.length; ++j)
				if(aa[j])
				if(m = aa[j].nodeName.match(/^filter_ctrl(?:-\d+)?-(.*)/)) {
					var t = e.evalHere(aa[j].nodeValue);
					t = 
						X.isFunction(t) ? t(processedValue)
						: X.isRegExp(t) ? ((processedValue.value = processedValue.value.clean_pocket_replace(t,'')), RegExp.$1)
						: t;
					mode[ m[1] ] = t || undefined;
				}
		}
	}
	return mode
}

function chooseRowIfOnly(e, event, adv_rows, code) {
	if(event.keyCode == (code||13)) { blockEvent(event);
			var a = e.UA('filter_def'); 
			a = a.evalHere('@filter_for', a.nextElementSibling);
			a = a.QSA('[value]'); 
			if(a.length<=1+(adv_rows||0)) e.closeModal(a[1])
	}
}
		
function applyFuncFilter(e, offset, place, direct_txt, force) {
	e = e.UA('filter_def');
	var fdef = e.A('filter_def');
	var mode = getFuncFilterMode( e );
	var a = e.QSA('[filter_hint]');
	for(var i =0; i < a.length; ++i) a[i].setA('filter_hint-state', '');
	var t;
	for(var i  in mode)
		if(mode[i] !== undefined && (t = e.QS('[filter_hint~="'+i+'"]')) ) t.setA('filter_hint-state', 'Y');
	
	var uri = e.A('selfref');
	var cond = funtionalFilter(fdef, mode);
	if(e.hasA("snapshot-clear") 
		&& funtionalFilter(e.A("snapshot-clear"), mode)) {
		clearsnapshot(e)
	}
	
	if(e.qe) {//QE link : or any other interface, like html attribute
		var qecmd = e.qe.cmd;
		var qeargs = e.qe.args;
		if(cond)
			cond.args.push("*" + qecmd);
		else
			cond = { where: qecmd, args:[] }
		for(var i=0;i<qeargs.length;i++) 
			cond.args.push(qeargs[i]);
	}
	
	if(cond) {
		if(e.QS('[filter_ctrl-replace]'))
			if(uri.URLParam('cmd'))
				cond.args.unshift('*'+cond.where);
			else
				uri = uri.setURLParam('cmd', '*'+cond.where);
		else
			if(uri.URLParam('cmd'))
				cond.args.unshift('*'+cond.where);
			else
				uri = uri.setURLParam('cmd', '*'+cond.where);
		for(var i = 0; i < cond.args.length; ++i)
			uri += '&args[]=' + encodeURIComponent(cond.args[i]);
	}
	if(offset) {
		var pos = + offset.A('offset');
		if(pos<0) pos = 0;
		if(pos) {
			if(uri.URLParam('cmd'))
				uri += '&args[]=' + encodeURIComponent('OFFSET:'+pos);
			else
				uri = uri.setURLParam('cmd', 'OFFSET:'+pos);
		}
	}
	
	var p = function(txt) {
		e.prevRequest = null;
		var t = 
			e.searchbox ? e.QS("DD")
			: e.evalHere('@filter_for', e.nextElementSibling);
		var m = txt.match(/[<]!--FILTRED:-->([\s\S]*)[<]!--FILTRED\.-->/);
		txt = m ? m[1] : txt;
  		t.txt = txt;
		setBodyToContaner(t, txt);
		prepareControls(t, saveFuncFilterState);
		e.evalHere('@onfiltred');
	}
	if( direct_txt !== undefined )
		return X.defer( p(direct_txt) );
	else {
		if(e.prevURI !== uri || force) {
			if(e.prevRequest) e.prevRequest.object.abort();
			e.prevRequest = X.XHRfeedback(place||e,'GET', e.prevURI = uri);
			return e.prevRequest.done(p)
		}
		return X.defer()
	}
}


applyFuncFilterT = function(e) { 
	applyFuncFilterT = X.throttle(function(e) { return applyFuncFilter(e); }, 300) //once
	applyFuncFilterT(e);
}

function saveFuncFilterState(e, seq, name) { name = name || 'funcfilter';
	var v = history.state || {}

	var t = e.evalHere('@filter_for', e.nextElementSibling);

	var a = e.QSA('[filter_ctrl]');
	var v = [];
	for(var i =0; i < a.length; ++i) {
		v.push(
			a[i].type==='checkbox' ? {c: a[i].checked?'Y':''} :
			a[i].hasA('rid') ? { r: a[i].A('rid'), v: a[i].V() } :
			{ v: a[i].V() }
		);
	}
	v[name] = { seq: seq, values: v, txt: t.txt }
	//X.log(v)

	history.replaceState(v, '');

	X.log('saved with '+seq);
}

//we can use window.performance.navigation instead seq (ie>=9)
//window.performance.navigation.type == 2 => back/forvard
//window.performance.navigation.type == 1 => reload
//window.performance.navigation.type == 0 => open
function restoreFuncFilterState(e, def, seq, name) { name = name || 'funcfilter';
	if(!def) return;

	if(def === saveFuncFilterState) 
		return saveFuncFilterState(e, seq, name);

	var t = e.evalHere('@filter_for', e.nextElementSibling);
	var v = history.state && history.state[name];
	
	var fresh_open = 
		window.performance && 
		window.performance.navigation &&
		window.performance.navigation.type == 0;

	if(v && !fresh_open) {
		//var restore_text = v.seq == window.performance.navigation.type == 2;
		var restore_text = v.seq == seq;
		var a = e.QSA('[filter_ctrl]');
		for(var i =0; i < a.length; ++i) {
			if('c' in v.values[i]) { 
				a[i].presentA('checked', a[i].checked = v.values[i].c == 'Y');
			}
			else if('r' in v.values[i]) { 
				a[i].setA('rid', v.values[i].r); 
				a[i].setV(v.values[i].v); 
			}
			else a[i].setV( v.values[i].v );
		}
		X.log('restored with '+seq+(restore_text ? '!':''));
		applyFuncFilter(e, 0, null, restore_text ? v.txt : undefined);
	}
}

function restoreFuncFilter(e, def, seq) {
	if(!def) return;
	var t = e.evalHere('@filter_for', e.nextElementSibling);
	if(def === saveFuncFilterState) {
		var a = e.QSA('[filter_ctrl]');
		var v = [];
		for(var i =0; i < a.length; ++i) {
			v.push(
				a[i].type==='checkbox' ? {c: a[i].checked?'Y':''} :
				a[i].hasA('rid') ? { r: a[i].A('rid'), v: a[i].V() } :
				{ v: a[i].V() }
			);
		}
		sessionStorage[seq] = JSON.stringify({
			values: v,
			txt: t.txt
		})
		return;
	}
	if(def === true) {
		var v = sessionStorage[seq];
		if(v) {
			v = JSON.parse(v);
			var a = e.QSA('[filter_ctrl]');
			for(var i =0; i < a.length; ++i) {
				if('c' in v.values[i]) { 
					a[i].presentA('checked', a[i].checked = v.values[i].c == 'Y');
				}
				else if('r' in v.values[i]) { 
					a[i].setA('rid', v.values[i].r); 
					a[i].setV(v.values[i].v); 
				}
				else a[i].setV( v.values[i].v );
			}
			applyFuncFilter(e, 0, null, v.txt);
		}
	}
}

function chooseWithFuncFilter(e, place) { applyFuncFilter(e, 0, null); return X.defer(); }

//--
var Calendar2 = (function() {
  function ymd(d) { return d ? { y:d.getFullYear(), m:d.getMonth(), d:d.getDate() } : {} }
  function todate(d) { return new Date(d.y, d.m ? d.m : 0, d.d ? d.d : 1) }
  function LAST(ar) { return ar[ar.length - 1] }
  function FIRST(ar) { return ar[0] }
  //function calendarElement(cont, input, D, onOpen, onClose, border) {
  function calendarElement(ctx) {
    var self = this;
    for(var i in ctx) { self[i] = ctx[i] }
    self.pointofview = ymd( self.date );
    self.choosen = ymd( self.date );
    self.calendar = d2.S(ctx.container)
      .AP("div")
        .A("class", "calendar");
    
    self.clickDate = function(d) {
      stopPropagation(d2.event);
      var zoom = self.calendar.A("zoom");
      self.makeChoose( d, zoom );
      var nextzoom = { day: null, month: "day", year: "month" }[zoom];
      if(nextzoom)
        X.defer().done( function() { self.draw( nextzoom ) } )
      else
        self._onchoose_.call( self, todate(self.pointofview) );
    }
    var DAY = 1000*60*60*24;
    var month_names = [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ];
    function eq(d1,d2) { return d1.getDate()==d2.getDate() && d1.getFullYear()==d2.getFullYear() && d1.getMonth()==d2.getMonth() }
    function gt(d1,d2) { return d1.getTime()>d2.getTime() }
    function gte(d1,d2) { return d1.getTime()>=d2.getTime() }
    function empty(d) { return d.y===undefined }
    function fillWeek( timeMap, begin, end) {
      var last = LAST(timeMap);
      for(var i = begin.getTime(); i <= end.getTime(); i+=DAY) {
        if(!last || last.length == 7) {
          timeMap.push( [] );
          last = LAST( timeMap );
        }
        last.push( new Date(i) );
      }
    }
    function buildMonth(d) {
      var time = [];
      var m = d.getMonth();
      var y = d.getFullYear();
      var monthBegin = new Date(y, m, 1 );
      var prevMonthEnd = new Date(y, m, 0 );
      var left = new Date( prevMonthEnd.getTime() - (7+(monthBegin.getDay()+5)%7 ) * DAY);
      var right = new Date( left.getTime() + 48*DAY );
      if(((d.getTime()-left.getTime())/DAY)<14) {
        if(new Date(right.getTime()-8*DAY ).getMonth() != m) {
          left = new Date(left.getTime() - 7*DAY );
          right = new Date( left.getTime() + 48*DAY);
        }
      }
      if(((right.getTime()-d.getTime())/DAY)<14) {
        if(new Date(left.getTime()+8*DAY ).getMonth() != m) {
          left = new Date(left.getTime() + 7*DAY );
          right = new Date( left.getTime() + 48*DAY );
        }
      }
      fillWeek(time, left, right);
      return time;
    }
    function buildYear(d) {
      var r = [];
      for(var j=0;j<4;j++) {
        var rr = [];
        for(var i=0;i<4;++i) {
          rr.push(new Date(d.getFullYear(),(i + j*4)-2, 1 ));
        }
        r.push(rr);
      }
      return r;
    }
    function buildCentury(d) {
      var r = [];
      for(var j=0;j<4;j++) {
        var rr = [];
        for(var i=0;i<4;++i) {
          rr.push(new Date(d.getFullYear()+(i + j*4)-9,0,1) );
        }
        r.push(rr);
      }
      return r;
    }
    function breakLetters(n) {
      var x = [];
      n = n.toLowerCase();
      for(var i=0;i<n.length;++i)
        x.push(n.charAt(i));
      return x;
    }
    self.makeChoose = function(d, zoom) {     
      self.pointofview = {
        day: function(d) { return ymd(d) },
        month: function(d) { return { y: d.getFullYear(), m: d.getMonth() } },
        year: function(d) { return { y: d.getFullYear() } }
      }[zoom](d);
    }
    function outofborders(d, border, zoom)
    {
      if(!border) return false;
      var min = border.min;
      var max = border.max;
      var y = d.getFullYear();
      var m = d.getMonth();
      return {  
        year: min && min.getFullYear()>y || max && max.getFullYear()<y,
        month: min && new Date(min.getFullYear(),min.getMonth(),1) > new Date(y,m,1)
          || max && new Date(max.getFullYear(),max.getMonth(),1) < new Date(y,m,1),
        day: min && min>d || max && max<d  
      }[zoom]
    }
    function inborder(d,b) 
    {
      if(b && b.min && b.min>d) return ymd(b.min);
      if(b && b.max && b.max<d) return ymd(b.max);
      return ymd(d);
    }
    function defaultzoom() {
     if(self.border && self.border.max && self.border.min 
        && (self.border.max.getFullYear()-self.border.min.getFullYear()) <= 5 ) {
        if((self.border.max.getFullYear()-self.border.min.getFullYear()) < 1 
          && (self.border.max.getMonth()-self.border.min.getMonth()) < 6 )
          return "day"
        else
          return "month"
      }
      else
        return "year" 
    }
    function defaultviewpoint() {
      return inborder( empty(self.pointofview) ? today() : todate(self.pointofview), self.border )
    }
    self.remove = function() {
    	d2.S(ctx.container).S(".calendar").R();
    }
    self.draw = function(zoom, pointofview)
    {
      this.calendar.A("hidden", null);
      if(X.isFunction(zoom)) { return zoom.call(this) }
      zoom = zoom || defaultzoom();   
      pointofview = pointofview || defaultviewpoint();
      var calend = self.calendar;
      var time = { year: buildCentury, month: buildYear, day: buildMonth }[zoom]( todate(pointofview) );

      calend.A("zoom", zoom)
        .SA(".row, .monthname, .yearname").R();

      var row = calend.SA(".row")
        .J(time)
      .AP("div")
        .A("class", "row");

      var elem = row.SA("."+zoom)
        .J(function(d, i) { return d })
      .AP("span")
        .A("class", zoom)
        .A("current", function(d) {
          if(
          { day: d.getFullYear()==pointofview.y && d.getMonth()==pointofview.m,
            month: d.getFullYear()==pointofview.y,
            year: d.getFullYear()>(pointofview.y-6) && d.getFullYear()<(pointofview.y+3)
          }[zoom])
            return 1;
        })
        .A("choosen", function(d) {
          var ch = self.choosen;
          if(ch && {
            day: d.getFullYear()==ch.y && d.getMonth()==ch.m && d.getDate()==ch.d,
            month: d.getFullYear()==ch.y && d.getMonth()==ch.m, 
            year: d.getFullYear()==ch.y
          }[zoom]) {
            return 1;
          }
        })
        .A("today", function(d) {
          var t = ymd(today());
          d = ymd(d);
          return {
            day: t.y==d.y && t.m==d.m && t.d==d.d || undefined,
            month: t.y==d.y && t.m==d.m || undefined,
            year: t.y==d.y || undefined,
          }[zoom];
        })
        .A("holiday", function(d) { if(zoom==="day") { if(d.getDay()==0 || d.getDay()==6) return 1; } })
        .A("prelastelem", function(d) { 
          var x = LAST(time); 
          if(x[ x.length-2 ]===d) return 1 
        })
        .A("lastelem", function(d) { 
          if(LAST(LAST(time))===d) return 1 
        })
        .A("firstelem", function(d) { if(FIRST(FIRST(time))===d) return 1 })
        .A("afterfirstelem", function(d) { if(FIRST(time)[1]===d) return 1 })
        .A("outofborders",function(d) {
            return outofborders(d, self.border,zoom) ? 1 : undefined;
        })
        .CK( self.clickDate, function(d) { return this.A("outofborders") ? undefined : 1; })
      .AP("span")
        .A("class", "calendtext")
        .H({
          day: function(d) { return d.getDate() },
          month: function(d) { return month_names[+d.getMonth()] },
          year: function(d) { return d.getFullYear() }
        }[zoom])
      
      if(!outofborders(today(),self.border,zoom)) {
        var todaycontrol = calend.SA("[today]");
        if(zoom==="day") {
          if(todaycontrol.E())
            todaycontrol = calend.S( gte( todate(pointofview), today() ) ? "[afterfirstelem]" : "[prelastelem]")
          todaycontrol.AP("span")
            .A("class","todaycontrol")
            .CK(function(e) {
              stopPropagation(d2.event);
              self.makeChoose(today(), "day");
              X.defer().done( function() { self.draw("day") } );
              if(!calend.S("[afterfirstelem] .todaycontrol, [prelastelem] .todaycontrol").E())
                stopPropagation(d2.event);
            })          
        }       
      }     
      function goUpDown(godate, place, attr) {
        var max = self.border && self.border.max && ymd(self.border.max);
        var min = self.border && self.border.min && ymd(self.border.min);
        if({
          year: max && (godate.y+8-16)>max.y || min && (godate.y+5)<min.y,
          month: max && todate({y:godate.y, m:0})>todate(max) || min && todate({y:godate.y, m:11})<todate(min),
          day: max && todate({y:godate.y, m:godate.m, d:1})>todate(max) || min && todate({y:godate.y, m:godate.m+1, d:-1})<todate(min),
        }[zoom]) return;
        calend.S(place).AP("span")
          .A("class", attr)
          .CK(function(e) {
            stopPropagation(d2.event);
            X.defer().done( function() { self.draw( zoom, godate ) });            
          })
        .AP("span")
          .H(function(d) {
            return {
              day: month_names[ godate.m ].substr(0,3).toLowerCase(),
              month: godate.y+"",
              year: 
              ( min ? Math.max(godate.y + 8 - 16, min.y) : godate.y + 8 - 16 ) 
              +"—<br>" 
              + ( max ? Math.min(godate.y+5, max.y) : godate.y+5 )
            }[zoom]
          })
      }
      var up_date = ymd(todate({
        day: { y: pointofview.y, m: pointofview.m - 1, d: 15 },
        month: { y: pointofview.y - 1, m: 5 },
        year: { y: pointofview.y - 14 }
      }[zoom]));
      var down_date = ymd(todate({
        day: { y: pointofview.y, m: pointofview.m + 1, d: 15 },
        month: { y: pointofview.y + 1, m: 5 },
        year: { y: pointofview.y + 14 }
      }[zoom]));
      goUpDown(up_date, "[firstelem]", "uparrow");
      goUpDown(down_date, "[lastelem]", "downarrow");
      
      var choose = calend.SA("[choosen], .year[today],.month[today]").AP("span")
        .A("class", "circle");


      if(zoom==="day") {
        calend.AP("span")
          .A("class","monthname")
        .SA(".letter")
          .J(breakLetters( month_names[pointofview.m] ))
        .AP("span")
          .A("class","letter")
          .A("first",function(d,i) { if(i==0) return month_names[pointofview.m].length })
          .T(function(d) { return d })
      }
      if(zoom==="day" || zoom==="month") {
        calend.AP("span")
          .A("class","yearname")
        .SA(".letter")
          .J(breakLetters( pointofview.y+"" ))
        .AP("span")
          .A("class","letter")
          .A("first",function(d,i) { if(i==0) return 1 })
          .T(function(d) { return d })
      }
      calend.N().refreshDisplay();
      return this;
    }
    self.hide = function() {
      this.container.A("hidden","");
    }
    self.onchoose = function(f) {
      this._onchoose_ = f;
      return this;
    }
    return self;
  }
  return {
    element : calendarElement,
    prepareCalendar : function(input, fmt) {
      var cont = d2.S(input.parentNode).IN("div", function() { return input.nextSibling })
        .A("calendcont", 1)
        .A("fmt", fmt || '')
        /*@cc_on .A("IE8", 1)@*/
      
      var button = cont.AP("button")
        .A("type", "button")
        .A("class", "calendbutton")
        .A("onclick", "Calendar2.showpopup(this)");
    },
    showpopup: function(o) {
      var input = o.UA("calendcont").previousElementSibling;
      if(o.UA("calendcont").QS('.calendar')!==null) return; 
      var calendar = 
        new calendarElement({
          container : o.UA("calendcont"),
          border : { 
            min: input.evalHere("@vmin"), 
            max: input.evalHere("@vmax") 
          },
          input : input,
          date : Date.smartParse( input.V() )
        })
        .onchoose(function(d) {
          this.calendar.N().closeModal( d );
        })
        .draw(function() {
          var self = this;
          this.calendar
            .A("quick-close", "Y")
            .N().showXModal().done(function(v) {
              if(v) {
                self.input.setV( v.formatDate( d2.S(self.container).A("fmt") ) );
                self.input.callchange();
              }
              self.remove();
              self.container.presentA('opened',false);
              delete self.calendar;
            });
          clearError(self.input);
          self.container.presentA('opened',true);
          self.draw();
        })        
    }
  }
})();
function fillSample(s, m) {
	[].slice.call(s.QSA("[html]"))
	.concat(s.hasA('html') ? [s] : [])
	.forEach(function(e) {
		e.innerHTML = m[ e.A("html") ]!==undefined ?  m[ e.A("html") ] : "";
	});
	[].slice.call(s.QSA("[attr]"))
	.concat(s.hasA('attr') ? [s] : [])
	.forEach(function(e) {
		var attrs = e.A("attr").split(',')
			.map(function(att) {
				var x = att.split(':'); 
				return { name: x[0], value:x[1] };
			})
		attrs.forEach(function(a) {
			m[a.value]!==undefined && e.setA( a.name.trim(), m[a.value.trim()] )
		});		
	});
}
function cloneSample(o, data) {
	var sample = o.QS("[sample]");
	var node = sample.cloneNode(true);
	node.removeAttribute( "sample" );
	node.setA( "release","" );
	fillSample( node, data );
	var existing = o.QSA("[release]");
	sample.parentNode.insertBefore(node, (existing.length && existing[existing.length-1] || sample).nextElementSibling);
}
function dropItem(o) {
	o.UA('release').remove()
}
/* @example
<script>
	function adduser(menu, val) {	
		cloneSample(menu.UT('DIV').QS("[sample-parent]"), { name: val.text, rid : val.rid  })
		return true;
	}
</script>
<div><span>Согласование</span>
	<button tag type="button" onclick="setWithMenu(this)" add></button>
	<dl mctl ref="Y" display="N" quick-close="Y" close-box="Y" 
	modal="Y" style="left:5em" onchoose="adduser(this,def)">"/user_chooser.php.t"</dl>
	<div sample-parent>
		<div sample item filter_ctrl="f_dest_persons[]" attr="value:rid">
			<button delete type=button onclick="dropItem(this)">х</button>			
			<span html=name></span>		
		</div>
	</div>
</div>
*/

//--- global code

if("G_regEvent" in window)
	G_regEvent('load', false, function() { prepareControls(B(), true); } )

