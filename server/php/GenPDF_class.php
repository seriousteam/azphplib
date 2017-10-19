<?php

class GenPDF {
	
	# Сообщение об ошибке, которое увидит пользователь
	private $error_message = 'Что-то пошло не так! Попробуйте пожалуйста попозже!';
	# Путь где будут храниться временные файлы
	private $pathTmpFiles = '';
	
	##
	#
	public function changeErrorMessage($text) {
		$this->error_message = $text;
	}
	
	##
	# 
	public function changePathTmpFiles($path) {
		$this->pathTmpFiles = $path;
	}
	
	##
	# Генерирует имя файла
	private function generateFileName($length = 8) {
		$chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		$count = mb_strlen($chars);

		for ($i = 0, $result = ''; $i < $length; $i++) {
			$index = rand(0, $count - 1);
			$result .= mb_substr($chars, $index, 1);
		}

		return $result;
	}
	
	##
	#
	public function createTmpFile($length = 8, $fileSuf) {
		return $this->generateFileName($length) . '.' . $fileSuf;
	}
	
	##
	# Выполняет PHP файл с параметрами и возвращает html
	public function execPHPFile($filename, $url_params=''){
		if( $curl = curl_init() ) {
			//echo 'http://localhost/ais/vak/templates/'.$filename.'.php?rid='.$_REQUEST['rid'].'&org='.$_REQUEST['org'].$url_params.'<br>';
			curl_setopt( $curl, CURLOPT_URL, 'localhost/ais/vak/templates/' . $filename . '.php?' . $url_params );
			curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
			curl_setopt( $curl, CURLOPT_FOLLOWLOCATION, false );
			curl_setopt( $curl, CURLOPT_COOKIE, 'Uname='.$_COOKIE['Uname'].';Upass='.$_COOKIE['Upass']);
			$out = curl_exec($curl);
			curl_close($curl);
			return $out;		
		} else {
			return $this->error_message;
		}
	}

	##
	# Создаёт PDF файл на основе html файла с параметрами
	public function createPDF($src, $settings='') {
		$des = $this->pathTmpFiles . $this->generateFileName() . '.pdf';
		$cmd = '\is-site\tools\wkhtmltopdf\wkhtmltopdf.exe --print-media-type '.$settings.' --disable-smart-shrinking \is-site\tmp\in_tmp.html '.$des;
		file_put_contents('/is-site/tmp/cmd.txt', $cmd);
		file_put_contents('/is-site/tmp/in_tmp.html', $src);

		exec($cmd);
		
		return $des;
	}
	
	##
	#
	public function createPDFfromPHP($filename, $url_params='', $settings='') {
		return $this->createPDF($this->execPHPFile($filename, $url_params), $settings);
	}

	##
	# 
	public function getCountPages($document) {
		if ( !file_exists($document) ) {
			return -1;
		}
		
		$cmd = '\is-site\tools\xpdf\bin32\pdfinfo.exe';

		exec("$cmd \"$document\"", $output);

		$pagecount = 0;
		foreach($output as $op){
			if(preg_match("/Pages:\s*(\d+)/i", $op, $matches) === 1){
				$pagecount = intval($matches[1]);
				break;
			}
		}
		return $pagecount;
	}

	##
	#
	public function mergePDF($des, $files) {
		include 'C://is-site/tools/PDFMerger/PDFMerger.php';

		$pdf = new PDFMerger;

		foreach ($files as $f) {
			$pdf->addPDF($f, 'all');
		}
		$pdf->merge('file', $des);
	}

	##
	# Отобразить PDF файл пользователю в браузере и удалить его с сервера по условию
	public function showFileInline($src, $output_name, $is_need_unlink=false, $unlinked_files=[]) {
		if ( file_exists($src) ) {
			header('Content-type: application/pdf');
			header('Content-Disposition: inline; filename="'.$output_name.'.pdf"');
			readfile($src);
			if($is_need_unlink) {
				unlink($src);
				foreach($unlinked_files as $f) {
					unlink($f);
				}
			}
		} else {
			echo $this->error_message;
		}
	}
	
	##
	#
	public function mergeAndShowPDF($output_name, $files, $is_need_unlink=false) {
		$des = $this->pathTmpFiles . $this->generateFileName() . '.pdf';
		$this->mergePDF($des, $files);
		$this->showFileInline($des, $output_name, $is_need_unlink, $files);
	}
}

