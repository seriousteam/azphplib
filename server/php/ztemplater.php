<?php
//runtime functions
function main_address() {
	/*
		$_REQUEST
		Formulas:
		get[pkN][ppN][name] = query pk parentparam name = JS data
		empty = full template with data
	*/
	if(@$_REQUEST['get'])
		$addr['get'] = $_REQUEST['get'];
	else
		return null;
	
	$addr['plane'] = @$_REQUEST['plane'] ? TRUE : FALSE;

	$i=0;
	while(@$_REQUEST["pk$i"]) {
		$addr["pk"][] = $_REQUEST["pk$i"];
		$i++;
	}
	$i=0;
	while(@$_REQUEST["pp$i"]) {
		$addr["pp"][] = $_REQUEST["pp$i"];
		$i++;
	}
	$i=0;
	while(@$_REQUEST["name$i"]) {
		$addr["name"][] = $_REQUEST["name$i"];
		$i++;
	}
	return $addr;
}
function push_to_cmd($c, $a, &$cmd, &$args) {
	if($cmd) {
		$args[] = $c;
		$args = array_merge($args, $a);
	} else {
		$cmd = $c;
		$args = $a;
	}
}
function dispatch_template2($addr, $cmd, $args) {
	global $functions;	
	$func_name = '_main_';	
	if(!@$functions[$func_name])
		throw new Exception("cannot find template function '$func_name' in ");
	
	$data_func = $functions[$func_name]['data'];
	if($addr) {
		//generate and send data
		echo json_encode(
			$data_func($addr, $cmd, $args/*, new smap(null, $_REQUEST)*/)
		);
	} else {
		//generate data		
		$data = $data_func(null, $cmd, $args/*, new smap(null, $_REQUEST)*/);		
		//send data within template
		$func = $functions[$func_name]['template'];
		$func($data, $cmd, $args/*, new smap(null, $_REQUEST)*/);
	}		
}
require_once(__DIR__.'/template-runtime.php');
//data, maps, dependencies
$functions['_main_']['data'] = function($addr, $cmd, $args = null, $params = null) {
	/*
	//Sample
	$counters = new stdClass;
	$statements = new stdClass;
	$qcmd = merge_queries("SELECT   a.enf_moneyw AS a__enf_moneyw, a.syrecordidw AS a__syrecordidw,
		( SELECT  a.syrecordidw AS a__syrecordidw, 
			( SELECT a.enf_paramw AS a__enf_paramw, a.syrecordidw AS a__syrecordidw FROM enrf_expertise_items WHERE enrel_contw=ext.syrecordidw) AS ARRAY items 
			FROM enrf_expertises WHERE enrel_taskw=ext.syrecordidw ) AS ARRAY exps
		FROM enrf_stages 
		WHERE 
			enf_moneyw IS NOT NULL
		AND  enf_datew IS NOT NULL
		ORDER BY enf_datew
		LIMIT 500
", $cmd, $args, $requested_offset, $requested_limit, $page_limit);
	$rowsets['data'] = process_query($qcmd, $args);
	foreach(
		with_loop_info($rowsets['data'], $counters->data, $statements->data = @$rowsets['data']->exInfo) as $data) {
		echo $data->ns("a__enf_moneyw");
		foreach(with_loop_info($data->exps, $counters->exps, $statements->exps = $data->subselect_info('exps')) as $exps) {
			//echo $exps->ns("a__syrecordidw");
			echo $data->ns("a__syrecordidw");
			foreach(with_loop_info($exps->items, $counters->items, $statements->items = $exps->subselect_info('items')) as $items) {
				echo $items->ns('a__enf_paramw');
			}
		}
	}
	//Sample end	
	*/

	/*
	//Subselect Root
	$counters = new stdClass;
	$statements = new stdClass;
	$args=[96];
	$cmd='*WHERE enf_ratew=?';
	$qcmd = merge_queries("SELECT  a.syrecordidw AS a__syrecordidw, a.enf_ratew AS a__enf_ratew FROM enrf_expertises WHERE enrel_taskw = ext.syrecordidw", $cmd, $args, $requested_offset, $requested_limit, $page_limit);
	array_unshift($args,'0Ug1010Joc_93i8XX62cLb00');
	$rowsets['data'] = process_query($qcmd, $args);
	foreach(
		with_loop_info($rowsets['data'], $counters->data, $statements->data = @$rowsets['data']->exInfo) as $data) {
		echo $data->ns("a__syrecordidw").'-'.$data->ns("a__enf_ratew")."; ";
	}
	*/
	/*
	//Subselect Root with leaf
	$args=[96];
	$cmd='*WHERE enf_ratew=?';

	$qcmd = merge_queries("SELECT  a.syrecordidw AS a__syrecordidw, a.enf_ratew AS a__enf_ratew, 
		( SELECT a.enf_paramw AS a__enf_paramw, a.enrel_contw AS a__enrel_contw FROM enrf_expertise_items WHERE enrel_contw=ext.syrecordidw) AS ARRAY items 
		FROM enrf_expertises WHERE enrel_taskw=ext.syrecordidw", $cmd, $args, $requested_offset, $requested_limit, $page_limit);

	array_unshift($args,'0Ug1010Joc_93i8XX62cLb00');

	$rowsets['data'] = process_query($qcmd, $args);
	foreach(
		with_loop_info($rowsets['data'], $counters->data, $statements->data = @$rowsets['data']->exInfo) as $data) {
		echo $data->ns("a__syrecordidw").'-'.$data->ns("a__enf_ratew")."; ";
		foreach(with_loop_info($data->items, $counters->items, $statements->items = $data->subselect_info('items')) as $items) {
			echo PHP_EOL.$items->ns('a__enrel_contw').'-'.$items->ns('a__enf_paramw');
		}
	}	
	*/
	////////////////////////////////////////////
	//////////////Template variable/////////////
	////////////////////////////////////////////
	$main_query = 'Q1';
	$query_map = [
		'Q1' => 'Q1',
		'Q2' => 'Q1.Q2',
		'Q3' => 'Q1.Q2.Q3'
	];	
	$query_tree = [
	'Q1' => [
		'table' => 'enrf_stages',
		'select' => [
			'syrecordidw' => ['alias' => 'a__syrecordidw'],
			'enf_moneyw' => ['alias' => 'a__enf_moneyw'],
			'Q2' => [
				'table' => 'enrf_expertises',
				'select' => [
					'syrecordidw' => ['alias' => 'a__syrecordidw'],
					'enf_ratew' => ['alias' => 'a__enf_rate'],
					'enrel_taskw' => ['alias' => 'a__enrel_taskw'],
					'Q3' => [
						'table' => 'enrf_expertise_items',
						'select' => [
							'syrecordidw' => ['alias' => 'a__syrecordidw'],
							'enf_paramw' => ['alias' => 'a__enf_paramw'],
							'enrel_contw' => ['alias' => 'a__enrel_contw']
						],
						'from' => 'FROM enrf_expertise_items WHERE enrel_contw=ext.syrecordidw',
						'ext' => ['Q2.syrecordidw']
					]
				],
				'from' => 'FROM enrf_expertises WHERE enrel_taskw = ext.syrecordidw',
				'ext' => ['Q1.syrecordidw']
			]
		],
		'from' => 'FROM enrf_stages WHERE enf_moneyw IS NOT NULL AND enf_datew IS NOT NULL ORDER BY enf_datew LIMIT 10'		
	]	
	];
	///////////////////////////////////////////
	////////////Template environment///////////
	///////////////////////////////////////////
	$addr = $addr ?: ['get' => $main_query];

	$queryname = $addr['get'];
	$path = explode('.', $query_map[ $queryname ]);
	$query = $query_tree[ array_shift($path) ];	
	foreach($path as $q) {
		$query = $query["select"][$q];
	}

	//collect pk filter
	if(@$addr['pk']) {
		global $Tables;
		$filter = $Tables->{$query['table']}->PK(true);	
		if( count($filter) > count($addr['pk']) )
			throw new Exception( "Primary key-value mismatch {$query['table']}" );		
		foreach($filter as $i=>$field) {
			push_to_cmd("*WHERE $field=?",[ $addr['pk'][$i] ], $cmd, $args);
		}
	}

	//collect fields
	$fields = @$addr['name'] ? 
			array_intersect_key($query['select'], array_flip( $addr['name'] )) : $query['select'];

	//construct query
	function buildSQL($query, $fields) {
		$fields = array_map(function($field, $name) {
			if(@$field['select']) {
				$select = buildSQL( $field, $field["select"] );
				return "( $select ) AS ARRAY $name";
			}
			return "a.$name AS {$field['alias']}";
		}, $fields, array_keys($fields) );
		return 'SELECT '.implode(', ',$fields)." {$query['from']}";
	};

	$qcmd = merge_queries( buildSQL($query, $fields), 
		$cmd, $args, $requested_offset, $requested_limit, $page_limit);

	//add parent parameters for subquery
	if(@$addr['pp']) {
		$ext = $query['ext'];
		if($ext) {
			if(count($ext) > $addr['pp'])
				throw new Exception("Given parent parameters are insufficient");
			$args = array_merge(
				array_slice( $addr['pp'], -count($ext), count($ext) ), 
				$args);
		}				
	}

	//generate data structure	
	$counters = new stdClass;
	$statements = new stdClass;
	function collectSQL($queryname, $fields, &$rowset, &$data,
		&$counters, &$statements, $info = null) {
		$info = $info ?: @$rowset->exInfo;
		foreach(
		with_loop_info($rowset, 
			$counters->{$queryname}, 
			$statements->{$queryname} = $info) as $d) {
			$row = [];
			foreach($fields as $name=>$field) {
				if(@$field['select']) {
					$row[$name] = [];
					collectSQL( $name, $field['select'], $d->{$name}, $row[$name], 
						$counters, $statements, $d->subselect_info($name) );
				} else {
					$row[$name] = (string)$d->ns($field['alias']);
				}
			}
			$data[] = $row;
		}
	};
	$response[ $queryname ] = [];
	$response[ 'info' ] = [];

	$rowsets[ $queryname ] = process_query($qcmd, $args);

	collectSQL( $queryname, $fields, $rowsets[ $queryname ], $response[ $queryname ], 
		$counters, $statements );	
	/*
	PHP
		[
			'info' => [],
			'Q1' => [
				['f1' => 'value1', 'f2'=>'value1'],
				['f1' => 'value2', 'f2'=>'value2']
			]
		]
	JSON
		{ 
			"info" : [],
			"Q1" : [
				{"f1" : "value1",...},
				...
			]
		}
	SCOPE
		$scope.info = [];
		$scope.Q1 = [...];
	*/
	return $response;
};
//template
$functions['_main_']['template'] = function($data, $cmd = null, $args = null, $params = null) {
?>
<html>
<head>
  <script type="text/javascript" 
  src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0/angular.js"></script>
  <script type="text/javascript" 
  src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0/angular-resource.js"></script>
  <script>
	function linkData(data,info,depth,parentparams) {
		parentparams = parentparams || [];
		data.$ = {
			dst : data,
			src : { 
				get : depth[ depth.length-1 ]
			}
		}
		data.$.src.pp = parentparams.slice();	
		var pk = info[ depth.join('.') ].pk;
		data.forEach(function(row) {
			var descr = {
				dst : row,
				src : angular.copy(data.$.src)
			}
			for(var fldname in row) {
				if(!angular.isArray(row[fldname])) {
					row[fldname] = { 
						value : row[fldname]
					}
				}
			}
			descr.src.pk = [];
			pk.forEach(function(pkname,i) {
				if(!row[pkname]) console.log("Error! Table info incorrect through bad pk definition");
				descr.src.pk.push( row[pkname].value );
				row[pkname].pk = true;
			})				
			for(var fldname in row) {
				var infoname = depth.join('.')+'.'+fldname;
				var field = row[fldname];
				if(angular.isArray(field)) {					
					linkData( field, info, depth.concat(fldname), 
						parentparams.concat(pk.map(function(pkname) {
							return row[pkname].value
						}))
					);				
				} else {
					if(info[infoname] && info[infoname].requery) {
						//full requery
						field.dst = data;
						field.src = angular.copy(data.$.src);
					} else {
						field.dst = row;				
						field.src = angular.copy(descr.src);
						//row requery for pk
						if(!field.pk) {
							field.src.name = [ fldname ];
						}						
					}					
				}
			}
			row.$ = descr;
		})
	}
	function linkScope(scope,queries) {
  		queries.forEach(function(query) {
  			linkData(scope[query], scope.const_info, [query]);
  		})
  	}
  	function encodeResource(src) {
  		for(var name in src) {
  			if(angular.isArray(src[name])) {
  				src[name].forEach(function(value,i) {
  					src[name+i] = value;
  				});
  				delete src[name];
  			}
  		}
  		return src;
  	}
  </script>
<script>
var heart = angular.module('heart',['ngResource']);
heart.controller('main', function($scope, $resource) {
var Server = $resource(location.href);
$scope.reload = function(elem) {
	console.log(elem);
	var descr = elem.$ ? elem.$ : elem;
	Server.query( encodeResource(descr.src) );
	//elem.$reload({})
	/*
	var result = Server.query({ query:q }, function() {
		$scope[q] = result;
	});*/
}
//What You Requested Is What You Get WYRIWYG
$scope.const_info = {
	"Q1" : { pk : ["syrecordidw"], plane: true },
	"Q1.Q2" : {	pk : ["syrecordidw"], plane: true },
	"Q1.Q2.Q3" : {pk : ["syrecordidw"], plane: true },
	"Q1.syrecordidw" : {},
	"Q1.enrel_taskw" : {},
	"Q1.Q2.syrecordidw" : {},
	"Q1.max" : { requery : true },
	"Q1.Q2.sum" : { requery : true },
	"Q1.rel1.rel2" : { fk : ["pk1","pk2"] },
	"Q1.rel1" : { fk : ["pk"] }
}
<?php
	foreach($data as $k=>$v) {
		echo "\$scope.$k=".json_encode($v, JSON_PRETTY_PRINT).";".PHP_EOL;
	}
?>
linkScope($scope, ['Q1']);
		/*
		$scope.info = {
			"Q1" : { offset : 30 },
			"Q1.Q2" : {	offset : 5 },
			"Q1.Q2.Q3" : { offset: 10 }
		}
		$scope.Q1 =
		[
			{
				"syrecordidw" : "0Ug1010Joc_93i8XX62cLb00",
				"enrel_taskw" : "1b",
				"enf_moneyw" : "13423",
				"max" : "100",
				"rel1.pk" : "5",			
				"rel1.rel2.f4" : "xxx",
				"rel1.rel2.pk1" : "2",
				"rel1.rel2.pk2" : "2",
				"Q2" :						
				[
					{
						"sum" : "11",
						"syrecordidw" : "2kxR000Jr8WK3i8WTO2cLb00",
						"enf_ratew" : "12",
						"enrel_taskw" : '0Ug1010Joc_93i8XX62cLb00',
						"Q3" : [
							{
								"syrecordidw" : "3ZlhW00Js7AU3i8Xec2cLb00",
								"enf_paramw" : "aaa",
								"enrel_contw" : "2kxR000Jr8WK3i8WTO2cLb00"
							}
						]
					},
					{
						"sum" : "33",
						"syrecordidw" : "3het000Jr8WQ3i8WoI2cLb00", 
						"enf_ratew" : "23",
						"enrel_taskw" : '0Ug1010Joc_93i8XX62cLb00',
						"Q3" : [
							{
								"syrecordidw" : "2G9TG00JsrDG3i8XeQ2cLb00",
								"enf_paramw" : "bbb",
								"enrel_contw" : "3het000Jr8WQ3i8WoI2cLb00"
							}
						]
					}
				]				
			}			
		];
		*/
});  
</script>
</head>
<body ng-app=heart ng-controller=main>
	<div>Z template instance</div>
	<div ng-repeat="row in Q1">
		<button ng-click="reload(row.syrecordidw)">reload Q1.row.syrecordidw</button>
		<button ng-click="reload(row.enf_moneyw)">reload Q1.row.enf_moneyw</button>
		<button ng-click="reload(row.max)">reload Q1.max</button>
		{{row.syrecordidw.value}} : {{row.enrel_taskw.value}} : {{row.enf_moneyw.value}}
		<input ng-model="row.f1.value">
		<div ng-repeat="row2 in row.Q2">{{row.syrecordidw.value}}-{{row2.syrecordidw.value}}
			<button ng-click="reload(row2)">subreload</button>
			<button ng-click="reload(row2.syrecordidw)">subreload syrecordidw</button>
			<button ng-click="reload(row2.enf_ratew)">subreload enf_ratew</button>
			<button ng-click="reload(row2.sum)">subreload sum</button>
			<div ng-repeat="row3 in row2.Q3">
				{{row3.enf_paramw.value}}
				<button ng-click="reload(row3)">reload Q3.row</button>
				<button ng-click="reload(row3.enf_paramw)">reload Q3.row.enf_paramw</button>
			</div>
			<button ng-click="reload(row2.Q3)">subreload Q3</button>
		</div>
		<button ng-click="reload(row)">reload Q1.row</button>
		<button ng-click="reload(row.Q2)">reload Q2</button>
	</div>
	Sum : {{id}}
	<button type=button ng-click="reload(Q1)">fullreload</button>
</body>
</html>
<?php
};
//request handling
dispatch_template2(main_address(),main_argument(),main_subarguments());