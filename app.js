const B="https://idashrgfukgszyrqpjid."+"supabase.co",K="sb_publishable_wEuPnq7xgewXLeWYmoG5iw_0ZzT25i_";
const H={"apikey":K,"Content-Type":"application/json","Prefer":"return=representation"},$=i=>document.getElementById(i);
let me=null,ch=null,us=[],frs=[],msgs=[],flt="all",tm=null;

async function api(p,m="GET",b=null){
  const r=await fetch(B+p,{method:m,headers:H,body:b?JSON.stringify(b):null}),t=await r.text();
  let d={};try{d=JSON.parse(t)}catch(e){}
  if(!r.ok)throw new Error(d.msg||d.message||t);
  return d;
}

function setAva(el,u){
  if(u&&u.avatar){el.style.backgroundImage="url("+u.avatar+")";el.innerText="";}
  else{el.style.backgroundImage="none";el.innerText=u?u.username.slice(0,2):"?";}
}

function enter(){localStorage.setItem("sg_id",me.id);$('auth').classList.add('hidden');$('app').classList.remove('hidden');loadAll();loadS();}
function logout(){localStorage.removeItem("sg_id");location.reload();}

async function auth(reg){
  $('err').innerText="Загрузка...";
  try{
    const u=$('uin').value.trim().toLowerCase().replace(/[^a-z0-9_]/g,''),p=$('pin').value;
    if(!u||p.length<6)throw new Error("Ник (англ.) и пароль от 6 символов");
    const em=u+"@gmail.com";
    if(reg){
      const a=await api("/auth/v1/signup","POST",{email:em,password:p});
      const uid=(a.user&&a.user.id)||a.id,ex=await api("/rest/v1/profiles?select=id"),f=ex.length===0;
      const pr=await api("/rest/v1/profiles","POST",{id:uid,username:u,stars:f?9999:50,is_owner:f});
      me=pr.at(0);
    }else{
      const a=await api("/auth/v1/token?grant_type=password","POST",{email:em,password:p});
      const pr=await api("/rest/v1/profiles?id=eq."+a.user.id);
      me=pr.at(0);
    }
    if(!me)throw new Error("Профиль не найден");
    enter();
  }catch(e){$('err').innerText=e.message;}
}

function setFilter(f){flt=f;$('f-all').className=f==='all'?'act':'';$('f-own').className=f==='own'?'act':'';renderList();}

function getFriendIds(){
  const ids=[];
  frs.forEach(f=>{if(f.status==='accepted'){if(f.user_id===me.id)ids.push(f.friend_id);if(f.friend_id===me.id)ids.push(f.user_id);}});
  return ids;
}

async function loadAll(){
  us=await api("/rest/v1/profiles?select=*");
  frs=await api(`/rest/v1/friends?or=(user_id.eq.${me.id},friend_id.eq.${me.id})`);
  msgs=await api(`/rest/v1/messages?or=(sender_id.eq.${me.id},receiver_id.eq.${me.id})&order=created_at.desc`);
  me=us.find(x=>x.id===me.id)||me;
  $('st').innerText=me.stars;setAva($('pava'),me);setAva($('nava'),me);
  $('pname').innerHTML="@"+me.username+(me.is_owner?'<span class="ok">✓</span>':'');
  if(me.is_owner){$('prole').innerText="Создатель Suttongram 👑";$('nown').classList.remove('hidden');}
  const fIds=getFriendIds();$('grec').innerHTML="";$('ausel').innerHTML="";
  us.forEach(u=>{
    $('ausel').innerHTML+=`<option value="${u.id}">@${u.username} (⭐${u.stars})</option>`;
    if(fIds.includes(u.id))$('grec').innerHTML+=`<option value="${u.id}">@${u.username}</option>`;
  });
  if(!$('grec').innerHTML)$('grec').innerHTML=`<option value="">Добавь друга в 👥 Друзья</option>`;
  renderList();renderFriends();
}

