<?php
require_once(__DIR__.'/processor.php');
require_once(__DIR__.'/sas_coder.php');
require_once(__DIR__.'/generator.php');

class smap {
	var $___base = null;
	var $___map = [];
	function __construct($base = null, $arr = []) { 
		$this->___base = $base;
		$this->___map = $arr;
	}
	function __destruct() {
		if($this->___base) $this->___base->clear();
	}
	function __get($name) { 
		return array_key_exists($name, $this->___map) ? $this->___map[$name] : 
			($this->___base? $this->___base->{$name} : null);
	}
	function __set($name, $val) { 
		$this->___map[$name] = $val;
	}
	function clear() { $this->___map = []; }
}

class loop_info {
	static $top = null;

	var $outer = null;

	var $was_connector = false;
	var $group_starts = [];
	var $group_level = 0;
	var $group_ends = 0;
	
	var $level = 0;
	
	function at_group_start($value) {
		$idx = $this->group_level;
		if($idx >= count($this->group_starts))
		{	
			$this->group_starts[$idx] = $value;
			return true; //new group
		} else {
			if($this->group_starts[$idx] === $value)
				return false; //same value
			array_splice($this->group_starts, $idx); //remove all up to idx
			$this->group_starts[$idx] = $value;
			return count($this->group_starts) - $idx; //all gropus depper $idx  changed
		}
	}
}

function at_group_start($value) { 
	if( ($cnt = loop_info::$top->at_group_start($value))
		&& $cnt !== true
		) 
	{
		while($cnt--
		&& loop_info::$top->group_ends) {
			--loop_info::$top->group_ends;
			ob_end_flush();
		}
	} else {
		if($cnt === false 
		&& loop_info::$top->group_ends) {
			--loop_info::$top->group_ends;
		    ob_end_clean(); //clean previous end
		}
	}
	++loop_info::$top->group_level;
	return $cnt !== false;
}
function at_group_end($a = false) { 
	ob_start(); loop_info::$top->group_ends++; 
	return true;
}

function between_iterations() { ob_start(); loop_info::$top->was_connector = true; }

class loop_helper extends IteratorIterator {
	var $info = null;

	var $counter = null;

	var $initial = 1;
	
	var $offset = 0;
	
	var $exInfo = null;

  function __construct($i, &$counter = null, $initial = 1, $exInfo = null) { 
	$this->exInfo = $exInfo;
	
	parent::__construct(
		$i === null ? new EmptyIterator :
		(is_array($i)? new ArrayIterator($i) : $i)
	); 

	$this->info = new loop_info;
	$this->info->outer = loop_info::$top;
	loop_info::$top = $this->info;
	if($this->info->outer) $this->info->level = $this->info->outer->level+1;
	$this->counter = &$counter;
	$this->initial = $initial;

	$this->offset =  @$i->offset;

  }
  function next (  ) { 
	if($this->counter !== 0)
		parent::next();
	else
		$this->counter = $this->offset;
	++$this->counter;
  }
  function rewind (  ) {
	parent::rewind();
	$this->counter = $this->initial === NULL ? (parent::valid()? 1 : 0) : $this->initial;
	if($i = $this->offset) {
		while($i--)
			parent::next();
	}
  }
  function valid() { 
	$ret = $this->counter === 0 || parent::valid();
	if($ret) { //at iteration very beginning!
		if($this->info->was_connector === true) {
			ob_end_flush();
			$this->info->was_connector = false;
		}
		//at_group_start will flush group ends, if any
		$this->info->group_level = 0;
	} else { //at iteration very end!
		while($this->info->group_ends--)
			ob_end_flush();
		if($this->info->was_connector === true)
			ob_end_clean();
	}
	return $ret;
  }
  function current() {  
	$r = $this->counter? parent::current() : new everything_you_want($this->exInfo->cmd);
	return method_exists($r, 'addInfo') ? $r->addInfo($this->exInfo) : $r; 
}

  function __destruct() { loop_info::$top = $this->info->outer; }
}
function with_loop_info($collection, &$counter = null, $info = null) { return new loop_helper($collection, $counter, 1, $info); }
function with_loop_info_and_sample($collection, &$counter = null, $info = null) { return new loop_helper($collection, $counter, 0, $info); }
function with_loop_info_or_sample($collection, &$counter = null, $info = null) { return new loop_helper($collection, $counter, NULL, $info); }

class everything_you_want { 
  private $cmd = null;
  private $subselects = [];
  private $info = null;
  function getName() { return $this->cmd->table; }
  function addInfo($info) { $this->info = $info; return $this; }
  function exInfo() { return $this->info; }

	function __get($name) { return null; } 
	function __construct($cmd) { $this->cmd = $cmd; 
	    foreach($cmd->subselects as $p=>$s) {
	      $args = [];
	      foreach($s->args as $i=>$a)
		$args[] = null;
		
		$this->subselects[$p] = new axCommandInfo($s, $args);
	    }
	}
	function subselect_info($name) { return $this->subselects[$name]; }
	function ns($name, $key=null) { return new namedString($name, null, $this, null); }

}
class uiGroup {
	var $caption = null;
	var $free = true;
	var $subtable = false;
	var $closed = false;
	var $lines = [];
}
class uiSearchField {
	var $name = null;
	var $caption = null;
	var $op = '=';
	var $re = null;
	var $priority = 0;
	function __ToString() {
		return "{$this->name} $this->op ?{$this->alias}";
	}
	function __construct($name, $caption, $op, $re, $priority) {
		$this->name = "a.$name";
		$this->alias = str_replace('.','__',$this->name);
		$this->caption = $caption;
		$this->op = $op;
		$this->re = $re;
		$this->priority = $priority;
	}
}
class uiField {
	var $alias = null; //a__rel__field
	var $expression = null; //a.rel.field etc.
	var $caption = null;

	var $name = null; // a.rel.field, is not null only for model fields

	var $colspan = 1;
	static $a_num = 0;
	static function gencaption($table, $name) {
		global $Tables;
		$table = $table ? $Tables->{$table->___name} : null;
		if($table) {
			$caption = [];
			$path = explode('.',$name);
			array_shift($path);
			$t = $table;
			if(end($path)==='_id_')
				array_pop($path);
			while(count($path)>0) {
				$p = array_shift($path);
				if(array_key_exists($p,$t->fields)) {
					$f = $t->fields[$p];
					$caption[] = ($f->target && count($path)>0) ? ($f->recaption ?: "*$p*") : ($f->caption ?: $p);
					$t = $f->target ?: $t;
				} else 
					break;				
			}
			$first = [ array_pop($caption) ];
			return implode(' ',array_merge($first,
				array_map(function($v) { 
					return mb_strtolower($v); 
				}, 
				array_reverse($caption))
			));
		} else {
			return $name;
		}
	}
	static function genalias($name) {
		if($name)
			return str_replace('.','__',$name);
		else
			return 'gen'.(uiField::$a_num++).'__'; //specially for name_of_field_in_nv to return empty string 	
	}
	function __ToString() {
		if($this->name)
			return "{$this->name} AS {$this->alias}";
		else
			return "({$this->expression}) AS {$this->alias}";
	}
	function min_width() {
		return max(0.7 * mb_strlen($this->caption), 13);
	}
	function __construct($table, $expression, $caption = null) {
		global $RE_ID;
		$this->expression = $expression;
		if(preg_match("/^\\s*$RE_ID(?:\\.$RE_ID)*\\s*$/",$expression)) {
			$this->name = explode('.',$expression)[0]==='a' ? $expression : "a.$expression";
		}	
		$this->alias = uiField::genalias($this->name);
		$this->caption = $caption ?: ($this->name ? uiField::gencaption($table, $this->name) : $this->expression);
		return $this;
	}
}
class ceNode {
	var $select_alias = null;
	var $sections = [];
	function __construct($tablename, $select_alias) {
		global $Tables;
		$this->select_alias = $select_alias;
		$this->table = $Tables->{$tablename};
	}
}

