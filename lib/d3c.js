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
    .filter(function(d) { return d!=undefined})
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
    descr.row = (descr.row || "TBODY TR").replace(/\$(\d+)/ig,":nth-child($1)");
    descr.cell = (descr.cell || "TD").replace(/\$(\d+)/ig,":nth-child($1)");
    descr.head = (descr.head || "TH").replace(/\$(\d+)/ig,":nth-child($1)");
    descr.subscribe = descr.subscribe || '';

    if(descr.xaxis)
        descr.xaxis = +(c.A("d3c-xaxis"));

    descr.type = descr.type || "bar";

    if(descr.type=="line" && descr.xaxis == undefined) {
        console.log("Warning! For line chart d3c-xaxis must be defined. Switched to bar")
        descr.type="bar";
    }

    descr.interpolate = descr.interpolate || "basis";
    //descr.yFormat = descr.yFormatc.A("d3c-y-format");
    descr.yDiscrete = (descr.yDiscrete != undefined)
    descr.newEngine = (descr.newEngine != undefined)
    //descr.yDiscrete = c.hasA("d3c-y-discrete");
    //descr.newEngine = c.hasA("d3c-new-egine")

    if(descr.hide != undefined)
        d3.select(descr.source).style("display","none")
    d3.select(descr.source)
        .attr("content-resizable","")
        .attr("resize-handler","D3C.setupController")

    descr.width = +(descr.width || 400);
    descr.height = +(descr.height || 200);

    //descr.subscribemask = c.A("d3c-subscribe") || "";
  
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
D3C.takeData = function(cell) {
    return cell.innerHTML.replace(/^\s+/,'').replace(/\s+$/,'');
};
D3C.isNumber = function(n) { return typeof(n)==="number" && !isNaN(n); };
D3C.isDate = function(d) { return {}.toString.call(d)=="[object Date]"; };
D3C.collectData = function(tdescr, table, descr) {
    tdescr.head = [];
    var isStr = {};
    tdescr.body = [].map.call(table.QSA(descr.row),function(row) {
        return [].map.call(row.QSA(descr.cell),function(cell,i) {
            var value = D3C.parseTime( D3C.takeData( cell ), descr );
            if(isNaN(value)) {
                value = +D3C.takeData( cell )
                if(isNaN(value)) {
                    isStr[i] = true;
                    return D3C.takeData( cell )
                }
            }            
            return value
        });
    });
	
	if(!tdescr.body.length)
        return null;

    tdescr.sub = tdescr.body.map(function(row) {
        var strs = row.filter(function(cell,i) {
            return isStr[i]
        })

        return descr.subscribe.replace(/\$(\d+)/ig, function(full, p1) {
            if(+p1<strs.length)
                return strs[+p1]
            console.log("Warning! Subscribe mask contains extra placeholder: "+full);
            return "";
        })
    })
    tdescr.body = tdescr.body.map(function(row) {
        return row.filter(function(cell,i) { return !isStr[i]  })
    })
    if(descr.xaxis != undefined)
        tdescr.body.sort(function(a,b) {
            return a[descr.xaxis]>b[descr.xaxis]
        })

    descr.istimeaxis = D3C.isDate(tdescr.body[0][descr.xaxis]);
    //соберем заголовки
	var header = [].filter.call(table.QSA(descr.head),function(head,i) {
        return !isStr[i];
    });
    tdescr.head = tdescr.body[0].map(function(d,i) {
        if(i < header.length)
            return D3C.takeData(header[i])
        else 
            return ""
    });
    
    //спрячем пустые колонки с заголовками
   // D3C.hideEmptyColumns( tdescr, notempty );

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
    "months": ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
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

D3C.render = function(tdescr, descr)
{
    var container, chart, svg, drawing;
    if(descr.source.previousElementSibling 
        && descr.source.previousElementSibling.hasA('chart-holder')) {
        container = d3.select(descr.source.previousElementSibling);
    } else {
        container = d3.select(descr.source.parentNode
        .insertBefore(document.createElement("div"),descr.source))
            .attr("chart-holder","");  
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
    function C(r,g,b) {
        return {
            rgb : function() {
                return "rgb("+r+","+g+","+b+")"
            },
            rgba : function(a) {
                return "rgba("+r+","+g+","+b+","+a+")"
            }
        }
    }
    var color = d3.scale.ordinal()
      .range([1,2,3,4,5,6,7]);
    
    color.domain(tdescr.body[0].map(function(d,i) { 
        if(i!=descr.xaxis && D3C.isNumber(d))
            return i;
    }).filter(function(d) { return d!=undefined }))
    if(!D3C[descr.type]) {
        console.log("Warning! Chart type '"+descr.type+"' isnt supported")
        return;
    }  
    D3C[descr.type](svg, color, tdescr, descr);

    D3C.legend(container, tdescr, descr, color);
    D3C.fit(svg, svg.select(".chart"))
}
D3C.preparechart = function(svg, type) {
    var xxx = svg.selectAll(".chart")
    .filter(function(d) { 
        return d3.select(this).attr("chart-type")!=type 
    }).remove();
    var chart = svg
        .selectAll(".chart")
        .data([{}]);
    var new_chart = chart
        .enter()
        .append("g")
            .attr("class","chart")
            .attr("chart-type",type)
    chart.exit().remove();
    return chart;
}
D3C.bar = function(svg, color, tdescr, descr)
{
    //prepare container
    var chart = D3C.preparechart(svg,"bar")
    //prepare data
    var graphs = tdescr.body.map(function(row,i) {
            return {
                name: i,
                vals: color.domain().map(function(key) {
                    return {name: key, value: row[key]}
                })
            }
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
        .tickValues(tdescr.body.map(function(d,i) {
            return i;
        }))
        .tickFormat(function(d,i) {
            return tdescr.sub[d] || "•";
        })

    var yAxis = d3.svg.axis()
        .scale(y)
        .tickSize(descr.width)
        .orient("right")
        .outerTickSize(0)
    
    if(descr.yFormat)
        yAxis.tickFormat(d3.format(descr.yFormat)) 
    
    var length = Math.floor(Math.abs(y.domain()[0]) + Math.abs(y.domain()[1]))
    if(descr.yDiscrete && length < 10)
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
    //prepare container
    var chart = D3C.preparechart(svg,"line")

    //prepare data
    var graphs = color.domain().map(function(key) { 
            return {
                name: key,
                vals: tdescr.body.map( function(row) { 
                    return {X: row[descr.xaxis], Y: row[key] } 
                } )
            };
        });
    var x = (descr.istimeaxis ? 
                d3.time.scale() : 
                d3.scale.linear()
            )
        .range([0, descr.width])
        .domain(d3.extent(tdescr.body, function(d) { 
            return d[descr.xaxis];
        }));

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
    
    var length = Math.floor(Math.abs(y.domain()[0]) + Math.abs(y.domain()[1]))
    if(descr.yDiscrete && length < 10)
        yAxis.ticks(length)
    
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
        .attr("transform", "translate(0," + descr.height + ")")
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
}

D3C.radar = function(svg, color, tdescr, descr)
{
    //prepare container
    var chart = D3C.preparechart(svg,"radar")
    
    //prepare data
    var height = descr.height/2;
    var graphs = color.domain().map(function(key) { 
            return {
                name: key,
                vals: tdescr.body.map( function(row) { 
                    return row[key]
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
    if(descr.yDiscrete && length < 10)
        yAxis.ticks(length)

    //draw axises
    var axises = tdescr.body.map(function(d,i) { return i });

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
        .attr("transform",function(d) {return "rotate("+(angle*d+offset)+")"})
        .each(function(d) { if(d) d3.select(this).selectAll(".tick text").remove() })
    axis
    .selectAll(".tick text")
        .attr("dx",5)
        .attr("dy",10)
        .attr("transform", "rotate(-"+offset+")")

    axis
    .select("[axis-name]")
        .attr("transform", function(d) {
            var T = d3.transform();
            T.translate = [0,height+7];
            T.rotate = -(angle*d+offset)
            return T.toString();            
        })
    .select("text")
        .attr("x",0)
        .attr("y",0)
        .text(function(d) {
            return tdescr.sub[d] || "•";
        })
        .style("text-anchor",function(d) {
            var A = (angle*d+offset)%360;
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

D3C.legend = function(container, tdescr, descr, color) {
    var descriptions = color.domain().map(function(key) { 
        return { name: key, text: tdescr.head[key] };
    });
    if(descr.xaxis != undefined && descriptions.length>1)
        descriptions = [{ xaxis:true, text:tdescr.head[descr.xaxis] }].concat(descriptions);
    if(descriptions.length==1)  
        descriptions = [];

    var legend = container.selectAll("[legend]").data([{}])
    var new_legend = legend.enter()
        .append("div")
            .attr("legend","")

    legend
        .style("width",descr.width)
        .attr("chart-type", descr.type)
    
    var descr = legend.selectAll("[description]").data(descriptions);

    var new_descr = descr.enter()
        .append("span")
            .attr("description","")
    new_descr
        .append("span")
            .attr("color-spot","")

    new_descr
        .append("span")
            .attr("color-text","")

    descr.exit().remove();
    descr
        .attr("xaxis-name",function(d) { 
            return d.xaxis || undefined
        });
    descr
    .select("[color-spot]")
        .attr("b-color", function(d) {
            return !d.xaxis && color(d.name) || undefined
        })
    descr
    .select('[chart-type="line"] [color-spot],[chart-type="bar"] [color-spot]')
        .attr("onclick",function(d) {
            return "D3C.A('d3c-type','line').A('d3c-xaxis',"+d.name+").draw(this)" 
        })

    descr
    .select("[xaxis-name] [color-spot]")
        .attr("onclick",function(d) { 
            return "D3C.A('d3c-type','bar').A('d3c-xaxis').draw(this)" 
        })

    descr
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
      if (tspan.node().getComputedTextLength() > width) {
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
    var controllers = QSA("[d3c]");
    for(var i=0;i<controllers.length;++i) {
        D3C.setupController(controllers[i]);
        X.autoResizeOnEvent(null, controllers[i]);
    }
};
D3C.setupController = function(c) 
{
    var descr = D3C.parseDescr( c );
    var tdescr = D3C.collectData( {}, descr.source, descr);
    if(tdescr) {
        if(descr.newEngine)  
            D3C.render(tdescr,descr)
        else
            D3C.render(tdescr,descr)
    }
};
D3C.setup = function() { D3C.handleControllers() }
D3C.getD = function(o)
{
    var inchart;
    if(inchart = o.attrUpward("chart-holder")) {
        o = inchart.nextElementSibling;
    } else {
        o = o.attrUpward("d3c")
    }
    return o;
}
D3C.draw = function(o) { (o = D3C.getD(o)) && D3C.setupController(o) }
D3C.A = function(name, value)
{
    var obj = [{n:name,v:value}];
    var ret = { 
        draw : function(o) {
            o = D3C.getD(o);
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
