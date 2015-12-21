<?php

require_once(__DIR__.'/cfg.php'); 
require_once(__DIR__.'/rights.php');
require_once(__DIR__.'/dialects.php');
require_once(__DIR__.'/model.php');

class _XNode {
  static $a_num = 0;
  static $ext = '';

  var $table;
  var $alias;
  var $childs = [];
  var $access_filters = [];

  function __construct($table) {
    $n = ++_XNode::$a_num;
    $this->alias = "a$n";
    $this->table = $table;
    if(!$table) {
    	debug_print_backtrace();
  		var_dump($this);
  		die('');
    }
  }

  function addChild($name, $table) {
    if(array_key_exists($name, $this->childs)) return $this->childs[$name];
    return $this->childs[$name] = new _XNode($table);
  }
  function __get($name) {
    if($name === 'PK')
     $name =  $this->table->PK();  //one only
    return new _XPath($this, $name);
  }
  
  static function filter2str($a, &$dst) {
    $a = array_unique($a);
    global $CURRENT_USER, $CURRENT_ROLES, $CURRENT_ROLES_CSV;
    if(in_array('-', $a)) $a = ['1=0'];
    $a = str_replace(
              array('$USER', '$ROLES', '$ROLES_CSV'), 
              array($CURRENT_USER, $CURRENT_ROLES, $CURRENT_ROLES_CSV), 
              $a);
    $a = implode(' AND ', $a);
    if($dst !== null) $dst = "( $dst ) AND ( $a )";
    else $dst = $a;
  }
  
  static function tableName($table_name) {
	global $a_table_db;
	return	
			trim(@explode(':', @$a_table_db[$table_name], 2)[1])
			?: $table_name
	;
  }

  function __toString() {
  	if(!$this->table) {
  		var_dump($this);
  		die('');
  	}
      $tn = isset($this->table->select) ? 
        "({$this->table->select})" 
		: _XNode::tableName($this->table->___name)
		;
      if($this->access_filters) {
        _XNode::filter2str($this->access_filters, $a);
        $tn = "( SELECT * FROM $tn a1 WHERE $a )"; 
          //alias is the same here and in main table
          // so filter can be safely transfered as text (as is!)!
      } 
      $j = [ "$tn $this->alias" ];
      foreach($this->childs as $k => $v) {
        $sj = (string)$v; if($v->childs) $sj = "( $sj )"; //associate right(!)
        $j[] = ($this->table->fields[$k]->inner? '' : ' LEFT') . " JOIN $sj ON " . $this->table->fields[$k]->getCondition($this->alias, $v->alias);
      }
      return implode('', $j);
  }
}

class _XPath {
  var $___node;
  var $___name;
  var $___rel_to_node = null;
  function __construct($node, $name) { 
    $this->___node = $node;
    $this->___name = $name;
  }
  function __toString() {
	if($this->___name == '_id_') {
		return $this->___node->table->ID($this->___node->alias);
	}
    return
        $this->___rel_to_node 
			?: (
			@$this->___node->table->fields[$this->___name]->type == "SUBTABLE"
			||
			@$this->___node->table->fields[$this->___name]->type == "ACTION"
			?
			"NULL":
			(
			(@$this->___node->table->fields[$this->___name]->type == "FILE" ||
       @$this->___node->table->fields[$this->___name]->type == "FILES") ?
				$this->___node->alias .'.'. $this->___node->table->PK()
			:
			$this->___node->alias .'.'. $this->___name
			)
      );
  }
  function __get($name) {
   /* if($name==='join') {
      //accessed left and right fields, but in different nodes!
      // this is for check rights especially
      // $this->___rel_to_node = 
      //    _XNode::$ext['a']->{$this->___node->table->fields[$this->___name]->target->PK()}; 
      //now, we use direct link generation and dont check access to linked key fields
      //$this->___node->alias.rel = _XNode::$ext['a']->alias.id
      //$this->___node->alias.rel = _XNode::$ext['a']->alias.rel.id
      $this->___rel_to_node = $this->___node->table->fields[$this->___name]
        ->getCondition($this->___node->alias, _XNode::$ext['a']->alias);
      return $this;
    }*/
    //if($this->___rel_to_node) return $this;
    if($name === 'PK')
      $name = $this->___node->table->PK(); //one only
      if(!isset($this->___node->table->fields[$this->___name]))
	throw new Exception("rel $this->___name not found in {$this->___node->table->___name}");
    $n = $this->___node->addChild($this->___name, 
			  $this->___node->table->fields[$this->___name]->target);
    return new _XPath($n, $name);
  }
  function add_u_filter() {
	if($this->___node->table->___name[0] !== '(') //we trust our subselects
    merge_rights_for_roles(
			   $this->___node->access_filters,
			   '.u', '', 
			   $this->___node->table->___name, $this->___name);
  }
  function add_ro_filter() {
    if($this->___node->table->___name[0] !== '(') //we trust our subselects
    //here we check access rights for our 'name' (relation) in our table
    // we dont check target table/field access (usually, PK)
    // need we?
    //echo $this->___node->table->___name, ' ';
    //var_dump( $this->___node->access_filters, $this->___node->table->___name, $this->___name);
    merge_rights_for_roles(
			   $this->___node->access_filters,
			   '.r', '', 
			   $this->___node->table->___name, $this->___name);
    //here we add rel check with both sides
    //is it nessesary? what it's mean?
    // we dont check autor->person access when we do it with relation
    // so, why should we check it in backrel
    //so, comment it out and rethink later
    //if($this->___rel_to_node) $this->___rel_to_node->add_ro_filter();
  }
}

