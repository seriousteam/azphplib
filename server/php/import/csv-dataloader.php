<?php
if($argc<4) die("Usage: php -f dataloader.php server user pass [default table] < data-file");

$server = $argv[1];
$user = $argv[2];
$pass = $argv[3];
if($pass === "-") $pass = "";
$table = isset($argv[4]) ? $argv[4] : "";

$dbh = new PDO($server, $user, $pass);
$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$handle = STDIN;

$field_names = null;

$gen = null;
$subgen = 0;

$dbtype = explode(":", $server, 2)[0];

$seqcmd = array(
		'pgsql' => "select nextval('mainseq')"
		);

$adv_cmds = array();
 
while($data = fgetcsv($handle)) {
  if(count($data) === 0) continue;
  if(count($data) === 1) {
    if($data[0] === null) continue;
    if($data[0] === "") continue;
    if($data[0][0] === "#") continue;
  }
  if($data[0] && $data[0][0] === "!") {
    $cmd = explode('=', substr($data[0],1), 2);
    $adv_cmds[$cmd[0]] = $cmd[1];
    continue;
  }
  if($data[0] && $data[0][0] === "." || $field_names === null) {
    //new table, fetch fields
    if($data[0][0] === "."){
      $table = substr($data[0],1);
      $field_names = fgetcsv($handle);
    } else {
      $field_names = $data;
    }
    $flds = array();
    $pholds = array();
    foreach($field_names as $fname) {
      $flds[] = $fname;
      if(array_key_exists("{$table}.$fname", $adv_cmds))
	$pholds[] = $adv_cmd["{$table}.$fname"];
      else
	$pholds[] = "?";
    }
    $stmt = $dbh->prepare(
		"INSERT INTO $table (".join($flds,",").
		") VALUES (".join($pholds,",").")"
	    );
    continue;
  }
  $data = array_map ( function($x) { return $x === ""? null : $x; }, $data ); 
  if($field_names[0] === "syrecordidw" 
     && $data[0] === null) {
    //generate value
    if(!$gen){
      $gen = $dbh->query($seqcmd[$dbtype])->fetchColumn();
    }
    ++$subgen;
    $data[0] = str_pad("$gen-{$subgen}_", 24, '0', STR_PAD_LEFT);
  }
  $stmt->execute($data);
}
?>

