//main
// http://grant.rfh.ru/ais/rfh/templates/chartdata.php

// http://grant.rscf.ru/ais/rsf/templates/chartdata.php

// https://0618524370ef1556963e696ab7a4a44eebf9cd92.googledrive.com/host/0B3DqhalHMJRWQmo1UV82elViZTQ/index.htm
var D3C = {};
D3C.parseDescr = function(c) {
	//var descr = {};
    var descr = [].map.call(c.attributes, function(d,i) {
        if(d.name.match(/^d3c-date-mask(\d+)$/i)) return;
        if(d.name.match(/^d3c-/i)) {
            return {
                name : d.name.replace(/^d3c-/i,'').replace(/(-[a-z])([a-z]*)/ig, 
                            function(full, p1, p2) {
                                return p1.charAt(1).toUpperCase()+p2;
                            }),
                value: d.value
            }
        }
    })
    .filter(function(d) { return d!=undefined })
    .reduce(function(result, d) {
        result[d.name] = d.value;
        return result;
    }, {})
    descr.timemask = [].reduce.call(c.attributes,function(result, attr) {
        var m;
        if(m = attr.name.match(/^d3c-date-mask(\d+)$/i)) {
            result.splice(+m[1],1,attr.value);
        }
        return result;
    },new Array(100)).filter(function(d) { return d });
    descr.timemask = descr.timemask.length && descr.timemask || ["(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})\\s+(?<hours>\\d{2}):(?<minutes>\\d{2}):(?<seconds>\\d{2})"];
    
	descr.source = c;
    descr.place = (function() {
        return eval(descr.place) || null;
    }).apply(c);
    descr.row = (descr.row || "TABLE>TBODY>TR").replace(/\$(\d+)/ig,":nth-child($1)");
    descr.cell = (descr.cell || "TD").replace(/\$(\d+)/ig,":nth-child($1)");
    descr.head = (descr.head || "TABLE>THEAD>TR>TH").replace(/\$(\d+)/ig,":nth-child($1)");
    descr.subscribe = descr.subscribe || '';
    descr.type = descr.type;
    
    descr.xaxis = +(c.A("d3c-xaxis")) || 0;
    
    descr.interpolate = descr.interpolate || "basis";
    descr.disabled = (descr.disabled !== undefined);
    descr.newEngine = (descr.newEngine !== undefined);
    
    d3.select(descr.source)
        .attr("content-resizable","")
        .attr("resize-handler","D3C.setupController")

    descr.width = +(descr.width || d3.select("body").node().offsetWidth*0.8);
    descr.height = +(descr.height || Math.max(d3.select("body").node().offsetHeight*0.5, descr.width*0.5));
  
	function parseTimeRegExp(s) {
        var timemap = { regexp: new RegExp(""), index: { year:NaN, month:NaN, day:NaN, hours:NaN, minutes:NaN, seconds:NaN } };
        var re = /\?<([a-zA-Z0-9]+)>/g;
        var m = s.match(re);
        if( m ) {
            for(var i=0;i<m.length;++i) {
                var found = m[i].replace(re, "$1" );
                if( !isNaN( timemap.index[ found ] ) )
                    throw "Bad name in time regexp expression: "+found;
                timemap.index[ found ] = i+1;
            }
        }
        timemap.regexp = new RegExp( s.replace(re, "") );
        return timemap;
    }
    descr.timemap = descr.timemask.map(function(rawregexp) {
        return parseTimeRegExp(rawregexp);
    });
    
	return descr;
};
D3C.parseTime = function(time, descr) {
    for(var t=0;t<descr.timemap.length;++t) {
        var timemap = descr.timemap[t];
        var parts = timemap.regexp.exec( time );
        var r = { year:NaN, month:NaN, day:NaN, hours:NaN, minutes:NaN, seconds:NaN };
        if(parts) {
            for(var name in timemap.index) {
                var i = timemap.index[name];
                if( !isNaN(i) ) {
                    r[name] = +parts[ i ];
                }
            }
            if( isNaN(r.year) )
                continue;
            if( isNaN(r.month) )
                r.month = 0;
            if( isNaN(r.day) )
                r.day = 1;
            if( isNaN(r.hours) )
                r.hours = 0;
            if( isNaN(r.minutes) )
                r.minutes = 0;
            if( isNaN(r.seconds) )
                r.seconds = 0;
            return new Date(r.year, r.month, r.day, r.hours, r.minutes, r.seconds );
        }
    }
    return NaN;
};
D3C.takeData = function(cell,accessor) {
    var data = function() {
        return eval(accessor || 'this.value || this.innerHTML') || this.value || this.innerHTML;
    }.apply(cell);
    return data.replace(/^\s+/,'').replace(/\s+$/,'') || "";
};
D3C.setUniqueAttr = function(elem) {
    var attr = "xxx_xxx";
    while(QSA("["+attr+"]").length) {
        attr += "_";
    }
    elem.setA(attr,"");
    return attr;
}
D3C.isNumber = function(n) { return typeof(n)==="number" && !isNaN(n);}
D3C.isDate = function(d) { return {}.toString.call(d)=="[object Date]";}
D3C.isString = function(s) {return typeof s === 'string';}
D3C.collectData = function(tdescr, descr) {
    tdescr.string = {};
    tdescr.number = {};
    tdescr.time = {};
    tdescr.head = [];
    var table = D3C.setUniqueAttr(descr.source);
    tdescr.body = [].map.call(QSA(descr.row.split(',').map(function(d){
        return "["+table+"]>"+d;
    }).join(',')),function(row) {
        var rowattr = D3C.setUniqueAttr(row);
        var x = [].map.call(QSA(descr.cell.split(',').map(function(d){
            return "["+rowattr+"]>"+d;
         }).join(',')),function(cell,i) {
            return { source: D3C.takeData( cell, descr.cellData ) };
        });
        row.removeAttribute(rowattr);
        return x;
    });
    if(!tdescr.body.length)
        return null;
    for(var j = 0;j < tdescr.body[0].length; ++j) {
        for(var i=0;i < tdescr.body.length; ++i) {
            if(tdescr.body[i][j].source !== "") {
                 var value = D3C.parseTime( tdescr.body[i][j].source, descr );
                if(isNaN(value)) break;
                tdescr.body[i][j].value = value;
            } else {
                 tdescr.body[i][j].value = null;
            }           
        }
        if(i !== tdescr.body.length) {
            for(var i=0;i < tdescr.body.length; ++i) {
                if(tdescr.body[i][j].source !== "") {
                    var value = +tdescr.body[i][j].source;
                    if(isNaN(value)) break;
                    tdescr.body[i][j].value = value;
                } else {
                    tdescr.body[i][j].value = null;
                }
            }
            if(i !== tdescr.body.length) {
                for(var i=0;i < tdescr.body.length; ++i) {
                    tdescr.body[i][j].value = tdescr.body[i][j].source || null;               
                }
                tdescr.string[j] = true;
            } else {
                tdescr.number[j] = true;
            }
        } else {
            tdescr.time[j] = true;
        }
        
    }
    tdescr.body = tdescr.body.map(function(row) {
        return row.map(function(cell) {
            cell.value && (cell.value.source = cell.source);
            return cell.value;
        });
    });    
    if(descr.type=="line" && tdescr.string[descr.xaxis]) {
        console.log("Error! Couldnt draw line chart with strings on x-axis. Switched to bar")
        descr.type = "bar";
    }
    tdescr.body.sort(function(a,b) {
        return a[descr.xaxis]<b[descr.xaxis] ? -1 : (a[descr.xaxis]>b[descr.xaxis]) ? 1 : 0;
    })
    descr.istimeaxis = tdescr.time[descr.xaxis];

    //соберем заголовки
    var header = QSA(descr.head.split(',').map(function(d){
        return "["+table+"]>"+d;
    }).join(','));
    tdescr.head = tdescr.body[0].map(function(b,i) {
        return i < header.length ? D3C.takeData(header[i],descr.headData) : "";
    });
    //спрячем пустые колонки с заголовками
    //D3C.hideEmptyColumns( tdescr, notempty );
    descr.source.removeAttribute(table);
	return tdescr;
};
D3C.hideEmptyColumns = function(tdescr, notempty) {
    tdescr.head = tdescr.head.filter(function(d, i) {
        return notempty[i];
    });
    tdescr.body = tdescr.body.map(function(d) {
        return d.filter(function(d, i) {
            return notempty[i];
        });
    });
};

