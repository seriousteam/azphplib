<?php
//date_default_timezone_set('Europe/Moscow');
//need extension=php_gd2.dll
//downloaded from http://sourceforge.net/projects/phpqrcode/
require_once __DIR__."/phpqrcode/qrlib.php";
function getQRBASE64($text,$size,$tempdir)
{
	//$size=4;	
	$tmpfl=tempnam($tempdir,"");
	QRcode::png($text,$tmpfl,QR_ECLEVEL_L,$size);
	$imgdata=file_get_contents($tmpfl);
	unlink($tmpfl);
	return 'data:image/png;base64,'.base64_encode($imgdata);
}
?>