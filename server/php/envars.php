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
define( '__ROOTDIR__', dirname(dirname(dirname(__DIR__))) );
// /serverprefix
define( '__SERVER_URI_PREFIX__', substr_replace(__ROOTDIR__, '', 0, strlen($_SERVER['DOCUMENT_ROOT']) ) ?: '/' );
//var_dump(__SERVER_URI_PREFIX__, __ROOTDIR__, $_SERVER['DOCUMENT_ROOT']);
//exit;
// /uriprefix
define( '__CLIENT_URI_PREFIX__', '/' );

define('PHP_PATH', realpath(__ROOTDIR__."/../../php/php.exe") ?: 'php');//find this file, if it doesnt exists, uses 'php' command

define('CFG_DIR', __ROOTDIR__.'/cfg');

define('_ENV_CACHE_DIR', __ROOTDIR__."/cache");

$_ENV_UI_THEME = '';

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

define('_ENV_CACHE', 'local');
define('CACHE_TTL', 10);
	
function get_cfg_path($filename) {
	if(@$_COOKIE["magic_name"] && file_exists(CFG_DIR."/$_COOKIE[magic_name]/$filename"))
		return CFG_DIR."/$_COOKIE[magic_name]/$filename";
	if(file_exists(CFG_DIR."/$filename"))
		return CFG_DIR."/$filename";
	$folder_variants = implode(", ", @$_COOKIE["magic_name"] ? [CFG_DIR."/$_COOKIE[magic_name]", CFG_DIR] : CFG_DIR);	
	throw new Exception("Configuration '$filename' not found amongst: $folder_variants");
}

define('_ENV_MAIN_CFG', get_cfg_path('db.ini'));
define('_ENV_MODEL', get_cfg_path('model.ini'));
define('_ENV_LOAD_MODEL', FALSE);
define('_ENV_TABLE_DB_MAPPING', get_cfg_path('model.map.ini'));
define('_ENV_MODEL_DATA', get_cfg_path('model.data.ini'));
define('_ENV_LOCAL_ROLES', get_cfg_path('roles.ini'));
define('_ENV_LIB_MAPPING', get_cfg_path('lib.map.ini'));
define('_ENV_MFM_USERS', get_cfg_path('mfm.users.ini'));
define('G_ENV_TEMPLATE_INIT', get_cfg_path('template.init.php'));
define('_ENV_CRUD_URI', '//az/server/php/crud.php');

$G_LIBS_LIST = ['//az/lib/editing3.css', '//az/lib/editing3-ru.css', '//az/lib/choco.js', '//az/lib/editing3.js'];

//Register Log In
$RL_CREATE_USER_IN_LINK = 'yes';// 'yes' or 'no'
$RL_CRYPT_KEY = 'D2fq9No8pzsTb12nTx';
//application address
$RL_DIR = 'http://localhost/az/server/php/loginregister/';
$RL_SITEEMAIL = 'redmsmtptst@gmail.com';
// DB constants, also used in http querry
$RL_DBTABLE = 'lr_users';
$RL_EMAIL_CONST = 'email';
$RL_USER_CONST = 'username';
$RL_PASSWORD_CONST = 'password';
$RL_ACTIVE_CONST='active';
$RL_RESET_TOKEN_CONST = 'resetToken';
$RL_RESET_COMPL_CONST = 'resetComplete';
// MSG strings
$RL_REG_MAIL_SUBJ = "Подтверждение регистрации";
$RL_REG_MAIL_HEAD = "Вы успешно зарегистрированы в нашей системе.\n\n Для активации аккаунта пройдите по ссылке:\n\n ";
$RL_REG_MAIL_END = "\n\n С наилучшими пожеланиями. \n\n"; // is it need?!
$RL_RESET_MAIL_SUBJ = "Сброс пароля";
$RL_RESET_MAIL_BODY = "Вы запросили сброс пароля. \n\n Для сброса пройдите по сcылке: ";
$RL_RESET_CHK = "На ваш email была выслана ссылка для сброса пароля.";
$RL_RESET_LOGOK = "Аккаунт активирован, можете войти.";
$RL_RESET_INV_TOKEN = 'Неправильный токен сброса пароля.';
$RL_RESET_ALR_CHANGED = 'Пароль был уже изменен!';
$RL_RESET_CH_OK = "Пароль изменен, можете войти.";
$RL_LOG_WRG = 'Неверный пароль или имя пользователя, или пользователь не активирован.';

@include get_cfg_path('env.php');

$G_LIBS_LIST[] = '//az/lib/'.$_ENV_UI_THEME.'.css';
