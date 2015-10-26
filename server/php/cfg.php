<?php

mb_internal_encoding("UTF-8");
define('REPLACED_TOPLEVEL', defined('TOPLEVEL_FILE'));

if(!REPLACED_TOPLEVEL)
	define('TOPLEVEL_FILE', @end(debug_backtrace())['file']?:__FILE__);

require_once (__DIR__.'/dialects.php');

/*
	configuration
	1) files for client in root/az/lib/
	2) server files in root/ais/
	3) common server files in root/az/server/php
	we link sys/.../template/free/common ==> root/az/lib
	and move settings there
	so, our docroot is ../../.. from this file
	
	we have
		URI_PREFIX -> for building uri, if our scripts not at root
	ALL references to scrits can be realtive!
		BUT templater write files to stdout and their corrent desination unknown
	SO, templater can make relative include path for generated file to templater_runtime 
		with help of provided arguments, if nessesary
*/

$CURRENT_USER = 
  @$_SERVER['HTTP_X_AUTH_USER'] ?:(
	  @$_COOKIE['Uname'] ?:(
	  @$_COOKIE['AUTH_USER'] ?:(
		  @$_SERVER['PHP_AUTH_USER'] ?:(
		   function_exists('posix_geteuid') ?
			posix_getpwuid(posix_geteuid())['name'] :
   			getenv('USERNAME').'@'.getenv('USERDOMAIN')
))));
$CURRENT_PW = 
  @$_SERVER['HTTP_X_AUTH_PW'] ?:(
	  @$_COOKIE['Upass'] ?:(
	  @$_COOKIE['AUTH_PW'] ?:(
		  @$_SERVER['PHP_AUTH_PW'] ?:(
			''
))));

$CURRENT_ROLES =
  @$_SERVER['HTTP_AUTH_ROLES'] ?: (
	  @$_COOKIE['AUTH_ROLES'] ?:
  		'' 
);

/*
	path to configuration elements
*/

/*

$G_ENV_MAIN_CFG
$G_ENV_TABLE_DB_MAPPING
$G_ENV_LIB_MAPPING
$G_ENV_LOCAL_USERS
$G_ENV_LOCAL_ROLES
$G_ENV_MODEL
$G_ENV_LOAD_MODEL
$G_ENV_MODEL_DATA;

$G_ENV_CACHE
$G_ENV_CACHE_TTL

*/

$G_ENV_URI_PREFIX = getenv('URI_PREFIX') ?: '/';
$G_P_DOC_ROOT = dirname(dirname(dirname(__DIR__))); //=== __DIR__.'/../../..'
	 // p_doc_root/az/server/php/cfg.php
	 
define('__ROOTDIR__', $G_P_DOC_ROOT);

// $G_ENV_URI_PREFIX <--> $G_P_DOC_ROOT
// so, $G_ENV_URI_PREFIX/path equals to $G_P_DOC_ROOT/path

$GLOBAS_STATE_VARS = [];

//echo $G_P_DOC_ROOT, ' ', $_SERVER['SCRIPT_FILENAME'];
@include "$G_P_DOC_ROOT/ais/env.php"; //override setting on php side, if server doesn't allow to use SetEnv

/*
	we need setup cache configuration first
	bacause we use cache to store configs too
	this is a chicken and egg problem
	but! we need find and load config file, if no env variables set
*/
require_once(__DIR__.'/cache.php');
$main_cfg = array(
		  'default_db' => array(
					'dialect' => '',
					'server' => '',
					)
		  );

function db_dialect($a) {
  return @$a['dialect'] ?: explode(':', $a['server'], 2 )[0];
}

if($G_ENV_MAIN_CFG)
  $main_cfg = array_replace_recursive( $main_cfg,
				     cached_ini($G_ENV_MAIN_CFG, true)
				     );

$default_db = $main_cfg['default_db'];

$a_table_db = array();
if($G_ENV_TABLE_DB_MAPPING) {
  /*
    table_name = db_name
   */
  $a_table_db = cached_ini($G_ENV_TABLE_DB_MAPPING, true);
}

function table_db($table){
  global $main_cfg;
  global $a_table_db;
  global $default_db;
  $tn = trim(explode(':', @$a_table_db[$table], 2)[0]);
  return $main_cfg[$tn ?: 'default_db'];
}

