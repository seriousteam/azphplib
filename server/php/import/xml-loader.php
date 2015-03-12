<?php
$example = <<<XML
<?xml version="1.0"?>
<root xmlns:k="key">
<aaa><k:f1>1</k:f1><f2>2</f2><f3>3</f3></aaa>
<bbb><f3>3</f3></bbb>
</root>
XML;

if($argc<2) die("Usage: php -f xml-loader.php < data-file");

require_once(__DIR__.'/../db-oo.php');

$field_names = null;

$log = preg_match('/(^|[,])log($|,)/',$argv[1]);
//$log =1;

$src = simplexml_load_file('php://stdin');
//$src = simplexml_load_string($example);

$last_elem = null;
$last_attrs = null;

foreach($src->children() as $e) {
  $model_table = $Tables[$e->getName()];
  $keys = [];
  foreach($e->children('k', TRUE) as $k) 
	if(array_key_exists($k->getName(), $model_table->fields)) 
		$keys[$k->getName()] = (string)$k;
  ksort($keys);
  $attrs = [];
  foreach($e->children() as $k) 
	if(array_key_exists($k->getName(), $model_table->fields))
		$attrs[$k->getName()] = (string)$k;
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
      $pholds[] = '?';
      if(array_key_exists($fname, $keys)){
        $flt[] = "$fname = ?";
      } else {
        if($fname !== 'syrecordidw')
          $upd[] = "$fname = ?";
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
    $data[$srid] = GenStringCID(24); //generalize this, to make working with other cids
    $e->syrecordidw = $data[$srid]; //copy back!
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

header('Content-type: application/xml');
echo $src->saveXML(); //output generated values
