<?php
//http://213.208.189.135/az/server/php/tabler.php?table=enrf_stages
if(!defined('CHOOSER_MODE')) define('CHOOSER_MODE', '');

require_once(__DIR__.'/template-runtime.php');

$table = $_REQUEST['table'];
$link = @$_REQUEST['link'];

$cache = new TemplaterCache("$table.".($link?".$link":"").(CHOOSER_MODE?'choose2':'table2').".php.t");

$cdir = getenv('cache') ?: $G_ENV_CACHE_DIR;

if(!$cache->need_to_gen_from($G_ENV_MODEL)) goto end;


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
[[PROLOG \$sc = seqCookie();]]
[[PAGE BY 20]]

<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
[[LIB]]
[[QE]]
<link rel="stylesheet" href="/az/lib/bullfinch.css">
</head>
<body bullfinch>
<div edit-view></div>
ST;
echo <<<ST
<div edit-panel>
	<button type=button qe-start qe-root="[[\$params->table]]" qe-output="B().QS('[edit-view]')" qe-hide="this.parentNode"></button>
ST;

echo <<<ST
<div id=filter_def filter_for="this.parentNode.nextElementSibling" filter_def="[ EQ(1,1)
ST;
$cnts = 0;
foreach($table_fields as $n=>$f) if($f->search_op) { ++$cnts; echo ", a.$n $f->search_op ?$n\n"; }
echo <<<ST
	]"
	selfref="[[CURRENT_URI()]]"
ST;
if(!CHOOSER_MODE) echo <<<ST
	onrefresh="restoreFuncFilter(this, def, [[\$sc]])"
ST;
echo "\n>";

ob_start(); $cnts = 0;

ob_start(); $cnt = 0;
echo "<div>";
foreach($table_fields as $n=>$f) 
	if($f->search_op) 
		{ ++$cnt; echo " <span filter_hint=$n>"; output_html($f->caption); echo '</span>'; }
echo "</div>";
if($cnt>1) ob_end_flush(); else ob_end_clean();

echo '<input filter_ctrl onkeyup="applyFuncFilterT(this)"';

foreach($table_fields as $n=>$f) if($f->search_op) { echo " filter_ctrl-$f->search_priority-$n=\""; output_html($f->search_re); echo "\"\n"; ++$cnts; }
echo '>';

if($cnts) ob_end_flush(); else { ob_end_clean(); }
echo "</div>\n";

echo <<<ST
</div>
[[if(\$params->h == 'Y') { echo "<h1>";  output_html(\$table->___caption ?: \$table->___name); echo "</h1>"; }]]
ST;
	

echo <<<ST
<div style="clear:both"><!--FILTRED:-->
[[ob_start();]]
<table main onrefresh="refreshNoRowStatus(this)">
ST;
	ob_start(); $cnt = 0;
echo "<thead><tr>";
if(!CHOOSER_MODE) echo '<th>';
	foreach($table_fields as $n=>$f) if($f->type && !$f->hidden && !$f->page && $n != $link){ 
	++$cnt; echo '<th>'; output_html($f->caption ?: $n); } 

echo '</thead>';
	if($cnt>1) ob_end_flush(); else ob_end_clean();


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
echo <<<ST
[[\$@tr \$data.{SAMPLE}]]
[[make_manipulation_command(null, false, \$statements->data) ~\$where_vals]]
ST;

if(!CHOOSER_MODE){
echo "<td expander>";
echo <<<ST
<button type=button onclick="startAddRow(this)" static add=resume unlocked=Y
		[[foreach(\$where_vals as \$k=>\$v) { echo 'def-',\$k,'="'; output_html(\$v); echo '" '; }]]
	></button>
ST;
	ob_start(); $cnt = 0;
echo <<<ST
	<button type=button onclick="this.setDN_TR(toggle)" display_next_row></button>
	<div extended_form cmd="@var r = this.UT('TR'); r.className == 'transit_row'? r.previousElementSibling : r">

ST;
	foreach($table_fields as $n=>$f) 
		if($f->type && !$f->hidden && $f->page && $n != $link) { ++$cnt;
			echo "<table ctrl-grid><tr>";
			echo "<td>";
			echo "<div ctrl-container>";
			$size = max(0.7 * mb_strlen($f->caption ?: $n), 13);
			if($f->Target())
				echo "[[\$data.a.$n._id_~e: style='min-width:{$size}em']]"; 
			else
				echo "[[\$data.a.$n~e: style='min-width:{$size}em']]"; 
			echo "\n";
			echo "<label>";
			output_html($f->caption ?: $n);
			echo "</label>";		 
			echo "</div></td></tr></table>";
		}
echo <<<ST

<button tag type="button" onclick="doDelete(this, 'удалить?')" del></button>
</div>
ST;
	if($cnt>1) ob_end_flush(); else ob_end_clean();
}
foreach($table_fields as $n=>$f) 
	if($f->type && !$f->hidden && !$f->page && $n != $link) { echo "\n<td><div ctrl-inline>"; 
	if(CHOOSER_MODE){
		if($f->Target())
			echo "[[\$data.a.$n._id_]]";
		else
			echo "[[\$data.a.$n]]";
	} else {
		$size = max(0.7 * mb_strlen($f->caption ?: $n), 13);
		if($f->Target())
			echo "[[\$data.a.$n._id_~e: style='min-width:{$size}em']]"; 
		else
			echo "[[\$data.a.$n~e: style='min-width:{$size}em']]"; 
	}
	echo "<label>";
	output_html($f->caption ?: $n);
	echo "</label>";
	echo "</div>";
}
if($cnt<1 && !CHOOSER_MODE)
echo <<<ST
<td><button tag type="button" onclick="doDelete(this, 'удалить?')" del></button>
ST;
echo "</tr>\n<tfoot>\n";
if(CHOOSER_MODE && @$_REQUEST['add_empty'])
	echo "<tr empty_row onclick=this.closeModal(this) rt='' value=''><td colspan=100>";
echo <<<ST
<tr if_no_rows><td colspan=100>
</table>
[[if( \$data.{COUNT} ) ob_end_flush(); else ob_end_flush(); ]]

ST;
if(!CHOOSER_MODE){
	echo <<<ST
<div table-control>
<button type=button onclick="startAddRow(this)" static add=suspend unlocked=Y
		[[foreach(\$where_vals as \$k=>\$v) { echo 'def-',\$k,'="'; output_html(\$v); echo '" '; }]]
	><span suspend>+</span><span resume>OK</span>
</button>
<button type=button onclick="this.setDN(toggle)" display_next inline_next show-control></button>
<span>
<button row_counter type=button
	onclick="var e = this; X.XHR('GET','[[make_counting_command(\$statements->data)]]').done(function(t) { e.setV(e.V().replace(/\?|\d+/, t)); })"
>[[@button \$data.{COUNT}~?]]Число записей: ?</button>
[[PAGE CONTROLS]]
</span>
</div>
ST;
}
echo <<<ST
<!--FILTRED.--></div>
</body>
ST;

$cache->gen_from_ob( ob_get_clean() );

end:;

while(@!include $cache->file()) {}

if(__FILE__ != TOPLEVEL_FILE) return $functions;

dispatch_template(main_argument(),  main_subarguments());
