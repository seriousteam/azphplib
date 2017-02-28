<?php
require_once(__DIR__.'/cfg.php');
require_once(__DIR__.'/rights.php');
require_once(__DIR__.'/dialects.php');
require_once __DIR__.'/parser-common.php';

define('MAX_UI_SIZE',32); //auto content-resizable size

function recaption(&$caption) {
	$parts = explode('@@', $caption);
	$caption = $parts[0];
	return @$parts[1];
}

class Table {
  var $___name = '';
  var $___caption = '';
  var $___recaption = '';
  var $fields = [];
  var $table_props = [];
  function __construct( $name, $caption = '' ) { $this->___name = $name; $this->___caption = $caption; $this->___recaption = recaption($this->___caption); }
  function Fields($f) { 
	  foreach($f as $k => $fld)
	    {
			if(array_key_exists($k, $this->fields)) {
				foreach($fld as $n=>$v)					
					$this->fields[$k]->$n = $v;
				
			} else $this->fields[$k] = $fld;
		}
	return $this;
  }
  function Props($p) { 
	$this->table_props =$p;
	return $this;
   }
  function PK($many = false) {
	$ret = [];
	foreach($this->fields as $k => $v)
		if($v->pk) if($many) $ret[] = $k; else return $k;
	ksort($ret);
	return $ret;
  }
  function default_order() {
	//TODO: order by relation
	$ret = [];
	foreach($this->fields as $k => $v)
		if($v->order !== null)
			$ret[abs($v->order)] = $v->order < 0 ? $k.' DESC ' : $k;
	ksort($ret);
	return array_values($ret);
  }
  function ID($path = '') {
	$id = @$this->table_props['ID'];
	if(!$id && $path)
		$id = '$a.'.$this->PK();
	return $path ? preg_replace('/(?:^|[^\$])\$a(?=\.)/', $path, $id)  : $id;
  }
  function default_filter() {
	return @$this->table_props['DEFAULT_FILTER'];
  }
  function TRIGGER_VAR() { return @$this->table_props['TRIGGER_VAR']; }
  function AUTO_KEY() { return @$this->table_props['AUTO_KEY'] ? $this->PK() : ''; }
  function AUTO_GROUP() { return @$this->table_props['AUTO_GROUP']; }
}

class _Field {
  var $type = null;
  var $size = 0;
  var $precision = null;
  var $caption = '';
  var $recaption = '';
  var $si_caption = '';
  var $pk = false;
  var $target = null;
  var $condition = null;
  var $sources = [];
  var $targets = [];
  var $order = null;
  var $inner = false;

  var $search_priority = ''; 
  var $search_op = ''; 
  var $search_re = ''; 
  
  var $ctrl_re = '';
  var $ctrl_min = '';
  var $ctrl_max = '';
  
  var $required = false;
  
  var $expression = '';
  
  var $hidden = false;
  var $readonly = false;
  
  var $choose = false;
  
  var $ui_size = NULL;
  var $ui_group = '';
  var $ui_line = false;
  
  var $values = '';
  
  var $page = '';


