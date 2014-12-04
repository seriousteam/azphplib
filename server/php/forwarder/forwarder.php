<?php
/*
http://grant.rscf.ru/az/server/php/forwarder/forwarder.php?fwdrez_header=text/html&fwdrez_scr=/ais/rsf/templates/loadout-aggrements.php&cmd=O:aggrements.csv
http://grant.rscf.ru/az/server/php/forwarder/forwarder.php?fwdrez_header=text/csv&fwdrez_savename=111.csv&fwdrez_scr=/ais/rsf/templates/loadout-aggrements.php&cmd=O:aggrements.csv
localhost/forward/forwarder.php?fwdrez_header=text/html&fwdrez_scr=/forward/target.php&dfgd=df&dfgdfgd=3333
 */
ini_set("display_errors", '0');
date_default_timezone_set('Europe/Moscow');
require_once __DIR__.'/forwd-defs.php';
$reztype="text/html";
$target="";

if (isset($_REQUEST[fwdrez_header])) $reztype=$_REQUEST[fwdrez_header];
if (isset($_REQUEST[fwdrez_scr])) $target=$_SERVER['DOCUMENT_ROOT'].'/'.$_REQUEST[fwdrez_scr];
//if (isset($_REQUEST[fwdrez_ext])) $rezext=$_REQUEST[fwdrez_ext]; 
$host  = $_SERVER['HTTP_HOST'];
$uri   = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
$url="http://";
if (isset($_SERVER['HTTPS'])) $url="https://";
$url.=$host.$uri."/forwarder.php";

if (isset($_REQUEST[fwdrez_get]))
{
	$rezid=$_REQUEST[fwdrez_get];	
	if (file_exists($rezdir.$rezid))
	{	
		header("200 OK",true,200);		
		if ($reztype!="text/plain"&&$reztype!="text/html") 
		{
			// if result is file, change users html page to "Complete"
			// and on next refresh return file 
			if (!isset($_GET[fwdrez_rdy])) 
			{				
				//header("Content-type: ".$reztype);
				$nurl=$url."?".$_SERVER['QUERY_STRING']."&fwdrez_rdy=true";
				echo '<html><meta http-equiv="refresh" content="1;url='.$nurl.'">Complete.</html>';
				die;
			}
		}	
		$fname_result="result.".mb_substr($reztype,mb_strrpos($reztype,"/")+1);
		if (isset($_REQUEST[fwdrez_savename])) $fname_result=$_REQUEST[fwdrez_savename];
		header("Content-type: ".$reztype);
		if ($reztype!="text/plain"&&$reztype!="text/html") header("Content-Disposition: attachment; filename=".$fname_result);
		$frez=fopen($rezdir.$rezid,"r");
		if ($frez) fpassthru($frez);
		fclose($frez);
		unlink($rezdir.$rezid);		
	}
	else 
	{
		header("200 OK",true,200);
		echo '<html><meta http-equiv="refresh" content="10">Not ready yet.</html>';
		// del old files
		
		$dirlist=scandir($rezdir);
		foreach($dirlist as $fl)
		 if ($fl!="."&&$fl!="..")
		 {
		 	if (file_exists($rezdir.$fl)) 
		 	{
		 		$ftime=filemtime($rezdir.$fl);
		 		if ((time()-$ftime)>$delete_time) unlink($rezdir.$fl);
		 	}
		 }
		
	}
	die;	
}
else
{	
	$argcli="";
	// args
	// [1] rezname
	// [2] data file name	
	$rzfname=tempnam($rezdir,"");
	rename($rzfname,$rzfname."_");
	$dfname=tempnam($rezdir,"");
	$toolargs=array(fwdrez_get,fwdrez_savename,fwdrez_header,fwdrez_scr,fwdrez_rdy,"fwdrez_scrpath");
	$t_Trgt=mb_ereg_replace("\\\\","/",$target);
	$user_data_q=array(mb_substr($t_Trgt,mb_strrpos($t_Trgt,"/")+1));
	$indx=1;
	foreach ($_REQUEST as $qarg=>$qval) 
	{
		if (!in_array ($qarg,$toolargs)) 
		{
			$user_data_q[$indx]=$qarg;
			$user_data_q[$indx+1]=$qval;
			$indx+=2;
		}
	}
	//$_SERVER['argv']=$user_data_q;
	$cookie_header = apache_request_headers()['Cookie'];
	$data_source=
		"<?php\n ".
		"$"."_REQUEST=".var_export($_REQUEST,true).";\n".
		"$"."_GET=".var_export($_GET,true).";\n".
		"$"."_POST=".var_export($_POST,true).";\n".
		"$"."_COOKIE=".var_export($_COOKIE,true).";\n".
		'$_SERVER='.var_export($_SERVER,true).";\n".
		'$COOKIE_HEADER='.var_export($cookie_header, true).";\n".
		//"$"."argv=".var_export($user_data_q,true).";\n".
		"$"."force_toplevel=".var_export($target,true).";\n".
		"require_once ".var_export($target,true).";\n".
		"?>";
	$fdata=fopen($dfname,"w");
	fwrite($fdata,$data_source);
	fclose($fdata);		
	$argcli=$rzfname." ".$dfname;
	$command="cmd /c start /b ".$startphp." -f ".$resulter." -- ".$argcli;//."\"";
	$command.="< nul >nul 2>&1 &";
	pclose(popen($command, "r"));	
	$url.="?".fwdrez_get."=".basename($rzfname)."&".fwdrez_header."=".$reztype;
	if (isset($_REQUEST[fwdrez_savename])) $url.="&".fwdrez_savename."=".$_REQUEST[fwdrez_savename];	
	header("Location: $url");
	//localhost/forward/forwarder.php?fwdrez_header=text/html&fwdrez_scr=target.php&dfgd=df&dfgdfgd=3333

}
?>