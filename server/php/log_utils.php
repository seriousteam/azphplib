<?php

function strlen_utf8( $s ) { return mb_strlen( $s, 'UTF-8' ); }
function substr_utf8( $s, $start, $length = NULL ) { return mb_substr( $s, $start, $length, 'UTF-8' ); }

// log/debug utils
define( "LOG_MAX_VAL_STR_LEN", 240 ); // максимальная длина строкового представления значения переменной в логе

define( "MY_LOG_FILE", sys_get_temp_dir()."/_my.log" );
define( "MY_LOG_DATA_DIR", sys_get_temp_dir()."/_my_data.log" );

function LOG_ENABLE() { define( "LOG_ENABLED", true ); }

function LOG_IS_ENABLED() { return defined( "LOG_ENABLED" ); }

function LOG_CLEAR()
{
	if( LOG_IS_ENABLED() )
		file_put_contents( MY_LOG_FILE, '' );
}

function _logMsg( $type, $msg )
{
	if( !LOG_IS_ENABLED() )
		return;

	static $flags = 0;
	file_put_contents( MY_LOG_FILE, "$type: $msg\n", $flags );
	$flags = FILE_APPEND;
}

function _writeLongValToDataFile( $val )
{
	static $logDataFileNum = 1;
	static $createDirForDFs = true;

	$DATA_FILE_DIR = MY_LOG_DATA_DIR;

	if( $createDirForDFs )
	{
		@mkdir( $DATA_FILE_DIR );
		array_map( 'unlink', glob( "$DATA_FILE_DIR/*.*" ) );
		$createDirForDFs = false;
	}

	if( is_string( $val ) )
	{
		$ext = "txt";
		if( substr( $val, 0, 6 ) == '<?xml ' )
			$ext = "xml";
		else
			if( substr_compare( $val, "<html>", 0, 6, true ) == 0 || substr_compare( $val, "<!doctype html>", 0, 15, true ) == 0 )
				$ext = "html";
	}
	else
	{
		$ext = "json";
		$val = json_encode( $val, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
	}

	$logDataFile = "$DATA_FILE_DIR/_log_data_".sprintf( "%05d", $logDataFileNum++ ).".$ext";
	file_put_contents( $logDataFile, $val );
	return $logDataFile;
}

function LOG_DEBUG( $msg, $vars = null )
{
	if( !LOG_IS_ENABLED() )
		return;

	$extraMsg = "";
	if( !is_null( $vars ) )
		foreach( $vars as $n => $v )
		{
			$valStr = json_encode( $v, JSON_UNESCAPED_UNICODE /*| JSON_PRETTY_PRINT*/ );
			if( $valStr === false )
				$valStr = "<json_encode error: ".descrLastJSONError().">";
			else
				if( strlen_utf8( $valStr ) > LOG_MAX_VAL_STR_LEN )
				{
					try
					{
						$logDataFile = _writeLongValToDataFile( $v );
						$extraMsg .= "\nDEBUG: Note: '$n' value is too long; written to separate file '$logDataFile'";
					}
					catch( Exception $e ) {}
					$valStr = substr_utf8( $valStr, 0, LOG_MAX_VAL_STR_LEN - 3 )."...";
				}
			$msg .= ", $n= $valStr";
		}

	_logMsg( "DEBUG", $msg.$extraMsg );
}