//TODO: GREATEST, LEAST

const _SQL_FUNC_KWD =
  '/^(AS|NULL|CAST|IS|
  SUM|MIN|MAX|AVG|COUNT|
  AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|ESCAPE|
  CASE|WHEN|THEN|ELSE|END|NULLIF|
  LOWER|UPPER|POSITION|SUBSTRING|CHAR_LENGTH|CHARACTER_LENGTH|OCTET_LENGTH|LENGTH|
  TRIM|RTRIM|LTRIM|LEFT|RIGHT|
  ASC|DESC|COALESCE|
  ABS|SIGN|ROUND|TRUNC|SQRT|EXP|POWER|LN|
  NOW|TODAY|YEAR|MONTH|DAY|DATE_TO_MONTHS|TO_DATE|
  MONTHS_BETWEEN|DAYS_BETWEEN|ADD_DAYS|ADD_MONTHS|PARTS|
  DISTINCT|
  TRUE|FALSE|
  VARCHAR|CHAR|DECIMAL|INTEGER|DATE|TIMESTAMPTZ|TIMESTAMP|TIME|CLOB|BLOB|
  STRING_TO_INTEGER|
  XSESSION_[A-Z_0-9]+)$/ix';

//parts
$SELECT_STRUCT = [ 'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT' ];
$INSERT_STRUCT_VALUES = [ 'INSERT INTO', 'VALUES' ];
$INSERT_STRUCT_SELECT = [ 'INSERT INTO', 'SELECT' ];
$UPDATE_STRUCT = [ 'UPDATE', 'SET', 'WHERE' ];
$DELETE_STRUCT = [ 'DELETE FROM', 'WHERE' ];

class _fromItem {
  var $op = '';
  var $tbl = '';
  var $alias = '';
  var $tail = '';
  var $___node = null;
  function __toString() {
    return $this->___node? 
      ($this->op && $this->___node->childs? "$this->op ( $this->___node )" :
        $this->op . ' '. $this->___node)
    : trim("$this->op $this->tbl $this->alias $this->tail");
  }
}


// later, we can process parsed from
// 1) keep aliases for root nodes and generate if nessesary
// 2) process ids in 'on'

class _Cmd extends _PreCmd {
  var $externals = [];
  
  var $dialect = ''; //root table dialect
  var $alias = ''; //alias of root table
  var $table = ''; //root table name
  var $toplevel = true; //toplevel flag

  static $a_num = 0;

