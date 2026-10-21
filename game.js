const $=s=>document.querySelector(s),stage=$('#stage'),boardEl=$('#board'),ghost=$('#ghost');
const LV=[[3,2],[6,4],[9,6],[12,8]],IW=900,IH=600;
let src,pieces=[],placed=0,zi=10,t0=0,timer=0,drag=null,G={};
function rnd(s){return()=>(s=s*16807%2147483647)/2147483647}
function grad(g,y1,st){const q=g.createLinearGradient(0,0,0,y1);st.forEach((c,i)=>q.addColorStop(i/(st.length-1),c));return q}
function side(g,x1,y1,x2,y2,s,T){
 if(!s){g.lineTo(x2,y2);return}
 const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),nx=dy/L*s*T,ny=-dx/L*s*T;
 const P=(u,v)=>[x1+dx*u+nx*v,y1+dy*u+ny*v],b=(a,c,d)=>g.bezierCurveTo(...P(...a),...P(...c),...P(...d));
 g.lineTo(...P(.4,0));b([.4,.25],[.32,.45],[.32,.7]);b([.32,1.05],[.68,1.05],[.68,.7]);b([.68,.45],[.6,.25],[.6,0]);g.lineTo(x2,y2)}
function outline(g,x,y,w,h,e,T){
 g.beginPath();g.moveTo(x,y);side(g,x,y,x+w,y,e.t,T);side(g,x+w,y,x+w,y+h,e.r,T);
 side(g,x+w,y+h,x,y+h,e.b,T);side(g,x,y+h,x,y,e.l,T);g.closePath()}
function fmt(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function hud(){const s=t0?Math.floor(((tEnd||Date.now())-t0)/1000):0;$('#hud').textContent=(S.timer?fmt(s)+' · ':'')+placed+'/'+pieces.length;return s}
function spot(){
 const {sw,sh,bx,by,bw,bh,w,h,T}=G,pw=w+2*T,ph=h+2*T;
 for(let i=0;i<60;i++){const x=Math.random()*(sw-pw),y=Math.random()*(sh-ph);
  if(x+pw<bx||x>bx+bw||y+ph<by||y>by+bh)return[x,y]}
 return[Math.random()*(sw-pw),Math.random()*(sh-ph)]}
function start(){
 clearInterval(timer);clearTimeout(fin);t0=0;tEnd=0;placed=0;hints=S.level>=2?4:2;updHint();$('#win').classList.remove('on');
 stage.querySelectorAll('.p').forEach(e=>e.remove());pieces=[];
 const [cols,rows]=LV[S.level];src=SC[S.scene];
 const sw=stage.clientWidth,sh=stage.clientHeight,bw=sw<sh?Math.min(sw*.94,sh*.5*1.5):Math.min(sw*.72,sh*.72*1.5),bh=bw*2/3,bx=(sw-bw)/2,by=(sh-bh)/2;
 const w=bw/cols,h=bh/rows,T=Math.min(w,h)*.26,dpr=Math.min(devicePixelRatio||1,2);
 G={sw,sh,bx,by,bw,bh,w,h,T,p:sw<sh};
 Object.assign(boardEl.style,{left:bx+'px',top:by+'px',width:bw+'px',height:bh+'px'});
 const old=$('#guide');if(old)old.remove();
 const gd=document.createElement('canvas');gd.id='guide';gd.width=bw*dpr;gd.height=bh*dpr;gd.style.cssText='position:absolute;inset:0;width:100%;height:100%';boardEl.prepend(gd);
 const gg=gd.getContext('2d');gg.scale(dpr,dpr);gg.fillStyle='rgba(240,168,31,.2)';gg.fillRect(0,0,bw,bh);gg.lineWidth=2;gg.strokeStyle='rgba(240,168,31,.4)';
 for(let i=-bh;i<bw;i+=18){gg.beginPath();gg.moveTo(i,bh);gg.lineTo(i+bh,0);gg.stroke()}
 ghost.style.backgroundImage='url('+url(src)+')';ghost.style.opacity=0;
 const rt=[],bt=[];
 for(let r=0;r<rows;r++){rt[r]=[];bt[r]=[];for(let c=0;c<cols;c++){rt[r][c]=c<cols-1?(Math.random()<.5?1:-1):0;bt[r][c]=r<rows-1?(Math.random()<.5?1:-1):0}}
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
  const e={t:r?-bt[r-1][c]:0,r:rt[r][c],b:bt[r][c],l:c?-rt[r][c-1]:0};
  const cv=document.createElement('canvas'),pw=w+2*T,ph=h+2*T;
  cv.width=pw*dpr;cv.height=ph*dpr;cv.style.width=pw+'px';cv.style.height=ph+'px';cv.className='p';
  const g=cv.getContext('2d');g.scale(dpr,dpr);outline(g,T,T,w,h,e,T);
  g.save();g.clip();g.drawImage(src,T-c*w,T-r*h,bw,bh);g.restore();
  g.lineJoin='round';g.lineWidth=1.6;g.strokeStyle='rgba(255,255,255,.55)';g.stroke();
  g.lineWidth=.8;g.strokeStyle='rgba(0,0,0,.45)';g.stroke();
  const [x,y]=spot();cv.style.left=x+'px';cv.style.top=y+'px';stage.appendChild(cv);
  pieces.push({el:cv,cx:bx+c*w-T,cy:by+r*h-T,done:false})}
 hud();timer=setInterval(hud,500)}
