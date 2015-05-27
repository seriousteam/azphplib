<?php
ob_start();
session_start();

//set timezone
date_default_timezone_set('Europe/Moscow');

//database credentials
define ('DBHOST','katia');
define ('DBUSER','user');
define ('DBPASS','user');
define ('DBNAME','tst');
define ('DBTABLE','members');

//user reg type
define('CREATE_USER_IN_LINK','yes');// 'yes' or 'no'
define('CRYPT_KEY','rC4rs5Gwp4X1m4sRjv2Jw');// change it ;)

//application address
define('DIR','http://localhost/register/loginregister/');
define('SITEEMAIL','redmsmtptst@gmail.com');

// MSG strings
define ('REG_MAIL_HEAD',"Thank you for registering at demo site.\n\n To activate your account, please click on this link:\n\n ");
define ('REG_MAIL_SUBJ',"Registration Confirmation");
define ('REG_MAIL_END',"\n\n Regards Site Admin \n\n");

define ('RESET_MAIL_SUBJ',"Password Reset");
define ('RESET_MAIL_BODY',"Someone requested that the password be reset. \n\nIf this was a mistake, just ignore this email and nothing will happen.\n\nTo reset your password, visit the following address: ");

define ('RESET_CHK',"Please check your inbox for a reset link.");
define ('RESET_LOGOK',"Your account is now active you may now log in.");
define ('RESET_INV_TOKEN','Invalid token provided, please use the link provided in the reset email.');
define ('RESET_ALR_CHANGED','Your password has already been changed!');
define ('RESET_CH_OK',"Password changed, you may now login.");

define ('LOG_WRG','Wrong username or password or your account has not been activated.');

function my_encrypt($string,$key) {
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
function my_decrypt($string,$key) {
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

try {

	//create PDO connection 
	$db = new PDO("mysql:host=".DBHOST.";port=3306;dbname=".DBNAME, DBUSER, DBPASS);
	$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch(PDOException $e) {
	//show error
    echo '<p class="bg-danger">'.$e->getMessage().'</p>';
    exit;
}

//include the user class, pass in the database connection
include('classes/user.php');
$user = new User($db); 
?>
