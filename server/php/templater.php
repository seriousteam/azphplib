<?php
//require_once(__DIR__.'/cfg.php');
require_once(__DIR__.'/parser-common.php');

/* 

[-[ ----> [[
[[BEGIN:id]]...[[END:id]] ---> zone(function)
or [[[id ... id]]] (?)

inside op seq [[......]]
we can use ]-] for ]]
-: ====> ->
=: ====> =>
lt, gt, le, ge ====> <, >, <=, >=
and html entities

[[CALL name:file:cmd]] --->call a named zone: 
[[REF name:file:cmd]] --->call reference a named zone: 

[[@tag ]] ---> reposition item before the tag
[[attribute@tag item]] --->reposition as an attribute value
[[$@tag item]] ---> reposition next item as a last attribute of the tag
tag can be
	* - nearest
	tag. - reposition inside tags
	empty - this line

loop
	[[$data : SELECT ....]]
	[[$data of $master : SELECT ....]]

field access
[[$data.field]] [[$data.path]]
field expression
[[$data.{expr}]]
operators
[[db part~'default'~op seq]]
[[db part~digits~op seq]]
if no default
[[db part~op seq]]

conditions
[[...~?]] - simple if 
[[...~?text]] - simple conditional text insert (and replace $$ inside text with notnull value) 
[[...~?:label]] - test, and go to label, if false
[[label:body]] - set label point here, and use label as a value 
				- useful as just [[label:]] or [[label:~?]], which modelled 'else' part for [[cond~?:label]]
				
output
[[...~]] - no output
[[...~=]] - unescaped output
[[...~.]] - default output

change escape mode
[[ESC html/js]]

extend to one-table-data
dimensions:
.fld.fld.fld.fld....
.day:d, .month:m, .quarter:q, .halfyear:h
.month, .quarter, .halfyear, .year

save to context
[[...~$]]

loops
[[...~Items]]
[[...~Adms]]
[[...~Days]]
[[...~Months]]
[[...~Quarters]]
[[...~HalfYears]]

TODO:

file reference
[[FILE name]]

cached file reference
[[CFILE name]]

cached template reference
[[CREF template]]
CREF cached until file changed

library reference (relative to $G_JSLIB_PATH) - cached permanently
[[LIB name]] 

[[CACHED]] - take this template from cache and end processing (use all args as a key!)

attribute table:
	$attrdef->table = 'atable';
	$attrdef->filter = ''; //filter to get records from atable (may depends from :adm, :period, :dt, :prefix)
	$attrdef->fixed = []; //fixed val for inserted values
	$attrdef->adm = 'adm'; 		//name of special fields
	$attrdef->lvl = 'lvl'; 	// --/--
	$attrdef->period = 'period'; 	// --/--
	$attrdef->dt = 'dt';		// --/--
	$attrdef->param = 'param';	// --/--
	$attrdef->fn = 'fn';		// --/--
	$attrdef->fs = 'fs';		// --/--
	$attrdef->ft = 'ft';		// --/--
	$attrdef->fb = 'fb'		// --/--
	
dates
Y: YYYY			2014
H: YYYY-MM%MM	2014-01(H)
Q: YYYY-MM*MM	2014-01(Q)
M: YYYY-MM-		2014-01-
D: YYYY-MM-DD		2014-01-10
Y: YYYY			2014
H: YYYY-MM%MM	2014-01-
Q: YYYY-MM*MM	2014-01--
M: YYYY-MM-		2014-01---
D: YYYY-MM-DD		2014-01-10

!	"	#	$	 %	&	'	(	)	*	+	,

--
parameters

dispatch set parameters as $_REQUEST

call/ref copy $param and add $call_param

$call_param->name = value;

 */
 
function phpQuote($v) { return '\''.str_replace(['\\', '\''], ['\\\\', '\\\''], $v).'\''; }
function phpDQuote($v) { return '"'.str_replace(['\\', '"'], ['\\\\', '\\"'], $v).'"'; }

function templater_replace_zones($text, &$zones, &$entries) {
	global $RE_ID;
	
	$entries = [];
	
	$text = preg_replace_callback("/\\[\\[DEF\\s++($RE_ID)\\s(.*?)\\]\\]/s", 
			function($m) use(&$entries){ 
				$entries[$m[1]] = $m[2];
				return "";
			}
		,$text);
	
	return preg_replace_callback("/\\[\\[BEGIN:($RE_ID)\\]\\](.*)\[\\[END:\\1\\]\\]/s", 
		function($m) use(&$zones){
			$zones[$m[1]] = templater_replace_zones($m[2], $zones, $entries);
			return "[[ZONE:$m[1]]]";
		}
	,$text);
}

class sharing {
	static $resources = [
		'd3' => "echo '<script type=\"text/javascript\" src=\"',file_URI('//az/lib/d3.js', null, null),'\"></script>',\"\\n\";"
	];
	static function load($module) {
		$text = sharing::$resources[$module];
		sharing::$resources[$module] = '';
		return $text;
	}
}

