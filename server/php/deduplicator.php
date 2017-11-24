<?php 
require_once __DIR__.'/envars.php';

//if same request in progress - wait first one and return it's result
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
		$result = $func($key); //call generation function
		fwrite($f, $result);
		flock($f, LOCK_UN);
		unlink($fn);
		echo $result;
	} else {
		if(flock($f, LOCK_SH)){
			fpassthru($f);
			flock($f, LOCK_UN);
		}
	}
}