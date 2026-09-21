const C={GLD:'#efb83f',TMV:'#9a7fe8',XLU:'#28b5aa',Seiryu:'#36afe0',Byakko:'#9a7fe8',Suzaku:'#31c996',Genbu:'#f7a00a'};
const FALLBACK=['#4f86f7','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#84cc16','#ec4899'];
const colorFor=k=>C[k]||FALLBACK[Math.abs([...String(k)].reduce((a,c)=>a+c.charCodeAt(0),0))%FALLBACK.length];
const pct=x=>x==null?'—':`${Number(x)>=0?'+':''}${Number(x).toFixed(2)}%`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function polar(cx,cy,r,a){const t=(a-90)*Math.PI/180;return[cx+r*Math.cos(t),cy+r*Math.sin(t)]}
function arc(cx,cy,r,a0,a1){const[x0,y0]=polar(cx,cy,r,a1),[x1,y1]=polar(cx,cy,r,a0);return`M ${x0} ${y0} A ${r} ${r} 0 ${a1-a0>180?1:0} 0 ${x1} ${y1}`}
function donut(id,obj,title){
 let a=0,paths='',labels='';
 for(const[k,v0]of Object.entries(obj)){const v=Number(v0),a1=a+v*3.6,mid=(a+a1)/2,[tx,ty]=polar(100,100,72,mid);
 paths+=`<path d="${arc(100,100,72,a,a1)}" fill="none" stroke="${colorFor(k)}" stroke-width="34"/>`;
 labels+=`<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" class="slice-label"><tspan x="${tx}" dy="-0.35em">${esc(k)}</tspan><tspan x="${tx}" dy="1.15em">${v.toFixed(1)}%</tspan></text>`;a=a1}
 document.getElementById(id+'Donut').innerHTML=`<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="72" fill="none" stroke="#f2f2f2" stroke-width="34"/>${paths}<circle cx="100" cy="100" r="51" fill="#fff"/><text x="100" y="97" text-anchor="middle" class="center-title">${esc(title)}</text><text x="100" y="111" text-anchor="middle" class="center-sub">Allocation</text>${labels}</svg>`;
 document.getElementById(id+'Legend').innerHTML=Object.entries(obj).map(([k,v])=>`<span style="--c:${colorFor(k)}">${esc(k)} ${Number(v).toFixed(1)}%</span>`).join('')
}
fetch(`kirin_snapshot.json?v=20260918-live1`,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(`snapshot ${r.status}`);return r.json()}).then(d=>{
 if(d.schema_version!=='kirin-fast-1.0')throw Error('unsupported snapshot schema');
 for(const key of ['execution','gods']){const vals=Object.values(d[key]||{}).map(Number);if(vals.length&&Math.abs(vals.reduce((a,b)=>a+b,0)-100)>1e-6)throw Error(`${key} total audit failed`);}
 const m=d.month||'2026-09', prev=d.previous_month||'2026-08';
 document.getElementById('asof').textContent=d.asof||'—';['allocMonth','execMonth','godsMonth'].forEach(id=>document.getElementById(id).textContent=m);
 const changed=d.action?.changed;
 const actionText=changed===true?'🟠 保有アセット変更あり':changed===false?'🟢 保有アセット変更なし — 配分のみリバランス':'🟠 月次リバランス — 先月target確認待ち';
 document.getElementById('action').innerHTML=`<strong>${actionText}</strong>`;
 document.getElementById('actionDetail').textContent=`先月: ${d.action?.previous||'—'} → 今月: ${d.action?.current||'—'}`;
 document.getElementById('health').innerHTML=['G1','G2','P'].map((x,i)=>{
   const raw=String(d.health?.[i]??'green').toLowerCase();
   const state=(raw.includes('orange')||raw.includes('🟠')||raw.includes('deterior'))?'orange':(raw.includes('yellow')||raw.includes('🟡')||raw.includes('mixed'))?'yellow':'green';
   return `<div class="card"><span class="label">${x}</span><i class="dot ${state}" aria-label="${state}"></i><small>${['long-term','erosion','overall'][i]}</small></div>`;
 }).join('');
 donut('exec',d.execution||{},'現世');donut('gods',d.gods||{},'天界');
 document.getElementById('risk').innerHTML=Object.entries(d.risk||{}).map(([k,v])=>`<div class="card"><span class="label">${esc(k)}</span><b class="${String(v).includes('ON')?'on':'off'}">● ${esc(v)}</b></div>`).join('');
 document.getElementById('signals').innerHTML=(d.signals||[]).map(([k,v])=>`<div class="card"><span class="label">${esc(k)}</span><b class="${['ACTIVE','NORMAL','FROZEN','REAL FORWARD','—'].includes(v)?'purple':''}">${esc(v)}</b></div>`).join('');
 const sm=[['最新 '+m+' MTD*',...(d.summary?.mtd||[])],['前月 '+prev,...(d.summary?.prev||[])],[m.slice(0,4)+' YTD*',...(d.summary?.ytd||[])]];
 document.getElementById('summary').innerHTML=sm.map(x=>`<div class="sum"><span class="title">${esc(x[0])}</span><p>天界 <b>${pct(x[1])}</b></p><p>現世 <b>${pct(x[2])}</b></p></div>`).join('');
 const by=d.benchmarks?.ytd||{};
 document.getElementById('bm').innerHTML=`<b>BM</b><span>SPY YTD<strong>${pct(by.SPY)}</strong></span><span>TQQQ YTD<strong>${pct(by.TQQQ)}</strong></span>`;
 window.__MY4F_SNAPSHOT__=d;
 if(window.__refreshDeteriorationPicker) window.__refreshDeteriorationPicker();
 renderResearchPerformance(d.performance);
 renderFastAnalytics(d);
    renderMonthlyTrade(d);
  document.getElementById('months').innerHTML=(d.returns||[]).map(x=>`<article class="month"><div class="monthTop"><span>${esc(x[0])}</span><span class="badge ${x[1]=='A-STATE'?'a':String(x[1]).includes('BOOSTER')?'b':''}">${esc(x[1])}</span></div><div class="return-scroll"><div class="row k"><span class="lab">麒麟</span><span class="name">天界</span><strong>${pct(x[2])}</strong><span class="name">現世</span><strong>${pct(x[3])}</strong></div><div class="row"><span class="lab">BM</span><span class="name">SPY</span><strong>${pct(x[4])}</strong><span class="name">TQQQ</span><strong>${pct(x[5])}</strong></div></div></article>`).join('');
  renderMonthlyReturnsPage(d,FAST_BM);
}).catch(e=>document.body.insertAdjacentHTML('afterbegin',`<div style="padding:10px;background:#ffecec;color:#a00;font:12px sans-serif">Snapshot load error: ${esc(e.message)}</div>`));

let FAST_BM='SPY';
function bmSwitch(id,current,onChange){
 const el=document.getElementById(id); if(!el)return;
 el.innerHTML=`<div class="bm-switch"><span>BM</span><button type="button" data-bm="SPY" class="${current==='SPY'?'active':''}">SPY</button><button type="button" data-bm="TQQQ" class="${current==='TQQQ'?'active':''}">TQQQ</button></div>`;
 el.querySelectorAll('button').forEach(b=>b.onclick=()=>{FAST_BM=b.dataset.bm;onChange(FAST_BM);});
}

