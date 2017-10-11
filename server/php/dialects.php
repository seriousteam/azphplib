<?php
$seqcmd = array(
		'pgsql' => "select nextval('mainseq')"
		, 'mssql'=> "declare @a int; exec @a = GetNewSeqVal_mainseq; select @a;"
		);
		
$type_translations_db_to_internal = array(
	'default' => array(
		'VARCHAR' => 'VARCHAR', //eq NVARCHAR
		'CHAR' => 'CHAR',
		'DECIMAL' => 'DECIMAL',
		'INTEGER' => 'INTEGER',
		//FLOAT...
		'DATE' => 'DATE',
		'TIMESTAMP' => 'TIMESTAMP',
		'TIME' => 'TIME',
		'CLOB' => 'CLOB',
		'BLOB' => 'BLOB'
		),
	'pgsql' => array(
		'character varying' => 'VARCHAR', //eq NVARCHAR
		'character' => 'CHAR',
		'numeric' => 'DECIMAL',
		'integer' => 'INTEGER',
		//FLOAT...
		'date' => 'DATE',
		'timestamp without time zone' => 'TIMESTAMP', //better to work with(!) timezone!
		'time with time zone' => 'TIME',
		'text' => 'CLOB',
		'bytea' => 'BLOB'
		)
);

//TODO
// function to get current seq value 1) as char 2) as int
// server function to get seq value, based on client seq and rownum

//TODO: set like escape, the best way - always choose  
// LIKE .... ESCAPE char
/*
	default escape
	orcale - none
	pg - \
	my - \
	ms - none
*/

//REGEXP
/*
	pg:			e ~ re (posix)
				e SIMILAR TO semiregexp
	orcale: 		e regexp_like re (posix)
	ms:			e LIKE like+square brackets
	my:			e REGEXP re
*/



