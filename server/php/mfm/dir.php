<?php
require_once __DIR__.'/auth.php';
require_once __DIR__.'/WinFsStreamWrapper.php';
$ccp="UTF-8";
if (isset($_REQUEST['current_cp'])) $ccp=$_REQUEST['current_cp'];
$curhl="plain";
if (isset($_REQUEST['synt_hl']))	$curhl=$_REQUEST['synt_hl'];
header("Content-Type: text/html; charset=".$ccp);
$ed_simple="0";
if (isset($_REQUEST['ed_simple'])) $ed_simple=$_REQUEST['ed_simple'];
ini_set("display_errors", 1);
$editFileVars="current_cp=$ccp&synt_hl=$curhl&ed_simple=$ed_simple";
$title=@$_GET["dir"];
$title=$title?basename($title):"root";
if(is_dir(@$_GET["dir"])) $title=mb_strtoupper($title);
$extension=mb_strtolower(pathinfo(@$_GET["dir"],PATHINFO_EXTENSION));
$outtext=<<<HTHEAD
<html>
<head>
<title>$title</title>
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
<link rel="stylesheet" href="mfm.css">
<script type="text/javascript" src="js.js">
</script>
<script>
setGlobVar('current_cp',"$ccp");
setGlobVar('synt_hl',"$curhl");
setGlobVar('ed_simple',$ed_simple);
</script>
</head>
<body mfmmain>
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
		$lgout="<div bottombuttons><span>Signed in as </span><span username onclick=\"window.open('http://".$_SERVER['HTTP_HOST'].
			$_SERVER['SCRIPT_NAME']."?action=logout')\">".$_SESSION['name']."</span></div>";
		$outtext.= <<<HTTT
<div buttons>
<button delete onclick="deleteFile();" title="Delete Choosen"></button>
<button copy onclick="pasteFiles();" title="Copy Choosen"></button>
<button grep onclick="window.open('grep.php'+location.search+'&$editFileVars&keys='+encodeURIComponent('-H -n -D skip -r -I --color=always'));" title="Grep"></button>
<input autofocus filter placeholder=Filter type="text" name="fltxt" value="" onchange="filterContent();" title="Filter Files and Folders">
<input type="submit" value="" style="border: none;background:transparent;" onclick="filterContent();">
</div>
<div style="clear: both;" container>
HTTT;
		$sdr=scandir($win_suff.$get);
		$dirs="";
		$files="";		
		foreach($sdr as $ddr)
		{
			$file_tst=true;
			$dir_tst=true;
			$link=ru_realpath($get."/".$ddr);			
			$checkbox="<input type='checkbox' name='chbt' data-url='$link' onclick='copyFiles()'>";
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
					if($ddr=="..") {
                        $upfolder = "dir.php?dir=$link";
                    }
					else
						$dirs.="<div folder>$checkbox<a href='dir.php?dir=$link'>$ddr</a></div>";
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
					$files.="<div file>$checkbox<a href='dir.php?dir=$link&$editFileVars'>$ddr</a></div>";	
			}		
		}
       $subbuttons= <<<UPFOLDER
