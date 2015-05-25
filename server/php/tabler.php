<?php
require_once(__DIR__.'/template-runtime.php');

if(!defined('CHOOSER_MODE')) define('CHOOSER_MODE', '');

$functions['_main_'] = function($cmd, $args = null, $params = null) {

if($params === null) $params = new smap;
$call_params = new smap($params); 

if($params->empty_start && !$cmd) $cmd = "*WHERE 1=0 ";

global $Tables;
$table = $Tables->{$params->table};
$pk = $table->PK(true);

//var_dump($table);

if(!$cmd && $table->default_filter())
	$cmd = "*WHERE ".$table->default_filter();

$page_limit = 20;

	$counters = new stdClass;
	$statements = new stdClass;
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
	foreach($table_fields as $n=>$f) if($f->type){
		$sql_fields[] = "a.$n AS a__$n";
		if($t = $f->Target("a.$n")) 
			$sql_fields[] = "$t AS a_id__$n";
	}
		
	$sql_fields = implode(', ', $sql_fields);
	$qcmd = merge_queries("SELECT $sql_fields FROM $table->___name a", $cmd, $args, $requested_offset, $requested_limit, $page_limit);
	$rowsets['data'] = process_query($qcmd, $args);
	if(is_object($rowsets['data'])) $main_counter =& $counters->data;
	if(is_object($rowsets['data'])) $rowsets['data']->offset = $requested_offset;
?><html>
<head>
<?php 					echo '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',"\n";
					echo '<link rel="stylesheet" href="',file_URI('//az/lib/main.css', null, TRUE),'">',"\n";
					echo '<link rel="stylesheet" href="',file_URI('//az/lib/local.css', null, TRUE),'">',"\n";
					echo '<script type="text/javascript" src="',file_URI('//az/lib/scripts.js', null, TRUE),'"></script>',"\n";
					echo '<script type="text/javascript" src="',file_URI('//az/lib/editing20.js', null, TRUE),'"></script>',"\n";?>
<link rel="stylesheet" href="/ais/form.css">
</head>

<body>

<?php if($params->h == 'Y') { echo "<h1>";  output_html($table->___caption ?: $table->___name); echo "</h1>"; } ?>

<div id=filter_def
	filter_def="[ EQ(1,1)
		<?php foreach($table_fields as $n=>$f) if($f->search_op) { echo ", a.$n $f->search_op ?$n"; }?>
	]"
	selfref="<?php output_html(CURRENT_URI());?>"
	onrefresh="restoreFuncFilter(this, def, <?php output_html(seqCookie());?>)"
>
<input filter_ctrl onkeyup="applyFuncFilterT(this)" 
	<?php foreach($table_fields as $n=>$f) if($f->search_op) { echo "filter_ctrl-$f->search_priority-$n=\""; output_html($f->search_re); echo '"'; } ?>
style="width:100%">
	<?php  ob_start(); $cnt = 0;
		foreach($table_fields as $n=>$f) 
			if($f->search_op) 
				{ ++$cnt; echo " <span filter_hint=$n>"; output_html($f->caption); echo '</span>'; }
		if($cnt>1) ob_end_flush(); else ob_end_clean();
	?>
</div>

<div style="clear:both"><!--FILTRED:-->
<?php ob_start(); ?>
<table main_table>
<thead>
	<tr>
	<?php 
		ob_start(); $cnt = 0;
		foreach($table_fields as $n=>$f) if($f->type && !$f->hidden){ ++$cnt; echo '<th>'; output_html($f->caption ?: $n); } 
		if($cnt>1) ob_end_flush(); else ob_end_clean();
	?>
</thead>
<?php foreach(with_loop_info_and_sample($rowsets['data'], $counters->data, $statements->data = @$rowsets['data']->exInfo) as $data){?>
<tr cmd="<?php output_html(make_manipulation_command($data, $counters->data, $statements->data));?>" <?php output_html(($counters->data === 0? 'sample' : ''));?> 
	<?php 
		if(CHOOSER_MODE){ 
			echo ' rt="'; output_html($data->a__table__id); echo '"';
			echo ' value="'; output_html($data->{'a__'.$table->PK()}); echo '"';
			echo ' onclick="this.closeModal(this)" style="cursor: pointer;" '; 
		} 
	?>
>
	<?php foreach($table_fields as $n=>$f) if($f->type && !$f->hidden) { echo '<td>'; 
		if(CHOOSER_MODE){
			if($f->Target())
				output_html($data->{"a_id__$n"});
			else
				output_html($data->{"a__{$n}"});
		} else {
			if($f->Target())
				output_editor2($data->ns("a_id__$n"), '', " add_button=N "); 
			else
				output_editor2($data->ns("a__$n"), '', ''); 
		}
	}?>

<?php if(!CHOOSER_MODE){?>
	<td><button tag type="button" onclick="doDelete(this, 'удалить?')" del>x</button>
<?php }?>

</tr><?php }?>
</table>
<?php 
$where_vals = make_manipulation_command(null, false, $statements->data);
if( ($counters->data-1) ) ob_end_flush(); else { ?>
<style> [main_table] THEAD { display: none; }</style>
<?php ob_end_flush();
$all_keys = true; foreach($pk as $kf) if(!array_key_exists($kf, $where_vals)) $all_keys = false;
?><div>Нет</div><?php }?>

<?php if(!CHOOSER_MODE){?>
<button type=button onclick="makeChoose(this, null, '')" add=suspend unlocked=Y
	<?php  foreach($where_vals as $k=>$v) { echo 'def-',$k,'="'; output_html($v); echo '"\n'; } ?>
><span suspend>+</span><span resume>OK</span></button>
<?php }?>

<?php if($counters->data-1 && !CHOOSER_MODE){?>
<button row_counter type=button style="float: right" 
	onclick="var e = this; X.XHR('GET','<?php output_html(make_counting_command($statements->data));?>').done(function(t) { e.setV(e.V().replace(/\?|\d+/, t)); })"
>Число записей: ?</button>
<?php }?>
<button first_page type=button onclick="applyFuncFilter(this.UT('DIV').QSattrPrevious('filter_def'), null, this)" offset="<?php output_html(($page_limit && $requested_offset? $requested_offset - $page_limit : ''));?>">В начало</button>
<button prev_page type=button onclick="applyFuncFilter(this.UT('DIV').QSattrPrevious('filter_def'), this, this)" offset="<?php output_html(($page_limit && $requested_offset? $requested_offset - $page_limit : ''));?>">&lt; Предыдущая страница</button>
<button next_page type=button onclick="applyFuncFilter(this.UT('DIV').QSattrPrevious('filter_def'), this, this)" offset="<?php output_html(($page_limit && $main_counter > $requested_limit? $requested_offset + $page_limit : ''));?>">Следующая страница &gt;</button>

<!--FILTRED.--></div>

</body><?php 

};


if(__FILE__ != TOPLEVEL_FILE) return $functions;

dispatch_template(main_argument(),  main_subarguments());
