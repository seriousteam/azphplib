<?php 
require_once(__DIR__.'/db-oo.php');

$cmd = $_REQUEST['cmd'];
$args = @$_REQUEST['args'] ?: [];

if(preg_match('/(.*)\sLIMIT\s+\d+\s*/s', $cmd, $m)) $cmd =$m[1];

$cmd = "COUNT(*) FROM ( $cmd ) a LIMIT 1";

$r = Select($cmd, $args);
echo $r->fetchColumn();
//echo "\n", $r->queryString;