function replace_dbspecific_funcs($cmd, $dialect, $dump=false) {
	static $repl = [
		'pgsql'=> [[],[]],
		'oracle'=> [[],[]],
		'mssql'=> [['||'],["+''+"]],
		'mysql'=> [[],[]],
	];
	static $fdef = [
		'LN' => [ 'mssql' => 'LOG' ],
		'IS DISTINCT' => ['pgsql' => '$1$2$5 IS DISTINCT FROM $1$4$5',
				 'mysql' => 'NOT $1$2 <=> $4$5' ,
				 'mssql' => 'NOT EXISTS$1SELECT $2 INTERSECT SELECT $4$5' ,
				 'oracle' => 'NOT EXISTS$1SELECT $2 FROM dual INTERSECT SELECT $4 FROM dual$5' ,
				],
		'IS NOT DISTINCT' => ['pgsql' => '$1$2$5 IS NOT DISTINCT FROM $1$4$5',
				 'mysql' => '$2 <=> $4' ,
				 'mssql' => 'EXISTS$1SELECT $2 INTERSECT SELECT $4$5' ,
				 'oracle' => 'EXISTS$1SELECT $2 FROM dual INTERSECT SELECT $4 FROM dual$5' ,
				],
		'HEX2BIN' => [ 'mssql' => 'CONVERT$1VARBINARY(MAX),$2,2$3' ],

		'TRUNC' => [ 'pgsql' => 'TRUNC', 'oracle' => 'TRUNC', 'mssql' => 'ROUND$1$2,1$3', 'mysql' => 'TRUNCATE' ],
		'POSITION' => [ 'mssql' => 'CHARINDEX', 'pgsql' => 'POSITION$1$2 IN $4$5', 'oracle' => 'INSTRC$1$4$3$2$5', 'mysql' => 'POSITION$1$2 IN $4$5'],
		'SUBSTRING' => [ 'pgsql' => 'SUBSTR', 'oracle' => 'SUBSTR', 'mssql' => 'SUBSTRING', 'mysql' => 'SUBSTRING' ],
		'LENGTH' => [ 'pgsql' => 'LENGTH', 'oracle' => 'LENGTHC', 'mssql' => "LEN$1REPLACE($2,' ','_')$3", 'mysql' => 'CHAR_LENGTH' ],

		'CONCAT' => [ 'pgsql' => 'CONCAT$1$2$3$4$5' ],
		'CONCAT_WS' => [ 'pgsql' => 'CONCAT_WS$1\' \', $2$3$4$5' ],
		'TITLE' => [ 'pgsql' => '$1SUBSTR($2,1,1)||\'.\'$3' ],
		
		'TO_DATE' => [ 'pgsql' => '$1$2$3::date', 
				'oracle' => 'TRUNC$1$2$3', 
				'mssql' => 'dateadd$1dd, datediff(dd,0,$2), 0$3', 
				'mysql' => 'DATE$1$2$3' ],
		'YEAR' => [ 'pgsql' => 'DATE_PART$1\'year\',$2$3', 
				'oracle' => 'EXTRACT$1year FROM $2$3', 
				'mssql' => 'YEAR', 
				'mysql' => 'YEAR' ],
		'MONTH' => [ 'pgsql' => 'DATE_PART$1\'month\',$2$3', 
				'oracle' => 'EXTRACT$1month FROM $2$3', 
				'mssql' => 'MONTH', 
				'mysql' => 'MONTH' ],
		'DAY' => [ 'pgsql' => 'DATE_PART$1\'day\',$2$3', 
				'oracle' => 'EXTRACT$1day FROM $2$3', 
				'mssql' => 'DAY', 
				'mysql' => 'DAY' ],
		'DATE_TO_MONTHS' => [ 
				'pgsql' => 'TO_CHAR$1$2,\'yyyy-mm\'$3', 
				'oracle' => 'TO_CHAR$1$2,\'yyyy-mm\')$3', 
				'mssql' => 'LEFT$1CONVERT<varchar,$2,120),7$3', 
				'mysql' => 'DATE_FORMAT$1$2,\'%Y-%m\'$3' ],
		'MONTHS_BETWEEN' => [
				'pgsql' => 
						"$1 SELECT DATE_PART('year', mbw.d1)*12 + DATE_PART('month', mbw.d1) - DATE_PART('year', mbw.d2)*12 - DATE_PART('month', mbw.d2) FROM ( SELECT $2 AS d1 $3 $4 AS d2 ) mbw $5",
				'oracle' => "MONTH_BETWEEN$1 TRUNC($2,'month') $3 TRUNC($4,'month') $5",
				'mssql' => "DATEDIFF$1month, $4 $3 $2 $5",// --chage order
				'mysql' => "PERIOD_DIFF$1 date_format($2, '%Y%m') $3 date_format($4, '%Y%m') $5",
				],
		'DAYS_BETWEEN' => [
				'pgsql' => 
						"DATE_PART$1'day',($2)::TIMESTAMP - ($4)::TIMESTAMP $5",
				'oracle' => "$1 TRUNC($2) - (TRUNC($4) $5",
				'mssql' => "DATEDIFF$1day, $4 $3 $2 $5",// --chage order
				'mysql' => "DATEDIFF$1$2$3$4$5",
				],
		'ADD_DAYS' => [
				'pgsql' => "$1 ($2) +  CAST($4 || ' DAY' AS INTERVAL) $5",
				'oracle' => "$1 ($2) + INTERVAL $4 DAY$5",
				'mssql' => "DATEADD$1day, $4 $3 $2 $5",// --chage order
				'mysql' => "$1 ($2) + INTERVAL $4 DAY$5",
				],
		'ADD_MONTHS' => [
				'pgsql' => "$1 ($2) + CAST($4 || ' MONTH' AS INTERVAL) $5",
				'oracle' => "$1 ($2) + INTERVAL $4 MONTH$5",
				'mssql' => "DATEADD$1month, $4 $3 $2 $5",// --chage order
				'mysql' => "$1 ($2) + INTERVAL $4 MONTH$5",
				],
		'NOW()' => [ //with timezone, if possible!
				'pgsql' => "CURRENT_TIMESTAMP",
				'oracle' => "CURRENT_TIMESTAMP",
				'mssql' => "CURRENT_TIMESTAMP",
				'mysql' => "CURRENT_TIMESTAMP",
				],
		'TODAY()' => [ 
				'pgsql' => "CURRENT_DATE",
				'oracle' => "CURRENT_DATE ", //servel local
				'mssql' => "CAST(CURRENT_TIMESTAMP AS DATE)", //servel local
				'mysql' => "CURRENT_DATE", //server local
				],
		'TRUE.' => [ 
				'pgsql' => "TRUE",
				'oracle' => "1",
				'mssql' => "1",
				'mysql' => "1",
				],
		'FALSE.' => [ 
				'pgsql' => "FALSE",
				'oracle' => "0",
				'mssql' => "0",
				'mysql' => "0",
				],
		'XSESSION_([A-Z_0-9]+)()' =>
				[
				'pgsql' => "current_setting('svar_x.$1')",
				'oracle' => "XSESSION!",
				'mssql' => "(SELECT val FROM #svar_x_$1)",
				'mysql' => "XSESSION!",
				],
		'DBSESSION_([A-Z_0-9]+).' =>
				[
				'pgsql' => "current_setting('svar_x.$1')",
				'oracle' => "XSESSION!",
				'mssql' => "(SELECT val FROM #svar_x_$1)",
				'mysql' => "XSESSION!",
				],
		'DBSESSIONINT_([A-Z_0-9]+).' =>
				[
				'pgsql' => "CAST(current_setting('svar_x.$1') AS INTEGER)",
				'oracle' => "XSESSION!",
				'mssql' => "(SELECT val FROM #svar_x_$1)",
				'mysql' => "XSESSION!",
				],
		'FIELD_PART' => [
				'mssql' => 'dbo.FIELD_PART$1$2$3'
				],
		'FP' => [
				'mssql' => 'dbo.FP$1$2$3'
				],
		'PARTS' =>
				[
				'pgsql' => '$1SELECT REGEXP_SPLIT_TO_TABLE($2, E\'#\')$3'
				],
		'SAME' =>
				[
				'pgsql' => "$1CASE COUNT(*) WHEN COUNT($2) THEN (SELECT MIN($2) INTERSECT SELECT MAX($2)) END$3",
				'oracle' => "$1CASE COUNT(*) WHEN COUNT($2) THEN (SELECT MIN($2) FROM DUAL INTERSECT SELECT MAX($2) FROM DUAL) END$3",
				'mssql' => "$1CASE COUNT(*) WHEN COUNT($2) THEN (SELECT MIN($2) INTERSECT SELECT MAX($2)) END$3",
				'mysql' => "$1CASE COUNT(*) WHEN COUNT($2) THEN (SELECT MIN($2) INTERSECT SELECT MAX($2)) END$3"
				],
	];
	static $frepl_from = null;
	static $frepl_to = null;
	if(!$frepl_from) {
		$frepl_from = array_fill_keys(array_keys($repl), []);
		$frepl_to = array_fill_keys(array_keys($repl), []);
		foreach($fdef as $f=>$def)
			foreach($def as $d => $v) {
				if(strstr($v, '$5')) {
					//works at any(!) level, but take max area as argument, need levelization
					$frepl_from[$d][] = 
						array_map(function($X) use($f) {
							return "/(?<=^|[^a-zA-Z0-9_])$f\s*(~$X<)(.*?)(~$X~)(.*?)(>$X~)/";
						}, range(0,30) );
					$frepl_to[$d][] = $v;
				} else
				if(strstr($v, '$3')) {
					//works at any(!) level, but take max area as argument, need levelization
					$frepl_from[$d][] = 
						array_map(function($X) use($f) {
							return "/(?<=^|[^a-zA-Z0-9_])$f\s*(~$X<)(.*?)(>$X~)/";
						}, range(0,30) );
					$frepl_to[$d][] = $v;
				} else {
					//works at all(!) levels at once
					$frepl_from[$d][] = 
						str_replace(
							['()(?=\s*~)', '.(?=\s*~)'], 
							['(?:\s*~\d+<\s*>\d+~)', '(?=$|[^a-zA-Z0-9_])'], 
							"/(?<=^|[^a-zA-Z0-9_])$f(?=\s*~)/");
					$frepl_to[$d][] = $v;
				}
			}
	}
	if($dump) {var_dump($frepl_from['pgsql'][25], $frepl_to['pgsql'][25], (string)$cmd); }
	$cmd = levelized_process($cmd,
		function($s, $lvl) use($frepl_from, $frepl_to, $dialect, $dump) {
			foreach($frepl_from[$dialect] as $k=>$v)
				$s = preg_replace(
					is_array($v) ? $v[$lvl] : $v,
					$frepl_to[$dialect][$k],
					$s);
			return $s;
		}
	);
	if($dump) {
		var_dump($cmd); 
	}
	return str_replace($repl[$dialect][0], $repl[$dialect][1], (string)$cmd);
}

