<?php
require_once __DIR__.'/users.php';
//=========== settings ============
$default_dir=__DIR__."/../../../../../";
//=================================
if (isset($_GET['action']) AND $_GET['action']=="logout") 
{
  session_start();
  session_destroy();
  header("Location: http://".$_SERVER['HTTP_HOST'].$_SERVER['SCRIPT_NAME']);//.
  exit;
}
if (isset($_GET['auth_name']))
{
	$name=$_GET['auth_name'];
	$pass=$_GET['auth_pass'];
	$user=null;
	foreach ($userlist as $usr) if ($name==$usr['name']&&$pass==$usr['pass']) $user=$usr; 
	if ($user) 
	{
    	session_start();
    	$_SESSION['name'] = $name;
    	$_SESSION['ip'] = $_SERVER['REMOTE_ADDR'];
	if (isset($user['default_dir'])) $default_dir=$user['default_dir']; 
  	}
  	else 
  	{
  		header("Location: http://".$_SERVER['HTTP_HOST'].$_SERVER['SCRIPT_NAME']);
  		exit;
  	}  	
}
session_start();//if (isset($_REQUEST[session_name()])) 
if (!(isset($_SESSION['name']) AND $_SESSION['ip'] == $_SERVER['REMOTE_ADDR']))
{
	echo '
	<html>	
	<style type="text/css">
	html{ min-height:100%;}	
	body {text-align:center;	height:100%;}
	table {
		align:center;
		width:100%;height:100%;
	}
	</style>
	<link rel="stylesheet" href="mfm.css">
	<body mfmlogin>
	<table align="center">
	<tr align="center"><td>
	<form method="GET">
	<input type="text" name="auth_name" autofocus placeholder="User name">
	<input type="password" name="auth_pass" placeholder="Password">
	<input type="submit" value="Login">
	</form>
	</td>
	</tr>
	</table>
	</body>
	</html>
	';
	exit;
}
foreach ($userlist as $usr) if ($usr['name']==$_SESSION['name']) 
{
	if (isset($usr['default_dir']))$default_dir=$usr['default_dir']; 
	break;
}