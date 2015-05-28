<?php require('includes/config.php'); 

//if logged in redirect to members page
if( $user->is_logged_in() ){ header('Location: memberpage.php'); } 

$stmt = $db->prepare('SELECT '.RESET_TOKEN_CONST.', '.RESET_COMPL_CONST.' FROM '.DBTABLE.' WHERE '.RESET_TOKEN_CONST.' = :token');
$stmt->execute(array(':token' => $_GET['key']));
$row = $stmt->fetch(PDO::FETCH_ASSOC);

//if no token from db then kill the page
if(empty($row[RESET_TOKEN_CONST])){
	$stop = RESET_INV_TOKEN;
} elseif($row[RESET_COMPL_CONST] == 'Yes') {
	$stop = RESET_ALR_CHANGED;
}

//if form has been submitted process it
if(isset($_POST['submit'])){

	//basic validation
	if(strlen($_POST[PASSWORD_CONST]) < 3){
		$error[] = 'Пароль слинком короткий.';
	}

	if($_POST[PASSWORD_CONST] != $_POST['passwordConfirm']){
		$error[] = 'Пароли не совпадают.';
	}

	//if no errors have been created carry on
	if(!isset($error)){

		//hash the password
		$hashedpassword = $user->password_hash($_POST[PASSWORD_CONST], PASSWORD_BCRYPT);

		try {

			$stmt = $db->prepare("UPDATE ".DBTABLE." SET ".PASSWORD_CONST." = :hashedpassword, ".RESET_COMPL_CONST." = 'Yes'  WHERE ".RESET_TOKEN_CONST." = :token");
			$stmt->execute(array(
				':hashedpassword' => $hashedpassword,
				':token' => $row[RESET_TOKEN_CONST]
			));

			//redirect to index page
			header('Location: login.php?action=resetAccount');
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


	    	<?php if(isset($stop)){

	    		echo "<p class='bg-danger'>$stop</p>";

	    	} else { ?>

				<form role="form" method="post" action="" autocomplete="off">
					<h2>Смена пароля</h2>
					<hr>

					<?php
					//check for any errors
					if(isset($error)){
						foreach($error as $error){
							echo '<p class="bg-danger">'.$error.'</p>';
						}
					}

					//check the action
					switch (@$_GET['action']) {
						case 'active':
							echo "<h2 class='bg-success'>".RESET_LOGOK."</h2>";
							break;
						case 'reset':
							echo "<h2 class='bg-success'>".RESET_CHK."</h2>";
							break;
					}
					?>

					<div class="row">
						<div class="col-xs-6 col-sm-6 col-md-6">
							<div class="form-group">
								<input type="password" name="password" id="password" class="form-control input-lg" placeholder="Пароль" tabindex="1">
							</div>
						</div>
						<div class="col-xs-6 col-sm-6 col-md-6">
							<div class="form-group">
								<input type="password" name="passwordConfirm" id="passwordConfirm" class="form-control input-lg" placeholder="Повторите пароль" tabindex="1">
							</div>
						</div>
					</div>
					
					<hr>
					<div class="row">
						<div class="col-xs-6 col-md-6"><input type="submit" name="submit" value="Сменить пароль" class="btn btn-primary btn-block btn-lg" tabindex="3"></div>
					</div>
				</form>

			<?php } ?>
		</div>
	</div>


</div>

<?php 
//include header template
require('layout/footer.php'); 
?>