  //make new parsed command
  function __construct($cmd) { parent::__construct($cmd);
  //echo "!!!!",$cmd;
    
    //reset aliasing
    _XNode::$a_num = 0;
    //debug_backtrace();
    //after next line toString will compose processed command
    if(preg_match('/^\s*ESCAPE\s++(.*)/si', $cmd, $m)) {
      $cmd = new stdClass;
      $cmd->select = $m[1];
      $cmd->subselects = [];
      $cmd->parsed = null;
    } else
      $cmd = $this->process_command($this->cmd);
    if(!is_string($cmd)) { // select command, copy fields here
      $this->subselects = $cmd->subselects;
      $this->parsed = $cmd->parsed;
      $cmd = $cmd->select;
    }
    $this->cmd = $cmd;
  }
  function __toString() { return $this->doToString($this->cmd); }
  
  function process_command($cmd) {
    if(preg_match('/^\s*SELECT /i', $cmd)) return $this->process_select($cmd);
    if(preg_match('/^\s*INSERT /i', $cmd)) return $this->process_insert($cmd);
    if(preg_match('/^\s*UPDATE /i', $cmd)) return $this->process_update($cmd);
    if(preg_match('/^\s*DELETE /i', $cmd)) return $this->process_delete($cmd);
    return $this->process_select($cmd);
  }
  
  function set_dialect($table) {
    global $Tables;
    if($table[0] == '(')
        return; //for subselect, we use last used table
                // select .. from (select * from T where (select .. from T1) ) where (select from T2) ==>
                // process parts in this order: 
                //  T2 (in process_ids for where)
                //  T1 (in pop_tree => process_select => process_ids for where)
                //  T  (in pop_tree => process_select => pop_tree)
    if(!$Tables->$table)
      throw new Exception("can not find root table: $table in $table_part_of_parsed");
    $this->table = $table;
    $this->dialect = db_dialect(table_db($table));
    if(!$this->dialect) {
      throw new Exception("can not find root table dialect for: $table");
	}
  }

  function parse_joins($from) {
    //var_dump($from, $this->selects);
    
    global $RE_ID;
    static $RE_JOIN = '(?:LEFT |RIGHT |FULL )?(?:OUTER |INNER )?JOIN(?:\s*\()?|ON';
    $a = preg_split("/ ($RE_JOIN) /i",
      $from, null, PREG_SPLIT_DELIM_CAPTURE|PREG_SPLIT_NO_EMPTY);
    $aout = [];
    $op = '';
    $tblpart = "($RE_ID|\(%[0-9]+\))"; //id or packed select
    foreach($a as $part) {
      if($op != 'ON') { 
        if(preg_match("/^(?:$RE_JOIN)$/i", $part)) 
        { $op = strtoupper($part); continue; }
        //echo "\n2",$part;
        if(!preg_match("/^\s*$tblpart(\s+$RE_ID)?(\s*,\s*$tblpart(\s+$RE_ID)?)*\s*$/", $part))
          throw new Exception("Bad from cause $from // $part : unmatch <$tblpart>");
        preg_match_all("/(?:^|,)\s*$tblpart(?:\s+($RE_ID))?/", $part, $m);
        //echo $part;
        foreach($m[1] as $i => $t) {
          $aout[] = $x = new _fromItem;
          $x->op = $op;
          $x->tbl = $t;
          $x->alias = @$m[2][$i] ?: '';
          //echo "\n{$m[1][$i]} ---> {$m[2][$i]}";
          $op = ',';
        }
      } else {
        //process ids in ON here! (but later! now we don't have tree)
        $aout[] = $x = new _fromItem;
        $x->op = $op;
        $x->tail = $part;
        $op = '';
      }
    }
    //var_dump($aout);
    return $aout;
  }

