<?php
function sas_coder_ValList($a) {
	return implode('',
		array_map(function($x) { return '_'.str_replace('~','~~',$x).'~'; }
			, $a)
	);
}
function sas_coder_Pair($k, $v) {
	return str_replace(':','::', $k).':'.str_replace(':','::', $v);
}
function sas_coder_Map($a) {
	return implode('',
		array_map(function($k, $v) { return 
				'_'.str_replace('~','~~',sas_coder_Pair($k, $v)).'~'; 
			}
			, array_keys($a), $a)
	);
}

function sas_coder_DecodeValList( $s ) {
	if(!is_string($s)) return []; 
	preg_match_all('/(?<=_)[^~]*+(?:~~[^~]*+)*(?=~)/s', $s, $m);
	return array_map(function($e) { return str_replace('~~','~', $e); }, $m[0]);
}
function sas_coder_DecodeMap( $s ) {
	$a = sas_coder_DecodeValList( $s );
	$r = [];
	if($a)
	foreach($a as $v)
		if(preg_match('/([^:]*+(?:::[^:]*+)*):([^:]*+(?:::[^:]*+)*)/s', $v, $m))
			$r[str_replace('::',':',$m[1])] = str_replace('::',':', $m[2]);
	return $r;
}