if($G_ENV_LOCAL_USERS) {
  /*
    [user]
    role = D | role = S
	D - default
	S - ???
   */
	$CURRENT_DBCHECKED_USER =  $CURRENT_USER;
	if(is_array($G_ENV_LOCAL_USERS))
		foreach($G_ENV_LOCAL_USERS as $cond=>$def)
			if(preg_match($cond, $CURRENT_USER, $m)) {
					$CURRENT_DBCHECKED_USER = @$m['user'] ?: $m[0];
					$G_ENV_LOCAL_USERS =  $def;
					break;
				}
	if(preg_match('/^(?:SQL|SQL WITH IP)(?:\(([a-z][a-zA-Z0-9_]*)\))?:(.*)/',$G_ENV_LOCAL_USERS, $m)) {
		$table_to_check = $m[1] ?: '';
		$cmd = $m[2];
		$local_users = cached('local-users', $CURRENT_USER,
			function($user, $name_to_check, $pass, $ip) use($cmd, $table_to_check) {
				$dbh = get_connection($table_to_check);
				$stmt = $dbh->prepare($cmd);
				try {	$stmt->execute([$name_to_check, $pass]); 
				} catch(Exception $e) { die($e); }
				if($r = $stmt->fetchAll(PDO::FETCH_OBJ)) {
					$ret = [];
					foreach($r as $e) {
						if($mt = explode('/', @$e->IP ?: '0.0.0.0/0', 2)) {
							$bits = (int)(32-$mt[1]);
							if($bits < 32 && (ip2long($ip) >> $bits) != (ip2long($mt[0]) >> $bits) ) continue;
						}
						$ret[$e->ROLE] = $e->STATUS;
					}
					if(!$ret)
						return 'local user not found';
					return [ $user => $ret ];
				} else {
					return 'local user not found';
				}
			}, null, $CURRENT_DBCHECKED_USER, $CURRENT_PW, @$CURRENT_USER_IP
		);
	} else
		$local_users = cached_ini($G_ENV_LOCAL_USERS, true);
} else
  $local_users = array( $CURRENT_USER => [ 'LOCAL' =>'D' ] );

if($local_users === 'local user not found') {
	if(true) {
		$local_users = array( $CURRENT_USER => ['anonymous' => 'D'] );
	} else {
		http_response_code(403);
		setcookie('AUTH_INFO', ($_SERVER['REQUEST_METHOD'].":$CURRENT_USER:$G_ENV_URI_PREFIX"), 0, $G_ENV_URI_PREFIX);
		readfile($G_P_DOC_ROOT.'/ais/auth-local.html');
		//TODO: add _POST paramaters here to resend them! directly into form
		die('');
	}
}


function local_user($user) { global $local_users; return @$local_users[$user]; }

/*
#comment
#internal rules: allow, all, +, deny, none, -
let `rule-name` = `rule_def`
[`ROLE` !`PRIORITY`! ]
	.r: all
	.d: all
	.u: all
	.c: all
	table `table_name`
		.r: all
		.d: all
		.u: all
		.c: all
		`field_name`:
			.r: !`PRIORITY`! all
			.d: $`rule-name`
			.u: all
			.c: all
		`field_name`: =`like_field`
			.r: !`PRIORITY`! all
			.d: $`rule-name`
			.u: all
			.c: all
# SQL can use $USER $ROLES $ROLES_CSV
# and reference current table fields with alias 'a1'
# for SQL we can define multyline statement i.e.
# 	.r: .
#		EXISTS(SELECT ......)
#		.
*/
function cfg_parse_roles($a) {
	$defs = [];
	$r = array();
	$role =& $r['.default'];
	$table =& $role['.default'];
	$fld =& $table['.default'];
	$fld = array( '.level' => 10 ); //FIXME: constant (and .default too)
	$a = array_map('trim',$a);
	reset($a);
	while (list(, $l) = each($a))
	{ 	 if(!$l || $l[0] == '#') continue;
	     if(preg_match('/^\s*let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)/', $l, $m)) {
			$defs[$m[1]] = $m[2];
			continue;
	     }
	     if(preg_match('/^\[\s*([^!]+)(\s+!([0-9]+)!)?\s*\]$/i', $l, $m)) //[role]
	       { 	@$role =& $r[$m[1]] ?: array();
				$table =& $role['.default'];
				$fld =& $table['.default'];
				$fld = array( '.level' => @$m[3] ?: 10 ); //FIXME
				continue; 
	       }
	     if(preg_match('/^table\s+(.+)/i', $l, $m)) //table
	       { 	@$table =& $role[$m[1]] ?: 
					$role[$m[1]] = array('.default' => array()); 
				$fld =& $table['.default'];
				continue; 
	       }
	     if(preg_match('/^([.a-z$0-9_]+)\s*:\s*(.*)/i', $l, $m)) { //field or right
				if($m[2] == '' || $m[2][0] == '=' ) { //field
					@$fld =& $table[$m[1]] ?: $table[$m[1]] = ($m[2] ? $table[substr($m[2],1)] : array()); 
					continue; 
				}
	     }
		 //right definition
	     $pri = null;
	     if(preg_match('/^!([0-9]+)!\s+(.*)/', $m[2], $mm)) { $m[2] = $mm[2]; $pri = $mm[1]; }
	     if(preg_match('/^\s*\$(.*)$/i', $m[2], $mm)) $m[2] = $defs[$mm[1]];
	     if(preg_match('/^(all|allow|\+)$/i', $m[2])) $m[2] = '';
	     else if(preg_match('/^(deny|none|-)$/i', $m[2])) $m[2] = '-';
		 //var_dump($l, $m);
		 if($m[2] == '.') {
			$m[2] = [];
			while(list(,$nl) = each($a)) {
				if($nl == '.') break;
				$m[2][] = $nl;
			}
			$m[2] = implode("\n", $m[2]);
		 }
	     $fld[$m[1]] = $m[2];
		 if($pri) $fld[$m[1].'.level'] = $pri;
	}
	return $r;
}