function renderList(){
  const q=($('srch').value||"").toLowerCase(),fIds=getFriendIds();$('ulist').innerHTML="";
  us.forEach(u=>{
    if(!fIds.includes(u.id)||(flt==='own'&&!u.is_owner)||(q&&!u.username.toLowerCase().includes(q)))return;
    const last=msgs.find(m=>m.sender_id===u.id||m.receiver_id===u.id);
    const txt=last?(last.content.startsWith("CALL::")?"📞 Звонок":last.content):"Нажмите, чтобы написать";
    const tmStr=last?new Date(last.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):"";
    const row=document.createElement('div');row.className='row';row.onclick=()=>openC(u);
    const av=document.createElement('div');av.className='ava';setAva(av,u);row.appendChild(av);
    row.innerHTML+=`<div class="r-mid"><div class="r-top"><div class="r-name">@${u.username}${u.is_owner?'<span class="ok">✓</span>':''}</div><span class="r-time">${tmStr}</span></div><div class="r-msg">${txt}</div></div>`;
    $('ulist').appendChild(row);
  });
  if(!$('ulist').innerHTML)$('ulist').innerHTML="<p class='pad' style='color:#7f91a4'>Нет друзей в чатах. Зайди во вкладку 👥 Друзья и добавь по нику!</p>";
}

function renderFriends(){
  const inc=frs.filter(f=>f.friend_id===me.id&&f.status==='pending'),b=$('fbadge');
  if(inc.length>0){b.innerText=inc.length;b.classList.remove('hidden');}else b.classList.add('hidden');
  $('req-box').innerHTML=inc.length?"<div style='color:#2aabee;font-size:12px;font-weight:700;margin:10px 0 6px'>📩 ЗАЯВКИ В ДРУЗЬЯ</div>":"";
  inc.forEach(r=>{
    const u=us.find(x=>x.id===r.user_id);if(!u)return;
    $('req-box').innerHTML+=`<div class="card" style="display:flex;justify-content:space-between;align-items:center"><b>@${u.username}</b><div style="display:flex;gap:6px"><button class="btn-sm" style="background:#28a745" onclick="ansFr(${r.id},'accepted')">Принять</button><button class="btn-sm sec" onclick="ansFr(${r.id},'rejected')">✕</button></div></div>`;
  });
  const fIds=getFriendIds();$('flist').innerHTML="";
  fIds.forEach(id=>{
    const u=us.find(x=>x.id===id);if(!u)return;
    $('flist').innerHTML+=`<div class="card" style="display:flex;justify-content:space-between;align-items:center"><b>@${u.username}${u.is_owner?'<span class="ok">✓</span>':''}</b><button class="btn-sm sec" onclick="delFr('${u.id}')">Удалить</button></div>`;
  });
  if(!$('flist').innerHTML)$('flist').innerHTML="<p style='color:#7f91a4;font-size:13px'>Список друзей пуст</p>";
}

function findFr(){
  const q=$('f-srch').value.trim().toLowerCase().replace('@','');$('f-res').innerHTML="";if(!q)return;
  const u=us.find(x=>x.username.toLowerCase()===q&&x.id!==me.id);
  if(!u){$('f-res').innerHTML="<p style='color:#ff6b6b;font-size:13px'>Не найден</p>";return;}
  const rel=frs.find(f=>(f.user_id===me.id&&f.friend_id===u.id)||(f.friend_id===me.id&&f.user_id===u.id));
  if(rel&&rel.status==='accepted')$('f-res').innerHTML=`<p style='color:#28a745;font-size:13px'>Уже в друзьях</p>`;
  else if(rel&&rel.status==='pending')$('f-res').innerHTML=`<p style='color:#ffd700;font-size:13px'>Заявка отправлена</p>`;
  else $('f-res').innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px"><b>@${u.username}</b><button class="btn-sm" onclick="addFr('${u.id}')">Добавить</button></div>`;
}

async function addFr(fid){await api("/rest/v1/friends","POST",{user_id:me.id,friend_id:fid,status:'pending'});alert("Заявка отправлена! 📩");$('f-res').innerHTML="";$('f-srch').value="";loadAll();}
async function ansFr(id,st){if(st==='rejected')await api("/rest/v1/friends?id=eq."+id,"DELETE");else await api("/rest/v1/friends?id=eq."+id,"PATCH",{status:'accepted'});loadAll();}
async function delFr(fid){await api(`/rest/v1/friends?or=(and(user_id.eq.${me.id},friend_id.eq.${fid}),and(user_id.eq.${fid},friend_id.eq.${me.id}))`,"DELETE");loadAll();}

