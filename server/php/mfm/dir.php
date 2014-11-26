<?php
require_once __DIR__.'/auth.php';
require_once __DIR__.'/WinFsStreamWrapper.php';
$ccp="UTF-8";
if (isset($_COOKIE['current_cp'])) $ccp=$_COOKIE['current_cp'];
$curhl="plain";
if (isset($_COOKIE['synt_hl']))	$curhl=$_COOKIE['synt_hl'];
header("Content-Type: text/html; charset=".$ccp);
ini_set("display_errors", 1);
$outtext=<<<HTHEAD
<html>
<head>
<meta charset="$ccp">
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
<style type="text/css" media="screen">    
    #editor { 
    position: absolute;
    top:  30px;
    left: 1px;
    bottom: 1px;
    right: 1px;
    }
	textarea#teditor{
	position: absolute;
	width:98%;
	height:94%;
	}
</style>
<script type="text/javascript" src="js.js">
</script>
</head>
<body>
HTHEAD;
function ru_realpath($pth)
{
	$rez=realpath($pth);
	if ($rez!==false) 
	{
		$rez=mb_ereg_replace("\\\\","/",$rez);
		return $rez;
	}	
	$pth=mb_ereg_replace("\\\\","/",$pth);
	return $pth;	
}
function errorOut($errarr=null)
{
	$msg="";
	header("500 Internal Server Error",true,500);
	if ($errarr==null) $msg.=error_get_last()['message'];
	else foreach ($errarr as $er) $msg.=$er['message'];
	echo $msg;
	die;
}
$user=null;
foreach ($userlist as $usr) if ($usr['name']==$_SESSION['name']) $user=$usr;
if (!$user) errorOut();
if ($user['black_dir']=='')$reg_black_dir=null;
else $reg_black_dir=$user['black_dir'];
if ($user['white_dir']=='')$reg_white_dir=null;
else $reg_white_dir=$user['white_dir'];
if ($user['black_file']=='')$reg_black_file=null;
else $reg_black_file=$user['black_file'];
if ($user['white_file']=='')$reg_white_file=null;
else $reg_white_file=$user['white_file'];
// if not win =""
$win_suff="";
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') $win_suff="win://";
$host  = $_SERVER['HTTP_HOST'];
$uri   = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
$url="http://";
if (isset($_SERVER['HTTPS'])) $url="https://";	
$url.=$host.$uri."/dir.php";
stream_wrapper_register('win', 'Patchwork\Utf8\WinFsStreamWrapper');
if ($_SERVER['REQUEST_METHOD']=='GET')
{
	$get=ru_realpath($default_dir);
	if (isset($_GET['dir'])) $get=$_GET['dir'];
	else header("Location: $url?dir=$get");
	if (is_dir($win_suff.$get))
	{
		$lgout=$_SESSION['name']." <a href=http://".$_SERVER['HTTP_HOST'].
			$_SERVER['SCRIPT_NAME']."?action=logout>Logout</a>";
		$outtext.= <<<HTTT
<hr style="margin:1px;">
<div style="float:left;margin-bottom:3px;">
<input type="button" value="New file" onclick="create(1);">
<input type="button" value="New dir" onclick="create(0);">
<input type="button" value="Delete" onclick="deleteFile();">
<input type="button" value="Copy" onclick="copyFiles();">
<input type="button" value="Paste" onclick="pasteFiles();">
Filter: 
<input type="text" name="fltxt" value="" onchange="filterContent();">
<input type="submit" value="" style="border: none;background:white;" onclick="filterContent();">
</div>
<div style="float:right;margin-bottom:3px;">
User: $lgout
</div>
<div style="clear: both;">
<hr>
HTTT;
		$sdr=scandir($win_suff.$get);
		$dirs="";
		$files="";		
		foreach($sdr as $ddr)
		{
			$file_tst=true;
			$dir_tst=true;
			$link=ru_realpath($get."/".$ddr);			
			$checkbox="<input type='checkbox' name='chbt' data-url='$link'>";
			if ($ddr=="..")	
			{
				$checkbox="";
				$link=mb_substr($link,0,mb_strrpos($get,"/"));
			}
			if ($reg_white_dir!=null) 
			{
				if (preg_match($reg_white_dir,$link)) $dir_tst=true;
				else $dir_tst=false;
			}
			if ($reg_black_dir!=null) if (preg_match($reg_black_dir,$link)) $dir_tst=false;				
			if (is_dir($win_suff.$get."/".$ddr))
			{
				if ($ddr!="."&&$dir_tst) 
					$dirs.="<div>$checkbox<a href='dir.php?dir=$link'><img src='folder.png' width='22' height='22'>$ddr</a></div>";
			}
			else 
			{
				if ($reg_white_file!=null)
				{
					if (preg_match($reg_white_file,$link)) $file_tst=true;
					else $file_tst=false;
				}
				if ($reg_black_file!=null&&preg_match($reg_black_file,$link)) $file_tst=false;
				if ($ddr!="."&&$file_tst&&$dir_tst) 
					$files.="<div>$checkbox<a href='dir.php?dir=$link'><img src='file.png' width='22' height='22'>$ddr</a></div>";	
			}		
		}		
		$outtext.= $dirs.$files;
	}
	else 
	{
		// text edit
		$backurl=mb_substr($get,0,mb_strripos($get,"/"));
		if ($backurl=="") $backurl=mb_substr($get,0,mb_strripos($get,"\\"));
		$url.="?dir=".$backurl;
		$simple_ed_ch="";
		$text_st="<div style='clear: both;height: 96%;'><textarea name='teditor' id='teditor'>";
		$text_end="</textarea></div>";
		$hlset=$curhl;
		switch($curhl)
		{
			case "plain":
			$hlset="plain_text";
			break;
			case "js":
			$hlset="javascript";
			break;
			case "C":
			$hlset="c_cpp";
			break;
		}
		if (isset($_COOKIE['ed_simple']))
		{
			if ($_COOKIE['ed_simple']!=0)
			{
				$simple_ed_ch="checked";
				$text_st='<div><pre id="editor" >';//style="clear: both;"
				$text_end=<<<EDTXT
</pre>
</div>
<script src="src-min/ace.js" type="text/javascript" charset="utf-8"></script>
<script>
    var editor = ace.edit("editor");
    //editor.setTheme("ace/theme/twilight");
    editor.getSession().setMode("ace/mode/$hlset");
</script>
EDTXT;
			}
		}
$cplist="";
$cparray=array("UTF-8","cp1251","cp1252","KOI8-R");
foreach ($cparray as $cc)
{
	if ($cc==$ccp) $cplist.="<option selected>$cc</option>";
	else $cplist.="<option>$cc</option>";
}
$hlarr=array("plain","php","js","C","ini","sql");
$hllist="";	
foreach ($hlarr as $hl) if ($curhl==$hl) $hllist.="<option selected>$hl</option>";
	else $hllist.="<option>$hl</option>";
$outtext.=<<<HTTXT
<div style="float:left;margin-bottom:3px;">
<input type="submit" value="Save" onclick="saveFile();">
<a href="$url">Exit</a><br>
</div>
<div style="float:right;margin-bottom:3px;">
<select name="lang" onchange="changeLang();">
$hllist
</select>
<select name="codepg" onchange="changeCP()";>
$cplist
</select>
<input type="checkbox" name="simple_ed" $simple_ed_ch onclick="changeEdit();">Hightlight</div>
$text_st
HTTXT;
$fcont=file_get_contents($win_suff.$get);
$escch="Empty";
$encarray=array("UTF-8","cp1251","cp1252","KOI8-R");
if ($fcont!="")
{
	foreach ($encarray as $enc)
	{
		$escch=htmlspecialchars($fcont,ENT_COMPAT | ENT_HTML401,$enc);
		if ($escch!="") break;
	}
}
$outtext.=$escch;
$outtext.=$text_end;
	}	
}
if (isset($_POST['dir']))
{	
	$vals=array();
	$urarr=parse_url($_POST['dir']);	
	if (isset($urarr['query'])) parse_str($urarr['query'],$vals);	
	if (isset($vals['dir']))
	{
		//echo $url."?dir=".$vals['dir'];
		if (isset($_POST['edtext']))
		{							
			$fl=fopen($win_suff.$vals['dir'],"w");
			$svdata=$_POST['edtext'];
			if ($ccp!="UTF-8") $svdata=iconv("UTF-8",$ccp,$svdata);
			fwrite($fl,$svdata);
			fclose($fl);			
		}
		if (isset($_POST['create_fl']))//isset($_POST['create_dr'])
		{
			$file=fopen($win_suff.$vals['dir']."/".$_POST['create_fl'],"w");
			if ($file==false) errorOut();
		}
		if (isset($_POST['create_dr']))//
		{
			$file=mkdir($win_suff.$vals['dir']."/".$_POST['create_dr']);
			if ($file==false) errorOut();
		}
		if (isset($_POST['delfls']))//
		{
			$dpth=mb_split("\*",$_POST['delfls']);
			if (count($dpth)>0)
			{
				foreach($dpth as $pth)
				{
					if (is_dir($win_suff.$pth))
					{
						if (rmdir($win_suff.$pth)===false) errorOut();										
					}
					else 
					{						
						if (unlink($win_suff.$pth)===false) errorOut();
					}					
				}
			}			
		}
		if (isset($_POST['flpaste']))
		{			
			$tagets=$_POST['flpaste'];
			
			if (isset($_POST['nname']))
			{				
				if (copy($win_suff.$tagets,$win_suff.$vals['dir']."/".$_POST['nname'])===false) errorOut();
			}
			if (isset($_POST['rgxname']))
			{				
				$targets=mb_split("\*",$tagets);
				$rgx=$_POST['rgxname'];
				if ($rgx!="") $rgx=mb_split("/",$rgx);
				$errarr=null;				
				foreach ($targets as $trg)
				{
					$oldname=mb_substr($trg,mb_strripos($trg,"/")+1);
					$newname=$oldname;
					$newpath=$vals['dir'];
					//$fl=fopen("log.txt","a+");fwrite($fl,"\n:".var_export($rgx,true));fclose($fl);
					if (isset($rgx[0])&&isset($rgx[1])) $newname=mb_ereg_replace($rgx[0],$rgx[1],$oldname);
					if (copy($win_suff.$trg,$win_suff.$newpath."/".$newname)===false) $errarr[]=error_get_last();
				}
				if ($errarr!=null) errorOut($errarr);
			}
		}
	}
}
echo $outtext."</body></html>";
?>