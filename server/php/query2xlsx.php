<?php
require_once(__DIR__.'/processor.php');

function query_to_xlsx($cmd, $args = [], $hline = [], $name = '') {
	
	
	$zip = new ZipArchive;
	$zip->open(__DIR__.'/sample.xlsx') or die("can't open sample file");

	if (($index = $zip->locateName('xl/worksheets/sheet1.xml')) === false) die('sample content not found');
	$data = $zip->getFromIndex($index);
	
	$zip->close();

	$data = simplexml_load_string($data);

	$out = $data->sheetData;

	$rn = 0;
	$c = 0;
	$crefs = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	if($hline) {
		$c = 0;
		$elem = $out->addChild('row');
		$elem['r'] = ++$rn;
		foreach($hline as $v) {
			$e = $elem->addChild('c');
			$e['r'] = $crefs[++$c] . $rn;
			$e['t'] = 'inlineStr';
			$e->is = '';
			$e->is->t = $v;
		}
	}
	foreach(process_query($cmd, $args) as $r) {
		$c = 0;
		$elem = $out->addChild('row');
		$elem['r'] = ++$rn;
		foreach($r as $k=>$v)
			if(has_subitems($v)) {
			} else {
			  $e = $elem->addChild('c');
			  $e['r'] = $crefs[++$c] . $rn;
			  if(preg_match('/^\d+(\.\d*)?$/',$v)) {
				  $e['t'] = 'n';
				  $e->v = $v;
			  } else {
				  $e['t'] = 'inlineStr';
				  $e->is = '';
				  $e->is->t = $v;
			  }
			}
	  }
	  
	$file = tempnam("tmp", "xlsx");
	copy(__DIR__.'/sample.xlsx', $file);
	$zip = new ZipArchive;
	$zip->open($file);

	$zip->addFromString('xl/worksheets/sheet1.xml', $data->saveXML());
	$zip->close();

	header('Content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	header('Content-Disposition: attachment; filename="'.$name.'.xlsx"');
	//echo $data->saveXML();
	//$fp = fopen('php://output', 'w+');
	copy($file, "php://output");
	
	unlink($file);
}

if(__FILE__ != TOPLEVEL_FILE) return;

query_to_xlsx( main_argument(),  main_subarguments(), @$_REQUEST['h'] ?: [], @$_REQUEST['filename'] ?: 'Downloaded' );