D3C.localFormat = d3.locale({
    "decimal": ",",
    "thousands": "\xa0",
    "grouping": [3],
    "currency": ["", " руб."],
    "dateTime": "%A, %e %B %Y г. %X",
    "date": "%d.%m.%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
    "shortDays": ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    "months": ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
    "shortMonths": ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
  }).timeFormat.multi([
    [".%L", function(d) { return d.getMilliseconds(); }],
    [":%S", function(d) { return d.getSeconds(); }],
    ["%I:%M", function(d) { return d.getMinutes(); }],
    ["%I %p", function(d) { return d.getHours(); }],
    ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
    ["%b %d", function(d) { return d.getDate() != 1; }],
    ["%B", function(d) { return d.getMonth(); }],
    ["%Y", function() { return true; }]
]);

D3C.render = function(descr)
{
    var container, chart, svg, drawing;
    if(descr.place) {
        container = d3.select(descr.place).attr("chart-holder","");
    } else {
        if(descr.source.previousElementSibling 
            && descr.source.previousElementSibling.hasA('chart-holder')) {
            container = d3.select(descr.source.previousElementSibling);
        } else {
            container = d3.select(descr.source.parentNode
            .insertBefore(document.createElement("div"),descr.source))
                .attr("chart-holder","");  
        }
    }

    container.node().__sourceElement__ = descr.source;
    descr.source.__placeElement__ = container.node();

    if(descr.disabled) {
        container.attr("chart-place-hidden","");
    }
    else {
        var tdescr = D3C.collectData( {}, descr);
        container.selectAll("[message]").remove();
        container.attr("chart-place-hidden",undefined);
        if(!tdescr) {
            console.log("Warning! No appropriate data to show");
            container.append("div").attr("message","").attr("no-data","");
            return;
        }
        if(!descr.type) {
            var t = D3C.getClosestCorrectChartType(descr.xaxis, descr.type, tdescr);
            if(t) {
                descr.xaxis = t.axis;
                descr.type = t.to;
            } else {
                console.log("Warning! No appropriate data to show");
                container.append("div").attr("message","").attr("no-data","");
                return;                
            }
        }        
        if(!D3C[descr.type]) {
            console.log("Warning! Chart type '"+descr.type+"' isnt supported");
            container.append("div").attr("message","").attr("type-not-supported","");
            return;
        }
        var svg = container
            .selectAll("svg")
            .data([{}])

        var new_svg = svg
            .enter()
            .append("svg");
        svg.exit().remove();   
        
        svg
            .attr("width", descr.width)
            .attr("height", descr.height)

        var color = d3.scale.ordinal()
          .range([1,2,3,4,5,6,7]);
        D3C[descr.type](svg, color, tdescr, descr);
        D3C.axisswitcher(container, tdescr, descr);
        D3C.legend(container, tdescr, descr, color);    
        D3C.typeswitcher(container, tdescr, descr);
        D3C.fit(svg, svg.select(".chart"))
    }
}
D3C.preparechart = function(svg, descr) {
    var xxx = svg.selectAll(".chart")
    .filter(function(d) { 
        return d3.select(this).attr("chart-type")!=descr.type 
    }).remove();
    var chart = svg
        .selectAll(".chart")
        .data([{}]);
    var new_chart = chart
        .enter()
        .append("g")
            .attr("class","chart")
            .attr("chart-type",descr.type)
    chart.exit().remove();
    return chart;
}
D3C.bar = function(svg, color, tdescr, descr)
{   
    //set colors
    color.domain(tdescr.body[0].map(function(d,i) { 
        if(tdescr.number[i])
            return i;
    }).filter(function(d) { return d!=undefined }))
    //prepare container
    var chart = D3C.preparechart(svg, descr)
    //prepare data
    var graphs = tdescr.body.map(function(row,i) {
            return {
                name: i,
                vals: color.domain().map(function(key) {
                    return {name: key, value: row[key] || 0}
                })
            }
        }).filter(function(d) {
            return tdescr.body[d.name][descr.xaxis] !== null;
        })
    var x = d3.scale.ordinal()
        .domain(graphs.map(function(d) { return d.name }))
        .rangeRoundBands([0,descr.width], 0, 0)

    var x1 = d3.scale.ordinal()
        .domain(color.domain())
        .rangeRoundBands([0, x.rangeBand()], .1);

    var y = d3.scale.linear()
        .range([descr.height, 0])
        .domain([
            Math.min(0,
                d3.min(graphs, function(c) { return d3.min(c.vals, function(v) { 
                    return v.value; 
                }); })),
            Math.max(0,
                d3.max(graphs, function(c) { return d3.max(c.vals, function(v) { 
                    return v.value; 
                }); }))
        ]);
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .outerTickSize(0)
        .tickValues(graphs.map(function(d) {
            return d.name;
        }))
        .tickFormat(function(d) {
            return tdescr.body[d][descr.xaxis].source || tdescr.body[d][descr.xaxis] || "•";
        })     

    var yAxis = d3.svg.axis()
        .scale(y)
        .tickSize(descr.width)
        .orient("right")
        .outerTickSize(0)
        .ticks(10)
    
    if(descr.yFormat)
        yAxis.tickFormat(d3.format(descr.yFormat)) 
    
    var length = Math.floor(Math.abs(y.domain()[0]) + Math.abs(y.domain()[1]))
    if(length < 10)
        yAxis.ticks(length)    

    //draw bars
    var bar = chart.selectAll(".bargroup")
        .data(graphs)

    var new_bar = bar.enter()
        .append("g")
            .attr("class","bargroup")
        .append("line")
            .attr("bar-border","")

    bar.exit().remove();

    bar
        .attr("transform", function(d) { return "translate(" + x(d.name) + ",0)"; });

    bar
    .select("[bar-border]")
        .attr("x1", x.rangeBand())
        .attr("x2", x.rangeBand())
        .attr("y2", descr.height)


    var subbar = bar.selectAll(".subbar")
        .data(function(d) { return d.vals })

    var new_subbar = subbar.enter()
        .append("g")
            .attr("class","subbar")
        .append("rect")
            .attr("class","bar")
            .attr("height", 0)
            .attr("y", y(0))

    subbar.exit().remove();

    subbar.select(".bar") 
        .transition().duration(750)
        .attr("x", function(d) { 
            return x1(d.name) 
        })
        .attr("width", x1.rangeBand())
        .attr("y", function(d) {
            return y(Math.max(0,d.value)) 
        })
        .attr("height", function(d) {
            return Math.abs(y(0)-y(d.value))
        })
        .attr("f-color", function(d) { return color(d.name); });
    
    //draw axises
    var axis = chart
    .selectAll(".axis")
        .data([{ x:true },{ y:true }])
    var new_axis = axis
    .enter()
    .append("g")
        .attr("class","axis")
        .classed("x", function(d) { return d.x })
        .classed("y", function(d) { return d.y })
        .attr("transform", function(d) { return d.y && "translate(0,0)" || null })
    axis.exit().remove();
    
    chart
    .select(".x.axis")
        .call(xAxis)
    .selectAll(".tick text")
        .call(D3C.wraptext, x.rangeBand());
    
    chart
    .select(".y.axis")
        .call(yAxis)
    .selectAll(".tick")
        .attr("y-zero",function(d) { return d==0 || undefined })

    chart
    .selectAll(".x.axis")
            .attr("transform", "translate(0," + descr.height + ")")
    chart
    .selectAll(".y.axis text")
        .attr("x", 4)
        .attr("dy", -4);

    chart
    .selectAll(".x.axis text")
        .attr("transform",undefined)
        .attr("dx", undefined)

    if(!chart.select(".x.axis [outofband]").empty()) {
        chart
        .selectAll(".x.axis text")
            .attr("dy",5)
            .attr("dx",-8)
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    }
}
D3C.line = function(svg, color, tdescr, descr)
{
    //set colors
    color.domain(tdescr.body[0].map(function(d,i) { 
        if(i !== descr.xaxis && tdescr.number[i])
            return i;
    }).filter(function(d) { return d!=undefined }))
    //prepare container
    var chart = D3C.preparechart(svg, descr)

    //prepare data
    var graphs = color.domain().map(function(key) { 
            return {
                name: key,
                vals: tdescr.body.map( function(row) { 
                    return {X: row[descr.xaxis], Y: row[key] || 0 }
                }).filter(function(d) {
                    return d.X !== null;
                })
            };
        });
    var x = (descr.istimeaxis ? 
                d3.time.scale() : 
                d3.scale.linear()
            )
        .range([0, descr.width])
        .domain(d3.extent(tdescr.body.map(function(row) { 
            return row[descr.xaxis];
        }).filter(function(d) {
            return d !== null;
        }) ));

    var y = d3.scale.linear()
        .range([descr.height, 0])
        .domain([
            Math.min(0,
                d3.min(graphs, function(c) { return d3.min(c.vals, function(v) { return v.Y }); })),
            Math.max(0,
                d3.max(graphs, function(c) { return d3.max(c.vals, function(v) { return v.Y }); }))
        ]);
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .outerTickSize(0)

    if(descr.istimeaxis)
        xAxis.tickFormat( D3C.localFormat );

    var yAxis = d3.svg.axis()
        .scale(y)
        .tickSize(descr.width)
        .orient("right")
        .outerTickSize(0)
    
    if(descr.yFormat)
        yAxis.tickFormat(d3.format(descr.yFormat))
    
    var length = Math.floor(Math.abs( y.domain()[0] - y.domain()[1]))
    if(length < 10)
        yAxis.ticks(length)

    length = Math.floor(Math.abs( x.domain()[0] - x.domain()[1]))
    if(length < 10)
        xAxis.ticks(length)
    
    var line = d3.svg.line()
        .interpolate(descr.interpolate)
        .x( function(d) { 
            return x(d.X) 
        } )
        .y( function(d) { 
            return y(d.Y) 
        });
    var zeroline = d3.svg.line()
        .interpolate(descr.interpolate)
        .x( function(d) { 
            return x(d.X) 
        } )
        .y( function(d) { 
            return y(0) 
        } );

    var graph = chart.selectAll(".graph")
        .data(graphs);
    
    var new_graph = graph.enter()
        .append("g")
            .attr("class", "graph")
        .append("path")
            .attr("class", "line")
            .attr("d",function(d) { return zeroline(d.vals) })
        
    graph.exit().remove();
    
    graph
    .select(".line")
        .attr("s-color", function(d) {return color(d.name) } )
    
    graph
        .transition().duration(750)
    .select(".line")
        .attr("d", function(d) { 
            return line(d.vals); 
        })

    //draw axis
    var axis = chart
    .selectAll(".axis")
        .data([{ x:true },{ y:true }])
    var new_axis = axis
    .enter()
    .append("g")
        .attr("class","axis")
        .classed("x", function(d) { return d.x })
        .classed("y", function(d) { return d.y })
        .attr("transform", function(d) { return d.y && "translate(0,0)" || null })
    axis.exit().remove();

    chart
    .select(".x.axis")
        .call(xAxis)
        .attr("transform", "translate(0," + descr.height + ")");

    var tickcount = chart.select(".x.axis").selectAll(".tick text").size();

    chart
    .select(".x.axis")
    .selectAll(".tick text")
        .call(D3C.wraptext, Math.round(descr.width / tickcount));

    chart
    .select(".y.axis")
        .call(yAxis)
    .selectAll(".tick")
        .attr("y-zero",function(d) { return d==0 || undefined })

    chart
    .selectAll(".y.axis text")
        .attr("x", 4)
        .attr("dy", -4);

    chart
    .selectAll(".x.axis text")
        .attr("transform",undefined)
        .attr("dx", undefined)

    if(!chart.select(".x.axis [outofband]").empty()) {
        chart
        .selectAll(".x.axis text")
            .attr("dy",5)
            .attr("dx",-8)
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    }
}