function hit(n,e){const r=n.getBoundingClientRect(),d=n.width/r.width;
 return n.getContext('2d').getImageData((e.clientX-r.left)*d,(e.clientY-r.top)*d,1,1).data[3]>10}
stage.addEventListener('pointerdown',e=>{
 const el=document.elementsFromPoint(e.clientX,e.clientY).find(n=>n.classList&&n.classList.contains('p')&&hit(n,e));
 if(!el)return;if(!t0)t0=Date.now();
 stage.setPointerCapture(e.pointerId);
 const lf=e.pointerType==='touch'?Math.min(34,G.h*.9):0;snd('pick');
 drag={el,sx:e.clientX,sy:e.clientY,ox:parseFloat(el.style.left),oy:parseFloat(el.style.top)-lf};el.style.top=drag.oy+'px';
 el.style.zIndex=++zi;el.classList.add('drag')});
stage.addEventListener('pointermove',e=>{
 if(!drag)return;
 drag.el.style.left=drag.ox+e.clientX-drag.sx+'px';drag.el.style.top=drag.oy+e.clientY-drag.sy+'px'});
function release(){
 if(!drag)return;const {el}=drag;drag=null;el.classList.remove('drag');
 const p=pieces.find(q=>q.el===el),d=Math.hypot(parseFloat(el.style.left)-p.cx,parseFloat(el.style.top)-p.cy);
 if(d<Math.min(G.w,G.h)*[.2,.35,.55][S.snap]){
  el.style.left=p.cx+'px';el.style.top=p.cy+'px';el.style.zIndex='';el.classList.add('done','pop');p.done=true;placed++;
  ring(p);if(placed==pieces.length)finish()}
 hud()}
stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
let tEnd=0,fin=0;
function ring(p){
 const r=document.createElement('i');r.className='ring';
 r.style.cssText='left:'+(p.cx+G.w/2+G.T)+'px;top:'+(p.cy+G.h/2+G.T)+'px;--s:'+Math.max(G.w,G.h)*1.7/20;
 snd('snap');stage.appendChild(r);setTimeout(()=>r.remove(),700);
 try{navigator.vibrate&&navigator.vibrate(15)}catch(_){}}
function confetti(){
 const cols=['#f2b440','#e4572e','#3f9fd1','#58b368','#c75fa0','#ffffff'];
 for(let i=0;i<90;i++){const c=document.createElement('i');c.className='cf';
  c.style.cssText='left:'+Math.random()*100+'%;background:'+cols[i%6]+';--x:'+((Math.random()-.5)*220)+'px;--r:'+(Math.random()*900-450)+'deg;--d:'+(1.8+Math.random()*1.6)+'s;--dl:'+Math.random()*.7+'s';
  stage.appendChild(c);setTimeout(()=>c.remove(),4800)}}
function finish(){
 clearInterval(timer);tEnd=Date.now();hud();
 const [cols,rows]=LV[S.level];
 pieces.forEach((p,i)=>{const r=Math.floor(i/cols),c=i%cols;p.el.classList.remove('pop');void p.el.offsetWidth;p.el.style.animationDelay=(r+c)*60+'ms';p.el.classList.add('wave')});
 boardEl.classList.remove('glow');void boardEl.offsetWidth;boardEl.classList.add('glow');
 snd('win');confetti();fin=setTimeout(win,Math.min(2800,(rows+cols)*60+1500))}
function win(){
 clearInterval(timer);const s=hud(),k='qc'+S.scene+S.level;let best=s;
 try{const o=+localStorage.getItem(k);if(o&&o<s)best=o;localStorage.setItem(k,best)}catch(_){}
 $('#wt').textContent='Seu tempo: '+fmt(s);
 $('#wb').textContent=s<=best?'Novo recorde nesta dificuldade!':'Melhor tempo: '+fmt(best);
 $('#win').classList.add('on')}