function get_ce(&$ce, $params) {
	global $RE_ID,$RE_PATH;
	if($params->xf) {
		foreach($params->xf as $x) {
			if(preg_match("/^($RE_ID):($RE_ID):([^:]+)(?::(.*))?$/i",$x,$m)) {
				//data:section_name:a.rel.f1
				$x = explode(':',$m[0]);
				$select_alias = $x[0];
				$section = $x[1];
				$path = $x[2];
				$caption = @$x[3];
				//$closest_agg
				/*
				preg_replace_callback($RE_PATH,
					function($m) use($path) {
						if(preg_match(_SQL_FUNC_KWD, $m[0])) {

		    			} else {
							$path = $m[0];
	        			}
						return $m[0];
					}, $x[2]);
				*/
				$cenode = @$ce[ $select_alias ];
				if($cenode) {
					$cenode->sections[ $section ][] = new uiField( $cenode->table, $path, $caption );	
				}						
			}				
		}		
	}
}
function merge_ce($target, &$ce) {
	global $RE_ID;
	return preg_replace_callback("/(\s*,\s*)?%%CE($RE_ID)%%(\s*,\s*)?/xi", 
	function($m) use($ce) {
		$select = @$ce[ $m[2] ];
		if( isset($select) && count($select->sections) ) {
			$fields = [];
			foreach($select->sections as $section)
				$fields = array_merge($fields, $section);
			
			return ($m[1] ? ',' : '').implode(',', $fields ).($m[3] ? ',' : '');
		}
		return $m[1] && @$m[3] ? ',' : '';
	}, $target);
}
function merge_queries($target, $cmd, &$args, &$offset, &$limit, &$page) {
	global $SELECT_STRUCT, $RE_ID;

	if(!$target && !$cmd) { return '[{"":""}]'; } 
	
	if($page) {
		$offset = 0;
		if(!$limit)
			$target .= " LIMIT $page";
		$limit = $page;
	}
	
	if(!$cmd) return $target;
	//take where, order, group from source and add it to target
	//or, if source is not a select, use data as is
	if(!is_string($cmd)) return $cmd;
	if(preg_match('/^\s*\[/', $cmd)) return $cmd;
	//SQL:
	//TODO: cache!
	$parsed_target = is_string($target) ?
			new parsedCommandSmart($SELECT_STRUCT, $target)
			: $target;

	if(preg_match('/^\s*OFFSET:(\d+)/', $cmd, $m)) {
		if($args) return merge_queries($parsed_target, array_shift($args), $args, $offset, $limit, $page); //ignore not last offset
		$offset = intval ($m[1]);
		$limit = $parsed_target->LIMIT = $offset + $page; 
		return (string)$parsed_target;
	}
	$cmd = preg_replace('/^\s*\*\*/', '*WHERE ', $cmd);
	if(!preg_match('/^\s*SELECT\s/si', $cmd)) $cmd = 'SELECT '. $cmd;
	$parsed_src = new parsedCommandSmart($SELECT_STRUCT, $cmd, $parsed_target->pre);
	if(!$parsed_src->ok || !$parsed_target->ok) return $target; //FIXME: throw
	if(!preg_match("/^\s*($RE_ID)(\s|$)/",$parsed_target->FROM, $mt)) 
		throw new Exception("table not specified in template base command, which is: $target");
	if(!preg_match("/^\s*($RE_ID)(\s|$)/",$parsed_src->FROM, $ms)) 
		$ms[1] = $mt[1]; //same as target!
	if($mt[1] !== $ms[1])
		throw new Exception("tables in the template base command ($mt[1]) and in the incomming command($ms[1]) are differenet");
	//copy parts
	if(@$parsed_src->WHERE)
		$parsed_target->WHERE = 
			@$parsed_target->WHERE? "( $parsed_target->WHERE ) AND ($parsed_src->WHERE)"
			: $parsed_src->WHERE;
	if(@$parsed_src->{'GROUP BY'})
		$parsed_target->{'GROUP BY'} = 
			@$parsed_target->{'GROUP BY'}? $parsed_target->{'GROUP BY'}.', '.$parsed_src->{'GROUP BY'}
			: $parsed_src->{'GROUP BY'};
	if(@$parsed_src->{'ORDER BY'})
		$parsed_target->{'ORDER BY'} = 
			@$parsed_target->{'ORDER BY'}? $parsed_target->{'ORDER BY'}.', '.$parsed_src->{'ORDER BY'}
			: $parsed_src->{'ORDER BY'};
	if(@$parsed_src->LIMIT)
		$parsed_target->LIMIT = $parsed_src->LIMIT; //TODO: min, max, what?
		
	//var_dump((string)$parsed_target);
	//var_dump($parsed_src->params);
	if($parsed_src->params < count($args)) { //we have more comands in chain
		$fargs = array_splice($args, 0, $parsed_src->params);
		$cmd = array_shift($args);
		$target = merge_queries($parsed_target, $cmd, $args, $offset, $limit, $page);
		$args = array_merge ($fargs, $args);
		return $target;
	}
	return (string)$parsed_target;
}

/*
functions

substr --> substr
left(n) === substr(0,n)
right(n) === substr(-n)
trim -->trim
ltrim, rtrim ---> ltrim, rtrim

replace ---> ???
lpad, rpad
nvl
around
round, trunc, rel_round
ru_date, ru_number

file reference with stamp!

*/

