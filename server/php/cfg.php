<?php

mb_internal_encoding("UTF-8");

define('REPLACED_TOPLEVEL', defined('TOPLEVEL_FILE'));

if(!REPLACED_TOPLEVEL)
	define('TOPLEVEL_FILE', realpath($_SERVER['SCRIPT_FILENAME']) ?:__FILE__);

require_once (__DIR__.'/dialects.php');

/*
	configuration
	1) files for client in root/az/lib/
	2) common server files in root/az/server/php
	3) server files in root/
	4) cached templates in root/cache
	5) default config files in root/cfg
	   php-powered config root/cfg/env.php 
	6) custom config files in root/cfg/magic_name
	   php-powered custom config root/cfg/magic_name
	
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

$CURRENT_USER_IP = @$_SERVER['REMOTE_ADDR'];

//override setting on php side, if server doesn't allow to use SetEnv
require_once(__DIR__.'/envars.php');

$G_TEMPLATER_GLOBALS = array_merge( [
	'G_LIBS_LIST'
	, 'CURRENT_USER'
	, 'CURRENT_ROLES'
	, 'CURRENT_ROLES_CSV'
	, 'CURRENT_ROLES_ARRAY'
], @$G_TEMPLATER_GLOBALS ?: []); 

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

if(_ENV_MAIN_CFG)
  $main_cfg = array_replace_recursive( $main_cfg,
				     cached_ini(_ENV_MAIN_CFG, true)
				     );

$default_db = $main_cfg['default_db'];

$a_table_db = array();
if(_ENV_TABLE_DB_MAPPING) {
  /*
    table_name = db_name
   */
  $a_table_db = cached_ini(_ENV_TABLE_DB_MAPPING, true);
}

function table_db($table){
  global $main_cfg;
  global $a_table_db;
  global $default_db;
  $tn = trim(explode(':', @$a_table_db[$table], 2)[0]);
  return $main_cfg[$tn ?: 'default_db'];
}


if(__FILE__ === TOPLEVEL_FILE) {/* DIAGNOSTIC */
	$OS = php_uname('s');
	$checks = [
		"PDO" => false,
		"SimpleXML" => false
	];	
	$checks["PDO"] = extension_loaded("pdo");
	if($checks["PDO"]) {
		$pdo_dialects = [ "mssql" => [ 'Windows' => "pdo_sqlsrv", 'Linux' => "pdo_odbc" ],
				"mysql"=>"pdo_mysql", "pgsql"=>"pdo_pgsql", "oracle"=>"pdo_oci"];
		foreach($main_cfg as $k=>$v) {
			if(!@$v["dialect"]) continue;
			$dialect = $v["dialect"];

			if(is_array($pdo_dialects[$dialect])) {
				$os = substr( php_uname('s'), 0, 7 )=='Windows' ?: 'Linux';
				$driver = $pdo_dialects[$dialect][$os];
				$checks["$dialect PDO for $os client"] = extension_loaded($driver);
			} else {
				$checks["$dialect PDO"] = extension_loaded($pdo_dialects[$dialect]);
			}		
		}
	}
	$checks["SimpleXML"] = extension_loaded("SimpleXML");
	
	system(PHP_PATH." >&0",$retval);
	$checks['PHP Cli'] = !$retval;
	
	if(@_ENV_CACHE_DIR && $checks['PHP Cli']) {
		$checks["PHP Cli Rights for "._ENV_CACHE_DIR." for $CURRENT_USER"] = false;
		$tmpfile = _ENV_CACHE_DIR."/az.cfg.check.php";
		system("echo 11111 > $tmpfile",$retval);		
		if(!$retval && file_exists($tmpfile) ) {
			$checks["PHP Cli Rights for "._ENV_CACHE_DIR." for $CURRENT_USER"] = 
				preg_replace('/[^1]+/','',file_get_contents($tmpfile))==="11111";
			unlink($tmpfile);
		}
	}	
	foreach($checks as $k=>$v) {
		if(preg_match('/\s*PDO\s*/',$k) && !$v) goto FAILED;
	}
}