//use it before subst constants or subselects
//TODO: escape \
class dbspecific_select {
	var $select = '';
	var $cmd = null;
	var $parsed = null;
	var $table = '';
	var $alias = '';
	function __construct($cmd, $select, $parsed) {
		$this->cmd = $cmd;
		$this->select = $select;
		$this->parsed = $parsed;
		//main_table_of_many($parsed->FROM, $this->table, $this->alias, false);
	}
	function __toString() { return $this->cmd->doToString($this->select); }
}
function make_dbspecific_select($cmd, $parsed, $dialect) {
	$sel = $parsed;
	switch($dialect) {
		case 'oracle': 
		  if(isset($parsed->LIMIT)) {
		    $l = $parsed->LIMIT; $parsed->LIMIT = '';
		    $sel = "SELECT * FROM ( $parsed ) WHERE ROWNUM <= $l";
	 	    $parsed->LIMIT = $l;
		  }
		  break;
		case 'mssql': 
		 if(isset($parsed->LIMIT)) {
		    $l = $parsed->LIMIT; $parsed->LIMIT = '';
		    $sel = preg_replace('/^(\s*SELECT\s)/i', "$1TOP $l ", $parsed );
	 	    $parsed->LIMIT = $l;
		 }
		  break;
	}
	//echo $sel;
	return new dbspecific_select($cmd, replace_dbspecific_funcs($sel, $dialect), $parsed);
}

