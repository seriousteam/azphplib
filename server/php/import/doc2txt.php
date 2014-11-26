<?php
$zip = new ZipArchive;
$zip->open($argv[1]) or die("can't open file");
if (($index = $zip->locateName('word/document.xml')) === false) die('content not found');
$data = $zip->getFromIndex($index);

// Load XML from a string
// Skip errors and warnings
$xml = new DOMDocument;
$xml->loadXML($data, LIBXML_NOENT | LIBXML_XINCLUDE | LIBXML_NOERROR | LIBXML_NOWARNING);
// Return data without XML formatting tags
echo strip_tags($xml->saveXML());
?>
