<?php
require_once(__DIR__.'/addrfuncs.php');
header('Content-Type: text/plain; charset=utf-8');
echo kladrSearch($_REQUEST['address'])
?>