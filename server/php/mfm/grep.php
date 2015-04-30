<form>
<input name=dir type=hidden value="<?php echo htmlspecialchars($_REQUEST['dir']);?>">
filter: <input name=filter value="<?php echo htmlspecialchars($_REQUEST['filter']);?>">
pattern: <input name=pattern value="<?php echo htmlspecialchars($_REQUEST['pattern']);?>">
<input type=submit>
</form>
<?php

//--color=always
$s = (realpath(__DIR__.'/../../../../../tools/gw32/bin/grep.exe').' -H -n -D skip -r -I --color=always'
	. ($_REQUEST['filter']? ' --include="'.$_REQUEST['filter'].'"': '')
	. ' -e  "'.$_REQUEST['pattern'].'"'
	. ' "'.$_REQUEST['dir'] .'" '
	);
	
echo $s, "<br><br>\n";

$p = popen($s, 'r');

while($s = fgets($p)) {
	echo "<div>\n";
	if(preg_match('/^\e.*?K([^\e]+)
                 .*?:
                 (?:\e.*?K)+?
                 (\d+)
                 .*?:
                 (?:\e.*?K)+?
                 (.*)/x',$s,$m))
	//if(preg_match('/^([^:]+):(\d*):(.*)/',$s,$m))
		echo "<b>$m[1]</b> <i>$m[2]</i><br>",htmlspecialchars(preg_replace('/\e.*?K/','',$m[3]));
	//echo "//",htmlspecialchars($s),"||";
	echo "</div>\n";
}