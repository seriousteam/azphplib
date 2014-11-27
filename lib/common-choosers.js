function chooseOrg(e) { 
	var uri = $[=TSETREF:#:organizations:F=f_sname~=(SN),f_sname=(SNT),f_inn=(INN),f_ogrn=(OGRN),f_okpo=(OKPO),f_sname_en~=(SNE)]$[=BEGIN:org]
	$[=ESC:html]$[=PG_SIZE:20]
<div>
<div class=fcommhead>Введите часть сокращенного названия организации или ее ИНН или ее ОГРН или ее ОКПО</div>
<div class=fcommhead2>Найденные организации:</div>
<table class=toptable has_more="$[=PG_NEXT]">
<tr $[*(tr)recordid]><td class="act_item $[!f_coordinator_conf?]act_item_conf$[.]" 
	onclick="this.attrUpward('modal').closeIt(this)" 
	value="$[recordid]"
	rt="$[f_sname]"
	title="$[f_name]"><b><a href="javascript:undefined">$[f_sname]</a></b><br /> $[rel_region.f_name]</td>
	<td>$[!rel_coordinator] $[=Z?]добавлена: $[rel_coordinator.f_f] $[!rel_coordinator.f_i]$[=T]$[!rel_coordinator.f_o]$[=T]$[.]</td>
	<td>$[!f_checked?]проверено: $[=]$[.] $[!f_coordinator_conf?]<span style="color: green;">координатор подтвержден</span>$[.]$[?]<span style="color: red;">координатор  не назначен</span>$[.]
	$[^^]</td>
</tr>
</table>
<div class=fcommtip>Если Вы не можете найти нужную организацию, зарегистрируйте ее, перейдя на страницу "организации" вашей персональной страницы. Помните, что при этом вы берете на себя ответственность за достоверность предоставленных о такой организации сведений.</div>
</div>	
$[=END:org]
	
	if(chooseOrg.prevRequest) chooseOrg.prevRequest.object.abort();
	
	var v = e.searchbox.value;
	if(v != "") {
		var mode = {SN: v};
		if(v.match(/^\d{10}$/))
			mode = {INN: v};
		if(v.match(/^\d{13}$/))
			mode = {OGRN: v};
		if(v.match(/^\d{8}$/))
			mode = {OKPO: v};
		if(v.match(/^=(.*)$/))
			mode = {SNT: RegExp.$1};
		//if(v.match(/^[A-Za-z]+$/))
			//mode = {SNE: v};
	} 
		else
			mode = {INN: '0'};
	uri = setFilterInURI(uri, mode);
	return chooseOrg.prevRequest = X.XHR('GET', uri);
	//return modificationRequest(uri).fail(function(r){ alert(r) });
}


function choosePerson(e) { 
	var uri = $[=TSETREF:#:persons:F=f_f^=(FF),f_f=(FFS),f_i^=(FI),f_o^=(FO),f_inn=(INN),f_snils=(SNILS),f_f_en^=(FFE),f_localcode=(LOC),f_expert=(EONLY),*PN2persons.fl*pn=(LOGIN)]$[=BEGIN:pers]
	$[=ESC:html]$[=PG_SIZE:100]
<div class=fcommhead>Введите фамилию зарегистрированного пользователя или его идентификатор(E-mail) в системе </div>
<div class=fcommhead2>Найденные пользователи:</div>
<table class=toptable>
<tr $[*(tr)recordid]><td class="act_item " 
	onclick="this.attrUpward('modal').closeIt(this)" 
	value="$[recordid]"
	rt="$[f_f] $[!f_i]$[=T]$[!f_o]$[=T]"
	title="$[f_f] $[f_i] $[f_o]">$[f_f] $[!f_i]$[=T]$[!f_o]$[=T]
	<td><span>$[f_academic_degree.f_sname]</span></td><td><span cctl required>$[*(span):F=f_main=1:flat_orgstruct.rel_person]
	<span class=f2date>$[rel_appointment.f_name],</span>
	<span class=f2date>$[rel_org.f_sname]</span>
	$[^^]
</span></span>
	$[^^]</td>
</tr>
</table>
$[=END:pers]
	
	if(choosePerson.prevRequest) choosePerson.prevRequest.object.abort();
	
	var v = e.searchbox.value;
	if(v != "") {
		var ef = v.match(/^е:/); if(ef) v = v.replace(/^е:\s*/, '');
		var mode = {FF: v};
		if(v.match(/^\d{3}-\d{3}-\d{3}[ -]\d{2}$/))
			mode = {SNILS: v};
		else if(v.match(/^\d{13}$/))
			mode = {LOC: v};
		else if(v.match(/^\d{12}$/))
			mode = {INN: v};
		else if(v.match(/@/))
			mode = {LOGIN: v};
		else if(v.match(/^[A-Za-z]+$/))
			mode = {FFE: v};
		else if(v.match(/^(.*)\s+([А-Я])\.\s*(([А-Я])\.)?/)) {
			mode = {FFS: RegExp.$1, FI: RegExp.$2};
			if(RegExp.$4) mode.FO = RegExp.$4;
		}
		if(ef) mode.EONLY = '1';
	} 
		else
			mode = {INN: '0'};
	uri = setFilterInURI(uri, mode);
	return choosePerson.prevRequest = X.XHR('GET', uri);
	//return modificationRequest(uri);
}