  function __construct( $table = null) { 
    global $Tables;
	$field = null;
	if(preg_match('/^(.*)\.(.*)/',$table, $m)) { $table = $m[1];  $field = $m[2]; }
	if($table) {
		$this->target = $Tables->$table; 
		$a = $field !== null ? 
			( $field ? [ $field ] : [])
			: $this->target->PK(true);
	}
	if($table && count($a) === 1) {
		$a = $a[0];
		$a = $this->target->fields[$a];
		$this->type = $a->type;
		$this->size = $a->size;
		$this->precision = $a->precision; //and so on...
	}
  }
  function getCondition($src_alias, $target_alias) {
	  if($this->condition) return str_replace(['src.', 'target.'], ["$src_alias.", "$target_alias."], $this->condition);
	  if($this->sources)
		  return implode(' AND ',
				array_map(function($a, $b) use($src_alias, $target_alias) {
						return "$src_alias.$a = $target_alias.$b";
					}
					, $this->sources, $this->targets)
			);
  }
  function getExpression($alias) {
  	return $this->expression ? preg_replace('/(?<=^|[^\$])\$a(?=\.)/', $alias, $this->expression)  : 'NULL';
  }
  function getControlType() {
  	global $ModelDB;
//  	var_dump($ModelDB["{$this->values}.info"]);
  	if($this->target) { //rel to table, DL by default
  		return @$ModelDB["{$this->target->___name}.{$this->name}.info"]['control'] ?: 'DL';
  	}
  	if($this->values) { //restricted values, MENU by default
  		return @$ModelDB["{$this->values}.info"]['control'] ?: 'MENU';
  	}
	switch($this->type) {
	case 'DECIMAL': return $this->precision? 'DECIMAL': 'INTEGER';
	case 'INTEGER': return 'INTEGER';
	case 'CHAR': return 'VARCHAR';
	case 'DATE': return 'DATE';
	case 'CLOB': return 'CLOB';
	case 'SUBTABLE': return 'SUBTABLE';
        case 'FILE': 
    	    switch((string)$this->size) {
    		case 'image': return 'FILE_IMAGE';
    		case 'video': return 'FILE_VIDEO';
    		case 'sound': return 'FILE_SOUND';
    	        case 'pdf': return 'FILE_PDF';
		    default: return 'FILE';
		}
        case 'ACTION': return 'ACTION';
    case 'FILES': return 'FILES';
	case 'VARCHAR': return $this->size && $this->size > MAX_UI_SIZE ? 'LONGVARCHAR' : 'VARCHAR';
	default: return 'VARCHAR';
	}
  }
  //TODO: keep_sp
  function getControlXProps() {
	return 
		($this->ctrl_min != ''? " vmin=$this->ctrl_min": '')
		.($this->ctrl_max != ''? " vmax=$this->ctrl_max": '')
		.($this->ctrl_re != ''? " re=\"$this->ctrl_re\"": '')
		.($this->required? ' required' : '')
		.($this->ui_size > 0? " size=$this->ui_size":
			($this->ui_size === 0? " content-resizable":''))
		. ' ';
  }
  function getControlProps() {
	switch($this->type) {
	case 'DECIMAL': return ($this->precision? " re=\"/^\\d{0,$this->size}(?:\\.\d{0,$this->precision})?$/\"": " maxlength=$this->size") . $this->getControlXProps();
	case 'INTEGER': return " maxlength=$this->size" . $this->getControlXProps();
	case 'CHAR': 
	case 'VARCHAR': return 
		
		" maxlength=$this->size" . $this->getControlXProps();
	default: return $this->getControlXProps();
	}
  }
  function Target($path = '') {
	$p = $this->target ? $this->target->ID($path) : FALSE;
	return $p;
  }
}

function FK($target, $condition = null, $inner = false) {  
	$ret = new _Field($target);
	$ret->condition = $condition;
	$ret->inner =  $inner;
	return $ret;
}

$Tables = new stdClass;
function Table($name, $table_caption) {
  global $Tables;
  if(@$Tables->$name) return $Tables->$name;
  return  $Tables->$name = new Table($name, $table_caption);  
}
function SemiView($name, $select, $table_caption) {
  global $Tables;
  $Tables->$name = new Table($name, $table_caption);
  $Tables->$name->select = $select;
  return  $Tables->$name;
}

//// parser (SQL-like)
/*
	TABLE name [props] (
		name VARCHAR(10) PK [props]
		name @table # rel to table pk (or virtual rel to table, if multifield pk)
		name @table.field # rel to table and field
		name @table. # virtual rel (eq @table if @table has pk with multiple fields)
		name @table on 'condition' #to table with custom condition
		name local_rel.target_field # part of rel to table and field
	)
caption is a first string in definition table or field
*/