// v87 — Performance: portfolio max 5 + separate benchmark selector; BM chart line is dashed.
function portfolioFoldGroups(names){
 const groups={
  'All':names,
  'Frozen':names.filter(n=>/^Frozen /.test(n)),
  '4F':names.filter(n=>/^(Frozen 4F|4F )/.test(n)),
  'KIRIN':names.filter(n=>/麒麟/.test(n)),
  'Benchmark':names.filter(n=>['SPY','TQQQ'].includes(n)),
  'Seiryu':names.filter(n=>/^Seiryu /.test(n)),
  'Byakko':names.filter(n=>/^Byakko /.test(n)),
  'Suzaku':names.filter(n=>/^Suzaku /.test(n)),
  'Genbu':names.filter(n=>/^Genbu /.test(n))
 };
 Object.keys(groups).forEach(k=>{if(!groups[k].length)delete groups[k]});
 return groups;
}
function portfolioFoldHTML(id,names,selected){
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<details class="analytics-portfolio-fold perf-picker perf-picker-fold" data-picker="${E(id)}"><summary class="analytics-picker-summary"><span>Selection Portfolio</span><span class="analytics-selected-name">${E(selected)}</span></summary><div class="perf-picker-body analytics-picker-body"><div class="perf-picker-title">Select Portfolio <span>1 selected</span></div><div class="perf-group-tabs analytics-picker-tabs"></div><div class="perf-group-panel analytics-picker-panel"></div></div></details>`;
}
function wirePortfolioFold(root,id,names,selected,onSelect){
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const wrap=root?.querySelector(`[data-picker="${id}"]`); if(!wrap)return;
 const tabs=wrap.querySelector('.analytics-picker-tabs'),panel=wrap.querySelector('.analytics-picker-panel'),groups=portfolioFoldGroups(names);
 let active='All';
 const draw=()=>{
  tabs.innerHTML=Object.keys(groups).map(k=>`<button type="button" class="perf-group-tab ${k===active?'active':''}" data-group="${E(k)}">${E(k)}</button>`).join('');
  tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{active=b.dataset.group;draw()});
  panel.innerHTML=(groups[active]||[]).map(n=>`<button type="button" class="perf-group-item ${n===selected?'active':''}" data-name="${E(n)}">${E(n)}</button>`).join('');
  panel.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.name;wrap.open=false;onSelect(selected)});
 };
 draw();
}

function renderMonthlyReturnsPage(d,bm='SPY'){
 const root=document.getElementById('monthlyReturnsPage');if(!root)return;
 const hist=d?.performance?.history||{},names=Object.keys(hist).filter(n=>Array.isArray(hist[n])&&hist[n].length);
 let main=(window.__MY4F_MONTHLY_PORTFOLIO__&&names.includes(window.__MY4F_MONTHLY_PORTFOLIO__))?window.__MY4F_MONTHLY_PORTFOLIO__:(names.includes('麒麟「現世」')?'麒麟「現世」':names[0]);
 const mainRows=Array.isArray(hist[main])?hist[main]:[],bmRows=Array.isArray(hist[bm])?hist[bm]:[];
 const bmMap=new Map(bmRows.map(x=>[String(x[0]),Number(x[1])]));
 const rows=mainRows.map(x=>[String(x[0]),Number(x[1]),bmMap.get(String(x[0]))]).filter(x=>Number.isFinite(x[1])).sort((a,b)=>a[0].localeCompare(b[0]));
 const cell=v=>Number.isFinite(Number(v))?`<span class="${Number(v)>=0?'ret-pos':'ret-neg'}">${pct(Number(v))}</span>`:'—';
 const portfolioSelect=portfolioFoldHTML('monthlyReturnsPicker',names,main);
 root.innerHTML=`${portfolioSelect}<div id="monthlyBmSwitch"></div><div class="monthly-compare-head"><span>Strategy</span><b>${esc(main)}</b><span class="bm-pill">BM: ${bm}</span></div><p class="analytics-note">表示可能な最古 ${rows[0]?.[0]||'—'} → ${rows.at(-1)?.[0]||'—'} ｜ ${rows.length} months</p><div class="analytics-table-scroll monthly-full-scroll"><table class="analytics-table monthly-compare-table"><thead><tr><th>Month</th><th>${esc(main)}</th><th>${bm}</th><th>差</th></tr></thead><tbody>${[...rows].reverse().map(x=>{const dif=Number.isFinite(x[2])?x[1]-x[2]:null;return`<tr><td>${esc(x[0])}</td><td>${cell(x[1])}</td><td>${cell(x[2])}</td><td>${dif==null?'—':cell(dif)}</td></tr>`}).join('')}</tbody></table></div>`;
 wirePortfolioFold(root,'monthlyReturnsPicker',names,main,next=>{window.__MY4F_MONTHLY_PORTFOLIO__=next;renderMonthlyReturnsPage(d,bm);});
 bmSwitch('monthlyBmSwitch',bm,next=>{FAST_BM=next;renderMonthlyReturnsPage(d,next);renderFastAnalytics(d,next);});
}
// Fast v4.5 — Research Performance. Display only; all source returns/metrics come from Python snapshot.
function renderResearchPerformance(p){
 if(!p||!Array.isArray(p.series)||!p.series.length)return;
 const rows=p.series,hist=p.history||{},benchmarks=['SPY','TQQQ'].filter(x=>hist[x]),portfolioRows=rows.filter(r=>!benchmarks.includes(r.name)),defaults=['Frozen Core','Frozen v3.45','Frozen 4F'];
 let selected=new Set(defaults.filter(x=>hist[x]&&!benchmarks.includes(x)));if(!selected.size)selected=new Set(portfolioRows.slice(0,3).map(x=>x.name));
 let benchmark=benchmarks.includes('SPY')?'SPY':(benchmarks[0]||null),period='ALL',logScale=true,periodMode='COMMON',startYear='ALL',activeGroup='All';
 const groupMap={
   'All': portfolioRows.map(r=>r.name),
   'Frozen': portfolioRows.filter(r=>/^Frozen /.test(r.name)).map(r=>r.name),
   '4F': portfolioRows.filter(r=>/^(Frozen 4F|4F )/.test(r.name)).map(r=>r.name),
   'KIRIN': portfolioRows.filter(r=>/麒麟/.test(r.name)).map(r=>r.name),
   'Seiryu': portfolioRows.filter(r=>/^Seiryu /.test(r.name)).map(r=>r.name),
   'Byakko': portfolioRows.filter(r=>/^Byakko /.test(r.name)).map(r=>r.name),
   'Suzaku': portfolioRows.filter(r=>/^Suzaku /.test(r.name)).map(r=>r.name),
   'Genbu': portfolioRows.filter(r=>/^Genbu /.test(r.name)).map(r=>r.name)
 };
 Object.keys(groupMap).forEach(k=>{if(!groupMap[k].length)delete groupMap[k]});
 const fmt=(x,d=2)=>x==null||!Number.isFinite(Number(x))?'—':Number(x).toFixed(d),pp=x=>x==null||!Number.isFinite(Number(x))?'—':`${Number(x)>=0?'+':''}${Number(x).toFixed(2)}%`;
 const chips=document.getElementById('perfChips'),cards=document.getElementById('perfCards'),table=document.getElementById('perfTable'),meta=document.getElementById('perfMeta'),periods=document.getElementById('perfPeriods'),logBtn=document.getElementById('perfLogToggle'),linBtn=document.getElementById('perfLinearToggle'),commonBtn=document.getElementById('perfCommon'),fullBtn=document.getElementById('perfFull'),returns=document.getElementById('perfPeriodReturns'),
 groupTabs=document.getElementById('perfGroupTabs'),groupPanel=document.getElementById('perfGroupPanel'),startSel=document.getElementById('perfStartYear'),selectedCount=document.getElementById('perfSelectedCount'),bmButtons=[...document.querySelectorAll('#performance .perf-bm-btn')];
 const allMonths=[...new Set(Object.values(hist).flatMap(a=>(a||[]).map(x=>x[0])))].sort();
 const years=[...new Set(allMonths.map(m=>String(m).slice(0,4)))].sort((a,b)=>Number(b)-Number(a));
 if(startSel){startSel.innerHTML='<option value="ALL">ALL</option>'+years.map(y=>`<option value="${y}">${y}</option>`).join('');startSel.value='ALL';startSel.addEventListener('change',()=>{startYear=startSel.value;draw()})}
 function togglePortfolio(n){if(selected.has(n)){if(selected.size>1)selected.delete(n)}else if(selected.size<5)selected.add(n);draw();renderGroups()}
 function renderGroups(){
   if(!groupTabs||!groupPanel)return;
   groupTabs.innerHTML=Object.keys(groupMap).map(k=>`<button type="button" class="perf-group-tab ${k===activeGroup?'active':''}" data-group="${esc(k)}">${esc(k)}</button>`).join('');
   groupTabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{activeGroup=b.dataset.group;renderGroups()});
   const members=groupMap[activeGroup]||[];
   groupPanel.innerHTML=members.map(n=>`<button type="button" class="perf-group-item ${selected.has(n)?'active':''}" data-name="${esc(n)}">${esc(n)}</button>`).join('');
   groupPanel.querySelectorAll('button').forEach(b=>b.onclick=()=>togglePortfolio(b.dataset.name));
 }
 renderGroups();
 bmButtons.forEach(b=>{if(!benchmarks.includes(b.dataset.bm)){b.disabled=true;b.hidden=true}b.classList.toggle('active',b.dataset.bm===benchmark);b.onclick=()=>{if(benchmarks.includes(b.dataset.bm)){benchmark=b.dataset.bm;draw()}}});
 periods?.querySelectorAll('.perf-period').forEach(b=>b.addEventListener('click',()=>{period=b.dataset.period||'ALL';draw()}));
 logBtn?.addEventListener('click',()=>{logScale=true;draw()});linBtn?.addEventListener('click',()=>{logScale=false;draw()});commonBtn?.addEventListener('click',()=>{periodMode='COMMON';draw()});fullBtn?.addEventListener('click',()=>{periodMode='FULL';draw()});
 function draw(){
  if(selectedCount)selectedCount.textContent=`${selected.size} selected`;
  chips.innerHTML=portfolioRows.map(r=>`<button class="perf-chip ${selected.has(r.name)?'active':''}" data-name="${esc(r.name)}">${esc(r.name)}</button>`).join('');
  chips.querySelectorAll('button').forEach(b=>b.onclick=()=>togglePortfolio(b.dataset.name));
  bmButtons.forEach(b=>b.classList.toggle('active',b.dataset.bm===benchmark));
  periods?.querySelectorAll('.perf-period').forEach(x=>x.classList.toggle('active',x.dataset.period===period));if(startSel&&startSel.value!==startYear)startSel.value=startYear;logBtn?.classList.toggle('active',logScale);linBtn?.classList.toggle('active',!logScale);commonBtn?.classList.toggle('active',periodMode==='COMMON');fullBtn?.classList.toggle('active',periodMode==='FULL');
  const sr=portfolioRows.filter(r=>selected.has(r.name));cards.innerHTML=sr.map(r=>`<div class="perf-card"><div class="perf-name">${esc(r.name)}</div><div class="perf-metrics"><div class="perf-metric"><span>CAGR</span><b>${pp(r.cagr)}</b></div><div class="perf-metric"><span>Sortino</span><b>${fmt(r.sortino,3)}</b></div><div class="perf-metric"><span>MaxDD</span><b>${pp(r.maxdd)}</b></div><div class="perf-metric"><span>Sharpe</span><b>${fmt(r.sharpe,3)}</b></div><div class="perf-metric"><span>Calmar</span><b>${fmt(r.calmar,3)}</b></div><div class="perf-metric"><span>Months</span><b>${r.months}</b></div></div></div>`).join('');
  const info=renderPerfChart([...selected],hist,period,logScale,periodMode,startYear,benchmark);meta.textContent=info?`Chart period: ${info.start} → ${info.end} ｜ ${period} ｜ From ${startYear} ｜ ${logScale?'LOG':'LINEAR'} ｜ ${periodMode==='COMMON'?'Common':'Full'} ｜ BM ${benchmark||'—'} ｜ metrics below = full history`:'表示可能な履歴なし';
  if(returns)returns.innerHTML=info?info.returns.map(r=>`<div class="perf-return-item ${r.isBenchmark?'perf-return-bm':''}"><span class="perf-dot" style="--dot:${r.color}"></span><b>${r.isBenchmark?'BM · ':''}${esc(r.name)}</b><strong>${r.value>=0?'+':''}${r.value.toFixed(1)}%</strong></div>`).join(''):'';
 }
 table.innerHTML=`<table class="perf-table"><thead><tr><th>Series</th><th>CAGR</th><th>Sortino</th><th>MaxDD</th><th>Calmar</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${pp(r.cagr)}</td><td>${fmt(r.sortino,2)}</td><td>${pp(r.maxdd)}</td><td>${fmt(r.calmar,2)}</td></tr>`).join('')}</tbody></table>`;draw();
}
function renderPerfChart(portfolios,hist,period='ALL',logScale=true,periodMode='COMMON',startYear='ALL',benchmark=null){
 const box=document.getElementById('perfChart');if(!box)return null;const palette=['#12a8df','#0a9b72','#d84a7f','#7b1fa2','#e58b2a'],bmColor='#64748b';
 const names=[...portfolios,...(benchmark&&!portfolios.includes(benchmark)?[benchmark]:[])];
 const maps=names.map(n=>[n,new Map((hist[n]||[]).map(x=>[x[0],Number(x[1])/100]))]).filter(x=>x[1].size);if(!maps.length)return null;
 let months=periodMode==='COMMON'?[...maps[0][1].keys()].filter(m=>maps.every(x=>x[1].has(m))).sort():[...new Set(maps.flatMap(x=>[...x[1].keys()]))].sort();
 const count={'1Y':12,'2Y':24,'3Y':36,'5Y':60,'10Y':120}[period];
 if(startYear!=='ALL'){months=months.filter(m=>String(m).slice(0,4)>=String(startYear));if(count&&months.length>count)months=months.slice(0,count)}else if(count&&months.length>count){months=months.slice(-count)}
 if(months.length<2)return null;
 const vals={};names.forEach(n=>{const mp=maps.find(x=>x[0]===n)?.[1];if(!mp)return;let w=100,started=false;vals[n]=months.map(m=>{if(!mp.has(m))return null;if(!started){started=true;return 100}w*=1+(Number.isFinite(mp.get(m))?mp.get(m):0);return w})});
 const all=Object.values(vals).flat().filter(v=>Number.isFinite(v)&&(!logScale||v>0));if(!all.length)return null;
 const rawLo=Math.min(...all),rawHi=Math.max(...all),tx=v=>logScale?Math.log(v):v,lo=tx(rawLo),hi=tx(rawHi),W=680,H=300,L=52,R=12,T=18,B=34,pw=W-L-R,ph=H-T-B,y=v=>T+(hi-tx(v))/(hi-lo||1)*ph,x=i=>L+i/(months.length-1)*pw;
 let g=`<svg viewBox="0 0 ${W} ${H}" role="img">`;[0,.25,.5,.75,1].forEach(q=>{const z=lo+(hi-lo)*q,v=logScale?Math.exp(z):z,yy=T+(1-q)*ph;g+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="#e8edf2"/><text x="${L-6}" y="${yy+3}" text-anchor="end" font-size="9" fill="#728096">${logScale?(v/100).toFixed(v<100?2:1)+'×':Math.round(v)}</text>`});g+=`<text x="${L}" y="${H-8}" font-size="10" fill="#728096">${months[0]}</text><text x="${W-R}" y="${H-8}" text-anchor="end" font-size="10" fill="#728096">${months.at(-1)}</text>`;
 names.forEach(n=>{const isBm=n===benchmark,j=portfolios.indexOf(n),color=isBm?bmColor:palette[Math.max(0,j)%palette.length],dash=isBm?' stroke-dasharray="3 3"':'';let seg=[];const flush=()=>{if(seg.length>1)g+=`<polyline points="${seg.join(' ')}" fill="none" stroke="${color}" stroke-width="${isBm?2.2:2.4}"${dash} stroke-linejoin="round" stroke-linecap="round"/>`;seg=[]};(vals[n]||[]).forEach((v,i)=>Number.isFinite(v)?seg.push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`):flush());flush()});
 g+=`<line id="perfCrosshair" x1="${L}" y1="${T}" x2="${L}" y2="${T+ph}" stroke="#9aa7b8" stroke-dasharray="3 3" visibility="hidden"/><rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/></svg><div id="perfTooltip" class="perf-tooltip" hidden></div>`;box.innerHTML=g;
 const svg=box.querySelector('svg'),tip=box.querySelector('#perfTooltip'),cross=box.querySelector('#perfCrosshair');
 const colorFor=n=>n===benchmark?bmColor:palette[Math.max(0,portfolios.indexOf(n))%palette.length];
 const showAt=cx=>{const r=svg.getBoundingClientRect(),px=Math.max(0,Math.min(r.width,cx-r.left));let i=Math.round(((px/r.width*W)-L)/pw*(months.length-1));i=Math.max(0,Math.min(months.length-1,i));const rr=names.map(n=>{const v=vals[n]?.[i];return Number.isFinite(v)?`<div><span class="perf-dot ${n===benchmark?'perf-dot-bm':''}" style="--dot:${colorFor(n)}"></span><b>${n===benchmark?'BM · ':''}${esc(n)}</b><strong>${v-100>=0?'+':''}${(v-100).toFixed(1)}%</strong></div>`:''}).join('');if(!rr)return;const xx=x(i);cross.setAttribute('x1',xx);cross.setAttribute('x2',xx);cross.setAttribute('visibility','visible');tip.innerHTML=`<div class="perf-tip-date">${months[i]}</div>${rr}`;tip.hidden=false;tip.style.left=Math.max(8,Math.min(box.clientWidth-tip.offsetWidth-8,px-tip.offsetWidth/2))+'px';tip.style.top='42px'};
 svg.addEventListener('pointerdown',e=>{svg.setPointerCapture?.(e.pointerId);showAt(e.clientX)});svg.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)showAt(e.clientX)});svg.addEventListener('click',e=>{if(e.pointerType==='mouse'||!('PointerEvent' in window))showAt(e.clientX)});
 const returns=names.map(n=>{const a=(vals[n]||[]).filter(Number.isFinite);return{name:n,value:a.length?(a.at(-1)/a[0]-1)*100:0,isBenchmark:n===benchmark,color:colorFor(n)}});return{start:months[0],end:months.at(-1),returns};
}