if($G_ENV_LOCAL_ROLES)
  /*
    [role] or [role !number!]
	.r : filter
	.u : filter
	.c : filter
	.d : filter
    table table_name
      .r : filter
      .u : filter
      .c : filter
      object.verb : 
--
    filter::= sql | all | allow | + | none | deny | -
	or filter ::= !number! filter

	where number is a role/rule precedence

	.r apply if someone try to get value (select, update)
		can be specified for all tables, for all fields in table or for any field
	.u apply if someone try to update value
		can be specified for all tables, for all fields in table or for any field
	.c apply if someone try to insert record
		can be specified for all tables, for all fields in table or for any field
	.d apply if someone try to delete record
		can be specified for all tables, for all fields in table but not for a field

	attention!
		.c filters should filter out records with all nulls
		or should allow insert any value
   */
  $local_objects_rights = 
    cached('ini', $G_ENV_LOCAL_ROLES,
       function($file) { return cfg_parse_roles(file($file)); });
else
  $local_objects_rights = array( );
  
function user_roles($user, $request_roles) {
  return cached('user-roles', "$user:$request_roles", 
		function($key, $user, $request_roles) {
		  $lu = local_user($user);
		  if(!$lu) return '';
		  $rr = array();
		  preg_match('/[a-zA-Z0-9_]+/', $request_roles, $rr);
		  if(!$rr)
		    return implode(' ', array_keys($lu, 'D', true));
		  return implode(' ', array_intersect($rr, array_keys($lu)));
		}
		, null, $user, $request_roles);
}

/*
  можно спросить глобальные натройки роли
  или настройки таблицы
*/
function object_right_params($role, $object = '.default', $field = '.default') {
	return cached('rights', "$role:$object:$field",
		function($key, $role, $object, $field) {
		  global $local_objects_rights;
		  return
		    @$local_objects_rights[$role][ $object ][ $field ] 
		    ?: array();
		}, null, $role, $object, $field);
}


$CURRENT_ROLES = user_roles($CURRENT_USER, $CURRENT_ROLES); 
$CURRENT_ROLES_CSV = str_replace(' ', ',', $CURRENT_ROLES);
$CURRENT_ROLES_ARRAY = explode(' ', $CURRENT_ROLES);

function add_role_to_context($role) {
	global $CURRENT_ROLES, $CURRENT_ROLES_CSV, $CURRENT_ROLES_ARRAY;
	$CURRENT_ROLES .= ' '.$role;
	$CURRENT_ROLES_CSV .= ','.$role;
	$CURRENT_ROLES_ARRAY[] = $role;
}

// uri after striping our prefix (normalized in some sence)
$LOCALIZED_URI = (PHP_SAPI == 'cli' && !REPLACED_TOPLEVEL)? 
	$_SERVER['argv'][0]
	:
	( substr_compare($_SERVER['REQUEST_URI'], $G_ENV_URI_PREFIX, 0, strlen($G_ENV_URI_PREFIX)) == 0?
		substr_replace($_SERVER['REQUEST_URI'], '/', 0, strlen($G_ENV_URI_PREFIX))
	  : $_SERVER['REQUEST_URI']
	)
	;