function upAva(inp){
  const f=inp.files.at(0);if(!f)return;const r=new FileReader();
  r.onload=e=>{const img=new Image();img.onload=async()=>{const c=document.createElement('canvas'),s=150;c.width=s;c.height=s;c.getContext('2d').drawImage(img,0,0,s,s);const b64=c.toDataURL('image/jpeg',0.7);await api("/rest/v1/profiles?id=eq."+me.id,"PATCH",{avatar:b64});me.avatar=b64;setAva($('pava'),me);setAva($('nava'),me);alert("Фото обновлено! ✨")};img.src=e.target.result};
  r.readAsDataURL(f);
}

async function openC(u){ch=u;$('ulist').classList.add('hidden');$('bnav').classList.add('hidden');$('top-bar').classList.add('hidden');$('main-box').style.paddingBottom="0";$('cview').classList.remove('hidden');$('bbtn').classList.remove('hidden');$('cbtn').classList.remove('hidden');$('hdr').innerHTML="@"+u.username+(u.is_owner?'<span class="ok">✓</span>':'');await loadM();tm=setInterval(loadM,2000);}
async function loadM(){if(!ch)return;const ms=await api(`/rest/v1/messages?or=(and(sender_id.eq.${me.id},receiver_id.eq.${ch.id}),and(sender_id.eq.${ch.id},receiver_id.eq.${me.id}))&order=created_at.asc`);$('mbox').innerHTML="";ms.forEach(m=>{const d=document.createElement('div');d.className="msg "+(m.sender_id===me.id?"mine":"theirs");if(m.content.startsWith("CALL::")){const rm=m.content.split("::").at(1);d.innerHTML=`📞 <b>Звонок</b><br><button onclick="joinC('${rm}')" style="margin-top:6px;padding:6px;background:#28a745">Ответить</button>`}else d.innerText=m.content;$('mbox').appendChild(d)});$('mbox').scrollTop=$('mbox').scrollHeight;}
function closeC(){ch=null;clearInterval(tm);$('cview').classList.add('hidden');$('ulist').classList.remove('hidden');$('bnav').classList.remove('hidden');$('top-bar').classList.remove('hidden');$('main-box').style.paddingBottom="78px";$('bbtn').classList.add('hidden');$('cbtn').classList.add('hidden');$('hdr').innerText="Suttongram";loadAll();}
async function send(c=null){const t=c||$('minp').value.trim();if(!t||!ch)return;if(!c)$('minp').value="";await api("/rest/v1/messages","POST",{sender_id:me.id,receiver_id:ch.id,content:t});loadM();}
async function call(){const rm="SuttongramCall"+me.id.slice(0,5)+ch.id.slice(0,5);await send("CALL::"+rm);joinC(rm);}
function joinC(rm){window.open("https://"+"vdo"+".ninja/?room="+rm+"&wc=0&as=1","_blank");}
let gImg="";
function gIcon(v){return v&&v.startsWith("data:image")?`<img src="${v}" style="width:68px;height:68px;object-fit:cover;border-radius:14px;margin:0 auto 6px;display:block">`:`<div style="font-size:40px;margin-bottom:4px">${v}</div>`;}
function prevG(inp){
  const f=inp.files&&inp.files[0];
  if(!f)return;
  $('ngf-btn').innerText="⏳ Сжимаю фото...";
  const url=URL.createObjectURL(f);
  const img=new Image();
  img.onload=()=>{
    const c=document.createElement('canvas'),s=160;
    c.width=s;c.height=s;
    c.getContext('2d').drawImage(img,0,0,s,s);
    gImg=c.toDataURL('image/jpeg',0.75);
    URL.revokeObjectURL(url);
    $('ngf-btn').innerText="✅ Картинка готова!";
  };
  img.onerror=()=>{
    URL.revokeObjectURL(url);
    alert("Не удалось прочитать это фото, попробуй другое");
    $('ngf-btn').innerText="🖼️ Выбрать картинку из галереи";
  };
  img.src=url;
}
async function loadS(){const gs=await api("/rest/v1/gifts?select=*&order=price.asc");$('slist').innerHTML="";if($('aglist'))$('aglist').innerHTML="";gs.forEach(g=>{$('slist').innerHTML+=`<div class="gcard">${gIcon(g.emoji)}<b>${g.name}</b><div style="color:#ffd700;margin:4px 0">⭐ ${g.price}</div><button onclick="buy(${g.id},${g.price})" style="padding:7px;font-size:13px">Подарить</button></div>`;if($('aglist'))$('aglist').innerHTML+=`<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;align-items:center;gap:10px">${g.emoji.startsWith("data:image")?`<img src="${g.emoji}" style="width:40px;height:40px;border-radius:8px;object-fit:cover">`:`<span style="font-size:26px">${g.emoji}</span>`}<div><b>${g.name}</b><div style="color:#ffd700;font-size:12px">⭐ ${g.price}</div></div></div><button class="btn-sm" style="background:#e53935" onclick="delG(${g.id})">Удалить</button></div>`;});}
async function delG(id){if(!confirm("Удалить этот подарок из магазина?"))return;await api("/rest/v1/user_gifts?gift_id=eq."+id,"DELETE");await api("/rest/v1/gifts?id=eq."+id,"DELETE");loadS();}
async function buy(id,p){const r=$('grec').value;if(!r)return alert("Добавь друга в 👥 Друзья!");if(me.stars<p)return alert("Мало звёзд!");await api("/rest/v1/profiles?id=eq."+me.id,"PATCH",{stars:me.stars-p});await api("/rest/v1/user_gifts","POST",{gift_id:id,sender_id:me.id,receiver_id:r});alert("Подарок отправлен! 🎁");loadAll();}
async function loadG(){const is=await api(`/rest/v1/user_gifts?select=*,gifts(*),sender:profiles!sender_id(username)&receiver_id=eq.${me.id}`);$('mgifts').innerHTML="";is.forEach(i=>{$('mgifts').innerHTML+=`<div class="gcard">${gIcon(i.gifts.emoji)}<b>${i.gifts.name}</b><div style="color:#7f91a4;font-size:12px">от @${i.sender.username}</div></div>`;});if(!$('mgifts').innerHTML)$('mgifts').innerHTML="<p style='color:#7f91a4'>Подарков пока нет</p>";}
async function give(){const id=$('ausel').value,a=parseInt($('aamt').value);if(!a)return;const u=us.find(x=>x.id===id);await api("/rest/v1/profiles?id=eq."+id,"PATCH",{stars:u.stars+a});alert("Звёзды выданы!");loadAll();}
async function addG(){const e=gImg||$('nge').value.trim(),n=$('ngn').value.trim(),p=parseInt($('ngp').value);if(!e||!n||!p)return alert("Выбери фото (или эмодзи), введи название и цену!");await api("/rest/v1/gifts","POST",{emoji:e,name:n,price:p});gImg="";$('ngf-btn').innerText="🖼️ Выбрать картинку из галереи";$('nge').value="";$('ngn').value="";$('ngp').value="";alert("Подарок добавлен! ✨");loadS();}
function tab(t,b){['chats','fr','shop','prof','own'].forEach(x=>{const el=$('t-'+x);if(el)el.classList.add('hidden');});const cur=$('t-'+t);if(cur)cur.classList.remove('hidden');if($('top-bar'))$('top-bar').classList.toggle('hidden',t!=='chats');document.querySelectorAll('#bnav button').forEach(x=>x.classList.remove('act'));if(b)b.classList.add('act');if(t==='prof')loadG().catch(()=>{});if(t==='chats'||t==='fr'||t==='shop'||t==='own')loadAll().catch(()=>{});}
(async()=>{const s=localStorage.getItem("sg_id");if(s){try{const p=await api("/rest/v1/profiles?id=eq."+s);if(p.at(0)){me=p.at(0);enter();}}catch(e){}}})();
