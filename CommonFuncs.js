	function I(id) { return document.getElementById(id) }
	function T(p1, p2) { return p2? p1.getElementsByTagName(p2)[0] : document.getElementsByTagName(p1)[0] }
	
	function window_close( closeParent ) {
		killFrame(parent, frameElement) || open('javascript:"<script'+'>close()<'+'/script>"',closeParent? '_parent': '_self');
	}
	function killFrame(owner,frm) {
		var pn = frm && frm.parentNode;
		if( pn && pn.tagName == "INS" ) {
			pn.style.display = "none";
			if(frm.getAttribute('modal')) owner.uncoverFrame(frm);
			var to_unlock_w = (pn.opener || owner);
			var to_unlock = to_unlock_w.document.body;
			SetClass(to_unlock, "hasInplaceFrame", addIntAttribute( to_unlock, "inplaceFrameLocks", -1));
			if(to_unlock_w && "onInplaceClose" in to_unlock_w) to_unlock_w.onInplaceClose(frm);
			if(owner && "recalcParentSize" in owner ) owner.recalcParentSize();
			try {
				if(frm.contentWindow.hideHoversOnClose) frm.contentWindow.hideHoversOnClose();
			} catch(e) { ; }
			try {
				if(frm.contentWindow.hideMenuChain) frm.contentWindow.hideMenuChain();
			} catch(e) { ; }
			if(pn.getAttribute("autodel"))
				pn.parentNode.removeChild(pn);
			else {
				pn.removeChild(frm);
			}
			return true;
		}
		return false;
	}
	function StrToHtml( s )
	{ return  	s.replace( /&/g,'&amp;' ).
			replace( /</g, '&lt;' ).
			replace( />/g, '&gt;' ).
			replace( /"/g, '&quot;' ).
			replace( /'/g, '&#39;');
		
	}

	function trimBOM(s) { return (document.all&&!window.opera)? s : s.substr(s.indexOf('<')) }

	function EscapeChar( s, c )
	{ return s.replace( /\\/g, "\\\\" ).replace( new RegExp( c, "g" ), "\\" + c ); }
	
	function UnescapeStr( s )
	{ 
		var esc = false;
		var t = "";
		for( i = 0; i < s.length; ++i )
		{
			var c = s.charAt( i );
			if( esc )
			{
				t += c;
				esc = false;
			}
			else
				if( c == "\\" )
					esc = true;
				else
					t += c;
		}
		return t;
	}

	function replaceAll(s, p, v) { return s.split(p).join(v); }

	function defaultTo(v, def) { return v == undefined? def : v }

	function findCls(e, t) {
		while(e && !HasClass(e,t)) e = e.parentNode;
		return e;
	}
	function findElem(e, t) {
		while(e && e.tagName != t) e = e.parentNode;
		return e;
	}
	function findPrevious(e,t) {
		while(e && e.tagName != t) e = e.previousSibling;
		return e;
	}

	function slowshow(c) {
		var v = parseFloat(c.style.opacity)
		v += 0.1
		c.style.opacity = v
		if(v<1 && c.getAttribute("inshow") == "1") 
			setTimeout( function() { slowshow(c) }, 50)
	}
	function slowhide(c) {
		c.setAttribute("inshow", "0")
		var v = parseFloat(c.style.opacity)
		v -= 0.1
		c.style.opacity = v
		if(v>0 )
			setTimeout( function() { slowhide(c) }, 50)
		else
			c.style.display = "none"
	}
	function getXY(e) {
		var r = { x: 0, y: 0 }
		do {
			var w = (e.ownerDocument.parentWindow || e.ownerDocument.defaultView);
			do { r.x += (e.offsetLeft>=0 ? e.offsetLeft : 0); r.y += (e.offsetTop>=0 ? e.offsetTop : 0); } while(e = e.offsetParent);
		} while( w != window && (e = w.frameElement) && e.tagName == "IFRAME" );
		return r
	}
	
	function trim_all(s) { return s.match(/^\s*([^\0]*)\s*$/)? RegExp.$1 : s  }
	
	var MenuChain = []
	function removeMenuItem(i) {
		var e = MenuChain[i]
		e.obj.removeAttribute("locked_menu_window")
		if(e.obj.getAttribute("createOnce")) {
			e.obj.style.visibility = "hidden"
			e.obj.style.top = e.obj.style.left = "0px"
			e.obj.style.width = e.obj.style.height = "0px"
		} else
			e.obj.parentNode.removeChild( e.obj )
		if(e.hovered_obj)
			e.hovered_obj.setAttribute("hovered", "")
		MenuChain.splice(i, 1)
	}
	function hideMenuChain() {
		var w = parent
		if(w && w.MenuChain)
			for(var i = w.MenuChain.length - 1; i>=0; --i)
				w.removeMenuItem(i)
	}
	function loosefoc_menu() {
		if( frameElement && !frameElement.parentNode.getAttribute("locked_menu_window")  ) hideMenuChain();
	}
	function findMainWnd(src) {
		var w = src && (src.ownerDocument.parentWindow || src.ownerDocument.defaultView) 
				|| window;
		while ( w && w != w.parent && w.frameElement && w.frameElement.tagName == "IFRAME" && !w.frameElement.getAttribute('mainframe')) w = w.parent;
		return w;
	}
	function isParentOrSameWindow(a,b) { 
		var c = a;
		if(c) 
			do {
				if( c == b ) return true;
				c = (a = c).parent;
			} while(c && c != a);
		return false;
	}
	function hideHoversOnClose(attr) {
		var w = findMainWnd();
		for(var i = w.MenuChain.length - 1; i>=0; --i)
			if( w.MenuChain[i].hovered_obj )
				w.removeMenuItem(i)
		var ifrms = w.document.getElementsByTagName("IFRAME");
		var todel = [];
		for(var i = 0; i < ifrms.length; ++i) {
			var f = ifrms[i];
			if( f && f.parentNode && isParentOrSameWindow(f.parentNode.opener, window) 
				&& (!attr || f.getAttribute(attr)!=null) ) 
				todel.push(f);
		}
		for(var i = 0; i < todel.length; ++i) 
			todel[i].contentWindow.window_close();
	}
	function tryHideHover() {
		for(var i = MenuChain.length - 1; i>=0; --i) {
			var ce = MenuChain[i]
			if(ce.hovered_obj && ce.hovered_obj.getAttribute("check_kill")) {
				ce.hovered_obj.setAttribute("check_kill", "")
				if( !ce.hovered_obj.getAttribute("lock_kill") && !ce.obj.getAttribute("locked_menu_window") )
					removeMenuItem(i)
			}
		}
	}
	function hideHoverMenu(e, te) {
		te.setAttribute("lock_kill", '')
		var w = findMainWnd();
		//var reltg = e.relatedTarget || e.toElement; //if we will do precheck
		te.setAttribute("check_kill", 'M')
		w.setTimeout( w.tryHideHover, 100)
	}
	
	function setWindowOnBlur(func)
	{
		if (document.all && !window.opera)
			document.onfocusout = function () { event.toElement || func() }
		else
			window.onblur = func
	}
	
	function window_size(root) {//root is any js window
		if( typeof( root.innerWidth ) == 'number' )
			//Non-IE
			return {width:  root.innerWidth, height: root.innerHeight	}
		else if( root.document.documentElement && ( root.document.documentElement.clientWidth || root.document.documentElement.clientHeight ) )
			//IE 6+ in 'standards compliant mode'
			return {width:  root.document.documentElement.clientWidth,  height: root.document.documentElement.clientHeight }
		else if( root.document.body && ( root.document.body.clientWidth || root.document.body.clientHeight ) )
			//IE 4 compatible
			return {width:  root.document.body.clientWidth, height: root.document.body.clientHeight }
		return {width:  0,  height: 0 }
	}
	
	function window_scroll(root) {
		if( typeof( root.pageYOffset ) == 'number' )
			//Netscape compliant
			return { x: root.pageXOffset, y: root.pageYOffset }
		else if( root.document.body && ( root.document.body.scrollLeft || root.document.body.scrollTop ) )
			//DOM compliant
			return { x: root.document.body.scrollLeft, y: root.document.body.scrollTop }
		else if( root.document.documentElement && ( root.document.documentElement.scrollLeft || root.document.documentElement.scrollTop ) )
			//IE6 standards compliant mode
			return { x: root.document.documentElement.scrollLeft, y: root.document.documentElement.scrollTop }
		return { x: 0, y: 0 }
	}
	
	function adjust_frame_pos(arg) {
		if(!arg) return;
		var childcont = frameElement.parentNode;
		if(frameElement.originalPlace) {
			frameElement.originalPlace();
		}
		var mainscrolloffset = window_scroll(parent.window);
		var childscrolloffset = window_scroll(window);
		var mainwnd = window_size(parent.window);
		var childwnd = window_size(window);
		mainwnd.width += mainscrolloffset.x;
		mainwnd.height += mainscrolloffset.y;
		childwnd.width += childscrolloffset.x;
		childwnd.height += childscrolloffset.y;
		
		if(frameElement.getAttribute("reverse")) {
			if(frameElement.getAttribute("reversedir")=='V')
				childcont.style.top = childcont.offsetTop - childwnd.height + "px"
			else
				childcont.style.left = childcont.offsetLeft - childwnd.width + "px"
		}
		var childpos = parent.getXY(frameElement)
		var scrollbar = scrollbar_size(parent.window)
		if(arg.match(/H/))
		if(childwnd.width > mainwnd.width) {
			//childcont.style.left = (mainscrolloffset.x + childscrolloffset.x + childwnd.width - mainwnd.width) + 'px';
			childcont.style.left = (mainscrolloffset.x + childscrolloffset.x) + 'px';
		} else {
			if((childpos.x + childwnd.width + scrollbar.v) > mainwnd.width) {
				childcont.style.left = (mainwnd.width - childwnd.width - scrollbar.v) + 'px'
			}
		}
		if(arg.match(/V/))
		if(childwnd.height > mainwnd.height) {
			//childcont.style.top = (mainscrolloffset.y + childscrolloffset.y + childwnd.height - mainwnd.height) + 'px';
			childcont.style.top = (mainscrolloffset.y + childscrolloffset.y)+'px'
		} else {
			if((childpos.y + childwnd.height + scrollbar.h) > mainwnd.height) {
				childcont.style.top = (mainwnd.height - childwnd.height - scrollbar.h) + 'px'
			}
		}
	}
	function scrollbar_size(root)
	{
		if(!root) root = window;
		var div = root.document.createElement("DIV")
		div.style.visibility = "hidden"
		div.style.position = "absolute"
		div.style.width = div.style.height = "10em"
		div.style.overflow = "scroll"
		root.document.body.appendChild(div)
		var rez = {v:div.offsetWidth-div.clientWidth,h:div.offsetHeight-div.clientHeight}
		root.document.body.removeChild(div)
		return rez;
	}
	function init_menu_window() {
		if(!frameElement) return
		setWindowOnBlur(loosefoc_menu)
		frameElement.height = pageHeight(document.body)
		adjustableFrame = true;
		recalcParentSize();

		frameElement.parentNode.style.visibility = ""

		if(frameElement.getAttribute("autofocus")) {
			var arr = document.getElementsByTagName('FORM');
			if( arr.length && !arr[0].getAttribute('inmenu'))
				SetDefFormFocus( arr[0] );
			else
			{
				arr = document.getElementsByTagName("A")
				if(!arr.length) arr = document.getElementsByTagName("BUTTON");
				if(arr.length) arr[0].focus()
			}
		}
	}
	function init_frame_window(adjustable) {
		SetClass(document.body, "inFrame", frameElement);
		adjustableFrame = defaultTo(adjustable, true);
		recalcParentSize()
	}
	function cmd_target() {
		var w = is_menu_open();
		return w ? w.MenuChain[w.MenuChain.length-1].target : window
	}
	
	function is_menu_open() {
		var w = findMainWnd();
		return w.MenuChain.length ? w : null;
	}

	function reg_hover_out(src, base) {
		if(!src.getAttribute('hover_out_registred')) {
			src.setAttribute('hover_out_registred', 'Y')
			var f = function(e) { "hideHoverMenu" in window && hideHoverMenu(e || event, base) }
			if(src.addEventListener)
				src.addEventListener('mouseout', f, false )
			else
				src.attachEvent('onmouseout', f )
		}
	}
	function GetOpener() { 
		return frameElement ? 
			frameElement.parentNode && frameElement.parentNode.opener || parent.opener
			: opener ;
	}
	function mergeObjects(dst, src) {
		dst = dst || {};
		for(var i in src) if( !(i in dst) ) dst[i] = src[i];
		return dst;
	}
	
	function OpenMenu(src, uri, props) {
		props = mergeObjects(props, 
			{horz: false, reverse: false, focus: true, locked: false, real_menu: true, adjustFramePos: 'H',offset:{x:0,y:0}})
		if( props.hovered_obj ) {
			props.focus = false
			props.hovered_obj.setAttribute("lock_kill", 'M')
			if( props.hovered_obj.getAttribute("hovered") ) return
			props.hovered_obj.setAttribute("hovered", 1)
		}
		var w  = findMainWnd( src );

		if( !props.hovered_obj && w.MenuChain.length )
			w.MenuChain[w.MenuChain.length-1].obj.setAttribute("locked_menu_window", true)
		
		var mid = null
		var obj =  null
		if(props.hovered_obj) {
			var tst_obj = props.hover_once_for_doc ? props.hovered_obj.ownerDocument.body : props.hovered_obj
			mid = tst_obj.getAttribute("createOnceId") || "hoverMenu_" + (++w.g_seq_id);
			tst_obj.setAttribute("createOnceId", mid);
			obj = w.I(mid)
		}
		if(!obj) {
			obj = w.document.createElement("DIV")
			if(props.locked) obj.setAttribute("locked_menu_window", true)
			if(mid) {
				obj.id = mid;
				obj.setAttribute("createOnce", 'Y')
			}
			obj.style.position = 'absolute'
			obj.style.zIndex = 100000
			w.document.body.appendChild( obj )
		}
		
		var setmenupos = function()
		{
			var r_coords = w.getXY( src )
			r_coords.x += props.offset.x;
			r_coords.y += props.offset.y;
			if(props.reverse) {
				obj.style.visibility = "hidden"
				obj.style.left = r_coords.x+"px"
				obj.style.top = r_coords.y+"px"
			} else
				if(props.horz) {
					obj.style.left = r_coords.x+src.offsetWidth+"px"
					obj.style.top = r_coords.y+"px"
				} else {
					obj.style.left = r_coords.x+"px"
					obj.style.top = r_coords.y+src.offsetHeight+"px"
				}
		}
		setmenupos();
		
		if(props.real_menu)
			w.MenuChain.push( { obj: obj, target: window, hovered_obj: props.hovered_obj } )

		obj.style.width = "1px"
		obj.style.height = "1px"

		if(props.hovered_obj) {
			reg_hover_out( props.hovered_obj, props.hovered_obj )
			reg_hover_out( obj, props.hovered_obj )
			obj.onmouseover = function(e) { props.hovered_obj.setAttribute("lock_kill", 'M') }
		}
		var r_coords = w.getXY( src )
		var nw = Math.max(document.body.clientWidth - r_coords.x - 10, 200)
		var newFrame = false
		if(!obj.innerHTML) {
			obj.innerHTML = "<iframe src='javascript:;' onload='if(this.xonload) this.xonload();' border=0 marginwidth=0 marginheight=0 frameborder=0 vspace=0 hspace=0 scrolling=no height=1"
				+" width="+nw
				+(props.focus?" autofocus=1":"")
				+(props.reverse?" reverse=1 reversedir="+(props.horz?'H':'V'):"")
				+(props.adjustFramePos? " adjustFramePos="+props.adjustFramePos:"")
				+"></iframe>"
			newFrame = true
		}
		var frm = T(obj,"IFRAME");
		if( props.attr_to_set )
			for(var i in props.attr_to_set)
				frm.setAttribute(i, props.attr_to_set[i]);
		if( props.onload_cb )
			frm.xonload = function() { props.onload_cb( frm.contentWindow ) };
		if(uri.charAt(0) == '#') {
			if(newFrame || !props.body) {
				obj.setAttribute("menutext", trimBOM(uri.substr(1)))
				frm.src = "javascript:frameElement&&frameElement.parentNode&&frameElement.parentNode.getAttribute('menutext')"
			} else {
				if(frm.contentWindow.document.body.innerHTML != props.body)
					frm.contentWindow.document.body.innerHTML = props.body
				if(frm.contentWindow.document.body.fireEvent)
					frm.contentWindow.document.body.onload.call(frm.contentWindow)
				else
					frm.contentWindow.onload()
			}
		} else {
			var name = "menuFrame_" + (++w.g_seq_id);
			frm.contentWindow.name = name;
			w.OpenLongURI(uri, name)
		}
		frm.originalPlace = setmenupos;
	}

	var location_dir = location.pathname.match("^(.*\/).*$")
	var location_dir = location_dir? location_dir[1] : "/"

	function NormMenuUri(id) {
		if(id.charAt(0) == '@') return id.substr(1);
		var txt = id.charAt(0) == '#'? id.substr(1) : I(id).innerHTML;
		var base_obj = document.getElementsByTagName("BASE")
		var base = base_obj.length > 0? base_obj[0].href :
			location.protocol +"//"+location.host + location_dir;
		var cssText = GetCssText("mainCss");
		var cf = I("commonfunctions");
		var mt = inplaceMenuTemplate
				.replace('<link rel=stylesheet type="text/css" href=styles.css '+'id=mainCss>', 
						"<STYLE id=mainCss>\n"+cssText+"\n</STYLE>")
				.replace("BASE_URL"+"_PLACEHOLDER", base)
				.replace("MENUBODY"+"_PLACEHOLDER", txt)
				.replace("COMMON_FUNCTION"+"_PLACEHOLDER", cf.innerHTML)
				.replace("CF_SRC" + "_PLACEHOLDER", cf.src? 'src="' + cf.src + '"': ''); // src already encoded
				
		return { full: '#' + mt, body: txt };
	}
	
	var inplaceMenuTemplate =
		'\uFEFF<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n' +
		'<html><head><BASE HREF="BASE_URL_PLACEHOLDER">\n' +
		'<script id=commonfunctions CF_SRC_PLACEHOLDER>COMMON_FUNCTION_PLACEHOLDER<\/script>\n' +
		'<link rel=stylesheet type="text/css" href=styles.css id=mainCss>\n' +
		'</head><body onload="init_menu_window()" class=menuframe>\n' +
		'	MENUBODY_PLACEHOLDER\n' +
		'</body></html>\n';

	function OpenMenuId(src, id, props) { 
		var pt = NormMenuUri(id);
		props = props || {};
		props.body = pt.body;
		OpenMenu(src, pt.full || pt, props); 
	}
	
	function OpenHoverMenu( src, id, props) {
		OpenMenuId(src, id, mergeObjects(props, {hovered_obj: src, reverse: true}))
	}
	function ReallyOpenBigTip(src) {
		CancelBigTip(null, src);
		var txt = src.getAttribute("big_tip")
		var needDocCheck = src.getAttribute("big_tip_check_doc")
		if(txt && (needDocCheck==null || !HasClass(document.body, 'hasInplaceFrame')) ) 
			OpenHoverMenu(src, '#'+make_big_tip(txt), 
					{ reverse: false, hover_once_for_doc: true, attr_to_set:{ istip: 'Y' } } 
				)
	}
	function OpenBigTip(e, src) {
		var t = getIntAttribute(src, "tip_timer")
		if(t) {
			CancelBigTip(null, src)
			t = 0
		}
		if(!t) {
			var t = setTimeout( function() {	ReallyOpenBigTip(src) }, 500);
			src.setAttribute( "tip_timer", t );
			if(!src.getAttribute("tip_cancel_registred")) {
				src.setAttribute("tip_cancel_registred", 'Y')
				if(src.addEventListener)
					src.addEventListener('mouseout', function(e) { CancelBigTip(e || window.event, src) }, false )
				else
					src.attachEvent('onmouseout', function(e) { CancelBigTip(e || window.event, src) })
			}
		}
	}
	function CancelBigTip(e, src) { 
		var t = getIntAttribute(src, "tip_timer")
		if(t) {
			if(e) {
				var reltg = e.relatedTarget || e.toElement;
				while (reltg && reltg != src && reltg.nodeName != 'BODY')
					reltg = reltg.parentNode
				if (reltg == src) return;
			}
			clearTimeout(t)
			src.setAttribute("tip_timer", 0)
		}
	}
	function setInnerText(e, v) {
		if( "innerText" in e)
			e.innerText = v;
		else
			e.textContent = v; 
	}
	function getInnerText(e) {
		return "innerText" in e ? e.innerText : e.textContent; 
	}
	
	function SetClass(o, cname, cval) {
		if( cval ) {
			if( !o.className.match("\\b"+cname+"\\b") )
				o.className += " "+cname
		} else {
			o.className = o.className.replace(RegExp("\\s*\\b"+cname+"\\b"), "")
		}
	}
	
	function HasClass(o, cname) {
		return o.className && o.className.match("\\b"+cname+"\\b");
	}

	
	function blockEvent(e) {
		if (e.stopPropagation) e.stopPropagation()
		else e.cancelBubble=true
		if (e.preventDefault) e.preventDefault()
		else e.returnValue = false
	}
	
	function refreshDisplay(e) {
		if((document.all&&!window.opera)) {//for IE
			if(e.style) e.className = e.className
			for(var v = e.firstChild; v; v = v.nextSibling)
				refreshDisplay(v)
		}
	}
	var in_popup = false
	function ComposeCondValueForArray( arr )
	{
		var s = [];
		for (i = 0; i < arr.length; ++i)
			s.push( EscapeChar( arr[i], ';' ) );
		return s.join(';');
	}
	function SplitCondValueForArray( s )
	{
		if(!s) return [''];
		var vals = [];
		var pos = 0;
		var esc = false;
		var v = '';
		for( var i = 0; i < s.length; ++i )
		{
			var ch = s.charAt(i);
			if( esc )
			{
				v += ch;
				esc = false;
			}
			else
				if( ch == '\\' )
					esc = true;
				else
					if( ch == ';' )
					{
						vals.push( UnescapeStr(v) );
						v = '';
					}
					else
						v += ch;
		}
		if( v )
			vals.push( UnescapeStr(v) );
		return vals;
	}
	function getIntAttribute(o, aname)
		{ return o.getAttribute && o.getAttribute(aname)? parseInt(o.getAttribute(aname)+"") : 0; }
	function addIntAttribute(o, aname, v)
		{ var n = getIntAttribute(o, aname) + v; o.setAttribute(aname, n); return n; }
	
	var g_seq_id = 0;
	function CreateLongURIform() {
		var dv = document.createElement("DIV");
		dv.style.display = "none";
		document.body.appendChild(dv);
		dv.innerHTML = "<form id=REDIR_FORM action='\/sys\/' method=post target=_blank><input type=hidden name='redir' value=''></form>"
		return I('REDIR_FORM');
	}
	function commonRedirURI(uri,ext) {
		var ww = window
		while (ww && ww != ww.parent && "g_seq_id" in ww.parent) ww = ww.parent;
		var a = uri && uri.indexOf("\/sys\/a/")==0 ? "a/" : "";
		return "\/sys\/"+a+"redir_"+ ++ww.g_seq_id + (ext||"");
	}
	function setRedirInForm(frm, uri, target, ext) { 
		frm.redir.value = uri && uri.replace( /\+/g, "%2B" ) || "";
		setFormAttribute(frm, 'target', target || "_blank");
		setFormAttribute(frm, 'action', commonRedirURI(uri,ext));
	}
	function OpenLongURI( uri, target, ext )	
	{
		var frm = I('REDIR_FORM') || CreateLongURIform();
		setRedirInForm(frm, uri, target, ext);
		frm.submit();
	}
	function RequestLongURI( uri, fun, canceler) {
		sendRequest(commonRedirURI(uri), fun,
			null, "redir="+encodeURIComponent( uri.replace( /\+/g, "%2B" ) ), "---",canceler)
	}
	function OpenPopup( w, h, url )
	{
		var x = screen.width / 2 - w / 2;
		var y = screen.height / 2 - h / 2;
		var  target = "saspopup"+new Date().getTime()
		var w = window.open( "", target, "left=" + x + ", top=" + y + ", width=" + w +
		      ", height=" + h + ", status=no, toolbar=no, scrollbars=yes" ); 
		if( url )
			OpenLongURI( url, target )
		return w;
	}
	function frameHTML(frame_id,frame_name,props) {
		return "<iframe class='"+defaultTo(props.frameClass,'airFrame')+"' id='"+frame_id
			+"' name='"+frame_name+"' "
			+(props && props.frameType? " frameType='"+props.frameType+"'":"")
			+(props && props.show_controls? " show_controls='"+props.show_controls+"'" : "")
			+(props && props.adjustFramePos? " adjustFramePos='"+props.adjustFramePos+"'":"")
			+(props && props.modal? " modal='"+props.modal+"'":"")
			+" width=100% border=0 marginwidth=0 marginheight=0 frameborder=0 height=1 vspace=0 hspace=0 scrolling=no onload='if(this.xonload) this.xonload();' style='position:relative;z-index:2'></iframe>";
	}
	function prepareFrame( container, frame_id, frame_name, props) {
		if(I(frame_id)) return null; // locked
		hideHoversOnClose('istip');
		var cont = container
		if(!document.getElementsByName(frame_name).length) {
			var setframepos = null
			if(container.tagName != "INS") {
				if(container.innerHTML==undefined)
					cont = I(container);
				else {
					cont = document.createElement("INS");
					cont.style.width = cont.style.height = "1px";
					cont.style.display = "none";
					cont.style.position = "absolute";
					cont.style.zIndex = 10000;
					cont.setAttribute("autodel",'Y');
					document.body.appendChild(cont);
				}
			}
			if(props && 'opener' in props)
				cont.opener = props.opener;
			var to_lock = (cont.opener || window).document.body;
			SetClass(to_lock, "hasInplaceFrame", addIntAttribute( to_lock, "inplaceFrameLocks", 1));
			cont.innerHTML = frameHTML(frame_id,frame_name,props);
			setframepos = function() {
				if(container.tagName != "INS") {
					if(container.innerHTML==undefined){
						cont.style.left = '';
						cont.style.top = '';
					}
					else {
						var xy = getXY(container)
						xy.y += container.offsetHeight;
						cont.style.left = xy.x+"px";
						cont.style.top = xy.y+"px";
					}
				}
				if( props && props.to_left )
					cont.style.left = "-"+getXY(cont.parentNode).x+"px";
			}
			setframepos();
			cont.style.display = "block"
			T(cont,"IFRAME").originalPlace = setframepos;
		}
		if(props.modal) coverFrame( cont );
		return cont;
	}
	var loaderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAASLSURBVHjanJdbiJVVFMfP+fzOTGdm1OZMnqFxsiZSG2+glaUPFRXVg4R0k7Igw6CXcKSSesiuD0VRRpghiImEhTpURERENRVdNMZyqrHMMm+VyVGrKTtzOf0X/DasNuOcoQ0/Zs532Wut/15r7f1lOzo6MiOMceIfUSNmiotEQbwANu6EkvhU9IiyqBW/n2ziNDPymCZmibMxaONqcaGYLbJinWgXb4lzceAHsRNHRm3YopsgfsPI5WKiOFX8Kc6AMK50DjWIY+KAeFd0u7nK1Qw3ixvEHiabLnJI1ziCOsGZOozlxTeiVWwW+09m2KTsJ7qbRB/rWsf9Cp4fF3+Jv7me55nxooiDtSzRvSzHxyiRYyn+Y3gycpq3U0isMMyhXvGy+ER8Jw5xr4Xn54nryYtTWLLzcXIyjpnxz2LDduM6JhgbyfieeIyXhiCMX1DC7q0Sz4o73H1TZAUObwkXE8KfK8bgSDvy+HGeWMoyDESGh1DEpL9WXBK9m2XOFBtmK5eydnPEfOdAhrXoR/4mcY34STxHhPG4jcimuGuWJ/XMOR/jtt7dKRGUMDqVF6xprKZ8FuGYOXALifQGWXocKS8WD4kzed+if5u8WE6yhbnt3YGUbLYJ/uDGAGXwDIZrKAnL2DZxt7hM7KJeGyi/01yUr4uV4ldxFdWRYsO6WcF+LCT7mnnxqOgkG/vJ5DxStvDMTLpUgmMhJ8pE9Ij4nuzuxPEJ2LAla0mQeCGJEwx3iUF+/yieFE/x+wT/z6B0nnBd6TXxuNjt1Otizgw2zNbchDXYifdBqq9d5g4yQQPXbOI19GPjefEw9yz59jmnh5irz1WR2Vpu/6ynLWacXKWoZIpIa0n3EpOHYUm2kfeacNCXWinq06bS+iQzujGAxCMNM3J6ZHi4YX2jYoaXIIffnQpO+tCnE8ri5mh3aqXMciRQU9Q8GpkzDKuGpQllM8tJW4/0wXAtdbqAa/fRxVrB2uMDGD6LZ4uuE05jzhCAzb3GbmzD6AIiaaTtbUdiayCPukjy1OgKJqp1TppSy3BoNcl3qdtOLbs/Ep+b4VfFQXGBM2w992lxOw1jkpPKGv23PDeGJlFEhRS5F5FQG8SNzvBYgtyeknXj3Y6UIscqZJvqjG6ibg8QaZZGUyC6xSxbIzvdJKQOu6Cp+6JtqykXC1zMYKgm2tqszb2J5L3DZOpRcsVa7z3svxNdUwqjhx4+mOJ1N8Vva3qO26FCmXwo7hd7q5TcJpasLdrryzj8FZvMsYR+vM11qF6Sxp8+rNyOkFi5qNSyGMnj8M9sLn7YMjxIlyvHJxCTaav4gIwc5+r6LnEFiRUffZrY6OeRVO1sDj7avSRwJZzVvOHdRDedifuQrY5o5lAmS9xhr4KRehK0OYr0MFWxy20cldhwib8HWas9rKs/3hah2uhheexw9z5VUPVAb3X5Cseb2e7I6w/0w40j9HNT6B12sLzbmaoaLhN1hs+SQ8N8wvQifcJnShtSfon0XU7a//XtZEegHdFH22E+2NaihnWmWzlv2Wnji9Fsd/8KMADJ8zBxJR0Q3gAAAABJRU5ErkJggg==';
	function loadeHTML() {
		if(document.all&&!window.opera) 
			return '<div class=ie_loader>Loading...</div>';
		var html = ['<span class=clockloader><img clockwise=1 class=cogwheel src="',loaderImage,'"><img src="',loaderImage,'" class=cogwheellefttop><img class=cogwheelrighttop src="',loaderImage,'"><img class=cogwheelleftbottom src="',loaderImage,'"><img src="',loaderImage,'" class=cogwheelrightbottom></span>'];
		return html.join('');
	}
	function runLoadingAnim(o) {
		var elems = o.getElementsByTagName('IMG');
		for(var i=0;i<elems.length;++i) {
			if(elems[i].addEventListener) {
				var upFunc = function(event) { updateLoading(event.target) };
				elems[i].addEventListener("transitionend", upFunc, true);
				elems[i].addEventListener("webkitTransitionEnd", upFunc, true);
				elems[i].addEventListener("oTransitionEnd", upFunc, true);
				updateLoading(elems[i]);
			}
		}
	}
	function updateLoading(o) {
		var animclass = o.getAttribute('clockwise') ? 'cogwheelClockwise' : 'cogwheelClockunwise';
		SetClass(o,animclass,false);
		setTimeout(function() {SetClass(o,animclass,true)},0);
	}
	function openLoader( container, frame_id ) {
		var w = findMainWnd();
		var killFunc = function() { killFrame(window,I(frame_id)); closeLoader(frame_id); return false };
		cont = w.document.createElement("SPAN");
		cont.id = frame_id + '_loader';
		cont.className = 'loader_object loadingFrame';
		cont.style.visibility = 'hidden';
		cont.onclick = killFunc;
		cont.title = "Отменить загрузку"
		cont.innerHTML = loadeHTML();
		w.document.body.appendChild(cont);
		var xy = w.getXY(container);
		xy.y += container.offsetHeight;
		cont.style.left = xy.x+"px";
		cont.style.top = xy.y+"px";
		var showFunc = function() { var o = w.I(cont.id); if(o) {o.style.visibility = 'visible'; runLoadingAnim(o); } };
		setTimeout(showFunc,500);
	}
	function closeLoader(frame_id) {
		var w = findMainWnd();
		var loader = w.I(frame_id+'_loader');
		if(loader) loader.parentNode.removeChild(loader);
	}
	function uncoverFrame(frm) {
		var div = frm.parentNode.nextSibling;
		if(div && div.getAttribute && div.getAttribute('coverdiv'))
			div.parentNode.removeChild(div);
	}
	function coverFrame( container )
	{
		var div = container.ownerDocument.createElement("DIV");
		div.style.position = "fixed";
		div.setAttribute('coverdiv',1);
		div.style.top = "0px";
		div.style.left = "0px";
		div.style.width = "100%";
		div.style.height = "100%";
		div.style.backgroundColor = "white";
		div.style.opacity = "0.5";
		if((document.all&&!window.opera)) {//for IE
			div.style.filter += 'progid:DXImageTransform.Microsoft.Alpha(Opacity=50)';
		}
		div.style.zIndex = "1";
		container.appendChild(div);
	}
	function openInFrame( container, frame_id, frame_name, uri, props) {
		var cont = container;
		if(cont = prepareFrame(container, frame_id, frame_name, props)) {
			props.loading && openLoader(container,frame_id);
			return (OpenLongURI( uri, frame_name ), true);
		}
		return false;
	}
	var popupSeqNumber = 1;
	function openPopupFrame(cont, uri, op) { 
		var w = findMainWnd();
		var pc = ++w.popupSeqNumber;
		w.openInFrame(cont,'popupCont'+pc,'popupFrame'+pc, uri, {opener: op?op:window, modal:true, loading:true, adjustFramePos:'H'} );
	}
	function openFreePopupFrame(cont, uri, op) { 
		var w = findMainWnd();
		var pc = ++w.popupSeqNumber;
		w.openInFrame(cont,'popupCont'+pc,'popupFrame'+pc, uri, {opener: op?op:window, modal:true, adjustFramePos: 'HV', loading:true} );
	}
	
	function deferCall(e) { setTimeout(e, 0) }
	
	function trimLastNull( a ) { a.pop(); return a; }

	function pageWidth(cw_doc) { return Math.max(cw_doc.scrollWidth, cw_doc.parentNode.scrollWidth)	}
	function pageHeight(cw_doc) { return (cw_doc.all&&!window.opera) ? cw_doc.offsetHeight + parseFloat(cw_doc.currentStyle.marginTop) + parseFloat(cw_doc.currentStyle.marginBottom)
		: cw_doc.parentNode.offsetHeight  }
	function frameDoc(frm) { return frm.contentWindow.document.body }

	function findCarcas() {
		if(adjustableFrame && 
			frameElement && frameElement.tagName == "IFRAME" 
			&& parent && window != parent
			&& "findCarcas" in parent)
			return parent.findCarcas();
		return window
	}
	function getCarcasWidth(elem) {
		var carcas = findCarcas();
		var offsetElem = elem || frameElement;
		var pos = offsetElem ? carcas.getXY(offsetElem) : null;
		var scrollbar = scrollbar_size();
		var size = carcas.document.body.clientWidth - ((pos && pos.x<carcas.document.body.clientWidth)? pos.x : 0)
		return (size>scrollbar.v) ? size - scrollbar.v : size;
	}

	function find_best_frame_size(frm) {
		var scroll = window_scroll(window)
		var oldSX = scroll.x
		var oldSY = scroll.y
		var cw_doc = frameDoc(frm);
		var carcas = findCarcas();
		var w;
		if(!frm.getAttribute("adjustFramePos")) 
			w = findCarcas().document.body.clientWidth;
		else
			w = getCarcasWidth();
		var step = Math.floor(w/2)
		frm.width = w
		var ch = pageHeight(cw_doc);
		if(cw_doc.offsetWidth>=pageWidth(cw_doc))
			while(step>1) {
				frm.width = w - step
				if(cw_doc.offsetWidth>=pageWidth(cw_doc) &&
					cw_doc.offsetHeight <= ch)
					w -= step
				step = Math.floor(step/2)
			}
		frm.width = pageWidth(cw_doc)+10
		frm.height = pageHeight(cw_doc)+1
		if("recalcParentSize" in window) recalcParentSize();
		window.scrollTo(oldSX, oldSY)
	}
	//parent даст этому фрейму столько пространства, сколько сможет достать (по умолчанию - сколько имеет, а фрейм должен сам подстраиваться)
	//можно менять после включения, чтобы вызвался find_best_frame_size
	var adjustableFrame = false;
	var recalcParentLocks = 0;
	var recalcParentRequest = false;
	function LockParentResize() { if(!recalcParentLocks++) recalcParentRequest = false; }
	function UnLockParentResize() { if(!--recalcParentLocks && recalcParentRequest) recalcParentSize() }

	var pathToResizeHelper = "http://parent.inevm.ru/height.html";
	function recalcParentSize() {
		if(recalcParentLocks) {
			recalcParentRequest = true;
			return;
		}
		var inSameDomain = true;
		if(inSameDomain) {
			if( parent && window != parent && frameElement) {
				parent.closeLoader(frameElement.id);
				if(adjustableFrame) {
					if(frameElement.tagName == "IFRAME") {
						parent.find_best_frame_size(frameElement);
						adjust_frame_pos(frameElement.getAttribute("adjustFramePos"))
					}
				} else {
					if(document.readyState == "complete") {
						var rpse = document.getElementById("RPS_TERMINATOR");
						if(!rpse) {
							rpse = document.createElement("DIV");
							rpse.id = "RPS_TERMINATOR";
							rpse.style.height = "1px";
							document.body.appendChild(rpse);
						}
						if(rpse.nextSibling) document.body.appendChild(rpse);
						frameElement.height = rpse.offsetTop;
						frameElement.width = document.body.parentNode.scrollWidth;
						if("recalcParentSize" in parent) parent.recalcParentSize();
					}
				}
			}
		} else {
			if(document.readyState == "complete") {
				var rpse = document.getElementById("RPS_TERMINATOR");
				if(!rpse) {
					rpse = document.createElement("DIV");
					rpse.id = "RPS_TERMINATOR";
					rpse.style.height = "1px";
					document.body.appendChild(rpse);
				}
				if(rpse.nextSibling) document.body.appendChild(rpse);
				if(pathToResizeHelper) {
					var ifrm = I('gateiframe');
					if(ifrm) document.body.removeChild(ifrm);
					ifrm = document.createElement('IFRAME');
					ifrm.id = 'gateiframe';
					ifrm.style.display = 'none';
					var h = rpse.offsetTop;
					var w = document.body.parentNode.scrollWidth;
					ifrm.src = pathToResizeHelper + "#h" + h + "w" + w + "id-"+ "x11";
					document.body.appendChild(ifrm);
				}
			}
		}
	}
	function createTextPlace(e)
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
	function removeTextPlace(tp)
	{
		document.body.removeChild(tp)
	}
	function resizeInput(e) {
		var tp = createTextPlace(e)
		var tn = document.createTextNode(e.value)
		tp.appendChild(tn)
		var s = tp.offsetWidth
		tp.removeChild(tn)
		var mw = e.readOnly ? 1 : 100
		if(e.getAttribute("minw")) {
			var tn = document.createTextNode(e.getAttribute("minw"))
			tp.appendChild(tn)
			mw = tp.offsetWidth
			tp.removeChild(tn)
		}
		s = s<mw?mw:s
		e.style.width = (s+10)+"px"
		if("value" in e) e.value = e.value;
		removeTextPlace(tp);
		recalcParentSize();
	}
	function resizeTextArea(e) {
		var tp = createTextPlace(e)
		var minwtext = e.getAttribute("minw") ? e.getAttribute("minw") : '';
		var tn = document.createTextNode(minwtext+'<br>'+e.value);
		tp.appendChild(tn);
		var minw = Math.max(400,tp.offsetWidth);
		tp.removeChild(tn);
		removeTextPlace(tp);
		//var size = (!e.value || e.value.length < mw) ? mw : e.value.length;
		//var w = Math.ceil(4*Math.log(size))
		var w = Math.min(minw,Math.max(400,getCarcasWidth(e)));
		e.style.width = w+'px'
		e.style.height = '14px'
		e.style.height = (e.scrollHeight+5)+'px'
		recalcParentSize();
	}
	var resizeFuncTable = {
		'INPUT':resizeInput,
		'input':resizeInput,
		'TEXTAREA':resizeTextArea,
		'textarea':resizeTextArea
	}
	function autoResizeOnEvent(e, obj) {
		var w = obj? null : e || event;
		var ele = obj || w.target || w.srcElement;
		var f = resizeFuncTable[ele.tagName];
		if(!f || ele.getAttribute('content-resizable') == null) return;
		if(obj || w.keyCode==35 || w.keyCode==36 || w.keyCode==13) {
			deferCall(function() { f(ele) })
		}
	}
	if (document.addEventListener) document.addEventListener('keydown', autoResizeOnEvent, false);
	else if( document.attachEvent ) document.attachEvent('onkeydown', autoResizeOnEvent);
	
	function makeResizeable(ele) {
		resizeFuncTable[ele.tagName](ele)
		ele.onchange = function(e) { eval(this.getAttribute('refresh_control')); resizeFuncTable[ele.tagName](this)}
	}
	function init_resize_inputs() {
		var c = document.getElementsByTagName("INPUT");
		for(var i = 0; i < c.length; ++i)
			if((c[i].type == "TEXT" || c[i].type =="text") && c[i].getAttribute('content-resizable')!=null)
				makeResizeable(c[i])
		
		c = document.getElementsByTagName("TEXTAREA");
		for(var i = 0; i < c.length; ++i) 
			if(c[i].getAttribute('content-resizable')!=null)
				makeResizeable(c[i])
	}
	function onElementFocused( event )
	{
		var e = event || window.event
		var el = e.target || e.srcElement
		window.lastFocusedElement = el;
	}
	if (document.addEventListener) document.addEventListener('focus', onElementFocused, true);
	else if( document.attachEvent ) document.attachEvent('onfocusin', onElementFocused);
	
	function setonload( func ) {
		if (document.body.addEventListener) document.body.addEventListener('load', func, false);
		else if( document.body.attachEvent ) document.body.attachEvent('onload', func);
	}
	function sendRequest(url,callback,obj,postData,repeat,canceler) {
		var req = obj || createXMLHTTPObject();
		if (!req) return;
		var method = (postData) ? "POST" : "GET";
		req.open(method,url,true);
		if (postData)
			req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
		req.onreadystatechange = function () {
			if (req.readyState != 4) return;
			if (req.status != 200 && req.status != 304) {
	//			alert('HTTP error ' + req.status);
				if(repeat)
					sendRequest(url,callback,req,postData,repeat);
				return;
			}
			if(req.responseText == repeat) {
				sendRequest(url,callback,req,postData,repeat);
				return;
			}
			callback(req);
		}
		if (req.readyState == 4) return;
		req.send(postData);
	}

	function createXMLHTTPObject() {
		return new XMLHttpRequest();
	}
	function sendSyncRequest(url) {
		var req = createXMLHTTPObject();
		if (!req) return;
		req.open("GET",url,false);
		if (req.readyState == 4) return;
		req.send();
		return req.responseText;
	}
	function JSSRC(url){eval(sendSyncRequest(url))}

	function SetDefFormFocus( frm )
	{
		var m = [];
		for( var i = 0; i < frm.elements.length; ++i )
		{
			var e = frm.elements[i];
			if( e.type != "hidden" && !e.readOnly && !e.disabled )
			{
				var type = e.type != "submit" && e.type != "button"? "gctrl": e.type;
				if( !m[type] )
					m[type] = e;
			}
		}
		var f = m["gctrl"] || m["submit"] || m["button"];
		if( f )
			f.focus();
	}
	var submitfocusLocks = 0;
	var submitfocusRequest = false;
	function LockSubmitFocus(){ if(!submitfocusLocks++) submitfocusRequest = false;}
	function UnlockSubmitFocus(form){if(!submitfocusLocks && submitfocusRequest) FocusSubmitButton(form);}
	function FocusSubmitButton( form )
	{
		if(submitfocusLocks) {
			submitfocusRequest = true;
			return;
		}
		for( var i = 0; i < form.elements.length; ++i )
		{
			var o = form.elements[i];
			if( o.type == 'submit' )
			{
				o.focus();
				if( window.lastFocusedElement == o )
					break;
			}
		}
	}

	function CloseOnEsc( e )
	{
		if( (e || window.event).keyCode == 27 )
		{
			window_close();
			return false;
		}
	}

	// not recursive!
	function ExpandExtScripts( s )
	{
		var re = new RegExp( "^\\s*(<sc" + "ript\\b[^>]*)(\\bsrc=['\"]([^'\"]+)['\"])([^>]*>)</sc" + "ript>", "im" );

		var t = "";
		for(;;)
		{
			var i = s.search( re );
			if( i == -1 )
				break;

			var lm_len = RegExp.lastMatch.length;

			if( i > 0 )
				t += s.substr( 0, i );

			t += RegExp.$1 + RegExp.$4;
			var src = RegExp.$3;
			
			t +=  sendSyncRequest( src );
			t += "</sc" + "ript>";

			s = s.substr( i + lm_len );
		}
		t += s;
		return t;
	}

	function ReplacePage( html, w )
	{
		deferCall(function() {
			var h = ExpandExtScripts(html.substr(html.indexOf('<')))
			var d = (w||window).document
			d.open("text/html")
			d.write(h)
			d.close()
		})
	}
	function setFormAttribute(form,attr,value) 
	{
		if(form.attributes[attr])
			form.attributes[attr].nodeValue = value
		else 
			form[attr] = value
	}

	function SetUrlParam( url, param, val )
	{
		if( !param )
			alert( "SetUrlParam: empty param name" )

		val = encodeURIComponent( val );

		var re = new RegExp( "([\?&]" + param + "=)[^&]*" );
		"Clean pockets".match(/./)
		var s = url.replace( re, "$1" + val );
		if( RegExp.$1 )
			return s;

		var p = param + "=" + val;

		var i = url.indexOf( "?" );
		if( i == -1 )
			return url + "?" + p;

		return i + 1 == url.length? url + p: url + "&" + p;
	}
	function GetUrlParam(url, param)
	{
		var re = new RegExp( "[\?&]" + param + "=([^&]*)" );
		var mm = url.match(re);
		if( mm )
			return decodeURIComponent( mm[1] );
	}
	function EncodeXSSURL(url,param)
	{
		var t = GetUrlParam(url,param);
		var rez = '';
		for(var i=0;i<t.length;++i) {
			if(t.charAt(i)=='<') rez += '(';
			else
			if(t.charAt(i)=='>') rez += ')';
			else
			if(t.charAt(i)=='(') rez += '<';
			else
			if(t.charAt(i)==')') rez += '>';
			else
			rez += t.charAt(i);
		}
		return SetUrlParam(url,param,rez);
	}
	function EncodeValList( vals, delim )
	{
		var d = delim || '~';

		var t = "";
		for( var i = 0; i < vals.length; ++i )
			t += replaceAll('_' + vals[i], d, d + d ) + d; // vals[i] can be a number!
		return t;
	}
	function UnDoubleCharSubstr(s, ch, off )
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
	}
	function DecodeValList(str, delim)
	{
		var d = delim || '~';
		var values = []
		var len = str.length;
		var pos = 0;
		while( pos < len )
		{
			ret = UnDoubleCharSubstr(str, d, pos);
			pos = ret.position;
			if( pos == -1 || ret.value.charAt(0) != '_' ) alert('DecodeValList error:'+ret.value);
			values.push(ret.value.substr(1));
		}
		return values.length ? values : null;
	}

	function EncodePair( name, val )
	{ 
		return name.replace( /:/g, '::' ) + ':' + val.replace( /:/g, '::' ); 
	}
	function DecodePair()
	{
		var t = [];
		
	}
	function EncodeFieldOpValue( field, op, val)
	{
		return field + " " + op + " " + val;
	}
	
	function EncodeMap( map )
	{
		var vals = []
		for( var k in map )
			vals.push( EncodePair(k, map[k]) )
		return EncodeValList( vals )
	}

	var dynTableKnownProps = {
		id: setInObj, className: setInObj, onclick: setInObj, innerHTML: setInObj,
		colSpan: setInObj, rowSpan: setInObj,
		paddingLeft: setInStyle, paddingRight: setInStyle, width: setInStyle,
		cells: skipThisProp
	}

	function skipThisProp(obj, name, val) { }
	function setInObj(obj, name, val) { obj[name] = val; }
	function setInStyle(obj, name, val) { obj.style[name] = val; }
	function SetKnownProps(obj,info)
	{
		for( var i in info)
		{
			var op = dynTableKnownProps[i]
			if(op) op(obj, i, info[i])
			else obj.setAttribute(i, info[i])
		}
		return obj
	}

	function AddTableRow(tbl,rowinfo,rownum)
	{
		var rowNum = defaultTo( rownum, tbl.rows.length );
		var row = tbl.insertRow( rowNum );
		row = SetKnownProps(row,rowinfo);
		for(var i=0;i<rowinfo.cells.length;++i) {
			var cell = row.insertCell(i);
			SetKnownProps(cell,rowinfo.cells[i]);
		}
		return row
	}
	function SetError( msg )
	{
		var errBox = I( "ErrBox" );
		errBox.innerHTML = StrToHtml( msg );
		errBox.style.display = msg? "block" : "none";
		recalcParentSize();
	}
	function setFocusPoint(id) {
		document.body.setAttribute('focuspoint',id);
	}
	function focusToFocusPoint() {
		var focuspoint = document.body.getAttribute('focuspoint');
		if(focuspoint && I(focuspoint)) 
			deferCall(function() { try{I(focuspoint).focus();} catch(ex) {} });
	}
	function ShowToolbar(show) 
	{
		var o = I('toolbartablecontainer');
		if(o) {
			show = defaultTo(show, !o.className);
			o.className = show ? 'showtoolbar' : '';
			focusToFocusPoint();
			recalcParentSize();
		}
	}
	function wrapShowHide(what,to) {//toolbar can be only one in body
		var code = ['<table id=toolbartablecontainer cellspacing="0" cellpadding="0" border="0"><tr><td valign="middle"><a href="javascript:void(0)" class=miniblock_text onclick="ShowToolbar();return false"><span class=toshowtoolbar>&#x25BA;</span><span class=tohidetoolbar>&#x25C4;</span></a><td valign="middle"><span id=bottom_toolbar>',what.innerHTML,'</span></table>'];
		to.innerHTML = code.join('');
		what.parentNode.removeChild(what);
	}
	var onclickAttr = null;
	var onclickObj = null;/*for IE*/
	var hrefAttr = null;
	function hideActions(src) {
		onclickAttr = src.getAttribute('onclick');
		hrefAttr = src.getAttribute('href');
		onclickObj = src.onclick;
		src.removeAttribute('onclick');
		src.onclick = null;
		hrefAttr && src.setAttribute('href','javascript:void(0)');
	}
	function restoreActions(src) {
		onclickObj && (src.onclick = onclickObj);
		onclickAttr && src.setAttribute('onclick', onclickAttr);
		hrefAttr && src.setAttribute('href', hrefAttr);
		onclickAttr = null;
		onclickObj = null;
		hrefAttr = null;
	}
	var touchTimer = null;
	function TouchCancel(src)
	{
		if(touchTimer) clearTimeout(touchTimer);
		touchTimer = null;
		var restore = function() { restoreActions(src); };
		deferCall(restore);
		src.onmouseup = null;
		src.onmouseout = null;
		return false;
	}
	function Touch(src,func)
	{
		if(touchTimer) {
			if(touchTimer) clearTimeout(touchTimer);
			touchTimer = null;
		}
		if(!touchTimer) {
			var cancelfunc = function() { return TouchCancel(src); };
			touchTimer = setTimeout( func, 500);
			src.onmouseup = cancelfunc;
			src.onmouseout = cancelfunc;
		}
		return false;
	}
	function TouchAction(src, func)
	{
		var callfunc = function() { hideActions(src); func(src); };
		return Touch(src,callfunc);
	}
	function TouchMenu(src, menuId, props) {
		var callfunc = function() { hideActions(src); OpenMenuId(src,menuId,props); };
		return Touch(src,callfunc);
	}
	function parseLink(value) {
		if(value.indexOf(';')>=0) {
			var vals = SplitCondValueForArray(value);
			return (vals.length>0 ? {caption:vals[0],url:(vals.length>1?vals[1]:null)} : null);
		} else {
			if(value) {
				return {caption:value,url:value}
			}
		}
	}
	function OpenAnyURI(url,target) {
		if(url) {
			if(url.charAt(0)=='/') {
				OpenLongURI(url,target);
			}
			else
			if(url.indexOf(':')>=0) {
				open(url,target);
			}
			else {
				open('http://'+url,target);
			}
		}
	}
	function findFirstExample(cont) {
		var e = cont.firstChild;
		while(e && e.className != "sample")
			e = e.nextSibling;
		if(e) return e;
		for(var e = cont.firstChild; e; e = e.nextSibling) {
			var r = findFirstExample(e);
			if(r) return r;
		}
		return null;
	}

	function cloneTableRow(tbl) {
		var toClone = findFirstExample(tbl);
		if(!toClone) return;
		
		var g = toClone.cloneNode(true);
		g.className = "";//toClone.getAttribute("originalClass");
		patchIE7functions(g);
		toClone.parentNode.appendChild(g);
		return g;
	}
	
	var ie7Mode = document.all && !window.opera && (!document.documentMode || document.documentMode < 8);
	function patchIE7functions(cont) {
		if(ie7Mode) {
			var a = (cont||document).getElementsByTagName('*');
			for(var i = 0; i < a.length; ++i)
			{
				var e = a[i];
				if(e.attributes)
				for(var j = 0; j < e.attributes.length; ++j)
					if(e.attributes[j].name.match(/^x7_(.*)/))
						e.setAttribute(RegExp.$1, eval("var eval_f = function(){return "+e.attributes[j].value+"}; eval_f"));
			}
		}
	}

	function setClonableHandler(e, n, s) {
		if(ie7Mode) {
			e.setAttribute("x7_"+n, s);
			e.setAttribute(n, eval("var eval_f = function(){return "+s+"}; eval_f"));
		} else {
			e.setAttribute(n, s);
		}
	}

	function GetCssText(id) {
		var cssText = ""
		for(var i = 0; i < document.styleSheets.length; ++i)
			if( (document.styleSheets[i].id || document.styleSheets[i].ownerNode && document.styleSheets[i].ownerNode.id) 
					== id)
				if(document.styleSheets[i].cssText) cssText = document.styleSheets[i].cssText;
				else {
					var rules = document.styleSheets[i].cssRules;
					for(var j = 0; j < rules.length; ++j)
						cssText += '\n' + rules[j].cssText;
				}
		return cssText;
	}
	function addStyleSheet(cssText) {
		var ss = document.createElement("STYLE");
		ss.type = "text/css";
		if(ss.styleSheet)
			ss.styleSheet.cssText = cssText;
		else
			ss.appendChild(document.createTextNode(cssText));
		T("HEAD").appendChild(ss);
		
		return ss;
	}
	
	function migrateCss(id) { addStyleSheet(parent.GetCssText(id)).id = id; }


	function quoteRegExp(str) { return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1"); }
	
	function CommonFuncsLoaded() { return true; } // for debugging, must be the last line