//FIXME: we should take alias from command! not from outside
function main_table_of_many($tables, &$main_table, &$alias, $table_requried = true) {
	global $RE_ID;
	if(preg_match("/^\s*($RE_ID(?:\.$RE_ID)?)\s+($RE_ID)?\s*$/", $tables, $m)) { 
		$main_table = $m[1];
		$alias = $m[2];
		return false; //one table
	}
	if(!preg_match("/^\s*($RE_ID(?:\.$RE_ID)?)\s+($RE_ID)\s/", $tables, $m))
		if($table_requried)
			throw new Exception("Can't find main table and it's alias in $tables");
		else
			return;
	$main_table = $m[1];
	$alias = $m[2];
	return true;
}

function make_dbspecific_insert_from_select($parsed, $sel, $dialect) {
	// in select part we have processed everyting before!
	switch($dialect) {
	}
	global $RE_ID;
	$ii = $parsed->{'INSERT INTO'};
	$ii = preg_replace_callback("/^\s*($RE_ID)/"
		, function ($m) {return _XNode::tableName($m[1]);}
		, $ii
	);
	$ii = preg_replace("/(\(|,)\s*($RE_ID)/", '$1 "$2"', $ii);
	
	return "INSERT INTO $ii $sel"; //nothing to do here!
}

function make_dbspecific_select_values($cmd, $dialect) {
  if($dialect == 'oracle') return 'SELECT '.$cmd.' FROM DUAL';
  return 'SELECT '.$cmd;
}

function lastInsertedId_oracle($table) {
	static $s = "SELECT SYS_CONTEXT('CLIENTCONTEXT', 'lastInsertId') FROM DUAL";
	$dbc = get_connection($table);
	if(is_string($s)) $s = $dbc->prepare(stmt);
	$s->execute();
	return $s->fetchColumn();
}
function lastInsertedId_mysql($table) {
	$dbc = get_connection($table);
	return $dbc->lastInsertId();
}

