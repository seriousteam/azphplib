<?php
$G_ENV_LOCAL_USERS  = [
   '/.*/' => "PHP:check_user_login"
	];

$G_LIBS_LIST = ['//az/lib/editing3.css', '//az/lib/editing3-ru.css', '//az/lib/choco.js', '//az/lib/editing3.js'];

function check_user_login($user, $pass, $ip = null) {
	$dbh = get_connection('');
	$stmt = $dbh->prepare("SELECT roles, pass FROM users u WHERE login = ? AND pass IS NOT NULL");
	try {	
		$stmt->execute([$user]);
		$r = $stmt->fetch(PDO::FETCH_OBJ);
		if(!$r) return null;
		if(!$r->roles) return null;
		if( $r->pass == '*LDAP*') {
			global $main_cfg;
			if( $ldapcfg = @$main_cfg['ldap'] ) {
				if( $ldapcfg['server'] && $ldapcfg['domain'] ) {
					$ldap = @ldap_connect($ldapcfg['server']);
					if ( $ldap ) {
						$domain = implode( ',', array_map( function($d) { return "DC=$d"; }, explode('.',$main_cfg['ldap']['domain']) ) );
						if ( !empty($pass) && $result = @ldap_bind( $ldap,"CN=$user,CN=Users,$domain", $pass ) ) {
		        	preg_match_all('/[a-zA-Z0-9_]+/',$r->roles, $m);
							foreach( $m[0] as $x) $ret[$x] = 'D';
							return $ret;
						}
						@ldap_close($ldap);
					}
				}
			}
			return null;
		} else if($r->pass !== $pass) {
			return null;
		}
		preg_match_all('/[a-zA-Z0-9_]+/',$r->roles, $m);
		foreach( $m[0] as $x) $ret[$x] = 'D';
		return $ret;
	} catch(Exception $e) { die($e); }
}
