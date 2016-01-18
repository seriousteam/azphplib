<?php
include('password.php');
require_once(__DIR__.'/../includes/config.php'); 
class User extends Password{

    private $_db;

    function __construct($db){
    	parent::__construct();
    
    	$this->_db = $db;
    }

	private function get_user_hash($username){	

		try {
			$stmt = $this->_db->prepare('SELECT '.$RL_PASSWORD_CONST.' FROM '.$RL_DBTABLE.' WHERE '.$RL_USER_CONST.' = :username AND '.$RL_ACTIVE_CONST."='Yes' ");
			$stmt->execute(array('username' => $username));
			
			$row = $stmt->fetch();
			return $row[$RL_PASSWORD_CONST];

		} catch(PDOException $e) {
		    echo '<p class="bg-danger">'.$e->getMessage().' sdfsdf </p>';
		}
	}

	public function login($username,$password){

		$hashed = $this->get_user_hash($username);
		
		if($this->password_verify($password,$hashed) == 1){
		    
		    $_SESSION['loggedin'] = true;
		    return true;
		} 	
	}
		
	public function logout(){
		session_destroy();
	}

	public function is_logged_in(){
		if(isset($_SESSION['loggedin']) && $_SESSION['loggedin'] == true){
			return true;
		}		
	}
	
}


?>