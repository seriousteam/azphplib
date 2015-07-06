<?php
if($argc<3) die("Usage: php -f dbf2csv.php encoding dbffile exclude_header1,excl_head2,...");

$ccp = $argv[1];
$file = $argv[2];
$excl = @$argv[3];
$excl = $excl ? explode(',',$excl) : [];
/*
CP866
KOI8-R
*/

if(strtolower(pathinfo($file, PATHINFO_EXTENSION ))=="dbf") {
	$db = dbase_open($file, 0);
	$table = strtolower(pathinfo($file, PATHINFO_FILENAME ));
	if ($db) {
		$csv = fopen(pathinfo($file, PATHINFO_DIRNAME )."/$table.csv",'w');
		$fields = array_map(function($v) {
			return strtolower($v['name']);
		},dbase_get_header_info($db));
		$fields[]='del';
		fputcsv($csv,  array_values( array_diff($fields, $excl) ) );
		$excl = array_flip($excl);
		$reccount = dbase_numrecords($db);
		for ($i = 1; $i <= $reccount; $i++) {
			$data = array_map(function($v) {
				global $ccp;
				return htmlspecialchars(iconv($ccp,"UTF-8",$v));
			}, dbase_get_record($db,$i));
			$data = array_combine($fields, $data);
			$data = array_diff_key($data, $excl);
			fputcsv($csv,  array_values( $data ) );
		}
		dbase_close($db);
	}
}
