<?php

require_once(__DIR__.'../../../cfg.php');
require_once(__DIR__.'../../../../../../../cfg/register_login.php');

ob_start();
session_start();
/*
try {

	//create PDO connection 
	$db = new PDO("mysql:host=".DBHOST.";port=3306;dbname=".DBNAME, DBUSER, DBPASS);
	$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch(PDOException $e) {
	//show error
    echo '<p class="bg-danger">'.$e->getMessage().'</p>';
    exit;
}
*/
$db=get_connection(DBTABLE);
//include the user class, pass in the database connection
include('classes/user.php');
$user = new User($db); 
?>
