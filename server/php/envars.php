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
define( '__SERVER_URI_PREFIX__', substr_replace(__ROOTDIR__, '', 0, strlen($_SERVER['DOCUMENT_ROOT']) ) );
// /uriprefix
define( '__CLIENT_URI_PREFIX__', '/' );

define('PHP_PATH', realpath(__ROOTDIR__."/../../php/php.exe") ?: 'php');//find this file, if it doesnt exists, uses 'php' command

define('CFG_DIR', __ROOTDIR__.'/cfg');

$G_ENV_CACHE_DIR = __ROOTDIR__."/cache";

$CURRENT_USER_IP = @$_SERVER['REMOTE_ADDR'];

define('_ENV_LOAD_MODEL', FALSE);

$G_ENV_LOCAL_USERS  = [
   '/.*/' => "SQL:SELECT rd.enf_rolenamew AS ROLE, CASE r.enf_defaultw WHEN 1 THEN 'D' ELSE 'C' END AS STATUS "
	." FROM enperson_roles r JOIN enpn2persons u ON r.enrel_pnpersonw = u.syrecordidw JOIN eninternal_roles rd ON r.enrel_rolew = rd.syrecordidw"
	." WHERE enf_rolenamew IS NOT NULL AND u.enpnw = ? AND u.enpassw = ?"
	];

define('_ENV_CACHE', 'local');
define('CACHE_TTL', 10);
	
function get_cfg_path($filename) {
	$folder_variants = @$_COOKIE["magic_name"] ? 
			  [CFG_DIR."/$_COOKIE[magic_name]/", CFG_DIR."/"]
			: [ CFG_DIR."/" ];
			
	foreach($folder_variants as $folder) {
		if($folder && file_exists("$folder$filename")) {
			return "$folder$filename";
		}
	}
	$folder_variants = implode(', ',$folder_variants);	
	throw new Exception("Configuration '$filename' not found amongst: $folder_variants");
}

$G_ENV_MAIN_CFG = get_cfg_path('db.ini');
$G_ENV_MODEL = get_cfg_path('model.ini');
$G_ENV_TABLE_DB_MAPPING = get_cfg_path('model.map.ini');
$G_ENV_MODEL_DATA = get_cfg_path('model.data.ini');
$G_ENV_LOCAL_ROLES = get_cfg_path('roles.ini');
$G_ENV_LIB_MAPPING = get_cfg_path('lib.map.ini');
$G_ENV_MFM_USERS = get_cfg_path('mfm.users.ini');

$G_LIBS_LIST = ['//az/lib/editing3.css', '//az/lib/editing3-ru.css', '//az/lib/choco.js', '//az/lib/editing3.js'];

define('G_ENV_TEMPLATE_INIT', get_cfg_path('template.init.php'));


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
