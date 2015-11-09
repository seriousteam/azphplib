var QE = (function() {
	function prepareStrings(x, arr) {
		return x.replace(/'[^']*(''[^']*)*?'/g, function(a) {
			arr.push(a); return "C("+(arr.length-1)+")";
		});
	}
	function stringsBack(s, arr) { return s.replace(/C\((\d+)\)/g, function(a, n) { return arr[+n]; }); }
	//var strings = [];
	//cmd = prepareStrings(getCMD(), strings);
	//cmd  = stringsBack(cmd ,strings)
	//alert(cmd);
	function getSelection(control) {//works on textarea and input
		var dstart, dend;
		if(document.all && !window.opera) {
			var txt = document.selection.createRange().text;
			dstart=cp-txt.length;
			dend=cp;
		} else {
			dstart=control.selectionStart;
			dend=control.selectionEnd;
		}
		return {begin: dstart, end: dend}
	}
	function getCaretPosition(control) //works on textarea and input
	{
		var iCaretPos = 0;
		if (document.selection) {			
			control.focus ();
			var oSel = document.selection.createRange ();
			oSel.moveStart ('character', -control.value.length);
			iCaretPos = oSel.text.length;
		}
		else if (control.selectionStart || control.selectionStart == '0')
		iCaretPos = control.selectionStart;
		return (iCaretPos);
	}
	function setCaretPosition(control, pos) 
	{
		if(control.setSelectionRange)
		{
			control.focus();
			control.setSelectionRange(pos,pos);
		}
		else if (control.createTextRange) {
			var range = control.createTextRange();
			range.collapse(true);
			range.moveEnd('character', pos);
			range.moveStart('character', pos);
			range.select();
		}
	}
	function writeToControl( control, value ) {
		var oldvalue = control.V();
		var sel = getSelection(control);
		control.setV( oldvalue.substr(0, sel.begin)+value+oldvalue.substr(sel.end, oldvalue.length - sel.end) );
		setCaretPosition( control, sel.begin + value.length );
	}
	function textWidth(text) {
		var tp = X.createTextPlace(document.body);
		var tn = document.createTextNode(text)
		tp.appendChild(tn)
		var s = tp.offsetWidth
		tp.removeChild(tn)
		return s;
	}
	/*Utils End*/
	function mergeRelations(M) {
		var rez = {};
		var whatisin = {};
		var whereto = {};
		var marks = {};
		for(var i in M) {
			var table = M[i];
			marks[i] = { sum: 0 };
			for(var j in table) {
				var fld = table[j];
				if( fld["target"] && fld.merge ) {
					var idx = fld["target"];
					(whatisin[idx] || (whatisin[idx] =[])).push( { table: i, relation: j } );
					whereto[i] = { table: fld["target"], relation: j };
				}
			}
		}
		function recalcweight(node) {
			var sources = whatisin[node] || [];
			marks[node].sum = 1;
			for(var j = 0;j<sources.length; ++j ) {
				var source = sources[j];
				marks[node].sum += marks[source.table].sum || recalcweight( source.table );
			}
			return marks[node].sum;
		}
		for(var i in M) recalcweight( i );
		var merged = {};
		var arr = [];
		for(var i in marks) arr.push({ table: i, sum: marks[i].sum });
		arr.sort(function(a,b){ return a.sum>b.sum})
		for( var i=0; i<arr.length; ++i ) {
			var sourcename = arr[i].table;
			var source = M[ sourcename ];
			var dist = whereto[ sourcename ];
			if(dist) {
				merged[ sourcename ] = true;
				for(var s in source) {
					if(s !== dist.relation && s != "$") {
						(source[ s ].info || (source[ s ].info = [])).push( { table: source, relation: dist.relation } );
						M[ dist.table ][ sourcename+'.'+dist.relation+'.'+s ] = source[ s ];
					}
				}
			}
		}
		for(var i in merged) delete M[i];
	}
	function mergeDictionary(M) {
		for(var i in M) {
			var table = M[i];
			for(var j in table) {
				
			}
		}
	}	
	/* Conditions*/
	function getCMD() { return window.document.location.search.URLParam("cmd", "") }
	function setCMD( cmd ) { window.document.location.search = window.document.location.search.setURLParam("cmd", cmd) }
	
	function reload( uri ) { window.document.location.search = uri }	
	function getURI() { return  window.document.location.search }
	function clearURLArgs( url ) { return url.replace(/[?&]args\[\]=([^&]*)/g, "") }
	function getURLArgs( url )
	{
		var arg;
		var re = /[?&]args\[\]=([^&]*)/g;
		var args = [];
		while( (arg =  re.exec(url)) != null ) {
			args.push(decodeURIComponent( arg[1] ));
		}
		return args;
	}	
	function setFilter(uri, command, args) {
		uri = clearURLArgs( uri );
		uri = uri.setURLParam('cmd', command.length ? ('*'+command) : '');
		for(var i = 0; i < args.length; ++i)
			uri += '&args[]=' + encodeURIComponent( args[i] );
		return uri;
	}
	function getFilter(uri) {
		var args = getURLArgs( uri );
		var where = uri.URLParam('cmd', "").replace(/^\*/i, '');
		return {command: where, args: args}
	}
	function apply() {
		var args = [];
		var filter = print_filter( QE.listing, args );
		var uri = getURI();
		uri = setFilter(uri, filter, args.concat( QE.unhandled_args ) );
		reload( uri );
	}		
	function parse_name(field) { return field.replace(/^a\./,"") }
	function print_name(list_node) { return  (list_node._path.length>1 ? "a." : "") + list_node.name  }
	
	function parse_and_or( s, listing ) {
		listing = listing || [];
		var ors = s.split( /\s+or\s+/i );
		for(var i=0;i<ors.length;++i) {
			if(i) listing.push( {OR: true} );
			ors[i] = ors[i].trim();
			if(ors[i].length) {
				var ands = ors[i].split(/\s+and\s+/i );
				for(var j=0;j<ands.length;++j) {
					listing.push( ands[j] );
				}
			}
		}
		return listing;
	}
	function parse_ops( where, map) {
		for(var i=0;i<where.length;++i) {
			var op;
			if(!where[i].OR) {
				if(X.isArray(where[i])) {
					parse_ops( where[i], map )
				}
				else {
					var re = /(\s+(?:like|in)\s+|\s+(?:is null|is not null)\s*|\s*(?:<>|>=|<=|>|<|=)\s*)/i;
					var fld_val = where[i].split( re );
					
					var field = brackets_back(fld_val[0], map, true );
					var op = fld_val[1].trim().toUpperCase();
					var value =  brackets_back(fld_val[2], map, true );
					if(op=='LIKE') {
						if(value.match(/\|\|'%'$/)) {
							op = "BEGINS";
							value = '?';
						} else
						if(field.match(/^\s*UPPER\(/) && value.match(/^\s*UPPER\('%'\|\|\?\|\|'%'\)\s*$/)) {
							field = /^\s*UPPER\((.*)\)\s*$/.exec( field )[1];
							op = "CONTAINS";
							value = '?';
						}							
					}
					where[i] = { path: parse_name(field), op: op, value: value };
				}
			}
		}
	}
	function parse_command(command) {
		var rez = {};
		var parts = command.split(/\b(WHERE|ORDER BY|GROUP BY|LIMIT|PAGER)\b/ig);
		for(var i=0;i<parts.length;++i) {
			parts[i] = parts[i].trim();
			if(parts[i].length) {
				rez[ parts[i].trim().toUpperCase() ] = (parts[i+1] || "").trim();
				i++;
			}
		}
		return rez
	}
	function prepare_brackets( command ) {
		var parts = [];
		var done;
		do {
			done = false;
			command = command.replace(/\(([^()]+)\)/ig, function( full, part ) {
				parts.push( part );
				done = true;
				return "/*"+(parts.length-1)+"*/";
			});
		} while(done);
		return { map: parts, prepared: command }
	}
	function brackets_back(str, map, put_brackets) {
		var idx, re = new RegExp("/\\*(\\d+)\\*/","g")
		if((idx = re.exec( str )) != null) {
			var back = map[+idx[1]];
			str = str.replace( re, put_brackets && ('('+back+')') || back );
		}
		return str;
	}
	function parse_where( where, listing, map, args, node_map ) {
		var args_count = 0;
		where = where.replace(/\?/g, function(full, part) { return '?' + args_count++ + '?' })
		//var where = "(ensyrecordidw=? and enrf_tasks.id<>? or a.enrel_id.rel_b.endatew=?) and ( a.enrel_id.rel_b.endatew like ? and B=? or (C=? and D<>?)) or (E>=?) and (rf_tasks.rel_task >= 3) or (G like ? and rel1.rel2.rel3 IN (SELECT ... ) )";
		parse_and_or( where, listing );
		for(var i=0;i<listing.length;++i) {
			if(!listing[i].OR) {				
				listing[i] = parse_and_or( brackets_back(listing[i], map ) );
			}
		}
		parse_ops( listing, map );		
		for(var i=0;i<listing.length;++i) {
			if(!listing[i].OR) {
				var field_conds = listing[i];
				var node = new listing_node( node_map[ field_conds[0].path ] );
				for(var j=0;j<field_conds.length;++j) {
					var cond = field_conds[j];
					if( cond.OR ) 
						continue;
					if( node.name != cond.path ) 
						throw "Mixed field conditions";
					
					if( cond.value && cond.value=='?' )
						cond.value = args[ args_count++ ]
						
					add_and_filter(node,  cond.op, j && field_conds[j-1].OR, cond.value )
				}
				listing[i] = node;
			}
		}		
	}	
	
	function clear(listing)
	{
		for(var i=0;i<listing.length;++i) { delete listing[i].empty }
		while(listing.length && listing[0].OR) { listing.shift() }
		while(listing.length && listing[ listing.length - 1 ].OR) { listing.pop() }
		var i = 1;
		while(i<listing.length) { 
			if(listing[i-1].OR && listing[i].OR) {
				listing.splice(i, 1)
			} else 
				i++
		}
	}
	function idx_in_grp(list, pos)
	{
		var idx = 0;
		var i = pos;
		while(list[i] && !list[i].OR) { idx++; i-- }
		return idx - 1;
	}
	function select_grp(list, place)
	{
		var rez = { begin:0, count:0 };
		var i = place;
		while(list[i] && !list[i].OR) { i-- }
		rez.begin = i + 1;
		while(list[rez.begin+rez.count] && !list[rez.begin+rez.count].OR) { rez.count++ }
		return rez;
	}
	function deactive_all(list) {
		for(var i =0;i<list.length;++i) delete list[i].active;
	}
	function mark_active(list, index) {
		var grp = select_grp(list, index);
		for(var i=grp.begin;i<(grp.begin+grp.count);++i) list[i].active = true;		
	}
	function place_at_outside(from, to, list)
	//outside group - 'to' is global index
	{
		var grp = select_grp(list, from);
		var elems = list.splice(grp.begin, grp.count);
		if(to>from) 
			to = to - grp.count;
		list.splice( to, 0, { OR: true })
		for(var i=1;i<elems.length+1;++i)
			list.splice( to+i, 0, elems[i-1] )
		list.splice( to+i, 0, { OR: true })		
	}
	function place_at_inside(from, to, list)
	//inside group - 'to' is local index
	{
		var grp = select_grp(list, from);
		to = grp.begin + to;
		if(grp.begin <= to && to < (grp.begin + grp.count) && from != to) {
			var elems = list.splice(from, 1);
			list.splice( to, 0, elems[0]);
		}
	}
	function find_list_node(name, list)
	{
		for(var i=0;i<list.length;++i) {
			if(list[i].name==name) return i;
		}
		return null;
	}
	function parse_order( order, listing, node_map ) {
		var parts = order.split(",");
		var fields = [];
		for(var i=0;i<parts.length;++i) {
			var order = /(.*)\b(ASC|DESC)$/i.exec( parts[i].trim() );
			if(order != null) {
				var name = parse_name( order[1].trim() );
				if(name.length)
					fields.push({ name: name, order: order[2].toUpperCase() });
			}
		}
		for(var i=0;i<fields.length;i++) {
			var cur = find_list_node(fields[i].name, listing);
			if(cur==null) {
				var node = new listing_node( node_map[ fields[i].name ] );
				node.order = fields[i].order;
				listing.push( node );
			} else {
				listing[cur].order = fields[i].order;
			}			
		}
		for(var i=fields.length-1;i>=0;i--) {//sorting inside groups
			var cur = find_list_node(fields[i].name, listing);
			place_at_inside(cur, 0, listing);			
		}
		for(var i=fields.length-1;i>=0;i--) {//sorting of groups
			var cur = find_list_node(fields[i].name, listing);
			if(idx_in_grp(listing, cur)==0) {
				place_at_outside(cur, 0, listing);
			}		
		}
		clear(listing);
	}	
	function parse_group( order, listing, node_map ) {
		var parts = order.split(",");
		var paths = [];
		for(var i=0;i<parts.length;++i) {
			var path = parts[i].trim();
			if(path.length) {
				paths.push( parse_name(path) );
			}			
		}
		var list_map = {};
		for(var i=0;i<listing.length;++i) {
			if(!list_map[ listing[i].name ]) list_map[listing[i].name] = listing[i];
		}
		for(var i=0;i<paths.length;++i) {
			if(!list_map[ paths[i] ]) {
				var node = new listing_node( node_map[ paths[i] ] );
				listing.push( node );
				list_map[ paths[i] ] = node;
			}
			list_map[ paths[i] ].group = true;
		}
	}
	function parse_filter(node_map) {
		QE.unhandled_args = [];
		var filter = getFilter( getURI() );
		var precom = prepare_brackets( filter.command );
		var com = parse_command( precom.prepared );
		var listing = [];
		com["WHERE"] && parse_where( com["WHERE"] , listing, precom.map, filter.args, node_map );
		com["ORDER BY"]  && parse_order( com["ORDER BY"], listing, node_map);
		com["GROUP BY"]  && parse_group( com["GROUP BY"], listing, node_map);
		return listing;
	}
	
	function print_ops(list_node, op, value, args) {
		var unary = { "IS NULL":1, "IS NOT NULL":1 };
		if(unary[op]) 
			return print_name(list_node) + ' ' + op;
		else {
			var name = print_name(list_node)
			if(op=='BEGINS') {
				args.push( value || '' );
				return  name + " LIKE ?||'%'";
			} else
			if(op=='CONTAINS') {
				args.push( value || '' );
				return  'UPPER('+name+") LIKE UPPER('%'||?||'%')";
			}			
			else {
				args.push( value || '' );
				return name + ' ' + op + ' ?';
			}
		}
	}
	function print_where(filter, args, list_node) {
		clear( filter );
		var where = [];		
		var ands = [];
		for(var i=0;i<filter.length;++i) {
			var cond = filter[i];
			if( cond.OR) {
				if(ands.length) {
					where.push( ands.join(' AND ') );
					ands = [];
				}
			} else if( cond.name ) {
				if(cond.filter.length)
					ands.push( '('+print_where(cond.filter, args, cond)+')');
			}
			else {						
				ands.push( print_ops(list_node, cond.op, cond.value, args) )				
			}
		}
		if(ands.length)
			where.push( ands.join(' AND ') );
		return where.join(' OR ');
	}
	function print_order_group(listing) {
		var order = [];
		var group = [];
		var ordermap = {};
		var groupmap = {};
		for(var i=0;i<listing.length;++i) {
			var node = listing[i];
			if(!node.OR && (node.order.length || node.group)) {
				var name = print_name(node);
				if(node.order.length && !ordermap[name]) {
					ordermap[name] = node.order;
					order.push( name );
				}
				if(node.group && !groupmap[name]) {
					groupmap[name] = node.group;
					group.push( name );
				}
			}
		}
		var orderrez = [];
		var grouprez = [];
		for(var i=0;i<order.length;++i) { orderrez.push(order[i] + ' ' + ordermap[ order[i] ]) }
		for(var i=0;i<group.length;++i) { grouprez.push(group[i]) }
		return  (grouprez.length ? (" GROUP BY "+grouprez.join(' ,')) : "") + (orderrez.length ? (" ORDER BY "+orderrez.join(' ,')) : "");//order important
	}
	function print_filter(listing, args) {
		var filter = "";
		var where = print_where(listing, args);
		filter += (where.length ? (' WHERE '+where) : "");
		filter += print_order_group(listing);
		return filter.trim();
	}

	function listing_node(packnode, active) {
		this.node = packnode;
		this.name = packnode.name;
		this.caption = packnode.caption;
		this.active = active;
		this.filter = [];
		this.order = "";
		this.group = "";
		return this;
	}
	
	
	function push_node(node, after) {
		if(!node) 
			{ QE.listing.push({ OR:true }); return }		
		if(after == undefined) 
			after =  QE.listing.length-1;
		QE.listing.splice(after+1, 0,  new listing_node(node, true) );
		for(var i=0;i<QE.listing.length-1;++i) delete QE.listing[i].empty;
	}	
	function add_and_filter( list_node, op, or, value ) {
		var filter = list_node.filter;
		if(filter.length && or)
			filter.push( { OR: true, cont: list_node } )
		filter.push( {op: op, empty: op=="empty", value: value, cont: list_node  } );
	}
	function del_and_filter(list_node, index) {
		var filter = list_node.filter;
		if(index && filter[index-1].OR) 
			filter.splice(index-1, 2)
		else
			filter.splice(index, 1)
		
		clear(filter);
	}
	function shift_listing_node(i, direction)
	{
		var listing = QE.listing;
		var grp = select_grp(listing, i);
		var idx = idx_in_grp(listing, i);
		if( idx == 0 && direction < 0 || idx == (grp.count - 1) && direction > 0) {			
			grp = select_grp(listing, grp.begin + (direction > 0 ? (grp.count + 1) : -2) );			
			if( grp.count ) {
				place_at_outside(i, grp.begin + (direction > 0 ? grp.count : 0), listing);
				clear( listing );
				deactive_all(listing);
				mark_active(listing, grp.begin);
			}					
		} else {
			place_at_inside(i, idx_in_grp(listing, i + direction), listing);
			clear( listing );
			deactive_all(listing);
			mark_active(listing, i + direction);
		}				
	}
	function drawgradients(defs) {
		/*<defs>
		    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
		      <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
		      <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
		    </linearGradient>
		  </defs>*/
		var gradients = d3.scale.ordinal()
			.range( ["qe-first","qe-second","qe-third","qe-fourth","qe-fifth","qe-sixth"] );
				
		var grad =defs.selectAll(".qe-gradient")
			.data( gradients.range() ).enter()
			.append("radialGradient")
				.attr("class", "qe-gradient")
				.attr("id", function(d,i) { return d })
				.attr("cx", "0.5")
				.attr("cy", "0.5")
				.attr("r", "0.5")
				.attr("fx", "0.25")
				.attr("fy", "0.25");
		
		grad.append("stop")
			.attr("offset", "0%")
			.attr("class", "stop1")
				
		grad.append("stop")
			.attr("offset", "100%")
			.attr("class", "stop2")
		
		return gradients;
	}

	function update_listing() {
		var div = QE.cont.select(".qe-listing");
		var listing = QE.listing;
		if(listing.length && !listing[listing.length-1].OR)
			listing.push( {OR:true, empty: true } );
			
		var list_node = div.selectAll(".qe-list-node")
			.data( listing )
		
		list_node.exit().remove();
		
		var new_list_node = list_node.enter().append("div")
				.attr("class", "qe-list-node")
			
		new_list_node.append("div")
				.attr("class", "qe-list-node-caption")
			.append("span")
		
		list_node
				.attr("current", function(d) { return d.active })
				.attr("index", function(d,i) {return i })
				.attr("empty", function(d) { return d.empty || undefined })
				.attr("type", function(d) { return d.OR && "OR" || undefined  })
				.attr("grp-begin", function(d, i) { return !listing[i-1] || listing[i-1].OR || null })
				.attr("grp-end", function(d, i) { return !listing[i+1] || listing[i+1].OR || null })
				.on("click", function(d, index) {
					var list = QE.listing;
					if(index == list.length - 1) {
						deactive_all(QE.listing);
						delete d.empty;
						update_listing();						
					} else if(!d.OR) {
						deactive_all(QE.listing);
						mark_active(QE.listing, index);						
						update_listing();
					}
				})
			.select("span")
				.text(function(d) { return d.caption } );
		
		new_list_node.append("div")
				.attr("class","qe-condition-block")
		
		var new_order = new_list_node.append("div")
				.attr("class", "qe-order")
		
		new_order
			.append("a")
				.attr("down", 1)
		new_order
			.append("button")
				
		new_order
			.append("a")
				.attr("replace-state", 1)
		new_order
			.append("a")
				.attr("up", 1)
		
		new_list_node.append("div")
				.attr("class", "qe-group")
			.append("button")
		
		
				
		var condition = list_node.select(".qe-condition-block").selectAll(".qe-condition")
			.data(function(d) {
				if(d.OR)
					return [];
				return !d.filter.length ? 
					[{ op:"empty", cont: d, empty: true }] : 
					d.filter.concat( [{ AND: true, cont: d, empty: true }, { OR:true, cont: d, empty: true }])		
			})
			
		condition.exit().remove();		
		
		var new_condition = condition.enter().append("div")
				.attr("class", "qe-condition")
			
		new_condition.append("a")
			.html("×")
			
		var filter_names = {"empty":"условие", "AND":"и условие", "OR":"или условие", "=":"равно","<>":"не равно",">":"больше","<":"меньше", ">=":"больше или равно",
		"<=":"меньше или равно", "BEGINS":"начинается с", "CONTAINS":"содержит", "LIKE":"похоже на","IN":"среди", "IS NULL":"пусто", "IS NOT NULL":"не пусто"};
		var filter_ops = ["", "=", "<>", "BEGINS", "CONTAINS", "LIKE", ">","<", ">=", "<=", "IN", "IS NULL", "IS NOT NULL"];
		new_condition.append("select")
		
		new_condition.append("input")
				.attr("type","text")
		
		condition.select("a")
				.on("click", function(d, i) {					
					del_and_filter( d.cont, i );					
					update_listing();
					d3.event.stopPropagation();
				})				
		condition
				.attr("type", function(d) { return d.op || d.OR && "OR" || d.AND && "AND" || undefined })
				.attr("empty", function(d) { return d.empty || undefined })
				.on("click", function() {d3.event.stopPropagation() })
		condition.select("input")
				.on("change", function(d) { 
					d.value = this.V(); 
					d3.select(this).transition().style("width",  textWidth(d.value || "some text")+13+'px') 
				} )
				.attr("value", function(d) { return d.value || '' })
				.style("width", function(d) { return textWidth(d.value || "some text")+13+'px' })
		condition.select("select")
				.on("change", function(d) {
					var op = this.options[ this.selectedIndex ].value;
					if(d.empty) {
						add_and_filter( d.cont, op, d.OR )
					} else {
						d.op = op;
					}
					delete d.empty;
					delete d.OR;
					delete d.AND;
					update_listing();
					d3.select(this.parentNode).select("input").node().focus();
				})
				.style("width", function(d) {
					return textWidth(filter_names[d.op || d.OR && "OR" || d.AND && "AND" || "empty"])+25+'px' }
				)
		
		var option = condition.select("select").selectAll("option")
				.data( function(d) {					
					return filter_ops.map(function(x) { return {d: d, op: x} });
				} );
		option.enter().append("option")
				
		option
				.text(function(d) { 
					return filter_names[d.op || d.d.OR && "OR" || d.d.AND && "AND" || "empty"]
				})
				.attr("value", function(d) {return d.op } )
				.attr("disabled", function(d) { return d.op==="" || undefined })
				.property("selected",  function(d) { 
					return d.d.op===this.value || d.d.empty && this.value==="" || false 
				})
		
		option.exit().remove();
		
		
		var order = list_node.select(".qe-order")
				.attr("empty", function(d) { 
					return !d.OR && !d.order.length || undefined 
				})
		
		order.select("button")
				.text(function(d) {
					return {"ASC":"по возрастанию", "DESC":"по убыванию", "":"сортировка"}[ d.order ] 
				})
				.on("click", function(d) {
					d.order = {"ASC":"DESC", "DESC":"","":"ASC"}[ d.order ];
					update_listing();
					d3.event.stopPropagation();
				})
		order.select("[replace-state]")
				.on("click", function(d) {
					QE.cont.attr("replace-mode", 1);					
				})
		order.select("[up]")
				.on("click", function(d, i) {
					shift_listing_node(i, -1);
					update_listing();
					d3.event.stopPropagation();
				})
		order.select("[down]")
				.on("click", function(d, i) {
					shift_listing_node(i, 1);
					update_listing();
					d3.event.stopPropagation();
				})
				
		
		var group = list_node.select(".qe-group")
				.attr("empty", function(d) { 
					return !d.OR && !d.group || undefined 
				})
		
		group.select("button")
				.text(function(d) {
					return d.group ? "сгруппировать" :  "группировка";
				})
				.on("click", function(d) {
					d.group = !d.group;
					update_listing();
					d3.event.stopPropagation();
				})
	}
	function drawlisting() {
		var panel = QE.cont.append("div")
				.attr("class", "qe-panel")
				
		var div = panel.append("div")
				.attr("class", "qe-listing");
		
		var button_panel = panel.append("div")
				.attr("class", "qe-button-panel")
		
		button_panel.append("div")
				.attr( "class", "qe-accept" )				
			.append("div")				
				.on("click", function() { QE.apply() })
				//.text("Применить")
		
		button_panel.append("div")
				.attr( "class", "qe-close" )				
			.append("div")				
				.on("click", function() { QE.close() })
				//.text("Закрыть")
				
		update_listing();
	}
	function buildRelMap(M)
	{
		var map = {};
		for(var table_name in M) {
			var table = M[table_name];
			for(var field_name in table) {
				if(field_name=='$') continue;
				var field = table[field_name];				
				if(field.target) 
					(map[field.target] || (map[field.target] = [])).push({ table: table_name, field: field_name });				
			}
		}
		return map;
	}
	/*
	rel  (a.f2 = ? or a.f3 = ? : '2015', '2016')
	rel : {condition:'a.f2 = ? or a.f3 = ? or exists(select 1 from t4 where a.rel.join and (a.f4 = ? or a.f4 = ?))', args:['2015', '2016', '2015', '2016']}
	where (f1=? and f1=?) or (f3 = ? or f3 = ?  and f3 = ?) and exists/B/(select 1 from t1 where a.rel1.join and exists/B/(select 1 from t2 where a.rel2.join and (a.f2 = ? and b = ?) ))
	
	%%a.rel1.rel2.rel3.f3%%
	exists/B/(select 1 from t1 where a.rel.join and (a.f1=? or a.f2=?) and %%f1%%)
	*/
	function navigator_node(model)
	{	
		this.model = model;
		this.caption = "";
		this.constructor = navigator_node;
		this.node_map = {};
		this.getWildPath = function() {
			var args = [];
			var forwards = [];
			var forward = [];
			this.path.forEach(function(p) {
				if(p.back) {
					forwards.push(forward);
					forward = [];
				}
				else
					forward.push(p);
			});
			var wildpath = "";
			forward.forEach(function(p) {
				wildpath += !wildpath.length && "a." || "";
				wildpath += p.field + ".";
			});
			wildpath = "#" + wildpath + "#";
			forwards = forwards.map(function(p) {
				var path = p.map(function(pp) { return pp.field }).join('.');
				return path ? (".ext."+path) : "";
			})
			var backpath = this.path
				.filter(function(p) { return p.back })
				.map(function(path, i) {				
					var sql = "EXISTS/*B*/(SELECT 1 FROM #TBL# WHERE a.#BACKREL#.join#FORWARD##COND###)"
						.replace("#TBL#", path.table)
						.replace("#BACKREL#", path.field)
						.replace("#FORWARD#", forwards[i])
					if(path.condition) {
						sql = sql.replace("#COND#", " AND "+path.condition);
						args = args.concat(path.args);
					} else {
						sql = sql.replace("#COND#","")
					}
					return sql;
					
				});			
			backpath.reverse();
			backpath.forEach(function(path) {
				wildpath = path.replace("##", " AND " + wildpath);
			});				
			return { 
				wildpath: wildpath, 
				args: args,
				getPath : function() {
					var field = /#([^#]*)#/g.exec(this.wildpath);
					return field && field[1];
				},
				putPath : function(str) {			
					return this.wildpath.replace(/(#[^#]*#)/g, str);
				}
			};		
		}		
		this.getOpExpr = function(name, op, value, args) {			
			if(op=="IS NULL" || op=="IS NOT NULL")
				return name + op;			
			args.push(value);			
			if(op=='BEGINS') 
				return  name + " LIKE ?||'%'";
			else if(op=='CONTAINS')
				return  'UPPER('+name+") LIKE UPPER('%'||?||'%')";				
			else
				return name + ' ' + op + ' ?';
		}
		this.unfold = function() {
			var self = this;
			var root = self.parent;
			var source = this.hidden || root.hidden;
			for(var i=0;i<source.length;++i) {
				var child = source[i];
				child.folder = this.name;
				root.children.unshift( child );
			}
			this.folded = false;
		}
		this.fold = function() {
			var self = this;
			var root = self.parent;
			root.children = root.children.filter(function(child) {
				if( child.folder == self.name ) {
					delete child.folder;
					return false;
				}
				return true;
			});						
			self.folded = true;
		}
		this.fold_all = function(nodes) {nodes.forEach(function(n) { if(n.folded==false) fold(n)}) }		
		return this;
	}		
	function folder_node(name, fields) 
	{
		this.name = name+'.@container';
		this.type = "extra";
		this.caption = "...";
		this.value = 2;
		this.hidden = fields;
		this.folded = true;
		return this;
	}
	function rel_node( table_name, field_name, path ) {
		this.table = QE.model[table_name];
		this.field = QE.model[table_name][field_name];
		this.caption = this.field.caption;
		this.type = "relation";
		this.value = this.field.caption.length;
		this.path = path.concat([{forward:true, table: table_name, field: field_name}]);	
		this.wp = this.getWildPath();
		this.name = this.wp.putPath(this.wp.getPath());
		this.node_map[this.name] = this;
		this.hidden = [];
		{
			var extra_fields = [];
			var rel_table = this.model[ this.field["target"] ];			
			for(var name in rel_table) {
				if(name == '$') continue;
				var fld = rel_table[name];
				if(!fld["target"]) {					
					(fld.visibility ? this.hidden : extra_fields).push( new field_node( this.field["target"], name, this.path ) );					
				}
			}
			if(extra_fields.length)
				this.hidden.push( new folder_node(this.name, extra_fields) );
		}
		this.folded = true;
		return this;
	}
	function field_node(table_name, field_name, path)
	{		
		this.table = QE.model[table_name];
		this.field = QE.model[table_name][field_name];
		this.caption = this.field.caption;
		this.type = "field";
		this.value = this.field.caption.length;
		this.path = path;	
		this.wp = this.getWildPath();
		this.name = this.wp.putPath(this.wp.getPath()+table_name+'.'+field_name);				
		this.node_map[this.name] = this;
		this.getFullCaption = function() {
			var caption = [];
			caption.push( this.caption );
			this.forward.map(function(p) { return p })
			/*
			function node_caption(path) {
				
				
				for(var i =1; i<path.length;++i) {
					caption.push( (path[i].field.recaption || path[i].field.caption).toLowerCase() );
				}
				var last =  path[ path.length - 1];
				caption.push( (last.table.$.recaption || last.table.$.caption).toLowerCase() );
				return caption.join(' ');
			}*/
		}
		this.getExpr = function( filter, args ) {
			clear( filter );
			var where = [];
			var ands = [];
			var fieldpath = this.wp.getPath();
			this.wp.args.forEach(function(d) { args.push(d) });
			var exprs = filter.map(function(cond) {
				if(!cond.OR) return this.getOpExpr(fieldpath+this.field, cond.op, cond.value, args);				
				return cond;
			})
			exprs.forEach(function(cond, i) {				
				if( cond.OR)					
					if(ands.length) { where.push( ands.join(' AND ') ); ands = [] }
				else					
					ands.push( cond )				
			})
			if(ands.length)
				where.push( ands.join(' AND ') );
			return this.wp.putPath('('+where.join(' OR ')+')');
		}
		return this;
	}
	function back_node(table_name, field_name, path) {
		this.table = QE.model[table_name];
		this.field = QE.model[table_name][field_name];
		this.caption = this.field.sicaption;
		this.type = "backrelation";
		this.value = this.field.caption.length;
		this.path = path.concat([{back:true, table:table_name, field: field_name}]);	
		this.wp = this.getWildPath();
		this.name = this.wp.putPath( this.wp.getPath() );
		this.node_map[this.name] = this;
		this.hidden = [];
		{
			var extra_fields = [];
			var back_table = this.model[ table_name ];			
			for(var name in back_table) {
				if(name == '$') continue;
				if(name == field_name) continue;
				var fld = back_table[name];
				if(fld["target"]) {
					(fld.visibility ? this.hidden : extra_fields).push( new rel_node( table_name, name, this.path ) );
				} else {
					(fld.visibility ? this.hidden : extra_fields).push( new field_node( table_name, name, this.path ) );
				}
			}
			if(extra_fields.length)
				this.hidden.push( new folder_node(this.name, extra_fields) );
		}
		this.folded = true;
		return this;
	}
	function multifield_node()
	{
		this.name;
		this.table;
		this.fields = [];
		this.forward = [];
		this.back = [];
		this.node_map[this.name] = this;
		this.getExpr = function() {
			
		}
		return this;
	}
	function folder(name, type, children) {
		this.name = '$$'+name;
		this.type = type;
		this.noarea = true;
		this.children = children;
		return this;
	}
	function pack_node(map, table, name, parent_node, hidden) {
		this.name = parent_node ? (parent_node.name+'.'+name) : (name);
		this.table = QE.model[table];
		this.field = QE.model[table][name];
		this.value = this.field && this.field.caption.length || 2;
		this.type = this.field ? (this.field["target"] ? "relation" : "field") : "extra";
		this.parent_node = parent_node || null;
		if(hidden) {
			this.folded = true;
			this.hidden = hidden;
		}
		map[this.name] = this;
		return this;
	}
	function Container(name, type, children) {
		this.name = '$$'+name;
		this.children = children || [];
		this.hidden = [];
		this.type = type;
		return this;
	}
	function pack2(model, table_name, relmap ) {
		var root = model[table_name];
		var base_hidden = [];
		var base_shown = [];
		var base_rels = [];
		for(var field_name in root) {
			if(field_name=='$') continue;
			var fld = root[field_name];
			if(fld["target"] && fld.visibility) {
				base_rels.push({table: table_name, field: field_name})
			} else {				
				(fld.visibility ? base_shown : base_hidden).push( new field_node(table_name, field_name, []) );
			}
		}
		base_shown.unshift(new folder_node(table_name, base_hidden) );
		
		function handlebacktable(table_name, path) {
			path = path || [];
			function backtrail( table_name, field_name, path, cont ) {
				var table = model[ table_name ];
				var node = new back_node( table_name, field_name, path);
				cont.push( node );
			}
			var subitems = relmap[table_name];
			var rez = 
			subitems.filter(function(rel) {			
				return model[rel.table][rel.field].sicaption !== ""
			}).map(function(rel) {
				var rels_shown = [];
				backtrail(rel.table, rel.field, path, rels_shown);
				return new folder(rel.table+'.'+rel.field, "backholder", rels_shown);
			})			
			return rez;
		}
		
		function forwardtrail( table_name, field_name, path, cont ) {
			var last = true;
			var rel = model[ table_name ][field_name];
			var target = model[rel["target"]];
			var node = new rel_node( table_name, field_name, path);
			cont.push( node );
			for(var name in target) {
				if(name=='$') continue;
				var fld = target[name];
				if(fld["target"] && fld.visibility) {
					forwardtrail( rel["target"], name, node.path, cont);
					last = false;
				}
			}
			if(last || true) {
				var backs = handlebacktable(rel["target"], node.path);
				backs.forEach(function(d) { cont.push(d) });
			}
		}
		base_shown = base_shown.concat(base_rels.map(function(rel) {
			var rels_shown = [];
			forwardtrail( rel.table, rel.field, [], rels_shown);
			return new folder(rel.table+'.'+rel.field, "relationholder", rels_shown);
		}));
		
		base_shown = base_shown.concat( handlebacktable( table_name ) )
		return new folder( "base", "base", base_shown);
	}
	function pack(model, table_name, relmap, nodemap ) {
		var root = model[table_name];
		var base = new Container("base", "base");
		var hidden_nodes = [];
		for(var field_name in root) {
			if(field_name=='$') continue;
			var fld = root[field_name];
			if(!fld["target"]) {
				var node = new pack_node(nodemap, table_name, field_name);
				if( !fld.visibility ) {
					hidden_nodes.push( node );
				} else {
					base.children.push( node );
				}
			}
		}
		base.children.unshift( new pack_node( nodemap, table_name, "", null, hidden_nodes ) );
		function rel_fields(parent_node, rel) {
			var fields = [];
			var rel_table = model[ rel["target"] ];
			var extra = [];
			for(var field_name in rel_table) {
				if(field_name == '$') continue;
				var fld = rel_table[field_name];
				if(!fld["target"]) {					
					(fld.visibility ? fields : extra).push( new pack_node( nodemap, rel["target"], field_name, parent_node ) );					
				}
			}
			if(extra.length)
				fields.push( new pack_node(nodemap, rel["target"], "", parent_node, extra) );
			
			return fields;
		}
		function pathtrail( table_name, parent_node, paths ) {
			var table = model[table_name];
			var rez = paths || []
			for(var field_name in table) {
				if(field_name=='$') continue;
				var fld = table[field_name];
				if(fld["target"] && fld.visibility) {
					var rel_node = new pack_node(nodemap, table_name, field_name, parent_node, [] );
					rel_node.hidden = rel_fields(rel_node, fld);
					var cont = paths || [];
					if(!paths) rez.push( cont );
					cont.push( rel_node );
					pathtrail( fld["target"], rel_node, cont );
				}
			}
			return rez;
		}		
		var subitems = relmap[table_name];
		for(var i=0;i<subitems.length;++i) {
			
		}
		var rels = pathtrail( table_name );
		for(var i=0;i<rels.length;++i) {
			var nearest = rels[i][0];
			base.children.push( new Container(nearest.name, "relationholder", rels[i]) );
			
		}
		return base;
	}
	function drawpack() {
		var drawmodel = QE.drawmodel;		
		var diameter = QE.params.pack.diameter;
		var color = d3.scale.category20c();
		
		var svg = QE.cont.append("div")
				.attr("class", "qe-svg")
			.append("svg")
				.attr("width", diameter)
				.attr("height", diameter);
		
		var gradients = drawgradients( svg.append("defs") );
		
		var pack = d3.layout.pack()
				.size([ diameter, diameter ])
				.padding(5)
				.sort(null)
		function fold_all(nodes, except) {
			for(var i=0;i<nodes.length;++i) {
				if(nodes[i].folded==false)
					fold(nodes[i])
			}
		}
		function unfold(n) {
			var root = n.parent;
			var source = n.hidden || root.hidden;
			for(var i=0;i<source.length;++i) {
				var child = source[i];
				child.folder = n.name;
				root.children.unshift( child );
			}
			n.folded = false;
		}
		function fold(n) {
			var root = n.parent;
			root.children = root.children.filter(function(child) {
				if( child.folder == n.name ) {
					delete child.folder;
					return false;
				}
				return true;
			});													
			n.folded = true;
		}
		function update() {
			// Update the nodes
			nodes = pack.nodes(drawmodel);
			
			var node = svg.selectAll(".qe-svg-node")
				.data(nodes, function(d) { return d.name });					

			// Enter any new nodes.
			var new_node = node.enter().append("g")
					.attr("class", "qe-svg-node")
					.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			new_node.append("circle")
					.attr("class", "qe-node-circle")
					.attr("r", 0)
					
			
			var C = Math.pow(2,0.5)/2;
				
			new_node					
				.append("foreignObject")
					.attr("class", "qe-nav-text")
					//.attr("requiredExtensions","http://www.w3.org/1999/xhtml")
				.append("xhtml:body")
					//.attr("xmlns","http://www.w3.org/1999/xhtml")
				.append("div")
				.append("span")
				.append("a")
					.on("click", function(d) {
						if(d.folded) {
							if(d.type!="extra")
								fold_all( nodes);	
							unfold(d);
							update();						
						} else if(d.type=="field") {
							var index = -1;
							var current = d3.selectAll(".qe-list-node[current]").each(function(d) {
									var i = +d3.select(this).attr("index");
									if(index<i) index = i;
								});						
							push_node( d, index>=0 ? index : undefined);
							update_listing();
						}
					})					
				
			// Exit any old nodes.				
			node.exit().remove();			
				
			//Update			
			node
					.attr("type", function(d) { return d.type })
					.attr("folded", function(d) { return d.folded==undefined ? null : d.folded  })
				
			node.transition()
					.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });					
						
			node.select(".qe-node-circle")
					.transition()
					.attr("r", function(d) { 
						return d.r 
					})
			
			node.select(".qe-nav-text")
					.style("display", function(d){ return d.noarea ? "none" : "block"})
					.attr("transform", function(d) { return "translate(" + -d.r + "," + -d.r + ")"; })
					.attr("width", function(d) { return 2*d.r } )
					.attr("height", function(d) { return 2*d.r })
				.select("body")
					.style("width", function(d) { return 2*d.r+'px' } )
					.style("height", function(d) { return 2*d.r+'px' })
					.style("border-radius", function(d) { return 2*d.r+'px' })
			
			node.select(".qe-nav-text a")
					.html(function(d) { return d.caption })
		}
		update();
		var xxx = {
			A:{ a1:{}, a2:{}, rel_ab:{target:'B', merge:"aaa" } },
			B:{ b1:{}, rel_bc:{target:'C', merge:"aaa" } },
			C:{ c1:{},c2:{},rel_cd:{target:'D', merge:"aaa" } },
			D:{ d1:{},d2:{},d3:{}},
			E:{ e1:{},e2:{},rel_ef:{target:'F', merge:"aaa" } },
			F:{ f1:{},rel_fb:{target:'B', merge:"aaa" } },
			G:{ g1:{},g2:{},g3:{},rel_gc:{target:'C', merge:"aaa" } },
			H:{ h1:{},rel_hb:{target:'B', merge:"aaa" } }
		}
	}
	function close() {
		d3.select(".qe-editor").attr("hidden", 1);
		d3.select(".qe-start-editor").attr("hidden", null);		
	}
	function start() {
		if(QE.started) {
			d3.select(".qe-editor").attr("hidden", null);
		} else {
			QE.params = window.qe_params;
			QE.params.pack = {};
			QE.params.list = {};
			QE.model = window.qe_model;
			
			var navigator_proto = new navigator_node(QE.model);
			field_node.prototype = navigator_proto;
			rel_node.prototype = navigator_proto;
			back_node.prototype = navigator_proto;
			folder_node.prototype = navigator_proto;
			multifield_node.prototype = navigator_proto;
				
			mergeRelations( QE.model );
			QE.relmap = buildRelMap( QE.model );				

			QE.drawmodel = pack2( QE.model, QE.params.root, QE.relmap );
			QE.nodemap = navigator_proto.node_map;
			QE.listing = parse_filter( QE.nodemap );
			mark_active(QE.listing, 0);
				
			QE.params.pack.diameter = 750;
			
			QE.cont = d3.select("body").insert("div", ":first-child")
					.attr("class", "qe-editor")
				.append("div")
					.attr("class", "qe-wrap")
			
			//Draw
			drawlisting();				
			drawpack();			
				
			QE.started = true;
		}
		d3.select(".qe-start-editor").attr("hidden", 1);
	}
	function initialize() {
		if(!window.d3) throw "QE needs d3 engine.";
		if(!window.qe_model) throw "QE needs defined qe_model.";
		if(!window.qe_params) throw "QE needs defined qe_params.";
		
		d3.select("body").insert("div", ":first-child")
				.attr("class", "qe-start-editor")
			.append("button")
				.attr("onclick","QE.start()")
	}
	return {
		setup: function() {
			if (window.addEventListener) window.addEventListener('load', QE.initialize, false );
			else if( window.attachEvent ) window.attachEvent('onload', QE.initialize );
		},
		start: start,
		initialize: initialize,
		apply: apply,
		close: close,
		getCMD : getCMD,
		setCMD : setCMD,
		merge : mergeRelations,
		buildrelmap : buildRelMap,
		getSelection: getSelection
	}
})();
QE.setup();
/*
SELECT * FROM enrf_contests WHERE 
	syrecordidw IN (SELECT a.enrel_taskw.enrel_taskw.enrel_contestw
		FROM enrf_expertises
		WHERE a.enrel_taskw.enf_last_datew IS NOT NULL
		AND a.enf_regw IS NOT NULL
		AND a.enf_got_moneyw IS NULL
		AND a.enrel_personw = XSESSION_SAS_PERSON()
		)
	ORDER BY enf_startw

SELECT * 
		, (SELECT COUNT(*) FROM enrf_taskers WHERE enrel_taskw = ext.enrel_taskw) + 1 AS membcount
		FROM enrf_stages WHERE enrel_checkw = '-K0000000000000000000000'
		AND enf_datew IS NOT NULL
		AND enf_last_datew IS NULL
		AND $a_access_stages
		ORDER BY enf_section_ratew, enf_ratew DESC, syrecordidw
		LIMIT ALL
*/