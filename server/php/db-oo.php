<?php

require_once(__DIR__.'/db-oo-transformer.php');
require_once(__DIR__.'/modeldata.php');

class namedString {
var $name = '';
var $value = '';
var $container = null;
var $key = null; // not translated (if !=null => value before translation)
var $tr = null; // translation array
function __toString() { return (string)$this->value; }
function __construct($n, $v, $c) {
	$this->name = $n;
	$this->value = $v;
	$this->container = $c;
}
}

class axCommandInfo {
	var $cmd = null;
	var $args = null;
	function __construct($cmd, $args) { $this->cmd = $cmd; $this->args = $args; }
}

class axROW {
  private $cmd = null;
  private $subselects = [];
  private $info = null;
  function getName() { return $this->cmd->table; }
  function addInfo($info) { $this->info = $info; return $this; }
  function exInfo() { return $this->info; }
  
  function __construct($cmd, $subselect_stmts) { $this->cmd = $cmd;
    foreach($cmd->subselects as $p=>$s) {
      $args = [];
      foreach($s->args as $i=>$a) {
        $args[] = $this->$a;
        if($i) unset($this->$a); //remove all links but first
      }
      try {
		$subselect_stmts[$p]->execute($args);
	} catch(Exception $e) {
		throw new Exception($e->getMessage() . "\n" . $subselect_stmts[$p]->queryString);
	}
      $n = $s->args[0];
      $this->$n = $subselect_stmts[$p]->fetchAll(); //replace first with fetched recordset
        //TODO: maybe, we can fetch later (by condition: AS ARRAY / AS TABLE (AS ROWS, AS SELECT) !)
        // or instantly join to string: AS JOIN WITH ', ' a
	
	$this->subselects[$p] = new axCommandInfo($s, $args);
    }
  }
  function subselect_info($name) { return $this->subselects[$name]; }
  function ns($name) { return new namedString($name, $this->$name, $this); }
}

function has_subitems($e) {
  return is_array($e) || $e instanceof SimpleXMLElement && $e->children();
}

function get_subitems($e) {
  return is_array($e) ? $e : 
        $e instanceof SimpleXMLElement ? $e->children() 
        : null;
}


function __recPrepare($dbh, $cmd) {
  $cmd2 = preg_match('/^\s*\(\s*SELECT\s(.*)\)\s*$/s', $cmd, $m) ?
	"SELECT $m[1]" : $cmd;
  $stmt = $dbh->prepare($cmd2);
  $substmts = [];
  foreach($cmd->subselects as $i=>$subselect)
      $substmts[$i] = __recPrepare($dbh, $subselect);
  $stmt->setFetchMode(PDO::FETCH_CLASS, 'axRow',
    			[$cmd, $substmts]); //we should set direct childs here
  return $stmt;
}

$SQL_EMULATION = FALSE;

function Select($cmd, $args = null) {
  if(!preg_match('/^\s*(SELECT|ESCAPE)\s/i',$cmd)) $cmd = 'SELECT '.$cmd;
  $cmd = get_cached_cmd_object($cmd);
  //echo '<pre>';
  //var_dump($cmd);
  $stmt = __recPrepare(get_connection($cmd->root()), $cmd);
  if($args !== null) 
    try {
	global $SQL_EMULATION;
	if($SQL_EMULATION) {
		echo $stmt->queryString;
		print_r ($args);
	} else {
		$stmt->exInfo = new axCommandInfo($cmd, $args);
		$stmt->execute($args);
	}
    } catch(Exception $e) {
	debug_print_backtrace();
	throw new Exception($e->getMessage() . "\n" . $stmt->queryString."\n-\n".implode("\n", $args ?: []));
    }
  return $stmt;
}

function get_cached_cmd_object_int($key, $cmd) { 
  global $CURRENT_USER, $DELETE_CACHE_ENTRY;
  return array( 'user' => $CURRENT_USER, 
       'cmd' => serialize(new _Cmd($cmd)) );
}

/*
	command cache assumption;
	1) we try to cache command for all
	2) if cached for all command is different from new one generated for onother user
		we switched to cache for users
	3) we use roles for make a main key
		so role selection bypass this tecnicue
		and we recache for user 
*/

