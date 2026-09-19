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
 document.getElementById('health').innerHTML=['G1','G2','P'].map((x,i)=>`<div class="card"><span class="label">${x}</span><i class="dot ${d.health?.[i]||'green'}"></i><small>${['long-term','erosion','overall'][i]}</small></div>`).join('');
 donut('exec',d.execution||{},'現世');donut('gods',d.gods||{},'天界');
 document.getElementById('risk').innerHTML=Object.entries(d.risk||{}).map(([k,v])=>`<div class="card"><span class="label">${esc(k)}</span><b class="${String(v).includes('ON')?'on':'off'}">● ${esc(v)}</b></div>`).join('');
 document.getElementById('signals').innerHTML=(d.signals||[]).map(([k,v])=>`<div class="card"><span class="label">${esc(k)}</span><b class="${['ACTIVE','NORMAL','FROZEN','REAL FORWARD','—'].includes(v)?'purple':''}">${esc(v)}</b></div>`).join('');
 const sm=[['最新 '+m+' MTD*',...(d.summary?.mtd||[])],['前月 '+prev,...(d.summary?.prev||[])],[m.slice(0,4)+' YTD*',...(d.summary?.ytd||[])]];
 document.getElementById('summary').innerHTML=sm.map(x=>`<div class="sum"><span class="title">${esc(x[0])}</span><p>天界 <b>${pct(x[1])}</b></p><p>現世 <b>${pct(x[2])}</b></p></div>`).join('');
 const by=d.benchmarks?.ytd||{};
 document.getElementById('bm').innerHTML=`<b>BM</b><span>SPY YTD<strong>${pct(by.SPY)}</strong></span><span>TQQQ YTD<strong>${pct(by.TQQQ)}</strong></span>`;
 renderResearchPerformance(d.performance);
  document.getElementById('months').innerHTML=(d.returns||[]).map(x=>`<article class="month"><div class="monthTop"><span>${esc(x[0])}</span><span class="badge ${x[1]=='A-STATE'?'a':String(x[1]).includes('BOOSTER')?'b':''}">${esc(x[1])}</span></div><div class="return-scroll"><div class="row k"><span class="lab">麒麟</span><span class="name">天界</span><strong>${pct(x[2])}</strong><span class="name">現世</span><strong>${pct(x[3])}</strong></div><div class="row"><span class="lab">BM</span><span class="name">SPY</span><strong>${pct(x[4])}</strong><span class="name">TQQQ</span><strong>${pct(x[5])}</strong></div></div></article>`).join('');
}).catch(e=>document.body.insertAdjacentHTML('afterbegin',`<div style="padding:10px;background:#ffecec;color:#a00;font:12px sans-serif">Snapshot load error: ${esc(e.message)}</div>`));
// Fast v4.5 — Research Performance. Display only; all source returns/metrics come from Python snapshot.
function renderResearchPerformance(p){
 if(!p||!Array.isArray(p.series)||!p.series.length)return;
 const rows=p.series, hist=p.history||{};
 const defaults=['Frozen Core','Frozen v3.45','Frozen 4F'];
 let selected=new Set(defaults.filter(x=>hist[x]));
 if(!selected.size) selected=new Set(rows.slice(0,Math.min(3,rows.length)).map(x=>x.name));
 let period='ALL', logScale=false;
 const fmt=(x,d=2)=>x==null||!Number.isFinite(Number(x))?'—':Number(x).toFixed(d);
 const pp=x=>x==null||!Number.isFinite(Number(x))?'—':`${Number(x)>=0?'+':''}${Number(x).toFixed(2)}%`;
 const chips=document.getElementById('perfChips'), cards=document.getElementById('perfCards'), table=document.getElementById('perfTable'), meta=document.getElementById('perfMeta');
 const periods=document.getElementById('perfPeriods'), logBtn=document.getElementById('perfLogToggle');
 const periodDefs=[['1Y',12],['2Y',24],['5Y',60],['10Y',120],['ALL',null]];
 if(periods) periods.innerHTML=periodDefs.map(([k])=>`<button type="button" class="perf-period ${k===period?'active':''}" data-period="${k}">${k==='ALL'?'ALL':k}</button>`).join('');
 if(periods) periods.querySelectorAll('button').forEach(b=>b.onclick=()=>{period=b.dataset.period;periods.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.period===period));draw()});
 if(logBtn){logBtn.textContent='LOG OFF';logBtn.onclick=()=>{logScale=!logScale;logBtn.classList.toggle('active',logScale);logBtn.setAttribute('aria-pressed',String(logScale));logBtn.textContent=logScale?'LOG ON':'LOG OFF';draw()}}
 function draw(){
   chips.innerHTML=rows.map(r=>`<button class="perf-chip ${selected.has(r.name)?'active':''}" data-name="${esc(r.name)}">${esc(r.name)}</button>`).join('');
   chips.querySelectorAll('button').forEach(b=>b.onclick=()=>{const n=b.dataset.name;if(selected.has(n)){if(selected.size>1)selected.delete(n)}else if(selected.size<4)selected.add(n);draw()});
   const sr=rows.filter(r=>selected.has(r.name));
   cards.innerHTML=sr.map(r=>`<div class="perf-card"><div class="perf-name">${esc(r.name)}</div><div class="perf-metrics"><div class="perf-metric"><span>CAGR</span><b>${pp(r.cagr)}</b></div><div class="perf-metric"><span>Sortino</span><b>${fmt(r.sortino,3)}</b></div><div class="perf-metric"><span>MaxDD</span><b>${pp(r.maxdd)}</b></div><div class="perf-metric"><span>Sharpe</span><b>${fmt(r.sharpe,3)}</b></div><div class="perf-metric"><span>Calmar</span><b>${fmt(r.calmar,3)}</b></div><div class="perf-metric"><span>Months</span><b>${r.months}</b></div></div></div>`).join('');
   const info=renderPerfChart([...selected],hist,period,logScale);
   meta.textContent=info?`Chart period: ${info.start} → ${info.end} (${info.months} months) ｜ ${period} ｜ ${logScale?'LOG':'LINEAR'} ｜ metrics below = full history ｜ tap up to 4 series`:'共通期間なし';
 }
 table.innerHTML=`<table class="perf-table"><thead><tr><th>Series</th><th>CAGR</th><th>Sortino</th><th>MaxDD</th><th>Calmar</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${pp(r.cagr)}</td><td>${fmt(r.sortino,2)}</td><td>${pp(r.maxdd)}</td><td>${fmt(r.calmar,2)}</td></tr>`).join('')}</tbody></table>`;
 draw();
}
function renderPerfChart(names,hist,period='ALL',logScale=false){
 const box=document.getElementById('perfChart'); if(!box)return null;
 const maps=names.map(n=>[n,new Map((hist[n]||[]).map(x=>[x[0],Number(x[1])/100]))]);
 if(!maps.length){box.innerHTML='';return null}
 let months=[...maps[0][1].keys()].filter(m=>maps.every(x=>x[1].has(m))).sort();
 const count={ '1Y':12,'2Y':24,'5Y':60,'10Y':120 }[period];
 if(count && months.length>count) months=months.slice(-count);
 if(months.length<2){box.innerHTML='<div class="muted">共通履歴なし</div>';return null}
 // Display transformation only: source monthly returns are unchanged. Each visible window rebases to 100.
 const vals={}; names.forEach(n=>{let w=100;const mp=maps.find(x=>x[0]===n)[1];vals[n]=months.map(m=>{w*=1+mp.get(m);return w})});
 const all=Object.values(vals).flat().filter(v=>Number.isFinite(v)&&(!logScale||v>0));
 if(!all.length){box.innerHTML='<div class="muted">表示可能な履歴なし</div>';return null}
 const rawLo=Math.min(...all), rawHi=Math.max(...all), tx=v=>logScale?Math.log(v):v, lo=tx(rawLo), hi=tx(rawHi), W=680,H=300,L=46,R=10,T=18,B=34, pw=W-L-R,ph=H-T-B;
 const y=v=>T+(hi-tx(v))/(hi-lo||1)*ph, x=i=>L+i/(months.length-1)*pw;
 const palette=['#1565c0','#7b1fa2','#00897b','#b45309'];
 let g=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Research performance equity curve"><line x1="${L}" y1="${T+ph}" x2="${W-R}" y2="${T+ph}" stroke="#d9dde3"/><text x="${L}" y="${H-8}" font-size="10" fill="#777">${months[0]}</text><text x="${W-R}" y="${H-8}" text-anchor="end" font-size="10" fill="#777">${months[months.length-1]}</text>`;
 [0,.5,1].forEach(q=>{const z=lo+(hi-lo)*q, v=logScale?Math.exp(z):z, yy=T+(1-q)*ph;g+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="#eef0f2"/><text x="${L-5}" y="${yy+3}" text-anchor="end" font-size="9" fill="#888">${Math.round(v)}</text>`});
 names.forEach((n,j)=>{const pts=vals[n].map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');g+=`<polyline points="${pts}" fill="none" stroke="${palette[j%palette.length]}" stroke-width="2.5" stroke-linejoin="round"/><text x="${L+5}" y="${T+12+j*13}" font-size="10" font-weight="700" fill="${palette[j%palette.length]}">${esc(n)}</text>`});
 box.innerHTML=g+'</svg>';
 return {start:months[0],end:months[months.length-1],months:months.length};
}