  function start_alias_tree($from, &$tree = null) {
    $this->toplevel = false; //for subselects we say, that we're inside command now
    
    global $Tables;
    if(!$tree) {
      _XNode::$a_num = 0;
      $tree = new stdClass;
      $tree->roots = array();
      $tree->stack = array();
      $tree->___name = '';
    }
    array_unshift($tree->stack, $tree->roots);
    $tree->roots = array();
    $joins = $this->parse_joins($from);
    if(count($joins)<1) {
	debug_print_backtrace();
      throw new Exception("No tables to select from: <<<$from>>>");
    }
    $joins[0]->alias = $joins[0]->alias ?: 'a'; //set default  ('a') alias for root table
	
    foreach($joins as $t)
      if($t->alias)
        $tree->roots[$t->alias] = 
            $t->___node = new _XNode( 
                      $t->tbl[0] === '('?
                        new Table($t->tbl) //subselect (only name, no fields and rels)
                        : $Tables->{$t->tbl} //normal table
                    ); //add root table to tree
      else if($t->tail)
        $t->tail = $this->process_ids($t->tail, $tree); //no externals in 'ON'!

    $tree->roots['-'] = $joins; //save joins to recompose later
    $tree->___name = $joins[0]->tbl[0] === '(' ? $joins[0]->alias : $joins[0]->tbl;
      
    if(!$this->alias) $this->alias = reset($tree->roots)->alias;
    _XNode::$ext = @$tree->stack[0];
    //echo "\nstack level: ".count($tree->stack);
  }
  function pop_root_from_tree(&$prop, &$tree, $extract_filter = false) {
    $r = [];
    $to_recompose = $tree->roots['-'];
    if($extract_filter)
      { $p = reset($tree->roots); 
        $r = $p->access_filters; $p->access_filters = []; 
        }
//var_dump($to_recompose);
    $prop = implode(' ', $to_recompose); //string conversion performed in toString of fromItems
    preg_match_all('/\(%([0-9]+)\)/', $prop, $subs);
    foreach($subs[1] as $sn) 
      $this->selects[(int)$sn] =  new processedSubselect(
	$this->process_select($this->selects[(int)$sn]->str, $externals, $tree));
    $tree->roots = array_shift($tree->stack);
    //echo "\nstack level: ".count($tree->stack);
    $this->set_dialect($to_recompose[0]->tbl);
    return $r;
  }

