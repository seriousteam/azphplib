<?php
if(!defined('CHOOSER_MODE')) define('CHOOSER_MODE', '');

require_once(__DIR__.'/template-runtime.php');

$cdir = getenv('cache') ?: $G_ENV_CACHE_DIR;

$table = $_REQUEST['table'];
$link = @$_REQUEST['link'];

$fphpname = "$cdir/$table.".($link?".$link":"").(CHOOSER_MODE?'choose':'table').".php.t";
$mt = file_exists($fphpname) ? stat($fphpname)['mtime'] : 0;
$mtt = $G_ENV_MODEL ? stat($G_ENV_MODEL)['mtime'] : 1;
if($mt >= $mtt) {
	//valid cache
	goto end;
}

//$link_filter = '';
//if($link) $link_filter = " $link = ? ";

ob_start();

global $Tables;
$table = $Tables->{$table};
$pk = $table->PK(true);
$pk0 = $table->PK();
$pk_s = implode(',', array_map(function($a){ return "a.$a";}, $pk));

$sql_fields[] = $table->ID('a')." AS a__table__id";
$table_fields = $table->fields;

	if(CHOOSER_MODE) {
		$has_choose = false;
		foreach($table_fields as $f) if($f->choose) $has_choose = true;
		if($has_choose) {
			$tf = [];
			foreach($table_fields as $n=>$f) 
				if($f->choose) $tf[$n] = $f;
			$table_fields =  $tf;
		}
	}
	if(!isset($table_fields[$n = $table->PK()]))
		$sql_fields[] = "a.$n AS a__$n";
	$sql_fields = implode(', ', $sql_fields);
	
echo <<<ST
[[PROLOG global \$Tables; \$table = \$Tables->{\$params->table};]]
[[PROLOG if(\$params->empty_start && !\$cmd) \$cmd = "*WHERE 1=0 "]]
[[PROLOG if(!\$cmd && \$table->default_filter()) \$cmd = "*WHERE ".\$table->default_filter();]]

[[PAGE BY 20]]

<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
[[LIB]]
<link rel="stylesheet" href="/ais/form.css">
</head>
<body>


[[if(\$params->h == 'Y') { echo "<h1>";  output_html(\$table->___caption ?: \$table->___name); echo "</h1>"; }]]
ST;

ob_start(); $cnts = 0;

echo <<<ST
<div id=filter_def filter_def="[ EQ(1,1)
ST;
foreach($table_fields as $n=>$f) if($f->search_op) { ++$cnts; echo ", a.$n $f->search_op ?$n\n"; }
echo <<<ST
	]"
	selfref="[[CURRENT_URI()]]" onrefresh="restoreFuncFilter(this, def, [[seqCookie()]])"
><input filter_ctrl onkeyup="applyFuncFilterT(this)" 
ST;
foreach($table_fields as $n=>$f) if($f->search_op) { echo " filter_ctrl-$f->search_priority-$n=\""; output_html($f->search_re); echo '"\n'; }

echo ' style="width:100%">';

ob_start(); $cnt = 0;
	foreach($table_fields as $n=>$f) 
		if($f->search_op) 
			{ ++$cnt; echo " <span filter_hint=$n>"; output_html($f->caption); echo '</span>'; }
	if($cnt>1) ob_end_flush(); else ob_end_clean();

echo "</div>\n";	
if($cnts) ob_end_flush(); else { ob_end_clean(); echo "<div><br></div>"; }

echo <<<ST
<div style="clear:both"><!--FILTRED:-->
[[ob_start();]]
<table main_table>
<thead>
	<tr>
ST;
	ob_start(); $cnt = 0;
	foreach($table_fields as $n=>$f) if($f->type && !$f->hidden && !$f->page && $n != $link){ 
	++$cnt; echo '<th>'; output_html($f->caption ?: $n); } 
	if($cnt>1) ob_end_flush(); else ob_end_clean();

echo '</thead>';

echo <<<ST

<tr>
[[@tr \$data : SAMPLE AND SELECT *, $sql_fields FROM $table->___name]]
[[cmd@tr \$data.{CMD $pk_s}]]

