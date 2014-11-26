<?php 
require_once(__DIR__.'/db-oo.php');
require_once(__DIR__.'/sas_coder.php');

if(__FILE__ != TOPLEVEL_FILE) return;

if(isset($_REQUEST['commands'])) {
	$commands = sas_coder_DecodeValList($_REQUEST['commands']);
	$commands = array_map(function($a) {
		parse_str($a, $m);
		return $m;
	}, $commands);
} else {
	$commands = [ $_REQUEST ];
}


$first = true;

foreach($commands as $command) {
if(!$first) echo "\n";
$first = false;

$table = $command['table'];
$key_vals = sas_coder_DecodeValList(sas_coder_DecodeValList($command['key_vals'])[0]);
$fieldvals = sas_coder_DecodeMap(@$command['fieldvals']);
$def_vals = @$command['def_vals'] == '-' ?  '-' :
	sas_coder_DecodeMap(@$command['def_vals']);

if($key_vals) {
	if($fieldvals) {
		$mode = 'U';
	} else {
		if($def_vals == '-')
			$mode = 'D';
	}
} else {
	$mode = 'C';
}

try {
	$table = $Tables->{$table};
	$pk = $table->PK(true);
	if(!$pk) throw new Exception("$table don't have PK");

//$SQL_EMULATION = TRUE;

switch($mode) {
case 'C':
	$vals = $fieldvals + $def_vals;
	//!! Insert($table->___name, $vals);
	
	foreach($pk as $e)
		$d[] = $vals[$e];
	$arr = [ 'table' => $table->___name
			,'key_vals' => 
					sas_coder_ValList([sas_coder_ValList($d)])//sas compatible!
		];
	
	$ncmd = file_URI('//az/server/php/crud.php', $arr);
	
	echo "I: _ $ncmd";
	break;
	
case 'D':
	//!! Delete($table->___name.' WHERE '.
	//!! 	implode(' AND ',array_map(function($x){ return "$x = ?"; }, $pk))
	//!! , $key_vals);
	
	echo 'D: _';
	break;
	
case 'U':
	$stmt = Update($table->___name.' WHERE '.
	 	implode(' AND ',array_map(function($x){ return "$x = ?"; }, $pk))
	, $key_vals, $fieldvals);

	echo 'U: _ '.$stmt->rowCount();
	break;

case 'R':
	$rows = [];
	foreach(Select(
		implode(', ',
			array_map( function($k, $v) { return $v? "$v AS $k" : $k; }
				,array_keys($fieldvals)
				,$fieldvals
			)
		)
		." FROM $table WHERE "
		.implode(' AND ',array_map(function($x){ return "$x = ?"; }, $pk))
		, $key_vals
	) as $r) {
		foreach($r as $v)
			$rt[] = $v;
		$rows[] = sas_coder_ValList($rt);
	}

	echo 'S: _ ', implode("\n", $rows);
	break;
default:
	throw new Exception("unknown mode: $mode");
}

} catch(Exception $e) {
	echo "E: $e";
}

}