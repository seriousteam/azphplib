﻿Php файловый менеджер

Состав:

WinFsStreamWrapper.php - обертка для работы с файлами в win

src-min - Ace, редактор, http://ace.c9.io
 
users.php - список пользователей, добавление происходит просто добавлением строки вида:
$userlist[]=array('name'=>'user','pass'=>'1','black_dir'=>'','white_dir'=>'','black_file'=>'','white_file'=>'','default_dir'=>__DIR__."/");
black_dir, white_dir, black_file, white_file фактически php-шные regex-ы. default_dir можно задать для каждого пользователя

auth.php - "модуль" авторизации, есть интересный параметр
$default_dir - папка с которой стартанет менеджер, если не ввести ни какого адреса (имя_сайта/dir.php)
Также там определены параметры админа (admin/1).

dir.php - основной php-шник файлового менеджера