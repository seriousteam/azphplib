<?php
require_once(__DIR__.'/model.php');

$ModelDB = cached_ini(_ENV_MODEL_DATA, true);

if(__FILE__ != TOPLEVEL_FILE) return;

//var_dump($ModelDB);

if(!@$_REQUEST['table']) {
	foreach($ModelDB as $k=>$v) {
		echo "$k\n";
	}
} else {
	$t = $_REQUEST['table'];
	$vals = [];	
	foreach($ModelDB[$t] as $k => $v)
		if($k === '.') {
			if(@$_REQUEST['add_empty']) {
				$vnull = @$ModelDB[$t.'.info']['.'];
				$vals[] = [ 'value' => "$vnull", 'text' => htmlspecialchars($v), 'rt' => htmlspecialchars($v), 'empty' => '' ];
			}
		} else
			$vals[] = [ 'value' => htmlspecialchars($k), 'text' => htmlspecialchars($v)  ];

	if(@$_REQUEST['add_empty'] && !isset($ModelDB[$t]['.'])) {
		$vals[] = [ 'value' => '', 'text' => '', 'rt' => '', 'empty' => '' ];
	}
	if(@$_REQUEST['js']) {
		echo '['.implode(','
			,array_map(function($li) {
				return "{\"value\" : \"{$li['value']}\",\"text\":\"{$li['text']}\"}";
			}, $vals)
		).']';
	} else {
		echo implode(''
			,array_map(function($li) {
				return "<li ".(isset($li['empty'])?'empty':'')." value-patch=\"{$li['value']}\"".(isset($li['rt'])?" rt=\"{$li['rt']}\"":'')
					.">{$li['text']}</li>\n";
			}, $vals)
		);
	}
}
//			var_dump($ModelDB);
