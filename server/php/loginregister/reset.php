<?php require('includes/config.php'); 

//if logged in redirect to members page
if( $user->is_logged_in() ){ header('Location: memberpage.php'); } 

//if form has been submitted process it
if(isset($_POST['submit'])){

	//email validation
	if(!filter_var($_POST[$RL_EMAIL_CONST], FILTER_VALIDATE_EMAIL)){
	    $error[] = 'Введите правильный email.';
	} else {
		$stmt = $db->prepare('SELECT '.$RL_EMAIL_CONST.' FROM '.$RL_DBTABLE.' WHERE '.$RL_EMAIL_CONST.' = :email');
		$stmt->execute(array(':email' => $_POST[$RL_EMAIL_CONST]));
		$row = $stmt->fetch(PDO::FETCH_ASSOC);

		if(empty($row[$RL_EMAIL_CONST])){
			$error[] = 'Введенный email не спользуется.';
		}			
	}
	//if no errors have been created carry on
	if(!isset($error)){

		//create the activasion code
		$token = md5(uniqid(rand(),true));

		try {

			$stmt = $db->prepare("UPDATE ".$RL_DBTABLE." SET ".$RL_RESET_TOKEN_CONST." = :token, ".$RL_RESET_COMPL_CONST."='No' WHERE ".$RL_EMAIL_CONST." = :email");
			$stmt->execute(array(
				':email' => $row[$RL_EMAIL_CONST],
				':token' => $token
			));

			//send email
			$to = $row[$RL_EMAIL_CONST];
			$subject = '=?UTF-8?B?'.base64_encode($RL_RESET_MAIL_SUBJ).'?=';
			$body = $RL_RESET_MAIL_BODY.$RL_DIR."resetPassword.php?key=$token";
			$additionalheaders = "From: <".$RL_SITEEMAIL.">\r\n";
			$additionalheaders .= "Reply-To: $".$RL_SITEEMAIL."";
			mail($to, $subject, $body, $additionalheaders);

			//redirect to index page
			header('Location: login.php?action=reset');
			exit;

		//else catch the exception and show the error.
		} catch(PDOException $e) {
		    $error[] = $e->getMessage();
		}

	}

}

//define page title
$title = 'Reset Account';

//include header template
require('layout/header.php'); 
?>

<div class="container">

	<div class="row">

	    <div class="col-xs-12 col-sm-8 col-md-6 col-sm-offset-2 col-md-offset-3">
			<form role="form" method="post" action="" autocomplete="off">
				<h2>Смена пароля</h2>
				<p><a href='login.php'>Войти</a></p>
				<hr>

				<?php
				//check for any errors
				if(isset($error)){
					foreach($error as $error){
						echo '<p class="bg-danger">'.$error.'</p>';
					}
				}

				if(isset($_GET['action'])){

					//check the action
					switch ($_GET['action']) {
						case 'active':
							echo "<h2 class='bg-success'>".$RL_RESET_LOGOK."</h2>";
							break;
						case 'reset':
							echo "<h2 class='bg-success'>".$RL_RESET_CHK."</h2>";
							break;
					}
				}
				?>

				<div class="form-group">
					<input type="email" name="email" id="email" class="form-control input-lg" placeholder="Адрес Email" value="" tabindex="1">
				</div>
				
				<hr>
				<div class="row">
					<div class="col-xs-6 col-md-6"><input type="submit" name="submit" value="Сменить пароль" class="btn btn-primary btn-block btn-lg" tabindex="2"></div>
				</div>
			</form>
		</div>
	</div>


</div>

<?php 
//include header template
require('layout/footer.php'); 
?>