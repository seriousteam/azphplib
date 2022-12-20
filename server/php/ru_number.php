<?php

/*
spell out russian number

ru_number($n, $lcmd, $rcmd = null, $left = '', $right = '')

$left - command before dot
$left - command after dot

command:
	1) N - split by N digits
	2) 0 - output as simple number
	3) null - skip
	4) 'str' - m/f/n - gender
	left/right: 
		str or
		array [ 'рубль', 'рубля', 'рублей' ]
*/

function ru_number_take_word($n, $wlist) {
	if(!is_array($wlist)) return $wlist;
	switch((int)substr($n,-1)) {
		case 1: return strlen($n) === 1 || substr($n,-2,1) !== '1' ? $wlist[0] : $wlist[2];
		case 2: case 3: case 4: return strlen($n) === 1 || substr($n,-2,1) !== '1' ? $wlist[1] : $wlist[2];
		default: return $wlist[2];
	}
}

$ru_number_arr = [ '-'
	, [ 'm' => 'один', 'f' => 'одна', 'n' => 'одно']
	, [ 'm' => 'два', 'f' => 'две', 'n' => 'два']
	,'три' ,'четыре' ,'пять' ,'шесть' ,'семь' ,'восемь' ,'девять'
	,'десять' 
	,'одиннадцать' ,'двенадцать' ,'тринадцать' ,'четырнадцать' ,'пятнадцать'
	,'шестнадцать' ,'семнадцать' ,'восемнадцать' ,'девятнадцать'
];
$ru_number_arr_10 = [
	' - '
	, 'десять'
	,'двадцать' ,'тридцать' ,'сорок' ,'пятьдесят' 
	,'шестьдесят' ,'семьдесят' ,'восемьдесят' ,'девяносто'
];
$ru_number_arr_100 = [
	' - '
	,'сто' ,'двести' ,'триста' ,'четыреста' ,'пятьсот'
	,'шестьсот' ,'семьсот' ,'восемьсот' ,'девятьсот'
];

$ru_number_arr_grps = [
	[]
	,[['тысяча' ,'тысячи' ,'тысяч'], 'f']
	,[['миллион' ,'миллиона' ,'миллионов'], 'm']
	,[['миллиард' ,'миллиарда' ,'миллиардов'], 'm']
];

function ru_number_grp($n, $lcmd, $wl, $last) {
	global $ru_number_arr, $ru_number_arr_10, $ru_number_arr_100;
	$r = '';
 	$n = (int)$n; 
 	$last = $last || $n;
	if($n >= 100) {
		$r .= $ru_number_arr_100[ (int)$n/100 ];
		$n = $n % 100;
	}
	if($n >= 20) {
		if($r) $r .= ' ';
		$r .= $ru_number_arr_10[ (int)$n/10 ];
		$n = $n % 10;
	}
	if($n) {
		if($r) $r .= ' ';
		if($n == 1 || $n ==2)
			$r .= $ru_number_arr[ (int)$n ][$lcmd];
		else
			$r .= $ru_number_arr[ (int)$n ];
	}
	if($last)
		$r .= ' ' . ru_number_take_word($n, $wl);
	return $r;
}

function ru_number($n, $lcmd = 3, $rcmd = null, $left = '', $right = '') {
	global $ru_number_arr_grps;
	$r = '';
	$n = (string)$n;
	if($n === '0') {
		if($lcmd !== null) {
			if(is_string($lcmd))
				$r = 'ноль '.ru_number_take_word(0, $left);
			else if(is_numeric($lcmd))
				$r = '0 '.ru_number_take_word(0, $left);
		}
		if($rcmd !== null) {
			if($r !== '') $r .= ' ';
			if(is_string($rcmd))
				$r = 'ноль '.ru_number_take_word(0, $right);
			else if(is_numeric($rcmd))
				if($rcmd===0)
					$r = '0 '.ru_number_take_word(0, $right);
				else
					$r =  str_repeat('0', $rcmd).' '.ru_number_take_word(0, $right);
		}
		return $r;
	}
	$n = number_format( $n, is_string($rcmd)? 2 : $rcmd, '.', ' ');
	$n = explode('.', $n);
	$nl = explode(' ', $n[0]); $nr = @$n[1];
	if($lcmd !== null) { 
			$nlimp = implode('', $nl);
			if(is_string($lcmd)) {
				$grp_n = count($nl);
				foreach($nl as $grp) {
					if($r) $r .= ' ';		
					--$grp_n;			
					$r .= ru_number_grp($grp 
							, $grp_n ? $ru_number_arr_grps[$grp_n][1] : $lcmd
							, $grp_n ? $ru_number_arr_grps[$grp_n][0] : $left
							, !$grp_n
						);
				}
			}
			else if(is_numeric($lcmd))
				$r = ($lcmd === 3 ? $n[0] : $nlimp) 
					. ru_number_take_word($nlimp, $left);
	}
	if($rcmd !== null) {
		if($r !== '') $r .= ' ';
		if(is_string($rcmd))
			$r = ru_number_grp($nr, $rcmd, $right);
		else if(is_numeric($rcmd))
				$r =  $nr.' '.ru_number_take_word($nr, $right);
	}
	return $r;
}
