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
 renderResearchPerformance(d.performance);
 renderFastAnalytics(d);
  document.getElementById('months').innerHTML=(d.returns||[]).map(x=>`<article class="month"><div class="monthTop"><span>${esc(x[0])}</span><span class="badge ${x[1]=='A-STATE'?'a':String(x[1]).includes('BOOSTER')?'b':''}">${esc(x[1])}</span></div><div class="return-scroll"><div class="row k"><span class="lab">麒麟</span><span class="name">天界</span><strong>${pct(x[2])}</strong><span class="name">現世</span><strong>${pct(x[3])}</strong></div><div class="row"><span class="lab">BM</span><span class="name">SPY</span><strong>${pct(x[4])}</strong><span class="name">TQQQ</span><strong>${pct(x[5])}</strong></div></div></article>`).join('');
  renderMonthlyReturnsPage(d,FAST_BM);
}).catch(e=>document.body.insertAdjacentHTML('afterbegin',`<div style="padding:10px;background:#ffecec;color:#a00;font:12px sans-serif">Snapshot load error: ${esc(e.message)}</div>`));

let FAST_BM='SPY';
function bmSwitch(id,current,onChange){
 const el=document.getElementById(id); if(!el)return;
 el.innerHTML=`<div class="bm-switch"><span>BM</span><button type="button" data-bm="SPY" class="${current==='SPY'?'active':''}">SPY</button><button type="button" data-bm="TQQQ" class="${current==='TQQQ'?'active':''}">TQQQ</button></div>`;
 el.querySelectorAll('button').forEach(b=>b.onclick=()=>{FAST_BM=b.dataset.bm;onChange(FAST_BM);});
}
function renderMonthlyReturnsPage(d,bm='SPY'){
 const root=document.getElementById('monthlyReturnsPage');if(!root)return;
 const rr=d?.returns||[],bi=bm==='TQQQ'?5:4;
 const cell=v=>Number.isFinite(Number(v))?`<span class="${Number(v)>=0?'ret-pos':'ret-neg'}">${pct(Number(v))}</span>`:'—';
 root.innerHTML=`<div id="monthlyBmSwitch"></div><div class="monthly-compare-head"><span>Strategy</span><b>麒麟「現世」</b><span class="bm-pill">BM: ${bm}</span></div><div class="analytics-table-scroll"><table class="analytics-table monthly-compare-table"><thead><tr><th>Month</th><th>現世</th><th>${bm}</th><th>差</th></tr></thead><tbody>${rr.map(x=>{const s=Number(x[3]),bv=Number(x[bi]),dif=(Number.isFinite(s)&&Number.isFinite(bv))?s-bv:null;return`<tr><td>${esc(x[0])}</td><td>${cell(s)}</td><td>${cell(bv)}</td><td>${dif==null?'—':cell(dif)}</td></tr>`}).join('')}</tbody></table></div>`;
 bmSwitch('monthlyBmSwitch',bm,next=>{FAST_BM=next;renderMonthlyReturnsPage(d,next);renderFastAnalytics(d,next);});
}

