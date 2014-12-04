<?php
require_once(getenv('P_LIB_PATH').'/template-runtime.php');

$functions['_main_'] = function($cmd, $args = null, $context = null) {
	$args_rest = func_get_args(); 
	array_shift($args_rest); array_shift($args_rest); array_shift($args_rest);

	$counters = new stdClass;
	$cmd = merge_queries(' fio, type, \'12\'+2 AS x_2, ( SELECT  name, autor.fio AS autor__fio FROM Docs WHERE a.autor.join ) AS ARRAY det FROM Persons', $cmd);
	$rowsets['row'] = process_query($cmd, $args);
	$rowsets['row']->args = $args;
?><html>
	<head>
	</head>
	<body>
		<table>
			<?php foreach(with_loop_info($rowsets['row'], $counters->row ) as $row){?><tr><td><?php output_html($row->fio);?><td><?php output_html($row->type);?><td><?php output_html($row->x_2);?>
				<table>
				<?php foreach(with_loop_info($row->det, $counters->det ) as $det){?><tr><td>
						<?php output_html($counters->det);?>.<?php output_html($det->name);?> - <?php output_html($det->autor__fio);?>
				</tr><?php }?>
				</table>
			</tr><?php }?>
		</table>
	</body>
</html>
<?php 

}


if(__FILE__ != TOPLEVEL_FILE) return $functions;

dispatch_template($cmd, $args);
?>