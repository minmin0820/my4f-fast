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
 document.getElementById('months').innerHTML=(d.returns||[]).map(x=>`<article class="month"><div class="monthTop"><span>${esc(x[0])}</span><span class="badge ${x[1]=='A-STATE'?'a':String(x[1]).includes('BOOSTER')?'b':''}">${esc(x[1])}</span></div><div class="return-scroll"><div class="row k"><span class="lab">麒麟</span><span class="name">天界</span><strong>${pct(x[2])}</strong><span class="name">現世</span><strong>${pct(x[3])}</strong></div><div class="row"><span class="lab">BM</span><span class="name">SPY</span><strong>${pct(x[4])}</strong><span class="name">TQQQ</span><strong>${pct(x[5])}</strong></div></div></article>`).join('');
}).catch(e=>document.body.insertAdjacentHTML('afterbegin',`<div style="padding:10px;background:#ffecec;color:#a00;font:12px sans-serif">Snapshot load error: ${esc(e.message)}</div>`));