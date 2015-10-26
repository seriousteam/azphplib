<?php
require_once(__DIR__.'/template-runtime.php');
require_once(__DIR__.'/generator.php');

$table = $_REQUEST['table'];

$cache = new TemplaterCache("$table.id.php.t");
if($cache->need_to_gen_from($G_ENV_MODEL)) {

global $Tables;
$table = $Tables->{$table};
$pk = $table->PK(true);
$pk_s = array_map(function($n){ return "a.$n AS a__$n";}, $pk);
$sql_fields = array_merge($pk_s, [ $table->ID('a')." AS a__table__id" ]);
$sql_fields = implode(', ', $sql_fields);

ob_start();
echo <<<ST
[[PROLOG global \$Tables; \$table = \$Tables->{\$params->table};]]
[[ESC js]]
[
[[\$data : SELECT *, $sql_fields FROM $table->___name]][[{]]
[[\$data.{NPP}!=1~?","~=]]
{"text": [[\$data-:a__table__id]],"pk":[
ST;

foreach($pk as $i=>$f) {
if($i!=0) 
	echo ",";
echo <<<ST
{"name": "$f","value": [[\$data-:a__$f]]}
ST;
}

echo <<<ST
]}
[[}]]
]
ST;

$cache->gen_from_ob( ob_get_clean() );

}

while(@!include $cache->file()) {}

if(__FILE__ != TOPLEVEL_FILE) return $functions;

dispatch_template(main_argument(),  main_subarguments());
