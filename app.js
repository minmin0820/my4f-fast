const COLORS=['#38bdf8','#a78bfa','#34d399','#f59e0b','#fb7185','#22d3ee','#f97316'];
async function load(){const d=await fetch('kirin_snapshot.json?ts='+Date.now()).then(r=>r.json());
 document.getElementById('action').innerHTML=`<strong>${d.action.status}</strong><p>${d.action.change}</p><p>${d.action.previous} → ${d.action.current}</p>`;
 document.getElementById('lights').innerHTML=d.health.map(x=>`<i class="dot ${x}"></i>`).join('');
 donut('gense',d.gense); donut('tenkai',d.tenkai);
 document.getElementById('returns').innerHTML=d.returns.map(m=>`<article class="month"><div class="top"><span>${m.month}</span><small>${m.mode}</small></div><div class="rows"><span>麒麟</span><b>${pct(m.tenkai)}</b><b>${pct(m.gense)}</b><span>BM</span><b>${pct(m.spy)}</b><b>${pct(m.tqqq)}</b></div></article>`).join('');}
function pct(x){return (x>=0?'+':'')+x.toFixed(2)+'%'}
function donut(id,a){let cur=0,stops=[],legend=[];Object.entries(a).forEach(([k,v],i)=>{let c=COLORS[i%COLORS.length],n=cur+v;stops.push(`${c} ${cur}% ${n}%`);legend.push(`<span class="pill">${k} ${v.toFixed(0)}%</span>`);cur=n});document.getElementById(id+'Donut').style.background=`conic-gradient(${stops.join(',')})`;document.getElementById(id+'Legend').innerHTML=legend.join('')}
document.getElementById('refresh').onclick=load;load();
