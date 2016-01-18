<?php require('includes/config.php'); 

//if logged in redirect to members page
if( $user->is_logged_in() ){ header('Location: memberpage.php'); } 

//if form has been submitted process it
if(isset($_POST['submit'])){

	//very basic validation
	if(strlen($_POST[$RL_USER_CONST]) < 3){
		$error[] = 'Имя пользователя слишком короткое.';
	} else {
		$stmt = $db->prepare('SELECT '.$RL_USER_CONST.' FROM '.$RL_DBTABLE.' WHERE '.$RL_USER_CONST.' = :username');
		$stmt->execute(array(':username' => $_POST[$RL_USER_CONST]));
		$row = $stmt->fetch(PDO::FETCH_ASSOC);
		if(!empty($row[$RL_USER_CONST])){
			$error[] = 'Имя пользователя уже используется.';
		}			
	}
	if(strlen($_POST[$RL_PASSWORD_CONST]) < 3){
		$error[] = 'Пароль слишком короткий.';
	}

	if($_POST[$RL_PASSWORD_CONST] != $_POST['passwordConfirm']){
		$error[] = 'Пароли не совпадают.';
	}

	//email validation
	if(!filter_var($_POST[$RL_EMAIL_CONST], FILTER_VALIDATE_EMAIL)){
	    $error[] = 'В веденном email есть ошибки';
	} else {
		$stmt = $db->prepare('SELECT '.$RL_EMAIL_CONST.' FROM '.$RL_DBTABLE.' WHERE '.$RL_EMAIL_CONST.' = :email');
		$stmt->execute(array(':email' => $_POST[$RL_EMAIL_CONST]));
		$row = $stmt->fetch(PDO::FETCH_ASSOC);

		if(!empty($row[$RL_EMAIL_CONST])){
			$error[] = 'Данный email уже используется.';
		}			
	}
	//if no errors have been created carry on
	if(!isset($error)){

		//hash the password
		$hashedpassword = $user->password_hash($_POST[$RL_PASSWORD_CONST], PASSWORD_BCRYPT);

		//create the activasion code
		$activasion = md5(uniqid(rand(),true));
		$body = $RL_REG_MAIL_HEAD;
		$link=$RL_DIR."activate.php";
		try {
			//insert into database with a prepared statement
			$argarr=$_REQUEST;			
			$argarr[$RL_PASSWORD_CONST]=$hashedpassword;
			// unset tresh
			$trasharr=array("passwordConfirm","submit","action");
			foreach($trasharr as $trsh) unset($argarr[$trsh]);
			if ($RL_CREATE_USER_IN_LINK!="yes")
			{	
				$argarr[$RL_ACTIVE_CONST]=$activasion;
				$sql="INSERT INTO ".$RL_DBTABLE."(".implode(array_keys($argarr),",").") VALUES (?"
					.str_repeat(",?",count($argarr)-1).")";				
				$stmt = $db->prepare($sql);
				$stmt->execute(array_values($argarr));
				$link.="?y=".urlencode($activasion);
			}
			else
			{	
				// activate user
				$argarr[$RL_ACTIVE_CONST]="Yes";
				$link.="?activasion=".urlencode(rm_encrypt(http_build_query($argarr),$RL_CRYPT_KEY));				
			}

			//send email
			$to = "<".$_POST[$RL_EMAIL_CONST].">";//'=?UTF-8?B?'.base64_encode($email_subject).'?='
			$subject ='=?UTF-8?B?'.base64_encode($RL_REG_MAIL_SUBJ).'?=';
			$body.=" ".$link." ".$RL_REG_MAIL_END;
			$additionalheaders = "From: <".$RL_SITEEMAIL.">\r\n\"Content-type: text/plain; charset=utf-8\";\r\n";
			$additionalheaders .= "Reply-To: ".$RL_SITEEMAIL."";
			mail($to, $subject, $body, $additionalheaders);
			
			//redirect to index page
			header('Location: index.php?action=joined');
			exit;

		//else catch the exception and show the error.
		} catch(PDOException $e) {
		    $error[] = $e->getMessage();
		}

	}

}

//define page title
$title = 'Logon';

//include header template
require('layout/header.php'); 
?>


<div class="container">

	<div class="row">

	    <div class="col-xs-12 col-sm-8 col-md-6 col-sm-offset-2 col-md-offset-3">
			<form role="form" method="post" action="" autocomplete="off">
				<h2>Пройдите регистрацию</h2>
				<p>Уже зарегистрированы? <a href='login.php'>Войти</a></p>
				<hr>

				<?php
				//check for any errors
				if(isset($error)){
					foreach($error as $error){
						echo '<p class="bg-danger">'.$error.'</p>';
					}
				}

				//if action is joined show sucess
				if(isset($_GET['action']) && $_GET['action'] == 'joined'){
					echo "<h2 class='bg-success'>Проверьте email для завершения регистрации.</h2>";
				}
				?>

				<div class="form-group">
					<input type="text" name="username" id="username" class="form-control input-lg" placeholder="Имя пользователя" value="<?php if(isset($error)){ echo $_POST['username']; } ?>" tabindex="1">
				</div>
				<div class="form-group">
					<input type="email" name="email" id="email" class="form-control input-lg" placeholder="Адрес еmail" value="<?php if(isset($error)){ echo $_POST['email']; } ?>" tabindex="2">
				</div>
				<div class="row">
					<div class="col-xs-6 col-sm-6 col-md-6">
						<div class="form-group">
							<input type="password" name="password" id="password" class="form-control input-lg" placeholder="Пароль" tabindex="3">
						</div>
					</div>
					<div class="col-xs-6 col-sm-6 col-md-6">
						<div class="form-group">
							<input type="password" name="passwordConfirm" id="passwordConfirm" class="form-control input-lg" placeholder="Подтверждение пароля" tabindex="4">
						</div>
					</div>
				</div>
				
				<div class="row">
					<div class="col-xs-6 col-md-6"><input type="submit" name="submit" value="Зарегистрироваться" class="btn btn-primary btn-block btn-lg" tabindex="5"></div>
				</div>
			</form>
		</div>
	</div>

</div>

<?php 
//include header template
require('layout/footer.php'); 
?>
