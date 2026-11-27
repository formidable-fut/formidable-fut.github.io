{
/* ===== Configuración de fotos / API =====
   Cada jugador tiene el campo "foto" (null por ahora).
   - FOTOS_LOCALES: archivos subidos junto a la web, p.ej. { "Lionel Messi": "fotos/messi.png" }
   - FOTO_API.url(jugador): punto de enganche para una futura API; debe devolver una URL o null.
   Esta web solo carga imágenes que estén dentro de la propia web: los dibujos se suben como archivos.
   Con foto, "Jugador oculto" y "Cuadrícula 3x3" pasan a usar la imagen pixelada. */
const FOTOS_LOCALES = {};
const FOTO_API = { base: "", url: p => null };
const fotoDe = p => p.foto || FOTOS_LOCALES[p.n] || (FOTO_API.base ? FOTO_API.url(p) : null);

const COL = {blanco:"#ffffff",negro:"#111111",rojo:"#d62828",azul:"#1d4ed8",celeste:"#7cc6f2",amarillo:"#ffd60a",verde:"#1f8a4c",granate:"#7a1530",morado:"#6b2fa3",naranja:"#f28c1b",rosa:"#f5a3c7",dorado:"#c9a227"};
const BASE = {celeste:"azul",dorado:"amarillo"};
const POS = {POR:"Portero",DEF:"Defensa",MED:"Centrocampista",DEL:"Delantero"};
const TOP5 = ["ESP","ENG","ITA","GER","FRA"];
const CLUB_AL = {fcb:["barca","barça"],atm:["atleti","atletico"],mun:["man utd","man united","united"],mci:["man city","city"],tot:["spurs"],int:["inter"],mil:["milan"],bay:["bayern"],juv:["juve"],bvb:["dortmund"],b04:["leverkusen"],psg:["paris"],om:["marsella","marseille"],oly:["lyon"],rbl:["leipzig"],bmg:["gladbach"],ath:["athletic bilbao","bilbao"],rso:["la real"],bet:["betis"],ein:["frankfurt"],nfo:["forest"],wol:["wolves"],sev:["sevilla"]};
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/ı/g,"i").replace(/ø/g,"o").replace(/ł/g,"l").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const rnd = a => a[Math.floor(Math.random()*a.length)];
const shuffle = a => { a = a.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const store = {
  get(k,d){ try{ const v=localStorage.getItem("ffut:"+k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
  set(k,v){ try{ localStorage.setItem("ffut:"+k,JSON.stringify(v)); }catch(e){} }
};
const SIL = '<svg viewBox="0 0 100 110" aria-hidden="true"><circle cx="50" cy="38" r="19" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M14 110c2-26 17-38 36-38s34 12 36 38" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>';

let D = null, P = [], byClub = {}, FAM = [], CK = [];
const app = document.getElementById("app");
(()=>{ const d=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML"); if(!d||!d.set) return;
  Object.defineProperty(app,"innerHTML",{configurable:true,get(){return d.get.call(this);},set(v){ const y=window.scrollY; d.set.call(this,v); if(y) window.scrollTo(0,y); }}); })();

const GAMES = [
  {id:"compatriota", c:"#d7362f", s:"Mismo país, mismos clubes", ci:"#ffffff", t:"Compatriota", d:"Un jugador y dos de sus clubes. Di otro de su país que pasara por los dos.", ic:"flag"},
  {id:"conexion", c:"#2f5fc4", s:"Un jugador, dos clubes", ci:"#ffffff", t:"Conexión", d:"Dos clubes. Di cualquier jugador que haya jugado en ambos.", ic:"link"},
  {id:"reto-1000", c:"#e08a00", s:"Suma goles: de 1000 a 4000", ci:"#ffffff", t:"Reto 1000", d:"Coloca 12 jugadores en sus casillas: liga, Champions, selección… De 1000 a 4000 goles.", ic:"ball"},
  {id:"exacto", c:"#1f8f55", s:"Llega al número justo", ci:"#ffffff", t:"Goles exactos", d:"Llega al número justo con el menor número de jugadores.", ic:"target"},
  {id:"pistas", c:"#7a45c0", s:"Su carrera, pista a pista", ci:"#ffffff", t:"Adivina por pistas", d:"Su carrera, pista a pista. Seis intentos.", ic:"q"},
  {id:"impostor", c:"#c93b86", s:"Uno no encaja", ci:"#ffffff", t:"Impostor", d:"Seis jugadores, uno no encaja con los demás.", ic:"odd"},
  {id:"comparador", c:"#0d8f86", s:"Atributo a atributo", ci:"#ffffff", t:"Comparador", d:"Cada intento revela lo que comparte con el jugador secreto.", ic:"cmp"},
  {id:"oculto", c:"#3d4a66", s:"Destapa su nombre", ci:"#ffffff", t:"Jugador oculto", d:"Su nombre se destapa con cada fallo.", ic:"px"},
  {id:"cuadricula", c:"#e5671a", s:"Clubes × países", ci:"#ffffff", t:"Cuadrícula 3x3", d:"Cruza clubes y países: un jugador por casilla.", ic:"grid"},
  {id:"colores", c:"#1688c9", s:"Adivina el equipo", ci:"#ffffff", t:"Colores", d:"Uno o dos colores: di un equipo que se identifique con ellos.", ic:"col"}
];
const ICONS = {
  flag:'<circle cx="18" cy="17" r="7"/><path d="M5 41c1.5-8 6.5-12 13-12s11.5 4 13 12"/><path d="M33 8v20"/><path class="a" d="M33 9h10l-3 4 3 4H33z"/>',
  link:'<circle cx="15" cy="24" r="10"/><circle cx="33" cy="24" r="10"/><path class="a" d="M24 16.5a10 10 0 0 1 0 15a10 10 0 0 1 0-15z"/>',
  ball:'<circle cx="24" cy="24" r="17"/><path class="a" d="M24 16l7 5-2.7 8h-8.6L17 21z"/><path d="M24 16V7M31 21l8-3M28.3 29l5 7M19.7 29l-5 7M17 21l-8-3"/>',
  target:'<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="10"/><circle class="a" cx="24" cy="24" r="4"/>',
  q:'<rect x="9" y="7" width="30" height="34" rx="3"/><path d="M15 15h18M15 21h18M15 27h10"/><circle class="a" cx="32" cy="33" r="4"/>',
  odd:'<circle cx="11" cy="17" r="4.5"/><circle cx="24" cy="17" r="4.5"/><circle cx="37" cy="17" r="4.5"/><circle cx="11" cy="31" r="4.5"/><circle class="a" cx="24" cy="31" r="4.5"/><circle cx="37" cy="31" r="4.5"/>',
  cmp:'<path d="M8 40V22M18 40V12M28 40V26M38 40V16"/><path class="a" d="M26 26h4v14h-4z"/>',
  px:'<path d="M7 34h7M17 34h7M27 34h7M37 34h4"/><path class="a" d="M17 14h7v14h-7z"/>',
  grid:'<rect x="8" y="8" width="32" height="32" rx="2"/><path d="M18.7 8v32M29.3 8v32M8 18.7h32M8 29.3h32"/><path class="a" d="M18.7 18.7h10.6v10.6H18.7z"/>',
  col:'<circle cx="18" cy="24" r="11"/><circle class="a" cx="30" cy="24" r="11"/>'
};

/* ---------- utilidades de datos ---------- */
const leaguesOf = p => [...new Set(p.c.map(c=>D.clubs[c].l))];
const ligaN = l => D.ligas[l] || l;
const clubN = k => D.clubs[k].n;
const flagOf = p => `<span class="flag">${D.nats[p.nat].f}</span>`;
const baseCols = k => [...new Set(D.clubs[k].col.map(c=>BASE[c]||c))];
/* colores que en el habla común se intercambian para un club concreto (blaugrana, giallorossi…) */
const ALT_EQ = {fcb:{rojo:"granate"}, lev:{granate:"rojo"}, eib:{granate:"rojo"}, rom:{granate:"rojo"}};
const matchCols = k => { const b=baseCols(k), a=ALT_EQ[k]||{}; return [...new Set([...b, ...b.map(c=>a[c]).filter(Boolean)])]; };
const colHit = (k, c, cs) => cs.includes(c) || (ALT_EQ[k] && ALT_EQ[k][c] && cs.includes(ALT_EQ[k][c]));

/* ---------- utilidades de interfaz ---------- */
const sw = k => "";
const LIGHT_COL = ["blanco","amarillo","celeste","rosa","dorado"];
const kitStyle = k => { const cs=D.clubs[k].col, c=cs.map(x=>COL[x]||"#888"); let bg;
  if(c.length===1) bg=c[0]; else if(c.length===2) bg=`linear-gradient(115deg,${c[0]} 0 68%,${c[1]} 68%)`; else bg=`linear-gradient(115deg,${c[0]} 0 62%,${c[1]} 62% 81%,${c[2]} 81%)`;
  return `background:${bg};color:${LIGHT_COL.includes(cs[0])?"#111":"#fff"}`; };
const clubChip = k => `<div class="club kitc" style="${kitStyle(k)}"><span>${esc(clubN(k))}</span></div>`;
const natTxt = code => { const n=D.nats[code]; return `<span class="flag">${n.f}</span> ${esc(n.n)}`; };
const photo = p => { const u=fotoDe(p); return `<div class="photo"><span class="cimg">${u?`<img src="${esc(u)}" alt="">`:SIL}</span><span class="cnum">#${P.indexOf(p)+1}</span></div>`; };
const pn = (p, txt) => { const t = txt||p.n; const len=Math.max(6,...t.split(/\s+/).map(w=>w.length)); return `<div class="pname" style="--len:${len}">${esc(t)}</div>`; };
const tt = t => { const w=String(t).split(' '); return w.length>1 ? `${esc(w.slice(0,-1).join(' '))} <span class="lt">${esc(w[w.length-1])}</span>` : esc(t); };
const top = (title, pill) => { const g=GAMES.find(x=>x.id===location.hash.slice(1)); return `<div class="top"><button class="back" id="back" aria-label="Volver"><svg width="18" height="18" viewBox="0 0 20 20"><path d="M13 3L6 10l7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>${g?`<span class="ic" aria-hidden="true" style="--cb:${CARD_KIT[g.id][0]};--cf:${CARD_KIT[g.id][1]}"><svg viewBox="0 0 48 48">${ICONS[g.ic]}</svg></span>`:""}<h2 class="fit"><span class="fit-in">${esc(title)}</span></h2>${pill?`<span class="pill">${pill}</span>`:""}</div>`; };
const bindBack = () => document.getElementById("back").onclick = () => { location.hash = ""; };
const on = (id, fn) => { const el=document.getElementById(id); if(el) el.onclick=fn; };
const resBox = (win, title, body) => `<div class="res ${win?"ok":"bad"}"><span class="ricon" aria-hidden="true">${win?"✓":"✕"}</span><div><h3>${title}</h3>${body?`<p>${body}</p>`:""}</div></div>`;

function makeSearch(el, items, onPick, placeholder){
  el.innerHTML = `<div class="search"><input id="q" type="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="${placeholder}" aria-label="${placeholder}"><ul class="sugs" id="sugs"></ul></div>`;
  const q=el.querySelector("#q"), ul=el.querySelector("#sugs");
  q.addEventListener("input", () => {
    const t=norm(q.value); if(t.length<2){ul.innerHTML="";return;}
    const hits=[];
    for(const it of items){ if(hits.length>=6) break; if(it.k.some(k=>k.includes(t))) hits.push(it); }
    ul.innerHTML = hits.length ? hits.map(h=>`<li><button data-v="${esc(h.v)}">${esc(h.label)}<span>${h.side||""}</span></button></li>`).join("")
      : `<li class="none">No está en la base (aún).</li>`;
  });
  ul.addEventListener("click", e => { const b=e.target.closest("button"); if(!b) return; q.value=""; ul.innerHTML=""; onPick(b.dataset.v); });
  return q;
}
const playerSearch = (el, onPick, used, noFlag) => makeSearch(el, P.map((p,i)=>({v:String(i),k:p._k,label:p.n,side:noFlag?"":flagOf(p)})).filter(x=>!(used&&used.has(+x.v))), v=>onPick(+v), "Escribe un jugador…");
const clubSearch = (el, onPick, used) => makeSearch(el, CK.filter(k=>!(used&&used.has(k))).map(k=>({v:k,k:[norm(clubN(k)),...(CLUB_AL[k]||[]).map(norm)],label:clubN(k),side:esc(ligaN(D.clubs[k].l))})), onPick, "Escribe un equipo…");

const streakPill = id => `Racha <em>${store.get("streak:"+id,0)}</em> · Mejor ${store.get("best:"+id,0)}`;
const bumpStreak = (id, win) => { if(typeof partyResult==="function" && partyResult(id,win)) return; if(typeof onlineResult==="function" && onlineResult(id,win)) return; let s=store.get("streak:"+id,0); s = win ? s+1 : 0; store.set("streak:"+id,s); if(s>store.get("best:"+id,0)) store.set("best:"+id,s); };
const triesList = (tries, why, max, done) => `<ul class="tries">${tries.map(t=>`<li class="${t.ok?"ok":""}">${esc(P[t.i].n)}${why&&t.why?` <small>${esc(t.why)}</small>`:""}</li>`).join("")}</ul>`;

/* ---------- portada ---------- */
const PITCH = '<svg class="pitch" viewBox="0 0 400 260" aria-hidden="true" preserveAspectRatio="xMaxYMid slice"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="10" y="10" width="380" height="240"/><path d="M200 10v240"/><circle cx="200" cy="130" r="44"/><circle cx="200" cy="130" r="2.5" fill="currentColor"/><rect x="10" y="62" width="62" height="136"/><rect x="10" y="98" width="22" height="64"/><rect x="328" y="62" width="62" height="136"/><rect x="368" y="98" width="22" height="64"/><path d="M72 104a32 32 0 0 1 0 52M328 104a32 32 0 0 0 0 52"/></g></svg>';
const gIcon = g => `<span class="gi" style="--gc:${g.c};--gci:${g.ci}"><svg viewBox="0 0 48 48" aria-hidden="true">${ICONS[g.ic]}</svg></span>`;
/* camisetas: cada juego es una equipación vista por la espalda */
const KITS = {
  "compatriota":{p:"stripes",a:"#d7262e",b:"#ffffff",n:"#111",name:"COMPATRIOTA",num:1},
  "conexion":{p:"halves",a:"#1d4fb8",b:"#7cc4f0",n:"#fff",name:"CONEXIÓN",num:2},
  "reto-1000":{p:"plain",a:"#f2c230",b:"#14213d",n:"#14213d",name:"RETO",num:1000},
  "exacto":{p:"hoops",a:"#13854a",b:"#ffffff",n:"#111",name:"EXACTO",num:4},
  "pistas":{p:"sash",a:"#5b2a86",b:"#ffffff",n:"#fff",name:"PISTAS",num:5},
  "impostor":{p:"pins",a:"#151515",b:"#f06fa0",n:"#f06fa0",name:"IMPOSTOR",num:6},
  "comparador":{p:"chevron",a:"#0f8c84",b:"#e9f7f5",n:"#fff",name:"COMPARADOR",num:7},
  "oculto":{p:"plain",a:"#1b1d21",b:"#3a3e46",n:"#8a909b",name:"OCULTO",num:8},
  "cuadricula":{p:"checks",a:"#d22630",b:"#ffffff",n:"#111",name:"CUADRÍCULA",num:9},
  "colores":{p:"quarters",a:"#f07d1a",b:"#1d3a8a",n:"#fff",name:"COLORES",num:10}
};
let KN=0;
function kitSVG(id, cls){
  const k=KITS[id], u="k"+(++KN);
  const body="M62 14 Q100 30 138 14 L182 34 L170 82 L150 74 L150 212 Q100 220 50 212 L50 74 L30 82 L18 34 Z";
  const pat = {
    plain:``,
    stripes:[0,1,2,3,4].map(i=>`<rect x="${36+i*32}" y="0" width="16" height="230" fill="${k.b}"/>`).join(""),
    halves:`<rect x="100" y="0" width="100" height="230" fill="${k.b}"/>`,
    hoops:[0,1,2,3,4,5].map(i=>`<rect x="0" y="${40+i*34}" width="200" height="17" fill="${k.b}"/>`).join(""),
    sash:`<path d="M30 40 L60 20 L190 200 L160 225 Z" fill="${k.b}"/>`,
    pins:[...Array(12)].map((_,i)=>`<rect x="${26+i*13}" y="0" width="2" height="230" fill="${k.b}" opacity=".7"/>`).join(""),
    chevron:`<path d="M20 60 L100 110 L180 60 L180 90 L100 140 L20 90 Z" fill="${k.b}" opacity=".9"/>`,
    checks:[...Array(8)].flatMap((_,r)=>[...Array(8)].map((_,c)=>(r+c)%2?`<rect x="${c*25}" y="${r*29}" width="25" height="29" fill="${k.b}"/>`:"")).join(""),
    quarters:`<rect x="100" y="0" width="100" height="115" fill="${k.b}"/><rect x="0" y="115" width="100" height="115" fill="${k.b}"/>`
  }[k.p];
  const numStr=String(k.num), nsize = numStr.length>2 ? 52 : 84;
  return `<svg class="${cls||"kitsvg"}" viewBox="0 0 200 230" aria-hidden="true"><defs><clipPath id="${u}"><path d="${body}"/></clipPath>
    <linearGradient id="${u}s" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs>
    <g clip-path="url(#${u})"><rect width="200" height="230" fill="${k.a}"/>${pat}<rect width="200" height="230" fill="url(#${u}s)"/></g>
    <path d="M62 14 Q100 30 138 14 Q100 40 62 14Z" fill="rgba(0,0,0,.28)"/>
    <path d="${body}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>
    <text x="100" y="78" text-anchor="middle" class="kname" fill="${k.n}" ${k.name.length>8?`textLength="96" lengthAdjust="spacingAndGlyphs"`:""}>${k.name}</text>
    <text x="100" y="${nsize>60?160:148}" text-anchor="middle" class="knum" font-size="${nsize}" fill="${k.n}">${numStr}</text></svg>`;
}
const CARD_KIT = {"compatriota": ["#c8322b", "#fff", "3 intentos"], "conexion": ["#13306b", "#fff", "3 intentos"], "reto-1000": ["#0e8c80", "#fff", "12 casillas"], "exacto": ["#0d6206", "#fff", "Cifra exacta"], "pistas": ["#e0457b", "#fff", "6 pistas"], "impostor": ["#121212", "#fff", "1 de 6"], "comparador": ["#2e83cf", "#fff", "Atributos"], "oculto": ["#4b2a7b", "#fff", "Letra a letra"], "cuadricula": ["#e8661c", "#fff", "9 casillas"], "colores": ["#7a1630", "#fff", "3 intentos"]};
const SUN='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10" cy="10" r="3.6"/><path d="M10 1.5v2.2M10 16.3v2.2M1.5 10h2.2M16.3 10h2.2M4 4l1.6 1.6M14.4 14.4 16 16M4 16l1.6-1.6M14.4 5.6 16 4"/></svg>';
const MOON='<svg viewBox="0 0 20 20" fill="currentColor"><path d="M16.5 12.6A7 7 0 0 1 7.4 3.5a7 7 0 1 0 9.1 9.1z"/></svg>';
const theme = () => document.documentElement.dataset.theme;
const modeBtn = () => `<button class="mode" id="mode" aria-label="Cambiar modo día/noche">${theme()==="dark"?SUN+"Día":MOON+"Noche"}</button>`;
document.addEventListener("click", e => { const b=e.target.closest&&e.target.closest("#mode"); if(!b) return; const t=theme()==="dark"?"light":"dark"; document.documentElement.dataset.theme=t; store.set("theme",t); b.outerHTML=modeBtn(); });
function home(){
  const arr='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M10 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const card=(g,k)=>{ const [cb,cf,tg]=CARD_KIT[g.id], st=store.get("streak:"+g.id,0);
    return `<a class="gc" href="#${g.id}" style="--cb:${cb};--cf:${cf}"><span class="ic"><svg viewBox="0 0 48 48" aria-hidden="true">${ICONS[g.ic]}</svg></span><span class="hd"><span class="no">${String(k+1).padStart(2,"0")}</span><span class="tg">${tg}</span></span><b>${esc(g.t)}</b><small>${esc(g.s)}</small><span class="go"><i>${arr}</i>Jugar</span>${st?`<span class="stk">Racha ${st}</span>`:""}</a>`; };
  app.innerHTML = `
  <header class="hero">
    <div class="row"><span>Minijuegos de fútbol · 25/26</span>${modeBtn()}</div>
    <h1 class="fit fill"><span class="fit-in">Formidable<i></i></span></h1>
    <nav class="dots" aria-label="Ir a un juego">${GAMES.map(g=>`<a href="#${g.id}" aria-label="${esc(g.t)}" style="--cb:${CARD_KIT[g.id][0]};--cf:${CARD_KIT[g.id][1]}"><svg viewBox="0 0 48 48">${ICONS[g.ic]}</svg></a>`).join("")}</nav>
  </header>
  <div class="sec"><h2>Juegos</h2><span>Elige y juega</span></div>
  <section class="cards">${GAMES.map(card).join("")}</section>
  <div class="sec"><h2>Con amigos</h2><span>Un solo móvil</span></div>
  ${partyOn()&&PARTY.r<PARTY.rounds?`<a class="mp cont" href="#fiesta-turno"><span class="mp-ic">▶</span><span><b>Continuar partida</b><small>Ronda ${PARTY.r+1}/${PARTY.rounds} · ${esc(curGame().t)}</small></span></a>`:""}
  ${ONL?`<a class="mp cont" href="#online-sala"><span class="mp-ic">▶</span><span><b>Volver a la sala</b><small>Código ${esc(ONL.code)}</small></span></a>`:""}
  <a class="mp onl" href="#online"><span class="mp-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z"/></svg></span><span><b>Online</b><small>Cada uno en su móvil · sala con código</small></span><svg class="mp-ar" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M10 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
  <a class="mp" href="#fiesta"><span class="mp-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.6"/><path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5M14.5 14.6c.8-.4 1.6-.6 2.5-.6 2.4 0 4.1 1.4 4.6 4"/></svg></span><span><b>Local</b><small>Un solo móvil · a gritar o en duelo</small></span><svg class="mp-ar" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M10 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
  <p class="foot">Datos curados a mano hasta mediados de 2026. Cifras oficiales aproximadas (club + selección); "?" donde no hay dato fiable. Si ves un dato mal, dímelo y lo corrijo.</p>`;
}

/* ajusta un título al ancho disponible, sea cual sea la fuente cargada */
function fitAll(){
  document.querySelectorAll(".logo").forEach(l=>{ const h=l.querySelector("h1"); if(h) l.style.setProperty("--fs", getComputedStyle(h).fontSize); });
  document.querySelectorAll(".fit").forEach(el=>{
    const inner=el.querySelector(".fit-in")||el; el.style.fontSize="";
    const base=parseFloat(getComputedStyle(el).fontSize), w=el.clientWidth; if(!w) return;
    const sw=inner.scrollWidth; if(!sw) return;
    let size = el.classList.contains("fill") ? Math.min(base*1.6, base*w/sw*0.9) : (sw>w ? base*w/sw*0.92 : base);
    inner.style.whiteSpace="";
    if(!el.classList.contains("fill") && size<22){ size=22; inner.style.whiteSpace="normal"; }
    el.style.fontSize=Math.max(18,Math.floor(size))+"px";
    if(!el.classList.contains("fill")){ for(let k=0;k<4 && inner.scrollWidth>el.clientWidth+1;k++){ const cur=parseFloat(el.style.fontSize); if(cur<=22){ inner.style.whiteSpace="normal"; el.style.fontSize="22px"; break; } el.style.fontSize=Math.max(22,Math.floor(cur*el.clientWidth/inner.scrollWidth*0.97))+"px"; } }
  });
  document.querySelectorAll(".logo").forEach(l=>{ const h=l.querySelector("h1"); if(h) l.style.setProperty("--fs", h.style.fontSize||getComputedStyle(h).fontSize); });
}
if(window.ResizeObserver){ const fitObs = new ResizeObserver(()=>fitAll()); fitObs.observe(document.body); } else window.addEventListener("resize", fitAll);
const fitMut = new MutationObserver(()=>requestAnimationFrame(fitAll)); fitMut.observe(app,{childList:true});
setTimeout(fitAll,400); setTimeout(fitAll,1500);
if(document.fonts){ document.fonts.ready.then(fitAll); document.fonts.addEventListener&&document.fonts.addEventListener("loadingdone", fitAll); }

/* ---------- 1 y 2: dos clubes ---------- */
function pairGame(mode){
  const id = mode; let st;
  const gen = () => {
    for(let t=0;t<800;t++){
      const pi = Math.floor(Math.random()*P.length), p=P[pi];
      if(p.c.length<2) continue;
      const [a,b] = shuffle(p.c);
      const both = [...byClub[a]].filter(i=>byClub[b].has(i));
      const ans = mode==="compatriota" ? both.filter(i=>i!==pi && P[i].nat===p.nat) : both;
      if(mode==="compatriota" ? ans.length>=1 : ans.length>=2) return {pi, a, b, ans:new Set(ans), tries:[], done:false};
    }
  };
  const render = () => {
    const p = P[st.pi];
    app.innerHTML = top(mode==="compatriota"?"Compatriota":"Conexión", streakPill(id)) +
      `<p class="rule">${mode==="compatriota"?"Di un jugador de la <b>misma nacionalidad</b> que haya jugado en estos dos clubes.":"Di un jugador que haya jugado en estos dos clubes."} Tres intentos.</p>
      <div class="board">${mode==="compatriota"?`<div class="player">${photo(p)}${pn(p)}${st.done?`<div class="nat">${natTxt(p.nat)}</div>`:""}</div>`:""}
      <div class="clubs">${clubChip(st.a)}<span class="amp">+</span>${clubChip(st.b)}</div></div>
      <div id="res"></div><div id="srch"></div>${triesList(st.tries,true,3,st.done)}
      <div class="row" style="margin-top:14px">${st.done?`<button class="btn" id="next">Siguiente</button>`:`<button class="btn ghost" id="give">Me rindo</button>`}</div>`;
    bindBack();
    if(st.done){
      const others=[...st.ans].filter(i=>!st.tries.some(t=>t.i===i)).map(i=>P[i].n);
      document.getElementById("res").innerHTML = resBox(st.win, st.win?"¡Golazo!":"Fallado", st.win?"":(others.length?`Valía, por ejemplo, <b>${esc(others[Math.floor(Math.random()*others.length)])}</b>.`:""));
    } else playerSearch(document.getElementById("srch"), pick, new Set(st.tries.map(t=>t.i)), mode==="compatriota");
    on("next",()=>{ st=gen(); render(); });
    on("give",()=>{ st.done=true; st.win=false; bumpStreak(id,false); render(); });
  };
  const pick = i => {
    const q=P[i], p=P[st.pi]; const ok = st.ans.has(i); let why="¡Correcto!";
    if(!ok){
      const miss=[st.a,st.b].filter(k=>!q.c.includes(k)).map(clubN);
      if(mode==="compatriota" && i===st.pi) why="Es el mismo jugador";
      else if(miss.length) why="No jugó en "+miss.join(" ni en ");
      else why="Jugó en ambos, pero no es de su misma nacionalidad";
    }
    st.tries.push({i,ok,why});
    if(ok){ st.done=true; st.win=true; bumpStreak(id,true); }
    else if(st.tries.length>=3){ st.done=true; st.win=false; bumpStreak(id,false); }
    render();
  };
  st = gen(); render();
}

/* ---------- 3: reto 1000 ---------- */
const SLOTS = [
  {k:"ESP", t:"LaLiga", d:"Goles en clubes españoles"},
  {k:"ENG", t:"Premier", d:"Goles en clubes ingleses"},
  {k:"ITA", t:"Serie A", d:"Goles en clubes italianos"},
  {k:"FRA", t:"Ligue 1", d:"Goles en clubes franceses"},
  {k:"GER", t:"Bundesliga", d:"Goles en clubes alemanes"},
  {k:"UCL", t:"Champions", d:"Goles en Champions / Copa de Europa"},
  {k:"CLUB", t:"Club", d:"Goles en toda su trayectoria en clubes"},
  {k:"CLUB", t:"Club", d:"Goles en toda su trayectoria en clubes"},
  {k:"CLUB", t:"Club", d:"Goles en toda su trayectoria en clubes"},
  {k:"NT", t:"Selección", d:"Goles con su selección"},
  {k:"NT", t:"Selección", d:"Goles con su selección"},
  {k:"TOT", t:"Carrera", d:"Todos sus goles: clubes + selección"}
];
const SLOT_SYM = {ESP:"🇪🇸",ENG:"🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",ITA:"🇮🇹",FRA:"🇫🇷",GER:"🇩🇪"};
const SLOT_SVG = {
  UCL:'<path d="M24 6l3.6 7.4 8.1 1.2-5.9 5.7 1.4 8.1L24 24.6l-7.2 3.8 1.4-8.1-5.9-5.7 8.1-1.2z"/><path d="M10 34l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5zM38 34l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5z"/>',
  CLUB:'<path d="M16 7l5-2c1 3 5 3 6 0l5 2 9 7-4 7-4-2v22H15V19l-4 2-4-7z"/>',
  NT:'<path d="M12 6v38"/><path d="M12 8c8-4 14 4 24 0v18c-10 4-16-4-24 0"/>',
  TOT:'<circle cx="24" cy="24" r="17"/><path d="M24 16l7 5-2.7 8h-8.6L17 21z"/><path d="M24 16V7M31 21l8-3M28.3 29l5 7M19.7 29l-5 7M17 21l-8-3"/>'
};
const slotSym = k => SLOT_SYM[k] ? `<span class="sy flag" aria-hidden="true">${SLOT_SYM[k]}</span>` : `<svg class="sy" viewBox="0 0 48 48" aria-hidden="true">${SLOT_SVG[k]}</svg>`;
const slotVal = (p,k) => k==="UCL"?p.ucl : k==="NT"?p.nt : k==="CLUB"?p.g-p.nt : k==="TOT"?p.g : (p.gl[k]||0);
const LEVELS_1000 = [
  {t:1000, min:0, k:1, d:"Cualquier jugador de la base, uno por turno."},
  {t:2000, min:150, k:1, d:"Solo jugadores con 150+ goles, uno por turno."},
  {t:3000, min:250, k:2, d:"Jugadores con 250+ goles. Cada turno eliges entre 2."},
  {t:4000, min:300, k:4, d:"Jugadores con 300+ goles. Cada turno eliges entre 4."}
];
function reto(){
  let st, lv = store.get("reto:lv", 0);
  const fresh = () => { const L=LEVELS_1000[lv]; const pool=shuffle(P.map((p,i)=>i).filter(i=>P[i].g>=L.min));
    return {L, pool, k:0, fill:SLOTS.map(()=>null), total:0, cand:null, sel:null}; };
  const deal = () => { st.cand = st.pool.splice(0, st.L.k); st.sel = st.L.k===1 ? st.cand[0] : null; };
  const render = anim => {
    const L=st.L, id="reto-"+L.t, done = st.k>=SLOTS.length, win = st.total>=L.t;
    if(!done && !st.cand) deal();
    const started = st.k>0;
    app.innerHTML = top("Reto "+L.t, streakPill(id)) +
      `<div class="seg" role="group" aria-label="Objetivo">${LEVELS_1000.map((x,j)=>`<button class="${j===lv?"on":""}" data-lv="${j}">${x.t}</button>`).join("")}</div>
      <p class="rule">${L.d} Pon cada jugador en una casilla (solo cuentan esos goles) y suma <b>${L.t}+</b>.</p>
      <div class="board rb"><div class="rtop">${!done&&L.k===1?(()=>{const c=P[st.sel];return `<div class="rp fresh"><div class="pname one" style="--full:${c.n.length}">${esc(c.n)}</div><div class="nat">${natTxt(c.nat)} · ${POS[c.pos]}</div></div>`;})():`<div class="rp"><p class="cap">${done?"Final":`Jugador ${st.k+1}/${SLOTS.length}: ${st.sel==null?"elige uno":"elige casilla"}`}</p></div>`}
        <div class="score"><span class="big" id="tot">${anim?anim.from:st.total}</span><span class="of">/${L.t}</span></div></div>
      <div class="bar"><i style="width:${Math.min(100,st.total/L.t*100)}%"></i></div>
      ${!done&&L.k>1?`<div class="opts" id="cand">${st.cand.map(i=>`<button class="opt ${st.sel===i?"ok":""}" data-i="${i}">${esc(P[i].n)}<small>${natTxt(P[i].nat)} · ${POS[P[i].pos]}</small></button>`).join("")}</div>`:""}
      ${!done&&L.k===1?`<p class="cap rk">Jugador ${st.k+1} de ${SLOTS.length} · ¿dónde lo pones?</p>`:""}</div>
      ${done?resBox(win, win?"¡Reto superado!":"Te quedaste corto", win?`Sumaste ${st.total} goles.`:`Faltaron ${L.t-st.total} goles.`):""}
      <div class="opts" id="slots">${SLOTS.map((s,j)=>{ const f=st.fill[j];
        return f ? `<div class="opt sl sl-${s.k} filled${f.v>0?"":" zero"}${f.n?" new":""}">${slotSym(s.k)}<span class="st">${s.t}</span><b>${f.v}</b><small>${esc(P[f.i].n.split(" ").slice(-1)[0])}</small></div>`
          : `<button class="opt sl sl-${s.k}" data-j="${j}" ${done||st.sel==null?"disabled":""} title="${s.d}">${slotSym(s.k)}<span class="st">${s.t}</span></button>`; }).join("")}</div>
      ${done?`<div class="row" style="margin-top:14px"><button class="btn" id="again">Otra vez</button></div>`:""}`;
    bindBack();
    app.querySelectorAll("[data-lv]").forEach(b=>b.onclick=()=>{ lv=+b.dataset.lv; store.set("reto:lv",lv); st=fresh(); render(); });
    app.querySelectorAll("#cand button").forEach(b=>b.onclick=()=>{ st.sel=+b.dataset.i; render(); });
    app.querySelectorAll("#slots button").forEach(b=>b.onclick=()=>{
      if(st.sel==null) return;
      const j=+b.dataset.j, i=st.sel, v=slotVal(P[i],SLOTS[j].k), from=st.total;
      st.fill.forEach(f=>f&&(f.n=false)); st.fill[j]={i,v,n:true}; st.total+=v; st.k++; st.cand=null; st.sel=null;
      if(st.k>=SLOTS.length) bumpStreak(id, st.total>=L.t);
      render({from});
    });
    on("again",()=>{ st=fresh(); render(); });
    if(anim) countUp(document.getElementById("tot"), anim.from, st.total);
  };
  st=fresh(); render();
}
function countUp(el, from, to){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){ el.textContent=to; return; }
  const t0=performance.now(), dur=700;
  const step = t => { const k=Math.min(1,(t-t0)/dur); el.textContent=Math.round(from+(to-from)*(1-(1-k)**3)); if(k<1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- 4: goles exactos ---------- */
function exacto(){
  const id="exacto"; let st;
  const scorers = P.map((p,i)=>i).filter(i=>P[i].g>0);
  const gen = () => {
    for(;;){
      const k=3+Math.floor(Math.random()*3), sol=shuffle(scorers).slice(0,k), tot=sol.reduce((s,i)=>s+P[i].g,0);
      if(tot>=300 && tot<=1200) return {target:tot, left:tot, sol, tries:[], done:false};
    }
  };
  const render = () => {
    const best = store.get("best:exacto",null), used=st.tries.filter(t=>t.ok).length, fails=st.tries.length-used;
    const exactN = scorers.filter(i=>P[i].g===st.left && !st.tries.some(t=>t.i===i)).length;
    app.innerHTML = top("Goles exactos", best?`Récord <em>${best}</em> jug.`:"") +
      `<p class="rule">Di jugadores y se irán restando sus goles. Llega a <b>0 exacto</b> con el menor número de jugadores. Si uno se pasa, sale en rojo y no cuenta.</p>
      <div class="board"><p class="cap">${st.done?"¡Clavado!":"Te faltan"}</p><div class="big-n" id="left">${st.left}</div>
      <p class="cap">Objetivo ${st.target} · ${used} jugador${used===1?"":"es"} · ${fails} fallo${fails===1?"":"s"}</p>
      ${!st.done&&st.left>0?`<p class="hint">${exactN?`En la base hay ${exactN} jugador${exactN===1?"":"es"} con exactamente ${st.left} goles.`:`Nadie en la base tiene exactamente ${st.left} goles: necesitarás más de uno.`}</p>`:""}
      <div class="bar" style="margin-top:12px"><i style="width:${100-st.left/st.target*100}%"></i></div></div>
      <div id="res"></div><div id="srch"></div>
      <ul class="tries">${st.tries.slice().reverse().map(t=>`<li class="${t.ok?"ok":""}">${esc(P[t.i].n)} <small>${t.ok?`−${P[t.i].g} goles`:(P[t.i].g===0?"0 goles: no resta nada":`${P[t.i].g} goles: te pasas`)}</small></li>`).join("")}</ul>
      <div class="row" style="margin-top:14px">${st.done?`<button class="btn" id="next">Nuevo número</button>`:`<button class="btn ghost" id="give">Me rindo</button>`}</div>`;
    bindBack();
    if(st.done){
      document.getElementById("res").innerHTML = st.win ? resBox(true,`En ${used} jugadores`, `Con ${fails} fallo${fails===1?"":"s"}. Una solución posible era: ${st.sol.map(i=>`${esc(P[i].n)} (${P[i].g})`).join(" + ")}.`)
        : resBox(false,"Te rendiste", `Una solución posible: ${st.sol.map(i=>`${esc(P[i].n)} (${P[i].g})`).join(" + ")}.`);
    } else playerSearch(document.getElementById("srch"), pick, new Set(st.tries.map(t=>t.i)));
    on("next",()=>{ st=gen(); render(); });
    on("give",()=>{ st.done=true; st.win=false; render(); });
  };
  const pick = i => {
    const g=P[i].g, ok = g<=st.left && g>0;
    st.tries.push({i, ok});
    if(ok){ st.left-=g; if(st.left===0){ st.done=true; st.win=true; const n=st.tries.filter(t=>t.ok).length; const b=store.get("best:exacto",null); if(!b||n<b) store.set("best:exacto",n); } }
    render();
  };
  st=gen(); render();
}

/* ---------- motor común para adivinar un jugador secreto ---------- */
function guessGame(cfg){
  let st;
  const fresh = () => ({ti: cfg.pickTarget(), tries:[], done:false, win:false, ...(cfg.init?cfg.init():{})});
  const render = () => {
    const tp = P[st.ti];
    app.innerHTML = top(cfg.title, streakPill(cfg.id)) + `<p class="rule">${cfg.rule}</p>
      <div class="board" id="clue">${cfg.clues(st)}</div>
      <div id="res"></div><div id="srch"></div>${triesList(st.tries,false,cfg.id==="pistas"?0:cfg.max,st.done)}
      <div class="row" style="margin-top:14px">${st.done?`<button class="btn" id="next">Siguiente</button>`:`<button class="btn ghost" id="give">Me rindo</button>`}</div>`;
    bindBack();
    if(cfg.after) cfg.after(st);
    if(st.done) document.getElementById("res").innerHTML = resBox(st.win, st.win?`¡Era ${esc(tp.n)}!`:`Era ${esc(tp.n)}`, st.win?`Acertado en el intento ${st.tries.length}.`:"");
    else playerSearch(document.getElementById("srch"), pick, new Set(st.tries.map(t=>t.i)));
    on("next",()=>{ st=fresh(); render(); });
    on("give",()=>{ st.done=true; st.win=false; bumpStreak(cfg.id,false); render(); });
  };
  const pick = i => {
    const ok = i===st.ti; st.tries.push({i, ok});
    if(ok){ st.done=true; st.win=true; bumpStreak(cfg.id,true); }
    else if(st.tries.length>=cfg.max){ st.done=true; st.win=false; bumpStreak(cfg.id,false); }
    render();
  };
  st=fresh(); render();
}
const fails = st => st.tries.filter(t=>!t.ok).length;
const famous = minClubs => rnd(FAM.filter(i=>P[i].c.length>=(minClubs||1)));

/* ---------- 5: adivina por pistas ---------- */
function pistas(){
  guessGame({ id:"pistas", title:"Por pistas", max:6,
    rule:"Cada fallo desbloquea una pista nueva. Tienes 6 intentos.",
    pickTarget: () => famous(2),
    init: () => ({order:null}),
    clues: st => {
      const p=P[st.ti]; if(!st.order) st.order=shuffle(p.c);
      const o=st.order, ls=leaguesOf(p).map(ligaN);
      const list=[
        `Jugó en ${esc(clubN(o[0]))}`,
        `${p.g} goles en su carrera`,
        o[1]?`También jugó en ${esc(clubN(o[1]))}`:`${p.pj} partidos oficiales`,
        `${POS[p.pos]}, nacido en ${p.b}`,
        `Ha jugado en: ${ls.map(esc).join(", ")}${o.length>2?` · ${o.length} clubes en total`:""}`,
        `Nacionalidad: ${natTxt(p.nat)}`
      ];
      const shown = st.done ? list.length : Math.min(list.length, fails(st)+1);
      return `<ul class="clues cl6">${list.map((c,k)=>k<shown?`<li class="${k===shown-1&&!st.done?"new":""}"><i>${k+1}</i><span>${c}</span></li>`:`<li class="hid"><i>${k+1}</i><span>Se desbloquea si fallas</span></li>`).join("")}</ul>`;
    }
  });
}

/* ---------- 6: impostor ---------- */
function impostor(){
  const id="impostor"; let st;
  const fam = new Set(FAM), ALL = P.map((p,i)=>i);
  const plays = (p,l) => leaguesOf(p).includes(l);
  /* criterios futboleros, con peso: clubes y ligas salen más */
  const NUMS = [
    {w:1, mk:()=>{ const x=rnd([200,250,300,400]); return {label:`Todos tienen más de ${x} goles`, t:p=>p.g>x, out:p=>p.g<x*0.6, v:p=>`${p.g} goles`}; }},
    {w:1, mk:()=>({label:"Todos tienen 100 o más asistencias", t:p=>p.a!=null&&p.a>=100, out:p=>p.a!=null&&p.a<50, v:p=>p.a==null?"sin dato":`${p.a} asist.`})},
    {w:1, mk:()=>({label:"Todos tienen 20 o más títulos", t:p=>p.t>=20, out:p=>p.t<=8, v:p=>`${p.t} títulos`})},
    {w:1, mk:()=>({label:"Todos tienen 6 o más tarjetas rojas", t:p=>p.r>=6, out:p=>p.r<=1, v:p=>`${p.r} rojas`})},
    {w:1, mk:()=>({label:"Todos superan los 800 partidos", t:p=>p.pj>=800, out:p=>p.pj<500, v:p=>`${p.pj} partidos`})}
  ];
  const KINDS = [
    {w:4, mk:()=>{ const k=rnd(Object.keys(byClub).filter(k=>byClub[k].size>=8 && TOP5.includes(D.clubs[k].l)));
      return {label:`Todos han pasado por ${clubN(k)}`, t:p=>p.c.includes(k), out:p=>plays(p,D.clubs[k].l), v:p=>esc(p.c.includes(k)?clubN(k):`Nunca en ${clubN(k)}`)}; }},
    {w:3, mk:()=>{ const l=rnd(TOP5); return {label:`Todos han jugado en la ${ligaN(l)}`, t:p=>plays(p,l), v:p=>esc(plays(p,l)?"Sí":`Nunca en la ${ligaN(l)}`)}; }},
    {w:3, mk:()=>{ const n=rnd(Object.keys(D.nats).filter(n=>P.filter(p=>p.nat===n).length>=10));
      return {label:`Todos son de ${D.nats[n].n}`, t:p=>p.nat===n, v:p=>natTxt(p.nat)}; }},
    {w:2, mk:()=>{ const x=rnd(["DEF","MED","DEL"]); return {label:`Todos son ${POS[x].toLowerCase()}s`, t:p=>p.pos===x, v:p=>POS[p.pos]}; }},
    ...NUMS
  ];
  const pickKind = () => { const tot=KINDS.reduce((s,k)=>s+k.w,0); let r=Math.random()*tot; for(const k of KINDS){ if((r-=k.w)<0) return k.mk(); } return KINDS[0].mk(); };
  /* otro criterio que también deje a uno solo fuera haría el reto ambiguo */
  const ambiguous = (six, odd) => {
    const tests = [];
    new Set(six.flatMap(i=>P[i].c)).forEach(k=>tests.push(p=>p.c.includes(k)));
    TOP5.forEach(l=>tests.push(p=>plays(p,l)));
    new Set(six.map(i=>P[i].nat)).forEach(n=>tests.push(p=>p.nat===n));
    ["POR","DEF","MED","DEL"].forEach(x=>tests.push(p=>p.pos===x));
    return tests.some(t=>{ const outs=six.filter(i=>!t(P[i])); return outs.length===1 && outs[0]!==odd; });
  };
  const gen = () => {
    for(let t=0;t<400;t++){
      const c = pickKind();
      const inn = shuffle(ALL.filter(i=>c.t(P[i])&&fam.has(i)));
      const outs = ALL.filter(i=>!c.t(P[i]) && (c.out?c.out(P[i]):true) && fam.has(i));
      if(inn.length<5 || !outs.length) continue;
      const five = inn.slice(0,5), odd = rnd(outs), six=[...five, odd];
      if(ambiguous(six, odd)) continue;
      return {c, odd, opts:shuffle(six), pick:null};
    }
  };
  const render = () => {
    const done = st.pick!=null, win = st.pick===st.odd;
    app.innerHTML = top("Impostor", streakPill(id)) +
      `<p class="rule">Cinco de estos jugadores comparten algo. Toca al que <b>no</b> encaja. Un solo intento.</p>
      <div class="opts" id="imp">${st.opts.map(i=>{ const p=P[i]; const cls = done ? (i===st.odd?"ok":(i===st.pick?"bad":"")) : "";
        return `<button class="opt ${cls}" data-i="${i}" ${done?"disabled":""}>${esc(p.n)}<small>${done?st.c.v(p):flagOf(p)}</small></button>`; }).join("")}</div>
      <div style="margin-top:14px">${done?resBox(win, win?"¡Pillado!":"Ese no era", `${esc(st.c.label)}… menos ${esc(P[st.odd].n)}.`):""}</div>
      <div class="row">${done?`<button class="btn" id="next">Siguiente</button>`:""}</div>`;
    bindBack();
    app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ st.pick=+b.dataset.i; bumpStreak(id, st.pick===st.odd); render(); });
    on("next",()=>{ st=gen(); render(); });
  };
  st=gen(); render();
}

/* ---------- 7: comparador ---------- */
function comparador(){
  const id="comparador"; let st;
  const fresh = () => ({ti:rnd(FAM), tries:[], done:false, win:false});
  const num = (label, gv, tv, unit) => {
    if(gv==null||tv==null) return `<div class="cell n"><small>${label}</small>${gv==null?"?":gv} ${unit}</div>`;
    const cls = gv===tv ? "g" : (Math.abs(gv-tv) <= Math.max(2, tv*0.1) ? "o" : "");
    const arr = gv===tv ? "" : (tv>gv ? " ▲" : " ▼");
    return `<div class="cell ${cls}"><small>${label}</small>${gv} ${unit}${arr}</div>`;
  };
  const setCell = (label, gs, ts, nameFn) => {
    const inter = gs.filter(x=>ts.includes(x));
    const same = inter.length===gs.length && gs.length===ts.length;
    const cls = same ? "g" : (inter.length ? "o" : "");
    return `<div class="cell ${cls}"><small>${label}</small>${inter.length?inter.map(x=>esc(nameFn(x))).join(", "):"Ninguno"}</div>`;
  };
  const row = gi => {
    const g=P[gi], t=P[st.ti];
    const by = g.b===t.b ? "g" : (Math.abs(g.b-t.b)<=2 ? "o" : "");
    return `<li><b>${esc(g.n)} ${flagOf(g)}</b><div class="cells">
      <div class="cell ${g.nat===t.nat?"g":""}"><small>Nacionalidad</small>${esc(D.nats[g.nat].n)}</div>
      <div class="cell ${g.pos===t.pos?"g":""}"><small>Posición</small>${POS[g.pos]}</div>
      <div class="cell ${by}"><small>Nacimiento</small>${g.b}${g.b===t.b?"":(t.b>g.b?" ▲":" ▼")}</div>
      ${setCell("Ligas en común", leaguesOf(g), leaguesOf(t), ligaN)}
      ${setCell("Clubes en común", g.c, t.c, clubN)}
      ${num("Títulos", g.t, t.t, "")}
      ${num("Goles", g.g, t.g, "")}
      ${num("Asistencias", g.a, t.a, "")}
      ${num("Partidos", g.pj, t.pj, "")}
    </div></li>`;
  };
  const render = () => {
    const t=P[st.ti];
    const kc=[...new Set(st.tries.flatMap(i=>P[i].c.filter(c=>t.c.includes(c))))], kl=[...new Set(st.tries.flatMap(i=>leaguesOf(P[i]).filter(l=>leaguesOf(t).includes(l))))];
    app.innerHTML = top("Comparador", streakPill(id)) +
      `<p class="rule">Di un jugador y verás qué comparte con el secreto. <b>Verde</b> igual, <b>naranja</b> cerca o en parte, <b>rojo</b> no. ▲ el secreto tiene más (o nació después), ▼ menos.</p>
      <div class="board"><div class="player">${st.done?photo(t):`<div class="photo hueco"><span>?</span></div>`}${st.done?pn(t):pn(null,"¿Quién es?")}</div>
      <p class="known">Clubes confirmados: <b>${kc.length?kc.map(c=>esc(clubN(c))).join(", "):"—"}</b><br>Ligas confirmadas: <b>${kl.length?kl.map(l=>esc(ligaN(l))).join(", "):"—"}</b></p></div>
      <div id="res">${st.done?resBox(st.win, st.win?`¡Era ${esc(t.n)}!`:`Era ${esc(t.n)}`, st.win?`En ${st.tries.length} intento${st.tries.length===1?"":"s"}.`:""):""}</div>
      <div id="srch"></div><ul class="cmp">${st.tries.slice().reverse().map(row).join("")}</ul>
      <div class="row" style="margin-top:14px">${st.done?`<button class="btn" id="next">Siguiente</button>`:`<button class="btn ghost" id="give">Me rindo</button>`}</div>`;
    bindBack();
    if(!st.done) playerSearch(document.getElementById("srch"), i=>{ st.tries.push(i); if(i===st.ti){ st.done=true; st.win=true; bumpStreak(id,true);} render(); }, new Set(st.tries));
    on("next",()=>{ st=fresh(); render(); });
    on("give",()=>{ st.done=true; st.win=false; bumpStreak(id,false); render(); });
  };
  st=fresh(); render();
}

/* ---------- imagen pixelada (cuando haya foto) ---------- */
function drawPixel(cv, url, cells, tiles){
  const img=new Image(); img.onload=()=>{
    const W=cv.width, H=cv.height, x=cv.getContext("2d");
    const sw2=Math.max(1,Math.round(cells)), sh=Math.max(1,Math.round(cells*H/W));
    const tmp=document.createElement("canvas"); tmp.width=sw2; tmp.height=sh;
    tmp.getContext("2d").drawImage(img,0,0,sw2,sh);
    x.imageSmoothingEnabled=false; x.drawImage(tmp,0,0,W,H);
    if(tiles){ tiles.forEach(k=>{ const tx=(k%3)*W/3, ty=Math.floor(k/3)*H/3; x.drawImage(img, img.width*(k%3)/3, img.height*Math.floor(k/3)/3, img.width/3, img.height/3, tx, ty, W/3, H/3); }); }
  }; img.src=url;
}

/* ---------- 8: jugador oculto ---------- */
function oculto(){
  const LEVELS=[5,8,12,18,28,44];
  guessGame({ id:"oculto", title:"Jugador oculto", max:6,
    rule:"Adivina el jugador. Cada fallo destapa más. Tienes 6 intentos.",
    pickTarget: () => famous(1),
    init: () => ({ord:null}),
    clues: st => {
      const p=P[st.ti], f=fails(st);
      if(fotoDe(p)) return `<canvas class="cv" id="cv" width="200" height="240"></canvas>`;
      if(!st.ord) st.ord=shuffle([...p.n].map((ch,k)=>k).filter(k=>/[\p{L}\p{N}]/u.test(p.n[k])));
      const show = st.done ? st.ord.length : Math.round(st.ord.length*[0,.15,.3,.45,.6,.72][Math.min(f,5)]);
      const vis=new Set(st.ord.slice(0,show));
      const mask=[...p.n].map((ch,k)=>/[\p{L}\p{N}]/u.test(ch)?(vis.has(k)?esc(ch.toUpperCase()):"_"):(ch===" "?" ":esc(ch))).join("");
      const facts=[POS[p.pos]]; if(f>=1||st.done) facts.push(natTxt(p.nat)); if(!st.club) st.club=rnd(p.c); if(f>=3||st.done) facts.push(esc(clubN(st.club))); if(f>=4||st.done) facts.push(`Nacido en ${p.b}`);
      return `<div class="mask" aria-label="Nombre oculto">${mask}</div><div class="facts">${facts.map(x=>`<span>${x}</span>`).join("")}</div>`;
    },
    after: st => { const p=P[st.ti], cv=document.getElementById("cv"); if(cv&&fotoDe(p)) drawPixel(cv, fotoDe(p), st.done?200:LEVELS[Math.min(fails(st),5)]); }
  });
}

/* ---------- 9: cuadrícula 3x3 (cruces de club / nacionalidad) ---------- */
function cuadricula(){
  const id="cuadricula"; let st;
  const bigClubs = Object.keys(byClub).filter(k=>byClub[k].size>=12);
  const bigNats = Object.keys(D.nats).filter(n=>P.filter(p=>p.nat===n).length>=15);
  const mkClub = k => ({key:"c:"+k, t:p=>p.c.includes(k), h:`<span class="kitc" style="${kitStyle(k)}">${esc(clubN(k))}</span>`, txt:clubN(k)});
  const mkNat = n => ({key:"n:"+n, t:p=>p.nat===n, h:`<span class="fl flag">${D.nats[n].f}</span><span>${esc(D.nats[n].n)}</span>`, txt:D.nats[n].n});
  const answers = (r,c) => P.map((p,i)=>i).filter(i=>r.t(P[i])&&c.t(P[i]));
  const gen = () => {
    for(let t=0;t<3000;t++){
      const cols = shuffle(bigClubs).slice(0,3).map(mkClub);
      const nNat = Math.floor(Math.random()*3); /* 0-2 filas de nacionalidad */
      const rowClubs = shuffle(bigClubs.filter(k=>!cols.some(c=>c.key==="c:"+k))).slice(0,3-nNat).map(mkClub);
      const rows = shuffle([...rowClubs, ...shuffle(bigNats).slice(0,nNat).map(mkNat)]);
      const ans = rows.map(r=>cols.map(c=>answers(r,c)));
      if(ans.every(row=>row.every(a=>a.length>=2))) return {rows, cols, ans, cell:Array(9).fill(null), left:9, sel:null, done:false};
    }
  };
  const render = () => {
    const filled = st.cell.filter(x=>x!=null).length;
    app.innerHTML = top("Cuadrícula 3x3", streakPill(id)) +
      `<p class="rule">Rellena cada casilla con un jugador que cumpla su fila <b>y</b> su columna. No puedes repetir jugadores. Tienes <b>9 intentos</b> para las 9 casillas.</p>
      <div class="xg">
        <div class="xh xc"><b>${st.done?filled+"/9":st.left}</b><small>${st.done?"aciertos":"intentos"}</small></div>
        ${st.cols.map(c=>`<div class="xh">${c.h}</div>`).join("")}
        ${st.rows.map((r,ri)=>`<div class="xh">${r.h}</div>`+st.cols.map((c,ci)=>{ const k=ri*3+ci, v=st.cell[k];
          if(v!=null) return `<div class="xcell ok${k===st.last?" new":""}">${esc(P[v].n)}</div>`;
          if(st.done) return `<div class="xcell miss"><small>p.ej.</small>${esc(P[st.ans[ri][ci][0]].n)}</div>`;
          return `<button class="xcell ${st.sel===k?"sel":""}" data-k="${k}" aria-label="${esc(r.txt)} y ${esc(c.txt)}">${st.sel===k?"Elige…":"+"}</button>`; }).join("")).join("")}
      </div>
      <div id="res">${st.done?resBox(filled===9, filled===9?"¡Cuadrícula completa!":`${filled} de 9`, filled===9?"":"Las casillas vacías muestran una respuesta posible."):""}</div>
      <div id="srch">${!st.done&&st.sel==null?`<p class="cap">Toca una casilla para rellenarla.</p>`:""}</div>
      <p class="hint" id="msg"></p>
      <div class="row" style="margin-top:14px">${st.done?`<button class="btn" id="next">Nueva cuadrícula</button>`:`<button class="btn ghost" id="give">Terminar</button>`}</div>`;
    bindBack();
    app.querySelectorAll(".xcell[data-k]").forEach(b=>b.onclick=()=>{ st.sel=+b.dataset.k; render(); });
    if(!st.done && st.sel!=null){
      const used=new Set(st.cell.filter(x=>x!=null));
      playerSearch(document.getElementById("srch"), i=>{
        const k=st.sel, r=st.rows[Math.floor(k/3)], c=st.cols[k%3], ok=r.t(P[i])&&c.t(P[i]);
        st.left--; let msg="";
        if(ok){ st.cell[k]=i; st.last=k; st.sel=null; } else { st.last=null; msg=`${P[i].n} no cumple ${!r.t(P[i])?r.txt:c.txt}.`; }
        if(st.left<=0 || st.cell.every(x=>x!=null)){ st.done=true; bumpStreak(id, st.cell.every(x=>x!=null)); }
        render(); if(msg) document.getElementById("msg").textContent=msg;
      }, used).focus();
    }
    on("next",()=>{ st=gen(); render(); });
    on("give",()=>{ st.done=true; bumpStreak(id,false); render(); });
  };
  st=gen(); render();
}

/* ---------- 10: colores ---------- */
let SHN=0;
const shield = (k, cls) => { const cs=D.clubs[k].col, id="sh"+(++SHN), w=100/cs.length;
  return `<svg class="${cls||"shd"}" viewBox="0 0 100 118" aria-hidden="true"><defs><clipPath id="${id}"><path d="M50 3 92 14v40c0 30-18 50-42 61C26 104 8 84 8 54V14z"/></clipPath></defs><g clip-path="url(#${id})">${cs.map((c,j)=>`<rect x="${j*w}" y="0" width="${w+.5}" height="118" fill="${COL[c]||"#888"}"/>`).join("")}</g><path d="M50 3 92 14v40c0 30-18 50-42 61C26 104 8 84 8 54V14z" fill="none" stroke="#17140f" stroke-width="4"/></svg>`; };

function colores(){
  const id="colores"; let st;
  const pool = CK.filter(k=>TOP5.includes(D.clubs[k].l) && baseCols(k).length>=2);
  const soloCol = k => D.clubs[k].solo ? (BASE[D.clubs[k].solo]||D.clubs[k].solo) : null;
  const soloPool = CK.filter(k=>TOP5.includes(D.clubs[k].l) && D.clubs[k].solo);
  const gen = () => {
    if(Math.random()<0.3){
      const c = soloCol(rnd(soloPool));
      return {cs:[c], one:true, ans:new Set(CK.filter(k=>soloCol(k)===c)), tries:[], done:false};
    }
    const k=rnd(pool), cs=shuffle(baseCols(k)).slice(0,2);
    const ans = CK.filter(c=>{ const b=matchCols(c); return cs.every(x=>b.includes(x)); });
    return {cs, one:false, ans:new Set(ans), tries:[], done:false};
  };
  const render = () => {
    app.innerHTML = top("Colores", streakPill(id)) +
      `<p class="rule">${st.one?"Un solo color: di un equipo que se identifique <b>solo con este color</b> (como el Liverpool con el rojo).":"Di un equipo que tenga <b>estos dos colores</b> como seña de identidad."} Cuenta el color base: celeste vale como azul. Tres intentos.</p>
      <div class="board"><div class="colors" style="${st.one?"grid-template-columns:minmax(0,1fr)":""}">${st.cs.map(c=>`<div style="background:${COL[c]};color:${["blanco","amarillo","rosa"].includes(c)?"#111":"#fff"}">${c[0].toUpperCase()+c.slice(1)}</div>`).join("")}</div></div>
      <div id="res"></div><div id="srch"></div>
      <ul class="ctries">${st.tries.map((t,j)=>{ const cols=baseCols(t.k), solo=soloCol(t.k);
        const light=c=>["blanco","amarillo","rosa","celeste","dorado"].includes(c);
        const seg=(c,hit,label)=>`<i class="${hit?"hit":"miss"}" style="background:${COL[c]||"#888"};color:${light(c)?"#111":"#fff"}"><em>${label}</em><u>${hit?"✓":"✕"}</u></i>`;
        const chips = `<span class="scarf">${st.one ? (solo?seg(solo,solo===st.cs[0],"Solo "+solo):cols.map(c=>seg(c,false,c)).join("")) : cols.map(c=>seg(c,colHit(t.k,c,st.cs),c)).join("")}</span>${st.one&&!solo?`<span class="scnote">Sin color único</span>`:""}`;
        return `<li class="${t.ok?"ok":"bad"}${j===st.tries.length-1?" new":""}">${shield(t.k)}<div><b>${esc(clubN(t.k))}</b>${chips}</div><span class="cmark">${t.ok?"✓":"✗"}</span></li>`; }).join("")}</ul>
      <div class="row" style="margin-top:14px">${st.done?`<button class="btn" id="next">Siguiente</button>`:`<button class="btn ghost" id="give">Me rindo</button>`}</div>`;
    bindBack();
    if(st.done){ const o=shuffle([...st.ans].filter(k=>!st.tries.some(t=>t.k===k))); document.getElementById("res").innerHTML = resBox(st.win, st.win?"¡Bien visto!":"Fallado", st.win?"":(o.length?`Por ejemplo, valía ${esc(clubN(o[0]))}.`:"")); }
    else clubSearch(document.getElementById("srch"), k=>{ const ok=st.ans.has(k); st.tries.push({k,ok}); if(ok){st.done=true;st.win=true;bumpStreak(id,true);} else if(st.tries.length>=3){st.done=true;st.win=false;bumpStreak(id,false);} render(); }, new Set(st.tries.map(t=>t.k)));
    on("next",()=>{ st=gen(); render(); });
    on("give",()=>{ st.done=true; st.win=false; bumpStreak(id,false); render(); });
  };
  st=gen(); render();
}

/* ---------- router ---------- */
/* ---------- multijugador local ----------
   · "A gritar": todos ven la misma pantalla, quien lo sabe lo grita y lo escribe; si el juego lo da por bueno, se elige quién se lleva el punto.
   · "Duelo por turnos" (Goles exactos): todas las partidas a la vez, una junto a otra, y turnos alternos. Gana quien clave el 0 en menos jugadores. */
const SHOUT = ["compatriota","conexion","pistas","oculto","colores","comparador","impostor"];
const DUEL = ["exacto"];
let PARTY = store.get("party", null);
if(PARTY && !PARTY.v2) PARTY = null;
const saveParty = () => store.set("party", PARTY);
const partyOn = () => PARTY && PARTY.active;
const curGame = () => GAMES.find(g=>g.id===PARTY.order[PARTY.r]);
const sheetOff = () => { const s=document.getElementById("sheet"); if(s) s.remove(); document.body.classList.remove("pdone"); };
const nextRound = () => { sheetOff(); PARTY.r++; PARTY.playing=false; saveParty(); location.hash = PARTY.r>=PARTY.rounds ? "fiesta-fin" : "fiesta-turno"; };
const showSheet = (cls, html) => { sheetOff(); document.body.classList.add("pdone"); const d=document.createElement("div"); d.id="sheet"; d.className="sheet "+cls; d.innerHTML=`<div class="sh-bg"></div><div class="sh-in">${html}</div>`; document.body.appendChild(d); return d; };
const award = (idxs) => { idxs.forEach(i=>{ PARTY.players[i].s++; }); PARTY.players.forEach((p,i)=>p.h.push(idxs.includes(i)?1:0)); saveParty(); };
const partyResult = (id, win) => {
  if(!partyOn() || !PARTY.playing || id!==PARTY.order[PARTY.r]) return false;
  PARTY.playing=false; saveParty();
  const last = PARTY.r===PARTY.rounds-1, nxt = last?"Ver clasificación":"Siguiente ronda";
  setTimeout(()=>{
    if(win){
      const d=showSheet("ok", `<span class="sh-ic">✓</span><div class="sh-tx"><b>¡Correcto!</b><small>¿Quién lo ha dicho primero?</small></div>
        <div class="who">${PARTY.players.map((p,i)=>`<button data-w="${i}">${esc(p.n)}</button>`).join("")}</div>`);
      d.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{ award([+b.dataset.w]); const p=PARTY.players[+b.dataset.w];
        showSheet("ok", `<span class="sh-ic">✓</span><div class="sh-tx"><b>Punto para ${esc(p.n)}</b><small>${p.s} punto${p.s===1?"":"s"}</small></div><button class="btn" id="shgo">${nxt}</button>`);
        document.getElementById("shgo").onclick=nextRound; });
    } else {
      award([]);
      showSheet("bad", `<span class="sh-ic">✕</span><div class="sh-tx"><b>Nadie puntúa</b><small>Esta ronda queda desierta</small></div><button class="btn" id="shgo">${nxt}</button>`);
      document.getElementById("shgo").onclick=nextRound;
    }
  }, 250);
  return true;
};
function partySetup(){
  const prev = store.get("party-cfg2", {names:["",""], games:[...SHOUT,...DUEL], rounds:5});
  let names = prev.names.slice(), games = new Set(prev.games), rounds = prev.rounds;
  const chip = g => `<button data-g="${g.id}" class="${games.has(g.id)?"on":""}" style="--cb:${CARD_KIT[g.id][0]};--cf:${CARD_KIT[g.id][1]}">${esc(g.t)}</button>`;
  const render = () => {
    app.innerHTML = top("Multijugador", "") + `
      <h3 class="ph">Jugadores</h3>
      <div class="plist">${names.map((n,i)=>`<div class="pl"><span class="pn-no">${i+1}</span><input data-i="${i}" maxlength="14" placeholder="Jugador ${i+1}" value="${esc(n)}" autocomplete="off">${names.length>2?`<button class="x" data-x="${i}" aria-label="Quitar">✕</button>`:""}</div>`).join("")}</div>
      ${names.length<8?`<button class="btn ghost addp" id="addp">+ Añadir jugador</button>`:""}
      <h3 class="ph">Rondas</h3>
      <div class="seg">${[3,5,10].map(r=>`<button data-r="${r}" class="${r===rounds?"on":""}">${r}</button>`).join("")}</div>
      <h3 class="ph">A gritar <small>quien lo sepa lo grita y lo escribe</small></h3>
      <div class="gpick">${GAMES.filter(g=>SHOUT.includes(g.id)).map(chip).join("")}</div>
      <h3 class="ph">Duelo por turnos <small>todos a la vez, en pantalla dividida</small></h3>
      <div class="gpick">${GAMES.filter(g=>DUEL.includes(g.id)).map(chip).join("")}</div>
      <div class="row" style="margin-top:18px"><button class="btn" id="go" ${games.size?"":"disabled"}>Empezar partida</button></div>`;
    bindBack();
    app.querySelectorAll(".pl input").forEach(el=>el.oninput=()=>{ names[+el.dataset.i]=el.value; });
    app.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>{ names.splice(+b.dataset.x,1); render(); });
    on("addp",()=>{ names.push(""); render(); const ins=app.querySelectorAll(".pl input"); ins[ins.length-1].focus(); });
    app.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{ rounds=+b.dataset.r; render(); });
    app.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{ const id=b.dataset.g; games.has(id)?games.delete(id):games.add(id); render(); });
    on("go",()=>{
      const pls = names.map((n,i)=>({n:(n.trim()||`Jugador ${i+1}`), s:0, h:[]}));
      store.set("party-cfg2",{names, games:[...games], rounds});
      const pool=[...games], order=[]; let bag=[];
      for(let r=0;r<rounds;r++){ if(!bag.length) bag=shuffle(pool.slice()); order.push(bag.pop()); }
      PARTY={v2:true, active:true, players:pls, rounds, order, r:0, playing:false}; saveParty();
      location.hash="fiesta-turno";
    });
  };
  render();
}
function partyTurn(){
  sheetOff();
  if(!partyOn()){ location.hash="fiesta"; return; }
  if(PARTY.r>=PARTY.rounds){ location.hash="fiesta-fin"; return; }
  const g=curGame(), [cb,cf]=CARD_KIT[g.id], duel=DUEL.includes(g.id);
  app.innerHTML = top("Multijugador", `Ronda <em>${PARTY.r+1}</em>/${PARTY.rounds}`) + `
    <div class="turn" style="--cb:${cb};--cf:${cf}">
      <p class="t-k">Ronda ${PARTY.r+1} · ${duel?"Duelo por turnos":"A gritar"}</p>
      <div class="t-g big"><svg viewBox="0 0 48 48" aria-hidden="true">${ICONS[g.ic]}</svg><div><b>${esc(g.t)}</b><small>${esc(g.s)}</small></div></div>
      <p class="t-r">${duel?"Mismo número para todos. Por turnos, cada uno dice un jugador y se restan sus goles. Gana quien clave el 0 con menos jugadores.":"Mirad todos la pantalla. Quien lo sepa, que lo grite y lo escriba. Si es correcto, elegís quién se lleva el punto."}</p>
      <button class="btn t-go" id="go">¡Vamos!</button>
    </div>
    <ol class="mini-rank">${PARTY.players.map(p=>`<li><span>${esc(p.n)}</span><b>${p.s}</b></li>`).join("")}</ol>
    <div class="row" style="margin-top:14px"><button class="btn ghost" id="quit">Terminar partida</button></div>`;
  bindBack();
  on("go",()=>{ PARTY.playing=true; saveParty(); location.hash = duel ? "fiesta-duelo" : g.id; });
  on("quit",()=>{ location.hash="fiesta-fin"; });
}
function partyDuel(){
  sheetOff();
  if(!partyOn() || PARTY.order[PARTY.r]!=="exacto"){ location.hash = partyOn()?"fiesta-turno":"fiesta"; return; }
  const scorers = P.map((p,i)=>i).filter(i=>P[i].g>0);
  let tgt; for(;;){ const k=3+Math.floor(Math.random()*3), sol=shuffle(scorers).slice(0,k); tgt=sol.reduce((s,i)=>s+P[i].g,0); if(tgt>=300&&tgt<=1200) break; }
  const n=PARTY.players.length, st={tgt, left:Array(n).fill(tgt), tries:PARTY.players.map(()=>[]), turn:0, over:false};
  const used = new Set();
  const steps = i => st.tries[i].length;
  const render = () => {
    const [cb,cf]=CARD_KIT.exacto;
    app.innerHTML = top("Duelo · Goles exactos", `Ronda <em>${PARTY.r+1}</em>/${PARTY.rounds}`) + `
      <p class="rule">Objetivo <b>${st.tgt}</b>. Por turnos: di un jugador y se restan sus goles. Si te pasas, no cuenta pero gastas turno.</p>
      <div class="duel d${Math.min(n,4)}" style="--cb:${cb};--cf:${cf}">${PARTY.players.map((p,i)=>`
        <section class="dp ${i===st.turn&&!st.over?"on":""} ${st.left[i]===0?"win":""}">
          <header><span class="dn">${esc(p.n)}</span><span class="ds">${steps(i)} jug.</span></header>
          <div class="dl">${st.left[i]}</div>
          <div class="dbar"><i style="width:${100-st.left[i]/st.tgt*100}%"></i></div>
          <ol class="dt">${st.tries[i].slice().reverse().map(t=>`<li class="${t.ok?"":"x"}"><span>${esc(P[t.i].n)}</span><b>${t.ok?"−"+P[t.i].g:"✕"}</b></li>`).join("")}</ol>
        </section>`).join("")}</div>
      ${st.over?"":`<p class="dturn">Turno de <b>${esc(PARTY.players[st.turn].n)}</b></p><div id="srch"></div>
      <div class="row" style="margin-top:12px"><button class="btn ghost" id="give">Terminar duelo</button></div>`}`;
    bindBack();
    if(!st.over) playerSearch(document.getElementById("srch"), pick, used);
    on("give",()=>finish(true));
  };
  const finish = (forced) => {
    st.over=true; render();
    let winners = PARTY.players.map((_,i)=>i).filter(i=>st.left[i]===0);
    if(forced && !winners.length){ const m=Math.min(...st.left); winners=PARTY.players.map((_,i)=>i).filter(i=>st.left[i]===m && m<st.tgt); }
    PARTY.playing=false; award(winners); const last=PARTY.r===PARTY.rounds-1;
    const names=winners.map(i=>esc(PARTY.players[i].n)).join(" y ");
    showSheet(winners.length?"ok":"bad", `<span class="sh-ic">${winners.length?"✓":"✕"}</span><div class="sh-tx"><b>${winners.length?`Punto para ${names}`:"Nadie puntúa"}</b><small>${winners.length&&!forced?`Clavado con ${steps(winners[0])} jugador${steps(winners[0])===1?"":"es"}`:winners.length?"El más cerca del 0":"Duelo sin ganador"}</small></div><button class="btn" id="shgo">${last?"Ver clasificación":"Siguiente ronda"}</button>`);
    document.getElementById("shgo").onclick=nextRound;
  };
  const pick = i => {
    const t=st.turn, g=P[i].g, ok=g<=st.left[t];
    used.add(i); st.tries[t].push({i,ok}); if(ok) st.left[t]-=g;
    // siguiente jugador que no haya terminado; al cerrar la vuelta, si alguien clavó el 0 se acaba
    const roundDone = PARTY.players.every((_,j)=>st.left[j]===0 || steps(j)>=steps(t));
    if(roundDone && st.left.some(x=>x===0)) return finish(false);
    let nx=t; for(let k=0;k<n;k++){ nx=(nx+1)%n; if(st.left[nx]>0) break; }
    st.turn=nx; render();
  };
  render();
}
function partyEnd(){
  sheetOff();
  if(!PARTY){ location.hash=""; return; }
  const rk = PARTY.players.map((p,i)=>({...p,i})).sort((a,b)=>b.s-a.s);
  const medal=["🥇","🥈","🥉"];
  let place=0; rk.forEach((p,k)=>{ if(k===0||p.s<rk[k-1].s) place=k; p.pl=place; });
  app.innerHTML = top("Clasificación", "") + `
    <div class="podium"><p class="t-k">${rk.filter(p=>p.pl===0).length>1?"Empate en cabeza":"Gana"}</p>
      <h2 class="fit"><span class="fit-in">${rk.filter(p=>p.pl===0).map(p=>esc(p.n)).join(" y ")}</span></h2><p class="t-k">${rk[0].s} punto${rk[0].s===1?"":"s"}</p></div>
    <ol class="rank">${rk.map(p=>`<li><span class="m">${p.pl<3?`<span class="flag">${medal[p.pl]}</span>`:p.pl+1}</span><span class="n">${esc(p.n)}</span><span class="hs">${p.h.map(x=>`<i class="${x?"y":""}"></i>`).join("")}</span><b>${p.s}</b></li>`).join("")}</ol>
    <div class="row" style="margin-top:16px"><button class="btn" id="again">Revancha</button><button class="btn ghost" id="out">Salir</button></div>`;
  bindBack();
  on("again",()=>{ PARTY.players.forEach(p=>{p.s=0;p.h=[];}); const pool=[...new Set(PARTY.order)]; let bag=[]; PARTY.order=PARTY.order.map(()=>{ if(!bag.length) bag=shuffle(pool.slice()); return bag.pop(); }); PARTY.r=0; PARTY.active=true; PARTY.playing=false; saveParty(); location.hash="fiesta-turno"; });
  on("out",()=>{ PARTY=null; store.set("party",null); location.hash=""; });
  PARTY.active=false; saveParty();
}
/* ---------- multijugador ONLINE (P2P cifrado con PeerJS, sala por código) ----------
   Seguridad: el anfitrión es la autoridad (lleva puntos, turnos y rondas); los invitados solo envían intenciones,
   que el anfitrión valida (tipo, tamaño, ritmo, turno, ronda). Todo texto ajeno se escapa. WebRTC va cifrado (DTLS). */
const ONL_ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", ONL_PREFIX = "formidablefut-v1-";
let ONL = null, ONL_SEED = null;
const onlAvail = () => typeof window.Peer === "function";
const peerOpts = () => Object.assign({debug:0, config:{iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]}}, window.FFUT_PEER||{});
const mkCode = () => { const a=new Uint32Array(6); crypto.getRandomValues(a); return [...a].map(x=>ONL_ALPHA[x%ONL_ALPHA.length]).join(""); };
const mkSeed = () => { const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]; };
const mulberry = a => () => { a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
const cleanName = n => String(n||"").replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g,"").trim().slice(0,14);
const DATA_SIG = () => P.length+"-"+CK.length+"-"+P.reduce((s,p)=>s+(p.g||0),0);
const onlSend = (conn, m) => { try{ if(conn && conn.open) conn.send(m); }catch(e){} };
const onlBroadcast = m => { if(!ONL||ONL.role!=="host") return; ONL.conns.forEach(c=>onlSend(c, m)); onlHandle(m, true); };
const onlPublic = () => ONL.players.map(p=>({n:p.n, s:p.s, on:p.on, h:p.h}));
function onlLeave(msg){
  if(ONL){ try{ if(ONL.role==="host") ONL.conns.forEach(c=>{ onlSend(c,{t:"closed"}); c.close(); }); else if(ONL.conn) ONL.conn.close(); ONL.peer.destroy(); }catch(e){} }
  ONL=null; document.body.classList.remove("inparty"); sheetOff();
  if(msg) store.set("onl-msg", msg);
  location.hash="online";
}
/* ---- anfitrión ---- */
function onlHost(name){
  const code=mkCode();
  ONL={role:"host", code, me:0, players:[{n:name, s:0, on:true, h:[]}], conns:new Map(), cfg:store.get("onl-cfg",{rounds:5, games:[...SHOUT,...DUEL]}), r:-1, started:false, rate:new Map()};
  const peer = new Peer(ONL_PREFIX+code.toLowerCase(), peerOpts()); ONL.peer=peer;
  peer.on("open", ()=>{ location.hash="online-sala"; route(); });
  peer.on("error", e=>{ if(e && e.type==="unavailable-id") { onlLeave("Ese código ya está en uso, prueba otra vez."); } else if(!ONL||!ONL.started) onlLeave("No se pudo crear la sala ("+(e&&e.type||"error")+")."); });
  peer.on("connection", conn=>{
    conn.on("open", ()=>{ if(!ONL) return conn.close(); });
    conn.on("data", raw=>onlHostRecv(conn, raw));
    conn.on("close", ()=>{ if(!ONL) return; const i=conn._pidx; if(i!=null && ONL.players[i]){ ONL.players[i].on=false; ONL.conns.delete(i); onlBroadcast({t:"lobby", players:onlPublic(), cfg:ONL.cfg}); onlCheckRaceEnd(); onlDuelSkip(); } });
  });
}
function onlHostRecv(conn, m){
  if(!ONL || typeof m!=="object" || !m || typeof m.t!=="string") return;
  const now=Date.now(), b=ONL.rate.get(conn)||[]; const recent=b.filter(x=>now-x<10000); recent.push(now); ONL.rate.set(conn,recent);
  if(recent.length>30) { onlSend(conn,{t:"closed", why:"Demasiados mensajes"}); return conn.close(); }
  if(m.t==="hello"){
    if(conn._pidx!=null) return;
    if(ONL.started) { onlSend(conn,{t:"closed", why:"La partida ya ha empezado"}); return setTimeout(()=>conn.close(),300); }
    if(m.sig!==DATA_SIG()) { onlSend(conn,{t:"closed", why:"Versión distinta: recarga la página"}); return setTimeout(()=>conn.close(),300); }
    if(ONL.players.filter(p=>p.on).length>=8) { onlSend(conn,{t:"closed", why:"La sala está llena"}); return setTimeout(()=>conn.close(),300); }
    let n=cleanName(m.name)||"Jugador"; const taken=new Set(ONL.players.map(p=>p.n.toLowerCase())); let k=2, base=n; while(taken.has(n.toLowerCase())) n=(base.slice(0,11)+" "+k++);
    const idx=ONL.players.push({n, s:0, on:true, h:[]})-1; conn._pidx=idx; ONL.conns.set(idx, conn);
    onlSend(conn,{t:"welcome", you:idx, code:ONL.code});
    onlBroadcast({t:"lobby", players:onlPublic(), cfg:ONL.cfg});
    return;
  }
  const i=conn._pidx; if(i==null) return;
  if(m.t==="win"||m.t==="out") return onlRaceEvent(i, m.t, m.r);
  if(m.t==="pick") return onlDuelPick(i, m.r, m.i);
  if(m.t==="bye") return conn.close();
}
function onlStart(){
  if(!ONL||ONL.role!=="host") return;
  const pool=ONL.cfg.games.slice(); if(!pool.length) return;
  let bag=[]; ONL.order=[]; for(let r=0;r<ONL.cfg.rounds;r++){ if(!bag.length) bag=shuffle(pool.slice()); ONL.order.push(bag.pop()); }
  ONL.started=true; ONL.players.forEach(p=>{p.s=0;p.h=[];});
  onlNextRound(0);
}
function onlNextRound(r){
  if(r>=ONL.cfg.rounds) return onlBroadcast({t:"final", players:onlPublic()});
  const game=ONL.order[r], seed=mkSeed();
  ONL.round={r, game, out:new Set(), over:false};
  if(DUEL.includes(game)){
    const rng=mulberry(seed), sc=P.map((p,i)=>i).filter(i=>P[i].g>0); let tgt;
    const sh=a=>{ a=a.slice(); for(let j=a.length-1;j>0;j--){ const k=Math.floor(rng()*(j+1)); [a[j],a[k]]=[a[k],a[j]]; } return a; };
    for(;;){ const k=3+Math.floor(rng()*3); tgt=sh(sc).slice(0,k).reduce((s,i)=>s+P[i].g,0); if(tgt>=300&&tgt<=1200) break; }
    const on=ONL.players.map(p=>p.on);
    ONL.duel={r, tgt, left:ONL.players.map(()=>tgt), tries:ONL.players.map(()=>[]), used:[], turn:on.indexOf(true), over:false, win:[]};
    onlBroadcast({t:"round", r, rounds:ONL.cfg.rounds, game, seed, players:onlPublic()});
    onlBroadcast({t:"duel", d:ONL.duel});
  } else onlBroadcast({t:"round", r, rounds:ONL.cfg.rounds, game, seed, players:onlPublic()});
}
function onlRaceEvent(i, kind, r){
  const R=ONL.round; if(!R || R.over || r!==R.r || DUEL.includes(R.game)) return;
  if(kind==="win"){ R.over=true; onlAward([i]); onlBroadcast({t:"end", r, win:[i], players:onlPublic()}); }
  else { R.out.add(i); onlCheckRaceEnd(); }
}
function onlCheckRaceEnd(){
  const R=ONL&&ONL.round; if(!R||R.over||DUEL.includes(R.game)) return;
  if(ONL.players.every((p,i)=>!p.on||R.out.has(i))){ R.over=true; onlAward([]); onlBroadcast({t:"end", r:R.r, win:[], players:onlPublic()}); }
}
const onlAward = w => ONL.players.forEach((p,i)=>{ if(w.includes(i)) p.s++; p.h.push(w.includes(i)?1:0); });
function onlDuelPick(i, r, pi){
  const d=ONL.duel; if(!d||d.over||r!==d.r||i!==d.turn) return;
  if(!Number.isInteger(pi)||pi<0||pi>=P.length||d.used.includes(pi)) return;
  const g=P[pi].g, ok=g<=d.left[i]; d.used.push(pi); d.tries[i].push({i:pi, ok}); if(ok) d.left[i]-=g;
  onlDuelAdvance();
}
function onlDuelAdvance(){
  const d=ONL.duel, act=ONL.players.map((p,j)=>p.on && d.left[j]>0);
  const steps=j=>d.tries[j].length, t=d.turn;
  const roundDone = ONL.players.every((p,j)=>!p.on || d.left[j]===0 || steps(j)>=steps(t));
  if(roundDone && d.left.some(x=>x===0)) return onlDuelFinish(false);
  if(!act.some(Boolean)) return onlDuelFinish(true);
  let nx=t; for(let k=0;k<ONL.players.length;k++){ nx=(nx+1)%ONL.players.length; if(act[nx]) break; }
  d.turn=nx; onlBroadcast({t:"duel", d});
}
function onlDuelSkip(){ const d=ONL&&ONL.duel; if(d&&!d.over&&ONL.players[d.turn]&&!ONL.players[d.turn].on) onlDuelAdvance(); }
function onlDuelFinish(forced){
  const d=ONL.duel; d.over=true;
  let w=d.left.map((x,j)=>x===0?j:-1).filter(j=>j>=0);
  if(forced&&!w.length){ const m=Math.min(...d.left); if(m<d.tgt) w=d.left.map((x,j)=>x===m?j:-1).filter(j=>j>=0); }
  d.win=w; onlAward(w); onlBroadcast({t:"duel", d}); onlBroadcast({t:"end", r:d.r, win:w, players:onlPublic(), duel:true});
}
/* ---- invitado ---- */
function onlJoin(name, code){
  code=String(code||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  if(code.length!==6) return alertMsg("El código tiene 6 caracteres.");
  ONL={role:"guest", code, me:null, players:[], cfg:null, r:-1};
  const peer=new Peer(peerOpts()); ONL.peer=peer;
  const fail=setTimeout(()=>{ if(ONL&&ONL.me==null) onlLeave("No se encuentra la sala "+code+"."); }, 12000);
  peer.on("open", ()=>{
    const conn=peer.connect(ONL_PREFIX+code.toLowerCase(), {reliable:true, serialization:"json"}); ONL.conn=conn;
    conn.on("open", ()=>onlSend(conn,{t:"hello", name, sig:DATA_SIG()}));
    conn.on("data", m=>{ if(m&&m.t==="welcome") clearTimeout(fail); onlHandle(m,false); });
    conn.on("close", ()=>{ if(ONL&&ONL.role==="guest") onlLeave("Se ha cerrado la sala."); });
  });
  peer.on("error", e=>{ clearTimeout(fail); if(ONL&&ONL.role==="guest") onlLeave(e&&e.type==="peer-unavailable"?"No existe la sala "+code+".":"Error de conexión."); });
}
const alertMsg = t => { store.set("onl-msg", t); route(); };
/* ---- lo que ven todos (también el anfitrión, en local) ---- */
function onlHandle(m, local){
  if(!ONL || !m || typeof m!=="object") return;
  const okPlayers = a => Array.isArray(a) && a.length<=16 && a.every(p=>p&&typeof p.n==="string"&&Number.isInteger(p.s));
  switch(m.t){
    case "welcome": if(Number.isInteger(m.you)) ONL.me=m.you; location.hash="online-sala"; break;
    case "lobby": if(okPlayers(m.players)) ONL.players=m.players.map(p=>({n:cleanName(p.n),s:p.s,on:!!p.on,h:Array.isArray(p.h)?p.h:[]})); if(m.cfg&&ONL.role==="guest"&&Array.isArray(m.cfg.games)) ONL.cfg={rounds:+m.cfg.rounds||5, games:m.cfg.games.filter(g=>GAMES.some(x=>x.id===g))};
      if(ONL.role==="guest"&&location.hash==="#online-fin"){ ONL.r=-1; ONL.game=null; location.hash="online-sala"; } else if(location.hash==="#online-sala") route(); break;
    case "round": {
      if(!Number.isInteger(m.r)||!GAMES.some(g=>g.id===m.game)) return;
      if(okPlayers(m.players)) ONL.players=m.players.map(p=>({n:cleanName(p.n),s:p.s,on:!!p.on,h:p.h||[]}));
      ONL.r=m.r; ONL.rounds=m.rounds; ONL.game=m.game; ONL.playing=true; ONL.over=false; sheetOff();
      if(DUEL.includes(m.game)){ location.hash="online-duelo"; if(location.hash==="#online-duelo") route(); }
      else { ONL_SEED=m.seed>>>0; if(location.hash.slice(1)===m.game) route(); else location.hash=m.game; }
      break; }
    case "duel": if(m.d&&Array.isArray(m.d.left)){ ONL.duelState=m.d; if(location.hash==="#online-duelo") route(); } break;
    case "end": {
      if(m.r!==ONL.r) return; ONL.playing=false; ONL.over=true;
      if(okPlayers(m.players)) ONL.players=m.players.map(p=>({n:cleanName(p.n),s:p.s,on:!!p.on,h:p.h||[]}));
      const w=(Array.isArray(m.win)?m.win:[]).filter(i=>ONL.players[i]), names=w.map(i=>esc(ONL.players[i].n)).join(" y ");
      const mine=w.includes(ONL.me), last=ONL.r>=ONL.rounds-1;
      setTimeout(()=>{ const d=showSheet(w.length?"ok":"bad", `<span class="sh-ic">${w.length?"✓":"✕"}</span><div class="sh-tx"><b>${w.length?(mine&&w.length===1?"¡Punto para ti!":`Punto para ${names}`):"Nadie puntúa"}</b><small>${ONL.players.map(p=>`${esc(p.n)} ${p.s}`).join(" · ")}</small></div>
        ${ONL.role==="host"?`<button class="btn" id="shgo">${last?"Ver clasificación":"Siguiente ronda"}</button>`:`<p class="wait">Esperando al anfitrión…</p>`}`);
        const b=document.getElementById("shgo"); if(b) b.onclick=()=>{ b.disabled=true; onlNextRound(ONL.r+1); }; }, m.duel?600:250);
      break; }
    case "final": if(okPlayers(m.players)) ONL.players=m.players.map(p=>({n:cleanName(p.n),s:p.s,on:!!p.on,h:p.h||[]})); ONL.playing=false; sheetOff(); location.hash="online-fin"; route(); break;
    case "closed": if(!local) onlLeave(typeof m.why==="string"?m.why.slice(0,80):"El anfitrión ha cerrado la sala."); break;
  }
}
/* resultado de un juego "a gritar" en una ronda online */
const onlineResult = (id, win) => {
  if(!ONL || !ONL.playing || id!==ONL.game) return false;
  ONL.playing=false;
  if(ONL.role==="host") onlRaceEvent(0, win?"win":"out", ONL.r); else onlSend(ONL.conn,{t:win?"win":"out", r:ONL.r});
  if(!win) setTimeout(()=>{ if(ONL&&!ONL.over) showSheet("bad", `<span class="sh-ic">✕</span><div class="sh-tx"><b>Sin intentos</b><small>Esperando a que acaben los demás…</small></div>`); }, 250);
  else setTimeout(()=>{ if(ONL&&!ONL.over) showSheet("ok", `<span class="sh-ic">✓</span><div class="sh-tx"><b>¡Correcto!</b><small>Comprobando quién ha sido el primero…</small></div>`); }, 100);
  return true;
};
/* ---- pantallas ---- */
function onlineHome(){
  sheetOff();
  if(ONL){ location.hash="online-sala"; return; }
  const msg=store.get("onl-msg",null); store.set("onl-msg",null);
  const name=store.get("onl-name",""), q=new URLSearchParams(location.search).get("sala")||"";
  app.innerHTML = top("Online", "") + (onlAvail()?`
    ${msg?`<div class="res bad"><span class="ricon">!</span><div><h3>Ups</h3><p>${esc(msg)}</p></div></div>`:""}
    <p class="rule">Cada uno en su móvil. Crea una sala y pasa el código (o el enlace) a tus amigos.</p>
    <h3 class="ph">Tu nombre</h3>
    <div class="pl"><input id="nm" maxlength="14" placeholder="¿Cómo te llamas?" value="${esc(name)}" autocomplete="off"></div>
    <div class="row" style="margin-top:14px"><button class="btn" id="host">Crear sala</button></div>
    <h3 class="ph">Unirme con código</h3>
    <div class="pl"><input id="cd" maxlength="6" placeholder="ABC123" value="${esc(q.toUpperCase().slice(0,6))}" autocomplete="off" autocapitalize="characters" style="letter-spacing:.2em;font-family:var(--meta);font-size:22px;text-transform:uppercase"></div>
    <div class="row" style="margin-top:10px"><button class="btn ghost" id="join">Unirme</button></div>`
    : `<div class="res bad"><span class="ricon">!</span><div><h3>Solo en la web pública</h3><p>El online funciona en la versión publicada en internet de Formidable.fut.</p></div></div>`);
  bindBack();
  const nm=()=>{ const n=cleanName(document.getElementById("nm").value); if(!n){ document.getElementById("nm").focus(); return null; } store.set("onl-name", n); return n; };
  on("host",()=>{ const n=nm(); if(n){ app.querySelector("#host").disabled=true; onlHost(n); } });
  on("join",()=>{ const n=nm(); if(n){ app.querySelector("#join").disabled=true; onlJoin(n, document.getElementById("cd").value); } });
}
function onlineLobby(){
  sheetOff();
  if(!ONL){ location.hash="online"; return; }
  const host=ONL.role==="host", link=location.origin+location.pathname+"?sala="+ONL.code+"#online";
  const cfg=ONL.cfg||{rounds:5,games:[]};
  const chip=g=>`<button data-g="${g.id}" class="${cfg.games.includes(g.id)?"on":""}" ${host?"":"disabled"} style="--cb:${CARD_KIT[g.id][0]};--cf:${CARD_KIT[g.id][1]}">${esc(g.t)}</button>`;
  app.innerHTML = top("Sala online", "") + `
    <div class="code"><p class="t-k">Código de sala</p><div class="cv2">${esc(ONL.code)}</div>
      <div class="row" style="justify-content:center;gap:8px;margin-top:10px"><button class="btn ghost" id="copy">Copiar enlace</button>${navigator.share?`<button class="btn ghost" id="share">Compartir</button>`:""}</div></div>
    <h3 class="ph">Jugadores <small>${ONL.players.filter(p=>p.on).length}/8</small></h3>
    <ol class="mini-rank">${ONL.players.map((p,i)=>`<li class="${i===ONL.me?"me":""} ${p.on?"":"off"}"><span>${esc(p.n)}${i===0?" ★":""}</span><b>${p.on?"●":"○"}</b></li>`).join("")}</ol>
    ${host?`<h3 class="ph">Rondas</h3><div class="seg">${[3,5,10].map(r=>`<button data-r="${r}" class="${r===cfg.rounds?"on":""}">${r}</button>`).join("")}</div>`:`<p class="rule">Rondas: <b>${cfg.rounds}</b></p>`}
    <h3 class="ph">A ver quién es más rápido</h3><div class="gpick">${GAMES.filter(g=>SHOUT.includes(g.id)).map(chip).join("")}</div>
    <h3 class="ph">Duelo por turnos</h3><div class="gpick">${GAMES.filter(g=>DUEL.includes(g.id)).map(chip).join("")}</div>
    <div class="row" style="margin-top:18px">${host?`<button class="btn" id="go" ${ONL.players.filter(p=>p.on).length>=2&&cfg.games.length?"":"disabled"}>Empezar</button>`:`<p class="wait">Esperando a que el anfitrión empiece…</p>`}<button class="btn ghost" id="leave">Salir</button></div>`;
  document.getElementById("back").onclick=()=>onlLeave();
  on("leave",()=>onlLeave());
  on("copy",()=>{ try{ navigator.clipboard.writeText(link); app.querySelector("#copy").textContent="¡Copiado!"; }catch(e){} });
  on("share",()=>{ navigator.share({title:"Formidable.fut", text:"Únete a mi sala: "+ONL.code, url:link}).catch(()=>{}); });
  if(host){
    const push=()=>{ store.set("onl-cfg", ONL.cfg); onlBroadcast({t:"lobby", players:onlPublic(), cfg:ONL.cfg}); };
    app.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{ ONL.cfg.rounds=+b.dataset.r; push(); });
    app.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{ const id=b.dataset.g, s=new Set(ONL.cfg.games); s.has(id)?s.delete(id):s.add(id); ONL.cfg.games=[...s]; push(); });
    on("go", onlStart);
  }
}
function onlineDuel(){
  if(!ONL){ location.hash="online"; return; }
  const d=ONL.duelState; if(!d){ app.innerHTML=top("Duelo","")+`<p class="wait">Conectando…</p>`; return; }
  const [cb,cf]=CARD_KIT.exacto, myTurn=!d.over&&d.turn===ONL.me;
  app.innerHTML = top("Duelo · Goles exactos", `Ronda <em>${ONL.r+1}</em>/${ONL.rounds}`) + `
    <p class="rule">Objetivo <b>${d.tgt}</b>. Por turnos: di un jugador y se restan sus goles. Si te pasas, no cuenta pero gastas turno.</p>
    <div class="duel d${Math.min(ONL.players.length,4)}" style="--cb:${cb};--cf:${cf}">${ONL.players.map((p,i)=>`
      <section class="dp ${i===d.turn&&!d.over?"on":""} ${d.left[i]===0?"win":""} ${p.on?"":"off"}">
        <header><span class="dn">${esc(p.n)}${i===ONL.me?" (tú)":""}</span><span class="ds">${(d.tries[i]||[]).length} jug.</span></header>
        <div class="dl">${d.left[i]}</div><div class="dbar"><i style="width:${100-d.left[i]/d.tgt*100}%"></i></div>
        <ol class="dt">${(d.tries[i]||[]).slice().reverse().map(t=>P[t.i]?`<li class="${t.ok?"":"x"}"><span>${esc(P[t.i].n)}</span><b>${t.ok?"−"+P[t.i].g:"✕"}</b></li>`:"").join("")}</ol>
      </section>`).join("")}</div>
    ${d.over?"":(myTurn?`<p class="dturn"><b>Te toca</b></p><div id="srch"></div>`:`<p class="dturn">Turno de <b>${esc((ONL.players[d.turn]||{}).n||"")}</b></p>`)}`;
  document.getElementById("back").onclick=()=>{ if(confirm("¿Salir de la sala?")) onlLeave(); };
  if(myTurn) playerSearch(document.getElementById("srch"), i=>{ if(ONL.role==="host") onlDuelPick(0, d.r, i); else onlSend(ONL.conn,{t:"pick", r:d.r, i}); }, new Set(d.used));
}
function onlineEnd(){
  sheetOff();
  if(!ONL){ location.hash="online"; return; }
  const rk=ONL.players.map((p,i)=>({...p,i})).sort((a,b)=>b.s-a.s), medal=["🥇","🥈","🥉"];
  let place=0; rk.forEach((p,k)=>{ if(k===0||p.s<rk[k-1].s) place=k; p.pl=place; });
  app.innerHTML = top("Clasificación", "") + `
    <div class="podium"><p class="t-k">${rk.filter(p=>p.pl===0).length>1?"Empate en cabeza":"Gana"}</p>
      <h2 class="fit"><span class="fit-in">${rk.filter(p=>p.pl===0).map(p=>esc(p.n)).join(" y ")}</span></h2><p class="t-k">${rk[0].s} punto${rk[0].s===1?"":"s"}</p></div>
    <ol class="rank">${rk.map(p=>`<li><span class="m">${p.pl<3?`<span class="flag">${medal[p.pl]}</span>`:p.pl+1}</span><span class="n">${esc(p.n)}${p.i===ONL.me?" (tú)":""}</span><span class="hs">${(p.h||[]).map(x=>`<i class="${x?"y":""}"></i>`).join("")}</span><b>${p.s}</b></li>`).join("")}</ol>
    <div class="row" style="margin-top:16px">${ONL.role==="host"?`<button class="btn" id="again">Otra partida</button>`:`<p class="wait">El anfitrión puede empezar otra</p>`}<button class="btn ghost" id="out">Salir</button></div>`;
  document.getElementById("back").onclick=()=>onlLeave();
  on("out",()=>onlLeave());
  on("again",()=>{ ONL.started=false; ONL.r=-1; ONL.round=null; ONL.duel=null; ONL.players.forEach(p=>{p.s=0;p.h=[];}); onlBroadcast({t:"lobby", players:onlPublic(), cfg:ONL.cfg}); location.hash="online-sala"; });
}

const ROUTES = {online:onlineHome, "online-sala":onlineLobby, "online-duelo":onlineDuel, "online-fin":onlineEnd, fiesta:partySetup, "fiesta-turno":partyTurn, "fiesta-duelo":partyDuel, "fiesta-fin":partyEnd, compatriota:()=>pairGame("compatriota"), conexion:()=>pairGame("conexion"), "reto-1000":reto, exacto, pistas, impostor, comparador, oculto, cuadricula, colores};
const route = () => { const h=location.hash.slice(1); const inP=(partyOn()&&PARTY.playing&&h===PARTY.order[PARTY.r]) || (ONL&&ONL.game===h&&(ONL.playing||ONL.over)); if(!inP) sheetOff(); document.body.classList.toggle("inparty", !!inP); window.scrollTo(0,0); app.className = ROUTES[h] ? "wrap game" : "wrap home"; const g=GAMES.find(x=>x.id===h);  app.dataset.game = h||"home"; if(g&&typeof CARD_KIT!=="undefined"){app.style.setProperty("--cb",CARD_KIT[h][0]);app.style.setProperty("--cf",CARD_KIT[h][1]);} app.style.setProperty("--gc", g?g.c:"#3e63dd"); app.style.setProperty("--gcd", g?g.ci:"#46a302"); if(ONL_SEED!=null && ONL && h===ONL.game){ const orig=Math.random; Math.random=mulberry(ONL_SEED); ONL_SEED=null; try{ ROUTES[h](); } finally { Math.random=orig; } } else (ROUTES[h]||home)(); requestAnimationFrame(fitAll); };

fetch("data.json").then(r=>r.json()).then(d=>{
  D=d; P=d.players; CK=Object.keys(d.clubs);
  P.forEach((p,i)=>{ p._k=[norm(p.n), ...(p.al||[]).map(norm)]; p.c.forEach(c=>(byClub[c]=byClub[c]||new Set()).add(i)); });
  FAM = P.map((p,i)=>i).filter(i=>{ const p=P[i]; return p.g>=80 || p.t>=10 || p.pj>=550; });
  window.addEventListener("hashchange", route);
  route();
}).catch(e=>{ app.innerHTML='<p class="load">No se pudieron cargar los datos. Recarga la página.</p>'; console.error(e); });
}
