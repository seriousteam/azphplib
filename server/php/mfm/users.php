<?php
require_once(__DIR__.'/../cfg.php');
$users_dafaults = array('black_dir'=>'','white_dir'=>'','black_file'=>'','white_file'=>'','default_dir'=>__DIR__."/");
foreach($a_mfm_users as $k=>$v) {
    $k = explode('.',$k);
    $users[$k[0]][$k[1]] = $v; 
}
$users = array_map(function($v) {
    global $users_dafaults;
    return array_merge($users_dafaults, $v);
},$users);
foreach($users as $u=>$v) {
    $v['name'] = $u;
    $userlist[]=$v;
}