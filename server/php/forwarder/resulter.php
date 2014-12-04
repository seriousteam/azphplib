<?php 
ini_set('display_errors', 'Off');
require_once __DIR__.'/forwd-defs.php';
//$fl=fopen("log.txt","w");fwrite($fl,var_export($argv,true));
$out=$argv[1];
$argcli=$argv[2];
$command="cmd /c start /b ".$startphp." -f ".$argv[2];//."\"";
$command.=">".$out."_";
exec ($command);
rename($out."_",$out);
unlink($argv[2]);
?>