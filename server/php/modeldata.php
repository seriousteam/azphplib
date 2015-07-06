<?php
require_once(__DIR__.'/model.php');

$ModelDB = cached_ini($G_ENV_MODEL_DATA, true);

if(__FILE__ != TOPLEVEL_FILE) return;

//var_dump($ModelDB);

if(!@$_REQUEST['table']) {
	foreach($ModelDB as $k=>$v) {
		echo "$k\n";
	}
} else {
	$t = $_REQUEST['table'];
	if(@$_REQUEST['add_empty']) {
		echo "<li value-patch='' rt=''>?</li>\n";
	}
	foreach($ModelDB[$t] as $k => $v)
		echo '<li value-patch="'.htmlspecialchars($k).'">'.htmlspecialchars($v)."</li>\n";
}

