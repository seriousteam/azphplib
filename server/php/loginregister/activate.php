<?php
require('includes/config.php');

//collect values from the url
//$memberID = @trim($_GET['x']);
$active = @trim($_GET['y']);
$stmt=null;

//if id is number and the active token is not empty carry on
if(!empty($active)){
	//update users record set the active column to Yes where the memberID and active value match the ones provided in the array
	$stmt = $db->prepare("UPDATE ".DBTABLE." SET active = 'Yes' WHERE active = :active");
	$stmt->execute(array(':active' => $active));	
}
else
{
	if (isset($_REQUEST['activasion']))
	{	
		$info=rm_decrypt($_REQUEST['activasion'],CRYPT_KEY);
		$rez_arr=null;
		parse_str($info,$rez_arr);
		if ($rez_arr)
		{
			try
			{
				//$yes='Yes';
				$sql="INSERT INTO ".DBTABLE."(".implode(array_keys($rez_arr),",").") VALUES (?"
					.str_repeat(",?",count($rez_arr)-1).")";
				$stmt = $db->prepare($sql);
				print_r($info);
				$stmt->execute(array_values($rez_arr));
				/*
				$stmt = $db->prepare('INSERT INTO members (username,password,email,active) VALUES (:username, :password, :email, :active)');
				$stmt->execute(array(
					':username' => $rez_arr['user'],
					':password' => $rez_arr['pwd'],
					':email' => $rez_arr['mail'],
					':active' => $yes
				));
				*/
			}
			catch(PDOException $e) 
			{
				$error[] = $e->getMessage();
				//print_r($e->getMessage());
			}
		}
	}
}
//if the row was updated redirect the user
if($stmt->rowCount() == 1){

	//redirect to login page
	header('Location: login.php?action=active');
	exit;

} else {
	echo "Активация аккаунта невозможна."; 
}
?>