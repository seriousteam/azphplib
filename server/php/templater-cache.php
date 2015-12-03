<?php
require_once( dirname( dirname( dirname( __DIR__ ) ) ).'/ais/env.php');
require_once( __DIR__.'/generator.php' );
$fname = getenv('fullfile') ?: getenv('PATH_INFO');
if(!$fname) die('');
$cache = new TemplaterCache( urlencode( substr($fname, strlen($_SERVER['DOCUMENT_ROOT'])+1 ) ) );
if($cache->need_to_gen_from($fname)) {
	$cache->gen_from_file($fname);
}
define('TOPLEVEL_FILE', realpath($cache->file()));
while(@!include $cache->file()) {}