  //replace selects, used in command, with their checked version
  // and with path expanded
  function process_select($s, &$externals = [], &$tree = null) {
    global $RE_ID, $RE_FULL_ID;
    global $Tables, $SELECT_STRUCT;
    
    if(preg_match('/^\s*\(%([0-9]+)\)\s*$/', $s, $subs)) //if called for encoded subselect => replace with it meaning
      $s = $this->selects[(int)($subs[1])]->str;
    
    $parsed = new parsedCommand($SELECT_STRUCT, $s);
    //var_dump($parsed);
    if(!$parsed->ok) {
		debug_print_backtrace ();
      throw new Exception("bad select structire: $s");
	}
    
   
    $select = $parsed->SELECT;
    $from = $parsed->FROM;

    // make root tree
    $toplevel = $this->toplevel; //works in insert too
    $this->start_alias_tree( ($from ?: 'dual'), $tree);
    
    //replace LIMIT
    if($toplevel) {
      if(isset($parsed->LIMIT)) {
        if($parsed->LIMIT === 'ALL' || $parsed->LIMIT === 'all'|| $parsed->LIMIT === 'All')
          unset($parsed->LIMIT);
      } else
        $parsed->LIMIT = 1000;//TODO: add per table/database defaults!
    } else
      if(isset($parsed->LIMIT)) {
        //FIXME: should we reject LIMIT in subselects?
      }
    //add default sort order
    global $Tables;
    if($toplevel) {
      if(isset($parsed->{'ORDER BY'})) {
        if($parsed->{'ORDER BY'} === 'NULL' || $parsed->{'ORDER BY'} === 'null' || $parsed->{'ORDER BY'} === 'Null')
          unset($parsed->{'ORDER BY'});
      } else {
          if(preg_match("/^\s*($RE_ID)/", $from, $mt))
            if($o =$Tables->{$mt[1]}->default_order())
              $parsed->{'ORDER BY'} = implode(', ', $o);
        }
    } else
      if(isset($parsed->{'ORDER BY'})) {
        //FIXME: should we reject ORDER BY in subselects?
      }
    
    //now we should replace linked selects with their full form!
    // to do that we can replace link as string and record external parameters
    //  (in array)
    //replace selects with their args
    $subselects = [];
    $select = 
    preg_replace_callback("/(?<select>\(%[0-9]+\)) AS ARRAY (?<alias>$RE_ID)/i",
      function($m) use(&$tree, &$subselects){
        // select to array here
        $old_num = _XNode::$a_num; //keep old alias numeration
            $a = $this->process_select($m['select'], $paths);
            $a->table = $this->table;
            $a->alias = $this->alias;
        _XNode::$a_num = $old_num;
        if(!$paths) {
          throw new Exception("Uncorrelated array subselect: $m[alias] : $a->stmt");
        }
        foreach($paths as $i=>$p)
          $a->args[] = $m['alias'].($i? '__'.$i :'');
        $subselects[$a->args[0]] = $a; //store linked 'selects to array' in parent
        return strlist(function($p, $alias) { return "$p AS $alias"; }, $paths, $a->args);
      },
      $select
    );
    // all subselects collected here in $subselects!
      
    //var_dump($select);
    //replace placeholder ANY (*) with nothing
    //FIXME: make it works for our subselects!
    //$select = preg_replace("/(^|,)\s*($RE_ID\s*\.\s*)?\*\s*(,|$)/", '$3', $select);
    $select = preg_replace('/,+/', ',', $select);
    $select = preg_replace('/^\s*+,/', '', $select);
    $parsed->SELECT = $this->process_ids( $select, $tree, $externals );
    $parsed->process_ids('WHERE', $this, $tree, $externals );
    $parsed->process_ids('GROUP BY', $this, $tree, $externals );
    $parsed->process_ids('ORDER BY', $this, $tree, $externals );

    $this->pop_root_from_tree($parsed->FROM, $tree, false);
    if($from) {
	    $ret = make_dbspecific_select($this, $parsed, $this->dialect);
    	$ret->subselects = $subselects;
    } else {
    	$ret = '(' . make_dbspecific_select_values(
    		$parsed->SELECT
    		, $this->dialect).')';
    }
   return $ret;
  }
  function process_path($p, &$tree, &$externals) {
	global $RE_ID;
		
	    //echo "\n^^^^$p", preg_match(_SQL_FUNC_KWD, $m[0])?"-F-":'-I-';
		if(preg_match(_SQL_FUNC_KWD, $p)) return $p;
		$path = explode('.', $p);
		$roots = $tree->roots;
		reset($roots);
		$alias = count($path)>1? array_shift($path) : key($roots);
		//$alias = count($path)>1? array_shift($path) : 'a'; //FIXME:alias - more smart
	    
		if(preg_match("/^ext([0-9]*)(?:_($RE_ID))?/", $alias, $mi)) {
			   
			    $level = (int)(@$mi[1]?:0);
	    $alias = @$mi[2] ?: 'a';	    
	    if($level + 1 >= count($tree->stack)) $roots = null;
	    else $roots = $tree->stack[$level];
		}
	    //echo "\n^^^^$p in $alias ";
			   if(!$roots)
			     { $externals[] = $alias.'.'.implode('.', $path); return '?'; }
		if(!@$roots[$alias]) {
	      $r = 'stack level: '.count($tree->stack).' roots: ';
		 
	      foreach($roots as $a => $v) 
		if(is_object($v))
		  $r .= "$a => {$v->table->___name} ";
	      throw new Exception("alias '$alias' not found in $r (source:$p)");
	   }
	   $node = $roots[$alias];
	foreach($path as $key=>$name) {		
		if($name==='join') {
			//var_dump(_XNode::$ext);
			 //accessed left and right fields, but in different nodes!
			// this is for check rights especially			
			//now, we use direct link generation and dont check access to linked key fields
			//$node = new _XPath($node, $name);
			//echo '<pre>';
			
			$joinpath =  array_splice( $path, $key+1 );
			//var_dump($joinpath);
			
			if(count($joinpath) && !preg_match("/^ext([0-9]*)(_$RE_ID)?/", $joinpath[0], $mi))
				array_unshift($joinpath, 'ext');
			
			$rel_node =  $this->process_path( implode('.', $joinpath), $tree, $externals );			

			$node->___rel_to_node = $node->___node->table->fields[$node->___name]
			->getCondition($node->___node->alias, count($joinpath) ? explode('.', $rel_node->alias)[0] : _XNode::$ext['a']->alias);
			
			break;
		} else
		if($name==='update') {
			$node->add_u_filter();
			break;
		}
		else {			
			$node = $node->$name;
		}	       
	}
	//record name in last node as accessed from commend
	$node->add_ro_filter();
	return $node;
  }
  function process_ids($s, &$tree, &$externals = null) {
    global $RE_ID, $RE_PATH;
    if(!$s) return $s;
    
    $ret = preg_replace_callback($RE_PATH,
			function($m) use(&$tree, &$externals) { return $this->process_path($m[0], $tree, $externals); },
			' '.$s);
    //process subselects here! it's has only side effect
    preg_match_all('/\(%([0-9]+)\)/', $s, $subs);
    foreach($subs[1] as $sn)
      $this->selects[(int)$sn] =  new processedSubselect(
		$this->process_select($this->selects[(int)$sn]->str, $externals, $tree));
    return $ret;
  }
  
