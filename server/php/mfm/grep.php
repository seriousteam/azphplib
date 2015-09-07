<?php
	require_once __DIR__.'/auth.php';
	require_once __DIR__.'/WinFsStreamWrapper.php';
	$editFileVars="current_cp=".@$_REQUEST['current_cp']."&synt_hl=".@$_REQUEST['synt_hl']."&ed_simple=".@$_REQUEST['ed_simple'];
?>
<form>
grep keys: <input name=keys value="<?php echo htmlspecialchars(@$_REQUEST['keys']);?>" size='60'>
<br><br>
<input name=dir type=hidden value="<?php echo htmlspecialchars(@$_REQUEST['dir']);?>">
<input name=current_cp type=hidden value="<?php echo htmlspecialchars(@$_REQUEST['current_cp']);?>">
<input name=synt_hl type=hidden value="<?php echo htmlspecialchars(@$_REQUEST['synt_hl']);?>">
<input name=ed_simple type=hidden value="<?php echo htmlspecialchars(@$_REQUEST['ed_simple']);?>">
filter: <input name=filter value="<?php echo htmlspecialchars(@$_REQUEST['filter']);?>">
pattern: <input name=pattern value="<?php echo htmlspecialchars(@$_REQUEST['pattern']);?>">
<input type=submit>
</form>
<?php
//' -H -n -D skip -r -I --color=always'
//--color=always
$s = (realpath(__DIR__.'/../../../../../tools/gw32/bin/grep.exe')." ".@$_REQUEST['keys']
	. (@$_REQUEST['filter']? ' --include="'.@$_REQUEST['filter'].'"': '')
	. ' -e  "'.@$_REQUEST['pattern'].'"'
	. ' "'.@$_REQUEST['dir'] .'" '
	);
	
echo $s, "<br><br>\n";
if (isset($_REQUEST['pattern']))
	if (strlen($_REQUEST['pattern'])>0)
	{
		$p = popen($s, 'r');
		$user=null;
		foreach ($userlist as $usr) if ($usr['name']==$_SESSION['name']) $user=$usr;
		if ($user['black_dir']=='')$reg_black_dir=null;
		else $reg_black_dir=$user['black_dir'];
		if ($user['white_dir']=='')$reg_white_dir=null;
		else $reg_white_dir=$user['white_dir'];
		if ($user['black_file']=='')$reg_black_file=null;
		else $reg_black_file=$user['black_file'];
		if ($user['white_file']=='')$reg_white_file=null;
		else $reg_white_file=$user['white_file'];
		
		while($s = fgets($p)) {
			echo "<div>\n";
			if(preg_match('/^\e.*?K([^\e]+)
						 .*?:
						 (?:\e.*?K)+?
						 (\d+)
						 .*?:
						 (?:\e.*?K)+?
						 (.*)/x',$s,$m))
						 {		
							//<a href='dir.php?dir=$link&$editFileVars'>$ddr</a>
							//secure test white\black lists
							$file_tst=true;
							$dir_tst=true;
							if ($reg_white_dir!=null) 
							{
								if (preg_match($reg_white_dir,$m[1])) $dir_tst=true;
								else $dir_tst=false;
							}
							if ($reg_black_dir!=null) if (preg_match($reg_black_dir,$m[1])) $dir_tst=false;
							if ($reg_white_file!=null)
							{
								if (preg_match($reg_white_file,$m[1])) $file_tst=true;
								else $file_tst=false;
							}
							if ($reg_black_file!=null&&preg_match($reg_black_file,$m[1])) $file_tst=false;
							if ($file_tst&&$dir_tst) echo "<a href='dir.php?dir=$m[1]&$editFileVars&text_goto=$m[2]'>$m[1]</a>"
								." <i>$m[2]</i><br>",htmlspecialchars(preg_replace('/\e.*?K/','',$m[3]));
						 }
			//if(preg_match('/^([^:]+):(\d*):(.*)/',$s,$m))				
			//echo "//",htmlspecialchars($s),"||";
			echo "</div>\n";
		}
		pclose($p);
	}