function get_cached_cmd_object($cmd) {
  global $CURRENT_ROLES, $CURRENT_USER;
 
  $ckey = "$cmd ROLSES $CURRENT_ROLES";

  $ctext = '';

  $cc = cached('sql-commands-for-all', $ckey);
  if($cc && 
     ($cc['user'] == $CURRENT_USER || $cc['user'] == '$ALL'))
    $ctext = $cc['cmd']; //entry exists for all users or only one user was rememberd
  else {
    if(!$cc) { // no command => make new cache entry for all users
      $ctext = cached('sql-commands-for-all', $ckey, 
                'get_cached_cmd_object_int', null, $cmd)['cmd'];
    } else {
      // current user is differnt from stored in cache for all users
      $ctext = cached('sql-commands-for-user', "$ckey USER $CURRENT_USER", 
                'get_cached_cmd_object_int', null, $cmd)['cmd'];
      if($ctext == $cc['cmd']) {
        //commands are the same for two different users
        // so, mark it as 'for all'
        cached('sql-commands-for-all', $ckey, SET_CACHE_ENTRY([ 'user' =>'$ALL', 'cmd' => $ctext ]));
      } else {
        if($cc['user'] !== '') {
          // command preliminary cached 'for all' => clear it
          cached('sql-commands-for-all', $ckey, SET_CACHE_ENTRY([ 'user' =>'', 'cmd' => '' ]));
          //and store in user cache too
          cached('sql-commands-for-user', "$ckey USER {$cc['user']}", SET_CACHE_ENTRY($cc));
        }
      }
    }
  }
  
  return unserialize($ctext);
}

function prepare_db_args($args) { return array_map(function($a) { return $a === ''? NULL : $a; }, $args); }

function prepare_or_exec_command($cmd, $args) {
  $cmd = get_cached_cmd_object($cmd);
  $dbh = get_connection($cmd->root());
  $stmt = $dbh->prepare($cmd);
  global $Tables, $GLOBAL_STATE_VARS;
  if($cmd->root() && $Tables->{$cmd->root()})
	if($var = $Tables->{$cmd->root()}->TRIGGER_VAR()) {
		setDbSessionVar($var, "SELECT '" . $GLOBAL_STATE_VARS[$var] . "' AS val", [], $cmd->root());
	}
  if($args !== null) {
	$args = prepare_db_args($args);
	global $SQL_EMULATION;
	if($SQL_EMULATION) {
		echo $stmt->queryString;
		var_dump ($args);
	} else
		try {
			$stmt->execute($args);
		} catch(Exception $e) {
			debug_print_backtrace();
			throw new Exception($e->getMessage() . "\n" . $stmt->queryString."\n-\n".implode("\n", $args ?: []));
		}
  }
  return $stmt;
}

/*
$dbc

//pgsql
$stmt = $dbc->prepare("insert into test(v) values(?) returning k");
$stmt->execute([1]);
$pv = $stmt->fetchColumn();
	//or
	$dbc->lastInsertId("{$table}_{$pk}_seq");

//mssql
$stmt = $dbc->prepare("insert into test(v) output inserted.k values(?)");
$stmt->execute([1]);
$pv = $stmt->fetchColumn();
	//or!
	$pv = $dbc->lastInsertId();

//oracle
$stmt = $dbc->prepare("insert into test(v) values(?) returning k into ?");
$stmt->execute([1]);
//????

//mysql
$stmt = $dbc->prepare("insert into test(v) values(?)");
$stmt->execute([1]);
$pv = $dbc->lastInsertId();


*/
function execute_and_get_generated_id($stmt, $a) {
	global $RE_ID;
	$a = prepare_db_args($a);
	$stmt->execute($a);
	if(preg_match('#^/*lastInsertedId_[a-zA-Z0-9]+:($RE_ID)#', $stmt->queryString, $m)) {
		$f = $m[0];
		return $f($m[1]);
	}
	return $stmt->columnCount() ? $stmt->fetchColumn() : NULL;
}

function Insert($cmd, $args = null, &$gen = null) {
  if(!preg_match('/^\s*INSERT\s+INTO\s/i',$cmd)) $cmd = 'INSERT INTO '.$cmd;
  if($args !== null) {
    $cmd .= '( '.strlist(array_keys($args)).' ) '
	 . ' VALUES ('.strlist(array_fill(0, count($args), '?')).')';
    $args = array_values($args);
  }
  $stmt = prepare_or_exec_command($cmd, func_num_args() < 3 ? $args : NULL);
  if(func_num_args() >= 3) 
	  $gen = execute_and_get_generated_id($stmt, $args);
  return $stmt;
}

