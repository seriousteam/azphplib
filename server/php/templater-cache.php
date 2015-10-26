<?php
require_once(__DIR__.'/generator.php');

//var_dump($_ENV);
//var_dump($_SERVER);
$fname = getenv('fullfile') ?: getenv('PATH_INFO');

if(!$fname) die('');

$cache = new TemplaterCache( urlencode( substr($fname, strlen($_SERVER['DOCUMENT_ROOT'])+1 ) ) );

//die("$fname / $cdir");

if($cache->need_to_gen_from($fname)) {
	$cache->gen_from_file($fname);
}

define('TOPLEVEL_FILE', realpath($cache->file()));
while(@!include $cache->file()) {}

//$fphpname = "$cdir/".urlencode( substr($fname, strlen($droot)+1 ) );

//die($fphpname);

//$mt = file_exists($fphpname) ? filemtime($fphpname): 0;
//$mtt = filemtime($fname);

//echo 'X', $fname, $mt, ' ', $mtt;

//$phppath = __DIR__."/../../../../php/php.exe";
//if(!file_exists($phppath)) $phppath = "php";

//if($mt < $mtt) {
	//echo 'y';
	//file_put_contents($fphpname, file_get_contents($fname));
//	system("$phppath -f ".
//		__DIR__."/templater.php -- -c $fname -p$cdir > $fphpname");
//}

//define('TOPLEVEL_FILE', realpath($fphpname));
//require $fphpname;