//echo $LOCALIZED_URI;

$lu = explode('?', $LOCALIZED_URI, 2);

if(@$lu[1]) $LOCALIZED_URI = $lu[0] . '?' . str_replace('/', '%4F', $lu[1]);

	
/*
	$LOCALIZED_URI - URI pointed current rendered page
	if we make new URI, we can:
		use uri, relative to current page (if we know, that there is corresponding target)
			i.e., if we refer to subling file
		use global redirector, which take params from URI, and decide, which file we called
			global redirector resides in /az/server/php/redir.php
		use library file as target
*/

function our_URI($uri) {
	global $G_ENV_URI_PREFIX;
	return $G_ENV_URI_PREFIX . $uri; //$uri is 'absolute'
}
$a_lib_map = array();
if($G_ENV_LIB_MAPPING) {
  /*
    //path/to/resource.js = "https://resour.ce/absolute/path.js"
   */
  $a_lib_map = cached_ini($G_ENV_LIB_MAPPING);
}
$a_mfm_users = array();
if($G_ENV_MFM_USERS) {
    $a_mfm_users = cached_ini($G_ENV_MFM_USERS);
}
function extern_path($path){
  global $a_lib_map;
  return @$a_lib_map[$path];
}
function file_URI($path, $args = null, $stamp = FALSE) { //__FILE__ or __DIR__.'filename'
	global $G_P_DOC_ROOT;
	
	$args = ($args? '?'.http_build_query($args, 'x', '&', PHP_QUERY_RFC3986) : '');
	
	$expath = extern_path( $path );	
	if($expath) {
		return $expath . $args . (@$_COOKIE['DEBUG_MODE'] ? '?'.time(): '');
	}

	if($path[0] == '/' && $path[1] == '/') { 
		$path = $G_P_DOC_ROOT.substr($path,1); // `//` means from docroot
	}
	else
		if(substr_compare($path, $G_P_DOC_ROOT, 0, strlen($G_P_DOC_ROOT))!==0)
			throw new Exception("File $path in not under docroot $G_P_DOC_ROOT");
	if($stamp)
		$path .= '('.filemtime ($path).')';
		
	$path = substr($path, strlen($G_P_DOC_ROOT)+1);
	$path = str_replace('\\','/', $path);
	return our_URI($path) . $args;	
}

$CFG_STDIN_CONTENT = null;
function main_argument($str = true) {
  if(PHP_SAPI == 'cli' && !REPLACED_TOPLEVEL) {
    $arg = @$_SERVER['argv'][1] ?: '-';
    if($arg === '-')
      if($str) {
		global $CFG_STDIN_CONTENT;
		if($CFG_STDIN_CONTENT === null)
			$CFG_STDIN_CONTENT = explode("\0", file_get_contents('php://stdin'));
		return $CFG_STDIN_CONTENT[0];
	  }
      else return 'php://stdin';
    return $arg;
  }
  if($_SERVER['REQUEST_METHOD'] === 'GET')
    return @$_GET['cmd'] ?: '';
  if($_POST)
    return @$_POST['cmd'] ?: '';
  if($str) {
	global $CFG_STDIN_CONTENT;
	if($CFG_STDIN_CONTENT === null)
		$CFG_STDIN_CONTENT = explode("\0", file_get_contents('php://input'));
	return $CFG_STDIN_CONTENT[0];
  }
  return 'php://input';
}

function main_subarguments($str = true) {
  if(PHP_SAPI == 'cli' && !REPLACED_TOPLEVEL) {
    $arg = $_SERVER['argv'][1] ?: '-';
	$args = [];
    if($arg === '-' && $str) {
		global $CFG_STDIN_CONTENT;
		if($CFG_STDIN_CONTENT === null)
			$CFG_STDIN_CONTENT = explode("\0", file_get_contents('php://stdin'));
		$args = array_slice($CFG_STDIN_CONTENT,1);
	  }
    return array_merge($args,array_slice($_SERVER['argv'], 2));
  }
  if($_SERVER['REQUEST_METHOD'] === 'GET') {
    return @$_GET['args'] ?: [];
  }
  if($_POST)
    return @$_POST['args'] ?: [];
  if($str) {
	global $CFG_STDIN_CONTENT;
	if($CFG_STDIN_CONTENT === null)
		$CFG_STDIN_CONTENT = explode("\0", file_get_contents('php://stdin'));
	return array_slice($CFG_STDIN_CONTENT,1);
  }
  return [];
}