const url=o=>o.toDataURL?o.toDataURL('image/jpeg',.8):o.src;
const NAMES=['Joaninha','Alcachofra','Ingredientes','Cabana na neve','Lago e cidade','Âncora','Tulipas','Manta','Borboleta','Ônibus espacial','Celulares','Pinheiro nevado','Égua e potro','Bisão','Cartas antigas','Galinhas','Campo verde','Cachorro'],LVN=['Fácil','Médio','Difícil','Mestre'],PH=PHD.map(u=>{const m=new Image();m.src=u;return m}),SC=PH;
let S={scene:0,level:1,snap:1,timer:1,theme:'auto'},rot=0,spinning=false,pick=0;
try{Object.assign(S,JSON.parse(localStorage.getItem('qcs')||'{}'))}catch(_){}
function save(){try{localStorage.setItem('qcs',JSON.stringify(S))}catch(_){}}
function applyTheme(){if(S.theme==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.dataset.theme=S.theme}
function show(id){if(id==='menu')decorate();if(id!=='game')clearInterval(timer);document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id))}
function openLevels(){
 const box=$('#lvbox');box.innerHTML='';
 LV.forEach((l,i)=>{const b=document.createElement('button');b.className='lv';let best='';
  try{const o=+localStorage.getItem('qc'+S.scene+i);if(o)best='Recorde '+fmt(o)}catch(_){}
  b.innerHTML='<strong>'+LVN[i]+'</strong><span>'+l[0]*l[1]+' peças</span><span>'+best+'</span>';
  b.onclick=()=>{S.level=i;save();show('game');start()};box.appendChild(b)});
 show('levels')}
const AN=[[8,10],[27,5],[50,93],[72,8],[92,14],[94,48],[90,86],[68,94],[28,91],[7,84],[5,47],[17,66],[83,68]],CL=['#d98e1f','#3f7f8c','#8a4f6b','#5d8a4a'];
function mkPiece(cv,m){
 const W=cv.width,u=W/1.52,T=u*.26,g=cv.getContext('2d'),e={};
 ['t','r','b','l'].forEach(k=>e[k]=Math.random()<.5?1:-1);
 g.clearRect(0,0,W,W);outline(g,T,T,u,u,e,T);g.save();g.clip();
 if(m&&m.naturalWidth){const sw=420+Math.random()*200;g.drawImage(m,Math.random()*(1200-sw),Math.random()*(800-sw),sw,sw,0,0,W,W)}
 else{g.fillStyle=CL[Math.floor(Math.random()*4)];g.fillRect(0,0,W,W)}
 g.restore();g.lineJoin='round';g.lineWidth=3;g.strokeStyle='rgba(255,255,255,.6)';g.stroke();g.lineWidth=1.5;g.strokeStyle='rgba(0,0,0,.45)';g.stroke()}
function decorate(){
 const box=$('#deco'),lg=$('#logo');if(!box)return;box.innerHTML='';
 const imgs=PH.filter(m=>m.naturalWidth).sort(()=>Math.random()-.5),base=Math.max(70,Math.min(150,Math.min(innerWidth,innerHeight)*.2));
 AN.forEach(([x,y],i)=>{const W=Math.round(base*(.75+Math.random()*.5)*1.52),c=document.createElement('canvas');
  c.width=c.height=W*2;c.style.cssText='left:'+x+'%;top:'+y+'%;width:'+W+'px;height:'+W+'px;transform:translate(-50%,-50%) rotate('+((Math.random()-.5)*70)+'deg)';
  mkPiece(c,imgs[i%Math.max(imgs.length,1)]);box.appendChild(c)});
 mkPiece(lg,imgs[0])}
let AC=null,hints=0,rz=0;
function snd(t){
 if(S.sound===0)return;
 try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
  const n=AC.currentTime,tone=(f,s,d,ty,v)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=ty||'sine';o.frequency.setValueAtTime(f,n+s);
   g.gain.setValueAtTime(.0001,n+s);g.gain.exponentialRampToValueAtTime(v||.2,n+s+.01);g.gain.exponentialRampToValueAtTime(.0001,n+s+d);
   o.connect(g);g.connect(AC.destination);o.start(n+s);o.stop(n+s+d+.02)};
  if(t==='snap'){tone(520,0,.09,'triangle',.25);tone(780,.05,.14,'sine',.2)}
  else if(t==='tick')tone(900,0,.04,'square',.05);
  else if(t==='pick')tone(330,0,.06,'sine',.12);
  else if(t==='click')tone(440,0,.05,'sine',.1);
  else if(t==='hint'){tone(660,0,.12,'sine',.2);tone(880,.12,.18,'sine',.2)}
  else if(t==='land')[523,659,784].forEach((f,i)=>tone(f,i*.09,.25,'triangle',.22));
  else if(t==='win')[523,659,784,1047,784,1047,1319].forEach((f,i)=>tone(f,i*.13,.35,'triangle',.25))}catch(_){}}