D3C.radar = function(svg, color, tdescr, descr)
{
    //set colors
    color.domain(tdescr.body[0].map(function(d,i) { 
        if(i !== descr.xaxis && tdescr.number[i])
            return i;
    }).filter(function(d) { return d!=undefined }))
    //prepare container
    var chart = D3C.preparechart(svg, descr)
    
    //prepare data
    var height = descr.height/2;
    var graphs = color.domain().map(function(key) { 
            return {
                name: key,
                vals: tdescr.body.map( function(row) { 
                    return row[key] || 0
                })
            };
        });
    var y = d3.scale.linear()
        .range([0,height])
        .domain([
            Math.min(0,
                d3.min(graphs, function(c) { return d3.min(c.vals, function(v) { 
                    return v; 
                }); })),
            Math.max(0,
                d3.max(graphs, function(c) { return d3.max(c.vals, function(v) { 
                    return v; 
                }); }))
        ]);
    var yAxis = d3.svg.axis()
        .scale(y)
        .tickSize(1)
        .orient("right")
        .outerTickSize(0)
    
    if(descr.yFormat)
        yAxis.tickFormat(d3.format(descr.yFormat)) 
    
    var length = Math.floor(Math.abs(y.domain()[0]) + Math.abs(y.domain()[1]))
    if(length < 10)
        yAxis.ticks(length)

    //draw axises
    var axises = tdescr.body.map(function(d,i) { return i })
        .filter(function(d) { 
            return tdescr.body[d][descr.xaxis] !== null; 
        });

    var axis = chart
        .selectAll(".axis")
        .data(axises)
    var new_axis = axis
        .enter()
        .append("g")
            .attr("class","axis")

    new_axis.append("g")
        .attr("axis-name","")
            .append("text")

    axis.exit().remove();
    
    var angle = 360/axises.length;
    var offset = angle/2;
    if(axises.length==2) {
        angle = 90;
        offset = -45+180;
        graphs.forEach(function(g) {
            g.vals.push(y.domain()[0]);
        })
    }
    axis.call(yAxis)
        .attr("transform",function(d, i) {return "rotate("+(angle*i+offset)+")"})
        .each(function(d) { if(d) d3.select(this).selectAll(".tick text").remove() })
    axis
    .selectAll(".tick text")
        .attr("dx",5)
        .attr("dy",10)
        .attr("transform", "rotate(-"+offset+")")

    axis
    .select("[axis-name]")
        .attr("transform", function(d,i) {
            var A = (angle*i+offset)%360;
            var padding = 7;
            if(0<=A && A<=90 || 270<=A && A<=360) {
                //20 is padding
                padding = padding + 20 * ( A > 90 ? ( A - 270 ) : (90 - A) )/90;
            }            
            var T = d3.transform();
            T.translate = [0,height+padding];
            T.rotate = -(angle*i+offset)
            return T.toString();            
        })
    .select("text")
        .attr("x",0)
        .attr("y",0)
        .text(function(d) {
            return tdescr.body[d][descr.xaxis].source || tdescr.body[d][descr.xaxis] || "•";
        })
        .style("text-anchor",function(d,i) {
            var A = (angle*i+offset)%360;
            if(A==0 || A==180) return "middle";
            if(0<A && A<180) return "end";
            if(180<A && A<360) return "start";
        })
        

    var circles = [];
    chart.select(".axis").selectAll(".tick").each(function(d) {
        var c = d3.transform(d3.select(this).attr("transform")).translate;
        circles.push({ X: c[0], Y: c[1] });
    });

    var circle = chart
        .selectAll(".circle")
        .data(circles)
    var new_circle = circle
        .enter()
        .append("circle")
            .attr("class","circle")

    circle.exit().remove();

    circle
        .attr("cx",0)
        .attr("cy",0)
        .attr("r", function(d) { return d.Y })

    //draw graphs
    function X(x,y,A) {
            var x1 =  x*Math.cos(A) - y*Math.sin(A);
            var y1 =  x*Math.sin(A) + y*Math.cos(A);
            return {x:x1,y:y1}
        }
    var line = d3.svg.line()
        .interpolate("cardinal-closed")
        .x( function(d,i) {
            var C = X( 0, y(d), Math.PI*(angle*i+offset)/180);
            return C.x 
        } )
        .y( function(d,i) {
            var C = X( 0, y(d), Math.PI*(angle*i+offset)/180);
            return C.y 
        } );    

    var graph = chart
        .selectAll(".graph")
        .data(graphs);
    
    var new_graph = graph.enter()
        .append("g")
            .attr("class", "graph")
        .append("path")
            .attr("class", "line")
            .attr("d", function(d) { return line(d.vals.map(function() { return 0 })) })

        
    graph.exit().remove();

    graph
    .select(".line")
        .attr("s-color", function(d) {return color(d.name) } )
        .attr("f-color", function(d) {return color(d.name) } )
    
    graph
    .select(".line")
        .transition().duration(750)
        .attr("d", function(d) {
            return line(d.vals)
        })
}
D3C.get_number_axis = function(tdescr) {
    return tdescr.body[0]
        .map(function(h,i) { return  i })
        .filter(function(d){
            return tdescr.number[d]
        });
}
D3C.get_line_x_axis = function(tdescr) {
    var x = tdescr.body[0]
        .map(function(h,i) { return  i })
        .filter(function(d){
            return !tdescr.string[d];
    });
    x.sort(function(a,b) {
        a = tdescr.number[a];
        b = tdescr.number[b];
        return a && b ? 0 : (a ? 1 : (b ? -1 : 0));
    })
    return x;
}
D3C.get_bar_x_axis = function(tdescr) {
    return tdescr.body[0]
        .map(function(h,i) { return  i })
        .filter(function(d){
            return !tdescr.number[d];
    });
}
D3C.get_radar_x_axis = function(tdescr) {
    return D3C.get_bar_x_axis(tdescr);
}
D3C.getClosestCorrectChartType = function(xaxis,type,tdescr) {
    var map = {'line' : 'bar', 'bar' : 'radar', 'radar' : 'line'};
    var xaxises = null;
    type = type || 'line';
    var t = map[type];
    while(t !== type ) {//roll types
        xaxises = D3C['get_'+t+'_x_axis'](tdescr);
        if(xaxises.length) {
            var axis = xaxises.indexOf(xaxis)<0 ? xaxises.shift() : xaxis;
            if(!D3C.get_number_axis(tdescr).filter(function(d) { return d !== axis }).length) {
                //there is no numeric axis left
                xaxises = null;
                t = map[t];
                continue;
            } else {
                xaxises = {
                    to: t,
                    axis : axis
                }
                break;
            }
        }
        xaxises = null;
        t = map[t];
    }
    return xaxises;
}
D3C.typeswitcher = function(container, tdescr, descr) {
    /*var xaxises = D3C.getClosestCorrectChartType(descr.xaxis, descr.type, tdescr);
    xaxises = xaxises ? [xaxises] : [];

    var sw = container.selectAll("[chart-switcher]").data(xaxises);
    var new_sw = sw.enter().append('div')
        .attr('chart-switcher','');
    
    sw.exit().remove();

    sw
        .attr("chart-type",function(d) { return d.to })
        .attr("onclick", function   (d) {
            return "D3C.A('d3c-type', '"+d.to+"').A('d3c-xaxis',"+d.axis+").draw(this)";
        })*/
}
D3C.axisswitcher = function(container, tdescr, descr) {
    var panel = container.selectAll("[axis-switcher]").data([{}])
    panel.enter().append('div')
        .attr('axis-switcher','')
    panel.exit().remove();
    panel
        .attr('opened', undefined)
        .style('width', descr.width)

    var axises = D3C['get_'+descr.type+'_x_axis'](tdescr).map(function(d) {
        return { idx : d, text : tdescr.head[d] }
    });

    //source hider
    var hider = panel.selectAll("[source-hider]").data([{ source: descr.source }]);
    hider.enter().append('div').attr('source-hider','');
    hider.exit().remove();
    hider
        .attr('source-hider', function(d) { return d.source.hasA('d3c-hide') ? 'closed' : 'opened'})
        .on('click',function(d) {
            if(d.source.hasA('d3c-hide'))
                d.source.removeAttribute('d3c-hide')
            else
                d.source.setA('d3c-hide','')
        })

    //chart switcher
    var xaxises = D3C.getClosestCorrectChartType(descr.xaxis, descr.type, tdescr);
   
    xaxises = xaxises ? [xaxises] : [];
    var sw = panel.selectAll("[chart-switcher]").data(xaxises);    
    sw.enter().append('div').attr('chart-switcher','');    
    sw.exit().remove();
    sw
        .attr("chart-type",function(d) { return d.to })
        .attr("onclick", function   (d) {
            return "D3C.A('d3c-type', '"+d.to+"').A('d3c-xaxis',"+d.axis+").draw(this)";
        });

    //axis switcher
    var axis = panel.selectAll('[axis-name]').data(axises);
    axis.sort(function(a,b) {
        a = (a.idx===descr.xaxis);
        b = (b.idx===descr.xaxis);
        return a && b ? 0 : (a ? -1 : (b ? 1 : 0));
    });
    axis.enter().append('div').attr('axis-name','');
    axis.exit().remove();
    axis
        .attr("current-axis", function(d) {
            return d.idx===descr.xaxis || undefined;
        })
        .attr("onclick",function(d) {
            return axises.length===1 ? undefined :
            (
                d.idx===descr.xaxis ? 
                "this.parentNode.presentA('opened',!this.parentNode.hasA('opened'))"
                :
                ("D3C.A('d3c-type', '"+descr.type+"').A('d3c-xaxis',"+d.idx+").draw(this)")
            )
        }) 
        .text(function(d) {
            return d.text;
        });
}
D3C.legend = function(container, tdescr, descr, color) {
    var descriptions = color.domain().map(function(d) {
        return { idx : d, color : d, text : tdescr.head[d] }
    })
    
    descriptions = descriptions.filter(function(d) {
        return d.color !== undefined
    }).concat(descriptions.filter(function(d) {
        return d.color === undefined
    }));

    var legend = container.selectAll("[legend]").data([{}])
    var new_legend = legend.enter()
        .append("div")
            .attr("legend","")

    legend
        .style("width",descr.width)
        .attr("chart-type", descr.type)
    
    legend.exit().remove();

    var description = legend.selectAll("[description]").data(descriptions);

    var new_descr = description.enter()
        .append("span")
            .attr("description","")
    new_descr
        .append("span")
            .attr("color-spot","")

    new_descr
        .append("span")
            .attr("color-text","")

    description.exit().remove();
    description
        .attr("string-column",function(d) { 
            return d.color==undefined || undefined
        });
    description
    .select("[color-spot]")
        .attr("b-color", function(d) {
            return d.color==undefined ? undefined : color(d.color);
        })

    description
    .select("[color-text]")
        .text(function(d) { return d.text });
    
}
D3C.fit = function(svg, container) {
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
}

