<?php
// ========= functions ===============================
require_once(__DIR__.'/kladr-defs.php');
function getInfo(&$stmt_kldr,$code,$from,$count,&$cache)
{	
	$nullrep=13-($from+$count);
	$reg=mb_substr($code,$from,$count);
	$key=mb_substr($code,0,$from).$reg;
	// make xx000000000 xxccc000000 ..
	$seln=$key.str_repeat('0',$nullrep);
	if (mb_substr($code,$from,$count)==str_repeat('0',$count)) return array("","");
	if (!isset($cache[$key]))			 
	{
		$stmt_kldr->execute(array($seln));
		$rezt=$stmt_kldr->fetchAll(PDO::FETCH_ASSOC);
		if (count($rezt)>0)
		{
			$tmpch=array($rezt[0]['_name'],$rezt[0]['_socr']);
			$cache[$key]=$tmpch;
			return 	$cache[$key];
		}
		else return array("","");		
	}
	else return $cache[$key];
}
function getFullInfo(&$stmt_kldr,$code,&$data_cache)
{
	$reg=getInfo($stmt_kldr,$code,0,2,$data_cache);
	$rn=getInfo($stmt_kldr,$code,2,3,$data_cache);
	$gor=getInfo($stmt_kldr,$code,5,3,$data_cache);
	$punkt=getInfo($stmt_kldr,$code,8,3,$data_cache);			
	$adr=array('summ'=>0,'stresh'=>'','code'=>$code,'sreg'=>$reg[1],'reg'=>$reg[0],
							'srn'=>$rn[1],'rn'=>$rn[0],'sgor'=>$gor[1],'gor'=>$gor[0],
							'spunkt'=>$punkt[1],'punkt'=>$punkt[0],'sstreet'=>'','street'=>'');
	return $adr;
}
function getNumberFromStr($str)
{
	$mcs=null;
	preg_match("/\d+/u",$str,$mcs);
	if (count($mcs)>0) return $mcs[0];
	return null;	
}
function getIskl()
{
	$rez[]=array('words'=>array('ленинские горы'),'code'=>'770000000007305');
	return $rez;
}
function nextTry(&$stmt_street_ind,&$index_try,$index,$source,$street_at_end)
{
	//$smt=$conn->query("select * from kl_street where index like '".mb_substr($index,0,3)."___'");
	$stmt_street_ind->execute(array($index));
	$indrez=$stmt_street_ind->fetchAll(PDO::FETCH_ASSOC);
	if (!$indrez)
	{
		$stmt_street_ind->execute(array(mb_substr($index,0,3)."___"));
		$indrez=$stmt_street_ind->fetchAll(PDO::FETCH_ASSOC);
	}	
	if ($indrez)
	{
		$codelike=mb_substr($indrez[0]['_code'],0,2)."_____________00";
		$subindex=" _code like '$codelike' ";
		$street_name=null;
		$remove_list[]=$index;
		$T_T_adr=$source;
		$_strt=array();		
		preg_match('/,?\s*(?:'.
				'улица\s|проспект\s|пр-кт\s|(?:ул|пр|пл|пер|просп|наб)(?:\.|\s)'.
				')\s*(?P<street>[\/0-9а-я]+)'.
				'?/ui',$source, $_strt);
		if (isset($_strt['street'])) $street_name=$_strt['street'];	
		if ($street_name!==null) $remove_list[]=$street_name;
		foreach ($remove_list as $dl) $T_T_adr=str_replace($dl,"", $T_T_adr);
		$dest_arr=array();		
		$dest_arr=preg_split("/[\s,.]+/u",$T_T_adr);
		if ($street_at_end===0) $dest_arr=array_reverse($dest_arr);
		if ($street_name!==null) $dest_arr[]=$street_name;//array_unshift($dest_arr, $street_name);		
		$cnt=0;
		$last="";			
		foreach($dest_arr as $da) 
		{
			if (mb_strlen($da,'UTF-8')>3)
			{
				$nml=" and _name like '%_".mb_substr($da,1)."%'";//($da, MB_CASE_TITLE, "UTF-8")
				$sql="select * from ".kl_street." where ".$subindex.$nml;
				//if ($debug_mode) echo "\n$sql\n";
				//array_push($index_try,$sql);
				$index_try[]=$sql;
			}
		}
		//$index_try=array_reverse($index_try);
		//print_r($index_try);		
	}	
}
function testWord($fst,$scd)
{
	// if number in string	
	$num1=getNumberFromStr($fst);		
	if ($num1!=null&&mb_strlen($fst)<=mb_strlen($num1)+4)
	{
		$num2=getNumberFromStr($scd);		
		if ($num1==$num2&&mb_strlen($scd)<=mb_strlen($num2)+4) return true;
		else return false;
	}
	// if "." in kladr
	$dot_pos=mb_strpos($fst,".");
	if ($dot_pos!==false) 
	{
		if (mb_substr($fst,0,$dot_pos)==mb_substr($scd,0,$dot_pos)) 
		{
			//echo "\n************$fst=$scd";
			return true;
		}
		else return false;
	}
	// other case
	$liven=0;
	$count_ch=mb_strlen($fst);
	if ($count_ch>4) $liven=1;//2
	if ($count_ch>2&&$count_ch<5) $liven=1;
	if (mb_liven_wrd($fst,$scd)<=$liven) 
	{
		//echo "\n************$fst=$scd";
		return true;
	}
	return false;	
}
function splitWithDots($str)
{
	// "." is delimiter but not deleted
	// delete " " and ","
	$rez=array();
	$farr=preg_split('//', $str, -1, PREG_SPLIT_NO_EMPTY);
	$string="";
	foreach($farr as $st)
	{
		if ($st!=" "&&$st!=",")
		{
			if ($st!=".") $string.=$st;
			else
			{
				if ($st=="."&&$string!="") $string.=$st;	
			}			
			//else $string.=$st;			
		}
		if (($st==" "||$st==",")&&$string!="")
		{
			$rez[]=$string;
			$string="";
		}
		if ($st=="."&&$string!="")
		{
			$rez[]=$string;
			$string="";
		}				
	}
	if ($string!="") $rez[]=$string;
	return $rez;
}
function mb_replace_one($str,$substr)
{
	$ntmpstr=$str;
	$tpos=mb_strpos($str, $substr);
	if ($tpos!==false) $ntmpstr=mb_substr($str,0,$tpos).mb_substr($str,$tpos+mb_strlen($substr));
	return $ntmpstr;
}
function outResults($is_OK,$solo_mode,$test_mode,$debug_mode,$source="",$rezinfo=null,$rezpth=null)
{
	if ($is_OK)
	{
		$outinfo="";
		$i=0;
		foreach($rezinfo as $rzz) 
		{
			if ($i>2&&$rzz!="") $outinfo.=" ".$rzz;
			else $i++;						
		}
		if ($test_mode)
		{
			$outstr="\n\t".$source;
			$outstr.="\n\t".$outinfo." code: ".$rezinfo['code'];
			fwrite($rezpth,$outstr);
			echo "*";
		}
		if ($debug_mode) 
		{
			echo "\nResult\n";
			print_r($rezinfo);								
		}
		if (!$solo_mode&&!$debug_mode&&!$test_mode)
		{
			print_r($rezinfo['code']);
			echo " ".$outinfo;
		}	
	}
	else 
	{
		if ($test_mode) fwrite($rezpth,"\nFALSE\t".$source);
		if (!$solo_mode) echo "-1";
	}					
}
function mb_liven_wrd($str1,$str2)
{
	$tr=array("а"=>"a","б"=>"b","в"=>"v","г"=>"g","д"=>"d","е"=>"e","ё"=>"A","ж"=>"j",
		"з"=>"z","и"=>"i","й"=>"y","к"=>"k","л"=>"l","м"=>"m","н"=>"n","о"=>"o","п"=>"p","р"=>"r",
		"с"=>"s","т"=>"t","у"=>"u","ф"=>"f","х"=>"h","ц"=>"B","ч"=>"C","ш"=>"D","щ"=>"E","ъ"=>"F",
		"ы"=>"G","ь"=>"H","э"=>"I","ю"=>"J","я"=>"K");
	return levenshtein(strtr($str1,$tr),strtr($str2,$tr));
}
function getBListNames()
{
	$arr=array("им","Им","им.","имени","Имени","Академика","Ак.","академика","Профессора","профессора");
	return $arr;
}
//======================================================
function getKLADR($address,$db_connection,$showErrs=false,$solo_mode=true,$file_in="",$file_out="")
{
	mb_internal_encoding("UTF-8");
	$iskl=getIskl();
	global $argv;
	$total=0;
	$grezs=0;
	$user_errs=0;
	$start_time=time();
	$source=$address;
	$data=$source;
	$code_try="";
	$test_mode=false;
	$debug_mode=true;
	$data_cache=array();
	$rezpth=null;
	if ($solo_mode)
	{
		$test_mode=false;
		$debug_mode=false;
	}
	else 
	{
		if (isset($argv[0])&&!$solo_mode) 
		{
			$test_mode=true;
			$debug_mode=false;
		}
	}		
	if ($debug_mode) echo "<pre>".$data;
	//echo "<pre>";
	//$debug_mode=true;
	try
	{
		$conn= $db_connection;//new PDO("{$db_config['server']}",$db_config['user'],$db_config['pass']);
		$conn->setAttribute (PDO::ATTR_ORACLE_NULLS,PDO::NULL_TO_STRING);
		$conn->setAttribute (PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);// exceptions for all errors
		$stmt_kldr=$conn->prepare("SELECT _name,_socr FROM ".kl_kladr." where _code=?");
		$stmt_street_ind=$conn->prepare("SELECT * FROM ".kl_street." where _index like ?");
		$stmt_street_code=$conn->prepare("SELECT * FROM ".kl_street." where _code=?");
		//--------------------test mode------------------------------------
		$str="no test";
		$tst_errs="";
		if ($test_mode)
		{
			$pth = fopen($file_in,"r");
			$rezpth=fopen($file_out, "w");	
			$str=fgets($pth);		
		}
		while ($str!==false)
		{
			if ($test_mode) 
			{
				$data=str_replace(array("\r","\n","\r\n","\"","'"),"", $str);
				$total++;
				$tst_errs="";
				$source=$data;		
			}
			//----- test iskl------
			$ts=getIskl();
			$iskl_rez=null;
			foreach($ts as $iskl)
			{
				$cwrd=0;
				foreach($iskl['words'] as $iis) if (mb_stripos($source, $iis)!==false) $cwrd++;
				if ($cwrd==count($iskl['words']))
				{
					$iskl_rez=getFullInfo($stmt_kldr, $iskl['code'], $data_cache);
					$iskl_rez['code']=$iskl['code'];
					$stmt_street_code->execute(array($iskl['code'].'00'));
					$rzz=$stmt_street_code->fetchAll(PDO::FETCH_ASSOC);
					if (count($rzz)!=0)
					{
						$iskl_rez['sstreet']=$rzz[0]['_socr'];
						$iskl_rez['street']=$rzz[0]['_name'];
					}
					if ($solo_mode) return $iskl_rez;
					if ($test_mode)	$str=fgets($pth);						
					else $str=false;
					outResults(true,$solo_mode,$test_mode,$debug_mode,$source,$iskl_rez,$rezpth);
					$grezs++;
					break;
				}
			}
			if ($iskl_rez!=null) continue;
			$data=mb_strtolower($data,'UTF-8');
			if (mb_strlen($str,'UTF-8')<10)$user_errs++;
		//-----------------------------------------------------------------
			if (preg_match("#[0-9]{6}#",$data,$matches)==1) 
			{
				$street_at_end=-1;						
				$index_at_end=true;
				$index=$matches[0];
				if (mb_strlen($data)/2>mb_strpos($data,$index)) $index_at_end=false;
				$data=str_replace($index,"",$data);
				// remove houses
				$dma=null;
				preg_match('/'.
					',?\s*(?:дом\s|д(?:\.|\s))\s*(?P<house>\d[\/0-9а-я]*(?:\s+литер\s[а-я])?)'.
					'(?:,?\s*(?:корпус\s|кор(?:\.|\s)|корп(?:\.|\s)|к(?:\.|\s)|-)\s*(?P<corpus>[\/0-9а-я]+))?'.
					'(?:,?\s*(?:строение\s|стр(?:\.|\s)|с(?:\.|\s))\s*(?P<build>[\/0-9а-я]+))?'.
					'(?:,?\s*(?:офис\s|оф(?:\.|\s))\s*(?P<office>[\/0-9а-я]+))?'.
					'(?:,?\s*(?:помещение\s|пом(?:\.|\s))\s*(?P<place>[\/0-9а-я]+))?'.
					'(?:,?\s*(?:(?:квартира\s|-|кв(?:\.|\s))\s*(?P<flat>[\/0-9а-я]+)|(?:комната\s|ком(?:\.|\s))\s*(?P<room>[\/0-9а-я]+)))?/ui',
				 $data, $dma);
				if (count($dma)>0) 
				{
					$dma_pos=mb_strpos($data, $dma[0]);
					if (mb_strlen($data)/2<$dma_pos) $street_at_end=1;
					else $street_at_end=0;				
					$data=str_replace($dma[0]," ",$data);
					$source=str_replace($dma[0]," ",$source);
				}
				else
				{
					if ($index_at_end) 	$street_at_end=0;
					else $street_at_end=1;
				}
				$index_try=array("select _code from ".kl_street." where _INDEX='".$matches[0]."';");
				$last_try=0;
				//$remove_list=array();
				while (count($index_try)!=0)
				{	
					$qvr=array_pop($index_try);		
					$stmt=$conn->query($qvr);
					if ($debug_mode) echo "\n$qvr\n";
					$rez_doma=$stmt->fetchAll(PDO::FETCH_ASSOC);	
					// del diplicate streets
					if (count($rez_doma)>2000)
					{
						if ($debug_mode) echo "\nover 9000 in doma\n";
						if ($last_try>0&&count($index_try)==0) 
						{
							outResults(false,$solo_mode,$test_mode,$debug_mode,$source,0,$rezpth);
							if ($solo_mode) return null;
						}
						if ($last_try==0)nextTry($stmt_street_ind,$index_try,$index,$source,$street_at_end);
						continue;					
					}
					$tmp_doma=array();		
					foreach ($rez_doma as $code=>$ccc) $tmp_doma[]=mb_substr($ccc['_code'],0,15);
					$new_doma=array_unique($tmp_doma);					
					$adrs=array();					
					// create possble adresses array					
					$str_sql="SELECT _code,_name,_socr FROM ".kl_street." where ";
					$fst=true;
					foreach($new_doma as $nm=>$code) 
					{
						$adrs[]=getFullInfo($stmt_kldr, $code, $data_cache);
						if (!$fst) $str_sql.=" or ";
						else $fst=false;
						$str_sql.=" _code='".$code."00'";
					}			
					if (count($adrs)!=0)
					{
						$str_sql.=";";
						$stmt=$conn->query($str_sql);
						$streets=$stmt->fetchAll(PDO::FETCH_ASSOC);//PDO::FETCH_KEY_PAIR
					}
					$frez=false;
					$rezinfo=null;
					$rezarr=null;
					$rezcounter=0;					
					foreach($adrs as $elt=>&$info) 
					{
						foreach ($streets as $ss)
						{
							if ($ss['_code']==$info['code'].'00')
							{
								$info['street']=$ss['_name'];
								$info['sstreet']=$ss['_socr'];
								break;
							}
						}					
						$tmpstr=$data;
						// find adr data in adress string
						$reg_b=false;
						$rn_b=false;
						$gor_b=false;
						$punkt_b=false;
						$street_b=false;
						//echo "\n**********\n";print_r($info);//\n%%%%%%%%%%%%%";				
						foreach ($info as $inf=>$_val)
						{						
							if (mb_substr($inf,0,1)=='s'&& mb_substr($inf,0,2)!='st') continue;
							$val=mb_strtolower($_val,'UTF-8');
							if ($val=="") continue;						
							if ($inf!='code')
							{
								$b_ok=false;
								$fnd_arr=null;
								//$fnd_arr[]=$val;
								$c_ok=0;
								$dest_arr=splitWithDots($tmpstr);//preg_split("/[\s,.]+/u",$tmpstr,0,PREG_SPLIT_NO_EMPTY);							
								//if (stripos($val," ")!==false||stripos($val,"."!==false)) 
								$fnd_arr=splitWithDots($val);//("/[\s,.]+/u",$val,0,PREG_SPLIT_NO_EMPTY);//explode(" ",$val);
								// remove tresh								
								$tr_arr=getBListNames();
								foreach($tr_arr as $trsh)
								{
									$repl_wrd=array_search($trsh,$fnd_arr);
									if ($repl_wrd!==false) unset($fnd_arr[$repl_wrd]);
								}
								$new_fnd=array();
								// sranoe chiterstvo, otbrosim vse sokrashenia krome
								// B- bolshoi, M - malii, S - srednii
								// ostalnoe schitaem inicialami														
								foreach($fnd_arr as $fa)
								{
									if (mb_strpos($fa, ".")!==false)
									{
										$tfa=mb_strtolower($fa);
										if (mb_strlen($tfa)<3) 
										{
											if ($tfa=="б."||$tfa=="с."||$tfa=="м.") $new_fnd[]=$fa;
										}
										else $new_fnd[]=$fa;
									}
									else $new_fnd[]=$fa;									
								}				
								$fnd_arr=$new_fnd;																			
								$ok_arr=array();
								$f_arr=array();	
								$found_any=false;	
								foreach($fnd_arr as $wrd)
								{
									$wrd_finded=false;
									$c1=mb_strtolower($wrd,'UTF-8');
									if ($c1=="") continue;										
									for($i=0;$i<count($dest_arr);$i++)//($dest_arr as $tmp)	
									{											
										$c2=mb_strtolower($dest_arr[$i],'UTF-8');
										if ($c2=="") continue;	
										if (testWord($c1, $c2))
										{									
											//echo "\n@@@@@@@@@@$a2";										
											$found_any=true;
											$karr=array();
											// slova sovpadaut
											// zapominaem sleduiushee slovo i predidushee
											$src_arr=splitWithDots(mb_strtolower(str_replace($index,"",$source)));
											$zxarr=array_keys($src_arr,$c2);
											//echo "\n-----\n^$c2^^";print_r($zxarr);print_r($src_arr);echo "\n====";
											$t_ind=count($zxarr)-count(array_keys(splitWithDots(mb_strtolower($tmpstr)),$c2));
											$r_ind=$zxarr[$t_ind];
											/*
											if ($i-1>=0) $karr[]=mb_strtolower($dest_arr[$i-1]);
											else $karr[]="";
											if ($i+1<count($dest_arr)) $karr[]=mb_strtolower($dest_arr[$i+1]);
											else $karr[]="";										
											*/
											if ($r_ind-1>=0) $karr[]=mb_strtolower($src_arr[$r_ind-1]);
											else $karr[]="";
											if ($r_ind+1<count($src_arr)) $karr[]=mb_strtolower($src_arr[$r_ind+1]);
											else $karr[]="";
											
											$ok_arr[$c2]=$karr;
											$wrd_finded=true;
											//if ($debug_mode) echo "\n****$c1=$c2****\n";																				
											break;
										}											
									}
									// ne naidennie slova kladem v massiv
									if (!$wrd_finded) $f_arr[]=$c1;
								}							
								if (count($ok_arr)>0)
								{
									//echo "\n===";print_r($fnd_arr);	print_r($ok_arr);print_r($f_arr);						
									$c_ok=count($fnd_arr)-count($ok_arr);
									// 
									if (count($f_arr)>0)
									{
										//echo "\n************";print_r($ok_arr);print_r($f_arr);
										foreach ($f_arr as $ff)
										{
											foreach($ok_arr as $oa=>$oo)
												if (testWord($oo[0],$ff) || testWord($oo[1],$ff)) 
												{
													$c_ok--;
													if ($debug_mode)
													{
														echo "\n*****riv*****";
														print_r($f_arr);
													}													
												}
										}									
									}
									if ($c_ok==0) $b_ok=true;
								}
								if ($b_ok)
								{
									//echo "\n******$val******";
									$tmpstr=mb_replace_one($tmpstr, $val);
									if ($inf=='reg') $reg_b=true;
									if ($inf=='rn') $rn_b=true;
									if ($inf=='gor') $gor_b=true;
									if ($inf=='punkt') $punkt_b=true;	
									if ($inf=='street') $street_b=true;									
								}						
							} 
						}
						$tst_rez=false;					
						if ($last_try==0 && $street_b) $tst_rez=true;					
						if ($reg_b&&$street_b) $tst_rez=true;
						if ($gor_b&&$street_b) $tst_rez=true;
						if ($punkt_b&&$street_b) $tst_rez=true;
						if ($street_b) //$tst_rez
						{
							$frez=true;
							$sm=0;
							$ttarr=array('reg','rn','gor','punkt','street');
							foreach($ttarr as $t1) if ($info[$t1]=="") $sm+=1;
							if ($reg_b&&$info['reg']!="") $sm+=2;
							if ($rn_b&&$info['rn']!="") $sm+=2;
							if ($gor_b&&$info['gor']!="") $sm+=2;
							if ($punkt_b&&$info['punkt']!="") $sm+=2;
							if ($street_b&&$info['street']!="") $sm+=2;
							$info['summ']+=$sm;	
							$info['stresh']=$tmpstr;			
							$rezarr[]=$info;			
						}							
					}				
					//------- get result ----------
					if (count($rezarr)>0) //&&count($index_try)==0
					{						
						if ($debug_mode ) {echo "\nPoss rezs:\n";print_r($rezarr);echo "==============\n";}
						$max_sum=0;
						$count_l=0;
						foreach($rezarr as $rz)
						{
							$pff=false;
							// find rez with max summ
							$cnt=$rz['summ'];//count(explode(" ",$rz['street']));
							$c_count=mb_strlen($rz['street']);
							if ($cnt>$max_sum) $pff=true;
							if ($cnt==$max_sum)
							{								
								$dest_arr=preg_split("/[\s,.]+/u",$source,0,PREG_SPLIT_NO_EMPTY);
								$fs=$rz['sstreet'];	
								$find_socr=array();																	
								if ($fs=="пр-кт") $find_socr=array("Пр","пр","пр-т");
								$find_socr[]=$fs;								
								foreach($find_socr as $fsocr)									
									foreach ($dest_arr as $ds) 
									{											
										$bzzz=mb_substr($ds,0,mb_strlen($ds));									
										if ($bzzz==$fsocr) $pff=true;
									}
							}
							if ($pff)
							{
								$max_sum=$cnt;
								$rezinfo=$rz;	
								
								//outResults(true,$solo_mode,$test_mode,$debug_mode,$source,$rezinfo,$rezpth);
							}
						}
						$index_try=array();					
					}
					//-----------------------------				
					// if not found try change index				
					if ($last_try==0&&!$frez)
					{
						$last_try++;				
						nextTry($stmt_street_ind,$index_try,$index,$source,$street_at_end);									
					}
					if ($debug_mode&&count($rezarr)==0) {echo "\nAll adrs\n";print_r($adrs);echo "=============\n";}
					if (!$frez&&count($index_try)==0 || $frez&&count($rezinfo)==0) 
					{
						outResults(false,$solo_mode,$test_mode,$debug_mode,$source,0,$rezpth);
						if ($solo_mode) return null;
					}
					if ($frez&&count($rezinfo)!=0) 
					{
						if ($solo_mode) return $rezinfo;
						outResults(true,$solo_mode,$test_mode,$debug_mode,$source,$rezinfo,$rezpth);
						$grezs++;
					}
				//------END while (count($index_try)!=0)-----
				}						
			}
			else 
			{				
				if ($solo_mode) return null;
				outResults(false,$solo_mode,$test_mode,$debug_mode,$source,0,$rezpth);	
			}
			if ($test_mode)	$str=fgets($pth);
			else $str=false;
		}
		//--------------------
		if ($test_mode) 
		{
			$tm=time()-$start_time;
			$tstr="\n===============\nTotal: ".$total."\nOK: ".$grezs."\n".($grezs*100)/$total.
			"%"."\nUser errs ".$user_errs." ".($user_errs*100)/$total."%\nTime sec ".$tm;
			echo $tstr;
			fwrite($rezpth,$tstr);
		}
	}		
	catch(Exception $ex)	{if ($showErrs) echo "DB Error. ".$ex->getMessage();}
}