function make_dbspecific_insert_values($parsed, $values_select, $autopk, $dialect) {
	global $RE_ID;
	$values_select = $values_select ?: $parsed->_VALUES;
	$tbl = '';
	$ii = $parsed->{'INSERT INTO'};
	$ii = preg_replace_callback("/^\s*($RE_ID)/"
		, function ($m) use(&$tbl) {return _XNode::tableName($tbl = $m[1]);}
		, $ii
	);
	
	$ii = preg_replace("/(\(|,)\s*($RE_ID)/", '$1 "$2"', $ii);
	
	if($autopk) {
		switch($dialect) {
		case 'orcale':
			$res = "/*lastInsertedId_oracle:$tbl*/ declare pk number; begin
				INSERT INTO $ii $values_select returning $autopk into pk;
				DBMS_SESSION.SET_CONTEXT ( 'CLIENTCONTEXT', 'lastInsertId', pk ); end;
			"; break;
		case 'mysql':
			$res = "/*lastInsertedId_mysql:$tbl*/ INSERT INTO $ii $values_select"; break;
		case 'mssql':
			$res = "INSERT INTO $ii output inserted.$autopk $values_select"; break;
		case 'pgsql':
			$res = "INSERT INTO $ii $values_select returning $autopk"; break;
		}
	}
	else
		$res = "INSERT INTO $ii $values_select";

	return replace_dbspecific_funcs($res, $dialect);
}

//check every database if we have to have aliases in multitable update at left side if '='
// (if field reside in two tables)
function make_dbspecific_update($parsed, $dialect) {
	global $RE_ID;
	
	$ret = $parsed;
	
	//replace filed= ==> "field"=
	$set = preg_replace("/(^|,)\s*($RE_ID)\s*=/", '$1 "$2"=', $parsed->SET);
	//TODO: quote WHERE and EXPRESSION in set and FROM (they are aliased!)
	
	if(main_table_of_many($parsed->UPDATE, $main_table, $alias)) {
		switch($dialect) {
		case 'pgsql':
		  $ret = "UPDATE $main_table xx SET $set FROM $parsed->UPDATE WHERE xx.* IS NOT DISTINCT FROM $alias.*"
		    .(@$parsed->WHERE? " AND ( $parsed->WHERE )":'');
		  break;
		case 'oracle':
		  //UPDATE t SET f = v WHERE c ==> UPDATE (SELECT a1.*, v AS xx__f WHERE c) SET f = xx__f
		  // NOTE: this KEEP order of placeholders (should be SET before WHERE)
		  $lst = preg_split("/(?:^|,) \"($RE_ID)\"=/", $set, 
				    null, PREG_SPLIT_DELIM_CAPTURE|PREG_SPLIT_NO_EMPTY);
		  $set = [];
		  do{
		    $f = current($lst);
		    $set[] =  "\"$f\" = xx_$f";
		    $exprs[] = next($lst) ." AS xx_$f";
		  }while(next($lst));
		  $set = strlist($set);
		  $exprs = strlist($exprs);
		  $ret = "UPDATE (SELECT $alias.*, $exprs FROM $parsed->UPDATE $parsed->_WHERE) SET $set";
		  break;
		case 'mssql': 
			$ret = "UPDATE $alias SET $set FROM $parsed->UPDATE $parsed->_WHERE"; 
			break;
		case 'mysql': 
		  // we need return aliases back!
		  $set = preg_replace("/(^|,)\s*(\"$RE_ID\")\s*=/", "$1 $alias.$2 =", $set);
		  $ret = "$parsed->_UPDATE SET $set $parsed->_WHERE"; 
		  break;
		}
	} else {
		switch($dialect) {
		case 'mssql': 
			if($alias) 
				$ret = "UPDATE $alias SET $set FROM $parsed->UPDATE $parsed->_WHERE"; 
			break;
			default:
			$ret = "$parsed->_UPDATE SET $set $parsed->_WHERE";
		}
	}
	return replace_dbspecific_funcs($ret, $dialect);
}
function make_dbspecific_delete($parsed, $dialect) {
	$ret = $parsed;

	//TODO: quote WHERE and FROM (they are aliased!)
	
	if(main_table_of_many($from = $parsed->{'DELETE FROM'}, $main_table, $alias)) {
		switch($dialect) {
		case 'pgsql':
			$ret = "DELETE $main_table xx FROM $from WHERE xx.* IS NOT DISTINCT FROM $alias.*"
					.(@$parsed->WHERE? " AND ( $parsed->WHERE )":'');
			break;
		case 'oracle': 
			$ret = "DELETE FROM (SELECT $alias.* FROM $from $parsed->_WHERE)"; break;
		case 'mssql': $ret = "DELETE $alias FROM $from $parsed->_WHERE"; break;
		case 'mysql': $ret = "DELETE $alias FROM $from $parsed->_WHERE"; break;
		}
	} else
	if($dialect === 'mysql' || $dialect === 'mssql') {
		//mysql use special syntax even for delete from one table only
		// and don't allow use aliases, but we need
		// so, convert it to multitable case
		//mssql's behavior similar to mysql
		$ret = "DELETE $alias FROM $from $parsed->_WHERE";
	}
	return replace_dbspecific_funcs($ret, $dialect);
}

