<?php
if($argc < 2 ) die("Usage php -f csv2xml table_name field_name ... field_name < input.csv");
$data = null;
$table = $argv[1];
$fnames = array_slice ( $argv, 2 );
print "<?xml version=\"1.0\"?>
<table>
";
while($data = fgetcsv(STDIN)) {
  if(count($data) === 0) continue;
  if(count($data) === 1 && $data[0] === "") continue;
  $data = array_map( function($k, $v) {
      return "$k=\"".htmlspecialchars($v)."\"";
    }, $fnames, $data);
  echo "\t<$table ".implode(' ', $data)." />\n";
}
print "</table>";