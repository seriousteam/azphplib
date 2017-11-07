<?php
require_once(__DIR__.'/template-runtime.php');

$ui = new stdClass;

$table = $_REQUEST['table'];
$link = @$_REQUEST['link'];
$cache = new TemplaterCache("$table.".($link?"$link.":"")."swift.choose.php.t");
$cdir = _ENV_CACHE_DIR;
if(!$cache->need_to_gen_from(_ENV_MODEL)) goto end;
ob_start();


//////////TABLER PREPARED DATA////////////
global $Tables;
$table = $Tables->{$table};
$ui->table = $table->___name;
$ui->cmd_key = implode(',', array_map(function($a){ return "a.$a";}, $table->PK(true))); //full pk
$ui->choose_key = $table->PK(); //single field pk
$pk = $table->fields[$table->PK()];
$ui->zero_record = $table->ZERO_RECORD();

//define initial set of fields
$table_fields = $table->fields;
$has_choose = false;
$ui_search = [];
foreach($table_fields as $n=>$f) {
	if($f->choose) $has_choose = true;
	if($f->search_op) { //search
		$ui_search[] = new uiSearchField($n, $f->caption, $f->search_op, $f->search_re, $f->search_priority);
	}
}
if($has_choose) {
	foreach($table_fields as $n=>$f) 
		if($f->choose) $tf[$n] = $f;
	$table_fields =  $tf;
}

//define field structures
$used_fields[] = "a.".(@$_REQUEST['id']?:'_id_')." AS a__table__id";
if(!isset($table_fields[$ui->choose_key]))
	$used_fields[] = "a.{$ui->choose_key} AS a__{$ui->choose_key}";

foreach($table_fields as $n=>$f) {
	if($f->type && !$f->hidden && !$f->page && $n != $link) {
		//view
		$uif = new uiField($table, $f->Target() ? "$n._id_" : $n);
		$ui_view[] = $uif;	
	}
}
foreach($ui_search as $i=>$f) {
	if(!@$ui_view[$i])
		break;
	if($ui_view[$i]->name == $f->name) {
		$ui_view[$i]->captionAlreadyShown = true;
	}
}

$used_fields = implode(', ',$used_fields);


////////////INSTANCE INITIALIZATION////////////
echo <<<ST
[[PROLOG
	global \$Tables; \$table = \$Tables->{\$params->table};
	if(\$params->empty_start && !\$cmd)
		\$cmd = "*WHERE 1=0 ";
	if(!\$cmd && \$params->default_filter)
		\$cmd = "*WHERE ".\$params->default_filter;
	if(!\$cmd && \$table->default_filter())
		\$cmd = "*WHERE ".\$table->default_filter();
	\$sc = seqCookie();
	//UI control parameters
	\$UI = new stdClass;
	\$UI->title = \$table->___caption ? 
 		"{\$table->___caption}({\$table->___name})" :  
 		"{\$table->___name}";
]]
ST;

//////////RENDER TEMPLATE//////////
if($table->LIMIT_CHOOSE()) echo "[[PAGE BY ", $table->LIMIT_CHOOSE(), "]]\n";

echo <<<ST

<html>
<head>
<title>[[\$UI-:title]]</title>
[[LIB]]
ST;
echo <<<ST
</head>
<body theme="swift">
ST;

//////////////////////TABLE CONTROL PANEL/////////////////////
$empty_search = !count($ui_search) ? 'empty-filter' : '';
echo "\n<div edit-panel $empty_search>";

//we need filter even for paging
$filter_def = implode(', ', $ui_search);
$filter_hint = count($ui_search) ? "<div filter-hints>".implode('', array_map(function($f) {
	return "\n<span filter_hint={$f->alias}>{$f->caption}</span>";
}, $ui_search))."</div>" : '';
$filter_ctrl = count($ui_search) ? <<<SF
	<input filter_ctrl 
		onkeyup='applyFuncFilterT(this)'
		onkeydown="chooseRowIfOnly(this, event, [[\$params-:add_empty?2:1]])"