function NVL($v, $def) { 
	if($v instanceof namedString) {
		$v->value = NVL((string)$v, $def);
		return $v;
	}
	return $v === null || $v === ''? $def: $v; 
}
function tr($v, $arr = null, $trimz = false) {
	{
		$nv = $v;
		if($v instanceof namedString)  $nv = $v->value;
		if($trimz) $nv = trimZ($nv);
		$nv = $nv === NULL ? 
				NULL :
				$arr[(string)$nv]
		;
		if($v instanceof namedString) {
			$v->key = (string)$v;
			$v->value = $nv;
			$v->tr = $arr;
		} else $v = $nv;
	}
	return $v;
}
function tr_with_select($v, $select) {
	{
		$nv = $v;
		if($v instanceof namedString)  $nv = $v->value;
		$nv = $nv === NULL ? 
				NULL :
				Select($select, [$nv])->fetchColumn()
		;
		if($v instanceof namedString) {
			$v->key = (string)$v;
			$v->value = $nv;
		} else $v = $nv;
	}
	return $v;
}
function lpad($v, $cnt, $symb = ' ') { return str_pad($v, $cnt, $symb, STR_PAD_LEFT); }
function rpad($v, $cnt, $symb = ' ') { return str_pad($v, $cnt, $symb, STR_PAD_RIGHT); }
function replace($v, $from, $to) { return preg_replace($from, $to, $v); }
function trimZ($v) { $v = substr($v,0,1)=='.' ? '0'.$v : $v; return strpos($v, '.') === FALSE? $v : rtrim(rtrim($v, '0'), '.'); }
function isNZ($v) { return preg_match('/^0*$/', $v)? '' : $v; }
function toTitle($v) { return $v? mb_substr($v,0,1, 'UTF-8').'.' : $v; }
function nBOOL($v) { return $v === NULL || $v === '' ? NULL : ($v[0] === '0' ? FALSE : TRUE); }
function subRE($v, $re, $np = 0) { return preg_match($re, $v, $m)? $m[$np] : ''; }
function trimT($v) {  return preg_replace('/\s*\d\d:\d\d:\d\d(\.\d+)?\s*/', '', $v); }
function ROLES() { global $CURRENT_ROLES_ARRAY; return "('".implode("','",$CURRENT_ROLES_ARRAY)."')"; }
function HASROLE() { 
	global $CURRENT_ROLES_ARRAY;
	$roles = func_get_args();
	foreach($roles as $role) {
		if(in_array($role, $CURRENT_ROLES_ARRAY, TRUE)) return $role; 
	}
	return ''; 
}
function ERROR($cond, $text) { if($cond === null || $cond === '') throw new Exception($text); }

function fieldPart($value, $p) {
	$part = preg_quote($p);
	$fp = preg_match("/(?:^|\r\n)§§$part:\r\n(.*?)\r\n§§$part\./s", (string)$value, $m) ? $m[1] : '';
	if($value instanceof namedString) {
		$value->value = $fp;
		$value->part = $p;
		return $value;
	}
	return $fp;
}

function fieldPartN($value, $p) {
	$part = preg_quote($p);
	$fp = preg_match("/(?:^|\r\n)§§$part:\r\n(.*?)\r\n§§$part\./s", (string)$value, $m) ? $m[1] : '0';
	$fp = $fp ?: '0';
	if($value instanceof namedString) {
		$value->value = $fp;
		$value->part = $p;
		return $value;
	}
	return $fp;
}

function URIPart($val, $name) {
	if(is_array($val)) {
		return implode('&',array_map(
			function($v) use($name) { return "{$name}[]=".rawurlencode($v); }
		, $val));
	}
	if($val !== '')
		return "$name=".rawurlencode($val);
	else
		return '';
}

function seqCookie() {
	$s = @$_COOKIE['seq'] + 1;
	setcookie('seq', $s);
	return $s;
}
function pageSeqCookie() {
	static $s = null;
	if($s === null) $s = seqCookie();
	return $s;
}

function tabler_ref($table, $link = "") {
	return file_URI(_ENV_TABLER_URI, [ 'table' => $table, 'link' => $link ]);
}

function sas_PROC($v, $pname, $proc, $file, $root = '/') {
	return $root . '?' .
		http_build_query( [ $pname => $v
		, 'm' => $file, 'f' => $proc, 'target' => 'exec'
		]);
}

function sas_CARD($rid, $file, $table, $root = '/') {
	return $root . '?' .
	http_build_query( [ 'ro_filter' => "_main.$table.syrecordidw = $rid~"
		,'table' => "main.$table"
		,'target' => 'show_template'
		,'template' => $file
		]);
}
function sas_SET($filter, $file, $table, $root = '/', $params = []) {
	return $root . '?' .
	http_build_query( array_merge([
		'table' => "main.$table"
		,'target' => 'show_template'
		,'template' => $file
		,'multi' => '1'
		], $params, empty($filter)?[]:[ 'ro_filter' => sas_coder_ValList($filter) ]));
} 

function sas_TABLE($filter, $table, $root = '/') {
	return $root . '?' .
	http_build_query( [ 'ro_filter' => $filter
		,'query' => "report_".preg_replace('/^en/','', $table)
		,'target' => "webreport"
		]);
}

function sas_FORM($rid, $table, $root = '/') {
	return $root . '?' .
	http_build_query( [ 'ro_filter' => "_main.$table.syrecordidw = $rid~"
		,'table' => "main.$table"
		,'target' => "qe_editrec"
		]);
}

function sas_RCT($file, $root = '/') {
	return $root . 
		'rct/'.$file
		. '('.filemtime (__ROOTDIR__.'/../sys/app/rc/'.$file) .')';
}

function sas_PERSON() {
	global $CURRENT_USER;
	return cached('sas-persons', $CURRENT_USER,
			function($user) {
				$dbh = get_connection('');
				$stmt = $dbh->prepare(
					"SELECT enflw FROM enpn2persons WHERE enpnw = ?"
				);
				try {	$stmt->execute([$user]); } catch(Exception $e) { die($e); }
				if($r = $stmt->fetchColumn()) {
					return $r;
				} else {
					return '';
				}
			}, null
		);
}

function sas_PERSON_TO_QUERIES() {
	global $CURRENT_USER;
	setDbSessionVar('SAS_PERSON', "SELECT enflw as val FROM enpn2persons WHERE enpnw = '$CURRENT_USER' ", []);
}

function CURRENT_USER_TO_QUERIES($table = '') {
	global $CURRENT_USER;
	setDbSessionVar('CURRENT_USER', "SELECT CAST('$CURRENT_USER' AS VARCHAR(255)) AS val ", [], $table);
}


//http://localhost/sys/rct/templates/free/common/common-choosers.js(1396521129)

function CURRENT_URI() {
	global $CURRENT_TEMPLATE_URI;
	return $CURRENT_TEMPLATE_URI;
}

//function round
//function rel_round($v, $decs) {}
function ru_date($v) { return preg_replace('/^(\s*)(\d\d\d\d)-(\d\d)-(\d\d)/', '$1$4.$3.$2', $v); }
function to_client_tz($v) { return $v ? 
		gmdate("Y-m-d H:i:s",strtotime(substr($v,0,19)."GMT") - (@$_COOKIE['client_tzo']?:0)*60)
		: $v
	; }

function ru_BOOL($v) { return $v === NULL || $v === '' ? '' : ($v[0] === '0' ? 'нет' : 'да'); }

require_once __DIR__."/ru_number.php";

function load_template($file) {
	global $functions;
	static $included_templates = [];
	if(!$included_templates) $included_templates = [ TOPLEVEL_FILE => $functions ];
	if(array_key_exists($file, $included_templates)) return $included_templates[$file];	
	while( !($included_templates[$file] = @include $file) ) {}	
	//$included_templates[$file] = require_once($file);
	return $included_templates[$file];
}

$CURRENT_TEMPLATE_URI = our_URI($LOCALIZED_URI);


