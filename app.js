const B = "https://idashrgfukgszyrqpjid." + "supabase.co";
const K = "sb_publishable_wEuPnq7xgewXLeWYmoG5iw_0ZzT25i_";
const H = { "apikey": K, "Content-Type": "application/json", "Prefer": "return=representation" };
const $ = i => document.getElementById(i);
let me = null, ch = null, us = [], frs = [], allMsgs = [], flt = "all", tm = null;

async function api(p, m = "GET", b = null) {
  const r = await fetch(B + p, { method: m, headers: H, body: b ? JSON.stringify(b) : null });
  const t = await r.text();
  let d = {};
  try { d = JSON.parse(t); } catch (e) {}
  if (!r.ok) throw new Error(d.msg || d.message || t);
  return d;
}

function setAva(el, u) {
  if (u && u.avatar) { el.style.backgroundImage = "url(" + u.avatar + ")"; el.innerText = ""; }
  else { el.style.backgroundImage = "none"; el.innerText = u ? u.username.slice(0, 2) : "?"; }
}

function enter() {
  localStorage.setItem("sg_id", me.id);
  $('auth').classList.add('hidden');
  $('app').classList.remove('hidden');
  loadAll(); loadS();
}

function logout() { localStorage.removeItem("sg_id"); location.reload(); }

async function auth(reg) {
  $('err').innerText = "Загрузка...";
  try {
    const u = $('uin').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const p = $('pin').value;
    if (!u || p.length < 6) throw new Error("Ник (англ.) и пароль от 6 символов");
    const em = u + "@gmail.com";
    if (reg) {
      const a = await api("/auth/v1/signup", "POST", { email: em, password: p });
      const uid = (a.user && a.user.id) || a.id;
      const ex = await api("/rest/v1/profiles?select=id");
      const f = ex.length === 0;
      const pr = await api("/rest/v1/profiles", "POST", { id: uid, username: u, stars: f ? 9999 : 50, is_owner: f });
      me = pr.at(0);
    } else {
      const a = await api("/auth/v1/token?grant_type=password", "POST", { email: em, password: p });
      const pr = await api("/rest/v1/profiles?id=eq." + a.user.id);
      me = pr.at(0);
    }
    if (!me) throw new Error("Профиль не найден");
    enter();
  } catch (e) { $('err').innerText = e.message; }
}

function setFilter(f) {
  flt = f;
  $('f-all').className = f === 'all' ? 'act' : '';
  $('f-own').className = f === 'own' ? 'act' : '';
  renderList();
}

function getFriendIds() {
  const ids = [];
  frs.forEach(f => {
    if (f.status === 'accepted') {
      if (f.user_id === me.id) ids.push(f.friend_id);
      if (f.friend_id === me.id) ids.push(f.user_id);
    }
  });
  return ids;
}

async function loadAll() {
  us = await api("/rest/v1/profiles?select=*");
  frs = await api(`/rest/v1/friends?or=(user_id.eq.${me.id},friend_id.eq.${me.id})`);
  allMsgs = await api(`/rest/v1/messages?or=(sender_id.eq.${me.id},receiver_id.eq.${me.id})&order=created_at.desc`);
  me = us.find(x => x.id === me.id) || me;
  $('st').innerText = me.stars;
  setAva($('pava'), me); setAva($('nava'), me);
  $('pname').innerHTML = "@" + me.username + (me.is_owner ? '<span class="ok">✓</span>' : '');
  if (me.is_owner) { $('prole').innerText = "Создатель Suttongram 👑"; $('nown').classList.remove('hidden'); }

  const fIds = getFriendIds();
  $('grec').innerHTML = ""; $('ausel').innerHTML = "";
  us.forEach(u => {
    $('ausel').innerHTML += `<option value="${u.id}">@${u.username} (⭐${u.stars})</option>`;
    if (fIds.includes(u.id)) $('grec').innerHTML += `<option value="${u.id}">@${u.username}</option>`;
  });
  if (!$('grec').innerHTML) $('grec').innerHTML = `<option value="">Сначала добавь друга в разделе 👥 Друзья</option>`;

  renderList();
  renderFriends();
}

function renderList() {
  const q = ($('srch').value || "").toLowerCase();
  const fIds = getFriendIds();
  $('ulist').innerHTML = "";
  us.forEach(u => {
    if (!fIds.includes(u.id)) return;
    if (flt === 'own' && !u.is_owner) return;
    if (q && !u.username.toLowerCase().includes(q)) return;
    const last = allMsgs.find(m => m.sender_id === u.id || m.receiver_id === u.id);
    const txt = last ? (last.content.startsWith("CALL::") ? "📞 Звонок" : last.content) : "Нажмите, чтобы написать";
    const tmStr = last ? new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
    const row = document.createElement('div');
    row.className = 'row';
    row.onclick = () => openC(u);
    const av = document.createElement('div');
    av.className = 'ava';
    setAva(av, u);
    row.appendChild(av);
    row.innerHTML += `<div class="r-mid"><div class="r-top"><div class="r-name">@${u.username}${u.is_owner ? '<span class="ok">✓</span>' : ''}</div><span class="r-time">${tmStr}</span></div><div class="r-msg">${txt}</div></div>`;
    $('ulist').appendChild(row);
  });
  if (!$('ulist').innerHTML) $('ulist').innerHTML = "<p class='pad' style='color:#7f91a4'>У тебя пока нет друзей в чатах. Зайди во вкладку 👥 Друзья и добавь по нику!</p>";
}

