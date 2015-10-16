<?php 
//var_dump($_ENV);
//var_dump($_SERVER);

$fname = getenv('fullfile') ?: getenv('PATH_INFO');
$cdir = getenv('cache');

//die("$fname / $cdir");

if(!$fname) die('');

$droot = $_SERVER['DOCUMENT_ROOT'];

$fphpname = "$cdir/".urlencode( substr($fname, strlen($droot)+1 ) );

//die($fphpname);

$mt = file_exists($fphpname) ? stat($fphpname)['mtime'] : 0;
$mtt = stat($fname)['mtime'];

//echo 'X', $fname, $mt, ' ', $mtt;

$phppath = __DIR__."/../../../../php/php.exe";
if(!file_exists($phppath)) $phppath = "php";

if($mt < $mtt) {
	//echo 'y';
	//file_put_contents($fphpname, file_get_contents($fname));
	system("$phppath -f ".
		__DIR__."/templater.php -- -c $fname -p$cdir > $fphpname");
}

$force_toplevel = $fphpname;
require $fphpname;
