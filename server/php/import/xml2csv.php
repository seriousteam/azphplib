<?php
$src = simplexml_load_file("php://stdin");
$last_elem = null;
$last_attrs = null;
foreach($src->children() as $e) {
  if($e->getName() === 'rel-cmd') {
    $key = $e['name'];
    $val = (string)$e;
    echo "!$key=$val\n";
    continue;
  }
  if(strpos($e->getName(), '-')) {
    $key = str_replace('-', '.', $e->getName());
    $val = $e['cmd']?: (string)$e;
    echo "!$key=$val\n";
    continue;
  }
  $attrs = current($e->attributes());
  ksort($attrs);
  $fn = join(',', array_keys($attrs));
  if(
     $last_elem !== $e->getName() 
     || $last_attrs !== $fn
     ) {
    $last_elem = $e->getName();
    $last_attrs = $fn;
    echo ".$last_elem\n$fn\n";
  }
  fputcsv(STDOUT,  array_values( $attrs ) );
}