addEventListener('pointerup',()=>{if(AC&&AC.state==='suspended')AC.resume()},{passive:true});
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('button:not(:disabled)'))snd('click')});
function buildGrid(){
 const g=$('#grid');g.innerHTML='';
 PH.forEach(m=>{const c=document.createElement('canvas');c.width=c.height=120;c.className='tile';
  if(m.naturalWidth){const s=Math.min(m.naturalWidth,m.naturalHeight);c.getContext('2d').drawImage(m,(m.naturalWidth-s)/2,(m.naturalHeight-s)/2,s,s,0,0,120,120)}
  g.appendChild(c)})}
function openRoulette(){
 $('#rname').textContent='Toque para sortear a imagem';$('#r1').hidden=false;$('#r2').hidden=true;$('#rprev').hidden=true;
 const g=$('#grid');g.classList.remove('spin');[...g.children].forEach(t=>t.classList.remove('hot'));show('roulette')}
function spin(){
 if(spinning)return;spinning=true;
 $('#r1').hidden=true;$('#r2').hidden=true;$('#rprev').hidden=true;$('#rname').textContent='Sorteando…';
 const g=$('#grid'),T=[...g.children],n=T.length,fast=matchMedia('(prefers-reduced-motion:reduce)').matches;
 pick=Math.floor(Math.random()*n);
 let pos=T.findIndex(t=>t.classList.contains('hot'));if(pos<0)pos=n-1;
 const steps=n*(fast?1:2)+(((pick-pos)%n)+n)%n;let i=0;
 g.classList.add('spin');
 (function step(){
  T[pos].classList.remove('hot');pos=(pos+1)%n;T[pos].classList.add('hot');snd('tick');i++;
  if(i<steps)setTimeout(step,fast?25:35+Math.pow(i/steps,3)*260);
  else{spinning=false;g.classList.remove('spin');S.scene=pick;save();snd('land');
   $('#rname').textContent='Caiu: '+NAMES[pick]+'!';$('#rprev').src=url(SC[pick]);$('#rprev').hidden=false;$('#r2').hidden=false}
 })()}
function updHint(){const b=$('#hint');b.textContent='Dica ('+hints+')';b.disabled=hints<1}
function hint(){
 const rem=pieces.filter(p=>!p.done);if(hints<1||!rem.length||drag)return;
 hints--;updHint();snd('hint');
 const p=rem[Math.floor(Math.random()*rem.length)];
 stage.querySelectorAll('.slot').forEach(s=>s.remove());
 const s=document.createElement('i');s.className='slot';
 s.style.cssText='left:'+(p.cx+G.T)+'px;top:'+(p.cy+G.T)+'px;width:'+G.w+'px;height:'+G.h+'px';stage.appendChild(s);
 p.el.style.zIndex=++zi;p.el.classList.remove('hint');void p.el.offsetWidth;p.el.classList.add('hint');
 setTimeout(()=>{s.remove();p.el.classList.remove('hint')},3600)}
$('#hint').onclick=hint;
$('#sSound').value=S.sound===0?0:1;$('#sSound').onchange=e=>{S.sound=+e.target.value;save()};
addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if($('#game').classList.contains('on')&&pieces.length&&(innerWidth<innerHeight)!==G.p&&!drag)start()},300)});
buildGrid();Promise.all(PH.map(m=>m.decode().catch(()=>0))).then(()=>{buildGrid();decorate()});
$('#mPlay').onclick=openRoulette;$('#mSet').onclick=()=>{$('#sClr').textContent='Apagar recordes';show('settings')};
$('#spin').onclick=spin;$('#rAgain').onclick=spin;$('#rGo').onclick=openLevels;$('#rBack').onclick=()=>show('menu');
$('#lBack').onclick=openRoulette;$('#sBack').onclick=()=>show('menu');$('#tomenu').onclick=()=>show('menu');
$('#again').onclick=openRoulette;$('#wmenu').onclick=()=>show('menu');
$('#sTheme').value=S.theme;$('#sTimer').value=S.timer;$('#sSnap').value=S.snap;
$('#sTheme').onchange=e=>{S.theme=e.target.value;applyTheme();save()};
$('#sTimer').onchange=e=>{S.timer=+e.target.value;save()};
$('#sSnap').onchange=e=>{S.snap=+e.target.value;save()};
$('#sClr').onclick=()=>{try{Object.keys(localStorage).filter(k=>/^qc\d{2,3}$/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(_){}$('#sClr').textContent='Recordes apagados'};
$('#shuf').onclick=()=>pieces.forEach(p=>{if(!p.done){const [x,y]=spot();p.el.style.left=x+'px';p.el.style.top=y+'px'}});
$('#peek').onclick=()=>{ghost.style.opacity=ghost.style.opacity==='0.45'?0:.45};
applyTheme();show('menu');
