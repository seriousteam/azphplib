<?php
//http://213.208.189.135/az/server/php/tabler.php?table=enrf_stages
if(!defined('CHOOSER_MODE')) define('CHOOSER_MODE', '');

require_once(__DIR__.'/template-runtime.php');

$ui = new stdClass;
$ui->chooser = CHOOSER_MODE;
$ui->tabler = !CHOOSER_MODE;
if($ui->grouped = preg_match('/\s*GROUP\s+BY\s+/ix', preg_replace( '/\(.*\)/', '', main_argument() ) ) ?: null) {
	//to keep things simple, group mode will be taken from first 'cmd' in URL
	$ui->tabler = false;
	$ui->chooser = false;
}

if($ui->chooser)
	$mode = 'chooser2';
else if($ui->tabler)
	$mode = 'table2';
else if($ui->grouped)
	$mode = 'group';

$table = $_REQUEST['table'];
$link = @$_REQUEST['link'];
$cache = new TemplaterCache("$table.".($link?"$link.":"")."$mode.php.t");
$cdir = getenv('cache') ?: $G_ENV_CACHE_DIR;
if(!$cache->need_to_gen_from($G_ENV_MODEL)) goto end;
ob_start();


//////////TABLER PREPARED DATA////////////
global $Tables;
$table = $Tables->{$table};
$ui->table = $table->___name;
$ui->cmd_key = implode(',', array_map(function($a){ return "a.$a";}, $table->PK(true))); //full pk
$ui->choose_key = $table->PK(); //single field pk

//define initial set of fields
$table_fields = $table->fields;
if($ui->chooser) {
	$has_choose = false;
	foreach($table_fields as $f) if($f->choose) $has_choose = true;
	if($has_choose) {
		$tf = [];
		foreach($table_fields as $n=>$f) 
			if($f->choose) $tf[$n] = $f;
		$table_fields =  $tf;
	}
}

//define field structures
$ui_view = [];
$ui_search = [];
$ui_form = [];
$used_fields[] = $table->ID('a')." AS a__table__id";
if(!isset($table_fields[$ui->choose_key]))
	$used_fields[] = "a.{$ui->choose_key} AS a__{$ui->choose_key}";

foreach($table_fields as $n=>$f) {
	if($f->type && !$f->hidden && !$f->page && $n != $link) {
	//view
		$uif = new uiField($table, $f->Target() ? "$n._id_" : $n);
		$ui_view[] = $uif;		
	}
	if(!CHOOSER_MODE && $f->type && !$f->hidden && $f->page && $n != $link) {
	//form
		$p = $f->page;
		$g = (string)$f->ui_group['name'];
		if( !isset($ui_form[$p]) )
			$ui_form[$p] = [];
		
		if( !isset($ui_form[$p][$g]) ) {
			$ng = new uiGroup;
			$ng->free = !is_string($f->ui_group['name']);
			$ng->caption = is_string($f->ui_group['name']) ? $f->ui_group['name'] : null;
			$ng->subtable = $f->type==='SUBTABLE';
			$ng->closed = $f->ui_group['closed'];
			$ui_form[$p][$g] = $ng;
		}
		$lines = &$ui_form[$p][$g]->lines;
		if(!$f->ui_line) {
			$lines[] = [];
		}
		$lines[count($lines)-1][] = new uiField($table, $f->Target() ? "$n._id_" : $n);
	}
	if($f->search_op) {
	//search
		$ui_search[] = new uiSearchField($n, $f->caption, $f->search_op, $f->search_re, $f->search_priority);
	}
}
foreach($ui_form as &$page) {
	foreach($page as &$group) {
		$maxcol = 0;
		foreach($group->lines as $line1) {
			if($maxcol < count($line1))
				$maxcol = count($line1);
		}
		foreach($group->lines as &$line2) {
			if(count($line2)>0) {
				$line2[count($line2)-1]->col += $maxcol - count($line2);
			}					
		}
	}
}
$used_fields = implode(', ',$used_fields);


