/*
Controls.MC(obj) - возвращает metacontrol привязанный к DOM Node, при необходимости восстанавливает объект из атрибутов meta

this.element - DOM node, в который проставляются атрибуты meta и который содержит в себе сам metacontrol. 
	По умолчанию это параметр create. Обычно задаётся внутри функции create.
this.create(element, meta) - должен создавать контрол относительно element с описанием meta
*/
var Controls = (function() {
	var controllers = {};
	function add(descr) {
		for(var c in descr) {
			var construct = descr[c];
			var parent = controllers[construct.parent] || {};
			controllers[c] = {};
			X.mixin(parent, controllers[c]);
			X.mixin(construct, controllers[c]);
			controllers[c].parent = parent;
		}
	}
	function prepare(cnt) 
	{
		[].map.call(cont.QSA('[mc]'),function(mc) { return mc.attributes })
		  .map(function(att) {
				return [].reduce.call(att,
					function(result, attribute) {						
						result[attribute.name]=attribute.value; 
						return result;
					})
		  });
	}
	function attributes(elem, attr) {
		for(var name in attr) { elem.setA(name, attr[name]) };
	}
	function getMeta(elem) {
		return [].reduce.call(elem.attributes,function(result, attr) {			
			result[attr.name]=attr.value; 
			return result;
		}, {});
	}
	function create(element, meta) {
		var setmeta = !meta;
		meta = meta || getMeta( element );	
		
		if(!controllers[meta.mc]) throw "Undefined control type: " + meta.mc;
		
		var mc = X.mixin( controllers[meta.mc], { meta: meta } );
		
		mc.create(element, meta);

		mc.element = mc.element || element;
		
		if(setmeta)
			attributes(mc.element, meta);
		
		mc.element.__mc__ = mc;

		return mc;
	}
	function restorecontrol(src) {
		if(src.__mc__) 
			return src.__mc__; 
		return create( src );
	}	
	return {
		prepare : prepare,
		create : create,
		add : add,
		attributes : attributes,
		meta : getMeta,
		MC : restorecontrol
	}
})();
Controls.add({ abstract : {
	clearError : function() { this.element.removeAttribute("error") },
	setError : function(type) { this.element.setA("error",type) },
	hasError : function() { return this.element.hasA("error") },
	getName : function(idx) {
		var names = this.meta.names.split(',');
		if(names.length>=idx) throw "Control hasnt got field name with index "+idx;
		return name[idx];
	},
	change : function() {
		this.clearError();
		
		this.checkCorrect && this.checkCorrect();
		if(this.hasError()) return;
		
		this.onChange && this.onChange();
		
		this.checkRestrict && this.checkRestrict();
		if(this.hasError()) return;
	},
	setValue : function(dbV) {
		var ctrlV = this.makeCtrlValue ? this.makeCtrlValue(dbV) : dbV;
		this.element.setA('t', JSON.stringify(ctrlV) );
		dbV = this.makeDbValue ? this.makeDbValue(dbV) : dbV;
		this.element.setA('v', JSON.stringify(dbV) );
		this.onSetValue && this.onSetValue(dbV, ctrlV);
		return this;
	},
	getValue : function() {
		return this.element.hasA('v') ? JSON.parse(this.element.A('v')) : "";
	},
	create : function() {}
}});