<div subbuttons>
<button upfolder type="button" onclick='window.open("$upfolder","_self")'></button>
<button newfile onclick="create(1);" title="New File"></button>
<button newdir onclick="create(0);"  title="New Dir"></button>
</div>
UPFOLDER;
		$outtext.= $subbuttons.$dirs.$files.$lgout;
        
	}
	else 
	{
		// text edit
		$backurl=mb_substr($get,0,mb_strripos($get,"/"));
		if ($backurl=="") $backurl=mb_substr($get,0,mb_strripos($get,"\\"));
		$url.="?dir=".$backurl;
		$simple_ed_ch="";
		$text_st="<div style='clear: both;'><textarea name='teditor' id='teditor'>";
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
		$go_txt_line=0;
		if (isset($_REQUEST['text_goto'])) $go_txt_line=$_REQUEST['text_goto'];
		if (isset($_REQUEST['ed_simple']))
		{
			if ($_REQUEST['ed_simple']=="0")
			{
				$simple_ed_ch="checked";
				$text_st=<<<EDSTRT
<textarea name='hltxt' id='hltxt'>
EDSTRT;
				$text_end=<<<EDTXT
</textarea>
  <link rel=stylesheet href="cm/doc/docs.css">
  <link rel="stylesheet" href="cm/lib/codemirror.css">
  <link rel="stylesheet" href="cm/addon/fold/foldgutter.css">
  <link rel=stylesheet href="mfm.css">
                  
  <script src="cm/lib/codemirror.js"></script>
  <script src="cm/addon/fold/foldcode.js"></script>
  <script src="cm/addon/fold/foldgutter.js"></script>
  <script src="cm/addon/fold/brace-fold.js"></script>
  <script src="cm/addon/fold/xml-fold.js"></script>
  <script src="cm/addon/fold/markdown-fold.js"></script>
  <script src="cm/addon/fold/comment-fold.js"></script>
  <script src="cm/addon/selection/active-line.js"></script>
<script src="cm/addon/edit/matchbrackets.js"></script>
<script src="cm/addon/search/search.js"></script>
<script src="cm/addon/search/match-highlighter.js"></script>
	<script src="cm/mode/htmlmixed/htmlmixed.js"></script>
	<script src="cm/mode/xml/xml.js"></script>
	<script src="cm/mode/javascript/javascript.js"></script>
	<script src="cm/mode/css/css.js"></script>
	<script src="cm/mode/clike/clike.js"></script>
	<script src="cm/mode/php/php.js"></script>
	<script src="cm/mode/scheme/scheme.js"></script>

<script id="tscript"></script>
<script>
  var te = document.getElementById("hltxt");
  window.editor = CodeMirror.fromTextArea(te, {
    mode: {
    "js":"javascript",
    "php":"php",
    "css":"css",
    "htm":"htmlmixed",
    "html":"htmlmixed",
    "xml":"xml"
    }["$extension"]||"scheme",
    lineNumbers: true,
    lineWrapping: true,
	styleActiveLine: true,
    //foldGutter: true,
	matchBrackets: true,
    viewportMargin:1000000,
    highlightSelectionMatches:false,
    gutters: ["CodeMirror-linenumbers"/*, "CodeMirror-foldgutter"*/]
  });
  
  //var pending;
	editor.on("change", function() {
		//clearTimeout(pending);
		//pending = setTimeout(update, 400);
        document.querySelector("[savebutton]").setAttribute("changes",1);
        if(editor.historySize().undo)
            document.querySelector("[undobutton]").setAttribute("changes",1);
        else {
            document.querySelector("[undobutton]").removeAttribute("changes");
            document.querySelector("[savebutton]").removeAttribute("changes");
        }
	});
  /*
  function looksLikeScheme(code) {
		return !/^\s*\(\s*function\b/.test(code) && /^\s*[;\(]/.test(code);
  }
  function update() {
		editor.setOption("mode", looksLikeScheme(editor.getValue()) ? "scheme" : "javascript");
  }*/
  function spotMode(o) {
    var off = o && o.getAttribute("spotmode")!=null;
    if(off){o.removeAttribute("spotmode")}
    else {o.setAttribute("spotmode",1)}
    editor.setOption("readOnly",off?false:"nocursor");
    editor.setOption("highlightSelectionMatches",off?false:{showToken:/\w/});
  }
  
  window.editor.setCursor($go_txt_line-1,0);
  window.editor.focus();
  
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
$refresh="";
$refarr=array("10","30","60","120");
$ctimer="30";
if (isset($_COOKIE['ref_text_timer'])) $ctimer=$_COOKIE['ref_text_timer'];
foreach ($refarr as $cc)
{
	if ($cc==$ctimer) $refresh.="<option selected>$cc</option>";
	else $refresh.="<option>$cc</option>";
}
$hlarr=array("plain","php","js","C","ini","sql");
$hllist="";	
$fcont=file_get_contents($win_suff.$get);
$hashcont=md5($fcont);
foreach ($hlarr as $hl) if ($curhl==$hl) $hllist.="<option selected>$hl</option>";
	else $hllist.="<option>$hl</option>";
$outtext.=<<<HTTXT
<script>
	setGlobVar("hashtext","$hashcont");
	startTextTimer();
</script>
<div mfmedit>
<div style="float:left;margin-bottom:3px;">
<button savebutton type="submit" value="" onclick="saveFile(this);"></button>
<button exitbutton type="button" onclick='window.open("$url","_self")'></button>
<button undobutton type=button onclick='editor.execCommand("undo")'></button>
<button spotbutton type=button onclick='spotMode(this)'></button>
</div>
<div style="float:right;padding-right:2em"> 
<!--label title="Another user modify time check">Check time(s)</label>
<select name="seltime" onchange="onChangeTimer();" title="Another user modify time check">
$refresh
</select--!>
<!--select name="lang" onchange="changeLang();" title="Syntax hightlight">
$hllist
</select>
<select name="codepg" onchange="changeCP()"; title="Code page">
$cplist
</select>
<input title="On\Off hightlight code" type="checkbox" name="simple_ed" $simple_ed_ch onclick="changeEdit();">Hightlight--!></div>
</div>
$text_st
HTTXT;

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
			$newhash=md5($svdata);
			if ($ccp!="UTF-8") $svdata=iconv("UTF-8",$ccp,$svdata);
			fwrite($fl,$svdata);
			fclose($fl);
			//setcookie("hashtext",$newhash);			
			echo $newhash;
			die;
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
		if (isset($_POST['get_hash']))//
		{
			$fldat=file_get_contents($win_suff.$vals['dir']);
			echo md5($fldat);
			die;
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