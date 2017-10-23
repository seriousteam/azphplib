<?php
/*
*	
*	This file contains default server variables.
*	At the end of file it includes 'env.php' which redefines some of server variables
*
*/
// URI: /uriprefix/test.php
// File path: /var/www/serverprefix/test.php
// /var/www/serverprefix

//directory where az folder reside (i.e "our" root dir)
define( '__ROOTDIR__', dirname(dirname(dirname(__DIR__))) ); 

// /serverprefix
// shift of "our" dir from server DOCROOT
// (i.e. part of pth uri we should replace with '/')
define( '__SERVER_URI_PREFIX__', substr_replace(__ROOTDIR__, '', 0, strlen($_SERVER['DOCUMENT_ROOT']) ) . '/' );
//var_dump(__SERVER_URI_PREFIX__, __ROOTDIR__, $_SERVER['DOCUMENT_ROOT']); exit;

define('PHP_PATH', realpath(__ROOTDIR__."/../../php/php.exe") ?: 'php');//find this file, if it doesnt exists, uses 'php' command

define('CFG_DIR', __ROOTDIR__.'/cfg'); //for now, it'g good choose always!

$_ENV_UI_THEME = ''; //we can redefine it in project!

//$G_ENV_LOCAL_USERS  
//	definition
//	or
//	array regexp=>definition
//		if username match regexp we use definition
//		definition can be
//			filename
//			or
//			SQL:select which take two params: username, password and return records of roles <ROLE, STATUS>
//				STATUS: D - used by default, C - possible role
//			or
//			SQL WITH IP:select which take two params: username, password and return records of roles <ROLE, STATUS, IP>
//				STATUS: D - used by default, C - possible role
//				IP: ip range in form 0.0.0.0/0
//			or
//			PHP:name - name of php function whidh take username, password, ip
//				and  return array role=>status or null

	
function get_cfg_path($filename) {
	if(@$_COOKIE["magic_name"] && file_exists(CFG_DIR."/$_COOKIE[magic_name]/$filename"))
		return CFG_DIR."/$_COOKIE[magic_name]/$filename";
	if(file_exists(CFG_DIR."/$filename"))
		return CFG_DIR."/$filename";
	$folder_variants = implode(", ", @$_COOKIE["magic_name"] ? [CFG_DIR."/$_COOKIE[magic_name]", CFG_DIR] : CFG_DIR);	
	throw new Exception("Configuration '$filename' not found amongst: $folder_variants");
}

//we do not need redefine this constant
// because it's scheme fleksible enought 

define('_ENV_MAIN_CFG', get_cfg_path('db.ini'));
define('_ENV_MODEL', get_cfg_path('model.ini'));
define('_ENV_TABLE_DB_MAPPING', get_cfg_path('model.map.ini'));
define('_ENV_MODEL_DATA', get_cfg_path('model.data.ini'));
define('_ENV_LOCAL_ROLES', get_cfg_path('roles.ini'));
define('_ENV_LIB_MAPPING', get_cfg_path('lib.map.ini'));
define('_ENV_MFM_USERS', get_cfg_path('mfm.users.ini'));
define('_ENV_RL', get_cfg_path('rl.ini'));
define('G_ENV_TEMPLATE_INIT', get_cfg_path('template.init.php'));

$G_LIBS_LIST = ['//az/lib/editing3.css'
	, '//az/lib/editing3-ru.css'
	, '//az/lib/choco.js'
	, '//az/lib/editing3.js'
]; 
//can be extended later

@include get_cfg_path('env.php');

if(!defined('_ENV_LOAD_MODEL')) define('_ENV_LOAD_MODEL', FALSE);
if(!defined('_ENV_CACHE_DIR')) define('_ENV_CACHE_DIR', __ROOTDIR__."/cache");
if(!defined('_ENV_CACHE')) define('_ENV_CACHE', 'local');
if(!defined('CACHE_TTL')) define('CACHE_TTL', 10);

// /uriprefix
// "global" translation from incoming uri to our uri
// used when we took stipped (rewrited) uri somehow
if( !defined( '__CLIENT_URI_PREFIX__') ) define( '__CLIENT_URI_PREFIX__', '/' );

if(!defined('_AZ_SERVER_URI_PREFIX')) 
	define('_AZ_SERVER_URI_PREFIX', '//az/server/php');
if(!defined('_AZ_SERVER_URI_SUFFIX')) 
	define('_AZ_SERVER_URI_SUFFIX', '.php');
if(!defined('_ENV_CRUD_URI')) 
	define('_ENV_CRUD_URI', _AZ_SERVER_URI_PREFIX.'/crud'._AZ_SERVER_URI_SUFFIX);
if(!defined('_ENV_FILER_URI')) 
	define('_ENV_FILER_URI', _AZ_SERVER_URI_PREFIX.'/filer'._AZ_SERVER_URI_SUFFIX);
if(!defined('_ENV_TABLER_URI')) 
	define('_ENV_TABLER_URI', _AZ_SERVER_URI_PREFIX.'/tabler2'._AZ_SERVER_URI_SUFFIX);
if(!defined('_ENV_CHOOSER_URI')) 
	define('_ENV_CHOOSER_URI', _AZ_SERVER_URI_PREFIX.'/chooser2'._AZ_SERVER_URI_SUFFIX);
if(!defined('_ENV_TABLEID_URI')) 
	define('_ENV_TABLEID_URI', _AZ_SERVER_URI_PREFIX.'/tableid'._AZ_SERVER_URI_SUFFIX);
if(!defined('_ENV_MODELDATA_URI')) 
	define('_ENV_MODELDATA_URI', _AZ_SERVER_URI_PREFIX.'/modeldata'._AZ_SERVER_URI_SUFFIX);
if(!defined('_ENV_COUNTER_URI')) 
	define('_ENV_COUNTER_URI', _AZ_SERVER_URI_PREFIX.'/counter'._AZ_SERVER_URI_SUFFIX);



$G_LIBS_LIST[] = '//az/lib/'.$_ENV_UI_THEME.'.css';