define('AUTH_ERROR', '-auth error-');

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
				try {	
					$stmt->execute([$name_to_check, $pass]); 
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
						return AUTH_ERROR;
					return [ $user => $ret ];
				} else {
					return AUTH_ERROR;
				}
			}, null, $CURRENT_DBCHECKED_USER, $CURRENT_PW, @$CURRENT_USER_IP
		);
	} else if(preg_match('/^(?:PHP):(.*)/',$G_ENV_LOCAL_USERS, $m)) {
		/*
		  PHP auth method auth_method($user, $pass, $ip = null)
			It must return array like [ 'is_admin' => 'D', 'is_user' => 'C' ] 
			where 'D' - default turned on role, 'C'(or any other string) - possible but turned off role
		*/
		$f = $m[1];
		$ret = $f($CURRENT_DBCHECKED_USER, $CURRENT_PW, @$CURRENT_USER_IP);
		if($ret) $local_users = [ $CURRENT_DBCHECKED_USER => $ret ];
		else $local_users = AUTH_ERROR;
	} else
		$local_users = cached_ini($G_ENV_LOCAL_USERS, true);
} else
  $local_users = [ $CURRENT_USER => [ 'LOCAL' =>'D' ] ];

function local_user($user) { global $local_users; return $local_users === AUTH_ERROR ? null : @$local_users[$user]; }

if(!local_user($CURRENT_USER)) {
	if(true) {
		$local_users = [ $CURRENT_USER => ['anonymous' => 'D'] ];
	} else {
		http_response_code(403);
		setcookie('AUTH_INFO', ($_SERVER['REQUEST_METHOD'].":$CURRENT_USER:".__CLIENT_URI_PREFIX__), 0, __CLIENT_URI_PREFIX__);
		readfile(__ROOTDIR__.'/ais/auth-local.html');
		//TODO: add _POST paramaters here to resend them! directly into form
		die('');
	}
}



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