function renderFastAnalytics(d,bmName=FAST_BM){
 const p=d?.performance,ss=p?.series||[];
 let a=p?.analytics||{};
 // Compatibility fallback: derive analytics from published frozen monthly history.
 // Supports current canonical object format {Series: [[YYYY-MM, returnPct], ...]} and legacy rows.
 if(!Object.keys(a).length && p?.history && typeof p.history==='object'){
   const by={};
   if(Array.isArray(p.history)){
     p.history.forEach(r=>Object.keys(r||{}).filter(k=>k!=='month').forEach(k=>{const v=Number(r[k]);if(Number.isFinite(v))(by[k]??=[]).push([String(r.month),v/100]);}));
   }else{
     Object.entries(p.history).forEach(([n,arr])=>{if(Array.isArray(arr))by[n]=arr.map(x=>[String(x?.[0]??''),Number(x?.[1])/100]).filter(x=>/^\d{4}-\d{2}/.test(x[0])&&Number.isFinite(x[1]));});
   }
   Object.entries(by).forEach(([n,rows])=>{
     rows.sort((x,y)=>x[0].localeCompare(y[0])); let w=1,peak=1; const dd=[],annual={},rolling={};
     rows.forEach(([m,r])=>{w*=1+r;peak=Math.max(peak,w);dd.push([m,(w/peak-1)*100]);const y=m.slice(0,4);annual[y]=(annual[y]??1)*(1+r);});
     [12,36,60].forEach(win=>{if(rows.length<win)return;const h=[];for(let i=win-1;i<rows.length;i++){let prod=1;for(let j=i-win+1;j<=i;j++)prod*=1+rows[j][1];const rr=(win===12?prod-1:Math.pow(prod,12/win)-1)*100;h.push([rows[i][0],rr]);}const vs=h.map(x=>x[1]).sort((x,y)=>x-y),q=.1*(vs.length-1),lo=Math.floor(q),hi=Math.ceil(q),p10=vs[lo]+(vs[hi]-vs[lo])*(q-lo),mid=(vs.length-1)/2,ml=Math.floor(mid),mh=Math.ceil(mid),median=(vs[ml]+vs[mh])/2;rolling[String(win)]={current:h.at(-1)[1],median,p10,min:vs[0],positive_rate:100*vs.filter(v=>v>0).length/vs.length,history:h};});
     a[n]={annual:Object.entries(annual).sort((x,y)=>x[0].localeCompare(y[0])).map(([y,v])=>[y,(v-1)*100]),drawdown:dd,rolling};
   });
 }
 const names=ss.map(x=>x.name).filter(n=>a[n]);
 const fmt=v=>(v==null||!Number.isFinite(Number(v)))?'—':`${Number(v)>=0?'+':''}${Number(v).toFixed(2)}%`;
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pick=id=>`<div class="analytics-chips">${names.map((n,i)=>`<button data-series="${E(n)}" class="${i?'':'active'}">${E(n)}</button>`).join('')}</div><div id="${id}Body"></div>`;
 const mt=document.getElementById('metricsPage');
 let SUMMARY_PORTFOLIO=(window.__MY4F_SUMMARY_PORTFOLIO__ && names.includes(window.__MY4F_SUMMARY_PORTFOLIO__))
   ? window.__MY4F_SUMMARY_PORTFOLIO__
   : (names.includes('麒麟「現世」')?'麒麟「現世」':names.find(n=>!['SPY','TQQQ'].includes(n))||names[0]);
 let METRIC_PORTFOLIO=(ss.find(x=>x.name==='麒麟「現世」')?.name||ss.find(x=>!['SPY','TQQQ'].includes(x.name))?.name||ss[0]?.name);
 function metricHistory(name){
   const raw=p?.history?.[name];
   if(!Array.isArray(raw))return[];
   return raw.map(x=>[String(x?.[0]??''),Number(x?.[1])/100]).filter(x=>/^\d{4}-\d{2}/.test(x[0])&&Number.isFinite(x[1])).sort((x,y)=>x[0].localeCompare(y[0]));
 }
 const mean=x=>x.length?x.reduce((s,v)=>s+v,0)/x.length:NaN;
 const sd=x=>{if(x.length<2)return NaN;const m=mean(x);return Math.sqrt(x.reduce((s,v)=>s+(v-m)**2,0)/(x.length-1))};
 const covariance=(x,y)=>{if(x.length<2||x.length!==y.length)return NaN;const a=mean(x),b=mean(y);return x.reduce((s,v,i)=>s+(v-a)*(y[i]-b),0)/(x.length-1)};
 const metricCorr=(x,y)=>covariance(x,y)/(sd(x)*sd(y));
 function commonMetricRows(main,bm){
   const bmMap=new Map(metricHistory(bm)),rows=metricHistory(main).filter(x=>bmMap.has(x[0])).map(x=>[x[0],x[1],bmMap.get(x[0])]);
   return rows;
 }
 function ddEpisodeFromReturns(rows,col){
   let wealth=1,peak=1,peakMonth=rows[0]?.[0]||'',cur=null,episodes=[],maxDD=0,maxDate='',maxPeak='';
   rows.forEach((r,i)=>{
     wealth*=1+r[col];
     if(wealth>=peak){peak=wealth;peakMonth=r[0];if(cur){cur.recoveryDate=r[0];cur.endIndex=i;episodes.push(cur);cur=null}}
     const d=wealth/peak-1;
     if(d<0){
       if(!cur)cur={peakDate:peakMonth,startIndex:i,troughDate:r[0],troughIndex:i,trough:d};
       if(d<cur.trough){cur.trough=d;cur.troughDate=r[0];cur.troughIndex=i}
       if(d<maxDD){maxDD=d;maxDate=r[0];maxPeak=peakMonth}
     }
   });
   if(cur){cur.endIndex=rows.length-1;episodes.push(cur)}
   episodes=episodes.map(e=>({...e,length:e.troughIndex-e.startIndex+1,recovery:e.recoveryDate?e.endIndex-e.troughIndex:null,underwater:e.recoveryDate?e.endIndex-e.startIndex+1:rows.length-e.startIndex}));
   const worst=[...episodes].sort((a,b)=>a.trough-b.trough)[0]||{};
   const completed=episodes.filter(e=>e.recoveryDate);
   return {maxDD,worst,maxDate,maxPeak,avgUnder:completed.length?mean(completed.map(e=>e.underwater)):NaN};
 }
 function calcMetrics(main,bm){
   const rows=commonMetricRows(main,bm),x=rows.map(r=>r[1]),y=rows.map(r=>r[2]),n=x.length;
   const am=mean(x),bmMean=mean(y),sx=sd(x),sy=sd(y),geo=n?Math.pow(x.reduce((p,r)=>p*(1+r),1),1/n)-1:NaN;
   const annual=x.length?Math.pow(x.reduce((p,r)=>p*(1+r),1),12/n)-1:NaN;
   const annBm=y.length?Math.pow(y.reduce((p,r)=>p*(1+r),1),12/n)-1:NaN;
   const down=x.filter(v=>v<0),downBm=y.filter(v=>v<0);
   // Sortino canonical definition: MAR=0, downside deviation uses ALL months; positive months contribute 0.
   const downDev=Math.sqrt(mean(x.map(v=>Math.min(v,0)**2))),downDevBm=Math.sqrt(mean(y.map(v=>Math.min(v,0)**2)));
   const beta=covariance(x,y)/(sy**2),alpha=(am-beta*bmMean)*12,rho=metricCorr(x,y),r2=rho*rho;
   const ddx=ddEpisodeFromReturns(rows,1),ddy=ddEpisodeFromReturns(rows,2);
   const years={}; rows.forEach(r=>{const yy=r[0].slice(0,4);(years[yy]??=[1,1]);years[yy][0]*=1+r[1];years[yy][1]*=1+r[2]});
   const yr=Object.values(years).map(v=>[v[0]-1,v[1]-1]),best=Math.max(...yr.map(v=>v[0])),worst=Math.min(...yr.map(v=>v[0])),bestBm=Math.max(...yr.map(v=>v[1])),worstBm=Math.min(...yr.map(v=>v[1]));
   const pos=x.filter(v=>v>0).length,posBm=y.filter(v=>v>0).length,gain=mean(x.filter(v=>v>0)),loss=Math.abs(mean(x.filter(v=>v<0))),gainBm=mean(y.filter(v=>v>0)),lossBm=Math.abs(mean(y.filter(v=>v<0)));
   const centered=x.map(v=>v-am),centeredBm=y.map(v=>v-bmMean),skew=mean(centered.map(v=>v**3))/(sx**3),skewBm=mean(centeredBm.map(v=>v**3))/(sy**3),kurt=mean(centered.map(v=>v**4))/(sx**4)-3,kurtBm=mean(centeredBm.map(v=>v**4))/(sy**4)-3;
   const active=x.map((v,i)=>v-y[i]),te=sd(active)*Math.sqrt(12),activeAnn=mean(active)*12,info=activeAnn/te;
   const sharpe=am/sx*Math.sqrt(12),sharpeBm=bmMean/sy*Math.sqrt(12),sortino=am/downDev*Math.sqrt(12),sortinoBm=bmMean/downDevBm*Math.sqrt(12);
   const calmar=annual/Math.abs(ddx.maxDD),calmarBm=annBm/Math.abs(ddy.maxDD);
   const up=x.filter((_,i)=>y[i]>0),upB=y.filter(v=>v>0),dn=x.filter((_,i)=>y[i]<0),dnB=y.filter(v=>v<0);
   const upCap=mean(up)/mean(upB)*100,downCap=mean(dn)/mean(dnB)*100;
   const maxLossRun=arr=>{let m=0,c=0;arr.forEach(v=>{c=v<0?c+1:0;m=Math.max(m,c)});return m};
   const newHighFreq=arr=>{let w=1,pk=1,c=0;arr.forEach(v=>{w*=1+v;if(w>=pk){pk=w;c++}});return 100*c/arr.length};
   const runup=arr=>100*(arr.reduce((p,v)=>p*(1+v),1)-1);
   const ptu=arr=>{
     if(!arr.length)return NaN;
     let wealth=1,peak=1,under=0;
     arr.forEach(v=>{
       wealth*=1+v;
       if(wealth+1e-12<peak)under++;
       else peak=Math.max(peak,wealth);
     });
     return 100*under/arr.length;
   };
   return {rows,n,start:rows[0]?.[0],end:rows.at(-1)?.[0],
    main:{am,annMean:am*12,geo,annual,sdm:sx,sda:sx*Math.sqrt(12),downDev,best,worst,mdd:ddx.maxDD,dd:ddx,ptu:ptu(x),rho,beta,alpha,r2,sharpe,sortino,calmar,var95:Math.abs(am-1.645*sx),upCap,downCap,spread:upCap-downCap,upDown:upCap/Math.abs(downCap),positive:`${pos}/${n} (${(100*pos/n).toFixed(2)}%)`,gainLoss:gain/loss,skew,kurt,volDrag:(am-geo),maxLoss:maxLossRun(x),runup:runup(x),newHigh:newHighFreq(x),active:activeAnn,te,info},
    bm:{am:bmMean,annMean:bmMean*12,geo:Math.pow(y.reduce((p,r)=>p*(1+r),1),1/n)-1,annual:annBm,sdm:sy,sda:sy*Math.sqrt(12),downDev:downDevBm,best:bestBm,worst:worstBm,mdd:ddy.maxDD,dd:ddy,ptu:ptu(y),rho:1,beta:1,alpha:0,r2:1,sharpe:sharpeBm,sortino:sortinoBm,calmar:calmarBm,var95:Math.abs(bmMean-1.645*sy),upCap:100,downCap:100,spread:0,upDown:1,positive:`${posBm}/${n} (${(100*posBm/n).toFixed(2)}%)`,gainLoss:gainBm/lossBm,skew:skewBm,kurt:kurtBm,volDrag:(bmMean-(Math.pow(y.reduce((p,r)=>p*(1+r),1),1/n)-1)),maxLoss:maxLossRun(y),runup:runup(y),newHigh:newHighFreq(y),active:null,te:null,info:null}};
 }
 function drawMetrics(){
   if(!mt)return;
   const portfolios=names.filter(n=>!['SPY','TQQQ'].includes(n));
   if(!portfolios.includes(METRIC_PORTFOLIO))METRIC_PORTFOLIO=portfolios[0];
   const M=calcMetrics(METRIC_PORTFOLIO,bmName),A=M.main,B=M.bm;
   const pct=v=>Number.isFinite(v)?`${v>=0?'+':''}${(v*100).toFixed(2)}%`:'N/A',num=v=>Number.isFinite(v)?v.toFixed(2):'N/A',mo=v=>v==null?'Ongoing':`${v} months`;
   const metricRow=([l,x,y])=>`<div class="metrics-row"><span>${E(l)}</span><b class="${String(x).startsWith('-')?'neg':''}">${E(x)}</b><b class="${String(y).startsWith('-')?'neg':''}">${E(y)}</b></div>`;
   const section=(title,rows,open=false)=>`<details class="metric-section" ${open?'open':''}><summary>${E(title)}<span>${rows.length} metrics</span></summary><div class="metrics-compare-table"><div class="metrics-row metrics-head"><span>Metric</span><b>${E(METRIC_PORTFOLIO)}</b><b>${E(bmName)}</b></div>${rows.map(metricRow).join('')}</div></details>`;
   const core=[['CAGR',pct(A.annual),pct(B.annual)],['Sharpe',num(A.sharpe),num(B.sharpe)],['Sortino',num(A.sortino),num(B.sortino)],['Max DD',pct(A.mdd),pct(B.mdd)],['Calmar',num(A.calmar),num(B.calmar)],['Volatility',pct(A.sda),pct(B.sda)]];
   const returns=[['Arithmetic Mean (monthly)',pct(A.am),pct(B.am)],['Arithmetic Mean (annualized)',pct(A.annMean),pct(B.annMean)],['Geometric Mean (monthly)',pct(A.geo),pct(B.geo)],['Geometric Mean (annualized)',pct(A.annual),pct(B.annual)],['Best Year',pct(A.best),pct(B.best)],['Worst Year',pct(A.worst),pct(B.worst)],['Positive Periods',A.positive,B.positive],['Gain/Loss Ratio',num(A.gainLoss),num(B.gainLoss)],['New High Frequency',`${A.newHigh.toFixed(2)}%`,`${B.newHigh.toFixed(2)}%`]];
   const risk=[['Standard Deviation (monthly)',pct(A.sdm),pct(B.sdm)],['Standard Deviation (annualized)',pct(A.sda),pct(B.sda)],['Downside Deviation (monthly, MAR=0)',pct(A.downDev),pct(B.downDev)],['Sharpe Ratio',num(A.sharpe),num(B.sharpe)],['Sortino Ratio (MAR=0)',num(A.sortino),num(B.sortino)],['Analytical Value-at-Risk (5%)',pct(A.var95),pct(B.var95)],['Skewness',num(A.skew),num(B.skew)],['Excess Kurtosis',num(A.kurt),num(B.kurt)],['Volatility Drag',pct(A.volDrag),pct(B.volDrag)],['Max Consecutive Loss',String(A.maxLoss),String(B.maxLoss)]];
   const draw=[['Maximum Drawdown',pct(A.mdd),pct(B.mdd)],['MDD Date',A.dd.maxDate||'N/A',B.dd.maxDate||'N/A'],['Peak Date',A.dd.worst?.peakDate||'N/A',B.dd.worst?.peakDate||'N/A'],['Trough Date',A.dd.worst?.troughDate||'N/A',B.dd.worst?.troughDate||'N/A'],['Recovery Date',A.dd.worst?.recoveryDate||'Ongoing',B.dd.worst?.recoveryDate||'Ongoing'],['Drawdown Length',mo(A.dd.worst?.length),mo(B.dd.worst?.length)],['Recovery Time',mo(A.dd.worst?.recovery),mo(B.dd.worst?.recovery)],['Underwater Period',mo(A.dd.worst?.underwater),mo(B.dd.worst?.underwater)],['Avg Underwater Period',mo(Number.isFinite(A.dd.avgUnder)?A.dd.avgUnder.toFixed(1):null),mo(Number.isFinite(B.dd.avgUnder)?B.dd.avgUnder.toFixed(1):null)],['PTU(%)',num(A.ptu),num(B.ptu)],['Calmar Ratio',num(A.calmar),num(B.calmar)]];
   const benchmark=[['Benchmark Correlation',num(A.rho),num(B.rho)],['Beta',num(A.beta),num(B.beta)],['Alpha (annualized)',pct(A.alpha),pct(B.alpha)],['R²',pct(A.r2),pct(B.r2)],['Active Return',pct(A.active),'N/A'],['Tracking Error',pct(A.te),'N/A'],['Information Ratio',num(A.info),'N/A']];
   const capture=[['Upside Capture Ratio (%)',num(A.upCap),num(B.upCap)],['Downside Capture Ratio (%)',num(A.downCap),num(B.downCap)],['Up/Down Spread',num(A.spread),num(B.spread)],['Up/Down Ratio',num(A.upDown),num(B.upDown)],['Max Run-up',`${A.runup>=0?'+':''}${A.runup.toFixed(2)}%`,`${B.runup>=0?'+':''}${B.runup.toFixed(2)}%`]];
   // v44: Bam-style Up vs. Down Market Performance.
   // Uses the same common-period monthly returns already used by Metrics.
   const regimeDefs=[['Up Market',v=>v>=0.02],['Sideways',v=>v>-0.02&&v<0.02],['Down Market',v=>v<=-0.02]];
   const regimeRows=regimeDefs.map(([label,test])=>{
     const rr=M.rows.filter(r=>test(r[2])),above=rr.filter(r=>r[1]>r[2]).length,below=rr.length-above;
     return {label,above,below,total:rr.length,pctAbove:rr.length?100*above/rr.length:NaN,avgActive:rr.length?mean(rr.map(r=>r[1]-r[2])):NaN};
   });
   const totalAbove=regimeRows.reduce((s,r)=>s+r.above,0),totalBelow=regimeRows.reduce((s,r)=>s+r.below,0),totalN=regimeRows.reduce((s,r)=>s+r.total,0);
   const totalActive=M.rows.length?mean(M.rows.map(r=>r[1]-r[2])):NaN;
   const regimeTable=`<div class="metric-regime v44-regime"><h3>Up vs. Down Market Performance <span>(${M.n} months)</span></h3><div class="v44-regime-table"><div class="h">Market Type</div><div class="h">Above BM</div><div class="h">Below BM</div><div class="h">Total</div><div class="h">% Above</div><div class="h">Avg Active</div>${regimeRows.map(r=>`<div class="market ${r.label==='Up Market'?'up':r.label==='Down Market'?'down':''}">${E(r.label)}</div><div>${r.above}</div><div>${r.below}</div><div>${r.total}</div><div>${Number.isFinite(r.pctAbove)?Math.round(r.pctAbove)+'%':'—'}</div><div class="${r.avgActive<0?'neg':'pos'}">${pct(r.avgActive)}</div>`).join('')}<div class="total">Total</div><div class="total">${totalAbove}</div><div class="total">${totalBelow}</div><div class="total">${totalN}</div><div class="total">${totalN?Math.round(100*totalAbove/totalN)+'%':'—'}</div><div class="total ${totalActive<0?'neg':'pos'}">${pct(totalActive)}</div></div></div>`;
   const bucketDefs=[['≤ -8%',-Infinity,-.08],['-8 to -6%',-.08,-.06],['-6 to -4%',-.06,-.04],['-4 to -2%',-.04,-.02],['-2 to 0%',-.02,0],['0 to 2%',0,.02],['2 to 4%',.02,.04],['4 to 6%',.04,.06],['6 to 8%',.06,.08],['8 to 10%',.08,.10],['10 to 15%',.10,.15],['≥ 15%',.15,Infinity]];
   const bucketData=bucketDefs.map(([label,lo,hi])=>{const rr=M.rows.filter(r=>r[2]>=lo&&r[2]<hi);return {label,n:rr.length,main:rr.length?mean(rr.map(r=>r[1])):NaN,bm:rr.length?mean(rr.map(r=>r[2])):NaN}}).filter(r=>r.n);
   function regimeBarChart(data){
     if(!data.length)return '';
     const W=720,H=330,L=42,R=10,T=16,B=80,maxAbs=Math.max(.01,...data.flatMap(d=>[Math.abs(d.main),Math.abs(d.bm)])),plotH=H-T-B,zero=T+plotH/2,scale=(plotH/2-10)/maxAbs,step=(W-L-R)/data.length,bw=Math.min(17,step*.28);
     let bars='',labels='';
     data.forEach((d,i)=>{const cx=L+step*(i+.5);[[d.main,-bw*.58,'mainbar'],[d.bm,bw*.58,'bmbar']].forEach(([v,dx,cl])=>{const y=v>=0?zero-v*scale:zero;bars+=`<rect class="${cl}" x="${cx+dx-bw/2}" y="${y}" width="${bw}" height="${Math.max(1,Math.abs(v*scale))}" rx="1"/>`});labels+=`<text x="${cx}" y="${H-52}" transform="rotate(-45 ${cx} ${H-52})" text-anchor="end">${E(d.label)}</text>`});
     return `<div class="v44-regime-chart"><svg viewBox="0 0 ${W} ${H}"><line class="zero" x1="${L}" x2="${W-R}" y1="${zero}" y2="${zero}"/>${bars}${labels}<text class="axis-title" x="${W/2}" y="${H-7}" text-anchor="middle">Benchmark Return Range</text></svg><div class="v44-chart-legend"><span class="main">${E(METRIC_PORTFOLIO)}</span><span class="bm">${E(bmName)}</span></div></div>`;
   }
   const regimeChart=regimeBarChart(bucketData);
   mt.innerHTML=`<div class="metrics-toolbar metrics-toolbar-v83">${portfolioFoldHTML('metricsPicker',portfolios,METRIC_PORTFOLIO)}<div id="metricsBmSwitch"></div></div>
     <div class="metrics-definition">Common period · Monthly returns · RF/MAR 0% · Sortino downside deviation = √mean(min(r,0)²)</div>
     <h3 class="metrics-title">Core Metrics</h3><div class="metric-kpi-grid">${core.map(([l,x,y])=>`<div class="metric-kpi"><span>${E(l)}</span><b>${E(x)}</b><small>${E(bmName)} ${E(y)}</small></div>`).join('')}</div>
     ${section('Return',returns,true)}${section('Risk & Downside',risk,true)}${section('Drawdown',draw)}${section('Benchmark & Alpha',benchmark)}${section('Market Capture',capture)}
     ${regimeTable}${regimeChart}<div class="analysis-period">Analysis Period: ${E(M.start||'—')} to ${E(M.end||'—')} (${M.n} months)</div>`;
   wirePortfolioFold(mt,'metricsPicker',portfolios,METRIC_PORTFOLIO,next=>{METRIC_PORTFOLIO=next;drawMetrics()});
   bmSwitch('metricsBmSwitch',bmName,next=>{FAST_BM=next;renderFastAnalytics(window.__MY4F_SNAPSHOT__,next);});
 }
 drawMetrics();
 function chart(rows){if(!rows?.length)return'<div class="analytics-empty">データなし</div>';const vs=rows.map(x=>+x[1]),mn=Math.min(0,...vs),mx=Math.max(0,...vs),W=720,H=250,L=48,R=12,T=14,B=28,n=rows.length,span=(mx-mn)||1,pts=rows.map((r,i)=>`${L+(W-L-R)*i/Math.max(1,n-1)},${T+(H-T-B)*(1-(+r[1]-mn)/span)}`).join(' '),zy=T+(H-T-B)*(1-(0-mn)/span);return`<svg viewBox="0 0 ${W} ${H}" class="analytics-svg"><line x1="${L}" x2="${W-R}" y1="${zy}" y2="${zy}" class="zero"/><polyline points="${pts}" class="aline"/><text x="${L}" y="${H-7}">${E(rows[0][0])}</text><text x="${W-R}" y="${H-7}" text-anchor="end">${E(rows[n-1][0])}</text></svg>`}
 function bind(root,fn,fold=false){if(!root)return;let selected=names.includes('麒麟「現世」')?'麒麟「現世」':names[0];const renderShell=()=>{root.innerHTML=fold?`${portfolioFoldHTML(root.id+'Picker',names,selected)}<div id="${root.id}Body"></div>`:pick(root.id);const body=root.querySelector(`#${root.id}Body`);if(fold){wirePortfolioFold(root,root.id+'Picker',names,selected,next=>{selected=next;renderShell();fn(selected,root.querySelector(`#${root.id}Body`))});fn(selected,body)}else{const bs=[...root.querySelectorAll('button')],go=n=>{bs.forEach(b=>b.classList.toggle('active',b.dataset.series===n));fn(n,body)};bs.forEach(b=>b.onclick=()=>go(b.dataset.series));if(names[0])go(names[0])}};renderShell()}
 bind(document.getElementById('rollingPage'),(n,b)=>{
   const hist=p?.history||{}, mainRows=Array.isArray(hist[n])?hist[n]:[], bmRows=Array.isArray(hist[bmName])?hist[bmName]:[];
   const clean=arr=>arr.map(x=>[String(x?.[0]??''),Number(x?.[1])/100]).filter(x=>/^\d{4}-\d{2}/.test(x[0])&&Number.isFinite(x[1])).sort((a,b)=>a[0].localeCompare(b[0]));
   const M=clean(mainRows), B=clean(bmRows), bmMap=new Map(B);
   const common=M.map(x=>[x[0],x[1],bmMap.get(x[0])]).filter(x=>Number.isFinite(x[2]));
   const windows=[3,6,12,24,36,60,84,120];
   const label=w=>w<12?`${w} months`:w===12?'1 year':`${w/12} years`;
   const roll=(rows,w)=>{
     const out=[];
     for(let i=w-1;i<rows.length;i++){
       let prod=1; for(let j=i-w+1;j<=i;j++)prod*=1+rows[j][1];
       const v=w<12?(prod-1):(Math.pow(prod,12/w)-1);
       out.push([rows[i][0],v*100]);
     }
     return out;
   };
   const stats=arr=>{
     const v=arr.map(x=>x[1]).filter(Number.isFinite).sort((a,b)=>a-b);
     if(!v.length)return null;
     const avg=v.reduce((s,x)=>s+x,0)/v.length;
     const med=v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2;
     const q=.1*(v.length-1),lo=Math.floor(q),hi=Math.ceil(q),p10=v[lo]+(v[hi]-v[lo])*(q-lo);
     return {avg,high:v.at(-1),low:v[0],median:med,p10,positive:100*v.filter(x=>x>0).length/v.length};
   };
   const fmtp=v=>Number.isFinite(+v)?`${+v>=0?'+':''}${(+v).toFixed(2)}%`:'—';
   const statTable=(title,rows,dist=false)=>`<div class="bam-roll-section"><h3>${E(title)}</h3><div class="bam-roll-table"><div class="bam-roll-row head"><span>Period</span>${dist?'<span>Median</span><span>P10</span><span>Positive</span>':'<span>Average</span><span>High</span><span>Low</span>'}</div>${windows.map(w=>{const s=stats(roll(rows,w));if(!s)return'';return`<div class="bam-roll-row"><span>${label(w)}</span>${dist?`<span>${fmtp(s.median)}</span><span class="${s.p10<0?'neg':''}">${fmtp(s.p10)}</span><span>${s.positive.toFixed(2)}%</span>`:`<span>${fmtp(s.avg)}</span><span>${fmtp(s.high)}</span><span class="${s.low<0?'neg':''}">${fmtp(s.low)}</span>`}</div>`}).join('')}</div></div>`;
   b.innerHTML=`<div id="rollingBmSwitch"></div><div class="bam-roll-wrap"><h2 class="bam-roll-h2">Summary Statistics</h2>${statTable(n,M,false)}${statTable(bmName,B,false)}<h2 class="bam-roll-h2">Distribution</h2>${statTable(n,M,true)}${statTable(bmName,B,true)}<div class="bam-roll-chart-section"><h2 class="bam-roll-h2">Rolling CAGR Chart</h2><div class="bam-roll-tabs">${[12,36,60,84,120].map(w=>`<button data-w="${w}" class="${w===36?'active':''}">${w/12}Y</button>`).join('')}</div><div id="bamRollingChart"></div></div></div>`;
   bmSwitch('rollingBmSwitch',bmName,next=>{FAST_BM=next;renderMonthlyReturnsPage(window.__MY4F_SNAPSHOT__,next);renderFastAnalytics(window.__MY4F_SNAPSHOT__,next);});
   const chartBox=b.querySelector('#bamRollingChart');
   const draw=w=>{
     b.querySelectorAll('.bam-roll-tabs button').forEach(x=>x.classList.toggle('active',+x.dataset.w===w));
     const mr=roll(M,w), br=roll(B,w), mp=new Map(br), both=mr.map(x=>[x[0],x[1],mp.get(x[0])]).filter(x=>Number.isFinite(x[2]));
     const wins=both.filter(x=>x[1]>x[2]).length, winrate=both.length?100*wins/both.length:NaN;
     let best=null,worst=null; both.forEach(x=>{if(!best||x[1]>best[1])best=x;if(!worst||x[1]<worst[1])worst=x});
     chartBox.innerHTML=`<div class="bam-roll-chart-title">Annualized Rolling Return - ${w/12} ${w===12?'Year':'Years'}</div>${compareChart(both,n,bmName)}<div class="bam-roll-kpis"><div><span>Win Rate vs ${E(bmName)}</span><b>${Number.isFinite(winrate)?winrate.toFixed(1)+'%':'—'}</b></div><div><span>Sample Count</span><b>${both.length}</b></div><div><span>Best Window</span><b>${best?fmtp(best[1]):'—'}</b><small>${best?E(best[0])+' · '+E(bmName)+' '+fmtp(best[2]):''}</small></div><div><span>Worst Window</span><b>${worst?fmtp(worst[1]):'—'}</b><small>${worst?E(worst[0])+' · '+E(bmName)+' '+fmtp(worst[2]):''}</small></div></div>`;
     bindRollingChartTooltip(chartBox,both,n,bmName);
   };
   b.querySelectorAll('.bam-roll-tabs button').forEach(x=>x.onclick=()=>draw(+x.dataset.w));
   draw(36);
 },true);
 function compareChart(rows,mainName,bmName){
   if(!rows?.length)return'<div class="analytics-empty">データなし</div>';
   const all=rows.flatMap(x=>[Number(x[1]),Number(x[2])]).filter(Number.isFinite);
   if(!all.length)return'<div class="analytics-empty">データなし</div>';
   const mn=Math.min(0,...all),mx=Math.max(0,...all),W=720,H=250,L=48,R=12,T=14,B=28,n=rows.length,span=(mx-mn)||1;
   const X=i=>L+(W-L-R)*i/Math.max(1,n-1),Y=v=>T+(H-T-B)*(1-(v-mn)/span),zero=Y(0);
   const line=col=>{let seg=[],s='';const flush=()=>{if(seg.length>1)s+=`<polyline points="${seg.join(' ')}" class="${col}"/>`;seg=[]};rows.forEach((r,i)=>{const v=Number(r[col==='main-line'?1:2]);Number.isFinite(v)?seg.push(`${X(i)},${Y(v)}`):flush()});flush();return s};
   return`<div class="compare-chart-wrap"><svg viewBox="0 0 ${W} ${H}" class="analytics-svg compare-svg"><line x1="${L}" x2="${W-R}" y1="${zero}" y2="${zero}" class="zero"/>${line('main-line')}${line('bm-line')}<line class="rolling-crosshair" x1="${L}" x2="${L}" y1="${T}" y2="${H-B}"/><text x="${L}" y="${H-7}">${E(rows[0][0])}</text><text x="${W-R}" y="${H-7}" text-anchor="end">${E(rows.at(-1)[0])}</text></svg><div class="rolling-touch-tooltip" hidden></div><div class="compare-legend"><span class="main-key">${E(mainName)}</span><span class="bm-key">${E(bmName)}</span></div></div>`;
 }
 function bindRollingChartTooltip(root,rows,mainName,bmName){
   const wrap=root?.querySelector('.compare-chart-wrap'),svg=wrap?.querySelector('.compare-svg'),tip=wrap?.querySelector('.rolling-touch-tooltip'),cross=wrap?.querySelector('.rolling-crosshair');
   if(!wrap||!svg||!tip||!cross||!rows?.length)return;
   const W=720,L=48,R=12,n=rows.length;
   const show=ev=>{
     const r=svg.getBoundingClientRect(); if(!r.width)return;
     const clientX=ev.touches?.[0]?.clientX ?? ev.clientX; if(!Number.isFinite(clientX))return;
     const vx=(clientX-r.left)/r.width*W;
     const i=Math.max(0,Math.min(n-1,Math.round((vx-L)/(W-L-R)*Math.max(1,n-1))));
     const row=rows[i]; if(!row)return;
     const x=L+(W-L-R)*i/Math.max(1,n-1);
     cross.setAttribute('x1',x);cross.setAttribute('x2',x);cross.style.visibility='visible';
     const f=v=>Number.isFinite(+v)?`${+v>=0?'+':''}${(+v).toFixed(2)}%`:'—';
     tip.innerHTML=`<div class="date">${E(row[0])}</div><div class="main">${E(mainName)} ${f(row[1])}</div><div class="rolling-bm">${E(bmName)} ${f(row[2])}</div>`;
     tip.hidden=false;
     const px=Math.max(6,Math.min(wrap.clientWidth-tip.offsetWidth-6,(clientX-wrap.getBoundingClientRect().left)+10));
     tip.style.left=px+'px'; tip.style.top='10px';
   };
   const hide=()=>{tip.hidden=true;cross.style.visibility='hidden'};
   svg.addEventListener('pointerdown',show,{passive:true});
   svg.addEventListener('pointermove',ev=>{if(ev.pointerType==='touch'||ev.pointerType==='pen'||ev.pointerType==='mouse'||ev.buttons)show(ev)},{passive:true});
   svg.addEventListener('touchstart',show,{passive:true});
   svg.addEventListener('touchmove',show,{passive:true});
   svg.addEventListener('pointerleave',hide,{passive:true});
 }

 function commonMonthly(main,bmName){
   const h=p?.history||{},mr=Array.isArray(h[main])?h[main]:[],br=Array.isArray(h[bmName])?h[bmName]:[];
   const bmMap=new Map(br.map(x=>[String(x[0]),Number(x[1])/100]));
   return mr.map(x=>[String(x[0]),Number(x[1])/100,bmMap.get(String(x[0]))]).filter(x=>Number.isFinite(x[1])&&Number.isFinite(x[2])).sort((a,b)=>a[0].localeCompare(b[0]));
 }
 function summaryStats(rows,col){
   if(!rows.length)return null;
   const rs=rows.map(x=>x[col]),wealth=[1];rs.forEach(r=>wealth.push(wealth.at(-1)*(1+r)));
   const years=rows.length/12,cagr=(Math.pow(wealth.at(-1),1/years)-1)*100;
   const mean=rs.reduce((s,v)=>s+v,0)/rs.length,variance=rs.reduce((s,v)=>s+(v-mean)**2,0)/Math.max(1,rs.length-1),vol=Math.sqrt(variance)*Math.sqrt(12)*100;
   let peak=1,mdd=0;wealth.slice(1).forEach(w=>{peak=Math.max(peak,w);mdd=Math.min(mdd,w/peak-1)});
   const annual={};rows.forEach(x=>{const y=x[0].slice(0,4);annual[y]=(annual[y]??1)*(1+x[col])});const yr=Object.values(annual).map(v=>(v-1)*100);
   const rf=0,sh=(vol?mean*12*100/vol:0),downDev=Math.sqrt(rs.reduce((s,v)=>s+Math.min(v,0)**2,0)/Math.max(1,rs.length))*Math.sqrt(12)*100,sortino=downDev?mean*12*100/downDev:0;
   return{start:rows[0][0],end:rows.at(-1)[0],months:rows.length,endBalance:100000*wealth.at(-1),cagr,vol,best:Math.max(...yr),worst:Math.min(...yr),mdd:mdd*100,sharpe:sh,sortino};
 }
 function corr(rows){
   if(rows.length<2)return null;const a=rows.map(x=>x[1]),b=rows.map(x=>x[2]),ma=a.reduce((s,v)=>s+v,0)/a.length,mb=b.reduce((s,v)=>s+v,0)/b.length;
   const num=a.reduce((s,v,i)=>s+(v-ma)*(b[i]-mb),0),da=Math.sqrt(a.reduce((s,v)=>s+(v-ma)**2,0)),db=Math.sqrt(b.reduce((s,v)=>s+(v-mb)**2,0));return da&&db?num/(da*db):null;
 }
 function money(v){if(!Number.isFinite(v))return'—';return v>=1e6?'$'+(v/1e6).toFixed(2)+'M':v>=1e3?'$'+(v/1e3).toFixed(1)+'K':'$'+v.toFixed(0)}
 function renderSummaryCompare(){
   const root=document.getElementById('summaryComparePage');if(!root)return;
   const main=SUMMARY_PORTFOLIO,rows=commonMonthly(main,bmName),s=summaryStats(rows,1),bs=summaryStats(rows,2),c=corr(rows);
   if(!s||!bs){root.innerHTML='<div class="analytics-empty">データなし</div>';return}
   const tr=(lab,a1,a2,cls='')=>`<tr><td>${lab}</td><td class="${cls}">${a1}</td><td class="${cls}">${a2}</td></tr>`;
   const summaryTabs=portfolioFoldHTML('summaryPicker',names,main);
   root.innerHTML=`${summaryTabs}<div id="summaryBmSwitch"></div><div class="summary-compare-title"><b>${E(main)}</b><span>vs</span><b>${E(bmName)}</b></div><div class="analytics-table-scroll"><table class="analytics-table summary-compare-table"><thead><tr><th>Metric</th><th>${E(main)}</th><th>${E(bmName)}</th></tr></thead><tbody>
   ${tr('Start Balance','$100,000','$100,000')}${tr('End Balance',money(s.endBalance),money(bs.endBalance))}
   ${tr('Annualized Return (CAGR)',fmt(s.cagr),fmt(bs.cagr))}
   ${tr('Standard Deviation',fmt(s.vol),fmt(bs.vol))}
   ${tr('Best Year',fmt(s.best),fmt(bs.best))}
   ${tr('Worst Year',fmt(s.worst),fmt(bs.worst))}
   ${tr('Maximum Drawdown',fmt(s.mdd),fmt(bs.mdd))}
   ${tr('Sharpe Ratio',Number(s.sharpe).toFixed(2),Number(bs.sharpe).toFixed(2))}
   ${tr('Sortino Ratio',Number(s.sortino).toFixed(2),Number(bs.sortino).toFixed(2))}
   ${tr('Benchmark Correlation',c==null?'—':c.toFixed(2),'1.00')}
   </tbody></table></div><p class="analysis-period">Analysis Period: ${s.start} to ${s.end} (${s.months} months)</p>`;
   wirePortfolioFold(root,'summaryPicker',names,main,next=>{
     SUMMARY_PORTFOLIO=next;
     window.__MY4F_SUMMARY_PORTFOLIO__=SUMMARY_PORTFOLIO;
     renderSummaryCompare();
   });
   bmSwitch('summaryBmSwitch',bmName,next=>{FAST_BM=next;renderFastAnalytics(window.__MY4F_SNAPSHOT__,next);renderMonthlyReturnsPage(window.__MY4F_SNAPSHOT__,next);});
 }
 renderSummaryCompare();

 function ddTroughs(rows){
   const out=[];for(let i=0;i<rows.length;i++){const v=Number(rows[i][1]),prev=i?Number(rows[i-1][1]):0,next=i<rows.length-1?Number(rows[i+1][1]):0;if(v<0&&v<=prev&&v<=next)out.push(rows[i]);}
   return out.sort((x,y)=>Number(x[1])-Number(y[1])).slice(0,10);
 }
 bind(document.getElementById('drawdownsPage'),(n,b)=>{
   const r=a[n]?.drawdown||[],br=a[bmName]?.drawdown||[];
   function episodes(rows){
     const z=rows.map(x=>[String(x[0]),Number(x[1])]).filter(x=>Number.isFinite(x[1])).sort((x,y)=>x[0].localeCompare(y[0]));
     const out=[];let cur=null;
     z.forEach(([m,v],i)=>{
       if(v<0){
         if(!cur)cur={start:m,startIndex:i,trough:m,troughIndex:i,troughVal:v,end:null,endIndex:null};
         if(v<cur.troughVal){cur.trough=m;cur.troughIndex=i;cur.troughVal=v}
       }else if(cur){
         cur.end=m;cur.endIndex=i;out.push(cur);cur=null;
       }
     });
     if(cur){cur.endIndex=z.length-1;out.push(cur)}
     return out.map(e=>({
       ...e,
       ddLength:e.troughIndex-e.startIndex+1,
       recovery:e.end==null?null:Math.max(0,e.endIndex-e.troughIndex),
       underwater:e.end==null?(z.length-e.startIndex):(e.endIndex-e.startIndex)
     })).sort((x,y)=>x.troughVal-y.troughVal);
   }
   const se=episodes(r),be=episodes(br),sWorst=se[0],bWorst=be[0];
   const duration=x=>x==null?'Ongoing':`${x} mo`;
   function durationCards(){
     return `<div class="dd-duration-grid">
       <div><small>Drawdown Length</small><b>${duration(sWorst?.ddLength)}</b><span>${E(n)}</span><em>${duration(bWorst?.ddLength)} · ${E(bmName)}</em></div>
       <div><small>Recovery Time</small><b>${duration(sWorst?.recovery)}</b><span>${E(n)}</span><em>${duration(bWorst?.recovery)} · ${E(bmName)}</em></div>
       <div><small>Underwater Period</small><b>${duration(sWorst?.underwater)}</b><span>${E(n)}</span><em>${duration(bWorst?.underwater)} · ${E(bmName)}</em></div>
     </div>`;
   }
   function interactiveDD(){
     const sm=new Map(r.map(x=>[String(x[0]),Number(x[1])])),bm=new Map(br.map(x=>[String(x[0]),Number(x[1])]));
     const months=[...new Set([...sm.keys(),...bm.keys()])].sort();
     if(!months.length)return'<div class="analytics-empty">データなし</div>';
     const W=720,H=270,L=45,R=12,T=12,B=30,all=[...sm.values(),...bm.values()].filter(Number.isFinite),mn=Math.min(-1,...all),span=-mn||1;
     const X=i=>L+(W-L-R)*i/Math.max(1,months.length-1),Y=v=>T+(H-T-B)*(v/mn);
     const poly=(mp,cls)=>{let s='',seg=[];const flush=()=>{if(seg.length>1)s+=`<polyline points="${seg.join(' ')}" class="${cls}"/>`;seg=[]};months.forEach((m,i)=>{const v=mp.get(m);Number.isFinite(v)?seg.push(`${X(i)},${Y(v)}`):flush()});flush();return s};
     return `<div class="dd-touch-chart" data-months='${E(JSON.stringify(months))}'>
       <svg viewBox="0 0 ${W} ${H}" class="dd-svg">
        <line x1="${L}" x2="${W-R}" y1="${Y(0)}" y2="${Y(0)}" class="zero"/>
        ${poly(sm,'dd-main-line')}${poly(bm,'dd-bm-line')}
        <line class="dd-cross" x1="${L}" x2="${L}" y1="${T}" y2="${H-B}" visibility="hidden"/>
        <circle class="dd-main-dot" r="4.5" visibility="hidden"/><circle class="dd-bm-dot" r="4.5" visibility="hidden"/>
        <text x="${L}" y="${H-7}">${E(months[0])}</text><text x="${W-R}" y="${H-7}" text-anchor="end">${E(months.at(-1))}</text>
        <rect class="dd-hit" x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}"/>
       </svg><div class="dd-tip" hidden></div>
       <div class="compare-legend"><span class="main-key">${E(n)}</span><span class="bm-key">${E(bmName)}</span></div>
     </div>`;
   }
   function worstBlock(title,eps){
     return `<section class="dd-worst-block"><h3>${E(title)}</h3>
       <div class="dd-worst-list"><div class="dd-worst-head"><span>#</span><span>Trough</span><span>MaxDD</span><span>Length</span><span>Recovery</span><span>Underwater</span></div>
       ${eps.slice(0,10).map((e,i)=>`<div class="dd-worst-row"><span>${i+1}</span><span>${E(e.trough)}</span><strong>${fmt(e.troughVal)}</strong><span>${e.ddLength}m</span><span>${e.recovery==null?'Ongoing':e.recovery+'m'}</span><span>${e.underwater}m</span></div>`).join('')}</div>
     </section>`;
   }
   b.innerHTML=`<div id="ddBmSwitch"></div>
     <div class="dd-worst-cards"><div><small>Worst ${E(n)}</small><b>${fmt(sWorst?.troughVal)}</b></div><div><small>Worst ${E(bmName)}</small><b>${fmt(bWorst?.troughVal)}</b></div></div>
     ${durationCards()}${interactiveDD()}
     <h3 class="subsection-title">Worst 10 Drawdowns</h3>
     ${worstBlock(n+' — Portfolio',se)}
     ${worstBlock(bmName+' — Benchmark',be)}`;
   bmSwitch('ddBmSwitch',bmName,next=>{FAST_BM=next;renderFastAnalytics(window.__MY4F_SNAPSHOT__,next);});

   const wrap=b.querySelector('.dd-touch-chart'),svg=wrap?.querySelector('svg'),tip=wrap?.querySelector('.dd-tip');
   if(svg&&wrap){
     const sm=new Map(r.map(x=>[String(x[0]),Number(x[1])])),bm=new Map(br.map(x=>[String(x[0]),Number(x[1])]));
     const months=[...new Set([...sm.keys(),...bm.keys()])].sort(),W=720,H=270,L=45,R=12,T=12,B=30;
     const all=[...sm.values(),...bm.values()].filter(Number.isFinite),mn=Math.min(-1,...all);
     const X=i=>L+(W-L-R)*i/Math.max(1,months.length-1),Y=v=>T+(H-T-B)*(v/mn);
     const cross=svg.querySelector('.dd-cross'),sd=svg.querySelector('.dd-main-dot'),bd=svg.querySelector('.dd-bm-dot');
     const show=e=>{
       const q=svg.getBoundingClientRect(),local=(e.clientX-q.left)/q.width*W;
       let i=Math.round((local-L)/(W-L-R)*(months.length-1));i=Math.max(0,Math.min(months.length-1,i));
       const m=months[i],sv=sm.get(m),bv=bm.get(m),px=X(i);
       cross.setAttribute('x1',px);cross.setAttribute('x2',px);cross.setAttribute('visibility','visible');
       [[sd,sv],[bd,bv]].forEach(([dot,v])=>{if(Number.isFinite(v)){dot.setAttribute('cx',px);dot.setAttribute('cy',Y(v));dot.setAttribute('visibility','visible')}else dot.setAttribute('visibility','hidden')});
       tip.innerHTML=`<b>${E(m)}</b><div><span>${E(n)}</span><strong>${fmt(sv)}</strong></div><div><span>${E(bmName)}</span><strong>${fmt(bv)}</strong></div>`;
       tip.hidden=false;const pxCss=e.clientX-q.left;tip.style.left=Math.max(8,Math.min(wrap.clientWidth-tip.offsetWidth-8,pxCss-tip.offsetWidth/2))+'px';
     };
     svg.addEventListener('pointerdown',e=>{svg.setPointerCapture?.(e.pointerId);show(e)});
     svg.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)show(e)});
     svg.addEventListener('click',e=>{if(e.pointerType==='mouse'||!('PointerEvent' in window))show(e)});
   }
 },true);

 function annualBars(mainRows,bmRows,mainName,bmName){
   const bmMap=new Map(bmRows.map(x=>[x[0],Number(x[1])])),rows=mainRows.map(x=>[x[0],Number(x[1]),bmMap.get(x[0])]).filter(x=>Number.isFinite(x[1])&&Number.isFinite(x[2]));
   if(!rows.length)return'<div class="analytics-empty">データなし</div>';
   const W=760,H=285,L=74,R=18,T=12,B=42,all=rows.flatMap(x=>[x[1],x[2]]),mn=Math.min(0,...all),mx=Math.max(0,...all),span=mx-mn||1,zero=T+(H-T-B)*(1-(0-mn)/span),group=(W-L-R)/rows.length,bw=Math.max(3,Math.min(14,group*.3)),Y=v=>T+(H-T-B)*(1-(v-mn)/span);
   const stepRaw=span/4,mag=Math.pow(10,Math.floor(Math.log10(Math.max(stepRaw,1e-9)))),norm=stepRaw/mag,step=(norm<=1?1:norm<=2?2:norm<=5?5:10)*mag;
   const tickMin=Math.ceil(mn/step)*step,tickMax=Math.floor(mx/step)*step;
   let s=`<div class="annual-chart-wrap"><svg viewBox="0 0 ${W} ${H}" class="annual-bar-svg">`;
   for(let tv=tickMin;tv<=tickMax+step*.001;tv+=step){const ty=Y(tv);s+=`<line x1="${L}" x2="${W-R}" y1="${ty}" y2="${ty}" class="${Math.abs(tv)<step*.001?'zero':'annual-grid'}"/><text x="${L-8}" y="${ty+5}" text-anchor="end" class="annual-y-label">${Math.round(tv)}%</text>`}
   rows.forEach((x,i)=>{const cx=L+group*(i+.5),y1=Y(x[1]),y2=Y(x[2]);s+=`<rect x="${cx-bw-1}" y="${Math.min(y1,zero)}" width="${bw}" height="${Math.max(1,Math.abs(zero-y1))}" class="annual-main-bar"/><rect x="${cx+1}" y="${Math.min(y2,zero)}" width="${bw}" height="${Math.max(1,Math.abs(zero-y2))}" class="annual-bm-bar"/>`;if(i%Math.max(1,Math.ceil(rows.length/8))===0)s+=`<text x="${cx}" y="${H-10}" text-anchor="middle">${E(x[0])}</text>`});
   return s+`<line class="annual-crosshair" x1="${L}" x2="${L}" y1="${T}" y2="${H-B}"/></svg><div class="annual-touch-tooltip" hidden></div><div class="compare-legend"><span class="main-key">${E(mainName)}</span><span class="bm-key">${E(bmName)}</span></div></div>`;
 }
 function bindAnnualBarTooltip(root,mainRows,bmRows,mainName,bmName){
   const wrap=root?.querySelector('.annual-chart-wrap'),svg=wrap?.querySelector('.annual-bar-svg'),tip=wrap?.querySelector('.annual-touch-tooltip'),cross=wrap?.querySelector('.annual-crosshair');
   if(!wrap||!svg||!tip||!cross)return;
   const bmMap=new Map((bmRows||[]).map(x=>[String(x[0]),Number(x[1])]));
   const rows=(mainRows||[]).map(x=>[String(x[0]),Number(x[1]),bmMap.get(String(x[0]))]).filter(x=>Number.isFinite(x[1])&&Number.isFinite(x[2]));
   if(!rows.length)return;
   const W=760,L=74,R=18,T=12,B=42,n=rows.length;
   const show=ev=>{
     const r=svg.getBoundingClientRect(); if(!r.width)return;
     const clientX=ev.touches?.[0]?.clientX ?? ev.clientX; if(!Number.isFinite(clientX))return;
     const vx=(clientX-r.left)/r.width*W;
     const group=(W-L-R)/n;
     const i=Math.max(0,Math.min(n-1,Math.floor((vx-L)/group)));
     const row=rows[i]; if(!row)return;
     const x=L+group*(i+.5); cross.setAttribute('x1',x);cross.setAttribute('x2',x);cross.style.visibility='visible';
     const f=v=>`${v>=0?'+':''}${v.toFixed(2)}%`;
     tip.innerHTML=`<div class="date">${E(row[0])}</div><div class="main">${E(mainName)} ${f(row[1])}</div><div class="annual-bm">${E(bmName)} ${f(row[2])}</div>`;
     tip.hidden=false;
     const wr=wrap.getBoundingClientRect(),px=Math.max(6,Math.min(wrap.clientWidth-tip.offsetWidth-6,clientX-wr.left+10));
     tip.style.left=px+'px';tip.style.top='10px';
   };
   const hide=()=>{tip.hidden=true;cross.style.visibility='hidden'};
   svg.addEventListener('pointerdown',show,{passive:true});
   svg.addEventListener('pointermove',ev=>{if(ev.pointerType==='touch'||ev.pointerType==='pen'||ev.pointerType==='mouse'||ev.buttons)show(ev)},{passive:true});
   svg.addEventListener('touchstart',show,{passive:true});
   svg.addEventListener('touchmove',show,{passive:true});
   svg.addEventListener('pointerup',hide,{passive:true});svg.addEventListener('pointercancel',hide,{passive:true});
   svg.addEventListener('touchend',hide,{passive:true});svg.addEventListener('touchcancel',hide,{passive:true});
   svg.addEventListener('pointerleave',hide,{passive:true});
 }
 bind(document.getElementById('annualPage'),(n,b)=>{
   const r=a[n]?.annual||[],br=a[bmName]?.annual||[],bmMap=new Map(br.map(x=>[x[0],x[1]]));
   let wm=1,wb=1;const balance=new Map(),bbalance=new Map();[...r].sort((x,y)=>x[0].localeCompare(y[0])).forEach(x=>{wm*=1+Number(x[1])/100;balance.set(x[0],wm*100000)});[...br].sort((x,y)=>x[0].localeCompare(y[0])).forEach(x=>{wb*=1+Number(x[1])/100;bbalance.set(x[0],wb*100000)});
   b.innerHTML=`<div id="annualBmSwitch"></div>${annualBars(r,br,n,bmName)}<h3 class="subsection-title">Annual Returns <span class="years-count">(${r.length} years)</span></h3><div class="analytics-table-scroll"><table class="analytics-table annual-compare-table"><thead><tr><th>Year</th><th>${E(n)}<br>Return</th><th>${E(bmName)}<br>Return</th></tr></thead><tbody>${[...r].reverse().map(x=>`<tr><td>${E(x[0])}</td><td class="${Number(x[1])>=0?'ret-pos':'ret-neg'}">${fmt(x[1])}</td><td class="${Number(bmMap.get(x[0]))>=0?'ret-pos':'ret-neg'}">${fmt(bmMap.get(x[0]))}</td></tr>`).join('')}</tbody></table></div>`;
   bindAnnualBarTooltip(b,r,br,n,bmName);
   bmSwitch('annualBmSwitch',bmName,next=>{FAST_BM=next;renderFastAnalytics(window.__MY4F_SNAPSHOT__,next);renderMonthlyReturnsPage(window.__MY4F_SNAPSHOT__,next);});
 },true);

}