function call_template($name, $file, $cmd, &$args, $call_parameters, $caller, $perm = false) {
	global $CURRENT_TEMPLATE_URI, $LOCALIZED_URI;	
		
	if(!$file) $file = $caller;
	
	else if($file[0] === '/') {
			//absolute path ==> from sys doc root
			$file = __ROOTDIR__.$file;
			$CURRENT_TEMPLATE_URI = file_URI($file);
		} else {
			$CURRENT_TEMPLATE_URI = dirname($CURRENT_TEMPLATE_URI); //trim file part
			$f = $file;
			$f = preg_replace('#(?<=^|/)\./#', '', $f); // trim all `./ `
			while(preg_match('|^\.\./|', $f)) { //go up (../)
				$CURRENT_TEMPLATE_URI = dirname($CURRENT_TEMPLATE_URI); //go up
				$f = substr($f,3);
			}
			if($CURRENT_TEMPLATE_URI === '/') $CURRENT_TEMPLATE_URI = '';
			$CURRENT_TEMPLATE_URI .= '/'.$f; // add template part
			$file = dirname($caller). '/' . $file;
		}
	$_file = $file;
	if(_ENV_CACHE_DIR) {
		//template-cache rules		
		$cache = new TemplaterCache( urlencode( substr($file, strlen($_SERVER['DOCUMENT_ROOT'])+1 ) ) );
		if(dirname($file) !== _ENV_CACHE_DIR) {
			if( $cache->need_to_gen_from( $file ) ) {
				$cache->gen_from_file( $file );
			}
		}		
		$file = realpath( $cache->file() );	
	} else {
		//template monitor rules
		$file = preg_replace('/\.t$/','',$file);
		$file = realpath( $file );
	}

	if(!$file) {
		throw new Exception("$_file not found");
		exit;
	}
	$funcs = load_template($file);

	if(!$args) $args = [];

	$func = $funcs[$name?:'_main_'];
	$func($cmd, $args, $call_parameters); // call_parameters cleared in func automatically (with destroctor)

	$args = [];
}

function check_template($name, $file, $cmd, &$args, $call_parameters, $caller, $perm = false) {
	global $valueContext;
	$valueContext = $valueContext->pushStack();
		$call_parameters->check_card = true;
			ob_start();
				call_template($name, $file, $cmd, $args, $call_parameters, $caller, $perm);
			ob_end_clean();
		$ok = !$valueContext->hasError;
	$valueContext = $valueContext->popStack();
	return $ok;
}

function template_reference($name, $file, $cmd, &$args, $call_parameters, $caller, $perm = false) {
	global $CURRENT_TEMPLATE_URI;
	
	$uri = $CURRENT_TEMPLATE_URI;
	if($file)
		if($file[0] === '/') {
			//absolute path ==> from sys doc root
			$uri = $file;
			$file = __ROOTDIR__.$file;
		} else {
			$uri = dirname($uri); //trim file part
			$f = $file;
			$f = preg_replace('#(?<=^|/)\./#', '', $f);
			while(preg_match('|^\.\./|', $f)) {
				$uri = dirname($uri); //go up
				$f = substr($f,3);
			}
			$uri .= '/'.$f; // add template part
			$file = dirname($caller). '/' . $file;
		}
	else {
		$file = $caller;
	}
	$file = realpath($file);
	
	if($name) { 
		$args = $args ?: [];
		if($cmd!=='')
			array_unshift($args, $cmd);
		$cmd = 'T:'.$name;
	}
	$params = $call_parameters->___map; //only  recently added  parameters!!!!
	$params['cmd'] = $cmd;
	$params['args'] = $args;
	
	if( _AZ_STRIP_PHPT ) $file = substr($file, 0, -6); //.php.t
	$ret = file_URI($file, $params, $perm);

	$args = [];
	$call_parameters->clear(); //clear paramters after call
	
	$ret = str_replace('\\','/', $ret);
	echo $ret;
}

function dispatch_template($cmd, $args, $params = null, $file = null) {
	if($file && !file_exists($file)) return FALSE;
		
	if(is_string($cmd) && preg_match('/^O:(.*)\.(xlsx|csv)$/i', $cmd, $m)) {
		$f = "$m[2]_file_output";
		ob_start();
			$cmd = array_shift($args);
			dispatch_template( $cmd, $args, $params, $file);
			$text = ob_get_contents();
		ob_end_clean();
		$f($m[1], $text);
		die('');
	}

	if(is_string($cmd) && preg_match('/^T:(.*)/', $cmd, $m)) {
		$func_name = $m[1];
		$cmd = array_shift($args);
	} else {
		$func_name = '_main_';
	}

	if($file)
	if(_ENV_CACHE_DIR) {
		//template-cache rules		
		$cache = new TemplaterCache( urlencode( substr($file, strlen($_SERVER['DOCUMENT_ROOT'])+1 ) ) );
		if(dirname($file) !== _ENV_CACHE_DIR) {
			if( $cache->need_to_gen_from( $file ) ) {
				$cache->gen_from_file( $file );
			}
		}		
		$file = realpath( $cache->file() );	
	} else {
		//template monitor rules
		$file = preg_replace('/\.t$/','',$file);
	}
	
	$functions = load_template($file ?: TOPLEVEL_FILE);
	
	if(!@$functions[$func_name])
		throw new Exception("cannot find template function '$func_name' in ".($file ?: TOPLEVEL_FILE));
	
	$func = $functions[$func_name];
	$func($cmd, $args, new smap(null, $params ?: $_REQUEST));
	return TRUE;
}


//helpers
function x_str_putcsv($a) {
	$f = fopen('php://memory', 'r+');
	fputcsv($v, $a, ',', "'");
	rewind($f);
	return stream_get_contents($f);
}

function take_approx_values_from_command($cmd, $args) {
	global $RE_ID;
	//count args in select and from (usually 0), and skip them
	$p = substr_count($cmd->SELECT, '?') 
		+substr_count($cmd->FROM, '?');
	//and remove all args except where
	$where = $cmd->WHERE;
	$args = array_slice($args, $p, substr_count($where, '?') );
	$where = preg_replace_callback('/\?/', function($m) use(&$cnt) { return '?'. (int)$cnt++; }, $where );

	//take main alias
	$alias = 'a1'; //$cmd->alias;

	preg_match_all("/$alias\.($RE_ID)\s*+(?:=|LIKE)\s*+(\?\d+|'\d+'|\d+(?:\.\d*)?)/i", $where, $m);

	$m[2] = preg_replace_callback('/^\?(\d+)/', 
		function($m) use($args) { return '?'. $args[(int)$m[1]]; }
		, $m[2]);
	return array_combine($m[1], $m[2]);
}