  function process_insert($s) {
    global $RE_ID, $RE_FULL_ID, $RE_ID_DONE;
    global $Tables, $INSERT_STRUCT_VALUES, $INSERT_STRUCT_SELECT, $SELECT_STRUCT;
    
    $parsed = new parsedCommand($INSERT_STRUCT_VALUES, $s);
    if(!@$parsed->VALUES)
      $parsed = new parsedCommand($INSERT_STRUCT_SELECT, $s);
    if(!@$parsed->ok) {
		var_dump($parsed);
      throw new Exception("bad insert structire: $s");
    }
    
    $into = $parsed->{'INSERT INTO'};
    
    // speedy dirty variant, we recompose later, so it's safe!
    preg_match_all($RE_ID_DONE, $into, $m);
    $fields = $m[0]; 
    $table = array_shift($fields); //first id is a table! ex.: insert into table (f1, f2) ...
    $this->set_dialect($table);
    $this->toplevel = false;

    /* common case to check rights
       we have event+invits and two roles: inviter, invited
       the access table for invites is:
                        inviter                              invited
       $default         .u: none, .d:if own event            .c: none, .u:none, .d:none
       rel_event        .c:if rel_event owned by inviter        
       rel_person       .c:all
       appruved         .c:if null(default)                  .u: all

       so, invited can only appruve (or reject) invitations
       and inviter can create invitation to own events only and cannot set appruvement status
       one problem is that inviter can create invitation without event
       but it can be patched if mark rel_event as required
       so, everything works!
       
       sometimes we need forse record created to be in special state
       (usually they marekd with some fields equal to null)
       for exmaple, it cam be 'stage' or appruve status or so
       in this case we can add this check in .c filter part for this kind of fields
       (and client, using filter definition, will send this value back as it's in a strict filter part)
       but this filter we take from a model, not from rights
       and applyed to all filter definitions
       //FIXME: add model filter to filters
     */
    if($filter = merge_rights_for_roles($filter, '.c', '', $table, $fields)) { // make filed naming
      //ie make select NULL as field FROM dual WHERE 1=0 UNION ALL ...
      // and later concat it with original select 
      // or with converted VALUES to SELECT values FROM dual 
      _XNode::filter2str($filter, $filter_str);
      $filter = 'SELECT * FROM (SELECT '
				       . strlist($fields) . ' FROM '.$table
	.' WHERE 1=0 UNION ALL %SEL%) a1 WHERE ' //FIXME: filter out dummy record! or require it for filter definition
	. $filter_str;
      // this we have packed strings, so it's safe to replace %SEL% as string
    }

    $parsed->{'INSERT INTO'} = "$table (".strlist($fields).') ';
    if(@$parsed->SELECT) { // insert from select
      $sel = (string)$this->process_select($parsed->_SELECT);
      if($filter) $sel = str_replace('%SEL%', $sel, $filter);
      return make_dbspecific_insert_from_select($parsed, $sel, $this->dialect);
    }
    // we should check whitelist in values
    // all id's in values should be whitelisted
    preg_match_all($RE_ID_DONE, $parsed->VALUES, $m);
    foreach($m[0] as $id)
      if(!preg_match(_SQL_FUNC_KWD, $id))
        throw new Exception("Blacklisted function in insert: <$id>");

    //recompose and do not do more
    $select = '';
    if($filter) {
      preg_match('/^\s*\((.*)\)\s*$/', $parsed->VALUES, $m); //trim spaces and brackets
      $select = make_dbspecific_select_values($m[1], $this->dialect);
      //var_dump($parsed->{'_INSERT INTO'});
      $select = str_replace('%SEL%', $select, $filter);
    }
    global $Tables;
    return make_dbspecific_insert_values($parsed
    	, $select
    	, $Tables->$table->AUTO_KEY()
    	, $this->dialect);
  }

