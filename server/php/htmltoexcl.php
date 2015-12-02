<?php
    //error_reporting(E_ALL);    
    //ini_set('display_errors', 'On');
    
    require_once __DIR__.'/PHPExcel-1.8/Classes/PHPExcel.php';
    require_once __DIR__.'/PHPExcel-1.8/Classes/PHPExcel/IOFactory.php';
    require_once __DIR__.'/PHPExcel-1.8/Classes/PHPExcel/Cell/AdvancedValueBinder.php';
    
    //require_once __DIR__."/../testenv_r.php";
    //rmn_logging();    
    
    //$link="http://localhost:3000/doc_report_typed.php";
    //$link="fulltable.html";
    //$link="http://localhost/exel/333.html";
    //$link="http://localhost/exel/222.html";
    //$htmlin=file_get_contents($link);
    //$templ=__DIR__."/templ1.xls";
    //"http://localhost/exel/templ1.xls";
    //$htmlin=file_get_contents("test.php");
    //htmlToExcel($htmlin,"test.xls",$templ,false);
	//
    //http://213.208.189.135/ais/rsh/templates/chartdata.php?cmd=O:xxxxx.xlsx
	
	
    // html - raw html 
    // $fname - output filename fullpath
    // $template - template xsl filename full path.
    // $table_ws= 1 one table = one excel page, else all tables on one excel page
    function htmlToExcel($html,$fname,$template=null,$table_ws=TRUE)
    {
		if(preg_match('/^.*\.xls\s*$/',$fname)) 
			$format = 'Excel5';
		else
			if(preg_match('/^.*\.xlsx\s*$/',$fname)) {
				$format = 'Excel2007';
			}
		
        $html=preg_replace('/[\x01-\x1f]/', ' ', $html);
        $html=preg_replace('/\t+/', ' ', $html);
        //$html=preg_replace('/\n+/', ' ', $html);
        $tables=null;
        //preg_match_all("#<table.*?<\/table>#i",$pre_cont,$tables);
        $dom = new DOMDocument();
        if (!($dom->loadHTML($html))) return null;
        $tables = $dom->getElementsByTagName("table");
        $data=null;
        if ($tables && $template)
        {
            $objPHPExcel=new PHPExcel();
			$objPHPExcel=PHPExcel_IOFactory::load($template);
            $sh_count=0;            
            PHPExcel_Cell::setValueBinder( new PHPExcel_Cell_AdvancedValueBinder() );
            //PHPExcel_Shared_Font::setAutoSizeMethod(PHPExcel_Shared_Font::AUTOSIZE_METHOD_EXACT);
            $result['data']= array();
            $result['mrg']= array();
            $result['maxcol']=0;
            $result['mrg_supp']=array();
            $result['m_starts']=array();
            $row=0;
            $col=0;
            $row_start=1;
            foreach ($tables as $table)
            {
                if ($sh_count!=0 && $table_ws) $objPHPExcel->createSheet();                
                $objPHPExcel->setActiveSheetIndex($sh_count);
                if ($table_ws)
                {
                    $sh_count++;
                    $result['data']= array();
                    $result['mrg']= array();
                    $result['maxcol']=0;
                    $result['mrg_supp']=array();
                    $result['m_starts']=array();
                    $row=0;
                    $col=0;
                }
                $thead=$table->getElementsByTagName("thead");
                if ($thead) foreach($thead as $th) parceDOMNode($th,$result,$row,$col);                
                $thbody=$table->getElementsByTagName("tbody");
                if ($thbody) foreach($thbody as $th) parceDOMNode($th,$result,$row,$col);
                $tfoot=$table->getElementsByTagName("tfoot");
                if ($tfoot) foreach($tfoot as $th) parceDOMNode($th,$result,$row,$col);
                foreach ($result['mrg'] as $mrg) $objPHPExcel->getActiveSheet()->mergeCells($mrg);
                $rw=$row_start;
                $dtc=0;
                $T_T=array();
                $cl=0;
                for($i=1;$i<$result['maxcol'];$i++)
                        $objPHPExcel->getActiveSheet()->getColumnDimension(getColLetterByNum($i))->setAutoSize(true);                                
                while (isset($result['data'][$dtc]))
                {
                    if (!isset($result['mrg_supp'][$rw][$cl]) || 
						(isset($result['mrg_supp'][$rw][$cl]) && isset($result['m_starts'][$rw][$cl])))
                    {
                        //$T_T[$rw][$cl]=$result['data'][$dtc];
						$field_type = preg_match('/^\s*-?\d+(\.\d+)?\s*$/', $result['data'][$dtc] ) ? 
							PHPExcel_Cell_DataType::TYPE_NUMERIC : PHPExcel_Cell_DataType::TYPE_STRING;
                        $ltcell=getColLetterByNum($cl).$rw;
                        $objPHPExcel->getActiveSheet()->getCell($ltcell)->setValueExplicit($result['data'][$dtc], 
                                $field_type);
                        $dtc++;
                    }                   
                    $cl++;                    
                    if ($cl>=$result['maxcol'])
                    {
                        $cl=0;
                        $rw++;
                        if (!$template) $objPHPExcel->getActiveSheet()->getRowDimension($rw)->setRowHeight(-1);
                    }
                }
                $all_cells='A1:'.getColLetterByNum($result['maxcol']-1).($rw-1);
                $styleArray = array(
                    'borders' => array(
                        'allborders' => array(
                            'style' => PHPExcel_Style_Border::BORDER_THIN
                        )
                    )
                );
                $objPHPExcel->getActiveSheet()->getRowDimension($rw)->setRowHeight(-1);
                $objPHPExcel->getActiveSheet()->getStyle($all_cells)->applyFromArray($styleArray );
                $objPHPExcel->getActiveSheet()->calculateColumnWidths();                
					/*
                    $xls=new PHPExcel();
                    $xls=PHPExcel_IOFactory::load($template);
                    $xls->setActiveSheetIndex(0);                    
                    $t_sheet= $xls->getActiveSheet();
                    $c_sheet=$objPHPExcel->getActiveSheet();                    
                    for ($i=1;$i<=$c_sheet->getHighestRow(); $i++)
                    {
                        $nColumn=PHPExcel_Cell::columnIndexFromString($c_sheet->getHighestColumn());
                        $c_row_wdth=$t_sheet->getRowDimension($i)->getRowHeight();
                        $c_sheet->getRowDimension($i)->setRowHeight($c_row_wdth);                        
                    
                        for ($j=1;$j<=$nColumn; $j++)
                        {
                            $ltcl=getColLetterByNum($j).$i.":".getColLetterByNum($j).$i;
                            //$t_cell_st=$t_sheet->getStyleByColumnAndRow($j,$i)->getConditionalStyles();
                            $t_cell_st=$t_sheet->getStyle($ltcl);
                            
                            //$c_sheet->->setStyle($t_cell_st);                            
                            $c_sheet->duplicateStyle($t_cell_st,$ltcl);
                            //$xfIndex = $t_sheet->getCell($ltcl)->getXfIndex();                            
                            //$c_sheet->getCellByColumnAndRow($j,$i)->setXfIndex($xfIndex);
                        }                        
                    }
                    */
                    /*
                    for ($j=1;$j<=$nColumn; $j++)
                    {
                        $c_col_wdth=$t_sheet->getColumnDimension(getColLetterByNum($j))->getWidth();
                        $c_sheet->getColumnDimension(getColLetterByNum($j))->setWidth($c_col_wdth);
                    }
                    */
                
                //$objPHPExcel->getActiveSheet()->getStyle($all_cells)->getAlignment()->setWrapText(true);
                //$objPHPExcel->getActiveSheet()->getStyle($all_cells)->getAlignment()->setVertical(PHPExcel_Style_Alignment::HORIZONTAL_CENTER);
                if (!$table_ws)
                {                    
                    $result['data']= array();
                    $result['mrg']= array();
                    $result['maxcol']=0;
                    $result['mrg_supp']=array();
                    $result['m_starts']=array();                    
                    $row++;
                    $row_start=$row+1;
                    $col=0;
                }
                
                //$objPHPExcel->getActiveSheet()->getStyle($all_cells)->getAlignment()->setHorizontal(PHPExcel_Style_Alignment::HORIZONTAL_RIGHT);
                //break;
            }
            header('Content-Type: application/vnd.ms-excel');
            header('Content-Disposition: attachment;filename="'.$fname.'"');
            header('Cache-Control: max-age=0');
            $objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, $format);
            $objWriter->save('php://output');            
        }
    }   
    function getColLetterByNum($n)
    {
        $r = '';
        for ($i = 1; $n >= 0 && $i < 10; $i++)
        {
            $r = chr(0x41 + ($n % pow(26, $i) / pow(26, $i - 1))) . $r;
            $n -= pow(26, $i);
        }
        return $r;
    }
    // true if prev sibling rowspan only
    function prevSiblingTest($node)
    {        
        $o_O=false;
        $prsbl=$node->previousSibling;
        if (isset ($prsbl))
        {
            $chcount=0;
            $chndl=$prsbl->childNodes;
            $fstch=null;
            foreach ($chndl as $zzz)
            {
                if ($zzz->nodeName=="td" || $zzz->nodeName=="th")
                {
                    if ($chcount==0&&$zzz->hasAttribute('rowspan')) $fstch=$zzz;
                    $chcount++;
                }
            }                
            if (($chcount==1) && $fstch)
            {
                $o_O=true;
            }
        }
        return $o_O;
    }
    function getDeltaCols($rez,$row,$col)
    {
        $delta=0;
        $mrg_supp=$rez['mrg_supp'];
        $mstarts=$rez['m_starts'];
        if (isset($mrg_supp[$row]))
        {
            $rpns=$mrg_supp[$row];
            for ($i=0;$i<=$col;$i++)
            {
                if (isset($rpns[$i])&&!isset($mstarts[$row][$i]))//&&!isset($rpns[$i+1]))
                {
                    $delta++;
                }
            }
        }        
        return $delta;
    }
    function rec_sub_tree(DOMNode $dn,&$maxcol,&$row,&$col)
    {
        foreach ($dn->childNodes as $node)
        {
            if ($node->nodeName=="tr")
            {                              
                if (!prevSiblingTest($node))
                {
                    $chndl=$node->childNodes;
                    $chcount=0;
                    foreach ($chndl as $zzz) if ($zzz->nodeName=="td" || $zzz->nodeName=="th") $chcount++;
                    if ($chcount>0)
                    {
                        $col=0;
                        $row++;
                    }   
                } 
            }
            if ($node->nodeName=="th" || $node->nodeName=="td")
            {
                $col++;
                if ($maxcol<$col) $maxcol=$col;
            } 
            if($node->hasChildNodes()) rec_sub_tree($node,$maxcol,$row,$col);             
        }
    }    
    function parceDOMNode(DOMNode $domNode,&$rez,&$row,&$col)
    {
        $delta=0;
        foreach ($domNode->childNodes as $node)
        {
            if ($node->hasAttributes())
            {
                $rspan=null;
                $cspan=null;
                if ($node->hasAttribute('colspan'))
                {
                    $cspan=$node->getAttribute('colspan');
                    if ($cspan==0||$cspan>=100)
                    {
                        $cspan=1;
                        $dn=$node;
                        //find parent tbody or other
                        while (isset($dn->parentNode))
                        {
                            $val=$dn->nodeName;                            
                            if ($val=="thead"||$val=="tfoot"||$val=="tbody") break;
                            $dn=$dn->parentNode;
                        }
                        $cc=0;
                        rec_sub_tree($dn,$cspan,$cc,$rr);                        
                    }                    
                }
                if ($node->hasAttribute('rowspan'))
                {
                    $rspan=$node->getAttribute('rowspan');                    
                    if ($rspan==0||$rspan>=100)
                    {
                        $rspan=1;                        
                        $dn=$node;                        
                        while (isset($dn->parentNode))
                        {
                            $val=$dn->nodeName;                            
                            if ($val=="tr") break;
                            if ($val=="thead"||$val=="tfoot"||$val=="tbody")
                            {
                                $dn=$dn->childNodes->item(0);
                                break;
                            }
                            $dn=$dn->parentNode;
                        }
                        while (isset($dn->nextSibling))
                        {
                            $val=$dn->nodeName;
                            
                            if ($val=="thead"||$val=="tfoot"||$val=="tbody") break;
                            //if (prevSiblingTest($dn)) rmlog("zzz ".$dn->nodeName." ".$dn->nodeValue);
                            if ($val=="tr" && !prevSiblingTest($dn))
                            {
                                $rspan++;                                                             
                            }
                            $dn=$dn->nextSibling;                            
                        }                                              
                    }
                }                
                if ($cspan>0 && $rspan==null)
                {
                    $delta=getDeltaCols($rez,$row,$col);
                    $rez['mrg'][]=getColLetterByNum($col+$delta).$row.":".getColLetterByNum($col+$cspan+$delta-1).($row);
                    $rez['m_starts'][$row][$col+$delta]=$row.($col+$delta);
                    for ($i=$col;$i<$col+$cspan;$i++) $rez['mrg_supp'][$row][$i+$delta]=$row.($i+$delta);
                }                
                if ($rspan>0&&$cspan==null)
                {
                    $delta=getDeltaCols($rez,$row,$col);
                    //rmlog("rspan @$row:$col delta= $delta");
                    $rez['m_starts'][$row][$col+$delta]=$row.($col+$delta);
                    $rez['mrg'][]=getColLetterByNum($col+$delta).$row.":".getColLetterByNum($col+$delta).($row+$rspan-1);
                    for ($i=$row;$i<$row+$rspan;$i++) $rez['mrg_supp'][$i][$col+$delta]=$i.($col+$delta);
                }                
                if (($rspan>0) && ($cspan>0))
                {
                    $delta=getDeltaCols($rez,$row,$col);
                    for ($i=$row;$i<$row+$rspan;$i++)
                    {
                        for ($j=$col;$j<$col+$cspan;$j++) $rez['mrg_supp'][$i+$delta][$j]=($i+$delta).($j);
                    }
                    $rez['m_starts'][$row][$col+$delta]=$row.($col+$delta);
                    $rez['mrg'][]=getColLetterByNum($col+$delta).$row.":".getColLetterByNum($col+$cspan+$delta-1).($row+$rspan-1);
                }
            }
            if ($node->nodeName=="tr")
            {                
                if (!prevSiblingTest($node))
                {
                    $chndl=$node->childNodes;
                    $chcount=0;
                    foreach ($chndl as $zzz) if ($zzz->nodeName=="td" || $zzz->nodeName=="th") $chcount++;
                    if ($chcount>0)
                    {
                        $col=0;
                        $row++;
                    }                    
                }                
            }
            if ($node->nodeName=="th" || $node->nodeName=="td")
            {                
                $rez['data'][]=preg_replace( "/(^\s+)|(\s+$)/us", "", $node->nodeValue ); 
                $col++;
                $delta=getDeltaCols($rez,$row,$col);
                if ($rez['maxcol']<($col+$delta)) $rez['maxcol']=$col+$delta;
            }
            if($node->hasChildNodes()) parceDOMNode($node,$rez,$row,$col);            
        }    
    }
    
?>