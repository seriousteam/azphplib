<?php
require_once(__DIR__.'/kladrfuncs.php');
require_once(__DIR__.'/../processor.php');
require_once(__DIR__.'/../sas_coder.php');
require_once(__DIR__.'/../template-runtime.php');
function SEP() { return "&ensp;"; }
function parseGoodAddress($v) {
	$parts = mb_split(SEP(), $v);
	$names = array('index', 'sreg', 'reg', 'srn', 'rn', 'sgor', 'gor', 'spunkt', 'punkt', 'sstreet', 'street' );
	$numbers = array( 'house',  'corpus', 'build', 'flat', 'room', 'office', 'place');
	$names = array_merge($names, $numbers);
	if(count($names)==count($parts)) { 
		$result = array_combine($names, array_map(function($d) { return preg_replace('/(^[ ,]*|[ \.,]*$)/ui','',$d); },$parts)); 
		foreach( $numbers as $name ) {
			$result[$name] = preg_replace('/^\s*[а-я-]+\.\s*/ui','',$result[$name]);
		}
	}
	return @($result ? $result : '');
}
function TF($o, $f) { 
	return $o ? str_replace('$$', $o, $f) : "";
}
function ru_addressIdx($v) { return preg_match('/(\d{6})/i', $v, $m) ? $m[1] : null; }
function ru_addressTag($v) {
	//$m[1] - Дом, $m[2] - Корпус, $m[3] - Строение, $m[4] - Квартира, $m[5] - Комната
	return preg_match('/'.
	',?\s*(?:дом\s|д(?:\.|\s))\s*(?P<house>\d[\/0-9а-я]*(?:\s+литер\s[а-я])?)'.
	'(?:,?\s*(?:корпус\s|кор(?:\.|\s)|корп(?:\.|\s)|к(?:\.|\s)|-)\s*(?P<corpus>[\/0-9а-я]+))?'.
	'(?:,?\s*(?:строение\s|стр(?:\.|\s)|с(?:\.|\s))\s*(?P<build>[\/0-9а-я]+))?'.
	'(?:,?\s*(?:офис\s|оф(?:\.|\s))\s*(?P<office>[\/0-9а-я]+))?'.
	'(?:,?\s*(?:помещение\s|пом(?:\.|\s))\s*(?P<place>[\/0-9а-я]+))?'.
	'(?:,?\s*(?:(?:квартира\s|-|кв(?:\.|\s))\s*(?P<flat>[\/0-9а-я]+)|(?:комната\s|ком(?:\.|\s))\s*(?P<room>[\/0-9а-я]+)))?/ui', $v, $m) ?
	array_intersect_key($m, array_fill_keys(array('house','corpus','build','office','place','flat','room'), 0)) : null;
}
function kladrPrint($idx, $address, $tag) {
	$tag = TF(@$tag['house'],', д. $$').SEP().
		TF(@$tag['corpus'],', к. $$').SEP().
		TF(@$tag['build'],', стр. $$').SEP().
		TF(@$tag['flat'],', кв. $$').SEP().
		TF(@$tag['room'],', ком. $$').SEP().
		TF(@$tag['office'],', оф. $$').SEP().
		TF(@$tag['place'],', пом. $$');
	$address = 
	TF($address['sreg'], " $$.").SEP().TF($address['reg'], " $$, ").SEP().
	TF($address['srn'], " $$.").SEP().TF($address['rn'], " $$, ").SEP().
	TF($address['sgor'], " $$.").SEP().TF($address['gor'], " $$, ").SEP().
	TF($address['spunkt'], " $$.").SEP().TF($address['punkt'], " $$, ").SEP().
	TF($address['sstreet'], " $$.").SEP().TF($address['street'], " $$ ").SEP();
	return "_$idx".SEP()."$address $tag";
}
function kladrSearch($addr) {
	$kladr_conn = get_connection('kl_kladr');
	$address = getKLADR( $addr, $kladr_conn);
	return $address ? kladrPrint(ru_addressIdx( $addr ), $address, ru_addressTag( $addr ) ) : "";
}
?>