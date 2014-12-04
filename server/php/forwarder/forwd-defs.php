<?php
// result file name
define("fwdrez_get","fwdrez_get");
// result file name for saving
define("fwdrez_savename","fwdrez_savename");
// Content-type: header
define("fwdrez_header","fwdrez_header");
//define("fwdrez_ext","fwdrez_ext");
// script name for execution
define("fwdrez_scr","fwdrez_scr");
// flag for change users page in file result type
define("fwdrez_rdy","fwdrez_rdy");
// exec string for php
$startphp="";
if (PHP_SAPI=="apache2handler")
{
	$tmp=ini_get ("extension_dir");
	$startphp.=realpath(ini_get ("extension_dir")."\\..");	
}
else $startphp.=dirname(PHP_BINARY);
$startphp.="\\php.exe -c ".php_ini_loaded_file();
//$startphp=mb_ereg_replace("\\\\","\\\\",$startphp);
//$startphp_="D:\\is-site\\php\\php.exe -c D:\\is-site\\php\\php.ini";
//phpinfo();
//D:\is-site\php\php.exe -c D:\is-site\php\php.ini
//D:\\is-site\\php\\php.exe -c D:\\is-site\\php\\php.ini"
// script dir
$scriptdir=__DIR__."/";//"D:\\is-site\\html\\az\\server\\php\\forwarder\\";
// results path and tmp files
$rezdir=$scriptdir."frez\\";
// path for executer.php
$executer=$scriptdir."executer.php";
// path for resulter.php
$resulter=$scriptdir."resulter.php";
 // live time for temp and result files, sec
 // 10 min
$delete_time=60*10;
?>