function renderFriends() {
  const incoming = frs.filter(f => f.friend_id === me.id && f.status === 'pending');
  const badge = $('fbadge');
  if (incoming.length > 0) { badge.innerText = incoming.length; badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');

  $('req-box').innerHTML = incoming.length ? "<div style='color:#2aabee;font-size:12px;font-weight:700;margin:10px 0 6px'>📩 ЗАЯВКИ В ДРУЗЬЯ</div>" : "";
  incoming.forEach(req => {
    const u = us.find(x => x.id === req.user_id);
    if (!u) return;
    $('req-box').innerHTML += `<div class="card" style="display:flex;justify-content:space-between;align-items:center"><b>@${u.username}</b><div style="display:flex;gap:6px"><button class="btn-sm" style="background:#28a745" onclick="ansFr(${req.id},'accepted')">Принять</button><button class="btn-sm sec" onclick="ansFr(${req.id},'rejected')">✕</button></div></div>`;
  });

  const fIds = getFriendIds();
  $('flist').innerHTML = "";
  fIds.forEach(id => {
    const u = us.find(x => x.id === id);
    if (!u) return;
    $('flist').innerHTML += `<div class="card" style="display:flex;justify-content:space-between;align-items:center"><b>@${u.username}${u.is_owner ? '<span class="ok">✓</span>' : ''}</b><button class="btn-sm sec" onclick="delFr('${u.id}')">Удалить</button></div>`;
  });
  if (!$('flist').innerHTML) $('flist').innerHTML = "<p style='color:#7f91a4;font-size:13px'>Список друзей пуст</p>";
}

function findFr() {
  const q = $('f-srch').value.trim().toLowerCase().replace('@', '');
  $('f-res').innerHTML = "";
  if (!q) return;
  const u = us.find(x => x.username.toLowerCase() === q && x.id !== me.id);
  if (!u) { $('f-res').innerHTML = "<p style='color:#ff6b6b;font-size:13px'>Пользователь не найден</p>"; return; }
  const rel = frs.find(f => (f.user_id === me.id && f.friend_id === u.id) || (f.friend_id === me.id && f.user_id === u.id));
  if (rel && rel.status === 'accepted') $('f-res').innerHTML = `<p style='color:#28a745;font-size:13px'>@${u.username} уже у тебя в друзьях</p>`;
  else if (rel && rel.status === 'pending') $('f-res').innerHTML = `<p style='color:#ffd700;font-size:13px'>Заявка уже отправлена</p>`;
  else $('f-res').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px"><b>@${u.username}</b><button class="btn-sm" onclick="addFr('${u.id}')">Добавить в друзья</button></div>`;
}

async function addFr(fid) {
  await api("/rest/v1/friends", "POST", { user_id: me.id, friend_id: fid, status: 'pending' });
  alert("Заявка в друзья отправлена! 📩");
  $('f-res').innerHTML = ""; $('f-srch').value = "";
  loadAll();
}

async function ansFr(id, st) {
  if (st === 'rejected') await api("/rest/v1/friends?id=eq." + id, "DELETE");
  else await api("/rest/v1/friends?id=eq." + id, "PATCH", { status: 'accepted' });
  loadAll();
}

async function delFr(fid) {
  await api(`/rest/v1/friends?or=(and(user_id.eq.${me.id},friend_id.eq.${fid}),and(user_id.eq.${fid},friend_id.eq.${me.id}))`, "DELETE");
  loadAll();
}

function upAva(inp) {
  const f = inp.files.at(0);
  if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    const img = new Image();
    img.onload = async () => {
      const c = document.createElement('canvas'), s = 150;
      c.width = s; c.height = s;
      c.getContext('2d').drawImage(img, 0, 0, s, s);
      const b64 = c.toDataURL('image/jpeg', 0.7);
      await api("/rest/v1/profiles?id=eq." + me.id, "PATCH", { avatar: b64 });
      me.avatar = b64; setAva($('pava'), me); setAva($('nava'), me);
      alert("Фото обновлено! ✨");
    };
    img.src = e.target.result;
  };
  r.readAsDataURL(f);
}

async function openC(u) {
  ch = u;
  $('ulist').classList.add('hidden'); $('bnav').classList.add('hidden'); $('top-bar').classList.add('hidden');
  $('main-box').style.paddingBottom = "0";
  $('cview').classList.remove('hidden'); $('bbtn').classList.remove('hidden'); $('cbtn').classList.remove('hidden');
  $('hdr').innerHTML = "@" + u.username + (u.is_owner ? '<span class="ok">✓</span>' : '');
  await loadM();
  tm = setInterval(loadM, 2000);
}

async function loadM() {
  if (!ch) return;
  const ms = await api(`/rest/v1/messages?or=(and(sender_id.eq.${me.id},receiver_id.eq.${ch.id}),and(sender_id.eq.${ch.id},receiver_id.eq.${me.id}))&order=created_at.asc`);
  $('mbox').innerHTML = "";
  ms.forEach(m => {
    const d = document.createElement('div');
    d.className = "msg " + (m.sender_id === me.id ? "mine" : "theirs");
    if (m.content.startsWith("CALL::")) {
      const rm = m.content.split("::").at(1);
      d.innerHTML = `📞 <b>Звонок</b><br><button onclick="joinC('${rm}')" style="margin-top:6px;padding:6px;background:#28a745">Ответить</button>`;
    } else d.innerText = m.content;
    $('mbox').appendChild(d);
  });
  $('mbox').scrollTop = $('mbox').scrollHeight;
}

function closeC() {
  ch = null; clearInterval(tm);