Controls.add({ DATE : {
	parent:"abstract",
	makeDbValue : function(date) {
		return date.formatDate( this.meta.fmt )
	},
	makeCtrlValue : function(date) {
		return date.formatDate( "DMY" )
	},
	onSetValue : function(dbV, ctrlV) {
		this.element.setV( ctrlV );
	},
	checkCorrect : function() {
		var d = Date.smartParse(this.element.V(), true);
		if(d.y==null || d.m==null || d.d==null)
			return this.setError("incorrect")
		var dd = new Date(d.y,d.m-1,d.d)
		if( d.y!=dd.getFullYear() || (d.m-1)!=dd.getMonth() || d.d!=dd.getDate())
			return this.setError("incorrect")
	},
	checkRestrict : function() {
		var d = Date.smartParse( this.element.V() );
		if(d < new Date()) 
			this.setError("restrict")
	},
	onChange : function() {
		this.setValue( Date.smartParse(this.element.V()) );
	},
	show : function() {
		var self = this;
		var cont = this.element.attrUpward("calendcont")
		var input = this.element;
		var border = { min: input.evalHere("@vmin"), max: input.evalHere("@vmax") };
		var date =  Date.smartParse( this.getValue() );
		var calendar = new Calendar.element(cont, input, date,
			function() {
				this
				.A("quick-close", "Y")
				.A("active", 1)
				.N().showXModal().done(function(v) {
					if(v) {
						self.setValue(v).change();					
						//input.setV( todate(v).formatDate( self.meta.fmt ) );
						//input.callchange();
					}
					d2.S(cont).S(".calendarcover").R();
					delete calendar;
				});
				//self.clearError(input);
			},
			function(d) {
				this.N().closeModal( d );
			},
			border
		);
		if(border.max && border.min && (border.max.getFullYear()-border.min.getFullYear()) <= 5 ) {
			if((border.max.getFullYear()-border.min.getFullYear()) < 1 && (border.max.getMonth()-border.min.getMonth()) <6 )
				calendar.draw("day")
			else
				calendar.draw("month")
		}
		else
			calendar.draw("year")
	},
	create : function(element, meta) {
		d2.S(element).A("style","display:none");
		
		var cont = d2.S(element.parentNode).IN("div", function() { return element.nextElementSibling })
			.A("calendcont", 1)
			.A("style","white-space:nowrap;margin:0")
			/*@cc_on .A("IE8", 1)@*/
		
		this.element = cont.AP("input")
			.A("type","text")
			.A("onchange","Controls.MC(this).change()")
			.N();
		
		var button = cont.AP("button")
			.A("type", "button")
			.A("class", "calendbutton")
			.A("onclick", "Controls.MC(this.previousElementSibling).show()");
			
		this.parent.create.apply(this, arguments);
	}
}});
var Calendar = (function() {
	function ymd(d) { return d ? { y:d.getFullYear(), m:d.getMonth(), d:d.getDate() } : {} }
	function todate(d) { return new Date(d.y, d.m ? d.m : 0, d.d ? d.d : 1) }
	function LAST(ar) { return ar[ar.length - 1] }
	function FIRST(ar) { return ar[0] }
	function calendarElement(cont, input, D, onOpen, onClose, border) {
		var self = this;
		self.D = ymd(D);
		self.IN = input;
		self.border = border;
		self.CAL = d2.S(cont)
			.AP("div")
				.A("class","calendarcover")
			.AP("div")
				.A("class", "calendar");
		
		self.clickDate = function(d) {
			var zoom = self.CAL.A("zoom");
			self.makeChoose( d, zoom );
			var nextzoom = { day: null, month: "day", year: "month" }[zoom];
			if(nextzoom) 
				X.defer().done( function() { self.draw( nextzoom ) } )
			else
				onClose.call( self.CAL, todate(self.D) );
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
			self.D = {
				day: function(d) { return ymd(d) },
				month: function(d) { return { y: d.getFullYear(), m: d.getMonth(), d: self.D.d } },
				year: function(d) { return { y: d.getFullYear(), m: self.D.m, d: self.D.d } }
			}[zoom](d);
		}
		function outofborders(d, border, zoom)
		{
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
		function inborder(d,min,max) 
		{
			if(min && min>d) return ymd(min);
			if(max && max<d) return ymd(max);
			return ymd(d);
		}
		self.draw = function(zoom, date)
		{
			date = date || (inborder(empty(self.D) ? today() : todate(self.D), self.border.min, self.border.max) );
			var calend = self.CAL;
			var time = { year: buildCentury, month: buildYear, day: buildMonth }[zoom]( todate(date) );

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
					{	day: d.getFullYear()==date.y && d.getMonth()==date.m,
						month: d.getFullYear()==date.y,
						year: d.getFullYear()>(date.y-6) && d.getFullYear()<(date.y+3)
					}[zoom])
						return 1;
				})
				.A("choosen", function(d) {
					var ch = self.D;
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
						todaycontrol = calend.S( gte( todate(date), today() ) ? "[afterfirstelem]" : "[prelastelem]")
					todaycontrol.AP("span")
						.A("class","todaycontrol")
						.CK(function(e) {
							self.makeChoose(today(), "day");
							X.defer().done( function() { self.draw("day") } );
							if(!calend.S("[afterfirstelem] .todaycontrol, [prelastelem] .todaycontrol").E())
								stopPropagation(d2.event);
						})
					.AP("span").T("сег")
				}				
			}			
			function goUpDown(godate, place, attr) {
				var max = self.border.max && ymd(self.border.max);
				var min = self.border.min && ymd(self.border.min);
				if({
					year: max && (godate.y+8-16)>max.y || min && (godate.y+5)<min.y,
					month: max && todate({y:godate.y, m:0})>todate(max) || min && todate({y:godate.y, m:11})<todate(min),
					day: max && todate({y:godate.y, m:godate.m, d:1})>todate(max) || min && todate({y:godate.y, m:godate.m+1, d:-1})<todate(min),
				}[zoom]) return;
				calend.S(place).AP("span")
					.A("class", attr)
					.CK(function(e) {
						X.defer().done( function() { self.draw( zoom, godate ) });
						stopPropagation(d2.event);
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
				day: { y: date.y, m: date.m - 1, d: 15 },
				month: { y: date.y - 1, m: 5 },
				year: { y: date.y - 14 }
			}[zoom]));
			var down_date = ymd(todate({
				day: { y: date.y, m: date.m + 1, d: 15 },
				month: { y: date.y + 1, m: 5 },
				year: { y: date.y + 14 }
			}[zoom]));
			goUpDown(up_date, "[firstelem]", "uparrow");
			goUpDown(down_date, "[lastelem]", "downarrow");
			
			var choose = calend.SA("[choosen], .year[today],.month[today]").AP("span")
				.A("class", "circle");


			if(zoom==="day") {
				calend.AP("span")
					.A("class","monthname")
				.SA(".letter")
					.J(breakLetters( month_names[date.m] ))
				.AP("span")
					.A("class","letter")
					.A("first",function(d,i) { if(i==0) return month_names[date.m].length })
					.T(function(d) { return d })
			}
			if(zoom==="day" || zoom==="month") {
				calend.AP("span")
					.A("class","yearname")
				.SA(".letter")
					.J(breakLetters( date.y+"" ))
				.AP("span")
					.A("class","letter")
					.A("first",function(d,i) { if(i==0) return 1 })
					.T(function(d) { return d })
			}
			calend.N().refreshDisplay();
		}
		onOpen.call( self.CAL );
		return self;
	}
	return {
		element : calendarElement,
		prepare : function(input, fmt) {
			var cont = d2.S(input.parentNode).IN("div", function() { return input.nextSibling })
				.A("calendcont", 1)
				.A("fmt", fmt || '')
				/*@cc_on .A("IE8", 1)@*/
			
			var button = cont.AP("button")
				.A("type", "button")
				.A("class", "calendbutton")
				.A("onclick", "Calendar.show(this)");
		},
		show: function(o) {
			var cont = o.attrUpward("calendcont")
			var input = cont.previousElementSibling;
			var border = { min: input.evalHere("@vmin"), max: input.evalHere("@vmax") };
			var calendar = new calendarElement(cont, input, Date.smartParse( input.value ),
				function() {
					this
					.A("quick-close", "Y")
					.A("active", 1)
					.N().showXModal().done(function(v) {
						if(v) {
							input.setV( todate(v).formatDate( d2.S(cont).A("fmt") ) );
							input.callchange();
						}
						d2.S(cont).S(".calendarcover").R();
						delete calendar;
					});
					clearError(input);
				},
				function(d) {
					this.N().closeModal( d );
				},
				border
			);
			if(border.max && border.min && (border.max.getFullYear()-border.min.getFullYear()) <= 5 ) {
				if((border.max.getFullYear()-border.min.getFullYear()) < 1 && (border.max.getMonth()-border.min.getMonth()) <6 )
					calendar.draw("day")
				else
					calendar.draw("month")
			}
			else
				calendar.draw("year")
		}
	}
})();