////////////INSTANCE INITIALIZATION////////////
echo <<<ST
[[PROLOG
	global \$Tables; \$table = \$Tables->{\$params->table};
	if(\$params->empty_start && !\$cmd)
		\$cmd = "*WHERE 1=0 ";
	if(!\$cmd && \$table->default_filter())
		\$cmd = "*WHERE ".\$table->default_filter();
	\$sc = seqCookie();

	//UI control parameters
	\$UI = new stdClass;
	\$UI->title = \$table->___caption ? 
 		"{\$table->___caption}({\$table->___name})" :  
 		"{\$table->___name}";
	\$UI->groupby = preg_match('/\s*GROUP\s+BY\s+/ix', \$cmd) ?: null;
]]
ST;

//////////RENDER TEMPLATE//////////
echo <<<ST
[[PAGE BY 20]]
<html>
<head>
<title>[[\$UI-:title]]</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
[[LIB]]
ST;
if($ui->tabler || $ui->grouped) 
	echo "\n[[QE]]\n";
echo <<<ST
<link rel="stylesheet" href="/az/lib/bullfinch.css">
<script>
function group(o, st) {
	var parent = o.UA( 'ctrl-grid' );
	if(st === toggle) {
		group( o, parent.A('grp-display') != "Y" )
	} else {
		parent.setA( 'grp-display', st?"Y":"N" );
		o.refreshDisplay();
		var a = parent.QSA('[content-resizable]');
		for(var i = 0; i < a.length; ++i)
			X.autoResizeOnEvent(null, a[i]);		
	}	
}
</script>
</head>
<body bullfinch>
<div edit-view></div>
ST;

//////////////////////TABLE CONTROL PANEL/////////////////////
$empty_search = !count($ui_search) ? 'empty-filter' : '';
echo "\n<div edit-panel $empty_search>";
if($ui->tabler || $ui->grouped)
	echo "\n<button type=button qe-start qe-root={$ui->table} qe-output=\"B().QS('[edit-view]')\" qe-hide=\"this.parentNode\"></button>";

//we need filter even for paging
if($ui->grouped)
	$ui_search = [];
$filter_def = implode(', ', array_merge([''],$ui_search));
$restore = $ui->tabler ? " onrefresh='restoreFuncFilter(this, def, [[\$sc]])'" : '';
$filter_hint = count($ui_search) ? "<div filter-hints>".implode('', array_map(function($f) {
	return "\n<span filter_hint={$f->alias}>{$f->caption}</span>";
}, $ui_search))."</div>" : '';
$filter_ctrl = count($ui_search) ? "<input filter_ctrl onkeyup='applyFuncFilterT(this)' ".implode(' ', array_map(function($f) {
	return "\nfilter_ctrl-{$f->priority}-{$f->alias}='{$f->re}'";
}, $ui_search)).'>' : '';
echo <<<ST
<div
	filter_for="this.parentNode.nextElementSibling" 
	filter_def="[ EQ(1,1) $filter_def ]" selfref="[[CURRENT_URI()]]" $restore>
	$filter_hint
	$filter_ctrl
</div>
ST;

echo "\n</div>";

///////////////////////TABLE////////////////////////
$mode = $ui->grouped ? 'grouped' : '';
echo <<<ST
<div style="clear:both" filtred><!--FILTRED:-->
[[ob_start();]]
<table main $mode onrefresh="refreshNoRowStatus(this)">
ST;

//////////////////////TABLE HEAD//////////////////
if(count($ui_view)>1) {
	echo "<thead><tr>";
	if($ui->tabler)	echo '<th>';
	if($ui->tabler || $ui->grouped) {
		echo "<th>[[@th \$data.{CE left}]][[\$left->caption]]</th>";
	}
	echo implode(array_map(function($f) {
		return "<th>{$f->caption}</th>";
	},$ui_view));
	if($ui->tabler || $ui->grouped) {
		echo "<th>[[@th \$data.{CE right}]][[\$right->caption]]</th>";
	}
	if($ui->tabler && !count($ui_form)) echo '<th>';
	echo "</tr></thead>";
}