D3C.wraptext = function(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
    if(tspan.node().getComputedTextLength() > width) 
        text.attr("outofband","")
  });
}

D3C.testbutton = function()
{
    var svg = d3.select("[xxx]");
    var container = svg.select("g");
    /*d3.select("[xxx] circle")
        .attr("r",100)*/
    container
    .select("path")
    .transition().duration(750)
    .attr("stroke-width",4)
    //.attr("d","M -50 -50 h 300")
    .attr("d","M 0 0 h 300 Z")

    D3C.fit(svg,container)
}
D3C.test = function() {
    var width = 800;
    var height = 300;

    var svg = d3.select("body").append("svg")
        .attr("xxx","")
        .attr("width",width)
        .attr("height",height)
        //.style("border","1px solid black")
        //.attr("viewBox","0 0 "+width+" "+height)

    container = svg.append("g")

    container
    .append("circle")
        .attr("cx",-850)
        .attr("cy",-150)
        .attr("r",300)

    container
    .append("path")
        .attr("stroke","#F00")
        .attr("fill", "none")
        .attr("stroke-width",1)
        .attr("d","M 0 0 h 50 v 200 h -50 Z M 100 0 h 50 v 200 h -50 Z")

    D3C.fit(svg,container);
}
D3C.handleControllers = function()
{
    var sources = QSA("[d3c-type],[d3c-width],[d3c-height],[d3c-place],[d3c-row],[d3c-cell],[d3c-xaxis],[d3c-head]");
    for(var i=0;i<sources.length;++i) {
        D3C.setupController(sources[i]);       
    }
};
D3C.setupController = function(source) 
{
    var descr = D3C.parseDescr( source );    
    D3C.render(descr);
    /*if(descr.newEngine)  
        D3C.render(tdescr,descr)
    else
      D3C.render(tdescr,descr)  
    */
   // X.autoResizeOnEvent(null, source);
};
D3C.getSource = function(o)//callable by 'in-chart elements'
{
    return o.attrUpward("chart-holder").__sourceElement__;
}
//D3C.draw = function(o) { (o = D3C.getSource(o)) && D3C.setupController(o) }
D3C.A = function(name, value)
{
    var obj = [{n:name,v:value}];
    var ret = { 
        draw : function(o) {
            o = D3C.getSource(o);
            if(o) {
                obj.forEach(function(a) {
                    if(a.v==undefined) o.removeAttribute(a.n)
                    else o.setA(a.n,a.v)
                })
                D3C.setupController(o)
            }
        },
        A : function(n,v) {
            obj.push({n:n,v:v});
            return ret;
        }  
    }
    return ret;
}
/* User interface */

D3C.setup = function() {
    /*
    * Set up charts according to their description
    */
    D3C.handleControllers() 
}
D3C.turn = function(source) {
    /*
    *
    * Hide or Shows chart 
    *
    */
    if(source.hasA('d3c-disabled')) 
        source.removeAttribute('d3c-disabled');
    else 
        source.setA('d3c-disabled','');

    D3C.setupController( source );
}