// Fast v5 menu / section navigation
document.addEventListener('DOMContentLoaded',()=>{
 // Visible build marker: confirms the browser is running this exact UI update.
 const btn=document.getElementById('fastMenuButton'),menu=document.getElementById('fastMenu'),back=document.getElementById('fastMenuBackdrop'),close=document.getElementById('fastMenuClose');
 if(!btn||!menu||!back)return;
 const openMenu=()=>{menu.classList.add('open');menu.setAttribute('aria-hidden','false');back.hidden=false;requestAnimationFrame(()=>back.classList.add('show'));btn.setAttribute('aria-expanded','true');document.body.classList.add('menu-open')};
 const closeMenu=()=>{menu.classList.remove('open');menu.setAttribute('aria-hidden','true');back.classList.remove('show');btn.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');setTimeout(()=>{if(!menu.classList.contains('open'))back.hidden=true},180)};

 const pageIds=['monthlyTrade','summaryPage','performance','metrics','monthlyReturns','rolling','drawdowns','annual','deterioration','specification'];
 const allPages=()=>pageIds.map(id=>document.getElementById(id)).filter(Boolean);
 const dashboardNodes=()=>[...document.querySelectorAll('main > section:not(.app-page):not(.analytics-shell), main > .dashboard-only')];
 function showFastPage(id){
   const dashboard=id==='top';
   document.body.classList.toggle('fast-dashboard-view',dashboard);
   document.body.classList.toggle('fast-subpage-view',!dashboard);
   document.body.dataset.fastPage=id;
   allPages().forEach(el=>{
     const active=!dashboard&&el.id===id;
     el.classList.toggle('page-active',active);
     el.style.display=active?'block':'none';
   });
   document.querySelectorAll('.analytics-shell').forEach(el=>el.style.display=(!dashboard&&['metrics','monthlyReturns','rolling','drawdowns','annual'].includes(id))?'contents':'none');
   dashboardNodes().forEach(el=>el.style.display=dashboard?'':'none');
   document.querySelectorAll('.dashboard-only').forEach(el=>el.style.display=dashboard?'':'none');
   const header=document.querySelector('header'); if(header)header.style.display=dashboard?'':'none';
   const footer=document.querySelector('footer'); if(footer)footer.style.display=dashboard?'':'none';
   window.scrollTo({top:0,behavior:'auto'});
 }
 window.showFastPage=showFastPage;
 const initial=(location.hash||'#top').slice(1);
 showFastPage(pageIds.includes(initial)?initial:'top');
 btn.addEventListener('click',openMenu);close?.addEventListener('click',closeMenu);back.addEventListener('click',closeMenu);
 menu.querySelectorAll('[data-target]').forEach(x=>x.addEventListener('click',()=>{
   const id=x.dataset.target;closeMenu();
   setTimeout(()=>{showFastPage(id);if(id)history.replaceState(null,'','#'+id)},80);
 }));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
});


// v111 Deterioration Monitor — display-only interaction. Research/Python remains canonical.
function initDeteriorationMonitor(){
  const page=document.getElementById('deterioration'); if(!page)return;
  const chips=[...page.querySelectorAll('.det-chip')], clear=page.querySelector('.det-clear');
  const rows=[...page.querySelectorAll('.det-table tbody tr')];
  const apply=(key)=>{
    chips.forEach(b=>b.classList.toggle('active',b.dataset.detFilter===key));
    rows.forEach(r=>{r.hidden=key!=='all' && r.dataset.detGroup!==key;});
  };
  chips.forEach(b=>b.addEventListener('click',()=>apply(b.dataset.detFilter||'all')));
  clear?.addEventListener('click',()=>apply('all'));
  apply('all');
}
document.addEventListener('DOMContentLoaded',initDeteriorationMonitor);

// v82 Monthly Trade — visibly compact collapsed Selection Portfolio bar; behavior/data unchanged. Display-only; Python snapshot remains canonical.
let monthlyTradeSelected='麒麟「現世」';

function renderMonthlyTrade(d){
  const root=document.getElementById('monthlyTradeContent'); if(!root)return;
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const perf=d.performance||{}, histories=perf.history||{};
  const preferred=['Frozen Core','Frozen v3.45','Frozen 4F','4F Attack75','4F Promotion100','麒麟「天界」','麒麟「現世」','SPY','TQQQ'];
  const strategies=preferred.filter(k=>Array.isArray(histories[k])&&histories[k].length);
  Object.keys(histories).forEach(k=>{if(Array.isArray(histories[k])&&histories[k].length&&!strategies.includes(k))strategies.push(k)});
  if(!strategies.includes(monthlyTradeSelected)) monthlyTradeSelected=strategies.includes('麒麟「現世」')?'麒麟「現世」':(strategies[0]||'麒麟「現世」');

  const hist=(histories[monthlyTradeSelected]||[]).slice().sort((a,b)=>String(b[0]).localeCompare(String(a[0])));
  const canonicalTrade=d.monthly_trade_history_by_strategy?.[monthlyTradeSelected] || 
    (monthlyTradeSelected==='麒麟「現世」' && Array.isArray(d.monthly_trade_history) ? d.monthly_trade_history : []);
  const tradeMap=new Map((canonicalTrade||[]).map(r=>[String(r.month||'').slice(0,7),r]));
  const currentMonth=String(d.month||'').slice(0,7);

  const monthLabel=x=>{
    const s=String(x||''), mm=s.match(/^(\d{4})-(\d{2})/);
    if(!mm)return E(s||'—');
    const names=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${names[Number(mm[2])-1]} ${mm[1]}`;
  };
  const positions=p=>{
    if(!p)return '—';
    if(typeof p==='string')return E(p);
    const vals=Object.values(p).map(Number).filter(Number.isFinite);
    const total=vals.reduce((a,b)=>a+b,0);
    const scale=total>0 && total<=1.000001 ? 100 : 1;
    return Object.entries(p).filter(([,v])=>Number(v)>0)
      .map(([k,v])=>`${E(k)} ${(Number(v)*scale).toFixed(1)}%`).join('<br>');
  };
  const ret=v=>{
    if(v===null||v===undefined||v===''||!Number.isFinite(Number(v)))return '—';
    const n=Number(v); return `${n>=0?'+':''}${n.toFixed(2)}%`;
  };

  const overlayMap=((d.monthly_trade_overlay_by_strategy||{})[monthlyTradeSelected])||{};
  const rows=hist.map(([mo,r])=>{
    const key=String(mo).slice(0,7), tr=tradeMap.get(key)||{};
    let pos=tr.position||tr.positions||tr.execution||null;
    let start=tr.position_start||tr.start||'—';
    if(key===currentMonth && monthlyTradeSelected==='麒麟「現世」' && !pos){
      pos=d.execution||null; start=d.execution_start||'—';
    }
    return {month:key, return_pct:r, position:pos, position_start:start, mtd:key===currentMonth,
      overlay:(overlayMap[key]||''),
      incomplete:(!pos || start==='—')};
  });

  root.innerHTML=`
    <div class="mt-topline"><div class="mt-asof">as of ${E(d.asof||d.updated_at||d.generated_at||'—')}</div></div>
    <details class="mt-strategy-wrap mt-perf-picker perf-picker perf-picker-fold">
      <summary class="perf-picker-summary mt-picker-summary">
        <span>Selection Portfolio</span>
        <span class="mt-selected-name">${E(monthlyTradeSelected)}</span>
      </summary>
      <div class="perf-picker-body mt-picker-body">
        <div class="perf-picker-title">Select Portfolio <span>1 selected</span></div>
        <div id="mtGroupTabs" class="perf-group-tabs"></div>
        <div id="mtGroupPanel" class="perf-group-panel mt-group-panel"></div>
      </div>
    </details>

    <div class="mt-history-head">
      <div><strong>Monthly Trade History</strong><span class="mt-count">(${rows.length} months)</span></div>
    </div>

    <div class="mt-table">
      <div class="mt-tr mt-th"><div>Month</div><div>Position<br>Start</div><div>Position</div><div>Return</div></div>
      ${rows.map(r=>{
        const neg=Number(r.return_pct)<0;
        return `<div class="mt-tr">
          <div class="mt-month">${monthLabel(r.month)}${r.mtd?'<span class="mt-mtd-badge">MTD</span>':''}${r.overlay?`<span class="mt-overlay-badge ${/^A-STATE/i.test(r.overlay)?'is-astate':/^PROMOTION100/i.test(r.overlay)?'is-promotion':/^BOOSTER/i.test(r.overlay)?'is-booster':'is-other'}">${E(r.overlay)}</span>`:''}</div>
          <div class="mt-start">${r.incomplete?'<span class="mt-missing">未収録</span>':E(r.position_start)}</div>
          <div class="mt-position">${r.incomplete?'<span class="mt-missing">正本データなし</span>':positions(r.position)}</div>
          <div class="mt-return ${neg?'neg':''}">${ret(r.return_pct)}</div>
        </div>`;
      }).join('')}
    </div>
    <p class="analytics-note mt-history-note">ReturnはPython正本の既存月次履歴を最古月まで表示。Position / Position Startは正本に履歴がある月だけ表示し、Fast側では推測・再計算しません。</p>
  `;

  const mtGroupMap={
    'All':strategies,
    'Frozen':strategies.filter(n=>/^Frozen /.test(n)),
    '4F':strategies.filter(n=>/^(Frozen 4F|4F )/.test(n)),
    'KIRIN':strategies.filter(n=>/麒麟/.test(n)),
    'Benchmark':strategies.filter(n=>['SPY','TQQQ'].includes(n)),
    'Seiryu':strategies.filter(n=>/^Seiryu /.test(n)),
    'Byakko':strategies.filter(n=>/^Byakko /.test(n)),
    'Suzaku':strategies.filter(n=>/^Suzaku /.test(n)),
    'Genbu':strategies.filter(n=>/^Genbu /.test(n))
  };
  Object.keys(mtGroupMap).forEach(k=>{if(!mtGroupMap[k].length)delete mtGroupMap[k]});
  let mtActiveGroup='All';
  const tabs=root.querySelector('#mtGroupTabs'),panel=root.querySelector('#mtGroupPanel');
  function renderMtGroups(){
    if(!tabs||!panel)return;
    tabs.innerHTML=Object.keys(mtGroupMap).map(k=>`<button type="button" class="perf-group-tab ${k===mtActiveGroup?'active':''}" data-group="${E(k)}">${E(k)}</button>`).join('');
    tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{mtActiveGroup=b.dataset.group;renderMtGroups()});
    panel.innerHTML=(mtGroupMap[mtActiveGroup]||[]).map(n=>`<button type="button" class="perf-group-item ${n===monthlyTradeSelected?'active':''}" data-name="${E(n)}">${E(n)}</button>`).join('');
    panel.querySelectorAll('button').forEach(b=>b.onclick=()=>{monthlyTradeSelected=b.dataset.name;renderMonthlyTrade(d)});
  }
  renderMtGroups();
}


/* v93 — robust floating selected-portfolio indicator + touch tooltip release fix. */
(()=>{
  const PAGE_PICKERS=[
    ['monthlyTrade','.mt-strategy-wrap'],
    ['summaryPage','.analytics-portfolio-fold'],
    ['metrics','.analytics-portfolio-fold'],
    ['monthlyReturns','.analytics-portfolio-fold'],
    ['drawdowns','.analytics-portfolio-fold'],
    ['rolling','.analytics-portfolio-fold']
  ];
  let floatBar=null, activePicker=null;
  const ensureBar=()=>{
    if(floatBar) return floatBar;
    floatBar=document.createElement('div');
    floatBar.id='v92PortfolioFloat';
    floatBar.className='v92-portfolio-float';
    floatBar.innerHTML='<span class="v92-float-label">Selection Portfolio</span><strong class="v92-float-name"></strong>';
    document.body.appendChild(floatBar);
    return floatBar;
  };
  const selectedName=p=>p?.querySelector('.analytics-selected-name,.mt-selected-name,.mt-picker-selected')?.textContent?.trim()
    || p?.querySelector('summary')?.textContent?.replace(/Selection Portfolio/ig,'').trim() || '';
  const current=()=>{
    for(const [id,sel] of PAGE_PICKERS){
      const page=document.getElementById(id); if(!page) continue;
      const cs=getComputedStyle(page); if(cs.display==='none'||page.hidden) continue;
      const p=page.querySelector(sel); if(p) return p;
    }
    return null;
  };
  const sync=()=>{
    const bar=ensureBar(), p=current(); activePicker=p;
    if(!p || p.open){bar.classList.remove('show');return}
    const r=p.getBoundingClientRect();
    const page=p.closest('.app-page,.analytics-page,.monthly-trade-page');
    const pr=page?.getBoundingClientRect();
    const passed=r.bottom<8;
    const stillInPage=!pr || pr.bottom>64;
    if(passed&&stillInPage){
      bar.querySelector('.v92-float-name').textContent=selectedName(p);
      bar.classList.add('show');
    }else bar.classList.remove('show');
  };
  let raf=0; const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()})};
  addEventListener('scroll',schedule,{passive:true}); addEventListener('resize',schedule,{passive:true});
  document.addEventListener('toggle',schedule,true);
  const mo=new MutationObserver(schedule); mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','hidden','open']});
  setTimeout(sync,0);

  const clearChartTips=()=>{
    const tip=document.getElementById('perfTooltip'); if(tip) tip.hidden=true;
    const cross=document.getElementById('perfCrosshair'); if(cross) cross.setAttribute('visibility','hidden');
    document.querySelectorAll('.dd-tip,.chart-tooltip,.analytics-tooltip,.perf-tooltip').forEach(el=>{el.hidden=true});
  };
  document.addEventListener('pointerup',clearChartTips,true);
  document.addEventListener('pointercancel',clearChartTips,true);
  document.addEventListener('touchend',clearChartTips,{capture:true,passive:true});
  document.addEventListener('touchcancel',clearChartTips,{capture:true,passive:true});
})();

// v117 — Deterioration Monitor: all Fast portfolios selectable, unlimited multi-select, fail-closed NOT AUDITED.
(function(){
 function initDeteriorationPicker(){
  const root=document.getElementById('deterioration'),mount=document.getElementById('detPortfolioPicker'); if(!root||!mount)return;
  const tbody=root.querySelector('.det-table tbody'); if(!tbody)return;
  const audited=['Bunshin','R181','ERC6','R255 Split'];
  const hist=window.__MY4F_SNAPSHOT__?.performance?.history||{};
  const allNames=[...new Set([...audited,...Object.keys(hist).filter(n=>Array.isArray(hist[n])&&hist[n].length)])];
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dot=v=>{const x=String(v||'').toUpperCase();return x.includes('ORANGE')||x.includes('DETERIORATING')?'🟠':x.includes('YELLOW')||x.includes('MIXED')?'🟡':x.includes('GREEN')||x.includes('GOOD')||x.includes('STRONG')?'🟢':'⚪'};
  const detail={
   'Bunshin':{status:'MIXED',cls:'mixed',g1:'YELLOW',g2:'GREEN',p:'MIXED / YELLOW',pb:'Strong / GREEN',note:'G1とPに注意信号。G2とp̄はGREENを維持。単独でstrategy failureを意味しない。'},
   'R181':{status:'DETERIORATING',cls:'bad',g1:'GREEN',g2:'GREEN',p:'DETERIORATING / ORANGE',pb:'Strong / GREEN',note:'Pのみ劣化警告。G1・G2・p̄はGREENを維持しており、P-only warningとして監視する。'},
   'ERC6':{status:'DETERIORATING',cls:'bad',g1:'GREEN',g2:'GREEN',p:'DETERIORATING / ORANGE',pb:'Strong / GREEN',note:'Pのみ劣化警告。G1・G2・p̄はGREENを維持しており、P-only warningとして監視する。'},
   'R255 Split':{status:'GOOD',cls:'good',g1:'GREEN',g2:'GREEN',p:'GOOD / GREEN',pb:'Strong / GREEN',note:'4軸すべてGREEN。Frozen Health-Dot snapshotでは明確な劣化警告なし。'}
  };
  [...tbody.querySelectorAll('tr[data-det-generated="1"]')].forEach(x=>x.remove());
  allNames.filter(n=>!detail[n]).forEach(n=>tbody.insertAdjacentHTML('beforeend',`<tr data-det-generated="1" data-det-group="unaudited" data-det-name="${E(n)}" data-det-status="Not Audited" tabindex="0"><td>${E(n)}</td><td><i class="det-dot na" title="NOT AUDITED"></i></td><td><i class="det-dot na" title="NOT AUDITED"></i></td><td><i class="det-dot na" title="NOT AUDITED"></i></td><td><i class="det-dot na" title="NOT AUDITED"></i></td></tr>`));
  const rows=[...tbody.querySelectorAll('tr')];
  const prior=window.__MY4F_DET_SELECTED__;
  const selected=new Set(prior instanceof Set?[...prior].filter(n=>allNames.includes(n)):allNames);
  window.__MY4F_DET_SELECTED__=selected;
  mount.innerHTML=`<details class="analytics-portfolio-fold perf-picker perf-picker-fold" data-picker="deteriorationPicker"><summary class="analytics-picker-summary"><span>Selection Portfolio</span><span class="analytics-selected-name"></span></summary><div class="perf-picker-body analytics-picker-body"><div class="perf-picker-title">Select Portfolio <span class="det-selected-count"></span></div><div class="perf-group-tabs analytics-picker-tabs"></div><div class="perf-group-panel analytics-picker-panel"></div></div></details>`;
  const wrap=mount.querySelector('[data-picker="deteriorationPicker"]'),panel=wrap.querySelector('.analytics-picker-panel'),tabs=wrap.querySelector('.analytics-picker-tabs'),label=wrap.querySelector('.analytics-selected-name'),count=wrap.querySelector('.det-selected-count');
  const groups=portfolioFoldGroups(allNames); groups['Health Audit']=audited;
  let active='All';
  const showDetail=name=>{const d=detail[name],box=root.querySelector('#detDetail');if(!box)return;if(!d){box.innerHTML=`<div class="det-detail-kicker">CURRENT HEALTH</div><div class="det-detail-head"><h3>${E(name)}</h3><span class="det-status na">NOT AUDITED</span></div><div class="det-axis-values"><span><b>G1</b><em>⚪</em><strong>NOT AUDITED</strong></span><span><b>G2</b><em>⚪</em><strong>NOT AUDITED</strong></span><span><b>P</b><em>⚪</em><strong>NOT AUDITED</strong></span><span><b>p̄</b><em>⚪</em><strong>NOT AUDITED</strong></span></div><p>Canonical Strategy Healthデータ未監査のため推定しません。FAIL-CLOSEDで表示しています。</p>`;return;}box.innerHTML=`<div class="det-detail-kicker">CURRENT HEALTH</div><div class="det-detail-head"><h3>${E(name)}</h3><span class="det-status ${E(d.cls)}">${E(d.status)}</span></div><div class="det-axis-values"><span><b>G1</b><em>${dot(d.g1)}</em><strong>${E(d.g1)}</strong></span><span><b>G2</b><em>${dot(d.g2)}</em><strong>${E(d.g2)}</strong></span><span><b>P</b><em>${dot(d.p)}</em><strong>${E(d.p)}</strong></span><span><b>p̄</b><em>${dot(d.pb)}</em><strong>${E(d.pb)}</strong></span></div><p>${E(d.note)}</p>`;};
  const apply=()=>{rows.forEach(r=>{const n=r.dataset.detName||r.cells?.[0]?.textContent?.trim();r.hidden=!selected.has(n);r.classList.remove('selected');});const n=selected.size;label.textContent=n===allNames.length?'All Portfolios':n===1?[...selected][0]:`${n} Portfolios`;count.textContent=`${n} selected`;if(n===1)showDetail([...selected][0]);else{const box=root.querySelector('#detDetail');if(box)box.innerHTML=`<div class="det-detail-kicker">CURRENT HEALTH</div><h3>${n===0?'No Portfolio Selected':`${n} Portfolios Selected`}</h3><p>${n===0?'Selection Portfolioから1つ以上選択してください。':'Portfolio Tableで行をタップすると、そのPortfolioの4軸詳細を表示します。'}</p>`;}};
  const draw=()=>{tabs.innerHTML=Object.keys(groups).map(k=>`<button type="button" class="perf-group-tab ${k===active?'active':''}" data-group="${E(k)}">${E(k)}</button>`).join('');tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{active=b.dataset.group;draw()});panel.innerHTML=(groups[active]||[]).map(n=>`<button type="button" class="perf-group-item ${selected.has(n)?'active':''}" data-name="${E(n)}"><span>${E(n)}</span><span class="det-check">${selected.has(n)?'✓':''}</span></button>`).join('');panel.querySelectorAll('button').forEach(b=>b.onclick=()=>{const n=b.dataset.name;if(selected.has(n))selected.delete(n);else selected.add(n);window.__MY4F_DET_SELECTED__=selected;draw();apply();});};
  rows.forEach(r=>{const pick=()=>{const n=r.dataset.detName||r.cells?.[0]?.textContent?.trim();showDetail(n);rows.forEach(x=>x.classList.toggle('selected',x===r));};r.onclick=pick;r.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}};});
  draw();apply();
 }
 window.__refreshDeteriorationPicker=initDeteriorationPicker;
 initDeteriorationPicker();
})();