////////////////////TABLE BODY/////////////////////
echo <<<ST
<tbody>
	<tr>
	[[@tr \$data : SAMPLE AND SELECT *, $used_fields FROM {$ui->table}]]
	[[cmd@tr \$data.{CMD {$ui->cmd_key}}]]
ST;
if($ui->chooser) {
	echo <<<ST
	[[rt@tr \$data-:a__table__id]]
	[[value@tr \$data-:a__{$ui->choose_key}]]
	[[onclick@tr 'blockEvent(event);this.closeModal(this)']]
	[[style@tr 'cursor: pointer']]
ST;
}
echo <<<ST
	[[\$@tr \$data.{SAMPLE}]]
	[[make_manipulation_command(null, false, \$statements->data) ~\$where_vals]]
ST;
if($ui->tabler) {
$emptyform = count($ui_form) ? '' : 'empty-form'; 
echo <<<ST
		<td expander $emptyform>
		<div><button type=button onclick="startAddRow(this)" static add=resume unlocked=Y
			[[if(is_array(\$where_vals)) foreach(\$where_vals as \$k=>\$v) { echo 'def-',\$k,'="'; output_html(\$v); echo '" '; }]]
	></button></div>
		<div><button tag type="button" onclick="doDelete(this, 'отменить добавление?')" cancel-add></button></div>
ST;
if(count($ui_form)) {
echo <<<ST
		<button type=button onclick="this.setDN_TR(toggle)" display_next_row></button>
		<div extended_form cmd="@var r = this.UT('TR'); r.className == 'transit_row'? r.previousElementSibling : r">
ST;
	foreach($ui_form as $page) { foreach($page as $grp) {
		$grp_display = ($grp->subtable || $grp->free || !$grp->closed) ? 'grp-display=Y' : 'grp-display=N';
		echo "\n<table ctrl-grid $grp_display>";
		if($grp->caption)
		echo "\n<tr ctrl-group-head><td colspan=100><span onclick='group(this,toggle)'>{$grp->caption}</span></td></tr>";
		foreach($grp->lines as $cline) {
			echo "\n<tr ctrl-group>";
			foreach($cline as $f) {
				$colspan = $f->col>1 ? " colspan={$f->col}" : '';
				echo <<<ST
				<td$colspan>
					<div ctrl-container>
						[[\$data.{$f->name}~e: style='min-width:{$f->min_width()}em']]					
						<label>{$f->caption}</label>
					</div>
				</td>
ST;
			}
			echo "\n</tr>";
		}
		echo "\n</table>\n";
	}}
	echo '<button tag type="button" onclick="doDelete(this, \'удалить?\')" del></button></div>';
}	
}
if($ui->tabler || $ui->grouped) {
	//FIXME: readonly for e:
	$editable = $ui->tabler ? "~e: style='min-width:{\$left->min_width()}em'" : '';
	echo <<<ST
	<td>[[@td \$data.{CE left}]]
		<div ctrl-inline>
			[[\$data.{\$left->alias}$editable]]
			<label>[[\$left->caption]]</label>
		</div>
	</td>
ST;
}
foreach($ui_view as $f) {
	//FIXME: readonly for e:
	$editable = $ui->tabler ? "~e: style='min-width:{$f->min_width()}em'" : '';
	echo <<<ST
	<td>
		<div ctrl-inline>
			[[\$data.{$f->name}$editable]]
			<label>{$f->caption}</label>
		</div>
	</td>
ST;
}
if($ui->tabler || $ui->grouped) {
	//FIXME: readonly for e:
	$editable = $ui->tabler ? "~e: style='min-width:{\$right->min_width()}em'" : '';
	echo <<<ST
	<td>[[@td \$data.{CE right}]]
		<div ctrl-inline>
			[[\$data.{\$right->alias}$editable]]
			<label>[[\$right->caption]]</label>
		</div>
	</td>
ST;
}

if($ui->tabler && !count($ui_form)) {
	echo "\n<td><button tag type=\"button\" onclick=\"doDelete(this, 'удалить?')\" del></button>";
}
echo "\n</tr></tbody>";