function Update($cmd, $key = null, $args = null) {
  if(!preg_match('/^\s*UPDATE\s/i',$cmd)) $cmd = 'UPDATE '.$cmd;
  if($key !== null) { //we have arguments: we add SET and push keys at the end of paramaters
    if($args) { // if we have args, we make SET cause
      $c = explode(' WHERE ', $cmd, 2);
      $cmd = $c[0].' SET '.
        strlist(function($k) { return "$k = ?"; }, array_keys($args))
        .(@$c[1]? " WHERE $c[1]":'');
    }
    $args = array_merge(array_values((array)$args), (array)$key);
  }
  return prepare_or_exec_command($cmd, $args);
}
function Delete($cmd, $key = null) {
  if(!preg_match('/^\s*DELETE\s+FROM\s/i',$cmd)) $cmd = 'DELETE FROM '.$cmd;
  return prepare_or_exec_command($cmd, $key);
}

function DoTransaction($f, $table='') {
	static $level = 0;
	$c = get_connection($table);
	$ret = null;
	if($level++ || $c->beginTransaction()) {
		try {
			$ret = $f();
		} catch(Exception $e) {
			if(!--$level)
				$c->rollBack();
			throw $e;
		}
		if(!--$level)
			$c->commit();
	} else $level = 0;
	return $ret;
}


///CID

function GetCIDBase($dbh) {
  global $seqcmd;
  $stmt = $seqcmd[$dbh->dialect];
  return $dbh->query($stmt)->fetchColumn();
}

function GenCID($table, $cid = null) { //if null = gen new
  static $dbh = null;
  if($dbh == null) $dbh = get_connection($table);
  static $base = null;
  if($base == null) $base = GetCIDBase($dbh);
  static $cur = 0;
  if(!$cid)
    $cid = $cur++;
  //return "$base.$cid";
  //0 reserverd for server side
  //1-5 as is
  //6-8 1,2,3 digit cid
  //9- size+cid
  if($cid == 0) return "$base";
  if($cid <= 5) return "$base.$cid";
  if($cid <= 9) return "$base.6$cid";
  if($cid <= 99) return "$base.7$cid";
  if($cid <= 999) return "$base.8$cid";
  return $base.'.9'.strlen($cid).$cid;
}
function GenStringCID($table, $size,$cid = null) { //if null = gen new
  return str_pad(
    str_replace('.','-',GenCID($table, $cid)).'_'
    , $size, '0', STR_PAD_LEFT);
}


function SaveCollection($items) {
	/* by desing, should save sequence to db
		like xml-dataloader does
		but it can't generalize xml-dataloader nor make them simple
		due to:
		1) xml-dataloder deals with many tables at once and it's useful
			so, we should reorder file
			we can do it with xslt or xpath
			but if we use xslt, we need special pass
			and if we use xpath, it bind us to use xml only
			so, it's much siple do directly code in xml-dataloader,
			using plain insert/update
		2) we better know key fields in input sequence than in a model 
			and often we should not use PK, but other keys
		3) we can't do relation key calculation in manner like xml-dataloder do
			(using subselect)
		maybe, for 3, it generally useful
		to code it in a general model?
		we know target and when we make
			insert into t(f, rel.g) values(Vf, Vg)
		we can translate it as
			insert into t(f, rel) values( Vf,
				(select pk from T2 where g = Vg) )
		this translation can be done universally
		based on know left side of assigment (i.e. rel.g)
		we may think, that an actual value can be used as key filter
		this VERY useful! espcecially for unnatural(genrated) keys which is almat always has one field
		in case of natural keys, we know values and can use them as is
	*/
}


/*
  Select('a, b, c from t where id = ?')->execute([1])->fetch()/fetchAll();
  Select('a, b, c from t where id = ?', [x])
  Select('a, b, c from t where id = ?', [x])->fetch()/fetchAll()/fetchColumn()/fetchAll(PDO::FETCH_COLUMN)
*/

if(__FILE__ != TOPLEVEL_FILE) return;

//js type inference
//http://www.ccs.neu.edu/home/dimvar/jstypes.html

