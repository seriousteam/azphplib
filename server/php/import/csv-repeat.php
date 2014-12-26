<?php
$data = null;
$last = array();
while($data = fgetcsv(STDIN)) {
  if(count($data) === 0) continue;
  if(count($data) === 1 && $data[0] == '') continue;
  $last = $data = array_map(function($x, $y) { return $x?:$y; }, $data, $last);
  fputcsv(STDOUT,  $data );
}