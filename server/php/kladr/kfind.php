<?php
// input kladr svc format!
header('Content-Type: text/html; charset=utf-8');
iconv_set_encoding("internal_encoding", "UTF-8");
iconv_set_encoding("input_encoding", "UTF-8");
iconv_set_encoding("output_encoding", "UTF-8");
date_default_timezone_set('Europe/Moscow');
/*
$db_config = array(
				'server'=>'pgsql:host=localhost;port=5432;dbname=postgres',
				'user' => 'user',
				'pass' => '1'
);
*/
$cfg = array(
				'dialect' => 'mysql',
				'server'=>'mysql:host=localhost;port=3306;dbname=test;',
				'user' => 'root',
				'pass' => '1234',
);
//ini_set('display_errors', 'Off');

//$fail_perc=
//echo "<pre>";
require_once 'kladrfuncs.php';
$cfg=new PDO("{$db_config['server']}",$db_config['user'],$db_config['pass']);
$source="170023, г. Тверь, просп. Ленина, д.43, кв. 26";
if (isset($_GET['addr'])) $source=$_GET['addr'];
$fin="D:/work/web/nginx-1.2.4/html/kladr/tests.txt";
$fout="D:/work/web/nginx-1.2.4/html/kladr/output.txt";

getKLADR($source, $cfg,true,false,$fin,$fout);
/*
echo "\n=====";
$zz=getKLADR($source, $cfg);
if ($zz) print_r($zz);
else echo "NULL";
/*
Array
(
    [summ] => 8
    [stresh] => , республика , г. , ул. , 16/1, кв. 211
    [code] => 020000010000944
    [sreg] => Респ
    [reg] => Башкортостан
    [srn] => 
    [rn] => 
    [sgor] => г
    [gor] => Уфа
    [spunkt] => 
    [punkt] => 
    [sstreet] => ул
    [street] => Островского
)
 */

?>