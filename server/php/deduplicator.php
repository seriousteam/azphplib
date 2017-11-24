<?php 
require_once __DIR__.'/envars.php';

//if same request in progress - wait first one and return it's result
// $func($key) take key, output result and return it's mime type (or null, if default mimen type used)
function deduplicate_request(
	$zone, $key, $user,
	$func
){
	$fn = _ENV_CACHE_DIR.'/in_progress';
	@mkdir($fn);
	$fn .= "/$zone";
	@mkdir($fn);
	
	$fn .= '/'.urlencode($key) . '#' . urlencode($user);

	$f = fopen($fn,"c+");
	if(flock($f,LOCK_EX + LOCK_NB)) {
		//main thread
		ftruncate($f,0);
		ob_start();
		$mime = $func($key); //call generation function
		$result = ob_get_clean();
		fwrite($f, $result);
		flock($f, LOCK_UN);
		unlink($fn);
		if($mime) @header("Content-type: $mime");
		echo $result;
	} else {
		if(flock($f, LOCK_SH)){
			if($mime) @header("Content-type: $mime");
			fpassthru($f);
			flock($f, LOCK_UN);
		}
	}
}