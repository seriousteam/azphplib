<?php
require_once __DIR__.'/cfg.php';

$fname = $_REQUEST['fname'];

if(file_exists($G_P_DOC_ROOT.$fname)) {
	//header("Location: ",our_URI($fname));
	die('<meta http-equiv="refresh" content="0; '.our_URI($fname).'">');
}
?>
<html>
<head>
<meta http-equiv="refresh" content="5">
</head>
<body>
<center>....please, wait....</center>
<?php echo $G_P_DOC_ROOT.$fname.'-->'.our_URI($fname)?>
</body>
</html>