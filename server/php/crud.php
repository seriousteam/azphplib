<?php 
require_once(__DIR__.'/db-oo.php');
require_once(__DIR__.'/sas_coder.php');

function do_crud($commands, $do_pk) {
	$ret = [];

foreach($commands as $command) {

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
		else
			$mode = 'R';
	}
} else {
	$mode = 'C';
}

try {
	global $Tables;
	$table = $Tables->{$table};
	$pk = $do_pk ?: $table->PK(true);
	if(!$pk) throw new Exception("$table->___name don't have PK");

//$SQL_EMULATION = TRUE;

/*
returning
PGSQL INSERT INTO ..... RETURNING output_expression AS output_name
MSSQL
ORACLE
MYSQL
*/

switch($mode) {
case 'C':
	$vals = $fieldvals + $def_vals;
	
	foreach($vals as $f=>$v) {
		if($f[0] == '+') {
			$v = GenCID($table, $v?:0);
			unset($vals[$f]);
			$vals[substr($f,1)] = $v;
		}
	}
	
	$st = Insert($table->___name, $vals, $ss);
	//echo $st->queryString;
	if( $table->AUTO_KEY() && $ss !== NULL )
		$vals[$table->AUTO_KEY()] = $ss;
	
	foreach($pk as $e)
		$d[] = $vals[$e];
	$arr = [ 'table' => $table->___name
			,'key_vals' => 
					sas_coder_ValList([sas_coder_ValList($d)])//sas compatible!
		];
	
	$ncmd = file_URI('//az/server/php/crud.php', $arr);
	
	$ret[] = "I: _ $ncmd";
	break;
	
case 'D':
	Delete($table->___name.' WHERE '.
		implode(' AND ',array_map(function($x){ return "$x = ?"; }, $pk))
	, $key_vals);
	
	$ret[] = 'D: _';
	//if($stmt->rowCount() == 0)
	//	echo "\n", $stmt->queryString;
	break;
	
case 'U':
	$stmt = Update($table->___name.' WHERE '.
	 	implode(' AND ',array_map(function($x){ return "$x = ?"; }, $pk))
	, $key_vals, $fieldvals);

	$ret[] = 'U: _ '.$stmt->rowCount();
	//if($stmt->rowCount() == 0)
		//echo "\n", $stmt->queryString;
	break;

case 'R':
	$rows = [];
	foreach(Select(
		implode(', ',
			array_map( function($k, $v) { return $v? "$v AS $k" : $k; }
				,array_keys($def_vals)
				,$def_vals
			)
		)
		." FROM $table->___name WHERE "
		.implode(' AND ',array_map(function($x){ return "$x = ?"; }, $pk))
		, $key_vals
	) as $r) {
		foreach($r as $v)
			$rt[] = $v;
		$rows[] = sas_coder_ValList($rt);
	}

	$ret[] = 'S: _ '. implode("\n", $rows);
	break;
default:
	throw new Exception("unknown mode: $mode");
}

} catch(Exception $e) {
	$ret[] = "E: $e";
}

}

return $ret;
}

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

echo implode("\n", do_crud($commands, @$_REQUEST['pk']) );
