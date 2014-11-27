<?php
$zip = new ZipArchive;
$zip->open($argv[1]) or die("can't open file");
if (($index = $zip->locateName('xl/sharedStrings.xml')) === false) die('content not found');
$strings = $zip->getFromIndex($index);
$strings = simplexml_load_string($strings);
$strings = $strings->xpath('//*[local-name()="t"]');

if (($index = $zip->locateName('xl/styles.xml')) === false) die('content not found');
$styles = $zip->getFromIndex($index);
$styles = simplexml_load_string($styles);

$cell_styles = $styles->xpath('//*[local-name()="cellXfs"]/*[local-name()="xf"]');

if (($index = $zip->locateName('xl/worksheets/sheet1.xml')) === false) die('content not found');
$data = $zip->getFromIndex($index);

$data = simplexml_load_string($data);

$rows = $data->sheetData->children();

$out = simplexml_load_string('<?xml version="1.0" encoding="UTF-8"?><root/>');

$ids = [];

function xls2tstamp($date) {
return ((($date > 25568) ? $date : 25569) * 86400) - ((70 * 365 +
19) * 86400);
}
date_default_timezone_set('UTC');

$cell_holders = [];
$cell_formats = [];

$skip = (int)(@$argv[2] ?: 0);

$rnum = 0;
foreach($rows as $row) {
	if($rnum++ < $skip) continue;
	$ro = $out->addChild('row');
	$idx = 0;
	foreach($row->children() as $col) {
		if(isset($col->v)) {
			$f = (string)($cell_styles[(int)(@$col['s']?:0)]['numFmtId']);
			$v = @$col['t'] == 's' ? $strings[(int)$col->v] : $col->v;
			if($v && preg_match('/\d+(\.\d+)?/', $v)) {
				if($f === '22')
					$v = date('Y-m-d H:i:s', xls2tstamp((float)$v));
				else if($f === '14' || $f === '14')
					$v = date('Y-m-d', xls2tstamp($v));
			}
			$cell_holders[$idx] = $v;
			$cell_formats[$idx] = $f;
		} else {
			$v = @$cell_holders[$idx];
			$f = @$cell_formats[$idx];
		}
		$ro->addChild('c', $v)['f'] = $f;
		$ids[$f]= 1;
		++$idx;
	}
}

echo $out->saveXML();

//echo implode(' ', array_keys($ids));
