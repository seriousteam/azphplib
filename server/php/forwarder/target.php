<?php
$sec=5;
echo "<pre><html><meta charset=\"utf-8\">HELLO \nGET\n";
var_dump($_GET);
echo "\nPOST\n";
var_dump($_POST);
echo "\nCOOKIE\n";
var_dump($_COOKIE);
echo "\n======";
var_dump($argv);
echo "</html>";
if (isset($_GET['sec'])) $sec=$_GET['sec'];
sleep(5);
//exec ("ping -n 6 127.0.0.1 >nul");