function templater_take_zones($text, $file) {
	global $library_prefix;
	echo '<',"?php\n";
	echo "require_once(__DIR__.'$library_prefix/template-runtime.php');";
	$text = templater_replace_zones( $text, $zones, $entries);
	$zones['_main_'] = $text;
	
	foreach($entries as $k=>$v) {
	echo <<<FUNC

\$functions['$k'] = function(\$cmd, \$args = null, \$params = null) {
	global \$CURRENT_USER,\$CURRENT_ROLES,\$CURRENT_ROLES_CSV,\$CURRENT_ROLES_ARRAY;

	if(\$params === null) \$params = new smap;
	\$call_params = new smap(\$params); 

	\$params->fieldvals = sas_coder_DecodeMap(\$params->fieldvals);
	\$fieldvals = new smap(null, \$params->fieldvals);
			
$v
};
FUNC;
}
	foreach($zones as $k=>$v)
		templater_take_one_zone($k, $v, $file);
		
	echo "\n\nif(__FILE__ != TOPLEVEL_FILE) return \$functions;";
	echo "\n\ndispatch_template(main_argument(),  main_subarguments());";

	echo "\n?",'>';
}
$error_count = 0;

// -: =: 

function unescape_template_command($cmd) {
	return preg_replace(
		[
			'/-:/', '/=:/'
			, '/(?<=\s)gt(?=\s)/'
			, '/(?<=\s)lt(?=\s)/'
			, '/(?<=\s)ge(?=\s)/'
			, '/(?<=\s)le(?=\s)/'
			, '/(?<=\s)ne(?=\s)/'
			, '/&gt;/', '/&lt;/', '/&amp;/', '/&quot;/'
		],
		[
			'->', '=>'
			, '>', '<', '>=', '<=', '<>'
			, '>', '<', '&', '"'
		],
	$cmd);
}