if(_ENV_LOCAL_ROLES)
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
    cached('ini', _ENV_LOCAL_ROLES,
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

//error_log('URI:'.$_SERVER['REQUEST_URI']);
// uri after striping our prefix (normalized in some sence)

$LOCALIZED_URI = (PHP_SAPI == 'cli' && !REPLACED_TOPLEVEL)? 
	$_SERVER['argv'][0]
	:
	( 
		substr_compare($_SERVER['REQUEST_URI'], __SERVER_URI_PREFIX__, 0, strlen(__SERVER_URI_PREFIX__)) == 0?
		substr_replace($_SERVER['REQUEST_URI'], '/', 0, strlen(__SERVER_URI_PREFIX__))
	  : $_SERVER['REQUEST_URI']
	)
	;

//echo $_SERVER['REQUEST_URI'], '-- ',__SERVER_URI_PREFIX__, ' --',$LOCALIZED_URI;

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
	return preg_replace('#/+#','/',__CLIENT_URI_PREFIX__ . $uri);//$uri is 'absolute'
}
$a_lib_map = array();
if(_ENV_LIB_MAPPING) {
  /*
    //path/to/resource.js = "https://resour.ce/absolute/path.js"
   */
  $a_lib_map = cached_ini(_ENV_LIB_MAPPING);
}
$a_mfm_users = array();
if(_ENV_MFM_USERS) {
    $a_mfm_users = cached_ini(_ENV_MFM_USERS);
}
function extern_path($path){
  global $a_lib_map;
  return @$a_lib_map[$path];
}
function file_URI($path, $args = null, $stamp = FALSE) { //__FILE__ or __DIR__.'filename'
	
	$args = ($args? '?'.http_build_query($args, 'x', '&', PHP_QUERY_RFC3986) : '');
	
	$expath = extern_path( $path );	
	if($expath) {
		return $expath . $args . (@$_COOKIE['DEBUG_MODE'] ? '?'.time(): '');
	}

	if($path[0] == '/' && $path[1] == '/') { 
		$path = __ROOTDIR__.substr($path,1); // `//` means from our docroot
	}
	else
		if(substr_compare($path, __ROOTDIR__, 0, strlen(__ROOTDIR__))!==0)
			throw new Exception("File $path in not under docroot ".__ROOTDIR__);
	if($stamp)
		$path .= '('.filemtime ($path).')';
	
	$path = substr($path, strlen(__ROOTDIR__)+1);
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

function get_connection($table) {
  static $connections = array();
  $db = table_db($table);
  $key = serialize($db);
  $dsn = $db['server'];
  $params = array();
  if(@$db['pooling'] != 'no') {
	$params[PDO::ATTR_PERSISTENT] = true;
  }
  if(@$db['pooling'] != 'no' && db_dialect($db)==='mssql') {
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
		try {
			$connections[$key] = new PDO($dsn,
				   $db['user'],
				   $db['pass'],
				   $params
				   );
		} catch(Exception $e) {
			throw new Exception("Couldnt connect to database.");
		}		
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

function startsWith($val, $w, $adv_char = '') {
	return 
		strncmp($val, $w, strlen($w)) == 0
		&& 
		( 
			$adv_char === '' ||
			strlen($val) > strlen($w)
			&& $val[strlen($w)] === $adv_char
		)
	;
}

set_exception_handler(function ($exception) {
  echo "Exception: " , $exception->getFile(),':',$exception->getLine(), ':', $exception->getMessage(), "\n";
});

if(__FILE__ != TOPLEVEL_FILE) return;

FAILED:

header('Content-type: text/html');
echo <<<HEAD
	<html><head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<style>
	* { font-family: sans-serif; font-size:14pt; }
	table {border-collapse:collapse}
	td {padding:0.4em; border:1px solid rgba(0,0,0,0.1)}
	[ok] { color: olivedrab }
	[failed] { color: tomato }
	[req] td:first-child { white-space: nowrap }
	</style>
	</head>
	<body><table cellspacing=0>
	<tr><td colspan=2><b>Requirements:</b></tr>
HEAD;

foreach($checks as $k=>$v) {
	$style = $v ? "ok" : "failed";
	echo "<tr req $style><td>$k<td>$style</tr>";
}
$G = function($v) { return is_string($v) ? $v : 'corrupted'; };

$CURIP = __CLIENT_URI_PREFIX__;
$SURIP = __SERVER_URI_PREFIX__;
$DOCROOT = __ROOTDIR__;

$G_PHP_PATH = PHP_PATH;

$G_ENV_MAIN_CFG = _ENV_MAIN_CFG;

$G_ENV_LOAD_MODEL = _ENV_LOAD_MODEL;
$G_ENV_CACHE = _ENV_CACHE;
$G_ENV_CACHE_TTL = CACHE_TTL;
$G_ENV_MAIN_CFG = _ENV_MAIN_CFG;
$G_ENV_TABLE_DB_MAPPING = _ENV_TABLE_DB_MAPPING;
$G_ENV_LIB_MAPPING = _ENV_LIB_MAPPING;
$G_ENV_LOCAL_ROLES = _ENV_LOCAL_ROLES;
$G_ENV_MODEL = _ENV_MODEL;
$G_ENV_CACHE_DIR = _ENV_CACHE_DIR;

echo <<<XCFG
	<tr><td colspan=2><b>Info:</b></tr>
	<tr><td>OS<td>$OS</tr>
	<tr><td>User<td>$CURRENT_USER</tr>
	<tr><td>IP from<td>$CURRENT_USER_IP</tr>
	<tr><td>Roles<td>{$G(@$CURRENT_ROLES_CSV)}</tr>
	<tr><td>Our root<td>$DOCROOT</tr>
	<tr><td>Client URI prefix<td>$CURIP</tr>
	<tr><td>Server URI prefix<td>$SURIP</tr>
	<tr><td>PHP Cli<td>$G_PHP_PATH</tr>
	<tr><td>Main config<td>$G_ENV_MAIN_CFG</tr>	
	<tr><td>Table mapping<td>$G_ENV_TABLE_DB_MAPPING</tr>
	<tr><td>Lib mapping<td>$G_ENV_LIB_MAPPING</tr>
	<tr><td>Local user database<td>{$G($G_ENV_LOCAL_USERS)}</tr>
	<tr><td>Local role assignments<td>$G_ENV_LOCAL_ROLES</tr>	
	<tr><td>Model definition<td>$G_ENV_MODEL</tr>		
	<tr><td>Cache directory<td>$G_ENV_CACHE_DIR</tr>
	<tr><td>Model autoload<td>$G_ENV_LOAD_MODEL</tr>	 
	<tr><td>Cache mode<td>$G_ENV_CACHE</tr>
	<tr><td>Cache ttl<td>$G_ENV_CACHE_TTL</tr>
XCFG
;
echo <<<TFOOT
	</table><pre>
TFOOT;
echo '<div><b>$main_cfg</b></div>';
//var_dump($main_cfg);
echo '<div><b>$local_objects_rights</b></div>';
var_dump($local_objects_rights);
echo '<div><b>$a_table_db</b></div>';
var_dump($a_table_db);

echo <<<FOOT
	</body></html>
FOOT;
