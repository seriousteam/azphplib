<?php
// test
//http://localhost/qrencode/example.php?size=4&qrtxt=это пример текста
require_once __DIR__.'/qrimg.php';

$tmpdir=__DIR__."\\tmp\\";
$text=$_GET['qrtxt'];
$size=4;
if (isset($_GET['size'])) $size=$_GET['size'];

$b64txt=getQRBASE64($text,$size,$tmpdir);

echo '<html><img src="'.$b64txt.'"/><br></html>'; 
?>