function get_connection($table){
  static $connections = array();
  $db = table_db($table);
  $key = serialize($db);
  $dsn = $db['server'];
  $params = array(PDO::ATTR_PERSISTENT => true);
  if(db_dialect($db)==='mssql') {
	  //PDO persistent connections dont work in MS SQL
	  $dsn .= ';ConnectionPooling=1';
	  $params[PDO::ATTR_PERSISTENT] = false;
  }
  if(!@$connections[$key]) {
    if(isset($db['user'])) {
	if(@$db['user'][0] === '?') {
	    try {
		global $CURRENT_USER, $CURRENT_PW;
		$connections[$key] = new PDO($dsn,
				   $CURRENT_USER,
				   $CURRENT_PW,
				   $params				  
				   );
	    } catch(Exception $e) {
		$connections[$key] = new PDO($dsn,
				   substr($db['user'],1),
				   $db['pass'],
				   $params
				   );
	    }
	} else {
		$connections[$key] = new PDO($dsn,
				   $db['user'],
				   $db['pass'],
				   $params
				   );
	}
   } else
      $connections[$key] = new PDO($dsn,null, null,$params);
  
    $connections[$key]->dialect = db_dialect($db);
    $connections[$key]->subdialect = @$db['subdialect'];
    prepareDB( $connections[$key]);
    $connections[$key]->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $connections[$key]->setAttribute(PDO::ATTR_ORACLE_NULLS, PDO::ATTR_ORACLE_NULLS);
  }
  return $connections[$key];
}

function rm_encrypt($string,$key) {
  srand((double) microtime() * 1000000); //for sake of MCRYPT_RAND
  $key = md5($key); //to improve variance
  /* Open module, and create IV */
  $td = mcrypt_module_open('des', '','cfb', '');
  $key = substr($key, 0, mcrypt_enc_get_key_size($td));
  $iv_size = mcrypt_enc_get_iv_size($td);
  $iv = mcrypt_create_iv($iv_size, MCRYPT_RAND);
  /* Initialize encryption handle */
   if (mcrypt_generic_init($td, $key, $iv) != -1) {
      /* Encrypt data */
      $c_t = mcrypt_generic($td, $string);
      mcrypt_generic_deinit($td);
      mcrypt_module_close($td);
       $c_t = $iv.$c_t;
       return $c_t;
   } //end if
}

function rm_decrypt($string,$key) {
   $key = md5($key); //to improve variance
  /* Open module, and create IV */
  $td = mcrypt_module_open('des', '','cfb', '');
  $key = substr($key, 0, mcrypt_enc_get_key_size($td));
  $iv_size = mcrypt_enc_get_iv_size($td);
  $iv = substr($string,0,$iv_size);
  $string = substr($string,$iv_size);
  /* Initialize encryption handle */
   if (mcrypt_generic_init($td, $key, $iv) != -1) {
      /* Encrypt data */
      $c_t = mdecrypt_generic($td, $string);
      mcrypt_generic_deinit($td);
      mcrypt_module_close($td);
       return $c_t;
   } //end if
}

set_exception_handler(function ($exception) {
  echo "Exception: " , $exception->getMessage(), "\n";
});


if(__FILE__ != TOPLEVEL_FILE) return;

header('Content-type: text/plain');

echo <<<XCFG
	user is $CURRENT_USER 
		from $CURRENT_USER_IP
	roles $CURRENT_ROLES_CSV		
	root is 
		$G_P_DOC_ROOT
	uri prefix is 
		$G_ENV_URI_PREFIX
	main config in 
		$G_ENV_MAIN_CFG
	table mapping set in 
		$G_ENV_TABLE_DB_MAPPING
	lib mapping set in 
		$G_ENV_LIB_MAPPING
	local user database in 
		$G_ENV_LOCAL_USERS
	local role assigmenus in 
		$G_ENV_LOCAL_ROLES
	model definition in 
		$G_ENV_MODEL
	model autoload $G_ENV_LOAD_MODEL

	cache mode $G_ENV_CACHE
	cache ttl $G_ENV_CACHE_TTL

XCFG
;

var_dump($main_cfg);
var_dump($local_objects_rights);
var_dump($a_table_db);
