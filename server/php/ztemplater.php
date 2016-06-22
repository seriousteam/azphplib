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
	
	$addr['flat'] = @$_REQUEST['flat'] ? TRUE : FALSE;

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
		echo json_encode([ 'Q1'=>[], 'info' => [] ]);

		//echo json_encode(
		//	$data_func($addr, $cmd, $args/*, new smap(null, $_REQUEST)*/)
		//);
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
	$query_tree = [
	'Q1' => [
		'table' => 'country',
		'select' => [
			'country_id' => ['alias' => 'a__country_id'],
			'country' => ['alias' => 'a__country'],
			'Q2' => [
				'table' => 'city',
				'select' => [
					'city_id' => ['alias' => 'a__city_id'],
					'city' => ['alias' => 'a__city'],
					'country_id' => ['alias' => 'a__country_id'],
					'Q3' => [
						'table' => 'address',
						'select' => [
							'address_id' => ['alias' => 'a__address_id'],
							'address' => ['alias' => 'a__address'],
							'address2' => ['alias' => 'a__address2'],
							'city_id' => ['alias' => 'a__city_id']
						],
						'from' => 'address WHERE city_id=ext.city_id',
						'ext' => ['Q2.city_id']
					]
				],
				'from' => 'city WHERE country_id=ext.country_id',
				'ext' => ['Q1.country_id']
			]
		],
		'from' => 'country LIMIT 10'		
	]	
	];
	///////////////////////////////////////////
	////////////Template environment///////////
	///////////////////////////////////////////
	$addr = $addr ?: ['get' => $main_query];
	
	$path = explode('.', $addr['get']);
	$queryname = array_shift($path);
	$query = $query_tree[ $queryname ];	
	foreach($path as $q) {
		$query = $query["select"][$q];
		$queryname = $q;
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
			$name = strtolower($name);
			if(@$field['select']) {
				$select = buildSQL( $field, $field["select"] );
				return "( $select ) AS ARRAY $name";
			}
			return "a.$name AS {$field['alias']}";
		}, $fields, array_keys($fields) );
		return 'SELECT '.implode(', ',$fields)." FROM {$query['from']}";
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
	function collectSQL($sqlqueryname, $fields, &$rowset, &$data,
		&$counters, &$statements, $info = null) {
		$info = $info ?: @$rowset->exInfo;
		foreach(
		with_loop_info($rowset, 
			$counters->{$sqlqueryname}, 
			$statements->{$sqlqueryname} = $info) as $d) {
			$row = [];
			foreach($fields as $name=>$field) {
				$sqlname = strtolower($name);
				if(@$field['select']) {
					$row[$name] = [];					
					collectSQL( $sqlname, $field['select'], $d->{$sqlname}, $row[$name], 
						$counters, $statements, $d->subselect_info($sqlname) );
				} else {
					$row[$name] = (string)$d->ns($field['alias']);
				}
			}
			$data[] = $row;
		}
	};
	$sqlqueryname = strtolower($queryname);
	$response[ $queryname ] = [];
	$response[ 'info' ] = [];
	
	$rowsets[ $sqlqueryname ] = process_query($qcmd, $args);

	collectSQL( $sqlqueryname, $fields, $rowsets[ $sqlqueryname ], $response[ $queryname ], 
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
  	/*
			Generated structure:
			--------------------------
			Array:
			$ : new Query { ( Service data )
				parent : Row | Array
				path
			}
			[
				{ ..Row.. }
				{ ..Row.. }
				{ ..Row.. }
			]
			
			--------------------------
			Row:
			{
				$ : new Row { ( Service data )
					parent : Array
					path
				}
				field1 : { ..Field.. },
				field2 : { ..Field.. }
			}
			
			--------------------------
			Field:
			{
				$ : new Field { ( Service data )
					parent : Row
					path
				}
				value : 'val',
				pk : true | false
			}
			
			--------------------------
	*/

	/*
  		Address
		{
			get : Q1 -> get : Q1
			pk : [val1, val2,...] -> pk0 : val1, pk1 : val2
			pp : [val1, val2,...] -> pp0 : val1, pp1 : val2
			name : [field1, field2,...] -> name0 : field1, name1 : field2
		}
  	*/
  	function isQuery(elem)	{ return angular.isArray(elem) }
  	function isRow(elem) { return elem.$.parent_array }
  	function isField(elem) { return !angular.isArray(elem) && elem.$.parent_row }
  	function getPath(elem, path/*=null*/) {
  		if(elem.$.parent_array) {
  			//row
  			return getPath(elem.$.parent_array, path);
  		} else
  		if(elem.$.parent_row) {
  			//field or child-array
  			return getPath(elem.$.parent_row, elem.$.name + (path?('.'+path):''));
  		} else {
  			//root
  			return elem.$.name + (path?('.'+path):'');
  		}  		
  	}
  	function getItsQuery(elem) {
  		/* 
  		*	returns query of field and row, parent query for query, and null for root query 
  		*/
  		return elem.$.parent_array || (elem.$.parent_row && elem.$.parent_row.$.parent_array) || null;  		
  	}
  	function getClosestQuery(elem) {
  		/* 
  		*	returns query of field and row, and query itself for query
  		*/
  		return isQuery(elem) ? elem : (elem.$.parent_array || elem.$.parent_row.$.parent_array)
  	}
  	function getRow(elem) {
  		return isRow(elem) ? elem : elem.$.parent_row;
  	}
  	function getPK(elem, info) {
  		/*  
  		*	['val1','val2',...]
  		*	Q1.Q2.Q3.row.field - pk of Q3
		*	Q1.Q2.Q3.row - pk of Q3
		*	Q1.Q2.Q3 - pk of Q2
		*	Q1 - null 
  		*/
  		var query = getItsQuery( elem );
  		if(!query) return null;
  		var pk = info[ getPath(  query ) ].pk || [];
  		var row = getRow( elem );
  		return pk.map(function(name) { return row[name].value })
  	}
  	function getPP(elem,info) {
  		/* 
  		*	['val','val','val',...]
  		*	Q1.Q2.Q3.row.field - pk of Q1, Q2
  		*	Q1.Q2.Q3.row - pk of Q1, Q2
  		*	Q1.Q2.Q3 - pk of Q1
  		*	Q1.Q2 - []
  		*	Q1 - []
  		*/
  		var pp = [];
  		while(elem = getItsQuery(elem)) {
  			var pk = getPK(elem,info);
  			if(pk) {
  				for(var i=pk.length-1;i>=0;i--) {
	  				pp.unshift(pk[i]);
	  			}
  			}	  		
  		}
  		return pp;
  	}  	
  	function linkField(name, row) {//repeatcall-safe ${name, parent_row}
  		row[name] = {
  			$ : { name : name, parent_row : row },
  			value : row[name].value || row[name]
  		}
  	}
  	function linkRow(row, query) {//repeatcall-safe ${parent_array}
  		delete row.$;
  		for(var name in row) {
  			if(angular.isArray(row[name])) {
  				linkQuery(name, row[name], row);
  			} else {
  				linkField(name, row);
  			}
  		}
  		row.$ = { parent_array : query	}
  	}
  	function linkQuery(name, array, row) {//repeatcall-safe ${name, parent_row}
  		array.$ = {	name : name, parent_row : row }
  		array.forEach(function(r) { linkRow(r, array) })
  	}
	function linkScope(queries,scope) {
  		queries.forEach(function(query) {
  			linkQuery(query, scope[query]);
  		})
  	}
  	function encodeAddress(src) {
  		var rez = {};
  		for(var name in src) {
  			if(angular.isArray(src[name])) {
  				src[name].forEach(function(value,i) {
  					rez[name+i] = value;
  				});
  			} else if(src[name]!==undefined) {
  				rez[name] = src[name];
  			}
  		}
  		return rez;
  	}
  	function getReload(elem, info) {
  		var src = { get : getPath( getClosestQuery(elem) ), pp : getPP(elem,info) };
  		if(!angular.isArray(elem)) {
  			src.pk = getPK(elem,info);
  			if(!elem.$.parent_array) {
  				src.name = [elem.$.name];
  			}
  		}
  		//return encodeAddress(src);
  		return { 
  			src : encodeAddress(src), 
  			ok : function(response) {
  				/* Structure of response
				*	{ 
				*		"info" : [],
				*		"Q1" : [
				*			{"f1" : "value1",...},
				*			...
				*		]
				*	}
  				*/
  				var rawdata = [];
  				for(var i in response.data) {
  					if(i !== 'info') { rawdata = response.data[i] }
  				}
  				if(isQuery(elem)) {
  					//empty array if empty response
  					elem.splice(0,elem.length);
  					if(rawdata.length) {
  						for(var i=0;i<rawdata.length;++i) {
	  						elem.push(rawdata[i]);
	  					}
	  					linkQuery(elem.$.name, elem, elem.$.parent_row);
  					}  					
  					return;
  				}
  				if(isRow(elem)) {
  					var idx = elem.$.parent_array.indexOf(elem);  					
  					if(rawdata.length) {
  						elem.$.parent_array.splice( idx, 1, rawdata[0]);
  						linkRow(elem.$.parent_array[idx], elem.$.parent_array);
  					} else {
  					//delete row
  						elem.$.parent_array.splice( idx, 1 );
  					}
  					return;
  				}
  				if(isField(elem)) {
  					if(rawdata.length) {
  						var name = elem.$.name;
  						var row = elem.$.parent_row;
  						row[name] = rawdata[0][name];
  						linkField(name, row);
  					} else {
  					//delete row
  						var array = elem.$.parent_row.$.parent_array;
  						array.splice( array.indexOf(elem.$.parent_row), 1 );
  					}
  				}
  			}
  		};
  	}
  	function pushDataIntoScope(elem,data) {
  		//if() {

  		//}
  	}
  </script>
<script>
var heart = angular.module('heart',['ngResource']);
heart.controller('main', function($scope, $http, $resource) {
//var Server = $resource(location.href);
$scope.reload = function(elem) {
	var addr = getReload(elem, $scope.const_info );
	$http.get(location.href, { params : addr.src })
	.then( addr.ok,
	function(data) {

	})
	//console.log(elem);
	//var descr = elem.$ ? elem.$ : elem;
	//Server.query( xreload(elem, $scope.const_info ) );
	//elem.$reload({})
	//var result = Server.query( getAddress(elem, $scope.const_info ), 
	//	function() {
	//
	//		//$scope[q] = result;
	//	});
	//elem.$
}
//What You Requested Is What You Get WYRIWYG
$scope.const_info = {
	"Q1" : { pk : ["country_id"], flat: true }
	,"Q1.Q2" : {	pk : ["city_id"], flat: true }
	,"Q1.Q2.Q3" : { pk : ["address_id"], flat: true }
	//"Q1.syrecordidw" : {},
	//"Q1.enrel_taskw" : {},
	//"Q1.Q2.syrecordidw" : {},
	//"Q1.max" : { src : "Q1" },
	//"Q1.Q2.sum" : { src: "Q1.Q2" },
	//"Q1.rel1.rel2" : { fk : ["pk1","pk2"] },
	//"Q1.rel1" : { fk : ["pk"] }
}
<?php
	foreach($data as $k=>$v) {
		echo "\$scope.$k=".json_encode($v, JSON_PRETTY_PRINT).";".PHP_EOL;
	}
?>
linkScope(['Q1'], $scope);
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
	<div ng-repeat="row in Q1" style="border:1px solid black;padding:0.5em;margin:1em;border-radius:1em">
		<button ng-click="reload(row.country_id)">row.country_id</button>
		{{row.country.value}}
		<input ng-model="row.country.value">
		<div ng-repeat="row2 in row.Q2" style="border-radius:1em;background:rgba(255,255,0,0.2);padding:0.5em;margin:0.5em;box-shadow:0 0 5px rgba(0,0,0,0.1)">{{row2.city.value}}({{row.country.value}}){{row2.city_id.value}}
			<button ng-click="reload(row2)">Q2 row reload</button>
			<button ng-click="reload(row2.city_id)">row2.city_id</button>
			<div ng-repeat="row3 in row2.Q3" style="padding:0.5em;margin:0.5em;border-radius:1em;background:rgba(0,0,255,0.1)">
				{{row3.address.value}}
				<button ng-click="reload(row3)">Q3 row reload  </button>
				<button ng-click="reload(row3.address)">Q3.address</button>
			</div>
			<button ng-click="reload(row2.Q3)">Q3 reload </button>
		</div>
		<button ng-click="reload(row)">Q1 row reload</button>
		<button ng-click="reload(row.Q2)">Q2 reload</button>
	</div>
	Sum : {{id}}
	<button type=button ng-click="reload(Q1)">fullreload</button>
</body>
</html>
<?php
};
//request handling
dispatch_template2(main_address(),main_argument(),main_subarguments());