//////////////////TABLE FOOT//////////////////
echo "\n<tfoot>";
if($ui->chooser)
	echo "[[if(@\$_REQUEST['add_empty']){]]<tr empty_row onclick=this.closeModal(this) rt='' value=''><td colspan=100>[[}]]";
echo "\n<tr if_no_rows><td colspan=100>";
echo "\n</tfoot>";
echo <<<ST
</table>
[[if( \$data.{COUNT} ) ob_end_flush(); else ob_end_flush(); ]]
ST;
if($ui->tabler || $ui->grouped) {
	echo <<<ST
<div table-control>
ST;
	if($ui->tabler) {
	echo <<<ST
	<button type=button onclick="startAddRow(this)" static add=suspend unlocked=Y
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

//echo <<<ST
//<div style="clear:both" [[\$has_group]]><!--FILTRED:-->
//[[ob_start();]]
//<table main onrefresh="refreshNoRowStatus(this)">
//ST;
/*	ob_start(); $cnt = 0;
echo "<thead><tr>";
	if(!CHOOSER_MODE) {
		echo '<th>';
	}
echo <<<ST
[[if(isset(\$xtraz))foreach(\$xtraz['data'] as \$f) { if(\$f->floating==='l') {]]<th>[[\$f->caption]][[}}]]
ST;
	foreach($table_fields as $n=>$f) if($f->type && !$f->hidden && !$f->page && $n != $link){ 
	++$cnt; echo '<th>'; output_html($f->caption ?: $n); } 
echo <<<ST
[[if(isset(\$xtraz))foreach(\$xtraz['data'] as \$f) { if(\$f->floating==='r') {]]<th>[[\$f->caption]][[}}]]
ST;
echo '</thead>';
	if($cnt>1) ob_end_flush(); else ob_end_clean();
*/

/*echo <<<ST
<tr>
[[@tr \$data : SAMPLE AND SELECT *, $sql_fields FROM $table->___name]]
[[cmd@tr \$data.{CMD $pk_s}]]
[[\$@tr \$data.{EXTRA}]]
ST;
*/
/*
if(CHOOSER_MODE){ 
echo <<<ST
	[[rt@tr \$data-:a__table__id]]
	[[value@tr \$data-:a__$pk0]]
	[[onclick@tr 'blockEvent(event);this.closeModal(this)']]
	[[style@tr 'cursor: pointer']]
ST;
}*/
/*
echo <<<ST
[[\$@tr \$data.{SAMPLE}]]
[[make_manipulation_command(null, false, \$statements->data) ~\$where_vals]]
ST;
*/
//if(!CHOOSER_MODE){
/*echo "<td expander>";
echo <<<ST
<div><button type=button onclick="startAddRow(this)" static add=resume unlocked=Y
		[[if(is_array(\$where_vals)) foreach(\$where_vals as \$k=>\$v) { echo 'def-',\$k,'="'; output_html(\$v); echo '" '; }]]
></button></div>
<div><button tag type="button" onclick="doDelete(this, 'отменить добавление?')" cancel-add></button></div>
ST;
*/
// EDITABLE FORM
/*
ob_start();
echo <<<ST
	<button type=button onclick="this.setDN_TR(toggle)" display_next_row></button>
	<div extended_form cmd="@var r = this.UT('TR'); r.className == 'transit_row'? r.previousElementSibling : r">
ST;

		foreach($ui_form as $page) {
			foreach($page as $grp) {
				echo '<table ctrl-grid';
				if(!$grp->closed || $grp->subtable || $grp->free)
					echo ' grp-display="Y"';
				else
					echo ' grp-display="N"';			
				echo '>';
				if( $grp->caption ) {
					echo "<tr ctrl-group-head><td colspan=100><span onclick='group(this,toggle)''>{$grp->caption}</span></td></tr>";
				}
				foreach($grp->lines as $cline) {
					echo '<tr ctrl-group>';
					foreach($cline as $f) {
						if($f->col>1)
							echo "<td colspan='{$f->col}'>";
						else
							echo "<td>";
						echo "<div ctrl-container>";
						$size = "style='min-width:".max(0.7 * mb_strlen($f->caption), 13)."em'";
						if($f->target)
							echo "[[\$data.{$f->name}._id_~e: $size]]"; 
						else
							echo "[[\$data.{$f->name}~e: $size]]"; 
						echo "\n";
						echo "<label>";
						output_html($f->caption);
						echo "</label>";		 
						echo "</div>";
						echo "</td>";
					}
					echo '</tr>';
				}
				echo '</table>';
			}
		}
echo <<<ST
<button tag type="button" onclick="doDelete(this, 'удалить?')" del></button>
</div>
ST;
	if(count($ui_form)) ob_end_flush(); else ob_end_clean();
}*/
/*
echo <<<ST
[[if(isset(\$xtraz))foreach(\$xtraz['data'] as \$f) { if(\$f->floating==='l') {]]
<td><div ctrl-inline>[[\$size=max(0.7 * mb_strlen(\$f->caption), 13);]]
[[output_editor2(\$data->ns(\$f->alias), default_templated_editor(''), "style='min-width:{\$size}em'","");]]
<label>[[\$f->caption]]</label>
</div>
[[}}]]
ST;

foreach($table_fields as $n=>$f) 
	if($f->type && !$f->hidden && !$f->page && $n != $link) { echo "\n<td><div ctrl-inline>"; 
	if(CHOOSER_MODE){
		if($f->Target())
			echo "[[\$data.a.$n._id_]]";
		else
			echo "[[\$data.a.$n]]";
	} else {
		$size = "style='min-width:".max(0.7 * mb_strlen($f->caption ?: $n), 13)."em'";
		if($f->Target())
			echo "[[\$data.a.$n._id_~e: $size]]"; 
		else
			echo "[[\$data.a.$n~e: $size]]"; 
	}
	echo "<label>";
	output_html($f->caption ?: $n);
	echo "</label>";
	echo "</div>";
}
echo <<<ST
[[if(isset(\$xtraz))foreach(\$xtraz['data'] as \$f) { if(\$f->floating==='r') {]]
<td><div ctrl-inline>[[\$size=max(0.7 * mb_strlen(\$f->caption), 13);]]
[[output_editor2(\$data->ns(\$f->alias), default_templated_editor(''), "style='min-width:{\$size}em'","");]]
<label>[[\$f->caption]]</label>
</div>
[[}}]]
ST;
*/
/*if($cnt<1 && !CHOOSER_MODE)
echo <<<ST
<td><button tag type="button" onclick="doDelete(this, 'удалить?')" del></button>
ST;*/
/*echo "</tr>\n<tfoot>\n";
if(CHOOSER_MODE && @$_REQUEST['add_empty'])
	echo "<tr empty_row onclick=this.closeModal(this) rt='' value=''><td colspan=100>";
*/
//echo <<<ST
//<tr if_no_rows><td colspan=100>
//</table>
//[[if( \$data.{COUNT} ) ob_end_flush(); else ob_end_flush(); ]]
//
//ST;
	/*
if(!CHOOSER_MODE){
	echo <<<ST
<div table-control>
<button type=button onclick="startAddRow(this)" static add=suspend unlocked=Y
		[[if(is_array(\$where_vals)) foreach(\$where_vals as \$k=>\$v) { echo 'def-',\$k,'="'; output_html(\$v); echo '" '; }]]
	><span suspend>+</span><span resume>OK</span>
</button>
<button type=button onclick="this.setDN(toggle)" display_next inline_next show-control></button>
<span>
[[PAGE CONTROLS]]
</span>
</div>
ST;
}*/
//echo <<<ST
//<!--FILTRED.--></div>
//</body>
//ST;

$cache->gen_from_ob( ob_get_clean() );

end:;

while(@!include $cache->file()) {}

if(__FILE__ != TOPLEVEL_FILE) return $functions;

dispatch_template(main_argument(),  main_subarguments());