SF
.implode(' ', array_map(function($f) { return "\nfilter_ctrl-{$f->priority}-{$f->alias}='{$f->re}'"; }, $ui_search)) 
.'>' : '';
echo <<<ST
<div
	filter_for="this.parentNode.nextElementSibling"
	filter_def="[ $filter_def ]" 
	selfref="[[CURRENT_URI()]]" 
	onrefresh='restoreFuncFilter(this, def, [[\$sc]])'>$filter_hint$filter_ctrl
</div>
ST;

echo "\n</div>";

///////////////////////TABLE////////////////////////
echo <<<ST
<div style="clear:both" filtred><!--FILTRED:-->
[[ob_start();]]
<table theme="swift" main onrefresh="refreshNoRowStatus(this)">
ST;

//////////////////////TABLE HEAD//////////////////
ob_start();
$headCount = 0;
echo "<thead><tr>";
foreach($ui_view as $f) {
	if(@$f->captionAlreadyShown) {
		echo "<th></th>";
	} else {
		$headCount++;
		echo "<th>{$f->caption}</th>";
	}
}
echo "</tr></thead>";
if($headCount>1) ob_end_flush(); else ob_end_clean();


////////////////////TABLE BODY/////////////////////
echo <<<ST
<tbody>
	<tr>
	[[@tr \$data : SAMPLE AND SELECT *, $used_fields FROM {$ui->table}]]
	[[cmd@tr \$data.{CMD {$ui->cmd_key}}]]
	[[rt@tr \$data-:a__table__id]]
	[[value@tr \$data-:a__{$ui->choose_key}]]
	[[onclick@tr 'blockEvent(event);this.closeModal(this)']]
	[[style@tr 'cursor: pointer']]
	[[\$@tr \$data.{SAMPLE}]]
	[[make_manipulation_command(null, false, \$statements->data) ~\$where_vals]]
ST;
//DEFAULT FIELDSET
foreach($ui_view as $f) {
	echo "<td>[[\$data.{$f->name}~v:]]</td>";
}
echo "\n</tr></tbody>";

//////////////////TABLE FOOT//////////////////
echo "\n<tfoot>";
echo "[[if(@\$_REQUEST['add_empty']){]]<tr empty_row onclick=this.closeModal(this) rt='' value='{$ui->zero_record}'><td colspan=100>[[}]]";
echo "\n<tr if_no_rows><td colspan=100>";
echo "\n</tfoot>";
echo <<<ST
</table>
[[if( \$data.{COUNT} ) ob_end_flush(); else ob_end_flush(); ]]
ST;
if(@$ui->tabler || @$ui->grouped) {
	echo <<<ST
<div table-control>
ST;
	if(@$ui->tabler) {
	echo <<<ST
	<script>
	function openExpander(o, row) {
		o.hasA('required_in_form') && row && row.QS('[expand_form_button]') && row.QS('[expand_form_button]').setDN_TR(toggle);
	}
	</script>
	<button {@$ui->required_in_form} type=button onclick="openExpander(this,startAddRow(this))" static add=suspend unlocked=Y
		[[if(is_array(\$where_vals)) foreach(\$where_vals as \$k=>\$v) { echo 'def-',\$k,'="'; output_html(\$v); echo '" '; }]]
	><span suspend>+</span><span resume>OK</span></button>
ST;
	}
echo <<<ST
	<!--button type=button onclick="this.setDN(toggle)" display_next inline_next show-control></button>
	<span-->
	<button first_page type=button onclick="applyFuncFilter(this.UA('filtred').QSattrPrevious('filter_def'), null, this)" offset="[[(\$page_limit && \$requested_offset? \$requested_offset - \$page_limit : '')]]"></button>
		<button prev_page type=button onclick="applyFuncFilter(this.UA('filtred').QSattrPrevious('filter_def'), this, this)" offset="[[(\$page_limit && \$requested_offset? \$requested_offset - \$page_limit : '')]]"></button>
		<button next_page type=button onclick="applyFuncFilter(this.UA('filtred').QSattrPrevious('filter_def'), this, this)" offset="[[(\$page_limit && \$main_counter > \$requested_limit? \$requested_offset + \$page_limit : '')]]"></button>
	<!--/span-->
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