/*
TODO: 
	extended FK
		name @table ON 'expression' with src.field = target.field
	multifield FK
		for each field we know target!
	expression for fields (subst them in query)
*/

class modelParser extends _PreCmd {
	function __construct($str) { parent::__construct($str, true);
		$str = $this->cmd;
		global $RE_ID;
		$split = preg_split('/(?:^|\s)(TABLE|QUERY)\s+/i', $str, null, PREG_SPLIT_DELIM_CAPTURE|PREG_SPLIT_NO_EMPTY);
		$split = array_filter(array_map('trim', $split));
		//var_dump($split);
		$mode = '';
		foreach($split as $tdef) {
			if(preg_match('/^(TABLE|QUERY)$/i',$tdef)) {
				$mode = $tdef;
			} else
			if($mode === 'TABLE' && preg_match("/($RE_ID(?:\s+'\d+')?)\s*\((.*)\)/s", $tdef, $m) ||
				$mode === 'QUERY' && preg_match("/($RE_ID(?:\s+'\d+')?)\s+'(\d+)'\s+\((.*)\)/s", $tdef, $m)
			) {
				$table_caption = '';
				$table = $m[1];
				if(preg_match("/^($RE_ID)\s+'(\d+)'/", $table, $mm)) {
					$table = $mm[1]; $table_caption =  $this->unescape($mm[2]);
				}
				$fields = $mode === 'TABLE' ? trim($m[2]) : trim($m[3]);
				$query = $mode === 'QUERY'? $m[2] : '';
				global $Tables;
				$fres = [];
				$props = [];
				if(substr($fields,0,2) === '= ') { 
					$fres = $Tables->{substr($fields,2)}->fields;
				}
				else {
					$fn = levelized_process($fields, 
						function($fld, $lvl) {
							if($lvl === 1)
								return str_replace(',', ';', $fld);
							return $fld;
						}
					);
					$fields = $fn === $fields? str_replace(',', ';', $fn) : $fn;
					$fields = explode(';', $fields);
					$fields = array_map('trim', $fields);
					$fields = array_filter($fields);
					$current_page = '';
					$unnamed_group = 0;
					$current_group = ['name'=>++$unnamed_group, 'closed'=>false];
					//var_dump($fields);
					foreach($fields as $f) {
						if(preg_match("/^\s*+(?<name>$RE_ID):\s*+(?<value>(.*))/", $f, $m)) { // ID: 
							if($m['name'] == 'ID' && preg_match("/'(\d+)'/", $m['value'], $m ))
								$props[ 'ID' ] = $this->unescape($m[1]);
							else if($m['name'] == 'DEFAULT_FILTER' && preg_match("/'(\d+)'/", $m['value'], $m ))
								$props[ 'DEFAULT_FILTER' ] = $this->unescape($m[1]);
							else if($m['name'] == 'TRIGGER_VAR')
								$props[ 'TRIGGER_VAR' ] = $m['value']; //TRIGGER_VAR: ID
							else if($m['name'] == 'AUTO_KEY')
								$props[ 'AUTO_KEY' ] = true;
							else if($m['name'] == 'AUTO_GROUP')
								$props[ 'AUTO_GROUP' ] = true;
							else if($m['name'] == 'DICT')
								$props[ 'DICT' ] = true;
							else if($m['name'] == 'PAGE') {
								$current_page = $m['value'];
								$current_group = ['name'=>++$unnamed_group, 'closed'=>false];
							}
							else if($m['name'] == 'UI_GROUP') {
								if(preg_match("/^CLOSED:(.*)$/i",$m['value'],$g)) {
									$current_group = [ 'name'=>$g[1], 'closed'=>true ];					
								} else {
									$current_group = [ 'name'=>$m['value'], 'closed'=>false ];	
								}
							}								
							continue;
						}

						if(!preg_match("/\s*+(?<name>$RE_ID)\s++
									(?<rel>@@?\s*+)?(?<type>(?<local>$RE_ID)(?<haspart>\.(?<part>$RE_ID)?)?)(?:\s*:\s*+'(?<relcond>\d++)')?
									(?:\(\s*+(?<size>\d++|$RE_ID)(?:\s*,\s*+(?<prec>\d++|$RE_ID) )?\s*\))?
									(?<other>.*)/x", $f, $m))
								throw new Exception("strange field definition <<$f>>");
						$fname = $m['name'];
						$frel = @$m['rel'];
						$ftype = $m['type'];
						$flocal = $m['local'];
						$fpart = @$m['part']?:'';
						$fhaspart = @$m['haspart']? true : false;
						$fsize = @$m['size']?:0;
						$fprec = @$m['prec']?:'';
						$fpop = @$m['other']?: '';
						//var_dump($m);
						$frelcond = $m['relcond']!=''? $m['relcond'] + 1: 0;
						$frelcond = $frelcond ? $this->unescape($frelcond-1) : null;
						$fld = null;
						if($frel) { //relation here!
							$fld = FK($ftype, $frelcond, substr($frel,1,1) == '@' );
							if($fpart) {
								$fld->sources[] = $fname;
								$fld->targets[] = $fpart;
							} else {
								$pk = $fhaspart ? [] : $fld->target->PK(true);
								if(count($pk)===1) {
									$fld->sources[] = $fname;
									$fld->targets[] = $pk[0];
								}
							}
						} else { //field or part of relation here
							$fld = new _Field;
							if($fpart) { //relation's part => copy info
								$src = $fres[$flocal]->target->fields[$fpart];
								$fld->type = $src->type;
								$fld->size = $src->size;
								$fld->precision = $src->precision;
								//add condition to rel
								$fres[$flocal]->sources[] = $fname;
								$fres[$flocal]->targets[] = $fpart;
							} else {
								$fld->type = $ftype;
								$fld->size = $fsize;
								if($fprec !== '') $fld->precision = $fprec;
							}
						}
						//parse props here
						//var_dump($fpop);
						$fpop = array_map('trim', preg_split("/(?<!:)\s+/", $fpop));
						foreach($fpop as $p) 
							if($p === 'PK') $fld->pk = true;
							else if(preg_match('/^PK\((\d+)\)/i', $p, $m)) $fld->pk = $m[1];
							else if(preg_match('/^ORDER\((\d+)\)/i', $p, $m)) $fld->order = $m[1];
							else if(preg_match('/^CHOOSE/i', $p, $m)) $fld->choose = true;
							else if(!$fld->caption && preg_match("/^'(\d+)'$/", $p, $m)) {
								//var_dump($props, $p, $this->strings[(int)$m[1]]);
								$fld->caption = $this->unescape($m[1]);
								$fld->recaption = recaption($fld->caption);
							}
							else if(preg_match("/^SEARCH(\d+)?([^']+)'(\d+)'/i", $p, $m))
								{ $fld->search_priority = $m[1]; 
								   $fld->search_op = $m[2]; 
								   $fld->search_re = $this->unescape($m[3]); 
								}
							else if(preg_match('/^REQUIRED$/', $p)) $fld->required = true;
							else if(preg_match('/^HIDDEN$/', $p)) $fld->hidden = true;					
							else if(preg_match("/^SI'(\d+)'/i", $p, $m)) 
								$fld->si_caption = $this->unescape($m[1]);
							else if(preg_match("/^RE:'(\d+)'/i", $p, $m))  
								$fld->ctrl_re = $this->unescape($m[1]); 
							else if(preg_match("/^MIN:'(\d+)'/i", $p, $m)) 
								$fld->ctrl_min = $this->unescape($m[1]); 
							else if(preg_match("/^MAX:'(\d+)'/i", $p, $m)) 
								$fld->ctrl_max = $this->unescape($m[1]);							
							else if(preg_match("/^UI_SIZE:(\d+)/i", $p, $m))
								$fld->ui_size = (int)$m[1];
							else if(preg_match('/^UI_LINE$/', $p)) $fld->ui_line = true;				
							else if(preg_match("/^VALUES:\s*($RE_ID)/i", $p, $m)) 
								$fld->values = $m[1];							
							else if(preg_match("/^='(\d+)'/", $p, $m)) {
								$fld->expression = $this->unescape($m[1]);
								$fld->readonly = true;
							} 
						$fld->page = $current_page;
						$fld->ui_group = $current_group;
						if($fld->type==='SUBTABLE') {
							$fld->ui_group = [ 'name'=>++$unnamed_group, 'closed'=>false ];	
							$current_group = [ 'name'=>++$unnamed_group, 'closed'=>false ];
						}
						$fres[$fname] = $fld;
					}
				}
				if($mode === 'TABLE') {
					Table($table, $table_caption)->Fields($fres)->Props($props);
				} else if($mode === 'QUERY') {
					SemiView($table, $this->unescape($query), $table_caption)->Fields($fres)->Props($props);
				}
			}
		}
	}
}

////


function print_actual_model($model = null) {
	global $Tables;
	$model = $model ?: $Tables;
	foreach($model as $mod) {
		if(@$mod->select)
			echo "\nQUERY $mod->___name "._PreCmd::escape($mod->select)." (";
		else
			echo "\nTABLE $mod->___name (";
		$first = '';
		$rels = [];
		foreach($mod->fields as $k=>$f) {
			echo "\n\t$first$k "; $first = ',';
			if($f->target) { 
				echo '@',$f->target->___name;
				//3 cases: 1- rel to pk, 2 -rel to fld, 3-multifield rel
				//1: $f->sources empty
				//2: $f->sources has 1 elem
				//3: $f->sources has many elems
				if(count($f->sources)===0) {} //@target ===>PK
				else if(count($f->sources)===1) { //@target.fld
				    $a = $f->target->PK(true); 
					if(count($a) !== 1 || $a[0] !== $f->targets[0])
						echo '.', $f->targets[0]; 
				} else { //@target.
					echo '.';
					foreach($f->sources as $i => $r)
						$rels[$i] = $f->targets[$i];
				}
			} else { echo $f->type;
				// maybe, this is a case: name rel.field?
				if(array_key_exists($k, $rels)) {
					echo '.',$rels[$k];
				}else
				if($f->size) { echo '(',$f->size;
					if($f->precision) echo ',', $f->precision;
					echo ')';
				}
			}
			if($f->caption) echo ' '._PreCmd::escape($f->caption);
			if($f->pk)
				if($f->pk === true) echo " PK ";
				else echo "PK($f->pk)";
		}
		echo "\n\t)";
	}
}

function append_information_schema_to_model($schema) {
	$dbh = get_connection('');
		//TABLE_CATALOG
		//,TABLE_SCHEMA
	
	$cols = $dbh->query(<<<QQ
	SELECT 
		TABLE_NAME
		,COLUMN_NAME
		,COLUMN_DEFAULT
		,IS_NULLABLE
		,DATA_TYPE
		,CHARACTER_MAXIMUM_LENGTH
		,CHARACTER_OCTET_LENGTH
		,NUMERIC_PRECISION
		,NUMERIC_SCALE
		,DATETIME_PRECISION	
		FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = '$schema'
		ORDER BY TABLE_NAME, ORDINAL_POSITION
QQ
)->fetchAll(PDO::FETCH_OBJ | PDO::FETCH_GROUP);

	$fks = $dbh->query(<<<QQ
	SELECT 
		a.table_name ||'.'|| a.column_name,
		d.table_name
	FROM INFORMATION_SCHEMA.key_column_usage a
	JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS b
	ON
		a.CONSTRAINT_CATALOG = b.CONSTRAINT_CATALOG
		AND a.CONSTRAINT_SCHEMA = b.CONSTRAINT_SCHEMA
		AND a.CONSTRAINT_NAME = b.CONSTRAINT_NAME
	JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS c
	ON
		a.CONSTRAINT_CATALOG = c.CONSTRAINT_CATALOG
		AND a.CONSTRAINT_SCHEMA = c.CONSTRAINT_SCHEMA
		AND a.CONSTRAINT_NAME = c.CONSTRAINT_NAME
	JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS d
	ON
		c.UNIQUE_CONSTRAINT_CATALOG = d.CONSTRAINT_CATALOG
		AND c.UNIQUE_CONSTRAINT_SCHEMA = d.CONSTRAINT_SCHEMA
		AND c.UNIQUE_CONSTRAINT_NAME = d.CONSTRAINT_NAME
	WHERE 
		a.TABLE_SCHEMA = '$schema' 
		AND b.CONSTRAINT_TYPE = 'FOREIGN KEY'
QQ
)->fetchAll(PDO::FETCH_KEY_PAIR);

	$pks = $dbh->query(<<<QQ
	SELECT 
		a.table_name,
		a.column_name
	FROM INFORMATION_SCHEMA.key_column_usage a
	JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS b
	ON
		a.CONSTRAINT_CATALOG = b.CONSTRAINT_CATALOG
		AND a.CONSTRAINT_SCHEMA = b.CONSTRAINT_SCHEMA
		AND a.CONSTRAINT_NAME = b.CONSTRAINT_NAME
	WHERE 
		a.TABLE_SCHEMA = '$schema' 
		AND b.CONSTRAINT_TYPE = 'PRIMARY KEY'
QQ
)->fetchAll(PDO::FETCH_KEY_PAIR);

	//FIXME: multicolumn PK, FK!
	
	//var_dump($cols);
	global $type_translations_db_to_internal;
	$tr = $type_translations_db_to_internal[$dbh->dialect];
	foreach($cols as $t)
		foreach($t as $f)
			if(@$tr[$f->data_type]){
				$f->data_type = 'db'.$tr[$f->data_type];
			} else
				throw new Exception("unknown type: <$f->data_type>");
	//var_dump($cols['encountries']);
	foreach($cols as $t=>$fields) {
		$tbl = Table($t);
		$ft = [];
		foreach($fields as $f) {
			$fp = [$f->character_maximum_length];
			if(@$pks[$t] === $f->column_name) $fp[] = PK;
			$ft[$f->column_name] = 
				call_user_func_array($f->data_type, $fp);
		}
		$tbl->Fields($ft);
	}
	global $Tables;
	foreach($fks as $tf=>$tg) {
		list ($t,$f) = explode('.', $tf);
		$Tables->$t->fields[$f] = FK($tg);
	}
}

$TablesGenerated = false;
$cached_tables = cached('ini', 'all', 
	function($a) {
		global $TablesGenerated;
		$TablesGenerated = true;
new modelParser(
_ENV_MODEL ? 
		"TABLE dual ( f VARCHAR(1) PK) \n".
		file_get_contents(_ENV_MODEL) 
: <<<MP
	TABLE dual ( f VARCHAR(1) PK)

	TABLE Types ( code VARCHAR PK )
	TABLE Persons ( fio VARCHAR PK, type @Types )
	TABLE Docs ( name VARCHAR PK, autor @Persons )
	TABLE encountries ( syrecordidw VARCHAR PK, enf_namew VARCHAR)

	TABLE dbootest ( rid DECIMAL PK, value VARCHAR(20) )
	TABLE dbootest_details ( link @dbootest PK, id DECIMAL PK, value VARCHAR(20) )

	QUERY UnnamedPersons 'SELECT * FROM Persons WHERE fio = ''-'' ' (=Persons)
MP
);
	global $Tables;
	return serialize($Tables);
});

if(!$TablesGenerated) {
	$Tables = unserialize($cached_tables);
}

if(__FILE__ != TOPLEVEL_FILE) return;

//append_information_schema_to_model('public');

print_actual_model();

var_dump($Tables);

