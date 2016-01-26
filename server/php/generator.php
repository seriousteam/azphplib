<?php
class TemplaterCache {
	var $fphpname = null;
	var $cdir = null;
	function file() { return $this->fphpname; }
	function need_to_gen_from($with) {	
		$mt = file_exists($this->fphpname) ? filemtime($this->fphpname) : 0;
		$mtt = $with ? filemtime($with) : 1;
		return $mt < $mtt;
	}
	function gen_from_ob($ob) {
		$tmpfile = tempnam($this->cdir, 'GEN');
		file_put_contents($tmpfile.'.s', $ob);
		$this->generate("$tmpfile.s",$tmpfile, $this->fphpname.'.s');		
		@unlink($this->fphpname);
		@unlink($this->fphpname.'.s');
		@rename($tmpfile, $this->fphpname);
		@rename($tmpfile.'.s', $this->fphpname.'.s');
		@unlink($tmpfile);
		@unlink($tmpfile.'.s');
	}
	function gen_from_file($filename) {
		$tmpfile = tempnam($this->cdir, 'GEN');
		$this->generate($filename,$tmpfile);
		@unlink($this->fphpname);
		@rename($tmpfile, $this->fphpname);
		@unlink($tmpfile);
	}
	function generate($fromfile, $tofile, $sourcefile = "") {
		$sourcefile = $sourcefile? "-s$sourcefile" : "";
		system("$G_PHP_PATH -f ".
			__DIR__."/templater.php -- -c $fromfile -p{$this->cdir} $sourcefile > $tofile");
	}
	function __construct($in_cache_name) {
		global $G_ENV_CACHE_DIR;
		$this->cdir = getenv('cache') ?: $G_ENV_CACHE_DIR;
		$this->fphpname = "{$this->cdir}/$in_cache_name";
	}
}