function make_manipulation_command($data, $counter, $stmt = NULL, $with_pk = '') {
	$stmt = $stmt ?: $data->exInfo();
	
	$cmd = $stmt->cmd;
	if(!$cmd) return ''; //no command
	if(isset($cmd->parsed->{'GROUP BY'})) return ''; //maybe we can handle this as an insert into group / update whole group?

	$where_vals = 
		take_approx_values_from_command($cmd->parsed, $stmt->args); //due to $data->cmd() converted to db here (and store universal version in parsed)
	
	$stringer = $cmd instanceof dbspecific_select ? $cmd->cmd : $cmd; //FIXME!!!

	foreach($where_vals as &$v) {
		if($v)
			switch($v[0]) {
			case '\'': 
				$v = $stringer->unescape(substr($v,1,-1)); break;
			case '?' : $v = substr($v,1); break;
			}
	}

	$table = $cmd->table;
	global $Tables;
	$table = $Tables->{$table};
	if($counter) {
		//make core of update/delete
		$pk = $with_pk ? explode(',', $with_pk) : $table->PK(true);
		if(!$pk) return '';
		foreach($pk as $e) {
			if(isset($data->{'a__'.$e}))
				$d[] = $data->{'a__'.$e};
			else {
				if(!isset($where_vals[$e]))
					var_dump('make_manipulation_command', $counter, $where_vals);
				$d[] = $where_vals[$e];
			}
		}
		$arr = [ 'table' => $table->___name,
				'key_vals' => 
						sas_coder_ValList([sas_coder_ValList($d)])//sas compatible!
			];
		if($with_pk)
			$arr['pk'] = $pk;
		if($counter == -1)
			$arr['def_vals'] = '-';
	} else {
		if($counter === FALSE) return $where_vals;
		//make insert ptototype
		$arr = [ 'table' => $table->___name,
				'key_vals' => 
						sas_coder_ValList([sas_coder_ValList([])]),
				'def_vals' =>
						sas_coder_Map($where_vals)
			];
	}
	return file_URI(_ENV_CRUD_URI, $arr);
}

function make_counting_command($stmt) {
	$cmd = $stmt->cmd;
	if(!$cmd) return ''; //no command
	$params['cmd'] = $cmd->doToString((string)$cmd->parsed);
	$params['args'] = $stmt->args;
	return file_URI(_ENV_COUNTER_URI, $params);
}

