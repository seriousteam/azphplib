<?php
/*TODO: parse 
I) - DONE
  <data>
    <tname fname=value/>
  </data>
III)
  <data>
    <r name=tName><c name=fName>value</c></r>
  </data>
  this keep field order, relativly short and simplexml give us what we want
  (iterator foreach for all rows, access with '->' to cols and foreach for them)
*/

if($argc<2) die("Usage: php -f dataloader.php < data-file");

require_once(__DIR__.'/../cfg.php');
require_once(__DIR__.'/../dialects.php');
require_once(__DIR__.'/../rights.php');

$field_names = null;

$gen = null;
$subgen = 0;

$dbtype = db_dialect($default_db);

$adv_cmds = array();

$log = preg_match('/(^|[,])log($|,)/',$argv[1]);

$src = simplexml_load_file('php://stdin');
$last_elem = null;
$last_attrs = null;
foreach($src->children() as $e) {
  if(strpos($e->getName(), '-')) {
    $key = $e->getName();
    $val = $e['cmd']?: (string)$e;
    $adv_cmds[$key] = $val;
    continue;
  }
  $keys = current($e->attributes('k', TRUE));
  if($keys)
    ksort($keys);
  else
    $keys = [];
  $attrs = current($e->attributes());
  ksort($attrs);
  $field_names = array_merge( array_keys($attrs), array_keys($keys) );
  $fn = join(',', $field_names);
  if(
     $last_elem !== $e->getName() 
     || $last_attrs !== $fn
     ) {
    $last_elem = $e->getName();
    $last_attrs = $fn;

    $table = $last_elem;

    $dbh = get_connection($table);

    $flds = array();
    $pholds = array();
    $flt = array();
    $upd = array();
    foreach($field_names as $fname) {
      $flds[] = $fname;
      $pholds[] = $ph = @$adv_cmd["{$table}-$fname"]?: '?';
      if(array_key_exists($fname, $keys)){
        $flt[] = "$fname = $ph";
      } else {
        if($fname !== 'syrecordidw')
          $upd[] = "$fname = $ph";
      }
    }
    $flds = join(',', $flds); 
    $pholds = join(',', $pholds);
    $flt = join(' AND ', $flt);
    $upd = join(',', $upd);
    $stmt = $dbh->prepare( "INSERT INTO $table ( $flds ) VALUES ( $pholds )" );
    $stmt_upd = $flt? $dbh->prepare( "UPDATE $table SET $upd WHERE $flt" ) : null;
  }
  $data = array_merge( array_values($attrs), array_values($keys) );
  $data = array_map ( function($x) { return $x === ''? null : $x; }, $data ); 
  $data_upd = $data;
  $srid = array_search('syrecordidw', $field_names, TRUE);
  if($srid !== FALSE && $data[$srid] === null) { 
    //generate value
    if(!$gen)$gen = $dbh->query($seqcmd[$dbh->dialect])->fetchColumn();
    ++$subgen;
    $data[$srid] = str_pad("$gen-{$subgen}_", 24, '0', STR_PAD_LEFT);
    array_splice($data_upd, $srid, 1); //remove syrecordidw from update, if it's not a key (generated)
  }

  if($stmt_upd) {
    if($log) echo "###UPDATE: ",implode(', ', $data_upd),"\n";
    $stmt_upd->execute($data_upd);
  }
  if(!$stmt_upd || $stmt_upd->rowCount() === 0) {
    if($log) echo "###INSERT: ",implode(', ', $data),"\n";
    $stmt->execute($data);
  }

}

?>