/*TODO
database specific functions
DATE:
	WEEK_DAY_OF
pg: date_part('dow',
ms: datepart(weekday,
or: 
my:

	DATE_FROM_YMD		
pg:						
ms:						
or:						
my:						

TIME:
		HOURS_OF			MINUTES_OF			SECONDS_OF		TIME_FROM_HMS
pg:
ms:
or:
my:

TIMESTAMP: DATE+TIME
	DATE_OF			TIME_OF			MAKE_TIMESTAMP	
pg:													
ms:													
or:													
my:													


CLOB:
		FIRST_OF
pg:
ms:
or:
my:

CHAR:
	LPAD RPAD
pg:
ms:
or:
my:

---
add null row
with t as (select 1 as a, '2' as b from dual)
select t.* from t 
union all 
select t.* from (select null as a from dual) a left outer join t on a.a is not null;


NULL SAFE COMPARE

mysql a <=> b
pgsql a IS NOT DISTINCT FROM b
mssql exists( select a intersect select b)
???orcale LNNVL( a = b ) 
???oracle DECODE(A,B,1,0)
???like mssql, but what about indexes?
*/

function prepareDB(&$db)
{
	$dbtype=$db->dialect;
	// for postgre
	if ($dbtype=="pgsql")
	{
		$db->exec ("SET client_encoding to 'UTF8'");
		$db->exec ("SET DateStyle = ISO,YMD");
		$db->exec ("SET timezone = UTC");
		$db->exec ("SET client_min_messages = 'warning'");
		$db->exec ("SET bytea_output=escape");
	}
	// for mysql
	if ($dbtype=="mysql")
	{
		$db->exec ("SET NAMES 'utf8'");
		if($db->subdialect != 'sphinxql') {
			$db->exec ("SET SESSION time_zone = '+00:00'");
			$db->exec ("SET SESSION sql_mode='STRICT_ALL_TABLES,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,NO_KEY_OPTIONS,NO_TABLE_OPTIONS,NO_FIELD_OPTIONS,NO_AUTO_CREATE_USER,ONLY_FULL_GROUP_BY,NO_ZERO_DATE,NO_ZERO_IN_DATE,NO_BACKSLASH_ESCAPES'");
		}
	}
	// for ms sql 
	if ($dbtype=="mssql")
	{
		// to do AnsiNPW=Yes
		// utf-8 setted in connection attribs
		$db->exec ("SET LANGUAGE us_english");
		$db->exec ("SET DATEFORMAT YMD");
	}
	// oracle
	if ($dbtype=="oci")
	{
		$db->exec ("ALTER SESSION SET NLS_CALENDAR='Gregorian'");
		// NLS_LANG задается передается через переменные среды 
		//$db->exec ("ALTER SESSION SET NLS_LANG='ENGLISH_UNITED KINGDOM.UTF8'"); // RUSSIAN_CIS // AMERICAN_AMERICA
		$db->exec ("ALTER SESSION SET NLS_DATE_FORMAT='YYYY-MM-DD'");
		$db->exec ("ALTER SESSION SET NLS_TIMESTAMP_FORMAT='YYYY-MM-DD HH24:MI:SS'");
		$db->exec ("ALTER SESSION SET TIME_ZONE='UTC'");
		$db->exec ("ALTER SESSION SET NLS_NUMERIC_CHARACTERS='.,'");
	}
}

