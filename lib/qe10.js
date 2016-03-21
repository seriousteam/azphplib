/*
--http://213.208.189.135/sys/rc/templates/free/common/qetest.html
--http://213.208.189.135/ais/rsf/templates/qetest.php
http://213.208.189.135/az/lib/qetest.html
http://89.108.88.170:22222/az/lib/qetest.html
http://az.dev/az/lib/qetest.html
*/
/*
http://az.dev/ais/rsf/templates/qetest.php?cmd=*WHERE%20a.enf_numberw%20is%20null%20AND%20a.enf_numberw%20is%20null%20AND%20a.enrel_applicantw.enf_academic_degreew%3D%3F%20OR%20a.enf_namew%3C%3E%3F%20AND%20a.enf_namew%3D%3F%20AND%20a.enrel_fin_organizationw.enrel_regionw%20not%20in%20(%3F%2C%3F%2C%3F)%20OR%20a.enrel_applicantw%20in%20(%3F%2C%3F%2C%3F%2C%3F%2C%3F%2C%3F%2C%3F%2C%3F%2C%3F%2C%3F%2C%3F%2C%3F%2C%3F%2C%3F%2C%3F)%20ORDER%20BY%20a.enrel_areaw.syrecordidw%20ASC&args[]=-d-r_ehkon__000000000000&args[]=555555555&args[]=555555&args[]=04&args[]=05&args[]=06&args[]=0--6W00JorrP3i8Xes2cLb00&args[]=0--Nm00JpIt13i8Wvl2cLb00&args[]=0--PW00JpjAS3i8WYh2cLb00&args[]=0-0gm00JpmYd3i8WQq2cLb00&args[]=0-0gm00JpmYd3i8WQq2cLb00&args[]=0-1-G00JpJ4L3i8WRh2cLb00&args[]=0-0WG00JoSP23i8WZg2cLb00&args[]=0-0Jm00JoLgD3i8X1A2cLb00&args[]=0-0A000Jpq4c3i8Wzt2cLb00&args[]=0-0Jm00JoLgD3i8X1A2cLb00&args[]=0-0a000JpNND3i8XYk2cLb00&args[]=0-0a000JpNND3i8XYk2cLb00&args[]=0--j000JoIP43i8XeA2cLb00&args[]=0--PW00JpjAS3i8WYh2cLb00&args[]=0--6W00JorrP3i8Xes2cLb00
*/
var Controls = {
  selectinput : function(control) 
  {
    var len = control.V().length || 0;
    if(control.setSelectionRange)
    {
      control.focus();
      control.setSelectionRange(0,len);
    }
    else if (control.createTextRange) {
      var range = control.createTextRange();
      range.collapse(true);
      range.moveEnd('character', 0);
      range.moveStart('character', len);
      range.select();
    }
  },
  default : {
    default: {
      control : function(container, descr) {
        var self = this;
        var ctrl = d3.select(container).append("div").attr("mc-ctrl",descr.mc)

        var input = ctrl.append("input")
          .attr("mc-input","")
          .attr("value", function() { 
            return self.values && self.values.length && self.values[0].value || null
          })
          .on("change", function() {
            self.onchoose(self.createvalue(this.V()))
          })
          .node();
        Controls.selectinput(input);       
      },
      text : function(container, descr) {
        var self = this;
        var valcont = d3.select(container)
          .selectAll("[typer-value]")
          .data([{}]);
        var new_valcont = valcont
          .enter()
          .append("span")
            .attr("typer-value","")
        valcont.exit().remove();

        self.values && self.values.forEach(function(v) { 
          if(v.text==undefined) v.text = v.value
        })
        
        var values = self.values && self.values.length && self.values || [];

        var op = valcont
          .selectAll("[value-op]")
          .data([self.op])

        var new_op = op.enter()
          .append("span")
            .attr("value-op","")

        op.exit().remove();

        op
          .attr("value-op", function(o) {return o})
          .attr("mc", function(o) { return descr.mc } )
          .on("click",function(op) {
            d3.event.stopPropagation();
            self.drawOpsStage();
          })        
        
        var val = valcont
          .selectAll("[value-text]")
          .data(values);
        
        var new_val = val.enter()
          .append("span")
            .attr("value-text","")
          .append("a");

        new_val
          .append("span")
            .attr("text","")
        
        val.exit().remove();
        
        val.select("a [text]")
          .text(function(v) { return v.text })
          .on("click",function(op) {
            d3.event.stopPropagation();
            self.drawCtrlStage();
           })
      }
    }
  },
  DATE : {
    default : {
      control: function( container, descr ) {
        var self = this;
        var calendar = 
          new Calendar2.element(
          {
            container : container,
            date : self.values[0] && Date.smartParse(self.values[0].value)
          })
          .onchoose(function(d) {
            self.onchoose( self.createvalue( d.formatDate(), d.formatDate('DMY') ));
            this.hide();
          })
          .draw()
      },
      text : function( container, descr ) {
        var self = this;
        self.values && self.values.forEach(function(v) {
          v.text = Date.smartParse(v.value).formatDate('DMY');
        })
        Controls.default.default.text.call(self, container, descr);
      }
    }
  },
  BOOL : {
    default : {
      control : function( container, descr ) {
        var self = this;
        var ctrl = d3.select(container).append("div").attr("mc-ctrl",descr.mc)

        var boolval = ctrl
          .selectAll('[boolvalue]')
          .data([{ text:"да",value:"1" }, { text:"нет", value:"0" }])

        boolval.enter()
          .append("div")
          .attr("boolvalue","")

        boolval.exit().remove();

        boolval
          .text(function(d) { return d.text })
          .on("click", function(d) {
            self.onchoose(self.createvalue( d.value, d.text ))
          })
      },
      text : function(container, descr) {
        this.values && this.values.forEach(function(v) {
          v.text = {"1":"да","0":"нет"}[v.value.trim()];
        })
        Controls.default.default.text.call(this, container, descr );
      }
    }    
  },
  BOOL3 : {
    default : {
      control : function(container, descr) {
        Controls.BOOL.default.control.call(this, container, descr);
      },
      text : function(container, descr) {
        Controls.BOOL.default.text.call(this, container, descr);
      }
    }
  },
  array_text : function(container, descr) {
    var self = this;

    var valcont = d3.select(container)
      .selectAll("[typer-value]")
      .data([{}]);
    var new_valcont = valcont
      .enter()
      .append("span")
        .attr("typer-value","")
    valcont.exit().remove();    

    var op = valcont
      .selectAll("[value-op]")
      .data([self.op])

    var new_op = op.enter()
      .append("span")
        .attr("value-op","")

    op.exit().remove();

    op
      .attr("value-op", function(o) {return o})
      .on("click",function(op) {
        d3.event.stopPropagation();
        self.drawOpsStage();
      })
  },
  array_values : function(container) {
    var self = this;
    var val = d3.select(container).select("[typer-value]")
    .selectAll("[choosen-text]")
    .data(self.values.filter(function(v) { return v.text==undefined  }).length ? 
      [{}] : self.values);
  
    var new_val = val.enter()
      .append("span")
        .attr("choosen-text","")
      .append("a")

    new_val
      .append("span")
        .attr("delete","")

    new_val
      .append("span")
        .attr("text","")
    
    val.exit().remove();
    
    val.select("a")
      .attr("loading",function(v) { return v.text==undefined || null })

    val.select("a [delete]")
      .on("click",function(val,i) {
        d3.event.stopPropagation();
        self.values.splice(i,1);
        self.drawInitStage();
      })         

    val.select("a [text]")
      .text(function(v) {  return v.text })            
      .on("click",function(op) {
        d3.event.stopPropagation();
        self.drawCtrlStage();
       })    
  },
  DL : {
    "relation in" : {
      control : function( container, descr ) { 
        var self = this;    
        var ctrl = d3.select(container)
        .append("div")
          .attr("mc-ctrl",descr.mc)
          .attr("modal", "")
          .attr("ref-src", eval(descr.rel_target))
          .attr("multi", "")
          .node();        
              
        var makechoose = function(ret) {
          if(arguments.length) {
            self.onchoose( 
              self.createvalue([ ret.A("value") ], ret.A("rt")));  
          }       
          ctrl.defer = X.new_defer();
          ctrl.defer.promice.done(makechoose);          
        }
        makechoose();     
        reloadElement(ctrl).done(function(txt) { /*patchMenuItems(ctrl);*/ });
      },
      text : function( container, descr) {
        var self = this;
        Controls.array_text.call(this, container, descr);

        var refresh = self.values.filter(function(v) { return v.text==undefined  });
        if(refresh.length) {
          function setFilter(uri, command, args) {
            uri = clearURLArgs( uri );
            uri = uri.setURLParam('cmd', command.length ? ('*'+command) : '');
            for(var i = 0; i < args.length; ++i)
              uri += '&args[]=' + encodeURIComponent( args[i] );
            return uri;
          }
          var cmd = "WHERE "+refresh.map(function(v) {
            return v.pk.map(function(pk) { return pk.name+'=?' }).join(' AND ')
          }).join(' OR ');          
          var arguments = refresh.reduce(function(args, v) {
            v.pk.forEach(function(pk) { args.push(pk.value) })
            return args;
          }, [])
          var uri = QEUtils.setFilter(eval(descr.refresher), cmd, arguments);
          //uri = eval(descr.rel_target);
          X.XHR('GET', uri)
            .done(function(txt) {
              self.values = JSON.parse(txt);
              Controls.array_values.call(self, container); 
            });
        }
        Controls.array_values.call(self, container);    
      }
    },
    "relation not in" : {
      control : function(container, descr) { 
        Controls.DL["relation in"].control.call(this, container, descr) 
      },      
      text : function(container, descr) { 
        Controls.DL["relation in"].text.call(this,container, descr)
      }
    } 
  },
  MENU : {
    default : {
      control : function(container, descr) {
        var self = this;
        var ctrl = d3.select(container)
        .append("div")
          .attr("mc-ctrl",descr.mc)
          .attr("modal","")
          .attr("multi","")//for closeit
          .attr("ref-src", eval(descr.rel_target))
          .node();        
              
        var makechoose = function(ret) {
          if(arguments.length) {
            self.onchoose( 
              self.createvalue([ ret.A("value-patch") ], ret.V() ));  
          }       
          ctrl.defer = X.new_defer();
          ctrl.defer.promice.done(makechoose);          
        }
        makechoose();     
        reloadElement(ctrl).done(function(txt) {
          d3.select(ctrl)
            .selectAll("li")
              .attr("onclick","this.closeModal(this); return false")
        });            
      }
    },
    "in" : {
      text : function(container, descr) {
        var self = this;
        Controls.array_text.call(self, container, descr);
        var refresh = self.values.filter(function(v) { return v.text==undefined  });      
        if(refresh.length) {
          var uri = eval(descr.rel_target).setURLParam("js", 1);
          X.XHR('GET', uri)
            .done(function(txt) {
              var mv = JSON.parse(txt);
              refresh.map(function(d) { 
                for(var i=0;i<mv.length;++i) {
                  if(mv[i].value == d.value) {
                    d.text = mv[i].text;
                  }
                }                
              })
              Controls.array_values.call(self, container); 
            });
        }
        Controls.array_values.call(self, container);
      }
    },
    "not in" : {
      text : function(container, descr) {
        Controls.MENU["in"].text.call(this,container, descr);
      }      
    }    
  } 
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var QE10SQL = (function() {
  /* { where, order by, group by, limit, pager } */
  function prepare_brackets( s, ctx ) {
    var parts = [];
    var done;
    do {
      done = false;
      s = s.replace(/\(([^()]+)\)/ig, function( full, part ) {
        parts.push( part );
        done = true;
        return "/*"+(parts.length-1)+"*/";
      });
    } while(done);
  ctx.brmap = parts;
    return s
  }
  function prepare_arguments(s, ctx) {
    var i = 0;
    var parts = [];
    return s.replace(/(\?)/ig, function( full, part ) {
    parts.push( ctx.source.arguments()[i] );
    i++;
    return "?"+(parts.length-1);
    });
  }
  function brackets_back(s, ctx) {
    var brmap = ctx.brmap;
    var idx, re = /\/\*(\d+)\*\//ig;
    var strs;
    if(strs = s.match(re)) {
      for(var i=0;i<strs.length;++i) {
        var back = brmap[+strs[i].match(/\/\*(\d+)\*\//i)[1]];
        s = s.replace(strs[i], "("+back+")" );
      }
    }
    return s;
    if((idx = re.exec( str )) != null) {
      var back = brmap[+idx[1]];
      str = str.replace( re, '('+back+')' );
    }
    return str;
  }
  var Part = {   
      where : function(parent) {
        this.parent = parent;
        this.root = function() { return this.parent && this.root() || this }
        this.model = [];
        this.setpath = function(path) {
          this.path = new QE10SQL.Path().copy(path);
          return this;
        }
        this.parse = function(s) {
          var ORs = s && s.split( /\s+OR\s+/i ) || [];
          for(var i=0;i<ORs.length;++i) {
            ORs[i] = ORs[i].trim();
            var a = [];
            var ANDs = ORs[i].split(/\s+AND\s+/i );       
            for(var j=0;j<ANDs.length;++j) {
              a.push( parseOp(this, ANDs[j], this.path.ctx ) ) ;
            }
            this.model.push( a );
          }
          return this;
        }
        this.print = function(conditiononly) {
          var rez = this.model.map(function(d) {
            return d.map(function(chunk) {
              return chunk.print()
            }).join(' AND ');
          }).join(' OR ');
          return rez && (conditiononly?rez:("WHERE "+rez)) || "";
        }
        this.empty = function() {
          return !this.model.length
          /* || 
            this.model.reduce(function(empty, ors) { 
              if( empty && ors.length) empty = false;
              return empty;
            }, true);*/
        }
        this.preparesend = function() 
        {
          this.model.forEach(function(ors) {
            var i=0;
            while(i<ors.length) {
              if(ors[i].values && !ors[i].values.length )
                ors.splice(i,1);
              else
                i++
            }
            ors.forEach(function(op) {
              if(op.subquery)
                op.subquery.preparesend();
            })          
          })
          this.clear();
        }
        this.clear = function() {
          var i = 0;
          while(i<this.model.length) {
            if(!this.model[i].length)
              this.model.splice(i,1);
            else
              i++
          }
          this.model.forEach(function(ors) {
            ors.forEach(function(op) {
              if(op.subquery)
                op.subquery.clear();
            })
          })
        }
        this.remove = function(todel) {
          this.model.forEach(function(ors) {
            var idx = ors.indexOf(todel)
            if(idx != -1) 
              ors.splice(idx,1)
            else
              ors.forEach(function(op) {
                if(op.subquery)
                  op.subquery.remove(todel);
              })            
          })
          this.clear();
        }
        this.clearactive = function() {
          delete this.model.active;
        }
        this.replace = function(whatop,withop) {
          this.model.forEach(function(ors) {
            var idx = ors.indexOf(whatop)
            if(idx != -1) 
              ors.splice(idx,1,withop)
            else
              ors.forEach(function(op) {
                if(op.subquery)
                  op.subquery.replace(whatop,withop);
              })
          })
        }
        this.arguments = function(args) {
          args = args || [];
          this.model.forEach(function(ors) {
            ors.forEach(function(op) {
              op.values && op.values.forEach(function(v) {
                if(v.pk) {
                  v.pk.forEach(function(pk) { args.push(pk.value) })
                } else
                  args.push(v.value) 
              })
              op.subquery && op.subquery.arguments( args )
            })
          })
          return args;
        }
      },
      orderby : function() 
      {
        this.model = [];
        this.setpath = function(path) {
          this.path = new QE10SQL.Path().copy(path);
          return this;
        }
        this.parse = function(s) {
          var self = this;
          s = s.split(/\s*,\s*/i);
          for(var i=0;i<s.length;++i) {
            this.model.push( new Sort(self).parse(s[i]) )
          }          
          return this;
        }
        this.print = function() { 
          return this.model.length && 
          ("ORDER BY "+
            this.model.map(function(d) { 
              return d.print() 
            }).join(", ")) || "" 
        }
        this.remove = function(todel) {
          var idx = this.model.indexOf(todel)
          if(idx != -1) 
            this.model.splice(idx,1)         
        }
        this.empty = function() {
          return !this.model.length;
        }
        this.preparesend = function() {

        }
      },
      groupby : function()
      {
        this.setpath = function(path) {
          this.path = new QE10SQL.Path().copy(path);
          return this;
        }
        this.parse = function(s) {          
          s = s.split(/\s*,\s*/i);
          this.fields = s.map(function(sort) {
            sort = sort.match(/^\s*([a-zA-Z0-9_.]+)\s*$/i);
            return { field: sort[1], toString: function() { return this.field }}
          })
          return this;
        }
        this.print = function() { 
          return this.fields && this.fields.length && ("GROUP BY "+this.fields.join(", ")) || "" 
        }
        this.empty = function() {
          return true;
        }
        this.preparesend = function() {

        }
      },
      limit : function()
      {
        this.setpath = function(path) {
          this.path = new QE10SQL.Path().copy(path);
          return this;
        }
        this.parse = function(s) {
          
        }
        this.print = function() {
          return "";
        }
        this.empty = function() {
          return true;
        }
        this.preparesend = function() {

        }
      },
      pager : function()
      {
        this.setpath = function(path) {
          this.path = new QE10SQL.Path().copy(path);
          return this;
        }
        this.parse = function(s) {
          
        }
        this.print = function() {
          return "";
        }
        this.empty = function() {
          return true;
        }
        this.preparesend = function() {

        }
      }
    }
    var Service = {
      join : {
        parse : function(str) {
           var re = /^\s*([a-zA-Z_0-9.]+)\.join\.?([a-zA-Z_0-9.]*)\s*$/i
           str = str.match(re);
          return {
            field: str[1],
            path: str[2]
          }
        },
        print : function(field, path) {
          return field+".join"+(path.length ? (".ext."+path.join('.')) : "")
        }
      },
      parameter : {
        parse : function(str,path) {
          str = brackets_back(str, path.ctx);
          str = str.match(/^\/\*\P\*\/\(([^()]+)\)/i);
          return (new Part.where()).setpath(path).parse(str[1])
        },
        print : function(where) {
          return "/*P*/("+where.print("conditiononly")+")";
        }
      }
    }
    var Sort = function(parent) {

      this.parent = parent;
      this.op = "asc";
      this.print = function() {
        return this.core.print()+' '+this.op.toUpperCase();
      }
      this.parse = function(s) {
        s = s.match(/^\s*([^ ]+)\s+(ASC|DESC)\s*$/i);
        this.setcore( new QE10SQL.Core.field(this.parent.path).parse(s[1]) );
        this.op = s[2].toLowerCase();
        return this;
      }
      this.setcore = function(core) {
        this.core = core;
        return this;
      }
      this.isasc = function() { return this.op=="asc" }
      this.toggle = function() {
        if(this.isasc()) 
          this.op = "desc"
        else
          this.op = "asc"
      }
      this.caption = function() {
        function pathcaption(path) {
          return path.map(function(p) { 
            return p.field.recaption || ('*'+p.field.$.name)
          }).join(' ').toLowerCase();
        }
        var path = this.core.path.last().nodes().reverse();
        return ((path[0].field.recaption || ('*'+path[0].field.$.name)) 
          + ' ' + pathcaption(path.slice(1)))
          .toLowerCase()
          .replace(/^\s+/,'')
          .replace(/\s+$/,'');
      }
      return this
    }


    var Operation = {

      empty : function(parent) 
      {
        this.parent = parent;
        this.is = function(s) { return false }
        this.values = [];
      },
      contains : function(parent)
      {
        this.parent = parent;
        this.values = [];
        this.is = function(s) {
          return s.match(/^\s*UPPER\/\*\d+\*\/ LIKE UPPER\/\*\d+\*\/\s*$/i);
        }
        this.print = function() {
          return "UPPER("+this.core.print()+") LIKE UPPER('%'||?||'%')";
        }
        this.parse = function(s) {
          s = brackets_back(s, this.parent.path.ctx);
          s = s.match(/^\s*UPPER\((.+)\)\s+LIKE\s+UPPER\('%'\|\|\?(\d+)\|\|'%'\)\s*$/i);
          this.setcore( new QE10SQL.Core.field(this.parent.path).parse(s[1]) );
          this.values = [ this.createvalue(this.parent.path.ctx.source.arguments()[+s[2]]) ];
          return this;
        }
      },
      //TODO:between
      begins : function(parent) {
        this.re = /^\s*(.+)\s+LIKE\s\?(\d+)\|\|'%'\s*$/i;
        this.parent = parent;
        this.values = [];
        this.is = function(s) {
          return s.match(this.re);
        }
        this.print = function() {
          return this.core.print()+" LIKE ?||'%'";
        }
        this.parse = function(s) {
          s = s.match(this.re);
          this.setcore( new QE10SQL.Core.field(this.parent.path).parse(s[1]) );
          this.values = [ this.createvalue( this.parent.path.ctx.source.arguments()[+s[2]]) ];
          return this;
        }
      },
      'in' : function(parent) {
        this.parent = parent;
        this.re = /^\s*([^ ]+)\s+IN\s*(\/\*\d+\*\/)\s*$/i;
        this.values = [];
        this.proto = 'set';
        this.tag = "IN";        
      },
      'not in' : function(parent) {
        this.parent = parent;
        this.re = /^\s*([^ ]+)\s+NOT\s+IN\s*(\/\*\d+\*\/)\s*$/i;
        this.values = [];
        this.proto = 'set';
        this.tag = "NOT IN";        
      },
      'relation in' : function(parent) {
        this.re = /^\s*\/\*RI\*\/(\/\*\d+\*\/)\s*$/i;
        this.parent = parent;
        this.values = [];
        this.proto = 'relation';
        this.tag = '/*RI*/';
        this.operator = '=?';
      },
      'relation not in' : function(parent) {
        this.re = /^\s*\/\*RI\*\/NOT(\/\*\d+\*\/)\s*$/i;
        this.parent = parent;
        this.values = [];
        this.proto = 'relation';
        this.tag = '/*RI*/NOT';
        this.operator = '=?';
      },
      'relation is null' : function(parent) {
        this.re = /^\s*\/\*RN\*\/(\/\*\d+\*\/)\s*$/i;
        this.parent = parent;
        this.proto = 'relation';
        this.tag = '/*RN*/';
        this.operator = ' is null';
      },
      'relation is not null' : function(parent) {
        this.re = /^\s*\/\*RN\*\/NOT(\/\*\d+\*\/)\s*$/i;
        this.parent = parent;
        this.proto = 'relation';
        this.tag = '/*RN*/NOT';
        this.operator = ' is null';
      },
      'is null' : function(parent) {
        this.re = /^\s*(.+?)\s+IS NULL\s*$/i;
        this.parent = parent;
        this.proto = 'nulls';
      },
      'is not null' : function(parent) {
        this.re = /^\s*(.+?)\s+IS NOT NULL\s*$/i;
        this.parent = parent;
        this.proto = 'nulls';
      },
      '<>' : function(parent) {
        this.parent = parent;
        this.re = /^\s*([^><=]+?)\s*<>\s*\?(\d+)\s*$/i;
        this.values = [];
        this.proto = 'ordinary';
      },
      '=' : function(parent) {
        this.parent = parent;
        this.re = /^\s*([^><=]+?)\s*=\s*\?(\d+)\s*$/i;
        this.values = [];
        this.proto = 'ordinary';
      },
      '>=' : function(parent) {
        this.parent = parent;
        this.re = /^\s*([^><=]+?)\s*>=\s*\?(\d+)\s*$/i;
        this.op = '>=';
        this.values = [];
        this.proto = 'ordinary';
      },
      '<=' : function(parent) {
        this.parent = parent;
        this.re = /^\s*([^><=]+?)\s*<=\s*\?(\d+)\s*$/i;
        this.values = [];
        this.proto = 'ordinary';
      },
      '>' : function(parent) {
        this.parent = parent;
        this.re = /^\s*([^><=]+?)\s*>\s*\?(\d+)\s*$/i;
        this.values = [];
        this.proto = 'ordinary';
      },
      '<' : function(parent) {
        this.parent = parent;
        this.re = /^\s*([^><=]+?)\s*<\s*\?(\d+)\s*$/i;
        this.values = [];
        this.proto = 'ordinary';
      },       
      subquery : function(parent) {
        this.parent = parent;
        this.subquery = new Part.where(parent);
        this.is = function(s) {
          return s.match(/^\s*\/\*S\*\/EXISTS/i);
        }
        this.print = function() {
          var path = this.core.path.last().nodes();
          var back = path.pop();
          path = path.map(function(d) { return d.field.$.name })
          if(path.length) 
            path.unshift("ext")
          path = ["a",back.field.$.name,"join"].concat(path)
          var conds = [ path.join('.') ];
          if(!this.empty()) 
            conds.push('('+this.subquery.print("conditiononly")+')') 
          return "/*S*/EXISTS(SELECT 1 FROM "+back.table.$.name+" WHERE "+conds.join(' AND ')+")";
        }   
        this.parse = function(s) {
          s = brackets_back(s, this.parent.path.ctx);
          s = s.match(/^\s*\/\*S\*\/EXISTS\(SELECT 1 FROM ([a-zA-Z_0-9]+) WHERE ([^()]+)\)\s*$/i);
          var table_name = s[1]
          var parts = s[2].split(/\s+AND\s+/i);
          var join = Service.join.parse(parts[0]);
          this.setcore(
            new QE10SQL.Core.subtable(this.parent.path).parse(join.path, table_name, join.field)
            )       
          var where = parts[1] && brackets_back(parts[1], this.parent.path.ctx).match(/\(([^()]+)\)/);
          this.subquery.parse(where && where[1]);
          return this;
        }      
        this.which = true;      
        this.setcore = function(core) {
          this.core = core;
          this.subquery.setpath( core.path );
          return this;
        }
        this.path = function() { return this.core.path }
        this.empty = function() {
          return this.subquery.empty()
        }
      }
  };
  var opProto = {
    relation : {
      is : function(s) {
        return s.match(this.re);
      },
      print : function() {
        var self = this, cond;
        var core = self.core.print();
        if(this.operator=="=?") {
          cond = this.values.map(function(val) {
            return val.pk.map(function(pk,i) {
              return  core + "." + pk.name + self.operator
            }).join(' AND ')
          }).join(' OR ');
        } else if(this.operator==" is null") {
          cond = this.core.key().map(function(pk,i) {
              return pk+self.operator
            }).join(' AND ')          
        }                
        return this.tag+'('+cond+')';        
      },
      createvalue : function(keys, text) {
        var pks = this.core.pk();
        keys = keys.map(function(pk,i) {
          if(X.isObject(pk)) {
            if(pks[i] != pk.name)
              console.log("Error! Wrong pk name in relation.")
            return pk;
          } else {
            return { name : pks[i], value : pk }
          }
        })
        return { text : text, pk : keys }
      },
      parse : function(s) {
        var self = this;
        s = s.match(this.re);
        s = brackets_back(s[1], this.parent.path.ctx);
        //values = [ [ {path,name:pk1,value},{path,name:pk2,value} ], [...], [...]]
        var values = s.replace(/(^\(|\)$)/g,'')
          .split(/\s+OR\s+/ig)
          .map(function(x) { return x.split(/\s+AND\s+/ig) })
          .map(function(pks) {
            return pks.map(function(pk) {
              pk = pk.match({
                "=?":/^(.*)\.([^.]+)=\?(\d+)$/,
                " is null":/^(.*)\.([^.]+)\s+is\s+null\s*$/i
              }[self.operator]);
              return { 
                path: pk[1], 
                name : pk[2], 
                value: pk[3] && self.parent.path.ctx.source.arguments()[+pk[3].trim()] 
              }
            })
          });
        this.setcore(
            new QE10SQL.Core.relation(this.parent.path).parse(values[0][0].path)
            )
        /*checks*/
        var key = this.core.key();
        values.forEach(function(val) {
          val.forEach(function(pk,i) {
            if(pk.path+'.'+pk.name != key[i])
               console.log("Error! Wrong relation pk:"+(pk.path+'.'+pk.name) +' differs from '+ key[i]);
          })
        }) 
        /*checks end*/
        this.values = {
          "=?" : values.map(function(val) {
                  return self.createvalue( val.map(function(pk) { return pk.value }) )                  
                }),
          " is null" : undefined
        }[ self.operator ]   
        return this;
      }
    },
    set : {
      is : function(s) {
        return s.match(this.re);
      },
      print : function() {
        return this.core.print()+' '+this.tag+' ('+this.values.map(function() { return '?'} ).join(',')+')'
      },
      parse : function(s) {
        var self = this;
        s = s.match(this.re);
        this.setcore( new QE10SQL.Core.field(this.parent.path).parse(s[1]) );
        this.values = 
        brackets_back(s[2], this.parent.path.ctx)
          .replace(/(^\(|\)$)/g,'')
          .replace(/\?(\d+)/g,'$1')
          .split(/\s*,\s*/)
          .map(function(v) { 
            return self.createvalue( self.parent.path.ctx.source.arguments()[+v]) 
          })
        return this;
      }
    },
    ordinary : {
      is : function(s) {
        return s.match(this.re);
      },
      print : function() {
        return this.core.print() + this.op + "?";
      },
      parse : function(s) {
        s = s.match(this.re);
        this.setcore( new QE10SQL.Core.field(this.parent.path).parse(s[1]) );
        this.values = [ { value: this.parent.path.ctx.source.arguments()[+s[2]] } ];       
        return this;
      }
    },
    nulls : {
      is : function(s) {
        return s.match(this.re);
      },
      print : function() {
        return this.core.print() + ' '+this.op;
      },
      parse : function(s) {
        s = s.match(this.re);
        this.setcore( new QE10SQL.Core.field(this.parent.path).parse(s[1]) );        
        return this;
      }
    }
  }
  var opExtension = {
    setcore : function(core) {
      this.core = core;
      return this;
    },
    copy : function(op) {
      this.parent = op.parent;
      this.core = op.core;
      this.controller = op.controller;
      return this;
    },
    path : function() { return this.core.path },
    caption : function() { return this.core.caption() },
    addvalue : function(val) {
      this.values.push(val);
    },
    setvalue : function(val,i) {
      if(i==undefined)
        this.values = [val];
      else
        this.values.splice(i,1,val)
    },
    removevalue : function(i) {
      this.values.splice(i,1);
    },
    createvalue : function(value, text) {
      return { text: text, value: value }
    }
  }
  for(var f in Operation) {
    X.mixin(opExtension, Operation[f].prototype);
    if( x = new Operation[f]().proto) {
      X.mixin(opProto[x], Operation[f].prototype);
    }
    Operation[f].prototype.op = f;
  }
  /*
    delegation.applicant.<organizations.<representatives.city
    1)Руководитель делегации имеет организацию, которая имеет представительство, у которого город: Москва
    2)У руководителя делегации имеется организация, которая имеет представительство в городе: Москва
    3)Руководитель делегации [имеет] организации, [у которых] [име](ются) представительства, у которых город: Москва
    
    applicant.<tasks.<participants.(birthdate,city)
    1)Руководитель имеет хотя бы одну заявку, у которой есть хотя бы один участник, день рождения которого: 25/01/1984 и город которого: Москва
    3)Руководитель [имеет] заявки, [у которых имеются] участники, у которых день рождения 25.01.1984 и город: Москва
    4)[У] руководителя [есть] заявки, у которых имеются участники, у которых день рождения: 25.01.1984 и город: Москва
    5)У руководителя есть заявки, у которых есть участники, у которых 
    
    (applicant.<tasks.(<participants.(birthdate,city),type;status))
    3)Руководитель имеет [заявки], [у которых имеются|у которых ... имеет] [участники|участников], у которых день рождения: 25.01.1984 и город: Москва, и тип: закрыто или статус: заполнено
    
    (univercity.depart.head.<dissertations).(organization.<staff).location
    3)Глава департамента организации имеет диссертации, у которых утверждающая организация имеет сотрудников, у которых расположение: Москва
    4)У главы департамента организации есть диссертации, [у которых] утверждающая организация [имеет] сотрудников, у которых расположение: Москва
    5)У главы департамента университета которых есть диссертации, [у] утверждающей организации [которых есть сотрудники], у которых расположение: Москва
    
    Выбираем форму:
    У [связь] которых есть [имя таблицы - м.ч.], у [связь] которых есть [имя таблицы - м.ч.], у которых [поле-операция] и [поле-операция] или [поле-операция]
    */

  //ENTRY POINTS
  function parseOp(parent, s, ctx) {
    for(var name in Operation) {
      var obj = new Operation[name](parent);
      if(obj.is(s)) 
        return obj.parse(s)
    }
    console.log("Unknown operation:");
    console.log(s);
  }    
  

  function printSQL( model )
  {
    var sql = [];
    for(var part in model) {
      model[part].preparesend(); 
      sql.push(model[part].print())
    }
    return sql.join(' ').trim();
  }
  function printArguments( model )
  {
    return model["WHERE"].arguments()
  }
  function parseSQL( sql, ctx )
  {
    var sqlmodel = {
      "WHERE" : new Part.where(),
      "ORDER BY" : new Part.orderby(),
      "GROUP BY" : new Part.groupby(),
      "LIMIT" : new Part.limit(),
      "PAGER" : new Part.pager()
    }
    for(var i in sqlmodel) { sqlmodel[i].setpath(new QE10SQL.Core.table(ctx).parse(ctx.root).path) }
    sql = prepare_brackets(prepare_arguments(sql, ctx), ctx);
    var sqlparts = sql.split(/\b(WHERE|ORDER BY|GROUP BY|LIMIT|PAGER)\b/ig);
    for(var i=0;i<sqlparts.length;++i) {
      sqlparts[i] = sqlparts[i].trim();
      if(sqlparts[i].length) {
        var partname = sqlparts[i].trim().toUpperCase();
        var str = (sqlparts[i+1] || "").trim();
        sqlmodel[ partname ]          
          .parse(str);
        i++;
      }
    }
    return sqlmodel;
  }
  function testCircuit()
  {
        var tests = [
          "WHERE a.field_name=?",
          "WHERE a.field_name<>? or a.rel.rel.rel.field_name=? and a.rel_name>=?",
          "ORDER BY a.rel1.field asc",
          "ORDER BY a.rel1.field asc, a.field_name desc, a.rel.field_name asc",
          "GROUP BY a.field_name",
          "GROUP BY a.field_name, b.rel.rel.field_name",
          "WHERE /*S*/EXISTS(SELECT 1 FROM T0 WHERE a.rel.join and (a.zz<>?)) ORDER BY a.yy.yy.yy asc GROUP BY a.xx.xx.xx ",
          "WHERE a.rel1.rel2.field<>? or /*RN*/NOT(a.rel1.field is null and a.rel1.field_name is null) or /*RI*/(a.rel1.rel2.field=? and a.rel1.rel2.field_name=? and a.rel1.rel2.zz=? or a.rel1.rel2.field=? and a.rel1.rel2.field_name=? and a.rel1.rel2.zz=?) or a.rel1.rel2.field in (?,?,?,?) or /*S*/EXISTS(SELECT 1 FROM Ty WHERE a.rel.join AND (a.mail<>? OR /*RI*/NOT(a.rel.field=? AND a.rel.field_name=?))) AND a.field2=? OR a.rel1.rel2.F1_1>=? and /*S*/EXISTS(SELECT 1 FROM T2 WHERE a.brel.join and (a.r1.r2.field_name LIKE ?||'%' and /*S*/EXISTS(SELECT 1 FROM Z WHERE a.brel.join.ext.rel1.rel2 and (a.relX is null or a.f1 is not null or a.f1 not in (?,?,?) and /*S*/EXISTS(SELECT 1 FROM TT WHERE a.brel3.join.ext.rel1.rel2.rel3) and /*S*/EXISTS(SELECT 1 FROM TT WHERE a.brel2.join and (a.field_name>=?)))) or UPPER(a.rel.bb) LIKE UPPER('%'||?||'%'))) OR /*RN*/(a.rel1.field is null and a.rel1.field_name is null) ORDER BY a.xxx asc, a.a__afgga.field asc, a.rel1.rel2.F1_1 desc GROUP BY x.x.xrel, y.y.y.mail_1, uuu.uuu.mail.x",
          "WHERE /*S*/EXISTS(SELECT 1 FROM T0 WHERE a.xx.join AND (a.field_name=?))"
        ];
        /*
        WHERE a.rel1
        */
        try {
          for(var i=0;i<tests.length;++i) {
          var ctx = {
          model : {
            T0 : {$:{name:'T0', pk:['field','field_name','zz']}
              ,field:{$:{name:'field'}}
              ,field_name:{$:{name:'field_name'}}
              ,rel:{$:{name:'rel'},target:'T1'}
              ,rel1:{$:{name:'rel1'},target:'T1'}
              ,rel2:{$:{name:'rel2'},target:'Z'}
              ,rel_name:{$:{name:'rel_name'}}
              ,xx:{$:{name:'xx'},target:'T1'}
              ,yy:{$:{name:'yy'},target:'T1'}
              ,zz:{$:{name:'zz'}}
              ,F1_1:{$:{name:'F1_1'}}
              ,aa:{$:{name:'aa'},target:'T3'}
            },
            T1 : {$:{name:'T1', pk:['field','field_name']}
              ,field_name:{$:{name:'field_name'}}
              ,rel:{$:{name:'rel'},target:'T2'}
              ,rel1:{$:{name:'rel1'},target:'T2'}
              ,rel2:{$:{name:'rel2'},target:'T3'}
              ,rel_name:{$:{name:'rel_name'}}
              ,xx:{$:{name:'xx'},target:'T2'}
              ,yy:{$:{name:'yy'},target:'T2'}
              ,rel_ty:{$:{name:'rel_ty'},target:'Ty'}
              ,field2:{$:{name:'field2'}}
              ,r2:{$:{name:'r2'},target:'T2'}
              ,aa:{$:{name:'aa'}}
              ,bb:{$:{name:'bb'}}
              ,xxx:{$:{name:'xxx'}}
              ,a__afgga:{$:{name:'a__afgga'},target:'T2'}
            },
            T2 : {$:{name:'T2', pk:['field','field_name']}
              ,field:{$:{name:'field'}}
              ,field_name:{$:{name:'field_name'}}
              ,rel:{$:{name:'rel'},target:'T3'}
              ,rel1:{$:{name:'rel1'},target:'T0'}
              ,rel2:{$:{name:'rel2'},target:'T0'}
              ,xx:{$:{name:'xx'},target:'T3'}
              ,yy:{$:{name:'yy'},target:'T3'}
              ,brel:{$:{name:'brel'},target:'T1'}
              ,r1:{$:{name:'r1'},target:'T1'}
              ,aa:{$:{name:'aa'}}
              ,bb:{$:{name:'bb'}}
            },
            T3 : {$:{name:'T3', pk:['bb','field_name']}
              ,bb:{$:{name:'bb'}}
              ,field_name:{$:{name:'field_name'}}
              ,rel:{$:{name:'rel'},target:'T4'}
              ,xx:{$:{name:'xx'},target:'T4'}
              ,yy:{$:{name:'yy'},target:'T4'}
            },
            T4 : {$:{name:'T4', pk:['field_name']}
              ,field_name:{$:{name:'field_name'}}
            },
            Ty : {$:{name:'Ty', pk:['field']}
              ,field:{$:{name:'field'}}
              ,rel:{$:{name:'rel'},target:'T1'}
              ,mail:{$:{name:'mail'}}
            },
            X : {$:{name:'X', pk:['xx','r1']}
              ,xx:{$:{name:'xx'},target:'T0'}
              ,r1:{$:{name:'r1'},target:'T1'}
            },
            Y : {$:{name:'Y', pk:['field_name']}
              ,field_name:{$:{name:'field_name'}}
              ,rel:{$:{name:'rel'},target:'T2'}
              ,bb:{$:{name:'bb'}}
            },
            Z : {$:{name:'Z', pk:['f1','field_name']}
              ,f1:{$:{name:'f1'}}
              ,field_name:{$:{name:'field_name'}}
              ,brel:{$:{name:'brel'},target:'T2'}
              ,relX:{$:{name:'relX'}}
              ,rel1:{$:{name:'rel1'},target:'T0'}
              ,rel3:{$:{name:'rel3'},target:'TT'}
            },
            TT : {$:{name:'TT', pk:['field_name']}
              ,field_name:{$:{name:'field_name'}}
              ,brel2:{$:{name:'brel2'},target:'Z'}
              ,brel3:{$:{name:'brel3'},target:'Z'}
            }
          },
          source: new QE10SQL.Source.test(tests[i]),
          root: "T1",
          arguments : [1,2,3,4,5,6,7,8,9,10,11,12,13]
          }
          
            var div = document.createElement("div");
            var model = parseSQL(ctx.source.sql(), ctx);
            var sql = printSQL(model);
            if(tests[i].trim().toLowerCase()==sql.trim().toLowerCase()) {
              div.innerHTML = "<span style='color:green'>Test "+(i+1)+" accomplished.</span><div>"+tests[i]+"</div>";
            } else {
              div.innerHTML = "<span style='color:red'>Test "+(i+1)+" failed.</span><pre>Was: "+tests[i]+"</pre><pre>I s: "+sql+"</pre>";
            }
            document.body.appendChild(div);
          }
        } catch(e) {
          document.write("Error stack: ")
          document.write(e.stack);
        }   
        
  }
  
  return {
      Part : Part,
      Operation: Operation,
      Sort : Sort,
      test : testCircuit,
      parse : parseSQL,
      print : printSQL,
      args : printArguments
    }
})();

var test_qe_params={root:"enrf_tasks",opened: true};
var test_qe_model={dual: {$:{name:'dual', caption:'', recaption:'', pk: ['f']},f:{$:{name: 'f'},caption:"f",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}}},atable: {$:{name:'atable', caption:'', recaption:'', pk: ['adm','period','dt','par']},adm:{$:{name: 'adm'},caption:"adm",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},lvl:{$:{name: 'lvl'},caption:"lvl",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},period:{$:{name: 'period'},caption:"period",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},dt:{$:{name: 'dt'},caption:"dt",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},par:{$:{name: 'par'},caption:"par",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"LONGVARCHAR"}},fn:{$:{name: 'fn'},caption:"fn",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},fs:{$:{name: 'fs'},caption:"fs",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"LONGVARCHAR"}},ft:{$:{name: 'ft'},caption:"ft",recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},fb:{$:{name: 'fb'},caption:"fb",recaption:'',sicaption:'',visibility:false,type:'BLOB',ctrl:{mc:"VARCHAR"}}},enacademic_degrees: {$:{name:'enacademic_degrees', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_namew:{$:{name: 'enf_namew'},caption:'Название',recaption:'названия',sicaption:'',visibility:true,type:'VARCHAR',ctrl:{mc:"VARCHAR"}}},eniddoc_types: {$:{name:'eniddoc_types', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_namew:{$:{name: 'enf_namew'},caption:"enf_namew",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}}},ens_banks: {$:{name:'ens_banks', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_bikw:{$:{name: 'enf_bikw'},caption:'БИК',recaption:'',sicaption:'',visibility:true,type:'VARCHAR',ctrl:{mc:"VARCHAR"}}},enpersons: {$:{dict:true,name:'enpersons', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_fw:{$:{name: 'enf_fw'},caption:'Фамилия',recaption:'',sicaption:'',visibility:true,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_iw:{$:{name: 'enf_iw'},caption:'Имя',recaption:'',sicaption:'',visibility:true,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_ow:{$:{name: 'enf_ow'},caption:'Отчество',recaption:'',sicaption:'',visibility:true,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_expertw:{$:{name: 'enf_expertw'},caption:'Статус эксперта',recaption:'',sicaption:'',visibility:true,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_academic_degreew:{$:{name: 'enf_academic_degreew'},target:"enacademic_degrees",caption:'Степень',recaption:'степени',sicaption:'',visibility:true,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enacademic_degrees&add_empty='"}},enrel_iddoc_typew:{$:{name: 'enrel_iddoc_typew'},target:"eniddoc_types",caption:"enrel_iddoc_typew",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=eniddoc_types&add_empty='"}},enf_doc_seriesw:{$:{name: 'enf_doc_seriesw'},caption:'Серия паспорта',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_doc_numberw:{$:{name: 'enf_doc_numberw'},caption:'Номер паспорта',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_doc_orgw:{$:{name: 'enf_doc_orgw'},caption:'Кто выдал',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_doc_datew:{$:{name: 'enf_doc_datew'},caption:'Дата выдачи',recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_doc_orgcodew:{$:{name: 'enf_doc_orgcodew'},caption:'Код подразделения',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_bdayw:{$:{name: 'enf_bdayw'},caption:'Дата рождения',recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_address_xxw:{$:{name: 'enf_address_xxw'},caption:'Адрес',recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enf_innw:{$:{name: 'enf_innw'},caption:'ИНН',recaption:'',sicaption:'',visibility:true,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_snilsw:{$:{name: 'enf_snilsw'},caption:'СНИЛС',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_telw:{$:{name: 'enf_telw'},caption:'Телефон',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_tel_celw:{$:{name: 'enf_tel_celw'},caption:'Моб. телефон',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_tel_workw:{$:{name: 'enf_tel_workw'},caption:'Рабочий телефон',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_emailw:{$:{name: 'enf_emailw'},caption:'e-mail',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_face_accountw:{$:{name: 'enf_face_accountw'},caption:'Счёт в банке',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enrel_bankw:{$:{name: 'enrel_bankw'},target:"ens_banks",caption:'Банк',recaption:'банка',sicaption:'',visibility:true,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=ens_banks&add_empty='"}},enf_errorw:{$:{name: 'enf_errorw'},caption:'Ошибочная  анкета',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_error_commentw:{$:{name: 'enf_error_commentw'},caption:'Комментарий ошибки',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}}},enpn2persons: {$:{name:'enpn2persons', caption:'', recaption:'', pk: ['enpnw']},enpnw:{$:{name: 'enpnw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enflw:{$:{name: 'enflw'},target:"enpersons",caption:"enflw",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enpersons&add_empty='"}}},enrf_areas: {$:{dict:true, name:'enrf_areas', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_codew:{$:{name: 'enf_codew'},caption:"enf_codew",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}}},enrf_person_areas: {$:{name:'enrf_person_areas', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enrel_personw:{$:{name: 'enrel_personw'},target:"enpersons",caption:"enrel_personw",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enpersons&add_empty='"}},enrel_areaw:{$:{name: 'enrel_areaw'},target:"enrf_areas",caption:"Область знаний",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_areas&add_empty='"}},enf_expertw:{$:{name: 'enf_expertw'},caption:"enf_expertw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}}},enregions: {$:{name:'enregions', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_codew:{$:{name: 'enf_codew'},caption:'Код',recaption:'',sicaption:'',visibility:true,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_namew:{$:{name: 'enf_namew'},caption:'Название',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}}},enorganizations: {$:{dict:true, name:'enorganizations', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_snamew:{$:{name: 'enf_snamew'},caption:'Сокр. название',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_namew:{$:{name: 'enf_namew'},caption:'Название',recaption:'',sicaption:'',visibility:true,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_innw:{$:{name: 'enf_innw'},caption:'ИНН',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_kppw:{$:{name: 'enf_kppw'},caption:'КПП',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_ogrnw:{$:{name: 'enf_ogrnw'},caption:'ОГРН',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_telw:{$:{name: 'enf_telw'},caption:'Телефон',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_faxw:{$:{name: 'enf_faxw'},caption:'Факс',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_emailw:{$:{name: 'enf_emailw'},caption:'ИНН',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_law_addr_xxw:{$:{name: 'enf_law_addr_xxw'},caption:'Юр. адрес',recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enf_law_addr_kladrw:{$:{name: 'enf_law_addr_kladrw'},caption:'Юр. адрес КЛАДР',recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enf_real_addr_xxw:{$:{name: 'enf_real_addr_xxw'},caption:'Факт. адрес',recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enf_real_addr_kladrw:{$:{name: 'enf_real_addr_kladrw'},caption:'Факт. адрес КЛАДР',recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enrel_regionw:{$:{name: 'enrel_regionw'},target:"enregions",caption:'Регион',recaption:'региона',sicaption:'',visibility:true,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enregions&add_empty='"}}},enrf_project_types: {$:{name:'enrf_project_types', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_exp_cntw:{$:{name: 'enf_exp_cntw'},caption:'Число экспертов',recaption:'',sicaption:'',visibility:true,type:'DECIMAL',ctrl:{mc:"DECIMAL"}}},enrf_rounds: {$:{name:'enrf_rounds', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_namew:{$:{name: 'enf_namew'},caption:"enf_namew",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}}},enrf_contest_types: {$:{dict:true,name:'enrf_contest_types', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_namew:{$:{name: 'enf_namew'},caption:'название',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_numberw:{$:{name: 'enf_numberw'},caption:"enf_numberw",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}}},enrf_contests: {$:{name:'enrf_contests', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_yearw:{$:{name: 'enf_yearw'},caption:'Год',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_abbfw:{$:{name: 'enf_abbfw'},caption:'Аббревиатура',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enrel_typew:{$:{name: 'enrel_typew'},target:"enrf_contest_types",caption:'Тип',recaption:'типа',sicaption:'',visibility:true,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_contest_types&add_empty='"}},enrel_areaw:{$:{name: 'enrel_areaw'},target:"enrf_areas",caption:"Область знаний",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_areas&add_empty='"}},enf_titlew:{$:{name: 'enf_titlew'},caption:'Название',recaption:'',sicaption:'',visibility:true,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_snamew:{$:{name: 'enf_snamew'},caption:'Краткое название',recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_startw:{$:{name: 'enf_startw'},caption:'Начало',recaption:'',sicaption:'',visibility:true,type:'DATE',ctrl:{mc:"DATE"}},enf_t_endw:{$:{name: 'enf_t_endw'},caption:'Конец',recaption:'',sicaption:'',visibility:true,type:'DATE',ctrl:{mc:"DATE"}},enf_reg_endw:{$:{name: 'enf_reg_endw'},caption:'Конец регистрации',recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_expw:{$:{name: 'enf_expw'},caption:'Дата начала экспертизы',recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_rezw:{$:{name: 'enf_rezw'},caption:'Дата объявления результатов',recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_endw:{$:{name: 'enf_endw'},caption:'Дата окончания',recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_autoregw:{$:{name: 'enf_autoregw'},caption:'Авто регистрация',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_t_reportw:{$:{name: 'enf_t_reportw'},caption:'Срок начала подачи отчетов',recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_t_report_endw:{$:{name: 'enf_t_report_endw'},caption:'Срок окончания подачи отчетов',recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_descrw:{$:{name: 'enf_descrw'},caption:'Описание',recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enf_filew:{$:{name: 'enf_filew'},caption:'Полное описание',recaption:'',sicaption:'',visibility:false,type:'BLOB',ctrl:{mc:"VARCHAR"}},enb_txtw:{$:{name: 'enb_txtw'},caption:'Комментарий',recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enf_max_prjw:{$:{name: 'enf_max_prjw'},caption:'Квота числа проектов',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_max_sumw:{$:{name: 'enf_max_sumw'},caption:'Квота суммы проекта',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_max_totalw:{$:{name: 'enf_max_totalw'},caption:'Квота общей суммы',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}}},enrf_tasks: {$:{name:'enrf_tasks', caption:'Заявки', recaption:'заявки', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enrel_contestw:{$:{name: 'enrel_contestw'},target:"enrf_contests",caption:'Конкурс',recaption:'конкурса',sicaption:'',visibility:true,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_contests&add_empty='"}},enrel_applicantw:{$:{name: 'enrel_applicantw'},target:"enpersons",caption:'Руководитель',recaption:'руководителя',sicaption:'Заявки',visibility:true,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enpersons&add_empty='"}},enrel_fin_organizationw:{$:{name: 'enrel_fin_organizationw'},target:"enorganizations",caption:'Организация',recaption:'организации',sicaption:'',visibility:true,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enorganizations&add_empty='"}},enrel_areaw:{$:{name: 'enrel_areaw'},target:"enrf_areas",caption:"Область знаний",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_areas&add_empty='"}},enrel_subareaw:{$:{name: 'enrel_subareaw'},target:"enrf_areas",caption:"Классификатор фонда",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_areas&add_empty='"}},enrel_subarea2w:{$:{name: 'enrel_subarea2w'},target:"enrf_areas",caption:"Классификатор фонда 2",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_areas&add_empty='"}},enrel_subarea3w:{$:{name: 'enrel_subarea3w'},target:"enrf_areas",caption:"Классификатор фонда 3",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_areas&add_empty='"}},enf_numberw:{$:{name: 'enf_numberw'},caption:'Номер',recaption:'номера',sicaption:'',visibility:true,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_namew:{$:{name: 'enf_namew'},caption:'Название',recaption:'названия',sicaption:'',visibility:true,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enrel_typew:{$:{name: 'enrel_typew'},target:"enrf_project_types",caption:'Тип проекта',recaption:'типа проекта',sicaption:'',visibility:true,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_project_types&add_empty='"}}},enrf_supported_tasks: {$:{name:'enrf_supported_tasks', caption:'', recaption:'', pk: ['']},enrel_taskw:{$:{name: 'enrel_taskw'},caption:"enrel_taskw",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}}},enrf_taskers: {$:{name:'enrf_taskers', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enrel_taskw:{$:{name: 'enrel_taskw'},target:"enrf_tasks",caption:'Заявка',recaption:'',sicaption:'Участники',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_tasks&add_empty='"}},enrel_personw:{$:{name: 'enrel_personw'},target:"enpersons",caption:'Участник',recaption:'',sicaption:'',visibility:true,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enpersons&add_empty='"}},enf_editorw:{$:{name: 'enf_editorw'},caption:'Может править',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_fulleditorw:{$:{name: 'enf_fulleditorw'},caption:'Может отправлять',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_confirmedw:{$:{name: 'enf_confirmedw'},caption:'Участие подтверждено',recaption:'',sicaption:'',visibility:true,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_fromw:{$:{name: 'enf_fromw'},caption:'С',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_tow:{$:{name: 'enf_tow'},caption:'По',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enrel_subareaw:{$:{name: 'enrel_subareaw'},target:"enrf_areas",caption:'Классификатор Фонда',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_areas&add_empty='"}}},enrf_stages: {$:{name:'enrf_stages', caption:'Этапы', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enrel_taskw:{$:{name: 'enrel_taskw'},target:"enrf_tasks",caption:'Заявка',recaption:'Заявки',sicaption:'Этапы',visibility:true,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_tasks&add_empty='"}},enf_a_yearw:{$:{name: 'enf_a_yearw'},caption:'Заявка на',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_r_yearw:{$:{name: 'enf_r_yearw'},caption:'Отчет за',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_asked_money0w:{$:{name: 'enf_asked_money0w'},caption:'Предварительное финансирование',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_asked_moneyw:{$:{name: 'enf_asked_moneyw'},caption:'Запрошенное финансирование',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_moneyw:{$:{name: 'enf_moneyw'},caption:'Финансирование',recaption:'',sicaption:'',visibility:true,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_datew:{$:{name: 'enf_datew'},caption:'Дата подачи',recaption:'',sicaption:'',visibility:true,type:'DATE',ctrl:{mc:"DATE"}},enf_registredw:{$:{name: 'enf_registredw'},caption:'Регистрация',recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_paper_gw:{$:{name: 'enf_paper_gw'},caption:'Бумажный вариант получен',recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_checkedw:{$:{name: 'enf_checkedw'},caption:'Первичная проверка',recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_last_datew:{$:{name: 'enf_last_datew'},caption:'Дата утверждения решения',recaption:'',sicaption:'',visibility:true,type:'DATE',ctrl:{mc:"DATE"}},enf_problemsw:{$:{name: 'enf_problemsw'},caption:'Проблемы оформления',recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enrel_checkw:{$:{name: 'enrel_checkw'},caption:'Результат первичной провеки',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_check_txt:{$:{name: 'enf_check_txt'},caption:'Проблемы проверки',recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enf_expertises_apw:{$:{name: 'enf_expertises_apw'},caption:'Экспертизы полуназначены',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_expertises_aw:{$:{name: 'enf_expertises_aw'},caption:'Экспертизы назначены',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_expertises_cw:{$:{name: 'enf_expertises_cw'},caption:'Экспертизы завершены',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_expertises_dw:{$:{name: 'enf_expertises_dw'},caption:'Экспертизы приняты',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enrel_sectionw:{$:{name: 'enrel_sectionw'},caption:'Заседание секции',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_section_txtw:{$:{name: 'enf_section_txtw'},caption:'Комментарий к решению секции',recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enf_section_ratew:{$:{name: 'enf_section_ratew'},caption:'Рейтинг секции',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enrel_concilw:{$:{name: 'enrel_concilw'},caption:'Заседание экспертного совета',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_concil_txtw:{$:{name: 'enf_concil_txtw'},caption:'Комментарий к решению секции',recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enf_concil_ratew:{$:{name: 'enf_concil_ratew'},caption:'Рейтинг совета',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_rate:{$:{name: 'enf_rate'},caption:'Оценка',recaption:'',sicaption:'',visibility:true,type:'DECIMAL',ctrl:{mc:"DECIMAL"}}},enrf_expertises: {$:{name:'enrf_expertises', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enrel_taskw:{$:{name: 'enrel_taskw'},target:"enrf_stages",caption:'этап',recaption:'этапа',sicaption:'Экспертизы',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_stages&add_empty='"}},enrel_personw:{$:{name: 'enrel_personw'},target:"enpersons",caption:'Эксперт',recaption:'эксперта',sicaption:'Экспертизы',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enpersons&add_empty='"}},enf_agrw:{$:{name: 'enf_agrw'},caption:'Согласие',recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_agr_datew:{$:{name: 'enf_agr_datew'},caption:"enf_agr_datew",recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_datew:{$:{name: 'enf_datew'},caption:"enf_datew",recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_regw:{$:{name: 'enf_regw'},caption:"enf_regw",recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_ratew:{$:{name: 'enf_ratew'},caption:"enf_ratew",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_exp_moneyw:{$:{name: 'enf_exp_moneyw'},caption:"enf_exp_moneyw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}}},enrf_expertise_items: {$:{name:'enrf_expertise_items', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enrel_contw:{$:{name: 'enrel_contw'},target:"enrf_expertises",caption:"enrel_contw",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_expertises&add_empty='"}},enf_paramw:{$:{name: 'enf_paramw'},caption:"enf_paramw",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_sw:{$:{name: 'enf_sw'},caption:"enf_sw",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_nw:{$:{name: 'enf_nw'},caption:"enf_nw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_tw:{$:{name: 'enf_tw'},caption:"enf_tw",recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enf_bw:{$:{name: 'enf_bw'},caption:"enf_bw",recaption:'',sicaption:'',visibility:false,type:'BLOB',ctrl:{mc:"VARCHAR"}}},enrf_concils: {$:{name:'enrf_concils', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enf_namew:{$:{name: 'enf_namew'},caption:"enf_namew",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_date_beginw:{$:{name: 'enf_date_beginw'},caption:"enf_date_beginw",recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_date_endw:{$:{name: 'enf_date_endw'},caption:"enf_date_endw",recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enrel_areaw:{$:{name: 'enrel_areaw'},target:"enrf_areas",caption:"Область знаний",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_areas&add_empty='"}}},enrf_sections: {$:{name:'enrf_sections', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enrel_concilw:{$:{name: 'enrel_concilw'},target:"enrf_concils",caption:"enrel_concilw",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_concils&add_empty='"}},enf_codew:{$:{name: 'enf_codew'},caption:"enf_codew",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_namew:{$:{name: 'enf_namew'},caption:"enf_namew",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}}},enrf_expert_sect_sessions: {$:{name:'enrf_expert_sect_sessions', caption:'Рассмотрение заявок на секциях', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enrel_sectionw:{$:{name: 'enrel_sectionw'},target:"enrf_sections",caption:"enrel_sectionw",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_sections&add_empty='"}},enrel_contestw:{$:{name: 'enrel_contestw'},target:"enrf_contests",caption:"enrel_contestw",recaption:'',sicaption:'Рассмотрения на секциях',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_contests&add_empty='"}},enf_datew:{$:{name: 'enf_datew'},caption:"enf_datew",recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_numberw:{$:{name: 'enf_numberw'},caption:"enf_numberw",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_tasksw:{$:{name: 'enf_tasksw'},caption:"enf_tasksw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_expsw:{$:{name: 'enf_expsw'},caption:"enf_expsw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_exps_allw:{$:{name: 'enf_exps_allw'},caption:"enf_exps_allw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_textw:{$:{name: 'enf_textw'},caption:"enf_textw",recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enf_summ_limitw:{$:{name: 'enf_summ_limitw'},caption:"enf_summ_limitw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_cnt_limitw:{$:{name: 'enf_cnt_limitw'},caption:"enf_cnt_limitw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_freedomw:{$:{name: 'enf_freedomw'},caption:"enf_freedomw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}}},enrf_concil_members: {$:{name:'enrf_concil_members', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enrel_conciw:{$:{name: 'enrel_conciw'},target:"enrf_concils",caption:"enrel_conciw",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_concils&add_empty='"}},enrel_personw:{$:{name: 'enrel_personw'},target:"enpersons",caption:"enrel_personw",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enpersons&add_empty='"}}},enrf_task_publs: {$:{name:'enrf_task_publs', caption:'', recaption:'', pk: ['syrecordidw']},syrecordidw:{$:{name: 'syrecordidw'},caption:'ID',recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"VARCHAR"}},enrel_stagew:{$:{name: 'enrel_stagew'},target:"enrf_stages",caption:"enrel_stagew",recaption:'',sicaption:'',visibility:false,type:'CHAR',ctrl:{mc:"DL",rel_target:"'/az/server/php/chooser.php?table=enrf_stages&add_empty='"}},enf_autorsw:{$:{name: 'enf_autorsw'},caption:"enf_autorsw",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_titlew:{$:{name: 'enf_titlew'},caption:"enf_titlew",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_yearw:{$:{name: 'enf_yearw'},caption:"enf_yearw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_keywordsw:{$:{name: 'enf_keywordsw'},caption:"enf_keywordsw",recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enrel_edition_type_xxw:{$:{name: 'enrel_edition_type_xxw'},caption:"enrel_edition_type_xxw",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_edition_subtypew:{$:{name: 'enf_edition_subtypew'},caption:"enf_edition_subtypew",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_edition_xxw:{$:{name: 'enf_edition_xxw'},caption:"enf_edition_xxw",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_output_infow:{$:{name: 'enf_output_infow'},caption:"enf_output_infow",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_doiw:{$:{name: 'enf_doiw'},caption:"enf_doiw",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_urlw:{$:{name: 'enf_urlw'},caption:"enf_urlw",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_issnw:{$:{name: 'enf_issnw'},caption:"enf_issnw",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_isbnw:{$:{name: 'enf_isbnw'},caption:"enf_isbnw",recaption:'',sicaption:'',visibility:false,type:'VARCHAR',ctrl:{mc:"VARCHAR"}},enf_readyw:{$:{name: 'enf_readyw'},caption:"enf_readyw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_wosw:{$:{name: 'enf_wosw'},caption:"enf_wosw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_scopusw:{$:{name: 'enf_scopusw'},caption:"enf_scopusw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_rincw:{$:{name: 'enf_rincw'},caption:"enf_rincw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_ruw:{$:{name: 'enf_ruw'},caption:"enf_ruw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_rsfw:{$:{name: 'enf_rsfw'},caption:"enf_rsfw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"INTEGER"}},enf_impactw:{$:{name: 'enf_impactw'},caption:"enf_impactw",recaption:'',sicaption:'',visibility:false,type:'DECIMAL',ctrl:{mc:"DECIMAL"}},enf_pub_datew:{$:{name: 'enf_pub_datew'},caption:"enf_pub_datew",recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_informationw:{$:{name: 'enf_informationw'},caption:"enf_informationw",recaption:'',sicaption:'',visibility:false,type:'CLOB',ctrl:{mc:"CLOB"}},enb_filew:{$:{name: 'enb_filew'},caption:"enb_filew",recaption:'',sicaption:'',visibility:false,type:'BLOB',ctrl:{mc:"VARCHAR"}},enf_datew:{$:{name: 'enf_datew'},caption:"enf_datew",recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}},enf_verification_datew:{$:{name: 'enf_verification_datew'},caption:"enf_verification_datew",recaption:'',sicaption:'',visibility:false,type:'DATE',ctrl:{mc:"DATE"}}}}

var QE10HTML = (function(Engine) {
  // Operations
  var DO = [ '=', '<>', 'is null', 'is not null' ];//default operations
 
  var TO = {};//type operations
  
  TO.VARCHAR = TO.LONGVARCHAR = TO.CLOB  = DO.concat(['begins','contains']);
  TO.DECIMAL = TO.INTEGER = DO.concat(['>','<','>=','<='/*,'between'*/]);  
  TO.DATE = DO.concat(['>','<','>=','<='/*,'between'*/]);  
  TO.BOOL = TO.BOOL3 = DO.concat([]);
  TO.MENU = ['in','not in','is null','is not null']
  TO.DL = ['relation in','relation not in','relation is null','relation is not null']

  function apropriateControl(opType, ctrlType, method)
  {
    return (
        Controls[ctrlType] && Controls[ctrlType][opType] && Controls[ctrlType][opType][method] || 
        Controls[ctrlType] && Controls[ctrlType]["default"] && Controls[ctrlType]["default"][method] || 
        Controls['default'][opType] && Controls['default'][opType][method] ||
        Controls['default']['default'][method])
  }

  //OPERATION DRAW EXTENSION

  var defaultCtrl = {
  operations : function() { 
    var descr = this.core.path.lastelement().field;
    return TO[descr.ctrl.mc].map(function( d ) { return { mc: descr.ctrl.mc, op: d } });
  },
  control : function(container) { 
    var descr = this.core.path.lastelement().field.ctrl;
    apropriateControl(this.op, descr.mc, 'control').call( this, container.node(), descr ); 
  },
  text : function(container) {
    if(container) this.valuecontainer = container 
    else container = this.valuecontainer;
    var descr = this.core.path.lastelement().field.ctrl;
    apropriateControl(this.op, descr.mc, 'text').call( this, container.node(), descr );
  },
  makenew : function(op) {
    var newop = new Engine.Operation[ op ]().copy(this);
    this.parent.replace(this, newop); 
    return newop;
  },
  //value:function() {
  //  return "Choosen"
  //},
  drawInitStage : function() {
    delete this.setshowctrl;
    delete this.setshowops; 
    this.controller.draw();
  },
  drawOpsStage : function() {
    delete this.setshowctrl;
    this.setshowops = true;   
    this.controller.draw();
  },
  drawCtrlStage : function() {
    delete this.setshowops;
    this.setshowctrl = true;  
    this.controller.draw();
  },
  draw : function(container) {
    if( this.values && !this.values.length && !this.setshowctrl )
      this.setshowops = true;
    
    container = 
      d3.select(container).append("span")
        .attr("op","")
        .on("click", function(op){
          d3.event.stopPropagation();
        //  op.controller.editor.selectblock( op.parent, op.or )
        })

    var id = container.append("span").attr("typer-id","");
    
    id.append("span")
      .attr("delete","")
      .on("click",function(op) {
        d3.event.stopPropagation();
        op.parent.remove(op);
        op.controller.draw();
      });
    
    id.append("span")
      .attr("typer-caption","")
    .text( function(op) { return op.caption() } )
    .on("click", function(op) {
      d3.event.stopPropagation();
      op.drawOpsStage()
    })
    
    container
      .each(function(op) {
        op.showvalue(d3.select(this));
        if(op.setshowops)
          op.showops(d3.select(this))        
        if(op.setshowctrl)
          op.showctrl(d3.select(this))        
      })
    delete this.setshowops;
    delete this.setshowctrl;
  },
  showops: function(container) {
    var self = this;
    container = container.append("div").attr("ctrl-holder","");
    var op = container
      .selectAll("[typer-op]").data(function(op) { return op.operations() });
    var new_op = op.enter()
      .append("span")
        .attr("typer-op","")
    op.exit().remove();
    
    op
      .attr("mc",function(d) { return d.mc })
      .attr("typer-op",function(d) { return d.op })
      .attr("selected", function(d) { return d.op==self.op || undefined })
      .on("click", function(d) {
        d3.event.stopPropagation();
        var new_op = self.makenew(d.op);
        if(!new_op.values) {
          new_op.drawInitStage();
        } else
          new_op.drawCtrlStage();
      })
  },
  showvalue : function(container) {
    this.text(container);
  },
  showctrl : function(container) {
    container
    .append("div")
      .attr("ok","")
      .on("click",function(op) {
        d3.event.stopPropagation();
        op.drawInitStage();
      });
    container = container.append("div").attr("ctrl-holder","")
    this.control && this.control(container);
  },
  onchoose : function(val) {
    this.setvalue(val);
    this.drawInitStage();
  }
}
for(var i in Engine.Operation) {
  if(i.charAt(0)=='$') continue;
  X.mixin(defaultCtrl, Engine.Operation[i].prototype);
}

["relation in", "relation not in", "in", "not in"]
  .forEach(function(t) {
    X.mixin({
      onchoose : function(val,container) {
        this.addvalue(val);
        this.text();
      }
    },Engine.Operation[t].prototype)
  });

X.mixin({//Engine.Part.orderby.prototype
  activate : function(d) {
    this.controller.activeblock = this;
    this.controller.activesubblock = d;
  },
  isactive : function(d) {
    return this.controller.activesubblock == d && 
            this.controller.activeblock === this
  },
  draw : function(container) {
    var self = this;
    var sortnode = d3.select(container).selectAll("[sort-node]")
      .data( this.model )
    
     d3.select(container)
        .attr("active", function() { return self.isactive() || null })
        .attr("empty", function(d) { return self.model.length ? null : "" })
        .on("click", function() {
          d3.event.stopPropagation();
          self.controller.editor.selectsort( self )
        })

    var newsortbody = sortnode.enter()
      .append("div")
        .attr("sort-node","")
      .append("span")
        .attr("sort-body","")
    
    newsortbody  
      .append("span")
        .attr("delete","")
        .on("click",function(sort) {
          d3.event.stopPropagation();
          sort.parent.remove(sort);
          self.controller.draw();
        });

    newsortbody
      .append("span")
        .attr("sort-op","")

    newsortbody
      .append("span")
        .attr("sort-id","")

    sortnode
      .on("click",function(sort) {
        d3.event.stopPropagation();
      });

    sortnode.select("[sort-body]")      
        .attr("active", function(d) { return self.isactive(d) || null})
        .on("click",function(sort) {
          d3.event.stopPropagation();
          self.controller.editor.selectsort(self, sort);
        });

    sortnode.select("[sort-op]")
      .text(function(d) { 
        return d.isasc() ? "по возрастанию " : "по убыванию ";
      })
      .on("click",function(sort) {
        d3.event.stopPropagation();
        sort.toggle();
        self.controller.draw();
      })
    sortnode.select("[sort-id]")
      .text(function(d) { 
        return d.caption()
      })       
      .on("click", function(d) {
        d3.event.stopPropagation();
        self.controller.editor.selectsort(self, d);
      })
  },
  addcore : function(core, place) {
    var newnode = new Engine.Sort(this).setcore(core);
    this.model.push(newnode)
    this.controller.activeblock = this;
    this.controller.activesubblock = newnode;
    this.controller.draw(); 
  }
},Engine.Part.orderby.prototype)

X.mixin({//Engine.Operation.subquery.prototype  
  draw: function(container) {
      var self = this;
      self.subquery.controller = this.controller;
      var subquery = d3.select(container)
        .append("span")
        .attr("subquery", "")        
      
      var subqueryhead = subquery
        .append("span")
        .attr("subquery-head", "")
        .attr("active", function(d) { return self.subquery.isactive() || null })

      subqueryhead
        .append("span")
        .attr("who","")
        .html(this.caption().who)

      var elem = subqueryhead
        .append("a")
        .attr("what","")
        .on("click", function() {
          d3.event.stopPropagation();
          self.controller.editor.selectblock( self.subquery )          
        })
        
        elem
         .append("span")
         .attr("delete","")
         .on("click",function(op) {
           d3.event.stopPropagation();
           op.parent.remove(op);
           op.controller.draw();
         });
      elem
        .append("span")
          .attr("subquery-caption","")
          .html(this.caption().what);
          
      if(!this.empty()) {
        if(!this.subquery.model[0][0].which)
        subqueryhead
        .append("span")
          .text(", у которых ");
        var subbody = subquery            
        .append("span")
          .attr("subquery-body", ""); 
            this.subquery.controller = this.controller;
        this.subquery.draw(subbody.node());          
      }
    }
  }, Engine.Operation.subquery.prototype)

  X.mixin({//Engine.Part.where.prototype
    activate : function(d) {
      this.controller.activeblock = this;
      this.controller.activesubblock = d;
    },
    isactive : function(d) {
      return this.controller.activesubblock == d && 
              this.controller.activeblock === this
    },
    draw : function(container) {
      var self = this;
      var controller = this.controller;
      var or_node = 
        d3.select(container).selectAll("[or]")
        .data( this.model );
      if(!self.parent) {
        d3.select(container)
          .attr("empty", function(d) { return self.model.length ? null : "" })
          .attr("active", function() { return self.isactive() || null })
          .on("click", function() {
            d3.event.stopPropagation();
            self.controller.editor.selectblock( self )
          })
      }

      var new_or_node = 
        or_node.enter()
        .append("span")
        .attr("or", "")
        
      or_node.exit().remove();

      or_node
        .attr("active", function(d) { return self.isactive(d) || null })
        .on("click", function(d,i) {
          d3.event.stopPropagation();
          self.controller.editor.selectblock( self, d )          
        })
      
      var and_node = 
        or_node.selectAll("[and]")
        .data(function(d) { 
          return d.filter(function(x) { return x.draw })
            .map(function(x) { x.or = d; return x  }) 
        });
       
      var new_and_node = 
         and_node.enter()
         .append("span")
         .attr("and", "")
         .each(function(op) { op.draw && (op.controller = controller) && op.draw(this) });  
      
      and_node.exit().remove();
    },    
    search : function(path, results) {
      results = results || [];
      this.model.forEach(function(ors) {
        ors.forEach(function(op) {
          if(op.path().toString()==path.toString()) {
            results.push(op.subquery || op)
          } else
          if(op.subquery) {
            op.subquery.search(path, results)
          }          
        })
      })   
      return results;
    },
    setupplace : function(subblock) {
      var section = subblock || [];
      !subblock && this.model.unshift(section)
      this.controller.activeblock = this;
      this.controller.activesubblock = section;
      return section;
    },
    addcore : function(core, or) {
      var place = this.setupplace(or);
      //(DDDDDDR)
      //(DDDDDDR)(R)(DDDR)(DR)(DDD)
      if( core.path.subpath(0, this.path.size() ).toString() != this.path.toString() )
        throw "You tried to insert path into subquery with different root";

      var blocks = core.path.cutblocks();
      var offset = this.path.size();
      var parent = this;
      for(var i=0;i<blocks.length;++i) {
        if(blocks[i]<offset) continue;
        var sub = new Engine.Operation.subquery(parent)
            .setcore(core.path.subpath(0, blocks[i]+1).lastelement());
        place.unshift(sub);
        place = [];
        sub.subquery.model.unshift(place);
        parent = sub.subquery;
      }
      if(core.isfield() || core.isrelation())
        place.unshift( new Engine.Operation.empty(parent).setcore(core) )
      this.clear();
      this.controller.draw();
    }
  }, Engine.Part.where.prototype)
  
  Engine.Controller = function(cont, model, descr, editor) {
    var self = this;
    this.container = cont;
    this.model = model;
    this.description = descr;
    this.editor = editor;
    this.draw = function() {
      var ctrl = d3.select(this.container)
        .selectAll("[controller]")
        .data([{}]);
      var new_ctrl = ctrl
        .enter()
        .append("div")
          .attr("controller","")

      ctrl.exit().remove();
      ctrl.selectAll("*").remove();

      ctrl
        .attr("set-where",function() { return self.model["WHERE"].empty() ? null : "" })
        .attr("set-order",function() { return self.model["ORDER BY"].empty() ? null : "" })
        .attr("set-group",function() { return self.model["GROUP BY"].empty() ? null : "" })

      this.conditions = ctrl
        .append("div")
          .attr("conditions","")
          .node() 
      this.sorts = ctrl
        .append("div")
          .attr("sorts","")
          .node()

      this.editorcontrol = ctrl
        .append("div")
          .attr("editorcontrol","")          

      this.editorcontrol
        .append("button")
          .attr("type","button")
          .attr("accept","")
          .on("click", function() {
            self.editor.apply()
          })
      
      this.editorcontrol
        .append("button")
          .attr("type","button")
          .attr("cancel","")
          .on("click", function() {
            self.editor.close()
          })      

      for(var part in this.model) { 
        this.model[part].controller = this;       
      }
      this.model["WHERE"].draw(this.conditions);
      this.model["ORDER BY"].draw(this.sorts);
    }
    this.deactivate = function() {
      delete this.activeblock;
      delete this.activesubblock;
    }
  }
  return {}
})(QE10SQL);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var QE10NAV = (function(Engine) {
  Engine.Navigator = function(cont, expmodel, ctx, editor) {
    var navigator = this;
    this.editor = editor;
    this.container = cont;
    this.expmodel = expmodel;
    this.ctx = ctx;
    this.model = ctx.model;
    function arrayz(model) {
      var result = [];
      for(var table_name in model) {
        var table = model[table_name];
        var fields = [];
        for(var field_name in table) {
          if(field_name=='$') continue;
          fields.push( table[field_name] );
        }
        result.push({descr: table, fields: fields });
      }
      return result
    }
    this.arraymodel = arrayz(this.model);
    var BackMap = this.arraymodel.reduce(function(result, table) {
      table.fields
        .filter(function(d) { return d.target })
        .reduce(function(res, d) {
          res[d.target].push({ table: table.descr, field: d })
          return res;
        }, result)
      return result;
    }, this.arraymodel.reduce( function(result, n) {
       result[n.descr.$.name] = []; 
       return result }
       , {} ));
    function Fields(table_name, model) {
      var table = model[table_name];
      var fields = [];
      for(var field_name in table) {
        if(field_name=='$') continue;
        fields.push( table[field_name] );
      }
      return fields;
    }
    var Node = {
      field : function(table, field, path) {
        this.core = new Engine.Core.field(path).make(table, field);
        this.name = this.core.toString();
        this._text_ = field.caption || field.$.name;
        return this;
      },
      relationfield : function(node) {
        this.node = node;
        this.core = this.node.core;
        this.name = "@"+this.node.name;
        this._text_ = this.node._text_;
      },      
      relation: function( table, field, path ) {
        this.core = new Engine.Core.relation(path).make(table, field);
        this.area = new Area(field.target, path.ctx.model, this.core.path );
        this.name = ">"+this.core.toString();      
        this.dictionary = path.ctx.model[field.target].$.dict;
        this._text_ = field.caption || field.$.name;
        return this;
      },
      subtable : function( table, field, path ) {
        this.core = new Engine.Core.subtable(path).make(table, field);
        this.area = new Area( table.$.name, path.ctx.model, this.core.path )
        this.name = "<"+this.core.toString();
        this._text_ = field.sicaption || table.$.caption || table.$.name;
        return this;
      },
      table : function(table, ctx) {
        this.core = new Engine.Core.table(ctx).make(table);
        this.name = this.core.toString();
        this._text_ = this._text_ = table.$.caption || table.$.name;
        this.area = new Area(table.$.name, ctx.model, this.core.path)
      },
      history : function(pack,idx) {
        this.pack = pack;
        this.core = pack.node.core;
        this.name = 'H'+idx+'.'+pack.node.name;
        this.idx = idx;
        this._text_ = (idx+1)+' '+pack.children[0]._text_;
      },
      extender : function(pack, mode) {
        this.node = pack.node;
        this.core = pack.node.core;
        this.name = "EX."+pack.node.name;
        this.turnon = mode;
        this._text_ = "@";
      },
      header : function(pack) {
        this.node = pack.node;
        this.core = pack.node.core;
        this.name = "HD."+pack.node.name;
        this._text_ = this.node._text_;
        this.expand = function() {}
      }
    }
    var exNode = {
      isfield : function() { return this.core.isfield() },
      issubtable : function() { return this.core.issubtable() },
      isrelation : function() { return this.core.isrelation() },
      path : function() { return this.core.path },
      uniquepath : function() {//avoid cycles
        return this.core.path.unique();
      },
      calculateradius : function(svg) {
        var oldVB = svg
          .attr("viewBox");
        var sR = svg.node().getBoundingClientRect();
        svg
            .attr("viewBox","0 0 "+sR.width+" "+sR.height)  
        var text = this.drawtext( svg.append("text") )
        var W = text.node().getBoundingClientRect().width;
        var H = text.node().getBoundingClientRect().height;
        text.remove();
        svg
          .attr("viewBox",oldVB)
        var padding = {
          "extender" : 15,
          "history" : 10,
          "relationfield" : 20
        }
        this.value = Math.sqrt(W*W/4+H*H/4) + (padding[this.type] || 5);
        if( this.children ) 
          this.children.forEach(function(node) { node.calculateradius(svg) })
      },
      text : function() {
        var ta = this._text_.toLowerCase().split(/\s+/);
        var W = Math.max(
          Math.floor(Math.sqrt(ta.join(' ').length)),
          ta.reduce(function(max, w, i) { 
            if(max < w.length) 
              max = w.length; 
            return max;
          }, 0)
        );
        var result = [];
        var line = [];
        for(var i=0;i<ta.length;++i) {
          var L = line.join(' ')
          if( (L.length + ta[i].length) <= W ) {
            line.push( ta[i] )
          } else {
            result.push( L )
            line = [ta[i]];
          }
        }
        result.push(line.join(' '))
        return result;
      },
      drawtext : function(textelem) {
        var tspan = textelem.selectAll("tspan")
          .data(this.text())
        var new_tspan = tspan.enter()
          .append("tspan")
            
        tspan.exit().remove();

        tspan
          .attr("x", 0)
          .attr("y", 0)
          .attr("dy", function(d,i) { return (i * 1.1 + 0.9 - (tspan.size()*1.1/2) ) + "em"})
          .text(function(d) { return d });

        return textelem;
      },
      region : function() {
        return this.parent.region()
      },
      restrict : function(restriction) {
        delete this.restricted;
        if(this.core && restriction && restriction.size()) {
          var origin = this.core.path.subpath(0, restriction.size());
          this.restricted = (restriction.toString() != origin.toString());
        }        
      }
    }
    for(var i in Node) { X.mixin(exNode, Node[i].prototype); Node[i].prototype.type = i }

    function Area( table_name, model, path )
    {
      var self = this;
      self.table = model[table_name];
      self.path = new Engine.Path().copy(path)
      this.elements = function() {
        var groupcount = 0;
        var fields = Fields(table_name, model);
        return fields.filter(function(fld) { return !fld.target })
          .map(function(fld) {
              return new Node.field(model[table_name], fld, self.path)
          }).concat(
        fields.filter(function(fld) { return fld.target })
          .map(function(fld) {          
            return new Node.relation(model[table_name], fld, self.path)         
          })
          .map(function(n,i,all) {
            if(n.group == undefined) {
              n.group = groupcount++;
              all.filter(function(d) { return d.core.field.target == n.core.field.target })
                .forEach(function(d) { d.group = n.group })
            }
            return n
          })
        ).concat( BackMap[table_name]
        .map(function(b) { 
          return new Node.subtable(b.table, b.field, self.path)
        }))
      }
      return this;
    }
    X.mixin({
      collectrels : function(rels) {
        var self = this;
        var elems = this.elements().filter(function(node) { return node.uniquepath() });
        elems
          .filter(function(node) { return node.isrelation() })
          .reduce(function(result, node) {
            result.push(node);           
            return result;
          }, rels)
        elems
          .filter(function(node) { return node.isrelation() && !node.dictionary })
          .reduce(function(result, node) {
            node.area.collectrels(result);
            return result;
          }, rels);

        return rels;       
      },
      collectnodes : function(nodes) {
        var self = this;
        nodes = nodes || [];
        var elems = this.elements().filter(function(node) { return node.uniquepath() });
        elems
          .filter(function(node) { return !node.issubtable() && !node.isrelation() })
          .reduce(function(result, node) {
            result.push(node);           
            return result;
          }, nodes)
        elems
          .filter(function(node) { return node.isrelation() })
          .reduce(function(result, node, i) {
            result.push(node);
            var grouprels = [];
            if(!node.dictionary) {
              node.area.collectrels(grouprels);
            }
            grouprels.forEach(function(d) { d.group = node.group; result.push(d)  })
            return result;
          }, nodes)
          return nodes;
      },
      check : function(node, used) {
        var name = node.core.table.$.name;
        return !( used[name] || !(used[name] = true) );       
      },
      collectsubs : function(used) {
        var self = this;
        var elems = this.elements();
        var nodes = elems
          .filter(function(node) {
            return node.issubtable() && node.uniquepath()            
          })
          .filter(function(node) {
            return self.check(node,used)
          })
        this.collectnodes()
          .filter(function(node) { return node.isrelation() && !node.dictionary })
          .reduce(function(result, rel) {
            rel.area.elements().filter(function(node) {
                return node.issubtable() && node.uniquepath();                
              })
              .filter(function(node) {
                return self.check(node,used)
              })
              .reduce(function(res, node) {
                res.push(node); 
                return res 
              }, result)
            return result;
          },nodes)
          return nodes;       
      },
      collectsortables : function() {
        var self = this;
        var elems = this.elements();
        return elems
          .filter(function(node) { return node.isfield() })
          .concat(elems.filter(function(node) { return node.isrelation() }))
      }
    },Area.prototype);

    Node.extender.prototype.expand = function()
    {
      if(this.turnon)
        navigator.gofull(this.core.path)
      else
        navigator.goroot(this.core.path)
        
      navigator.draw();
    }
    Node.history.prototype.expand = function()
    {
        this.region().collapseother();
        this.region().pack.set(this.pack);
        this.region().expand();
        navigator.draw();
    }
    Node.table.prototype.expand = 
    Node.subtable.prototype.expand =
    Node.relation.prototype.expand = function()
    {
      this.region().collapseother();
      if(this.region().expanded())
        this.region().pack.go( this );
      this.region().expand();
      navigator.draw();
    }
    var Pack = {
      base : function(node) {
        this.node = node;
        this.name = 'P.'+node.name;
        this.children = [ node ];
        this.history = [];
        this.content = function() { return  this.node.area.collectnodes() }
        return this;
      },
      extended : function(node) {
        this.node = node;
        this.name = 'P.'+node.name;
        this.children = [ node ];
        this.history = [];
        this.extended = true;
        this.content = function() {
          var elems = this.node.area.elements()
          return elems;
        }
      },
      sortable : function(node) {
        this.node = node;
        this.name = 'P.'+node.name;
        this.children = [ node ];
        this.history = [];
        this.content = function() {
          var elems = this.node.area.collectsortables()
          return elems;
        }
        this.expand = function() {
          var self = this;
          this.node.children = [ new Node.header(this.region().pack) ]
          .concat(        
            this.history.map(function(pack,i) {
              return new Node.history(pack,i)
            }).reverse()
          )
          .concat(this.content())
          this.node.children.forEach(function(n) { n.parent = self.node })
          this.node.children.forEach(function(n) { n.restrict( self.region().restriction ) })
        }
      }
    }
    var exPack = {
      region : function(reg) {
        if(arguments.length) {
          this._region_ = reg; 
          return this
        }
        return this._region_;
      },
      set : function(pack) {
        this.region().pack = pack; 
      },
      search : function(path) {
        if(this.node.core.path.toString()==path.toString())
          return this.node
        var found = this.node.children.filter(function(node) { 
          return node.core && node.core.path.toString()==path.toString()
        })
        if(found.length>1) throw "Many unique paths in pack"
        return found.length && found[0] || null
      },
      turnextended : function(turnon) {
        var pack = new (turnon ? Pack.extended : Pack.base)(this.node).region( this.region() );
        pack.history = this.region().pack.history.slice();
        this.set( pack );
      },
      go : function(node) {
        var pack = new (this.constructor)(node).region( this.region() );
        pack.history = this.region().pack.history.slice();
        pack.history.push(this.region().pack);
        this.set( pack );
      },
      origin : function() {
        if(this.history.length)
          this.set( this.history[0] )
      },
      expand : function() {
        var self = this;
        this.node.children = 
        ((this.node.isrelation() || this.node.issubtable()) ? 
          [new Node.relationfield(this.node) ] :[])        
        .concat(
          this.history.map(function(pack,i) {
            return new Node.history(pack,i)
          }).reverse()
        )
        .concat( [ new Node.extender(this.region().pack, !this.extended) ] )
        .concat(this.content())
        this.node.children.forEach(function(n) { n.parent = self.node })
        this.node.children.forEach(function(n) { n.restrict( self.region().restriction ) })
      },
      collapse : function() {
        delete this.node.children 
      },
      calculateradius : function(svg) {
        this.children.forEach(function(node) { 
          node.calculateradius(svg) 
        })
      }     
    }
    for(var i in Pack) { X.mixin(exPack, Pack[i].prototype) }

    function Region(root) {
      var self = this;
      this.root = root || self;
      this.astree = function(node, used) {
        used = used || {};
        this.name = 'R.'+node.name;
        this.pack = (new Pack.base(node)).region(this);
        this.children = node.area.collectsubs( used )
        .map(function(n) { return new Region(self.root).astree(n, used) })
        return this;
      }
      this.asmono = function(node, name) {
        this.name = name || ('R.'+node.name);
        this.pack = (new Pack.base(node)).region(this);
        this.children = [];
        return this;
      }
      this.assort = function(node, name) {
        this.name = 'R.'+node.name;
        this.pack = (new Pack.sortable(node)).region(this);
        this.children = [];
        return this;
      }
      this.collapseother = function() {
        this.root.collapse(this);
      }
      this.collapse = function(except) {
        if(!except || except != this) {
          delete this.fixed;
          this.pack.origin();
          this.pack.collapse();
        }
        this.children && this.children.forEach(function(region) { region.collapse(except) })
      }
      this.getexpanded = function() {
        if(this.expanded()) 
          return this
        else {
          return this.children && this.children
            .reduce(function(found, r) { 
              if(!found) 
                found = r.getexpanded(); 
              return found 
            }, null)
        }
      }
      this.expanded = function() { return this.fixed }
      this.expand = function() {
        this.fixed = true;
        this.pack.expand();
      }
      this.search = function(path) {
        var found = this.children.filter(function(region) {
          return region.pack.node.core.path.toString()==path.toString()
        })
        if(found.length>1) throw "Many unique paths among regions"
        return found.length && found[0] || null
      }
      this.setrestriction = function(restriction) {
        this.restriction = restriction;
        this.pack.node.restrict( restriction )
        this.children && this.children.forEach(function(r) { r.setrestriction(restriction) })
      }
      this.calculatedistance = function() {
        /*      
                          n     n  n
                          |     | /
                n         n     n - n
                 \        |    /
              n - n - n - R - n - n
                 /        |    \
                n         n     n
                         / \
                        n   n
        */
        function cleardistance(region) {
          delete region.distance;
          region.children && region.children.forEach(function(r) { cleardistance(r) })
        }
        cleardistance(this.root);
        function mark(region, distance) {
          if(region.distance==undefined) 
            region.distance = distance;
          region.children && region.children
            .forEach(function(r) {
              if(r.children)
                mark(r, distance+1)
              else
                if(r.distance==undefined)
                  r.distance = distance + 1;
            })
        }
        mark(this, 0);
        var region = this;
        var distance = 1;
        while(region = region.parent) {
          mark(region, distance++);
        }
      }
      return this;
    }
    this.go = function(region, path, offset) {
      region.expand();
      for(var i = offset; i<path.size(); ++i) {
        var node = region.pack.search(path.subpath(0,i+1));
        if(!node) throw "Path is not exist in current pack";
        if(node.expand) {
          if(region.expanded())
            region.pack.go( node );
          region.expand();
        }
      }
    }
    this.goroot = function(path) {
      var current = this.region && this.region.root.getexpanded();
      this.region = new Region()
          .astree( new Node.table( this.model[this.ctx.root], this.ctx ) );          
      this.region.setrestriction( this.restriction );     
      if(path) {
        var region = this.region;
        var cut = path.cutblocks();
        var offset = 0;        
        for(var i=0;i<cut.length;++i) {
          region = region.search( path.subpath(0, cut[i]+1) );
          offset = cut[i];
          if(!region) {
            this.gofull(path, current && current.name)
            return;
          }                 
        }
        this.go(region, path, offset+1);
      } else {
        this.region.expand();
      }
    }
    this.gofull = function(path, name) {
      var current = this.region && this.region.root.getexpanded();
      this.region = new Region()
          .asmono(new Node.table( this.model[this.ctx.root], this.ctx ), 
            name || current && current.name);
      this.region.setrestriction( this.restriction );
      this.region.pack.turnextended(true);
      this.go(this.region, path, 1 );
    }
    this.gosortable = function(path) {
      var current = this.region && this.region.root.getexpanded();
      this.region = new Region()
        .assort(new Node.table( this.model[this.ctx.root], this.ctx ),
          current && current.name);
      this.go(this.region, path, 1 );
    }
    this.setactive = function(path) {
      this.setrestriction(path);
      this.goroot(path)   
    }
    this.setrestriction = function(path) { 
      if(path)
        this.restriction = path
      else
        delete this.restriction
    }
    this.goroot();
  }
  X.mixin({
    preparedata : function(svg) {
      var self = this;
      this.width = d3.select("body").node().offsetWidth
      this.height = Math.max(d3.select("body").node().offsetHeight*0.5, this.width*0.5)
      this.tree = d3.layout.tree()
        .size([this.width,this.height]);
      this.regionnodes = this.tree.nodes( this.region );
      this.regionnodes
        .filter(function(r) { return r.expanded() })
        .forEach(function(r) { r.calculatedistance() })     
      this.regionnodes.forEach(function(d,i,arr) {
        if(d.expanded()) {
          d.x = self.width/2; d.y = self.height/2
        } else {
          d.x = self.width/2 + self.width/2*d.distance*Math.cos(2*Math.PI*i/arr.length);
          d.y = self.height/2 + self.height/2*d.distance*Math.sin(2*Math.PI*i/arr.length);
        }
      })
      this.regionnodes.forEach(function(reg){
        var pack = d3.layout.pack()
            .padding(5)
            .radius(function(value) { return value })
            .sort(null)

        reg.pack.calculateradius(svg)

        reg.packnodes = pack.nodes( reg.pack );

        reg.pathlinks = reg.packnodes
          .filter(function(n) { return n.type=='history'})
          .sort(function(a,b) { return a.idx - b.idx })
          .concat( reg.packnodes.filter(function(n) { return n.type=='relationfield'}) )
          .concat( reg.packnodes.filter(function(n) { return n.type=='header'}) )
          .map(function(n,i,all) {
            if((i+1)<all.length) {
              var padding = {n1: 15, n2:5};
              var n1 = n, n2 = all[i+1], Q;
              if(n2.core.reverse) {
                n1 = n2; n2 = n;
              }              
              var L = Math.sqrt(Math.pow(n2.x-n1.x,2)+Math.pow(n2.y-n1.y,2))
              Q = (n1.r - padding.n1)/(L - n1.r + padding.n1);
              var x1 = (n1.x+n2.x*Q)/(1+Q)
              var y1 = (n1.y+n2.y*Q)/(1+Q)
              Q = (L - n2.r + padding.n2)/(n2.r - padding.n2);
              var x2 = (n1.x+n2.x*Q)/(1+Q)
              var y2 = (n1.y+n2.y*Q)/(1+Q)                   
              return { x1:x1, y1:y1, x2:x2, y2:y2 }
            }
            return;
          })
          .filter(function(p) { return p })
      })
      this.regionlinks = this.tree.links( this.regionnodes );
    },
    draw : function() {
      var self = this;
      var nav = d3.select(this.container)
        .selectAll("[navigator]")
        .data([{}]);
      var new_nav = nav
        .enter()
        .append("div")
          .attr("navigator","")
      nav.exit().remove();

      var svg = nav
        .selectAll("svg")
        .data([{}]);
      var new_svg = svg
        .enter()
        .append("svg")
          
      this.preparedata(svg);

      new_svg
        .attr("width", this.width)
        .attr("height", this.height)

      this.gradients(svg);

      new_svg.append("g")
        .attr("canvas","")

      svg.exit().remove();

      svg
        .on("click", function() {
          d3.event.stopPropagation();
          self.editor.deactivate();
          self.editor.draw();
        })
      
      var canvas = svg.select("[canvas]");
      var diagonal = d3.svg.diagonal();
      var color = d3.scale.category10();

      var linkcont = canvas.selectAll("[linkcont]").data([{}])
      linkcont.enter().append("g").attr("linkcont","")
      linkcont.exit().remove();

      var link = linkcont.selectAll("[region-link]")
        .data(self.regionlinks)

      var new_link = link
      .enter().append("path")
        .attr("region-link", "")
        .attr("d", diagonal )

      link.exit().remove()

      var region = canvas.selectAll("[qe-region]")
        .data( self.regionnodes, function(d) { 
          return d.name 
        } );

      var new_region = region
        .enter()
        .append("g")
          .attr("qe-region","")
          .attr("transform", function(d) { 
            return "translate(" + d.x + "," + d.y + ")"; 
          })
      new_region
        .append("g")
          .attr("node-cont","")

      new_region
        .append("g")
          .attr("path-link-cont","")

      region.exit().remove();

      region
        .attr("expanded", function(reg) { return reg.expanded() || null })


      var node = region.select("[node-cont]").selectAll("[qe-node]")
        .data(function(reg) {
          return reg.packnodes; 
        }, function(node) {
          return node.name 
        } );
      
      var new_node = node.enter().append("g")
        .attr("qe-node", "")
        
      new_node.append("circle")
          .attr("qe-node-circle", "")
          .attr("r", 0)
      
      new_node
        .filter(function(n) { return n.type=="extender" })         
          .append("path")
            .attr("star","")
            .attr("d","M 332.25647,385.51933 L 217.94322,325.58331 L 103.76342,385.77314 L 125.44132,258.53357 L 32.91382,168.54182 L 160.62472,149.83945 L 217.61942,34.031678 L 274.87122,149.71255 L 402.62329,168.13113 L 310.29602,258.32822 L 332.25647,385.51933 z")            
            .attr("transform",function(n) {
              return "translate("+(-n.r)+","+(-n.r)+") scale(0.14)"
            })

      node.filter(function(n) { return n.type=="extender" })
        .select("path")
            .attr("style",function(n) { 
              return n.turnon ? "fill:url(#l-star-on)" : "fill:url(#l-star-off)"
            })
      
      new_node
        .filter(function(n) { return n.type!="extender" })
          .append("text")


      node.exit().remove();

      node.order();      

      node
        .attr("node-type",function(n) { return n.type || null })
        .attr("turnon", function(n) { return n.turnon })
        .attr("rel-group", function(n) { return n.group })
        .attr("node-root", function(n) { return n.depth==1 || null })
        .attr("restricted", function(n) { return n.restricted || null })

      node.filter(function(n) { return n.depth>=1 && n.expand })
        .on("click", function(n) {
          d3.event.stopPropagation();
          if(!n.restricted) n.expand()        
        })
      node.filter(function(n) { return n.depth>1 && !n.expand })
        .on("click", function(n) {
          d3.event.stopPropagation();
          self.editor.addcore(n.core);                   
        })

      var circle = node.select("[qe-node-circle]")

      circle.attr("r", function(node) { return node.r })

      var relfill = d3.scale.ordinal()
        .range(["l-red","l-orange","l-yellow","l-green","l-cyan","l-blue","l-violet","l-brown"])      
      
      circle
        .filter(function(node) { return node.type=='relation' && node.group!=undefined })
        .attr("fill",function(node) { return "url('#"+relfill(node.group)+"')" } )
      
      circle
        .filter(function(node) { return node.type=='table' })
        .attr("fill", "url('#l-root')")

      circle
        .filter(function(node) { return node.depth==0 })
        .attr("fill", "url('#r-canvas')")

      circle
        .filter(function(node) { return node.type=="subtable" })
        .attr("fill", "url('#l-subtable')")

      circle
        .filter(function(node) { return node.type=="extender" && node.turnon})
        .attr("fill", "url('#l-extender-on')")

      circle
        .filter(function(node) { return node.type=="extender" && !node.turnon})
        .attr("fill", "url('#l-extender-off')")

      circle
        .filter(function(node) { return node.type=="header"})
        .attr("fill", "url('#l-header')")

      circle
        .filter(function(node) { return node.type=="history" })
        .attr("fill", "url('#l-history')")

      circle
        .filter(function(node) { return node.type=="relationfield" })
        .attr("fill", "url('#l-relationfield')")


      node.select("text")
        .style("text-anchor", "middle")
        .each(function(d) { d.drawtext && d.drawtext(d3.select(this)) })
       
      var pathlink = region.select("[path-link-cont]").selectAll("[path-link]")
        .data(function(r) { return r.pathlinks })

      pathlink.enter()
        .append("path")
          .attr("path-link","")
          .attr("d", "M0,0L0,0")       
      
      pathlink.exit().remove();

      pathlink
        .transition().duration(750)
        .attr("d", function(p) {
            return "M"+p.x1+' '+p.y1+'L'+p.x2+' '+p.y2;
          })
        .attr("style","marker-end: url(#markerarrow)")


      function collide(node) {
        var r = node.pack.r+16,
            nx1 = node.x - r,
            nx2 = node.x + r,
            ny1 = node.y - r,
            ny2 = node.y + r;
        return function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== node)) {
            var x = node.x - quad.point.x,
                y = node.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = node.pack.r + quad.point.pack.r;
            if (l < r) {
              l = (l - r) / l * .5;
              node.x -= x *= l;
              node.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        };
      }
      var force = d3.layout.force()
        .charge(function(reg, i) {
          return -Math.max(100,reg.pack.r)*Math.max(100,reg.pack.r)/(3*(reg.depth+1)) 
        })
        .linkDistance(function(lnk,i) {
          return lnk.source.pack.r + lnk.target.pack.r;
        })
        .size([this.width, this.height])
        //.gravity(0.2)
        .on("tick", function(e) {
          var q = d3.geom.quadtree(self.regionnodes),
              i = 0,
              n = self.regionnodes.length;

          while (++i < n) q.visit(collide(self.regionnodes[i]));
          
          /*region
            .attr("transform", function(d) { 
              return "translate(" + d.x + "," + d.y + ")"; 
            })
          link
            .attr("d", diagonal )*/
        })

      force
        .nodes(self.regionnodes)
        .links(self.regionlinks)

      //force changes x and y
      force.start();
      for(var i=0;i<1000;i++) force.tick()
      force.stop();
      
      var oldtrans = [];
      region.each(function() { 
        oldtrans.push(d3.select(this).attr("transform") )
      })
      var oldlink = [];
      link.each(function() { 
        oldlink.push(d3.select(this).attr("d"))
      })
      var oldnode = {};
      node.each(function(d) { 
        oldnode[d.name] = d3.select(this).attr("transform") 
      })

      region
        .attr("transform", function(d) { 
            return "translate(" + d.x + "," + d.y + ")"; 
          })
      link
        .attr("d", diagonal )
      node
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

      this.fit(svg, canvas)

      region
        .attr("transform",function(d,i) { return oldtrans[i] })
      link
        .attr("d", function(d,i) { return oldlink[i] })
      node
        .attr("transform", function(d) { return oldnode[d.name] })

      region
        .transition().duration(750)
          .attr("transform", function(d) { 
            return "translate(" + d.x + "," + d.y + ")"; 
          })
      link
        .transition().duration(750)
          .attr("d", diagonal )
      node
        .transition().duration(750)
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    },
    fit : function(svg, container) {
      var oldVB = svg
          .attr("viewBox");

      var sR = svg.node().getBoundingClientRect();
      svg
          .attr("viewBox","0 0 "+sR.width+" "+sR.height)
      
      var R = container.node().getBoundingClientRect();
      var cx = R.left-sR.left;
      var cy = R.top-sR.top;
      var W = R.width;
      var H = R.height;
      svg
          .attr("viewBox",oldVB)
      if(!W && !H) {
          cx = -10000;
          cy = -10000;
          W = 20000;
          H = 20000;
      }
      svg
      .transition().duration(750)
          .attr("viewBox",cx+" "+cy+" "+W+" "+H)
    },
    gradients : function(svg) {
      var defs = svg.selectAll("defs")
        .data([{}])
      var new_defs = defs
        .enter()
        .append("defs")
      defs.exit().remove();

      //var gradients = drawgradients( svg.append("defs") );
      /*<defs>
          <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
          </linearGradient>
        </defs>*/
      var radialGradients = d3.scale.ordinal()
        .range( ["r-canvas"] );
          
      var rgrad =defs.selectAll("radialGradient")
        .data( radialGradients.range() )

      var new_rgrad = rgrad.enter()
        .append("radialGradient")
          .attr("id", function(d,i) { return d })
          .attr("cx", "0.5")
          .attr("cy", "0.5")
          .attr("r", "0.5")
          .attr("fx","0.5")
          .attr("fy","0.5")
          //.attr("fx", "0.25")
          //.attr("fy", "0.25");
      
      new_rgrad.append("stop")
        .attr("offset", "0%")
        .attr("class", "stop0")
      
      new_rgrad.append("stop")
        .attr("offset", "80%")
        .attr("class", "stop80")

      new_rgrad.append("stop")
        .attr("offset", "100%")
        .attr("class", "stop100")
      
      var linearGradients = d3.scale.ordinal()
        .range( [
          "l-root",
          "l-subtable",
          "l-extender-off",
          "l-extender-on",
          "l-relationfield",
          "l-star-on",
          "l-star-off",
          "l-header",
          "l-history",
          "l-red",
          "l-orange",
          "l-yellow",
          "l-green",
          "l-cyan",
          "l-blue",
          "l-violet",
          "l-brown"
          ] );

      var lgrad = defs.selectAll("linearGradient")
        .data( linearGradients.range() )

      var new_lgrad = lgrad.enter()
        .append("linearGradient")
          .attr("id", function(d,i) { return d })
          .attr("x1", "0")
          .attr("y1", "100%")
          .attr("x2", "0%")
          .attr("y2","0%");

      
      new_lgrad.append("stop")
        .attr("offset", "0%")
        .attr("class", "stop0")
      
      new_lgrad.append("stop")
        .attr("offset", "100%")
        .attr("class", "stop100")
      /*
      <marker id="markerArrow" markerWidth="13" markerHeight="13" refX="2" refY="6"
       orient="auto">
        <path d="M2,2 L2,11 L10,6 L2,2" style="fill: #000000;" />
      </marker>
      */
      var marker = defs.selectAll("marker")
        .data( ["markerarrow"] )

      marker.enter()
        .append("marker")
          .attr("id",function(d) { return d })
          .attr("markerWidth",15)
          .attr("markerHeight",15)
          .attr("refX",4)
          .attr("refY",2)
          .attr("orient","auto")
        .append("path")
          .attr("d","M0,0L1,2L0,4L6,2Z")

    }
  },Engine.Navigator.prototype)

})(QE10SQL);

var QE10PATH = (function(Engine) {        
  Engine.Core = {
    field : function(path) {
      this.path = new Engine.Path().copy(path);
      this.make = function(table, field) {
        this.table = table;
        this.field = field;
        this.direct = true;
        this.path.add(this);
        return this;
      }
      this.parse = function(strpath) {        
        strpath = strpath.replace(/^((?:[a-z]|ext)\.)/i,"")
        var field_name = strpath.match(/([^.]+)$/)[1];
        var table,field;
        if(strpath != field_name) {
          var core = new Engine.Core
            .relation(this.path)
            .parse(strpath.substr(0, strpath.length - field_name.length - 1));

          this.path = core.path;
          table = this.path.ctx.model[ core.field.target ];
        } else {
          table = this.path.lastelement().table;
        }
        field = table[ field_name ];
        this.make( table,field );
        return this;       
      }
      this.print = function() {
        var path = this.path.last().nodes().map(function(d) { return d.field.$.name });
        path.unshift("a")
        return path.join(".")
      }
      //this.toString = function() {
      //  return "["+this.table.$.name + ':' + this.field.$.name+"]";
      //}
      return this;
    },
    relation : function(path) {
      this.path = new Engine.Path().copy(path);
      this.make = function(table, field) {
        this.table = table;
        this.field = field;
        this.direct = true;
        this.path.add(this);
        return this;
      }
      this.parse = function(strpath) {
        strpath = strpath.replace(/^((?:[a-z]|ext)\.)/i,"")
        strpath = strpath.split('.');
        var table = this.path.lastelement().table, field;
        while(strpath.length && strpath[0]) {          
          field = table[strpath.shift()];
          if(field.target) {
            var node = new Engine.Core.relation(this.path);            
            if(!strpath.length) {
              this.make( table, field )
            } else {
              node.make( table, field );
              this.path = node.path
            }            
            table = this.path.ctx.model[field.target]; 
          }     
        }
        return this;
      }
      this.print = function() {
        var path = this.path.last().nodes().map(function(d) { return d.field.$.name });
        path.unshift("a")
        return path.join(".")
      }
      this.key = function() {
        var self = this;
        return this.pk().map(function(pk) { return self.print()+'.'+pk })
      }
      this.pk = function() {
         return this.path.ctx.model[this.field.target].$.pk; 
      }
      //this.toString = function() {
      //  return "["+this.table.$.name + ':' + this.field.$.name+"].["+this.field.target+"]" 
      //}
      return this;
    },
    subtable : function(path) {
      this.path = new Engine.Path().copy(path);
      this.make = function(table, field) {
        this.table = table;
        this.field = field;
        this.reverse = true;
        this.path.add(this);
        return this;
      }
      this.parse = function(joinpath, table_name, field_name) {
        this.path = new Engine.Core.relation(this.path).parse(joinpath).path;
        field_name = field_name.split('.');
        if(field_name[0].match(/^([a-z]|ext)$/i))
          field_name.shift();
        if(field_name.length!=1) throw "Bad syntax in field string in subquery";
        this.make( this.path.ctx.model[table_name], this.path.ctx.model[table_name][field_name[0]] )
        return this;
      }
      this.caption = function() {
        function pathcaption(path) {
          return path.map(function(p) { 
            return p.field.recaption || ('*'+p.field.$.name)
          }).join(' ').toLowerCase();
        }
        var path = this.path.last().nodes();
        var back = path.pop();
        return {
        who: ('у '+pathcaption(path.reverse())+' которых есть ').toLowerCase(),
        what: back.field.sicaption.toLowerCase() 
        || '*'+(back.table.$.caption || (back.table.$.name+'*')) 
           };
      }
      //this.toString = function() { 
      //  return "["+this.table.$.name + ':' + this.field.$.name+"].["+this.table.$.name+"]"  
      //}
      return this;
    },
    table : function(ctx) {
      this.path = new Engine.Path(ctx)
      this.make = function(table) { 
        this.table = table;
        this.path.add(this);        
        return this;
      }
      this.parse = function(table_name) {
        this.make(ctx.model[table_name]);
        return this;
      }
      this.toString = function() { return "["+this.table.$.name+"]" }
      return this;
    }
  }
  var exCore = {  
    toString : function() { return "["+this.table.$.name + '.' + this.field.$.name+"]" },
    issubtable : function() { return this.type=="subtable" },
    isrelation : function() { return this.type=="relation" },
    isfield : function() { return this.type=="field" },
    istable : function() { return this.type=="table" },
    caption : function() {
      function pathcaption(path) {
        return path.map(function(p) { 
          return p.field.recaption || ('*'+p.field.$.name)
        }).join(' ').toLowerCase();
      }
      var path = this.path.last().nodes().reverse();
      return ((path[0].field.caption || ('*'+path[0].field.$.name)) 
        + ' ' + pathcaption(path.slice(1)))
        .toLowerCase()
        .replace(/^\s+/,'')
        .replace(/\s+$/,'');
    }    
  }
  for(var i in Engine.Core) {
    Engine.Core[i].prototype.type = i;
    X.mixin(exCore, Engine.Core[i].prototype);
  }

  Engine.Path = function(ctx) {
    var self = this;
    this._path_ = [];
    this.ctx = ctx;
    this.create = function(ctx,path) 
    {
      this._path_ = path;
      this.ctx = ctx;
      return this;
    }
    this.copy = function(path) {
      this._path_ = path._path_.slice();
      this.ctx = path.ctx;
      return this;
    }
    this.add = function(node) {
      this._path_.push( node );
      return this;
    }
    this.strpath = function() {
      return this._path_.map( function(d) { return d.toString() } )
    }
    this.toString = function() {
      return this.strpath().join('.');
    }
    this.hasdict = function() {
      return this._path_.filter(function(p) { return p.reverse && self.ctx.model[p.field.target].$.dict }).length
    }
    this.unique = function() {
      var p = this.strpath().sort();
      for(var i=0;i<p.length-1;++i) {
        if(p[i]==p[i+1]) 
          return false
      }
      return true;
    }
    /*this.unique = function() {
      var p = this.strpath().reduce(function(R, p) { 
        p.split('.').forEach(function(x) { R.push(x) })       
        return R;
      },[]).sort();
      for(var i=0;i<p.length-1;++i) {
        if(p[i]==p[i+1]) 
          return false
      }
      return true;
    }*/
    this.size = function() { return this._path_.length }
    this.at = function(i) { return this._path_[i] }
    this.lastelement = function() { return this._path_[this._path_.length-1] }
    this.nodes = function() { 
      return this._path_.filter(function(d) { return !d.istable() })
    }
    this.last = function() {
      if(!this._path_.length) throw "Last() called in empty path";
      var path = [ this.lastelement() ];
      for(var i = this._path_.length - 2;i>=0;--i) {
        if(!this._path_[i].direct) break;
        path.unshift(this._path_[i]);
      }
      return new Engine.Path().create(this.ctx, path)
    }
    this.subpath = function(from, count) {
      count = count == undefined ? (this._path_.length - 1 - from) : count;
      return new Engine.Path().create(this.ctx, this._path_.slice(from, from+count))
    }
    this.cutblocks = function() {
      //(TDDDDDR)(DDR)(DDMD)
      return this._path_.reduce(function(result, p, i) {
        if(p.reverse)
          result.push(i); 
        return result 
      },[]);
    }
  }
  return {}
})(QE10SQL)

var QE10 = (function(Engine) {
 /* function close() {
    d3.select(".qe-editor").attr("hidden", 1);
    d3.select("[qe-start]").attr("hidden", null);
  }*/ 
  Engine.Source = {
    filterdef : function(ctrl) {
      this.qe = ctrl.attrUpward('filter_def').qe;
      this.sql = function() {
        return this.qe.cmd
      }
      this.arguments = function() {
        return this.qe.args
      }
      this.apply = function(sql, args) {
        ctrl.attrUpward('filter_def').qe = 
        { 
          cmd: sql, 
          args: args 
        }
        applyFuncFilterT(ctrl);
      }
    },
    uri : function(ctx) {
      this.sql = function() {
        return window.document.location.search.URLParam('cmd', "").replace(/^\*/i, '')
      }
      this.arguments = function() {
        return QEUtils.getURLArgs( window.document.location.search )
      }
      this.apply = function(sql, args) {
        var uri = window.document.location.search;
        uri = QEUtils.setFilter(uri, sql, args );
        QEUtils.reload( uri );
      }
    },
    test : function(sql) {
      this.sql = function() { return sql }
      this.arguments = function() { return [1,2,3,4,5,6,7,8,9,10,11,12,13,14]}
    }
  }
  function show(ctrl) {
    var ctx = {
      model : window.QEMODEL,
      root: ctrl.A("qe-root"),
      source : ctrl.attrUpward('filter_def') ? new Engine.Source.filterdef(ctrl) : new Engine.Source.uri(),
      button : ctrl,
      container : ctrl.evalHere('@qe-output'),
      buttoncontainer : ctrl.evalHere('@qe-hide')
    }
    if(!ctx.container)
      alert('Output container for QE is not found. Fill "qe-output" attribute properly.');
    new QueryEditor(ctx).draw();  
  }
  
  function QueryEditor(ctx) {
    var self = this;
    this.container = d3.select(ctx.container).attr("qe-editor","");    
    this.model = Engine.parse(ctx.source.sql(), ctx);
    this.navigator = new Engine.Navigator(this.container.node(), this.model, ctx, this);
    this.controller = new Engine.Controller(this.container.node(), this.model, ctx, this);      
    this.apply = function() {
      ctx.source.apply(Engine.print(self.model), Engine.args(self.model));
      this.close();
      //alert(Engine.args(self.model).join(', '))
    }
    this.close = function() {
      this.container.attr("hidden","");
      ctx.buttoncontainer && d3.select(ctx.buttoncontainer).attr("hidden",null);
      this.container.selectAll("*").remove();
      d3.select(ctx.button).style("display",null);
    }    
    this.draw = function() {      
      this.container.attr("hidden",null);   
      ctx.buttoncontainer && d3.select(ctx.buttoncontainer).attr("hidden","");
      this.navigator.draw();
      this.controller.draw();      
      d3.select(ctx.button).style("display","none");
    }
    this.selectblock = function(block, or) {
      if(block.isactive(or)) {
        this.deactivate();        
      }        
      else {
        block.activate(or);
        this.navigator.setactive( block.path )
      }
      this.draw();   
    }
    this.deactivate = function() {
      this.controller.deactivate();
      this.navigator.setactive();
    }
    this.selectsort = function(order, entry) {
      if(order.isactive(entry)) {
        this.deactivate(); 
      } else {
        order.activate(entry);
        this.navigator.gosortable(entry && entry.core.path || order.path);
      }
      this.draw();
    }
    this.addcore = function(core) {
      if(this.controller.activeblock && this.container.selectAll("[controller] [active]").empty()) {
        this.controller.deactivate()
      }        
      (this.controller.activeblock || this.model["WHERE"])
        .addcore(core, this.controller.activesubblock)
    }    
    return this;
  }
  function test() {
    Engine.test();
    var htmltests = [
      "WHERE /*S*/EXISTS(SELECT 1 FROM enrf_taskers WHERE a.enrel_taskw.join AND (/*S*/EXISTS(SELECT 1 FROM enpn2persons WHERE a.enflw.join.ext.enrel_personw AND (a.enpnw=?)))) AND a.enf_namew=? ORDER BY a.enf_numberw DESC, a.enf_namew DESC",
      "WHERE a.enrel_contestw.enrel_typew.enf_namew<>?  and a.enrel_contestw=? and a.enrel_applicantw.enf_fw=? or a.enf_numberw is null and /*S*/EXISTS(SELECT 1 FROM enrf_stages WHERE a.enrel_taskw.join AND (a.enrel_taskw.enrel_contestw.enrel_typew<>? and a.enf_moneyw>? and a.enf_a_yearw=? or /*S*/EXISTS(SELECT 1 FROM enrf_expertises WHERE a.enrel_taskw.join and (/*S*/EXISTS(SELECT 1 FROM enrf_tasks WHERE a.enrel_applicantw.join.enrel_personw))) and /*S*/EXISTS(SELECT 1 FROM enrf_expertises WHERE a.enrel_taskw.join ) or /*S*/EXISTS(SELECT 1 FROM enrf_expertises WHERE a.enrel_taskw.join and (a.enf_agrw=?)))) and a.enrel_contestw.enf_yearw=?"
        ];
    try {
      for(var i=0;i<htmltests.length;++i) {
        var ctx = {
          model : test_qe_model,
          source: new Engine.Source.test(htmltests[i]),
          root: test_qe_params.root,
          button : null
        }       
        new QueryEditor(ctx).draw();          
      }
    } catch(e) {
      document.write("Error stack: ")
      document.write(e.stack);
    }
  }
  return {
    show: show,
    test: test
  }
})(QE10SQL);


//if("G_regEvent" in window)
//  G_regEvent('load', false, function() {
//    d2.SA("[qe-start]")
//      .A("onclick", "QE10.show(this)");
//})

QEUtils = {
  clearURLArgs : function ( url ) { return url.replace(/[?&]args\[\]=([^&]*)/g, "") },
  setFilter : function(uri, command, args) {
    uri = QEUtils.clearURLArgs( uri );
    uri = uri.setURLParam('cmd', command.length ? ('*'+command) : '');
    for(var i = 0; i < args.length; ++i)
      uri += '&args[]=' + encodeURIComponent( args[i] );
    return uri;
  },
  getURLArgs : function( url )
  {
    var arg;
    var re = /[?&]args\[\]=([^&]*)/g;
    var args = [];
    while( (arg =  re.exec(url)) != null ) {
      args.push(decodeURIComponent( arg[1] ));
    }
    return args;
  },
  reload : function( uri ) { window.document.location.search = uri }
}

var QE10D3 = (function() {
    /* hierarchy start */
    d3.layout.hierarchy = function() {
    var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren, value = d3_layout_hierarchyValue;
    function hierarchy(root) {
      var stack = [ root ], nodes = [], node;
      root.depth = 0;
      while ((node = stack.pop()) != null) {
        nodes.push(node);
        if ((childs = children.call(hierarchy, node, node.depth)) && (n = childs.length)) {
          var n, childs, child;
          while (--n >= 0) {
            stack.push(child = childs[n]);
            child.parent = node;
            child.depth = node.depth + 1;
          }
          if (value) node.value = 0;
          node.children = childs;
        } else {
          if (value) node.value = +value.call(hierarchy, node, node.depth) || 0;
          delete node.children;
        }
      }
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var childs, parent;
        if (sort && (childs = node.children)) childs.sort(sort);
        if (value && (parent = node.parent)) parent.value += node.value;
      });
      return nodes;
    }
    hierarchy.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return hierarchy;
    };
    hierarchy.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return hierarchy;
    };
    hierarchy.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return hierarchy;
    };
    hierarchy.revalue = function(root) {
      if (value) {
        d3_layout_hierarchyVisitBefore(root, function(node) {
          if (node.children) node.value = 0;
        });
        d3_layout_hierarchyVisitAfter(root, function(node) {
          var parent;
          if (!node.children) node.value = +value.call(hierarchy, node, node.depth) || 0;
          if (parent = node.parent) parent.value += node.value;
        });
      }
      return root;
    };
    return hierarchy;
  };
  function d3_layout_hierarchyRebind(object, hierarchy) {
    d3.rebind(object, hierarchy, "sort", "children", "value");
    object.nodes = object;
    object.links = d3_layout_hierarchyLinks;
    return object;
  }
  function d3_layout_hierarchyVisitBefore(node, callback) {
    var nodes = [ node ];
    while ((node = nodes.pop()) != null) {
      callback(node);
      if ((children = node.children) && (n = children.length)) {
        var n, children;
        while (--n >= 0) nodes.push(children[n]);
      }
    }
  }
  function d3_layout_hierarchyVisitAfter(node, callback) {
    var nodes = [ node ], nodes2 = [];
    while ((node = nodes.pop()) != null) {
      nodes2.push(node);
      if ((children = node.children) && (n = children.length)) {
        var i = -1, n, children;
        while (++i < n) nodes.push(children[i]);
      }
    }
    while ((node = nodes2.pop()) != null) {
      callback(node);
    }
  }
  function d3_layout_hierarchyChildren(d) {
    return d.children;
  }
  function d3_layout_hierarchyValue(d) {
    return d.value;
  }
  function d3_layout_hierarchySort(a, b) {
    return b.value - a.value;
  }
  function d3_layout_hierarchyLinks(nodes) {
    return d3.merge(nodes.map(function(parent) {
      return (parent.children || []).map(function(child) {
        return {
          source: parent,
          target: child
        };
      });
    }));
  }
  /* hierarchy end */
  d3.layout.rpack = function() {
    var hierarchy = d3.layout.hierarchy().sort(d3_layout_rpackSort), padding = 0, size = [ 1, 1 ], rx, ry, radius;
    function rpack(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], w = size[0], h = size[1],     
      r_x = rx == null ? Math.sqrt : typeof rx === "function" ? rx : function() {
        return rx;
      },
      r_y = ry == null ? Math.sqrt : typeof ry === "function" ? ry : function() {
        return ry;
      };
      root.x = root.y = 0;
      d3_layout_hierarchyVisitAfter(root, function(d) {
        d.r_x = +rx(d.value);
        d.r_y = +ry(d.value);
      });
      d3_layout_hierarchyVisitAfter(root, d3_layout_rpackSiblings);
      if (padding) {
        var drx = padding * (rx ? 1 : 2 * root.rx / w) / 2;
        var dry = padding * (ry ? 1 : 2 * root.ry / h) / 2;
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r_x += drx;
          d.r_y += dry;
        });
        d3_layout_hierarchyVisitAfter(root, d3_layout_rpackSiblings);       
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r_x -= drx;
          d.r_y -= dry;
        });
      }
      d3_layout_rpackTransform(root, w / 2, h / 2, radius ? 1 : 1 / Math.max(2 * root.r / w, 2 * root.r / h));
      d3_layout_rpackTransform(root, w / 2, h / 2, 
        rx ? 1 : 1 / 2 * root.r_x / w,
        ry ? 1 : 1 / 2 * root.r_y / h);
      return nodes;
    }
    rpack.size = function(_) {
      if (!arguments.length) return size;
      size = _;
      return rpack;
    };
    rpack.rx = function(_) {
      if (!arguments.length) return rx;
      rx = _ == null || typeof _ === "function" ? _ : +_;
      return rpack;
    };
    rpack.ry = function(_) {
      if (!arguments.length) return ry;
      ry = _ == null || typeof _ === "function" ? _ : +_;
      return rpack;
    };
    rpack.padding = function(_) {
      if (!arguments.length) return padding;
      padding = +_;
      return rpack;
    };
    return d3_layout_hierarchyRebind(rpack, hierarchy);
  };
  function d3_layout_rpackSort(a, b) {
    return a.value - b.value;
  }
  function d3_layout_rpackInsert(a, b) {
    var c = a._pack_next;
    a._pack_next = b;
    b._pack_prev = a;
    b._pack_next = c;
    c._pack_prev = b;
  }
  function d3_layout_rpackSplice(a, b) {
    a._pack_next = b;
    b._pack_prev = a;
  }
  function d3_layout_rpackIntersects(a, b) {
    var aleft = a.x - a.r_x, aright = a.x + a.r_x,
    atop = a.y - a.r_y, a.bottom = a.y + a.r_y,
    bleft = b.x - b.r_x, bright = b.x + b.r_x,
    btop = b.y - b.r_y, b.bottom = b.y + b.r_y;
    return aleft < bright && aright < bleft && atop < bbottom && abottom > btop;
   

    var dx = b.x - a.x, dy = b.y - a.y, dr = a.r + b.r;
    return .999 * dr * dr > dx * dx + dy * dy;
  }
  function d3_layout_rpackSiblings(node) {
    if (!(nodes = node.children) || !(n = nodes.length)) return;
    var nodes, xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, a, b, c, i, j, k, n;
    function bound(node) {
      xMin = Math.min(node.x - node.r_x, xMin);
      xMax = Math.max(node.x + node.r_x, xMax);
      yMin = Math.min(node.y - node.r_y, yMin);
      yMax = Math.max(node.y + node.r_y, yMax);
    }
    nodes.forEach(d3_layout_rpackLink);
    a = nodes[0];
    a.x = -a.r_x;
    a.y = 0;
    bound(a);
    if (n > 1) {
      b = nodes[1];
      b.x = b.r_x;
      b.y = 0;
      bound(b);
      if (n > 2) {
        c = nodes[2];
        d3_layout_rpackPlace(a, b, c);
        bound(c);
        d3_layout_rpackInsert(a, c);
        a._pack_prev = c;
        d3_layout_rpackInsert(c, b);
        b = a._pack_next;
        for (i = 3; i < n; i++) {
          d3_layout_rpackPlace(a, b, c = nodes[i]);
          var isect = 0, s1 = 1, s2 = 1;
          for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
            if (d3_layout_rpackIntersects(j, c)) {
              isect = 1;
              break;
            }
          }
          if (isect == 1) {
            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
              if (d3_layout_rpackIntersects(k, c)) {
                break;
              }
            }
          }
          if (isect) {
            if (s1 < s2 || s1 == s2 && (b.r_x < a.r_x && b.r_y < a.r_y)) d3_layout_rpackSplice(a, b = j); else d3_layout_rpackSplice(a = k, b);
            i--;
          } else {
            d3_layout_rpackInsert(a, c);
            b = c;
            bound(c);
          }
        }
      }
    }
    var cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2, crx = 0, cry = 0;
    for (i = 0; i < n; i++) {
      c = nodes[i];
      c.x -= cx;
      c.y -= cy;
      crx = Math.max(crx, c.r_x + c.x)
      cry = Math.max(cry, c.r_y + c.y)
    }
    node.r = cr;
    node.r_x = crx;
    node.r_y = cry;
    nodes.forEach(d3_layout_rpackUnlink);
  }
  function d3_layout_rpackLink(node) {
    node._pack_next = node._pack_prev = node;
  }
  function d3_layout_rpackUnlink(node) {
    delete node._pack_next;
    delete node._pack_prev;
  }
  function d3_layout_rpackTransform(node, x, y, kx, ky) {
    var children = node.children;
    node.x = x += kx * node.x;
    node.y = y += ky * node.y;
    node.r_x *= kx;
    node.r_y *= ky;
    if (children) {
      var i = -1, n = children.length;
      while (++i < n) d3_layout_rpackTransform(children[i], x, y, kx, ky);
    }
  }
  function d3_layout_rpackPlace(a, b, c) {
    var db = a.r + c.r, dx = b.x - a.x, dy = b.y - a.y;
    if (db && (dx || dy)) {
      var da = b.r + c.r, dc = dx * dx + dy * dy;
      da *= da;
      db *= db;
      var x = .5 + (db - da) / (2 * dc);
      var y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db - dc) * (db - dc) - da * da)) / (2 * dc);
      c.x = a.x + x * dx + y * dy;
      c.y = a.y + x * dy - y * dx;
    } else {
      c.x = a.x + db;
      c.y = a.y;
    }
  }
})();