
<?php

echo $_SERVER['SCRIPT_FILENAME'];

$xml = '<example xmlns:foo="my.foo.urn" foo:a="Apple" foo:b="Banana" c="Cherry"></example>';

$sxe = new SimpleXMLElement($xml);

$kids = $sxe->attributes('foo');
var_dump(count($kids));

$kids = $sxe->attributes('foo', TRUE);
var_dump(count($kids));

$kids = $sxe->attributes('my.foo.urn');
var_dump(count($kids));

$kids = $sxe->attributes('my.foo.urn', TRUE);
var_dump(count($kids));

$kids = $sxe->attributes();
var_dump(count($kids));

function f() { return '1'; }
#function f() { return '2'; }
#define('A', '1');
#define('A', '2');
$ff = 'f';
define('fff',$ff);

//var_dump(fff());

var_dump(get_current_user());
?>
