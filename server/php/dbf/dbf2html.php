<?php
if($argc<3) die("Usage: php -f dbf2html.php encoding(CP866,KOI8-R) dbffile|dbffolder maxnumofrecords");
$ccp = $argv[1];
$dbf = $argv[2];
$num = @$argv[3]?:100;
$dbfs = [];
if(is_dir($dbf)) {
	$files = array_diff(scandir($dbf), array('..', '.'));
	foreach($files as $file) {
		if(!is_dir($dbf.DIRECTORY_SEPARATOR.$file)) {
			$dbfs[] = $dbf.DIRECTORY_SEPARATOR.$file;
		}
	}
} else 
	$dbfs[]=$dbf;
/*
CP866
KOI8-R
*/
$html = fopen(pathinfo($dbfs[0], PATHINFO_DIRNAME ).'/dbfhtmlview.html','w');
fputs($html, <<<HEAD
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
</head>
<body>
HEAD
);
foreach($dbfs as $file) {
	
	if(strtolower(pathinfo($file, PATHINFO_EXTENSION ))=="dbf") {
		$db = dbase_open($file, 0);
		$table = strtolower(pathinfo($file, PATHINFO_FILENAME ));
		if ($db) {
			fputs($html,<<<THE
<h3>$table</h3>
<table border=1>		
THE
);
			$fields = array_map(function($v) {
				return strtolower($v['name']).' '.$v['type'].'('.$v['length'].','.$v['precision'].')';
			},dbase_get_header_info($db));
			$fields[]='del';
			fputs($html,'<thead>'.implode('',array_map(function($v) {
				return "<th>$v</th>";
			},$fields)).'</thead>');
			fputs($html,'<tbody>');
			$reccount = dbase_numrecords($db);
			for ($i = 1; $i <= min($num,$reccount); $i++) {
				$data = array_map(function($v) {
					global $ccp;
					return htmlspecialchars(iconv($ccp,"UTF-8",$v));
				}, dbase_get_record($db,$i) );
				fputs($html, '<tr>'.implode('',array_map(function($v) {
					return "<td>$v</td>";
				},$data)).'</tr>');
			}
			fputs($html,'</tbody></table>');
			dbase_close($db);
		}
	}
}
fputs($html,<<<TALE
</body></html>
TALE
);