// Fast v4.5 — Research Performance. Display only; all source returns/metrics come from Python snapshot.
function renderResearchPerformance(p){
 if(!p||!Array.isArray(p.series)||!p.series.length)return;
 const rows=p.series,hist=p.history||{},defaults=['Frozen Core','Frozen v3.45','Frozen 4F'];
 let selected=new Set(defaults.filter(x=>hist[x]));if(!selected.size)selected=new Set(rows.slice(0,3).map(x=>x.name));
 let period='ALL',logScale=true,periodMode='COMMON',startYear='ALL',activeGroup='All';
 const groupMap={
   'All': rows.map(r=>r.name),
   'Frozen': rows.filter(r=>/^Frozen /.test(r.name)).map(r=>r.name),
   '4F': rows.filter(r=>/^(Frozen 4F|4F )/.test(r.name)).map(r=>r.name),
   'KIRIN': rows.filter(r=>/麒麟/.test(r.name)).map(r=>r.name),
   'Benchmark': rows.filter(r=>['SPY','TQQQ'].includes(r.name)).map(r=>r.name)
 };
 Object.keys(groupMap).forEach(k=>{if(!groupMap[k].length)delete groupMap[k]});
 const fmt=(x,d=2)=>x==null||!Number.isFinite(Number(x))?'—':Number(x).toFixed(d),pp=x=>x==null||!Number.isFinite(Number(x))?'—':`${Number(x)>=0?'+':''}${Number(x).toFixed(2)}%`;
 const chips=document.getElementById('perfChips'),cards=document.getElementById('perfCards'),table=document.getElementById('perfTable'),meta=document.getElementById('perfMeta'),periods=document.getElementById('perfPeriods'),logBtn=document.getElementById('perfLogToggle'),linBtn=document.getElementById('perfLinearToggle'),commonBtn=document.getElementById('perfCommon'),fullBtn=document.getElementById('perfFull'),returns=document.getElementById('perfPeriodReturns'),
 groupTabs=document.getElementById('perfGroupTabs'),groupPanel=document.getElementById('perfGroupPanel'),startSel=document.getElementById('perfStartYear');
 const allMonths=[...new Set(Object.values(hist).flatMap(a=>(a||[]).map(x=>x[0])))].sort();
 const years=[...new Set(allMonths.map(m=>String(m).slice(0,4)))].sort((a,b)=>Number(b)-Number(a));
 if(startSel){
   startSel.innerHTML='<option value="ALL">ALL</option>'+years.map(y=>`<option value="${y}">${y}</option>`).join('');
   startSel.value='ALL';
   startSel.addEventListener('change',()=>{
     startYear=startSel.value;
     draw();
   });
 }
 function renderGroups(){
   if(!groupTabs||!groupPanel)return;
   groupTabs.innerHTML=Object.keys(groupMap).map(k=>`<button type="button" class="perf-group-tab ${k===activeGroup?'active':''}" data-group="${esc(k)}">${esc(k)}</button>`).join('');
   groupTabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{activeGroup=b.dataset.group;renderGroups()});
   const members=groupMap[activeGroup]||[];
   groupPanel.innerHTML=members.map(n=>`<button type="button" class="perf-group-item ${selected.has(n)?'active':''}" data-name="${esc(n)}">${esc(n)}</button>`).join('');
   groupPanel.querySelectorAll('button').forEach(b=>b.onclick=()=>{const n=b.dataset.name;if(selected.has(n)){if(selected.size>1)selected.delete(n)}else if(selected.size<4)selected.add(n);draw();renderGroups()});
 }
 renderGroups();
 periods?.querySelectorAll('.perf-period').forEach(b=>b.addEventListener('click',()=>{
   period=b.dataset.period||'ALL';
   draw();
 }));
 logBtn?.addEventListener('click',()=>{logScale=true;draw()});linBtn?.addEventListener('click',()=>{logScale=false;draw()});
 commonBtn?.addEventListener('click',()=>{periodMode='COMMON';draw()});fullBtn?.addEventListener('click',()=>{periodMode='FULL';draw()});
 function draw(){
  chips.innerHTML=rows.map(r=>`<button class="perf-chip ${selected.has(r.name)?'active':''}" data-name="${esc(r.name)}">${esc(r.name)}</button>`).join('');
  chips.querySelectorAll('button').forEach(b=>b.onclick=()=>{const n=b.dataset.name;if(selected.has(n)){if(selected.size>1)selected.delete(n)}else if(selected.size<4)selected.add(n);draw()});
  periods?.querySelectorAll('.perf-period').forEach(x=>x.classList.toggle('active',x.dataset.period===period));if(startSel&&startSel.value!==startYear)startSel.value=startYear;logBtn?.classList.toggle('active',logScale);linBtn?.classList.toggle('active',!logScale);commonBtn?.classList.toggle('active',periodMode==='COMMON');fullBtn?.classList.toggle('active',periodMode==='FULL');
  const sr=rows.filter(r=>selected.has(r.name));cards.innerHTML=sr.map(r=>`<div class="perf-card"><div class="perf-name">${esc(r.name)}</div><div class="perf-metrics"><div class="perf-metric"><span>CAGR</span><b>${pp(r.cagr)}</b></div><div class="perf-metric"><span>Sortino</span><b>${fmt(r.sortino,3)}</b></div><div class="perf-metric"><span>MaxDD</span><b>${pp(r.maxdd)}</b></div><div class="perf-metric"><span>Sharpe</span><b>${fmt(r.sharpe,3)}</b></div><div class="perf-metric"><span>Calmar</span><b>${fmt(r.calmar,3)}</b></div><div class="perf-metric"><span>Months</span><b>${r.months}</b></div></div></div>`).join('');
  const info=renderPerfChart([...selected],hist,period,logScale,periodMode,startYear);meta.textContent=info?`Chart period: ${info.start} → ${info.end} ｜ ${period} ｜ From ${startYear} ｜ ${logScale?'LOG':'LINEAR'} ｜ ${periodMode==='COMMON'?'Common':'Full'} ｜ metrics below = full history`:'表示可能な履歴なし';
  if(returns)returns.innerHTML=info?info.returns.map((r,i)=>`<div class="perf-return-item"><span class="perf-dot" style="--dot:${info.colors[i]}"></span><b>${esc(r.name)}</b><strong>${r.value>=0?'+':''}${r.value.toFixed(1)}%</strong></div>`).join(''):'';
 }
 table.innerHTML=`<table class="perf-table"><thead><tr><th>Series</th><th>CAGR</th><th>Sortino</th><th>MaxDD</th><th>Calmar</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${pp(r.cagr)}</td><td>${fmt(r.sortino,2)}</td><td>${pp(r.maxdd)}</td><td>${fmt(r.calmar,2)}</td></tr>`).join('')}</tbody></table>`;draw();
}
function renderPerfChart(names,hist,period='ALL',logScale=true,periodMode='COMMON',startYear='ALL'){
 const box=document.getElementById('perfChart');if(!box)return null;const palette=['#12a8df','#0a9b72','#8da0b8','#7b1fa2'];
 const maps=names.map(n=>[n,new Map((hist[n]||[]).map(x=>[x[0],Number(x[1])/100]))]).filter(x=>x[1].size);if(!maps.length)return null;
 let months=periodMode==='COMMON'?[...maps[0][1].keys()].filter(m=>maps.every(x=>x[1].has(m))).sort():[...new Set(maps.flatMap(x=>[...x[1].keys()]))].sort();
 const count={'1Y':12,'2Y':24,'3Y':36,'5Y':60,'10Y':120}[period];
 if(startYear!=='ALL'){
   months=months.filter(m=>String(m).slice(0,4)>=String(startYear));
   if(count&&months.length>count) months=months.slice(0,count);
 }else if(count&&months.length>count){
   months=months.slice(-count);
 }
 if(months.length<2)return null;
 const vals={};names.forEach(n=>{const mp=maps.find(x=>x[0]===n)?.[1];if(!mp)return;let w=100,started=false;vals[n]=months.map(m=>{if(!mp.has(m))return null;if(!started){started=true;return 100}w*=1+(Number.isFinite(mp.get(m))?mp.get(m):0);return w})});
 const all=Object.values(vals).flat().filter(v=>Number.isFinite(v)&&(!logScale||v>0));if(!all.length)return null;
 const rawLo=Math.min(...all),rawHi=Math.max(...all),tx=v=>logScale?Math.log(v):v,lo=tx(rawLo),hi=tx(rawHi),W=680,H=300,L=52,R=12,T=18,B=34,pw=W-L-R,ph=H-T-B,y=v=>T+(hi-tx(v))/(hi-lo||1)*ph,x=i=>L+i/(months.length-1)*pw;
 let g=`<svg viewBox="0 0 ${W} ${H}" role="img">`;[0,.25,.5,.75,1].forEach(q=>{const z=lo+(hi-lo)*q,v=logScale?Math.exp(z):z,yy=T+(1-q)*ph;g+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="#e8edf2"/><text x="${L-6}" y="${yy+3}" text-anchor="end" font-size="9" fill="#728096">${logScale?(v/100).toFixed(v<100?2:1)+'×':Math.round(v)}</text>`});g+=`<text x="${L}" y="${H-8}" font-size="10" fill="#728096">${months[0]}</text><text x="${W-R}" y="${H-8}" text-anchor="end" font-size="10" fill="#728096">${months.at(-1)}</text>`;
 names.forEach((n,j)=>{let seg=[];const flush=()=>{if(seg.length>1)g+=`<polyline points="${seg.join(' ')}" fill="none" stroke="${palette[j%4]}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;seg=[]};(vals[n]||[]).forEach((v,i)=>Number.isFinite(v)?seg.push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`):flush());flush()});
 g+=`<line id="perfCrosshair" x1="${L}" y1="${T}" x2="${L}" y2="${T+ph}" stroke="#9aa7b8" stroke-dasharray="3 3" visibility="hidden"/><rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/></svg><div id="perfTooltip" class="perf-tooltip" hidden></div>`;box.innerHTML=g;
 const svg=box.querySelector('svg'),tip=box.querySelector('#perfTooltip'),cross=box.querySelector('#perfCrosshair');
 const showAt=cx=>{const r=svg.getBoundingClientRect(),px=Math.max(0,Math.min(r.width,cx-r.left));let i=Math.round(((px/r.width*W)-L)/pw*(months.length-1));i=Math.max(0,Math.min(months.length-1,i));const rr=names.map((n,j)=>{const v=vals[n]?.[i];return Number.isFinite(v)?`<div><span class="perf-dot" style="--dot:${palette[j%4]}"></span><b>${esc(n)}</b><strong>${v-100>=0?'+':''}${(v-100).toFixed(1)}%</strong></div>`:''}).join('');if(!rr)return;const xx=x(i);cross.setAttribute('x1',xx);cross.setAttribute('x2',xx);cross.setAttribute('visibility','visible');tip.innerHTML=`<div class="perf-tip-date">${months[i]}</div>${rr}`;tip.hidden=false;tip.style.left=Math.max(8,Math.min(box.clientWidth-tip.offsetWidth-8,px-tip.offsetWidth/2))+'px';tip.style.top='42px'};
 svg.addEventListener('pointerdown',e=>{svg.setPointerCapture?.(e.pointerId);showAt(e.clientX)});svg.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)showAt(e.clientX)});svg.addEventListener('click',e=>showAt(e.clientX));
 const returns=names.map(n=>{const a=(vals[n]||[]).filter(Number.isFinite);return{name:n,value:a.length?(a.at(-1)/a[0]-1)*100:0}});return{start:months[0],end:months.at(-1),returns,colors:names.map((_,i)=>palette[i%4])};
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
 const metricCols=[['name','Series'],['cagr','CAGR'],['sortino','Sortino'],['sharpe','Sharpe'],['maxdd','MaxDD'],['calmar','Calmar'],['vol','Vol'],['months','Months']];
 let metricSort={key:'name',dir:1};
 function metricValue(s,k){return k==='name'?String(s.name??''):Number(s[k]);}
 function drawMetrics(){
   if(!mt)return;
   const rows=[...ss].sort((a,b)=>{const av=metricValue(a,metricSort.key),bv=metricValue(b,metricSort.key);return metricSort.dir*(typeof av==='string'?av.localeCompare(bv,'ja'):(av-bv));});
   const val=(s,k)=>k==='name'?E(s.name):(['cagr','maxdd','vol'].includes(k)?fmt(s[k]):(['sortino','sharpe','calmar'].includes(k)?(Number.isFinite(Number(s[k]))?Number(s[k]).toFixed(2):'—'):(s[k]??'—')));
   mt.innerHTML=`<div class="analytics-table-scroll"><table class="analytics-table metrics-table"><thead><tr>${metricCols.map(([k,l])=>`<th><button type="button" class="metric-sort ${metricSort.key===k?'active':''}" data-key="${k}">${l}<span>${metricSort.key===k?(metricSort.dir>0?'▲':'▼'):'↕'}</span></button></th>`).join('')}</tr></thead><tbody>${rows.map(s=>`<tr>${metricCols.map(([k])=>`<td>${val(s,k)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
   mt.querySelectorAll('.metric-sort').forEach(b=>b.onclick=()=>{const k=b.dataset.key;if(metricSort.key===k)metricSort.dir*=-1;else metricSort={key:k,dir:k==='name'?1:-1};drawMetrics();});
 }
 drawMetrics();
 function chart(rows){if(!rows?.length)return'<div class="analytics-empty">データなし</div>';const vs=rows.map(x=>+x[1]),mn=Math.min(0,...vs),mx=Math.max(0,...vs),W=720,H=250,L=48,R=12,T=14,B=28,n=rows.length,span=(mx-mn)||1,pts=rows.map((r,i)=>`${L+(W-L-R)*i/Math.max(1,n-1)},${T+(H-T-B)*(1-(+r[1]-mn)/span)}`).join(' '),zy=T+(H-T-B)*(1-(0-mn)/span);return`<svg viewBox="0 0 ${W} ${H}" class="analytics-svg"><line x1="${L}" x2="${W-R}" y1="${zy}" y2="${zy}" class="zero"/><polyline points="${pts}" class="aline"/><text x="${L}" y="${H-7}">${E(rows[0][0])}</text><text x="${W-R}" y="${H-7}" text-anchor="end">${E(rows[n-1][0])}</text></svg>`}
 function bind(root,fn){if(!root)return;root.innerHTML=pick(root.id);const body=root.querySelector(`#${root.id}Body`),bs=[...root.querySelectorAll('button')],go=n=>{bs.forEach(b=>b.classList.toggle('active',b.dataset.series===n));fn(n,body)};bs.forEach(b=>b.onclick=()=>go(b.dataset.series));if(names[0])go(names[0])}
 bind(document.getElementById('rollingPage'),(n,b)=>{
   const r=a[n]?.rolling||{},bm=a[bmName]?.rolling||{};
   const periods=['12','36','60'];
   b.innerHTML='<div id="rollingBmSwitch"></div><div id="rollingBmBody"></div>';
   bmSwitch('rollingBmSwitch',bmName,next=>{FAST_BM=next;renderMonthlyReturnsPage(window.__MY4F_SNAPSHOT__,next);renderFastAnalytics(window.__MY4F_SNAPSHOT__,next);});
   const rollBody=b.querySelector('#rollingBmBody');
   const stat=(x,k)=>x?.[k];
   const statRow=(lab,key)=>`<tr><td>${lab}</td><td>${fmt(stat(r,key))}</td><td>${fmt(stat(bm,key))}</td></tr>`;
   rollBody.innerHTML=periods.filter(k=>r[k]).map(k=>{
     const x=r[k],y=bm[k],lab=k==='12'?'1Y':k==='36'?'3Y':'5Y';
     const rows=x.history||[], bmMap=new Map((y?.history||[]).map(z=>[z[0],z[1]]));
     const both=rows.map(z=>[z[0],z[1],bmMap.get(z[0])]).filter(z=>Number.isFinite(Number(z[1])));
     const compChart=compareChart(both,n,bmName);
     return`<div class="rolling-block bm-compare"><div class="rolling-title-row"><h3>${lab}</h3><span class="bm-pill">BM: ${bmName}</span></div><div class="analytics-table-scroll"><table class="analytics-table rolling-compare-table"><thead><tr><th>Statistic</th><th>${E(n)}</th><th>${E(bmName)}</th></tr></thead><tbody>${statRow('Current','current')}${statRow('Median','median')}${statRow('P10','p10')}<tr><td>Min</td><td>${fmt(x.min)}</td><td>${fmt(y?.min)}</td></tr><tr><td>Positive</td><td>${Number.isFinite(+x.positive_rate)?(+x.positive_rate).toFixed(1)+'%':'—'}</td><td>${Number.isFinite(+y?.positive_rate)?(+y.positive_rate).toFixed(1)+'%':'—'}</td></tr></tbody></table></div>${compChart}</div>`;
   }).join('');
 });
 function compareChart(rows,mainName,bmName){
   if(!rows?.length)return'<div class="analytics-empty">データなし</div>';
   const all=rows.flatMap(x=>[Number(x[1]),Number(x[2])]).filter(Number.isFinite);
   if(!all.length)return'<div class="analytics-empty">データなし</div>';
   const mn=Math.min(0,...all),mx=Math.max(0,...all),W=720,H=250,L=48,R=12,T=14,B=28,n=rows.length,span=(mx-mn)||1;
   const X=i=>L+(W-L-R)*i/Math.max(1,n-1),Y=v=>T+(H-T-B)*(1-(v-mn)/span),zero=Y(0);
   const line=col=>{let seg=[],s='';const flush=()=>{if(seg.length>1)s+=`<polyline points="${seg.join(' ')}" class="${col}"/>`;seg=[]};rows.forEach((r,i)=>{const v=Number(r[col==='main-line'?1:2]);Number.isFinite(v)?seg.push(`${X(i)},${Y(v)}`):flush()});flush();return s};
   return`<div class="compare-chart-wrap"><svg viewBox="0 0 ${W} ${H}" class="analytics-svg compare-svg"><line x1="${L}" x2="${W-R}" y1="${zero}" y2="${zero}" class="zero"/>${line('main-line')}${line('bm-line')}<text x="${L}" y="${H-7}">${E(rows[0][0])}</text><text x="${W-R}" y="${H-7}" text-anchor="end">${E(rows.at(-1)[0])}</text></svg><div class="compare-legend"><span class="main-key">${E(mainName)}</span><span class="bm-key">${E(bmName)}</span></div></div>`;
 }
 bind(document.getElementById('drawdownsPage'),(n,b)=>{const r=a[n]?.drawdown||[],w=r.length?Math.min(...r.map(x=>+x[1])):null;b.innerHTML=`<div class="analytics-kpis"><div><small>Worst</small><b>${fmt(w)}</b></div></div>${chart(r)}`});
 bind(document.getElementById('annualPage'),(n,b)=>{const r=a[n]?.annual||[];b.innerHTML=`<div class="analytics-table-scroll"><table class="analytics-table annual-table"><thead><tr><th>Year</th><th>${E(n)}</th></tr></thead><tbody>${[...r].reverse().map(x=>`<tr><td>${E(x[0])}</td><td class="${Number(x[1])>=0?'ret-pos':'ret-neg'}">${fmt(x[1])}</td></tr>`).join('')}</tbody></table></div>`});
}

// Fast v5 menu / section navigation
document.addEventListener('DOMContentLoaded',()=>{
 const btn=document.getElementById('fastMenuButton'),menu=document.getElementById('fastMenu'),back=document.getElementById('fastMenuBackdrop'),close=document.getElementById('fastMenuClose');
 if(!btn||!menu||!back)return;
 const openMenu=()=>{menu.classList.add('open');menu.setAttribute('aria-hidden','false');back.hidden=false;requestAnimationFrame(()=>back.classList.add('show'));btn.setAttribute('aria-expanded','true');document.body.classList.add('menu-open')};
 const closeMenu=()=>{menu.classList.remove('open');menu.setAttribute('aria-hidden','true');back.classList.remove('show');btn.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');setTimeout(()=>{if(!menu.classList.contains('open'))back.hidden=true},180)};

 const pageIds=['performance','metrics','monthlyReturns','rolling','drawdowns','annual','specification'];
 const allPages=()=>pageIds.map(id=>document.getElementById(id)).filter(Boolean);
 const dashboardNodes=()=>[...document.querySelectorAll('main > section:not(.app-page):not(.analytics-shell), main > .dashboard-only')];
 function showFastPage(id){
   const dashboard=id==='top'||id==='allocation'||id==='forward';
   allPages().forEach(el=>el.classList.toggle('page-active',!dashboard&&el.id===id));
   document.querySelectorAll('.analytics-shell').forEach(el=>el.style.display=dashboard?'none':'contents');
   dashboardNodes().forEach(el=>el.style.display=dashboard?'':'none');
   const perf=document.getElementById('performance'); if(perf&&!dashboard)perf.style.display=id==='performance'?'':'none';
   allPages().forEach(el=>{if(!dashboard)el.style.display=el.id===id?'':'none';});
   document.querySelector('header').style.display=dashboard?'':'none';
   document.querySelector('footer').style.display=dashboard?'':'none';
   window.scrollTo({top:0,behavior:'smooth'});
 }
 window.showFastPage=showFastPage;
 showFastPage('top');
 btn.addEventListener('click',openMenu);close?.addEventListener('click',closeMenu);back.addEventListener('click',closeMenu);
 menu.querySelectorAll('[data-target]').forEach(x=>x.addEventListener('click',()=>{
   const id=x.dataset.target;closeMenu();
   setTimeout(()=>{showFastPage(id);if(id)history.replaceState(null,'','#'+id)},80);
 }));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
});