ST;
if(CHOOSER_MODE){ 
echo <<<ST
	[[rt@tr \$data-:a__table__id]]
	[[value@tr \$data-:a__$pk0]]
	[[onclick@tr 'blockEvent(event);this.closeModal(this)']]
	[[style@tr 'cursor: pointer']]
	
ST;
}
echo '[[$@tr $data.{SAMPLE}]]';

foreach($table_fields as $n=>$f) 
		if($f->type && !$f->hidden && !$f->page && $n != $link) { echo "\n<td>"; 
		if(CHOOSER_MODE){
			if($f->Target())
				echo "[[\$data.a.$n._id_]]";
			else
				echo "[[\$data.a.$n]]";
		} else {
			if($f->type=='SUBTABLE') {
				echo "<button type=button onclick='this.setDN(toggle)' display_next></button>";
				echo <<<ST
				<div subtable ref=Y>"[[tabler_ref('$f->size','$f->precision')]]&cmd=*WHERE $f->precision = %3F".setURLParam('args\\[\\]',findRid(this))</div>
ST;
			} else
			if($f->Target())
				echo "[[\$data.a.$n._id_~e: add_button=N]]"; 
			else
				echo "[[\$data.a.$n~e:]]"; 
		}
	}

if(!CHOOSER_MODE){
	ob_start(); $cnt = 0;
echo <<<ST
	
<td><button type=button onclick="this.setDN_TR(toggle)" display_next_row></button>
	<div extended_form cmd="@this.UT('TR').previousElementSibling">
ST;
	foreach($table_fields as $n=>$f) 
		if($f->type && !$f->hidden && $f->page && $n != $link) { ++$cnt;
			echo "<div ctrl_container><label>"; output_html($f->caption ?: $n); echo "</label>";
			if($f->type=='SUBTABLE') {
				echo "<button type=button onclick='this.setDN(toggle)' display_next></button>";
				echo <<<ST
				<div subtable ref=Y>"[[tabler_ref('$f->size','$f->precision')]]&cmd=*WHERE $f->precision = ?".setURLParam('args[]',findRid(this))</div>
ST;
			} else
			if($f->Target())
				echo "[[\$data.a.$n._id_~e: add_button=N]]"; 
			else
				echo "[[\$data.a.$n~e:]]"; 
			echo "\n";
		}
	echo "</div>\n";
	if($cnt>1) ob_end_flush(); else ob_end_clean();
echo <<<ST

<td><button tag type="button" onclick="doDelete(this, 'удалить?')" del>x</button>
ST;
}

echo <<<ST
</tr>
</table>
[[make_manipulation_command(null, false, \$statements->data) ~\$where_vals]]
[[if( \$data.{COUNT} ) ob_end_flush(); else { ob_end_flush(); echo '<div>Нет</div>'; }]]
ST;
if(!CHOOSER_MODE){
	echo <<<ST
	
<button type=button onclick="makeChoose(this, null, '')" add=suspend unlocked=Y
		[[foreach(\$where_vals as \$k=>\$v) { echo 'def-',\$k,'="'; output_html(\$v); echo '" '; }]]
	><span suspend>+</span><span resume>OK</span>
	</button>
<button row_counter type=button style="float: right" 
	onclick="var e = this; X.XHR('GET','[[make_counting_command(\$statements->data)]]').done(function(t) { e.setV(e.V().replace(/\?|\d+/, t)); })"
>[[@button \$data.{COUNT}~?]]Число записей: ?</button>
ST;
}
echo <<<ST
[[PAGE CONTROLS]]
<!--FILTRED.--></div>
</body>
ST;

$phppath = __DIR__."/../../../../php/php.exe";
if(!file_exists($phppath)) $phppath = "php";

file_put_contents($fphpname.'.s', ob_get_clean());
	system("$phppath -f ".
		__DIR__."/templater.php -- -c $fphpname.s -p$cdir > $fphpname");

	//unlink($fphpname.'.s');
end:;

require $fphpname;

if(__FILE__ != TOPLEVEL_FILE) return $functions;

dispatch_template(main_argument(),  main_subarguments());