function wrap_notnull($res, $shell) {
	return $res !== '' && $res !== [] && $res !== FALSE && $res !== null? 
		str_replace('$$', $res, $shell)
		: '';
	;
}
function unescaped_output($res) {
	echo $res;
	return $res;
}
function output_html($res) {
	echo htmlspecialchars($res);
	return $res;
}
function output_js($res) {
	echo json_encode($res, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
	return $res;
}

function default_templated_editor($t) {
static $a = [
	'' => NULL
	, 'V' => '$value'
	, 'SPAN' => '<span $attrs $disabled>$value</span>'
	, 'A' => '<a tag=A fctl name="$name" rid="$rid" $attrs $disabled>$value</a>'
	, 'NAMED_SPAN' => '<span name="$name" $attrs $disabled>$value</span>'
	, 'TAG' => '<$name $attrs $disabled>$value</$name>'
	, 'TAGV' => '<$name $attrs $disabled value="$value" />'

	, 'VARCHAR' => '<dfn tag fctl name="$name" $attrs $disabled>$value</dfn>'
	, 'LONGVARCHAR' => '<dfn tag=TEXTAREA vtype=S fctl name="$name" $attrs $disabled content-resizable=F>$value</dfn>'
	, 'DECIMAL' => '<dfn tag vtype=N fctl name="$name" $attrs $disabled>$value</dfn>'
	, 'INTEGER' => '<dfn tag vtype=I fctl name="$name" $attrs $disabled>$value</dfn>'
	, 'DATE' => '<dfn tag vtype=D fctl name="$name" $attrs $disabled>$value</dfn>'
	, 'BOOL' => '<dfn tag vtype=2 mkii fctl name="$name" $attrs $disabled>$value</dfn>'
	, 'BOOL3' => '<dfn tag vtype=3 fctl name="$name" $attrs $disabled>$value</dfn>'
	, 'CLOB' => '<pre tag fctl name="$name" $attrs $disabled content-resizable >$value</pre>'
	, 'HIDDEN' => '<input type=hidden name="$name" fctl $attrs $disabled value="$value">'
	, 'DL' => '<a tag=A fctl name="$name" rid="$rid" $attrs>$value</a><dl mctl ref-src="$rel_target" $attrs2 $disabled></dl>'
	, 'SELECT' => '<dfn tag=select fctl name="$name" rid="$rid" $attrs>$value</dfn><menu mctl $attrs2 $disabled>$menu</menu>'
	, 'SELECT-' => '<dfn tag=select fctl name="$name" rid="$rid" $attrs>$value</dfn>'
	, 'MENU' => '<dfn tag=A fctl name="$name" rid="$rid" $attrs>$value</dfn><menu mctl $attrs2 $disabled>$menu</menu>'
	, 'MENU-' => '<dfn tag=A fctl name="$name" rid="$rid" $attrs>$value</dfn>'
	, 'DL+' => '<button type=button tag add fctl $attrs onclick="setWithMenu(this)" $attrs></button><dl mctl ref-src="$rel_target" $attrs2 $disabled></dl>'
	, 'MENU+' => '<button type=button tag add fctl $attrs onclick="setWithMenu(this)" $attrs></button><menu mctl $attrs2 $disabled>$menu</menu>'
	, 'SUBTABLE' =>
					'<button subtable-show type=button onclick="this.setDN(toggle)" display_next $attrs></button>
					<div subtable $attrs2 $disabled
						ref-src="{{once}}file_URI:_ENV_TABLER_URI?table=$size&link=$precision&cmd=*WHERE $precision = %3F&args[]={{findRid(this)}}"
					></div>
				'
	, 'FILE' =>
		'<span lobload=filer accept="" filetypes="*" $disabled>
			<a href="file_URI:_ENV_FILER_URI?fld=$name&table=$table_name&key=$value" target="_blank"
				onclick="this.href = this.href.setURLParam(\'key[]\', findRid(this))"
			></a>
		</span>'
	, 'FILE_IMAGE' =>
		'<span lobload=filer accept="image/*" filetypes="*" $disabled>
			<img src="file_URI:_ENV_FILER_URI?fld=$name&table=$table_name&key[]=$value"
				href="file_URI:_ENV_FILER_URI)?fld=$name&table=$table_name&key[]=$value"
				onrefresh="var e = this; e.setA(\'src\', 
						e.A(\'src\').setURLParam(\'key\\\\[\\\\]\', findRid(e)))"
			>
		</span>'
	, 'FILE_PDF' =>
		'<span lobload=filer accept="application/pdf" filetypes="pdf" $disabled>
			<a href="file_URI:_ENV_FILER_URI?fld=$name&table=$table_name&key=$value" target="_blank"
				onclick="this.href = this.href.setURLParam(\'key[]\', findRid(this))"
			></a>
		</span>'
	, 'FILES' => '<div filelist $disabled dynamic="\'file_URI:_ENV_FILER_URI?fld=$name&table=$table_name&key[]=$value&list=1\'.setURLParam(\'args[]\',findRid(this))"></div>'
];
	return preg_replace_callback('/file_URI:([a-zA-Z0-9_])/',
		function($m) { return file_URI(constant($m[1])); }
		, $a[$t]);
}

/*
	menu:
	1) translate internal -> external with array on show and set VALUE
	2) user rid when save to db on edit
	
	bool:
	2/3/3M -> works like menu (translate 0/1 -> yes/no on show 
		and translate back on save)
	two/three/threeM - do not translate at all
	
	also, we can use custom texts (from model!)
	
	2/3 is a model decision(!) (as a datatype!)
	2 vs two, 3 vs 3M vs three vs threeM is a design decision
	
	so, in the model we
	1) specify datatype 
		DECIMAL(1) VALUES:BOOL2 (NULL/1)
		DECIMAL(1) VALUES:BOOL3 (NULL/0/1)
		DECIMAL(N) VALUES:varname (use model_db()->varname as array key/value pairs)
	2) also, we use checkbox exactly for BOOL2
	3) also, we can set "expanded from" for BOOL3 (by default) or any other translators
		if so, we inline menu and show it (like 'three')
	so we do not use two, 3, 3M, three, threeM vtypes
	instead we use a+menu AND interpret "menu_expanded" attribute
*/

class templated_editors_helper implements ArrayAccess {
	var $a = null;
	function __construct($a) { $this->a = $a; }
	
    public function offsetGet($offset) {
    	//var_dump($offset);
	    extract($this->a);
	    return eval('return '.$offset.';');
    }
    public function offsetSet($offset, $value) {}
    public function offsetUnset($offset) {}
    public function offsetExists($offset) { return true; }
}

function choose_from($v, $target) {
	$v->rel_target = $target;
	return $v;
}

function choose_url($v, $url, $args = []) {
	$v->choose_url = file_URI($url, $args);
	return $v;
}

function with_rid($v, $rid) {
	$v->key = $rid;
	return $v;
}
function with_self_rid($v) {
	$v->key = (string)$v;
	return $v;
}

function name_of_field_in_nv($value)
{
	if($value instanceof namedString)
		return @explode('__',$value->name,3)[1]; //FIXME: dirty, we need a field object here, not a string
	return '';
}
function name_of_relfield_in_nv($value)
{
	if($value instanceof namedString)
		return explode('__',$value->name,3)[2]; //FIXME: dirty, we need a field object here, not a string
	return '';
}
function get_filter_control($f)
{
	$descr = [];
	$ct = $f->getControlType();
	$descr['mc'] = $ct;
	if($ct=='DL' && @$f->target) {
		$descr['rel_target'] = file_URI(_ENV_CHOOSER_URI, 
				[ 'table' => $f->target->___name 
				  , 'add_empty' => ''
				]);
		$descr['rel_target'] = '\''.str_replace(['\\', '\''], ['\\\\', '\\\''], $descr['rel_target']).'\'';
		$descr['refresher'] = file_URI(_ENV_TABLEID_URI, 
				[ 'table' => $f->target->___name ]);
		$descr['refresher'] = '\''.str_replace(['\\', '\''], ['\\\\', '\\\''], $descr['refresher']).'\'';	
	} else
	if($ct=='MENU' && @$f->values) {
		$descr['rel_target'] = file_URI(_ENV_MODELDATA_URI, 
			[ 'table' => $f->values 
			  , 'add_empty' => ''
			]);
		$descr['rel_target'] = '\''.str_replace(['\\', '\''], ['\\\\', '\\\''], $descr['rel_target']).'\'';
		$descr['ref'] = 'Y';
		if(@$f->target) {
			$descr['refresher'] = file_URI(_ENV_TABLEID_URI, 
				[ 'table' => $f->target->___name ]);
			$descr['refresher'] = '\''.str_replace(['\\', '\''], ['\\\\', '\\\''], $descr['refresher']).'\'';
		}
	}
	return $descr;

}

/* DYNAMIC VALUES
[[... ~{dynvals}~...]

dyvals ::=  dynval ';' {dynvals}

dynval ::=
	'=' expr  //calculate expr, setV/return result
	name '=' expr //calculate expr, assing result to name
	':' name '=' expr //calculate expr, sum it to name
	name-1 ':' name-2 '=' expr //calculate expr, assing result to name-1, sum it to name-2
	'^' name-1 [ ':' name-2 ] //create zone name-1 in zone name-2 (or in root zone)
	'^' ':' name //return context to zone name (which is a current zone parent )
	
expr ::= 
	restricted php/js expr
	with
		'[' name ']'  // get name value
		'[:]' - get current control value
		'[:N]' '[:D]'  - get current control typed value
		
		= [a] + [b]
		= [:] + [a] + 1
		= [:N] + 1
*/

class dynVals { // === zone
	var $index = [];
	var $parent = null;
	var $name = '';
	var $lastZone = null;
	
	static $sharedArea = null;
	
	static function allocate(&$dv) {
		if(dynVals::$sharedArea) {
			//var_dump(dynVals::$sharedArea);
			$dv = dynVals::$sharedArea->lastZone;
			dynVals::$sharedArea = false;
			//var_dump('S', $dv, dynVals::$sharedArea);
		} else {
			$dv = new dynVals;
			$dv->lastZone =& $dv;
			//var_dump('N', $dv, dynVals::$sharedArea);
		}
		//var_dump('X', $dv);
	}
	function share() { dynVals::$sharedArea = $this; }
	
	function __get($name) {
			if($name === $this->name) return $this;
 			if( isset($this->index[$name]) ) return $this->index[$name];
			return  $this->parent ? $this->parent->{$name} : null;
	}
	function __construct($name = '^', $parent = null) {
		$this->name = $name;
		$this->parent = $parent;
		if($parent) $this->lastZone =& $parent->lastZone; 
	}
	
	function defZone($name, $parent) {
		$zone = $this->{ "^$parent" };
		if($name === '^') return $zone;
		$z = new dynVals($name, $zone);
		return $z;
	}

	function defVal($src, $name, $agg, $code) {
		if ( $name && $name[0] === '^' )
			return  $this->lastZone = $this->defZone($name, $agg);
		
		if($this->{$name}) {
			$v = $this->{$name};
			return $v->source;
		}
		
		$v = new stdClass;
			$v->value = null;
			$v->aggregateTo = $agg ? $this->{$agg} : NULL;
			$v->source = $src;
		
		if($name && $name[0] !== '@') $this->index[$name] = $v;
		
		$v->initValue =  $val = $code ? $code( $this, (string)$src ) : NULL;
		$this->setVal($v, $val);
		return $val;
	}

	function setVal($v, $value) {
			$v->value = $value;

			if( $v->aggregateTo && 	!isset($v->aggregateTo->initValue) ) 
				$this->setVal(
				   $v->aggregateTo, 
					($v->aggregateTo->value ?:  0) + ($value ?: 0)
				);
	}
		
	function def($src, $arr, $def) {
		$ret = $src;
		$check = null; 
		foreach($arr  as $a) {
			$v = $this->defVal($src, $a[0], $a[1], $a[2]);
			if( !$a[0]  ||  !$a[2]  && $v  )
				$ret = $v;
			switch($a[0])
			{ case '@check': $check = $v; break;
			  case '@min':  $check = (string)$ret >= $v; break;
			  case '@max': 	$check = (string)$ret <= $v; break;
			}
		}
		if(!($ret instanceof namedString))
			$ret = new namedString('', $ret, null);
		$ret->run['dyn'][] = $def;

		if( isset($check) )
			Vcheck($ret, $check);
		return $ret;
	}
	
}

function dyn_regexp($v) { return stripcslashes($v); }

class ValueContext {
	static $stack = [];
	var $check_card = null; // set this when you want template output with errors shown
	var $hasError = FALSE;
	function pushStack() { self::$stack[] = $this; return new ValueContext; }
	function popStack() { return array_pop(self::$stack); }
}
$valueContext = new ValueContext;



function getValueType($value, $vtype) {
	global $Tables;
	if($vtype) return $vtype;
	$name = name_of_field_in_nv($value);
	if($name && $value instanceof namedString) {
		$table = $Tables->{$value->container->getName()};
		$table_name = $table->___name;
		$f = $table->fields[$name];
		return $f->type;
	}
}


function Vre($value, $re) {
	$value->run['re'] = $re; 
	return $value;
}
function Vrequired($value) {
	if($value instanceof namedString)
		$value->run['required'] = TRUE;
	return $value;
}
function Vdummy($value, $dummy) {
	$value->run['dummy'] = $dummy;
	return $value;
}
function VdummyKey($value, $dummy) {
	$value->run['dummy-key'] = $dummy;
	return $value;
}
function Vunique($value) {
	$value->run['unique'] = TRUE;
	return $value;
}
function Vreadonly($value, $sample = null) {
	$value->run['readonly'] = $sample;
	return $value;
}
function Vmin($value, $sample) {
	$value->run['min'] = (string)$sample;
	return $value;
}
function Vmax($value, $sample) {
	$value->run['max'] = (string)$sample;
	return $value;
}
function ru_word($value, $sample) {
	$value->run['ru_word'] = $sample;
	return $value;
}
function Vcheck($value, $expr) {
	$value->run['check'] = isset($value->run['check']) ? 
						$value->run['check'] && $expr
						: $expr;
	return $value;
}
function Attr($value, $name, $expr) {
	if($value instanceof namedString) {
		$value->attrs[] = "$name=\"".htmlspecialchars($expr)."\"";
		return $value;
	} else {
		return Attr(new namedString('', $value, null), $name, $expr );
	}
}

function Verror($status) {
	global $valueContext;
	if(@$valueContext->check_card && $status)
		return $valueContext->hasError = TRUE;
	return false;
}

function Vdump($v) {
	var_dump($v);
	return $v;
}


function output_editor2($value, $vtype, $attrs, $attrs2 = '', $read_only = false, $value_only = false)
{
	global $Tables;
	global $_ENV_UI_THEME;
	global $valueContext;

	$name = name_of_field_in_nv($value);
	$size = '';
	$precision = '';
	$rel_target = '';
	$menu = '';
	$table_name = '';
	$rid = '';
	if($_ENV_UI_THEME) {
		$attrs .= ' theme="'.$_ENV_UI_THEME.'"';
	}
	if($name && $value instanceof namedString) {
		
		$table = $Tables->{$value->container->getName()};
		$table_name = $table->___name;
		$f = $table->fields[$name];

		if(@$value->part) {
			$name = "$name({$value->part})";
		}


		//we can specify control type explicitly
		if(!$vtype) {
			//if not, we take control from model
			if(!is_object($f)) {
				var_dump($f, $name, $value, $table);
				die('!!!!');
			}
			$vtype = $f->getControlType();
		}

		$read_only = $f->readonly || $read_only;		
			
		if(@$value->rel_target || @$value->choose_url || $f->target) {
			if(@$value->choose_url) {
				$rel_target = $value->choose_url;
			} else {
				$field_by_rel = name_of_relfield_in_nv($value);
				$rel_target = file_URI(_ENV_CHOOSER_URI, 
					[ 'table' => 
							@$value->rel_target ?: $f->target->___name 
					  , 'add_empty' => (@$value->run && $value->run['required'] || $f->required) ? '' : 'Y'
					  , 'id' => $field_by_rel
					]);
			}
			$rel_target = htmlspecialchars($rel_target);
		}

		$rid = $value->key;
		
		if(!@$value->tr && @$f->values) {
			global $ModelDB;
			
			$rid = $value->value; //use untraslated value as rid

			$value->value = $value->value === NULL ? 
					(@$ModelDB[$f->values]['.'] ?: '') :
					(@$ModelDB[$f->values][(string)$value?:0] ?: '')
			;
	
			$menu_src = file_URI(_ENV_MODELDATA_URI, 
				[ 'table' => $f->values 
				  , 'add_empty' => (@$value->run && @$value->run['required'] || $f->required) 
				  							? '' : 'Y'
				]);
			$attrs2 .= ' ref-src="' . htmlspecialchars($menu_src) . '" ';
		}

		if(@$value->tr) { // translated value --> use tr array as choose items
			$data = [];
			if(!(@$value->run && @$value->run['required'] || $f->required))
				$data[] = "<li value-patch=''>?</li>";
			foreach($value->tr as $k=>$v) 
			{ $data[] = "<li value-patch='".htmlspecialchars($k). "'"
					.( @$value->run && @$value->run['dummy'] === $v
						||
						@$value->run && @$value->run['dummy-key'] === $k
					? ' disabled' :''
					) .">".
				 htmlspecialchars($v). "</li>"; }
			$menu = implode("\n", $data);
		}
		
		$attrs .= $f->getControlProps();
		$size = $f->size;
		$precision = $f->precision;	
	}
	
	if(@$value->run) {
		foreach($value->run as $op=>$p) {
			switch($op) {
			case 'min':
			case 'max':
				$value->attrs[] = ($op=='min'?'vmin':'vmax')."=\"'$p'\""; break;
			case 'required':
				$value->attrs[] = $op; break;
			case 're':
				$value->attrs[] = "re=\"$p\"";break;
			case 'unique':
				$value->attrs[] = "check_unique";break;
			case 'readonly':
				$value->attrs[] = $p ? "readonly" : ''; break;
			case 'ru_word':
				$value->attrs[] = 'suffix="'.ru_number_take_word((int)(string)$value, $p).'"';
				$value->attrs[] = "ru_word='".json_encode( $p , JSON_UNESCAPED_UNICODE )."'";
				break;
			case 'dyn': $value->attrs[] = 'dyn-val="'
				. implode(';', array_map('htmlspecialchars', $p) ) . '"'; break;
			}
		}
		if(@$valueContext->check_card 
			&& $value->real()
		) {
			foreach($value->run as $op=>$p) {
				$vv = (string)$value;
				if( $op == 'required' && $vv == '' 
					|| $op == 'check' && !$p 
					|| $op == 're' && !preg_match($p, $vv)
					|| $op == 'dummy' && $vv === $p
					|| $op == 'dummy-key' && @$value->key === $p
					) {
					$value->errors[] = $op;
					$valueContext->hasError = TRUE;
					if($op == 'check') $attrs .= ' error-vcheck ';
				} else {
					switch(getValueType($value, $vtype)) {
					case 'DATE':
						$vv = date_parse($vv);
						if($vv['error_count']) {
							$value->errors[] = 're';
							$valueContext->hasError = TRUE;
						} else {
							$vv = "$vv[year]-$vv[month]-$vv[day]";
							$ss = $p;
						}
						break;
					case 'DECIMAL': $vv = (float) $vv; $ss = $p; break;
					case 'INTEGER': $vv = (int) $vv; $ss = $p; break;
					default: $ss = $p;
					}
					if(	$op == 'min' && $vv < $ss || $op == 'max' && $vv > $ss ) {
						$value->errors[] = $op;
						$valueContext->hasError = TRUE;
					}
				}
			}
		}
	}

	if(@$value->errors) {
		$attrs .= ' error="Y" error-type="'.implode(' ', $value->errors).'"';
	}

	if(@$value->attrs) {
		$attrs .= ' '.implode(' ', $value->attrs);
	}

	if(!$name) {//field doesn't exist
		$value_only = true;
	}
	
	$value = htmlspecialchars( $value );
	$rid = htmlspecialchars( $rid );

	$disabled = $read_only ? 'disabled' : '';

	switch($vtype) {
		case 'DECIMAL':
		case 'INTEGER':
			$value = trimZ($value);
			break;
		case 'DATE':
			$value = ru_date(substr($value,0,16));
			break;
		default:
	}

	$template = $value_only ? (
			$vtype === 'CLOB' ? '<pre value-only $attrs>$value</pre>'
			: '<span value-only $attrs>$value</span>' )
		: default_templated_editor($vtype);
	
	/*
	$EXPR = new templated_editors_helper(
		compact('value', 'name', 'rel_target', 'attrs', 'attrs2', 'size', 'precision', 'table_name')
	);*/	

	eval("echo \"".str_replace(['\\', '"'],['\\\\', '\\"'], $template)."\";");
}

class AttrsDBhelper {
	function __get($name) {
		if($name[0] == '=') {
			$name = substr($name,1);
			return $this->vals->{$this->name_translator[$name]};
		}
		if($name[0] == '#') {
			$name = substr($name,1);
			return $this->vals->{$name};
		}
	}
	function __call($name, $args) {
		if(count($args) && $args[0]===null) {
			array_shift($args);
			return isset($args[0])?
				$this->vals->{$this->name_translator[$name]."($args[0])"}
			:
				$this->vals->{$this->name_translator[$name]};
		} else
		if(isset($args[0]))
			output_html($this->vals->{$this->name_translator[$name]."($args[0])"});
		else
			output_html($this->vals->{$this->name_translator[$name]});
	}
}

function to_attr_struct($val, $name, $cmd, &$db, $afield = NULL
	, $name_translator = null, $add_translator_to_def = '') {
	if($name===NULL) {
		$db = new AttrsDBhelper;
		$db->attr_fileld = $afield;
		$db->ins_cmd = $cmd;
		$db->vals = new stdClass;
		$db->cmds = new stdClass;
		$db->name_translator = $name_translator ? $GLOBALS[$name_translator] : null;
		$db->add_translator_to_def = $add_translator_to_def;
		return;
	}
	if($cmd === NULL) {
		foreach($db as $k=>$v)
			if(startsWith($k, $name))
			{
				unset($db->vals->$k);
				unset($db->cmds->$k);
			}
		return;
	}
	$db->vals->$name = $val;
	$db->cmds->$name = $cmd;
}

function output_attr_ctrl($name, $vfield, $tag, $attrs, $db) {
	$pname = $name;
	if($db->name_translator) 
		$name = $db->name_translator[$name];
	$rcmd = @$db->cmds->$name ? 
		$db->cmds->$name 
		: $db->ins_cmd;
	$add_to_def = '';
	if($db->add_translator_to_def)
		$add_to_def = "def-$db->add_translator_to_def='$pname'";
	echo "<$tag $attrs name=$vfield def-$db->attr_fileld='$name' $add_to_def cmd='$rcmd'>";
	output_html(@$db->vals->$name);
	echo "</$tag>";
}



function xlsx_file_output_old_variant($file_name, $templ) {
	
	$zip = new ZipArchive;
	$zip->open(__DIR__.'/sample.xlsx') or die("can't open sample file");

	if (($index = $zip->locateName('xl/worksheets/sheet1.xml')) === false) die('sample content not found');
	$data = $zip->getFromIndex($index);
	
	$zip->close();

	$data = simplexml_load_string($data);
	//file_put_contents('/o1.txt', $templ);

	$out = $data->sheetData;

	$rn = 0;
	$c = 0;
	$crefs = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	
	$vals = simplexml_load_string(preg_replace('/[\x01-\x1f]/', ' ', $templ));
	
	foreach($vals as $r) {
		$c = 0;
		$elem = $out->addChild('row');
		$elem['r'] = ++$rn;
		foreach($r as $k=>$v) {
		  $e = $elem->addChild('c');
		  $e['r'] = $crefs[++$c] . $rn;
		  if(preg_match('/^\d+(\.\d*)?$/',$v)) {
			  $e['t'] = 'n';
			  $e->v = $v;
		  } else {
			  $e['t'] = 'inlineStr';
			  $e->is = '';
			  $e->is->t = preg_replace('/\s+/u',' ',$v);
		  }
		}
	}
	  
	$file = tempnam("tmp", "xlsx");
	copy(__DIR__.'/sample.xlsx', $file);
	$zip = new ZipArchive;
	$zip->open($file);

	$zip->addFromString('xl/worksheets/sheet1.xml', $data->saveXML());
	$zip->close();

	header('Content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	header('Content-Disposition: attachment; filename="'.$file_name.'.xlsx"');
	//echo $data->saveXML();
	//$fp = fopen('php://output', 'w+');
	//copy($file, "php://output");
	readfile($file);
	
	unlink($file);
}
function xlsx_file_output($file_name, $templ) {
	require_once(__DIR__.'/htmltoexcl.php');
	htmlToExcel($templ,$file_name.'.xlsx',__DIR__.'/sample.xlsx');
}

function csv_file_output($file_name, $templ) {
	header('Content-type: text/');
	header('Content-Disposition: attachment; filename="'.$file_name.'.csv"');
	$outstream = fopen("php://output",'w');
	
	$vals = simplexml_load_string($templ);
	
	foreach($vals as $r) {
	    $v = [];
	    foreach($r as $e) $v[] = $e;
	    fputcsv($outstream, $v, ';');
	}
}

function qe_control_model() {
	global $Tables;
	$tbls = [];
	foreach($Tables as $name=>$table) {		
		$fields = [
			'$' => [
				'name' => $name,
				'c' => $table->___caption,
				'rc' => $table->___recaption,
				'pk' => $table->PK(true),
				'g' => $table->AUTO_GROUP()
			]
		];
		if(@$table->table_props["DICT"]) $fields['$']['dict'] = true;		
		foreach($table->fields as $fld_name=>$props) {
			if($props->type=='SUBTABLE') 
				continue;
			$properties = [
				'$' => [ 'name' => $fld_name ],
				'c' => $props->caption ?: $fld_name,
				'rc' => $props->recaption,
				'si' => $props->si_caption,
				'h' => (bool)$props->hidden,
				't' => $props->type
			];
			if($props->target) $properties['target'] = $props->target->___name;
			$properties['ctrl'] = get_filter_control($props);
			$fields[$fld_name] = $properties;
		}		
		$tbls[$name]=$fields;
	}	
	return json_encode($tbls,JSON_PRETTY_PRINT);
}

function make_request($url, $srv = 'http://localhost') {
	if(isset($_SERVER['HTTP_COOKIE']))
		$opts = stream_context_create(array('http' =>
			array(
				'header'  => 'Cookie: '.$_SERVER['HTTP_COOKIE'],
			)
		));
	else 
		$opts = stream_context_create();
	return file_get_contents($srv.$url, false, $opts);
}


if(__FILE__ != TOPLEVEL_FILE) return;

echo 'loaded';
