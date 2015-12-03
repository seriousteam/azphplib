<?php

function sstorage_read($storage_name, $access) {
	global $a_table_db;
	$storage_def = @$a_table_db[$storage_name];
	if(!$storage_def)
		throw new Exception("no storage definition for $storage_name");
	$mode = 0;
	$select = null; $select_args = [];
	$path = '';
	foreach($access as $i => $p) {
		$def = $storage_def['p'][$i];
		switch($mode) {
			case 0: //select mode;
			if(!preg_match('#^\s*/#',$def)) {
				if(preg_match('/^\s*SELECT\s/i')) {
					//new select command
					$select = $def .' '. $select; //concat with previous
					array_unshift($select_args, $p); // and store param
				}
				if(preg_match('/^\s*AND\s/is',$def,$m)) {
					$select .= ' ' . $def; //concat select condition
					$select_args[] = $p; // and store param
				}
			} else {
				$mode = 1; //to file mode
				if($i) { //was select --> execute and get path (or file!)
					//$path = ;
				}
			}
			case 1:
				if() {
					
				}
		}
	}
}

if(__FILE__ != TOPLEVEL_FILE) return;