function templater_take_one_zone($name, $text, $file) {
	global $error_count;
	global $RE_ID;
	
	$escape_mode = preg_match('/\.js$/', $file) ? 'js' : 'html'; //

	echo <<<FUNC

\$functions['$name'] = function(\$cmd, \$args = null, \$params = null) {
global \$CURRENT_USER,\$CURRENT_ROLES,\$CURRENT_ROLES_CSV,\$CURRENT_ROLES_ARRAY;

if(\$params === null) \$params = new smap;
\$call_params = new smap(\$params); 

FUNC;
	$main_select_alias = null;
	$text = preg_replace_callback('/\[\[MAIN\s+(.*?)\]\]/si', 
		function($m) use(&$main_select_alias) {
			$main_select_alias = $m[1];
			return '';
		}
	, $text);
	$text = preg_replace_callback('/\[\[PROLOG\s+(.*?)\]\]/si', 
		function($m) {
			echo $m[1], ";\n";
			return '';
		}
	, $text);
	$text = preg_replace_callback('/\[\[\s*PAGE\s+
		(BY\s+(\d+)
		|LOADED
		|SIZE
		|OFFSET
		|NEXT
		|PREV
		|LIMIT
		|CONTROLS
		)
	\s*\]\]/sx', function($m) {
		switch($m[1]) {
			case 'OFFSET': return "[[\$requested_offset]]";
			case 'LIMIT': return "[[\$requested_limit]]";
			case 'SIZE': return "[[\$page_limit]]";
			case 'NEXT': return 
				"[[(\$page_limit && \$main_counter > \$requested_limit? \$requested_offset + \$page_limit : '')]]";
			case 'PREV': return 
				"[[(\$page_limit && \$requested_offset? \$requested_offset - \$page_limit : '')]]";
			case 'LOADED': return "[[\$main_counter]]";
			case 'CONTROLS': return <<<ST
<button first_page type=button onclick="applyFuncFilter(this.UT('DIV').QSattrPrevious('filter_def'), null, this)" offset="[[(\$page_limit && \$requested_offset? \$requested_offset - \$page_limit : '')]]"></button>
<button prev_page type=button onclick="applyFuncFilter(this.UT('DIV').QSattrPrevious('filter_def'), this, this)" offset="[[(\$page_limit && \$requested_offset? \$requested_offset - \$page_limit : '')]]"></button>
<button next_page type=button onclick="applyFuncFilter(this.UT('DIV').QSattrPrevious('filter_def'), this, this)" offset="[[(\$page_limit && \$main_counter > \$requested_limit? \$requested_offset + \$page_limit : '')]]"></button>
ST;
		}
		echo "\t\t\$page_limit = $m[2];\n";
		return '';
	},  $text);

	//find root tag for repeat, if none, use body
	if(!preg_match("/\[\[
				@([-a-zA-Z0-9_:*.]*+)\s++
					\\\$$RE_ID\s*+:.*?
			\]\]/sxi", $text)) 
		$text = preg_replace('/<(BODY)(\s.*?)?>/si', '<$1$2>[[@$1 $data:]]', $text);

	//process repositions
	$to_process = null; //it's a reference to last processed noncommand part
	$repos = preg_split('/(\[\[
					[-a-zA-Z0-9_:$.]*+@(?:[-a-zA-Z0-9_:*.]*+|\{\}\.?|\(\)\.?|\[\]\.?)
					\s
					.*?
					\]\])/sx', 
		$text, null, PREG_SPLIT_DELIM_CAPTURE|PREG_SPLIT_NO_EMPTY);
	//var_dump($repos);
	foreach($repos as &$part) { 
		if(preg_match('/^\[\[([-a-zA-Z0-9_:$.]*+)@([-a-zA-Z0-9_:*.]*+|\{\}\.?|\(\)\.?|\[\]\.?) \s++ (.*) \]\]$/sx', $part, $m)) {
			//[[@tag command]] [[attr@tag command]] [[attr@* command]] [[$@tag command]]
			$attribute = $m[1];
			$tag = $m[2];
			$command = "[[$m[3]]]";
			if($to_process === null) { //nowhere to repos
				$part = $command;
				continue;
			}
			//find position in 'to_process'
			//var_dump($tag, $attribute, $command, $to_process);
			if(!$tag) { // to line start
				$before = strrchr($to_process, '\n') ?: '';
				$to_process = 
					$before . $command . '</>' . substr($to_process, strlen($before));
			} else {
				$inside = false; if(substr($tag,-1)==='.') { $inside = true; $tag = substr($tag,0, -1); }
				switch($tag) {
				case '{}': case '()': case '[]':
					$to_find = $tag[0];
					//var_dump("/(?<pre>.*)(?<tag>\\$to_find)(?<tail>.*)/si", $to_process);
					if(preg_match("/(?<pre>.*)(?<tag>\\$to_find)(?<tail>.*)/si", $to_process, $tg_split)) {
						$to_process = $tg_split['pre'].$command."<<$tag>>".
							$tg_split['tag'].$tg_split['tail'];
					}
					else {
						++$error_count;
						echo "<<<<<<ERROR: tag '$tag' not found>>>>>>";
					}
					break;
				case '*': { //nearest tag
						if(preg_match('/<([^\s>]+)[^>]*>\s*$/s', $to_process, $tg_split))
							$tag = $tg_split[1];
					} 
					// go next!!!
				default:
					//find back
					if(preg_match("/(?<pre>.*)(?<tag><$tag(?:\s[^>]*)?>)(?<tail>.*)/si", $to_process, $tg_split)) {
						//var_dump($tg_split['pre'], $tg_split['tag'], $tg_split['tail']);
						if($attribute) { //put inside tag
							if($attribute !== '$') { //replace attribute value
								if(preg_match("/\\s$attribute=/", $tg_split['tag']))
									$tg_split['tag'] = preg_replace("/(?<=\\s$attribute=)('[^']*'|\"[^\"]*\"|\\S*)/s", 
											'"'.$command.'"'
											,$tg_split['tag']);
								else
									$tg_split['tag'] = str_replace('>', " $attribute=\"$command\">", $tg_split['tag']);
							} else //
								$tg_split['tag'] = str_replace('>', ' '.$command.'>', $tg_split['tag']);
							$to_process = $tg_split['pre'].$tg_split['tag'].$tg_split['tail'];
						} else {
							//here, we should find tag and and it's end
							$to_process = $tg_split['pre'].$command
								.($inside? '<<.>>': '<<:>>').
								$tg_split['tag'].$tg_split['tail'];
						}
					} else {
						++$error_count;
						echo "<<<<<<ERROR: tag '$tag' not found>>>>>>";
					}
				}
			}
			$part = ''; //kill part;
		} else {
			if(preg_match('/^\s*$/s', $part)) { $to_process .= $part; $part = ''; }
			else
				$to_process = &$part;
		}
	}
	$text = implode($repos);
	//echo $text;
	//add closing tags
	preg_replace('#</>(.*)#', '[[{]]$1[[}]]', $text); //up to end of line/file
	do {
		$text = preg_replace('#<<:>>
				(<(\S+?)(?:\s|>) [^<]*+
						(?:(?:<(?!\2)|(?-2))[^<]*+)*?
				</\2>)
			#sx', '[[{]]$1[[}]]', $textp = $text);
		//echo '====',$text;
	} while($textp !== $text);
	do {
		$text = preg_replace('#(\[\[(?:.(?!\]\]))*?.\]\])<<\.>>
				(<(\S+?)(\s[^>]*+)?> 
						(
						[^<]*+
						(?:(?:<(?!\3)|(?-4))[^<]*+)*?
						)
				</\3>)
			#sx', '<$3$4>$1[[{]]$5[[}]]</$3>', $textp = $text);
		//echo '====',$text;
	} while($textp !== $text);
	//var_dump($text);
	
	do {
		$text = preg_replace('#<<\{\}>> (\{ [^{]*+(?:(?-1)[^{]*+)*? \}) #sx', 
						'[[{]]$1[[}]]', $textp = $text);
	} while($textp !== $text);
	do {
		$text = preg_replace('#<<\[\]>> (\[ [^[]*+(?:(?-1)[^[]*+)*? \]) #sx', 
						'[[{]]$1[[}]]', $textp = $text);
	} while($textp !== $text);
	do {
		$text = preg_replace('#<<\(\)>> (\( [^(]*+(?:(?-1)[^(]*+)*? \)) #sx', 
						'[[{]]$1[[}]]', $textp = $text);
	} while($textp !== $text);
	
	//join joined tags
	//echo $text;
	$text = preg_replace('#\[\[}\]\]\s*+\[\[/\*\+\*/\]\]\s*+\[\[{\]\]#sx', '', $text);
	
	//convert default call zones to explicit call by name
	$text = preg_replace("/\[\[\s*+(CALL|REF)\s*+:(:.*?)?\]\]\s*+\[\[ZONE:($RE_ID)\]\]/si",
			'[[$1 $3::$2]]',
			$text);

	$selects = []; //varname => select definition
	//$select->fields = []; //expression => alias

	preg_match_all("/\[\[\s*+\\\$($RE_ID)(?:\s++of\s++\\$($RE_ID))?\s*+:(.*?)(?:~:(.*?))?\]\]/si", $text, $m);
	foreach($m[1] as $i=>$s) {
		if(array_key_exists($s, $selects))
			throw new Exception("select name '$s' redefinition");
		if(preg_match('/^\s*+SAMPLE\s++AND\s++(.*)/si', $m[3][$i], $g))
			$m[3][$i] = $g[1];
		$c = $selects[$s] = new stdClass;
		$c->select = unescape_template_command($m[3][$i]);
		$c->fields = [];
		$c->arrays = [];
		$c->outer = @$m[2][$i];
		if(@$m[4][$i])
			$c->call_args = unescape_template_command($m[4][$i]);
		if($c->outer) {
			if(!array_key_exists($c->outer, $selects))
				throw new Exception("there is no select definition with name '$c->outer' to set as a master for '$s'");
			$selects[$c->outer]->arrays[$s] = $c;
		}
	}
	//var_dump($selects);

	$attributes = []; // attributes (from attrtable) used in template
	
	$text = preg_replace_callback('/(?<=\[\[)ATTRIBUTES
		(?:\s+(?<adm>A\+(?<admlen>\d*)))?
		(?:\s+(?<period>Y?H?Q?M?D?))?
		(?:\s+table:(?<table>[a-z_0-9]+))?
		(?=\]\])/sxi', function($m) {
			$attrdef = new stdClass;
				$attrdef->atable = 'atable';
				$attrdef->filter = '1=1'; //filter to get records from atable (may depends from :adm, :period, :dt, :prefix)
				$attrdef->fixed = ''; //fixed val for inserted values
				$attrdef->adm = 'adm'; 		//name of special fields
				$attrdef->period = 'period'; 	// --/--
				$attrdef->dt = 'dt';			// --/--
				$attrdef->par = 'par';		// --/--
				$attrdef->fn = 'fn';			// --/--
				$attrdef->fs = 'fs';			// --/--
				$attrdef->ft = 'ft';			// --/--
				$attrdef->fb = 'fb';			// --/--
			$attr_select = addslashes(<<<SEL
SELECT 
				$attrdef->adm, $attrdef->period, $attrdef->dt, $attrdef->par
				, $attrdef->fn, $attrdef->fs, $attrdef->ft
				FROM $attrdef->atable
				WHERE $attrdef->filter
				AND $attrdef->adm = ?
				AND $attrdef->period = ?
				AND $attrdef->dt = ?
				LIMIT ALL
SEL
);
			return <<<CTX
{
				ctx::\$current = new ctx(null, '0');
				ctx::\$current->Period = \$data->period;
				ctx::\$current->Date = \$data->dt;
				ctx::\$current->Adm = \$data->adm;
				ctx::\$current->Param = '';
				ctx::\$attribute_database = [];
				foreach(process_query('$attr_select',
				  [ctx::\$current->Adm, ctx::\$current->Period, ctx::\$current->Date] ) 
				  as \$attr_row) {
					ctx::\$attribute_database[\$attr_row->$attrdef->adm]
						[\$attr_row->$attrdef->period][\$attr_row->$attrdef->dt]
						[\$attr_row->$attrdef->par]
					= NVL(trimZ(\$attr_row->$attrdef->fn), NVL(\$attr_row->$attrdef->fs, \$attr_row->$attrdef->ft));
				}
			}~
CTX;
}, $text);
	//generate commands
	$text = preg_replace_callback('/(?<=\[\[).*?(?=\]\])/s', 
		function($m) use(&$selects, &$attributes, $escape_mode){
			global $RE_ID;
			$cmd = $m[0];
			//var_dump($cmd);
			if(preg_match("/^\s*+\\$($RE_ID)(?:\s++of\s++\\$($RE_ID))?\s*+:(.*)/si", $cmd, $m)) {
				$sample = '';
				$a_add = '';
				$a_add_top = '';
				if(preg_match('/^\s*+SAMPLE\s++AND\s/si', $m[3])) {
					$sample = '_and_sample';
				}
				if(@$m[2])
					$res = "foreach(with_loop_info$sample(\${$m[2]}->$m[1], \$counters->{$m[1]}, \$statements->{$m[1]} = \${$m[2]}->subselect_info('$m[1]')) as \$$m[1])";
				else
					$res = "foreach(with_loop_info$sample(\$rowsets['$m[1]'], \$counters->{$m[1]}, \$statements->{$m[1]} = @\$rowsets['$m[1]']->exInfo) as \$$m[1])";
			} 
			else if(preg_match("/^ESC\s+(.*)/i", $cmd, $m)) {
				$escape_mode = $m[1];
				$res = "";
			} 
			else if(preg_match("/^(FILE|CFILE)\s+(.*)/i", $cmd, $m)) {
				$perm = $m[1] == 'CFILE' ? 'TRUE' : 'FALSE';
				$res ="echo file_URI($m[2], null, $perm);";
			} else if(preg_match("/^LIB$/i", $cmd, $m)) {
				$res = <<<EEE
					echo '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',"\\n";
					echo '<link rel="stylesheet" href="',file_URI('//az/lib/main.css', null, TRUE),'">',"\\n";
					echo '<link rel="stylesheet" href="',file_URI('//az/lib/local.css', null, TRUE),'">',"\\n";
					echo '<script type="text/javascript" src="',file_URI('//az/lib/scripts.js', null, TRUE),'"></script>',"\\n";
					echo '<script type="text/javascript" src="',file_URI('//az/lib/editing20.js', null, TRUE),'"></script>',"\\n";
EEE;
			} else if(preg_match("/^CHART$/i", $cmd, $m)) {
				$res =  sharing::load('d3');
				$res .= <<<EEE
					echo '<link rel="stylesheet" href="',file_URI('//az/lib/d3c.css', null, null),'">',"\\n";
					echo '<script type="text/javascript" src="',file_URI('//az/lib/d3c.js', null, null),'"></script>',"\\n";
EEE;
			} else if(preg_match("/^QE\s+(.*)$/i", $cmd, $m)) {
				$res = sharing::load('d3');
				$res .= <<<EEE
				echo qe_control_model('$m[1]');
				echo '<script type="text/javascript" src="',file_URI('//az/lib/qe.js', null, null),'"></script>',"\\n";
				echo '<link rel="stylesheet" href="',file_URI('//az/lib/qe.css', null, null),'">',"\\n";
EEE;
			} else if(preg_match("/^\s*+(CALL|REF|CREF)
				\s++
				(?<id>$RE_ID)?\s*+
				(:\s*+(?<file>[^:]*+))?
				(:(?<cmd>.*))?/sxi", $cmd, $m)
			){
					//to call and pass context we should assign elements to $call_context variable
					//to call and pass arguments we should assign elements to $command_args variable
					if($m[1]==='CALL') $op = 'call_template'; else $op = 'template_reference';
					if($m[1]==='CREF') $perm = 'TRUE'; else $perm = 'FALSE';
					$res = "$op('".$m['id']."',"
						.phpQuote(@$m['file']).","
						.phpQuote(@$m['cmd']).", \$command_args,\$call_params, __FILE__, $perm);"; 
			} else if(preg_match("/^\s*[{}]\s*$/si", $cmd, $m)){
				$res = $cmd;
			} else {
					//field parsing
					$pre = '';
					$cmd = unescape_template_command($cmd);
					$strings = [];
					$cmd = preg_replace_callback('/
						\'[^\\\']*+(\.[^\\\']*+)*\'
					|
						\"[^\\\"]*+(\.[^\\\"]*+)*\"
					/sx', function($m) use(&$strings) {
							$c = count($strings); $strings[] = $m[0];
							return "'$c'";
						}
					,$cmd);
					$cmd_part = explode('~', $cmd);
					$cmd_part = array_map('trim', $cmd_part);
					$db_part = array_shift($cmd_part);
					if(preg_match("/^($RE_ID):(.*)/", $db_part, $m)) {
						$pre = "$m[1]:; ";
						if(!$m[2])
							$db_part = ";";
						else
							$db_part = "@\$$m[1]";
					}
					//process field part
					$db_part = preg_replace("/\\\$params\s*\.\s*($RE_ID)/", 
						'$params->$1', $db_part);
					$db_part = preg_replace_callback(
						"/\\$($RE_ID)\s*+
							\.
							( 
									(?:\s*+$RE_ID\s*+\.)*
									\s*+
									$RE_ID
								|
									\\{(?<expr>[^}]*+)\\}
							)
						/sx",
						function($m) use(&$selects, $strings) {
							//var_dump($m);
							if(!array_key_exists($m[1], $selects)) return $m[0]; //nothing to do
							$select = $selects[$m[1]];
							if(isset($m['expr'])) {
								$f = preg_replace_callback("/'(\d+)'/", 
									function($m) use($strings) { return $strings[(int)$m[1]];}
									,trim($m['expr'])
									);
								switch($f) {
								case 'NPP': return "\$counters->$m[1]";
								case 'COUNT': return "(\$counters->$m[1]-1)";
								case 'FIRST': return "(\$counters->$m[1] === 1)";
								case 'SAMPLE': return "(\$counters->$m[1] === 0? 'sample' : '')";
								case 'SQL': return "make_counting_command(\$statements->$m[1])";
								}
								global $RE_ID;
								if(preg_match("/^CMD([ID])?(\\+PK)?\\s+(.*)/", $f, $mc)) {
									$ins = $mc[1];
									$with_pk = $mc[2];
									$cmd_fields = $mc[3];
									
									preg_match_all("/a\\.($RE_ID)/", $cmd_fields, $mc);
									foreach($mc[0] as $v)
										if(!array_key_exists($v,$select->fields))
											$select->fields[$v] = str_replace('.','__',$v);
									if($with_pk) $with_pk = implode(',', $mc[1]);
									return 
									$ins == 'I'?
									"make_manipulation_command(null, 0, \$statements->$m[1], '$with_pk')"
									:
									($ins == 'D'?
									"make_manipulation_command(\$$m[1], -1, \$statements->$m[1], '$with_pk')"
									:
									"make_manipulation_command(\$$m[1], \$counters->$m[1], \$statements->$m[1], '$with_pk')");
								}
								$alias = 'x_'.count($select->fields);
							} else {
								$f = preg_replace('/\s+/s', '', $m[2]);
								$alias = strpos($f,'.')? 
									//'x_'.count($select->fields) 
									str_replace('.','__',$f)
									: $f;
							}
							if(array_key_exists($f,$select->fields)) {
								$alias = $select->fields[$f];
								return "\$$m[1]->$alias";
							}
							$select->fields[$f] = $alias;
							return "\$$m[1]->$alias";
						}
						,$db_part
					);
					$db_part = preg_replace_callback(
						"/\\.[a-z][a-zA-Z0-9_]*+(?: : [0-9]++ )? 
							(?!=\s*[(])
							(?:\s*+
								\\.[a-z][a-zA-Z0-9_]*+(?: : [0-9]++ )?
								(?!=\s*[(])
							)*
						/sx",
						function($m) use(&$selects, &$attributes, $strings) {
							return "ctx::\$current".
								str_replace('.', '->',
									preg_replace('/:([0-9]+)/', '($1)', $m[0])
								).'->V()';
						}
						,$db_part
					);
					//remove explicit to value conversion if only path give
					if(preg_match('/^\s*
						(ctx::\$current
							(
							->[a-z][a-zA-Z0-9_]*(\([0-9]+\))?
							)*
						)
						->V\(\)\s*
						$/sx', $db_part, $m))
						$db_part = $m[1];
					if($db_part == '' || $db_part == '$') $db_part = 'ctx::$current';
					$res = $db_part;
					
					if($cmd_part && 
						preg_match('/^(E[a-z0-9]?)(?:\s+(.*))?$/s'
							, end($cmd_part), $mend )) {
						array_pop ($cmd_part);
						$cmd_part[] = "output_editor_$mend[1]('".count($strings)."')";
						$strings[] = phpDQuote(preg_replace_callback("/'(\d+)'/", 
							function($m) use(&$strings) { return $strings[(int)$m[1]];}
							,@$mend[2])
						);
					}
					if($cmd_part && 
						preg_match('/^e:([a-zA-Z0-9+-]*)(?:\s+(.*))?$/s'
							, end($cmd_part), $mend )) {
						array_pop ($cmd_part);
						$cmd_part[] = "output_editor2(default_templated_editor('$mend[1]'), '".count($strings)."','".(count($strings)+1)."')";
						$mend = explode('>:<', @$mend[2]);
						$mend[0] = preg_replace_callback("/'(\d+)'/", 
							function($m) use(&$strings) { return $strings[(int)$m[1]];}
							,@$mend[0]);
						$mend[1] = preg_replace_callback("/'(\d+)'/", 
							function($m) use(&$strings) { return $strings[(int)$m[1]];}
							,@$mend[1]);
						
						$strings[] = phpDQuote($mend[0]);
						$strings[] = phpDQuote($mend[1]);
					}
					
					foreach($cmd_part as $c) {
						if(preg_match("/^\\\$call_params\\.(.*)/s", $c, $m))
							$res = "\$call_params->$m[1] = $res";
						else if(preg_match("/^\\$$RE_ID/", $c, $m))
								$res = "$m[0] = $res";
						else if(preg_match('/^([+-]?\d+(\.\d*)?|\'.*\')$/s', $c))
							$res = "NVL( $res, $c )";
						else
							if($c == '=') {
								$res =	"unescaped_output($res)";
							}
							else if($c == '.') {
								$res =	"output_$escape_mode($res)";
							}
							else if($c == '$') {
								$res = "ctx::\$current = $res";
							}
							else if(preg_match("/^\\?:($RE_ID)/s", $c, $m)) {
								$res = "if(\$$m[1] = !($res)) goto $m[1]";
							}
							else if(preg_match('/^\?(.+)/s', $c, $m)) {
								if($m[1][0] === "'")
									$res = "wrap_notnull( $res, $m[1])";
								else {
									$res = "wrap_notnull($res, '".count($strings)."')";
									$strings[] = phpQuote($m[1]);
								}
							}
							else if($c == '#') {}
							else if($c == '?') {}
							else if(preg_match("/^($RE_ID\()(.*)/s", $c, $m))
								$res = $m[1].$res.', '.$m[2];
							else
								if($c)
									$res = "$c($res)";
					}
					if(!$cmd_part) $cmd_part = ['.'];
					$res = 
						preg_replace('/^output_editor_([a-zA-Z0-9]+)\(([^-]+)->([^,]+)(,(.*))?\)$/s'
							, 'output_editor(\'$1\',$2->ns(\'$3\')$4)'
							, $res );
					$res = 
						preg_replace('/^output_editor2\(([^-]+)->([^,]+)(,(.*))?\)$/s'
							, 'output_editor2($1->ns(\'$2\')$3)'
							, $res );
					$cmd_part[] = 
						preg_replace('/^output_editor_[a-zA-Z0-9]+\(.*/s'
							, 'output_editor'
							, array_splice($cmd_part, -1)[0] );
					$cmd_part[] = 
						preg_replace('/^output_editor2\(.*/s'
							, 'output_editor'
							, array_splice($cmd_part, -1)[0] );
					switch( end($cmd_part) )
					{
						case 'Days':
						case 'Months':
						case 'Quarters':
						case 'HalfYears':
						case 'Adm':
						case 'Items':
						case 'ItemsWithAdd':
							preg_match("/^($RE_ID)\((.*)\)$/s", $res, $m);
							$res = "foreach({$m[2]}->$m[1]() as \$L)";
							break;
						case 'ERROR':
							$res = "if( !$res ) throw new Exception($t);";
							break;
						case 'output_editor':
						case '':
						case '=':
						case '?:':
							$res .= ';';
						case '#':
							break;
						case '?':
							$res = "if( $res )";
							break;
						default:
							if(end($cmd_part)[0] == '$')
								$res .= ';';
							else if(preg_match('/^\?:/',end($cmd_part))) { $res.=';'; }
							else
							switch(substr(rtrim($res),-1,1)) {
								case ';': case '{' : case '}':
									break;
								default:
									$res = "output_$escape_mode($res);";
							}
					}
					
					$res = "$pre$res";
					
					//restore strings
					$res = preg_replace_callback("/'(\d+)'/", 
						function($m) use(&$strings) { return $strings[(int)$m[1]];}
						,$res);
			}
			return $res;
		}
	, $text );
	
	//decorate $context
	do {
		$text = preg_replace('#\[\[\ctx::\$current\s*+=(.*?)\]\] (.*?)
				(\[\[\{\]\] 
					[^[]*+
					(?:(?:\[(?!\[\{\]\])|(?-1))[^[]*+)*?
				\[\[\}\]\]}) #sx', 
	'$2 [[{ctx::push($1); try]] $3 [[catch(Exception $___e){ctx::pop(); throw $___e; } ctx::pop(); }]]'
	, $textp = $text);
	} while($textp !== $text);
	

	//clear special tags
	$text = preg_replace('/\[\[ZONE:.*?\]\]/i', '', $text);

	//join sequential tags
	$text = str_replace(']][[','', $text);

	//phpise
	$text = preg_replace_callback('/\[\[(.*?)\]\]/s', 
		function($m) { return 
			'<'.'?php '.
			preg_replace('/\]-(-*+)\]/', ']$1]', $m[1])
			.'?'.'>';
			}
		, $text);

	//unescape tags
	$text = preg_replace('/\[-(-*+)\[/', '[$1[', $text);
	
	//repalce '*' with collected fields in all selects 
	// master declared before details
	// so we just go backward
	//var_dump($selects);
	end($selects);
	while($s = current($selects)) {
		//var_dump($s);
		$fields = 
			array_map(function($a,$b) { return $a===$b ? $a : "$a AS $b"; }
			,array_keys($s->fields), array_values($s->fields)
		);
		$fields = array_merge($fields, 
			array_map(function($a,$b) { return "( $b->select ) AS ARRAY $a"; }
			,array_keys($s->arrays), array_values($s->arrays)
		));
		$fields = implode(', ', $fields);
		$s->select = preg_replace('/(^SELECT\s(?:DISTINCT\s)?|\sSELECT\s(?:DISTINCT\s)?|,|^)\s*\*\s*(?=,|FROM\s|$)/', "$1 $fields ", $s->select);
		prev($selects);
	}

	//take first select as 'MAIN'
	if(!$selects) $selects = [ '-' ];
	if(!$main_select_alias) $main_select_alias = array_keys($selects)[0];
	//var_dump($selects);
	$select = $selects[$main_select_alias];
	unset($selects[$main_select_alias]);
	
	//$select == '' ===> use cmd as it is
	if($select === '-') { //just use one dummy row 
		$select = new stdClass;
		$select->select = "['dummy' => null]";
	}

	echo "\n\t\$counters = new stdClass;";
	echo "\n\t\$statements = new stdClass;";
	echo "\n\t\$qcmd = merge_queries(".phpDQuote($select->select).", \$cmd, \$args, \$requested_offset, \$requested_limit, \$page_limit);";
	echo "\n\t\$rowsets['$main_select_alias'] = process_query(\$qcmd, \$args);";
	//for paging
	echo "\n\tif(is_object(\$rowsets['$main_select_alias'])) \$main_counter =& \$counters->{'$main_select_alias'};";
	echo "\n\tif(is_object(\$rowsets['$main_select_alias'])) \$rowsets['$main_select_alias']->offset = \$requested_offset;";

	//var_dump($selects);
	foreach($selects as $n=>$sel) {
		if(!$sel->outer) {
			//free standing select => execute it immidiatly
			if(preg_match('/^\s*+ARRAY\s++(.*)/si',$sel->select, $m)) {
				echo "\n\t\$rowsets['$n'] = $m[1];";
			} 
			else if(@$sel->call_args)
				echo "\n\t\$rowsets['$n'] = process_query(".phpDQuote($sel->select).", $sel->call_args);";
			else
				echo "\n\t\$rowsets['$n'] = process_query(".phpDQuote($sel->select).");";
		}
	}
	
	echo "\n?>";
	echo $text;
	echo "<?php \n";

	echo "\n};\n";
}

//if(__FILE__ != TOPLEVEL_FILE) return;

if($argc <= 1 || $argv[1] == '-') {
	$text = file_get_contents('php://stdin');
	$file = '-';
	$options = getopt("p::");
	$path_prefix = @$options['p'] ?: __DIR__;
} else {
	$options = getopt("c:p::",array("docx::"));
	$path_prefix = @$options['p'] ?: dirname($options['c']);
	if(array_key_exists("docx",$options)) {
		$DOCX_MODE = true;
		$zip = new ZipArchive;
		if ($zip->open($file = $options['c']) === TRUE) {
			$text = $zip->getFromName('word/document.xml');
			$text = preg_replace_callback('/\[\[(.*?)\]\]/xsi',function($m) {
				$t = preg_replace('/<(.*?)>/xsi','',$m[1]);
				$t = '[['.html_entity_decode($t, ENT_HTML5 | ENT_QUOTES).']]';
				return $t;
			},$text);
			$zip->close();
			/*
			tempnam("tmp","zip");
			copy(__DIR__.'/sample.xlsx', $file);
			$zip = new ZipArchive;
			$zip->open($file);
			readfile($file);
			unlink($file);
			*/
			//$text = file_get_contents( "$file.tmp",$zip->getFromName('word/document.xml') );
			//exec("$php -f $templater -- -c $file.tmp",$output);
			//if(zip->open("$file.tmp"))
		} else {
			die('Failed to open docx archive');
		}
		
	} else {
		$text = file_get_contents($file = $options['c']);
	}
}

$lib_path = explode(DIRECTORY_SEPARATOR, __DIR__);
$path_prefix = explode(DIRECTORY_SEPARATOR, realpath($path_prefix));

//echo "$options[p]\n".implode('/',$lib_path),"\n",implode('/',$path_prefix);

for($i = 0; $i < min(count($lib_path), count($path_prefix)); ++$i)
	if($lib_path[$i] != $path_prefix[$i]) break;

array_splice($path_prefix, 0, $i);
array_splice($lib_path, 0, $i);

//echo "\n".implode('/',$lib_path),"\n",implode('/',$path_prefix);

$library_prefix = 
		implode(DIRECTORY_SEPARATOR, 
			array_merge(count($path_prefix)?array_fill(0,count($path_prefix),'..'):[], $lib_path));
if($library_prefix) $library_prefix = '/'.$library_prefix;

//echo "\n$library_prefix";

if(@$DOCX_MODE) 
	ob_start();

templater_take_zones($text, $file);

if(@$DOCX_MODE) {
	$templ = ob_get_clean();
	$tmp = tempnam("tmp","zip");
	copy("$file", $tmp);
	$zip = new ZipArchive;
	$zip->open($tmp);
	$zip->addFromString('word/document.xml', $templ);
	$zip->close();
	echo '<'.'?php ob_start();'.'?'.'>';
	echo $templ;
	echo '<'.'?php $filled = ob_get_clean(); ?'.'>';
	echo '<'.'?php ob_start();'.'?'.'>';
	readfile($tmp);
	echo '<'.'?php';
	$filename = substr($file,0,strlen($file)-2);
	echo <<<XXX
	\$archive = ob_get_clean();
	\$tmp = tempnam("tmp","docx");
	file_put_contents(\$tmp,\$archive);
	\$zip = new ZipArchive;
	\$zip->open(\$tmp);
	\$zip->addFromString('word/document.xml', \$filled);
	\$zip->close();
	header('Content-type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
	header('Content-Disposition: attachment; filename="$filename"');
	readfile(\$tmp);
	unlink(\$tmp);
XXX;
	echo '?'.'>';
	unlink($tmp);
}

return;



$text  = "<a><n> 
<:><aa>1
	<b>
	<:><a>sss</a>
	<c>
	<aa>2<b></aa>
	<d>
</aa>
<a>3</a>";

do { 
	$text = preg_replace('#<:>
				(?<d><(\S+?)(\s|>)
					[^<]*+(?:(?:<(?!\2)|(?&d))[^<]*+)*?
				</\2>)
		#sx', '{$1}', $textp = $text);
} while($text !== $textp);

//echo $text;