  function process_delete($s) {
    global $RE_ID, $RE_FULL_ID;
    global $Tables, $DELETE_STRUCT;
    
    $parsed = new parsedCommand($DELETE_STRUCT, $s);
    if(!$parsed->ok)
      throw new Exception("bad delete structure: $s");

    $from = $parsed->{'DELETE FROM'};
    // make root tree
    $this->start_alias_tree($from, $tree);

    $parsed->process_ids( 'WHERE', $this, $tree );

    $filter = $this->pop_root_from_tree($parsed->{'DELETE FROM'}, $tree, true);
    //take fiter from roots and append it to where!
    if($filter = merge_rights_for_roles($filter, '.d', '', $from ))  //FOR record, not fields!
      _XNode::filter2str($filter, $parsed->WHERE);
    return make_dbspecific_delete($parsed, $this->dialect);
  }

  function process_update($s) {
    global $RE_ID, $RE_FULL_ID;
    global $Tables, $UPDATE_STRUCT;
    
    $parsed = new parsedCommand($UPDATE_STRUCT, $s);
    if(!$parsed->ok)
      throw new Exception("bad update structire: $s");

    $from = $parsed->{'UPDATE'};

    // make root tree
	//if(preg_match('/\s/',$from)) throw new Exception("ERR $from");
	//echo "??????? $from";
    $this->start_alias_tree($from, $tree);

    $parsed->process_ids( 'WHERE', $this, $tree );

    $fields = [];

    if(@$parsed->SET) {
      // we first treat all ids in SET as accessed for read, we don't need parse part for it
      $parsed->process_ids( 'SET', $this, $tree );
      // after process ids we have all id's at left side replace with alias.id
      // mysql, mssql understand alias in update, postgre - doesn't, oracle have difficult rules, but, in general, doesn't
      // so, at least for pgsql we should remove aliases
      // and, of cause, it's nice to check assigned aliases
      // if we remove alias
      // for postgres, mssql it's ok due to one table in update explicily
      // for oracle we translate it later, so everything looks good
      // for mysql we don't know (probaly, we need aliases)

      //and next we match all ids at left side of '=' (and after comma) and assume them as 'assigned'
      // and check update access to them
      preg_match_all("/(?:^|,)\s*($RE_ID)\.($RE_ID)\s*=/",$parsed->SET, $m);
      $aliases = $m[1];
      $fields = $m[2];
      if(count(array_keys($aliases, $this->alias)) !== count($aliases))
        throw new Exception("Update not only root table!");
      //remove aliases from updated fields
      $parsed->SET = preg_replace("/(?<=^|,)\s*$RE_ID\.(?=$RE_ID\s*=)/", " ", $parsed->SET);
    }
    $filter = $this->pop_root_from_tree($parsed->{'UPDATE'}, $tree, true);
    //take fiter from roots and append it to where!
    //FIXME: add model filter to filters
    // here we can update some fields only if another fields is in some state (null or not null)
    // for example, for stages fields, related to stage updatable 
    // if a stage enter guard is not null and a stage complete guard is null
    // more general, we can use essions, but it's too complex for now
    // doing inserts we can easely force record creation in initial stage with all guards equal to null
    // but! guards can be in another table, so only sql expression can check them here,
    // because we have not chance to add path with filters - too late
    if($filter = merge_rights_for_roles($filter, '.u', '', $from, $fields))
      _XNode::filter2str($filter, $parsed->WHERE);

    return make_dbspecific_update($parsed, $this->dialect);
  }
  
  function root() { return $this->table; }
}

if(__FILE__ != TOPLEVEL_FILE) return;