function setDbSessionVar($name, $value, $args = [], $for_table = '') {
	static $created = [];
	if(!@$created[$name]) {
		$dbh = get_connection($for_table);
		switch($dbh->dialect) {
			case 'mssql':
				$tname = "svar_x_$name";
				$dbh->exec("IF object_id('tempdb..#$tname') IS NOT NULL DROP TABLE #$tname");
				$s = $dbh->exec("SELECT * INTO #$tname FROM ($value) a");
			break;
			case  'pgsql': 
				$s = $dbh->prepare("select set_config('svar_x.$name', ($value)::text, false)");				
				$s->execute($args);				
			break;
		}
	}
}

/*
	offset!
	MY: OFFSET offset
	MS: 
	PG: OFFSET offset
	OR
	
*/

/* fieldPart function MSSQL


USE [new_decfift]
GO


SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[field_part]
(
	@part nvarchar(64),
	@fld  nvarchar(max),
	@value nvarchar(max)
)
RETURNS nvarchar(max)
AS
BEGIN
	DECLARE @s0 varchar(70), @s1 varchar(70), @s2 varchar(70), @p1 bigint, @p2 bigint
	
	SELECT @s0 = '§§'+@part+':';
	SELECT @s1 = char(13)+char(10)+'§§'+@part+':';
	SELECT @s2 = char(13)+char(10)+'§§'+@part+'.';
	
	if SUBSTRING(@fld, 1, LEN(@s0)) = @s0 
		select @p1 = LEN(@s0);
	else 
		begin
			select @p1 = CHARINDEX(@s1, @fld);
			if @p1<>0 and @p1 is not null select @p1 = @p1 + LEN(@s1)-1;
		end;
	
	if @p1<>0 and @p1 is not null select @p2 = CHARINDEX(@s2, @fld, @p1); 
	 --Return the result of the function
	RETURN case 
	    when (@p1=0 or @p1 is null) and @fld is null then CONCAT(@s0,char(13),char(10),@value,@s2)
		when (@p1=0 or @p1 is null) and @fld is not null then CONCAT(@fld,@s1,char(13),char(10),@value,@s2)
		else CONCAT(SUBSTRING(@fld, 1, @p1),char(13),char(10),@value,SUBSTRING(@fld, @p2, LEN(@fld) - @p2 + 1)) --SUBSTRING(@fld, @p1, @p2 - @p1)
		end;

END

CREATE FUNCTION [dbo].[FP] 
(
	@part nvarchar(64),
	@fld  nvarchar(max)
)
RETURNS nvarchar(max)
AS
BEGIN
	DECLARE @s0 varchar, @s1 varchar, @s2 varchar, @p1 bigint, @p2 bigint
	
	SELECT @s0 = '§§'+@part+':';
	SELECT @s1 = char(13)+char(10)+'§§'+@part+':';
	SELECT @s2 = char(13)+char(10)+'§§'+@part+'.';
	
	if SUBSTRING(@fld, 1, LEN(@s0)) = @s0 
		select @p1 = 1 + len(@s0); 
	else select @p1 = CHARINDEX(@s1, @fld)  + len(@s0);
	
	if @p1 is not null select @p2 = CHARINDEX(@s2, @fld, @p1); 
	
	 --Return the result of the function
	RETURN case when @p1 > len(@s0) then SUBSTRING(@fld, @p1, @p2 - @p1) end;

END


*/
