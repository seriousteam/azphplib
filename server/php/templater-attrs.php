<?php
require_once(__DIR__.'/template-runtime.php');

$functions['_main_'] = function($cmd, $args = null, $context = null) {
	$args_rest = func_get_args(); 
	array_shift($args_rest); array_shift($args_rest); array_shift($args_rest);

	$counters = new stdClass;
	$cmd = merge_queries('', $cmd);
	$rowsets['data'] = process_query($cmd, $args);
	if(is_object($rowsets['data'])) $rowsets['data']->args = $args;
?><!DOCTYPE html>
<html>
<head>
<?php 					echo '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',"\n";
					echo '<link rel="stylesheet" href="',file_URI('//az/lib/main.css', null, TRUE),'">',"\n";
					echo '<link rel="stylesheet" href="',file_URI('//az/lib/local.css', null, TRUE),'">',"\n";
					echo '<script type="text/javascript" src="',file_URI('//az/lib/scripts.js', null, TRUE),'"></script>',"\n";
					echo '<script type="text/javascript" src="',file_URI('//az/lib/editing20.js', null, TRUE),'"></script>',"\n";?>
<?php foreach(with_loop_info($rowsets['data'], $counters->data ) as $data){?><body>
	<?php {
				ctx::$current = new ctx(null, '0');
				ctx::$current->Period = $data->period;
				ctx::$current->Date = $data->dt;
				ctx::$current->Adm = $data->adm;
				ctx::$current->Param = '';
				ctx::$attribute_database = [];
				foreach(process_query('SELECT 
				adm, period, dt, par
				, fn, fs, ft
				FROM atable
				WHERE 1=1
				AND adm = ?
				AND period = ?
				AND dt = ?
				LIMIT ALL',
				  [ctx::$current->Adm, ctx::$current->Period, ctx::$current->Date] ) 
				  as $attr_row) {
					ctx::$attribute_database[$attr_row->adm]
						[$attr_row->period][$attr_row->dt]
						[$attr_row->par]
					= NVL(trimZ($attr_row->fn), NVL($attr_row->fs, $attr_row->ft));
				}
			};?>
	<table>
		<tr><td><?php output_editor('E',ctx::$current->sname);?><td><?php output_html(ctx::$current->staff->cnt);?>
			<table>
			<?php foreach(ctx::$current->staff->list->Items() as $L){?><tr><td><?php output_html(ctx::$current->name);?>
			</tr><?php }?>
			</table>
		</tr>
	</table>
</body><?php }?>
<?php 

};


if(__FILE__ != TOPLEVEL_FILE) return $functions;

dispatch_template(main_argument(),  main_subarguments());