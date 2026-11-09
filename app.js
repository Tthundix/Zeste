/* Zeste : logique de l'application. Les données de départ sont dans data.js. */
'use strict';

const APP_VERSION = '0.37.0';
const KEY = 'zeste-v1';
const UNITS = ['ml', 'cl', ['oz', 'oz (→ ml)'], ['cup', 'cup (→ ml)'], 'g', ['', 'sans unité'], 'trait', 'goutte', 'c. de bar', 'c. à café', 'c. à soupe', 'pièce', 'feuille', 'brin', 'quartier', 'tranche', 'pincée', 'à compléter'];
const PLURAL_UNITS = ['trait', 'goutte', 'pièce', 'feuille', 'brin', 'quartier', 'tranche', 'pincée'];
const ML = { ml: 1, cl: 10, trait: .9, goutte: .05, 'c. de bar': 5, 'c. à café': 5, 'c. à soupe': 15, 'à compléter': 60 };
const DIL = { 'Shaker': .25, 'Verre à mélange': .2, 'Dans le verre': .1, 'Dans un pichet': .1, 'À la casserole': 0, 'Blender': .4 };
const TASTE = [['su', 'Sucré'], ['ac', 'Acide'], ['am', 'Amer'], ['as', 'Astringent'], ['fo', 'Force']];
const TAG_SUGG = ['Apéritif', 'Digestif', 'Rafraîchissant', 'Réconfortant', 'Festif', 'Estival', 'Hivernal', 'Fin de soirée', 'Fruité', 'Herbacé', 'Floral', 'Crémeux', 'Pétillant', 'Amer', 'Brunch', 'Tiki', 'Univers JV', 'Univers ciné'];
const ORIGIN_F = [['', 'Toutes'], ['classic', 'Classiques'], ['zeste', 'Cocktails Zeste'], ['mine', 'Mes créations'], ['other', "Originaux d'autres barmen"]];
const FAM_MAP = { 'Liqueurs & apéritifs': 'Liqueurs', 'Agrumes & jus': 'Jus & purées', 'Softs': 'Softs & eaux', 'Frais & autres': 'Épicerie' };
const FAM_IDS = FAMILIES.map(f => f.id);
const PLACES = FAMILIES.flatMap(f => f.subs ? f.subs.map(s => [f.id + '|' + s, f.id + ' › ' + s]) : [[f.id + '|', f.id]]);
const BUILTIN = new Map(RECIPES.map(r => [r.id, r]));
const SWATCHES = [['#E8F1F2', 'Cristal'], ['#F6EBC8', 'Crème'], ['#FFE14D', 'Citron'], ['#FFC21A', 'Jaune doré'], ['#C8E04A', 'Citron vert'], ['#7CC242', 'Menthe'], ['#9FB33A', 'Chartreuse'], ['#FF9A1F', 'Orange'],
  ['#FF6A1A', 'Orange amer'], ['#D98A2B', 'Ambre'], ['#9A4A1E', 'Acajou'], ['#3B2416', 'Café'], ['#E2232E', 'Rouge vif'], ['#B0162E', 'Rubis'], ['#F04E7A', 'Grenadine'], ['#FF8FB8', 'Rose'],
  ['#7A1745', 'Mûre'], ['#8A4FD8', 'Violette'], ['#1E9BEA', 'Curaçao'], ['#18C2B0', 'Lagon']];
const TF_DEFAULT = () => ({ su: [0, 5], ac: [0, 5], am: [0, 5], as: [0, 5], fo: [0, 5] });
const F_DEFAULT = () => ({ method: '', glass: '', tag: '', origin: '', level: '', base: '', alc: '', ings: [], ingMode: 'all', tf: TF_DEFAULT() });

const clone = o => JSON.parse(JSON.stringify(o));
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const okColor = c => /^#[0-9a-f]{6}$/i.test(c || '') ? c : '#C9A227';
const okPhoto = p => typeof p === 'string' && (p.startsWith('data:image/') || /^photos\/[a-z0-9-]+\.(jpe?g|png|webp)$/.test(p)) ? p : '';
const fr = n => { const r = Math.round(n * 100) / 100; return String(r).replace('.', ','); };
const plural = (n, w) => n > 1 ? w + 's' : w;
const opts = (arr, sel) => arr.map(v => Array.isArray(v) ? `<option value="${esc(v[0])}"${v[0] === sel ? ' selected' : ''}>${esc(v[1])}</option>` : `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(v)}</option>`).join('');

/* ---------- données ---------- */
function builtinIngs() {
  const o = {};
  INGREDIENTS.forEach(([id, name, cat, fam, sub, abv]) => o[id] = { name, cat, fam, sub, abv });
  return o;
}
function seed() {
  return {
    v: 2, dataVersion: DATA_VERSION, ings: builtinIngs(), recipes: clone(RECIPES), removed: [],
    owned: ['gin', 'vodka', 'rhum-blanc', 'bourbon', 'campari', 'vermouth-rouge', 'triple-sec', 'creme-cassis', 'angostura', 'citron', 'citron-vert', 'sirop-sucre', 'eau-gazeuse', 'tonic', 'menthe', 'prosecco', 'orange', 'cola'],
    lists: [{ id: 'fav', name: 'Favoris', fixed: true, items: ['negroni', 'daiquiri'] }, { id: 'try', name: 'À essayer', fixed: true, items: ['last-word', 'mai-tai'] }],
    ratings: { negroni: 5, daiquiri: 4, bramble: 4.5 }, collections: [],
    notes: { negroni: { text: 'Parfait en apéro. Avec un vermouth plus vanillé, il devient plus rond. À tester avec un gin plus agrumes.', pub: false, at: Date.now() } },
    unit: 'ml', example: true, shop: { recs: [] }, preps: clone(PREPS), prepsRemoved: []
  };
}
function upgrade(d) {
  if (!d.notes || typeof d.notes !== 'object') d.notes = {};
  if (!d.ratings || typeof d.ratings !== 'object') d.ratings = {};
  if (!Array.isArray(d.owned)) d.owned = [];
  if (!Array.isArray(d.lists)) d.lists = [];
  if (!Array.isArray(d.removed)) d.removed = [];
  if (!Array.isArray(d.collections)) d.collections = [];
  if (!d.views || typeof d.views !== 'object') d.views = {};
  if (!d.unit) d.unit = 'ml';
  if (!d.shop || !Array.isArray(d.shop.recs)) d.shop = { recs: [] };
  if (!Array.isArray(d.preps)) d.preps = [];
  if (!Array.isArray(d.prepsRemoved)) d.prepsRemoved = [];
  d.recipes.forEach(r => {
    delete r.iba;
    if (r.origin === 'Ma création') { r.origin = 'Original'; r.by = 'me'; }
    else if (r.origin === 'Autre barman') { r.origin = 'Original'; r.by = 'other'; }
    else if (r.origin !== 'Original') r.origin = 'Classique';
    if (r.origin === 'Original' && !r.by) r.by = r.author ? 'other' : 'me';
    if (r.method === 'Direct dans le verre') r.method = 'Dans le verre';
    if (r.garn == null) r.garn = '';
    if (r.rim == null) r.rim = '';
    if (r.parent != null && typeof r.parent !== 'string') delete r.parent;
  });
  if (d.v === 1) {
    // Recettes d'exemple de la première version : on garde celles qui ont une photo, on remplace les autres par la version complète.
    d.recipes = d.recipes.map(r => {
      const b = BUILTIN.get(r.id); if (!b) return r;
      if (okPhoto(r.photo)) return Object.assign(r, { src: 'builtin', edited: true, garn: b.garn, rim: b.rim, garnish: b.garnish });
      return clone(b);
    });
    d.v = 2; d.dataVersion = 0;
  }
  if (d.dataVersion !== DATA_VERSION) {
    const base = builtinIngs();
    Object.keys(d.ings).forEach(id => {
      if (base[id]) return;
      const i = d.ings[id];
      i.fam = FAM_MAP[i.fam] || i.fam;
      if (!FAM_IDS.includes(i.fam)) i.fam = 'Mes ingrédients';
      if (i.sub == null) i.sub = '';
      i.custom = true;
    });
    Object.assign(d.ings, base);
    RECIPES.forEach(b => {
      const k = d.recipes.findIndex(r => r.id === b.id);
      if (k < 0) { if (!d.removed.includes(b.id)) d.recipes.push(clone(b)); }
      else if (d.recipes[k].src === 'builtin' && !d.recipes[k].edited) d.recipes[k] = clone(b);
      else if (d.recipes[k].src === 'builtin' && !okPhoto(d.recipes[k].photo) && okPhoto(b.photo)) {
        // Recette de départ modifiée par l'utilisateur mais sans photo : elle reçoit la photo ajoutée par une mise à jour (le reste de la recette ne change pas).
        d.recipes[k].photo = b.photo;
        if (b.photoCredit) d.recipes[k].photoCredit = clone(b.photoCredit); else delete d.recipes[k].photoCredit;
      }
      /* Lien de variante : une recette de départ déjà modifiée par l'utilisateur le reçoit tant qu'il ne l'a jamais touché.
         Une fois le formulaire enregistré, le champ existe toujours (vide si le lien a été retiré) et n'est plus remplacé. */
      const cur = d.recipes.find(r => r.id === b.id);
      if (cur && b.parent && cur.src === 'builtin' && !Object.prototype.hasOwnProperty.call(cur, 'parent')) cur.parent = b.parent;
    });
    d.recipes = d.recipes.filter(r => !(RETIRED_IDS.includes(r.id) && r.src === 'builtin' && !r.edited));
    // Préparations maison de départ : ajoutées, ou mises à jour tant qu'elles n'ont pas été modifiées ; une préparation supprimée ne revient pas.
    PREPS.forEach(b => {
      const k = d.preps.findIndex(x => x.id === b.id);
      if (k < 0) { if (!d.prepsRemoved.includes(b.id)) d.preps.push(clone(b)); }
      else if (d.preps[k].src === 'builtin' && !d.preps[k].edited) d.preps[k] = clone(b);
    });
    // Vocabulaire : « shaker » plutôt que « secouer », y compris dans les recettes de départ déjà modifiées par l'utilisateur.
    const shk = t => typeof t === 'string' ? t.replace(/\bSecouer\b/g, 'Shaker').replace(/\bsecouer\b/g, 'shaker').replace(/\bon secoue\b/g, 'on shake') : t;
    d.recipes.forEach(r => { if (r.src === 'builtin') { if (Array.isArray(r.steps)) r.steps = r.steps.map(shk); r.note = shk(r.note); } });
    d.dataVersion = DATA_VERSION;
  }
  /* Version publique : une recette de départ déjà enregistrée sur l'appareil ne garde pas une photo du dossier photos/ dont la licence n'est pas validée.
     Les photos ajoutées par l'utilisateur (données enregistrées dans la sauvegarde) ne sont pas concernées. */
  if (PUBLIC_RELEASE) d.recipes.forEach(r => {
    if (r.src === 'builtin' && typeof r.photo === 'string' && r.photo.startsWith('photos/') && photoState(r.id) !== 'ok') { r.photo = ''; delete r.photoCredit; }
  });
  return d;
}

/* ---------- stockage : IndexedDB, sur l'appareil ---------- */
let storageOK = true, S = seed(), saveT = null;
const IDB = { db: null };
function idbOpen() { return new Promise((res, rej) => { const r = indexedDB.open('zeste', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function idbGet(k) { return new Promise((res, rej) => { const q = IDB.db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
function idbSet(k, v) { return new Promise((res, rej) => { const tx = IDB.db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); }); }
const validData = d => !!(d && (d.v === 1 || d.v === 2) && Array.isArray(d.recipes) && d.ings && typeof d.ings === 'object');
async function load() {
  try {
    IDB.db = await idbOpen();
    const d = await idbGet('state');
    if (validData(d)) { const u = upgrade(d); await idbSet('state', u); return u; }
    try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (validData(o)) { const n = upgrade(o); await idbSet('state', n); return n; } } catch (e) { }
  } catch (e) { storageOK = false; }
  return seed();
}
function save() { clearTimeout(saveT); saveT = setTimeout(flushSave, 250); updateShopBadge(); }
async function flushSave() {
  clearTimeout(saveT); saveT = null;
  if (!IDB.db) { storageOK = false; return; }
  try { await idbSet('state', S); storageOK = true; }
  catch (e) { storageOK = false; toast("Sauvegarde impossible : l'espace de stockage est plein ou bloqué. Une sauvegarde peut être téléchargée depuis l'onglet Données."); }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && saveT) flushSave(); });
window.addEventListener('pagehide', () => { if (saveT) flushSave(); });

/* ---------- appli installable et mises à jour ---------- */
let deferredInstall = null, swReg = null;
const BOOT_AT = Date.now();
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isSamsung = () => /SamsungBrowser/i.test(navigator.userAgent);
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (UI.view === 'catalogue' || UI.view === 'data') render(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; toast('Zeste est installée'); render(); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    swReg = reg;
    // Au lancement de l'appli, une nouvelle version s'applique d'elle-même ; ensuite, un bandeau la propose.
    const offer = w => { if (Date.now() - BOOT_AT < 20000 && !sheetState) w.postMessage({ type: 'SKIP_WAITING' }); else $('#update').hidden = false; };
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); }); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => { }); });
  }).catch(() => { });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; flushSave().finally(() => location.reload()); });
}
function installBlock() {
  if (isStandalone()) return `<p>Zeste est installée sur cet appareil.</p>`;
  if (isSamsung()) return `<p>Samsung Internet installe les applis web de façon incomplète : Google Play Protect affiche alors une fausse alerte. Pour une installation propre, ouvrir ce site dans <b>Chrome</b>, puis menu ⋮ › « Installer l'application ».</p>`;
  if (deferredInstall) return `<p>Zeste peut s'installer comme une appli, sur l'écran d'accueil, et fonctionner sans connexion.</p><div class="row-btns"><button class="btn primary small" data-act="install">Installer Zeste</button></div>`;
  if (isIOS()) return `<p>Sur iPhone ou iPad : ouvrir ce site dans Safari, puis Partager, puis « Sur l'écran d'accueil ».</p>`;
  return `<p class="hint">Si le navigateur le permet, l'option « Installer l'application » ou « Ajouter à l'écran d'accueil » se trouve dans son menu.</p>`;
}

/* ---------- état de l'interface ---------- */
const UI = { view: 'home', q: '', avail: 'all', f: F_DEFAULT(), sort: 'name', filtersOpen: false, barQ: '', open: new Set(), listTab: 'mine', confirm: null, serv: {}, barTab: 'ings', keep: new Set(), newList: null };
let sheetState = null, rowN = 0;
const STAPLES = ['eau']; // toujours disponible
const ownedSet = () => new Set([...S.owned, ...STAPLES]);
const ingName = id => S.ings[id] ? S.ings[id].name : id;
const findIng = name => { const k = norm(name); if (!k) return null; return Object.keys(S.ings).find(id => norm(S.ings[id].name) === k) || null; };
const fmtRating = v => String(v).replace('.', ',');

/* ---------- illustrations : verres, garnitures, rim ---------- */
const GLASS = {
  'Coupe': { o: 'M6 12H54Q50 36 30 38Q10 36 6 12Z', l: 'M9.5 18H50.5Q46.5 33.5 30 35Q13.5 33.5 9.5 18Z', stem: [30, 38, 30, 71], base: [18, 72, 42, 72], rim: [6, 12, 54], lt: 18 },
  'Martini': { o: 'M5 10H55L30 38Z', l: 'M11 15H49L30 36.5Z', stem: [30, 38, 30, 71], base: [18, 72, 42, 72], rim: [5, 10, 55], lt: 15 },
  'Old fashioned': { o: 'M12 30L14.5 72H45.5L48 30', l: 'M13.2 44L14.6 70.5H45.4L46.8 44Z', ice: [21, 47, 14, 13], thick: [14.5, 72, 45.5, 72], rim: [12, 30, 48], lt: 44 },
  'Highball': { o: 'M17 8L18.5 74H41.5L43 8', l: 'M17.4 24L18.6 72.5H41.4L42.6 24Z', ice: [24, 32, 12, 11], thick: [18.5, 74, 41.5, 74], rim: [17, 8, 43], lt: 24 },
  'Verre à vin': { o: 'M14 8Q11 38 30 41Q49 38 46 8', l: 'M13.2 21Q12.8 37 30 39Q47.2 37 46.8 21Z', stem: [30, 41, 30, 71], base: [19, 72, 41, 72], rim: [14, 8, 46], lt: 21 },
  'Flûte': { o: 'M22 4Q19.5 40 30 45Q40.5 40 38 4', l: 'M21.4 13Q20.4 39 30 43Q39.6 39 38.6 13Z', stem: [30, 45, 30, 71], base: [21, 72, 39, 72], rim: [22, 4, 38], lt: 13 },
  'Hurricane': { o: 'M17 6Q14 22 19 32Q23 40 20 50Q19 56 25 58H35Q41 56 40 50Q37 40 41 32Q46 22 43 6', l: 'M16.2 15Q15.6 24 19.6 32.4Q23.6 40.6 20.6 50Q19.9 55.6 25.4 56.5H34.6Q40.1 55.6 39.4 50Q36.4 40.6 40.4 32.4Q44.4 24 43.8 15Z', stem: [30, 58, 30, 71], base: [20, 72, 40, 72], rim: [17, 6, 43], lt: 15 },
  'Mug cuivre': { o: 'M13 22L15.5 72H44.5L47 22', l: 'M13.5 32L15.6 70.5H44.4L46.5 32Z', handle: 'M46.6 30Q58 31 57 45Q56 57 45 57', rim: [13, 22, 47], lt: 32 },
  'Timbale': { o: 'M14 20L16 72H44L46 20', l: 'M14.3 27L16.1 70.5H43.9L45.7 27Z', ice: [20, 30, 20, 9], thick: [16, 72, 44, 72], rim: [14, 20, 46], lt: 27 },
  'Irish coffee': { o: 'M16 10L18 46Q19 50 23 50H37Q41 50 42 46L44 10', l: 'M16.4 16L18.3 45.5Q19.2 48.6 23 48.6H37Q40.8 48.6 41.7 45.5L43.6 16Z', stem: [30, 50, 30, 69], base: [21, 70, 39, 70], handle: 'M43.5 16Q53 17 52 28Q51 38 42.3 38', rim: [16, 10, 44], lt: 16 },
  'Tasse': { o: 'M11 38L13 66Q14 72 20 72H40Q46 72 47 66L49 38', l: 'M11.4 44L13.2 65.5Q14.2 70.6 20 70.6H40Q45.8 70.6 46.8 65.5L48.6 44Z', handle: 'M48.6 44Q58 45 57 54Q56 63 46.8 62', rim: [11, 38, 49], lt: 44 }
};
const FRUIT = Object.fromEntries(GARNISH_FRUITS.map(([k, l, c]) => [k, c]));
function garnLabelKey(k) {
  if (!k) return '';
  const [cut, fruit] = k.split('-');
  const c = GARNISH_CUTS.find(x => x[0] === cut), f = GARNISH_FRUITS.find(x => x[0] === fruit);
  if (c && f) return `${c[1]} ${f[0] === 'orange' ? "d'orange" : 'de ' + f[1]}`;
  const o = GARNISH_OTHERS.find(x => x[0] === k); return o ? o[1] : '';
}
function garnLabel(r) {
  const a = garnLabelKey(r.garn), b = (r.garnish || '').trim();
  if (a && b) return a + ', ' + b.charAt(0).toLowerCase() + b.slice(1);
  return a || b;
}
const rimLabel = k => (RIMS.find(x => x[0] === k) || ['', ''])[1];
function garnSVG(key, G) {
  if (!key) return '';
  const [, y, x2] = G.rim, cx = (G.rim[0] + G.rim[2]) / 2, lt = G.lt;
  const [cut, fruit] = key.split('-'), F = FRUIT[fruit] || '#7DB83A';
  if (cut === 'wheel') {
    const X = x2 - 1, Y = y - 1;
    let s = `<g><circle cx="${X}" cy="${Y}" r="7.4" fill="${F}"/><circle cx="${X}" cy="${Y}" r="5.9" fill="#FFFFFF" fill-opacity=".55"/>`;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s += `<line x1="${X}" y1="${Y}" x2="${(X + Math.cos(a) * 5.9).toFixed(2)}" y2="${(Y + Math.sin(a) * 5.9).toFixed(2)}" stroke="${F}" stroke-width=".8"/>`; }
    return s + `<circle cx="${X}" cy="${Y}" r="1.1" fill="${F}"/></g>`;
  }
  if (cut === 'wedge') return `<g><path d="M${x2 - 7.5} ${y - 5}A8.5 8.5 0 0 1 ${x2 + 7.5} ${y - 5}L${x2} ${y + 1.5}Z" fill="${F}" fill-opacity=".55"/><path d="M${x2 - 7.5} ${y - 5}A8.5 8.5 0 0 1 ${x2 + 7.5} ${y - 5}" fill="none" stroke="${F}" stroke-width="2.4" stroke-linecap="round"/><path d="M${x2} ${y + 1}L${x2 - 3.5} ${y - 7.5}M${x2} ${y + 1}L${x2 + 3.5} ${y - 7.5}" stroke="#FFFFFF" stroke-opacity=".7" stroke-width=".7"/></g>`;
  if (cut === 'zest') return `<path d="M${x2 - 3} ${y - 1.5}c5 -3.5 8.5 .5 5.5 5c-3 4 .5 8.5 4.5 7.5" fill="none" stroke="${F}" stroke-width="2.6" stroke-linecap="round"/>`;
  switch (key) {
    case 'cherry': return `<g><path d="M${x2 - 2} ${y + 1.6}q1 -7 6.5 -10" fill="none" stroke="#6B4A2A" stroke-width=".9" stroke-linecap="round"/><circle cx="${x2 - 2}" cy="${y + 3.6}" r="3.5" fill="#B3172E"/><circle cx="${x2 - 3.2}" cy="${y + 2.5}" r=".95" fill="#FFFFFF" fill-opacity=".6"/></g>`;
    case 'mint': return `<g transform="translate(${x2 - 6} ${y + 1.5})"><path d="M0 0V-10" stroke="#2F6E35" stroke-width=".8"/><g fill="#3E9A4A"><ellipse cx="-2.7" cy="-3.8" rx="3.1" ry="1.5" transform="rotate(-32 -2.7 -3.8)"/><ellipse cx="2.7" cy="-5.4" rx="3.1" ry="1.5" transform="rotate(32 2.7 -5.4)"/><ellipse cx="-2.3" cy="-8.3" rx="2.7" ry="1.3" transform="rotate(-38 -2.3 -8.3)"/><ellipse cx="2.1" cy="-9.6" rx="2.5" ry="1.25" transform="rotate(38 2.1 -9.6)"/><ellipse cx="0" cy="-11.4" rx="1.3" ry="2.3"/></g></g>`;
    case 'coffee': return [-4.2, 0, 4.2].map((d, i) => `<g transform="rotate(${[-20, 10, 30][i]} ${cx + d} ${lt + (i === 1 ? .4 : 1.3)})"><ellipse cx="${cx + d}" cy="${lt + (i === 1 ? .4 : 1.3)}" rx="2" ry="1.35" fill="#3A2210"/><line x1="${cx + d - 1.5}" y1="${lt + (i === 1 ? .4 : 1.3)}" x2="${cx + d + 1.5}" y2="${lt + (i === 1 ? .4 : 1.3)}" stroke="#7A5232" stroke-width=".45"/></g>`).join('');
    case 'olive': return `<g><line x1="${x2 + 4}" y1="${y - 8}" x2="${cx - 2}" y2="${lt + 12}" stroke="#9A7A4A" stroke-width=".9" stroke-linecap="round"/><ellipse cx="${cx + 1.2}" cy="${lt + 7}" rx="3.2" ry="2.5" fill="#8FA33A" stroke="#6D7F2A" stroke-width=".5"/><circle cx="${cx + 2.6}" cy="${lt + 6.4}" r="1" fill="#C8302A"/></g>`;
    case 'berry': return `<g fill="#3A1030"><ellipse cx="${x2 - 1}" cy="${y - 7.4}" rx="1.2" ry="2" fill="#4E9A3A"/>${[[0, 0], [-2.2, -.6], [2.2, -.6], [-1.1, -2.5], [1.1, -2.5], [-1.1, 1.8], [1.1, 1.8], [0, -4]].map(([a, b]) => `<circle cx="${x2 - 1 + a}" cy="${y - 2 + b}" r="1.45"/>`).join('')}<circle cx="${x2 - 2.6}" cy="${y - 3.2}" r=".5" fill="#FFFFFF" fill-opacity=".5"/></g>`;
    case 'pineapple': return `<g><path d="M${x2 + 2} ${y - 7}l-3.4 -6.4M${x2 + 2} ${y - 7}l0 -7.4M${x2 + 2} ${y - 7}l3.4 -6.4" stroke="#4E9A3A" stroke-width="1.5" stroke-linecap="round"/><path d="M${x2 - 5.5} ${y + 1}L${x2 + 7.5} ${y + 1}L${x2 + 2} ${y - 7.5}Z" fill="#F2C94C" stroke="#C99A2A" stroke-width=".6" stroke-linejoin="round"/><line x1="${x2 - 5.5}" y1="${y + 1}" x2="${x2 + 7.5}" y2="${y + 1}" stroke="#A8782A" stroke-width="1.6"/></g>`;
    case 'celery': return `<g><line x1="${x2 - 7}" y1="${lt + 18}" x2="${x2 + 2}" y2="${y - 10}" stroke="#9CCB6A" stroke-width="3.2" stroke-linecap="round"/><line x1="${x2 - 6.6}" y1="${lt + 17}" x2="${x2 + 1.8}" y2="${y - 9}" stroke="#D2EBAE" stroke-width=".9"/><g fill="#5DA03E"><ellipse cx="${x2 + .5}" cy="${y - 13}" rx="1.6" ry="2.6" transform="rotate(-25 ${x2 + .5} ${y - 13})"/><ellipse cx="${x2 + 4}" cy="${y - 12}" rx="1.6" ry="2.6" transform="rotate(30 ${x2 + 4} ${y - 12})"/><ellipse cx="${x2 + 2.4}" cy="${y - 15}" rx="1.4" ry="2.3"/></g></g>`;
  }
  return '';
}
function rimSVG(rim, G) {
  if (!rim) return '';
  const [x1, y, x2] = G.rim, end = rim.includes('moitie') ? (x1 + x2) / 2 : x2, col = rim.startsWith('sel') ? '#FFFFFF' : '#F6E7B8';
  const row = (dy, off) => `<line x1="${x1 + .6}" y1="${y + dy}" x2="${end}" y2="${y + dy}" stroke="#A9A291" stroke-width="2.9" stroke-linecap="round" stroke-dasharray=".01 1.6" stroke-dashoffset="${off}"/><line x1="${x1 + .6}" y1="${y + dy}" x2="${end}" y2="${y + dy}" stroke="${col}" stroke-width="2.1" stroke-linecap="round" stroke-dasharray=".01 1.6" stroke-dashoffset="${off}"/>`;
  return row(-.5, 0) + row(1.1, .8);
}
function glassSVG(g, color, garn, rim) {
  const G = GLASS[g] || GLASS['Coupe'], ln = (a, w) => `<line x1="${a[0]}" y1="${a[1]}" x2="${a[2]}" y2="${a[3]}" stroke="currentColor" stroke-width="${w}" stroke-linecap="round"/>`;
  let s = `<svg class="glass" viewBox="-6 -14 72 94" aria-hidden="true"><path d="${G.l}" fill="${color}"/>`;
  if (G.ice) s += `<rect x="${G.ice[0]}" y="${G.ice[1]}" width="${G.ice[2]}" height="${G.ice[3]}" rx="2" fill="#FFFFFF" fill-opacity=".28" stroke="#FFFFFF" stroke-opacity=".5"/>`;
  if (garn === 'olive' || garn === 'celery') s += garnSVG(garn, G);
  s += `<path d="${G.o}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (G.stem) s += ln(G.stem, 1.6); if (G.base) s += ln(G.base, 1.8); if (G.thick) s += ln(G.thick, 3.2);
  if (G.handle) s += `<path d="${G.handle}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`;
  s += rimSVG(rim, G);
  if (garn && garn !== 'olive' && garn !== 'celery') s += garnSVG(garn, G);
  return s + '</svg>';
}
function garnIcon(key) {
  if (!key) return `<svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="8" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".45"/><line x1="9.5" y1="20.5" x2="20.5" y2="9.5" stroke="currentColor" stroke-width="1.4" opacity=".45"/></svg>`;
  const G = { rim: [26, 28, 38], lt: 27 };
  return `<svg viewBox="26.5 13 21 23" aria-hidden="true"><line x1="27" y1="28" x2="43" y2="28" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" opacity=".35"/>${garnSVG(key, G)}</svg>`;
}
const visual = r => okPhoto(r.photo) ? `<img src="${r.photo}" data-rid="${esc(r.id)}" alt="" loading="lazy" decoding="async">` : glassSVG(r.glass, okColor(r.color), r.garn, r.rim);
/* Photo introuvable (fichier retiré de la version publique, ou hors ligne sans que la photo ait été mise en cache) : retour à l'illustration du verre. */
document.addEventListener('error', e => {
  const i = e.target; if (!i || i.tagName !== 'IMG' || !i.dataset || !i.dataset.rid) return;
  const r = S.recipes.find(x => x.id === i.dataset.rid); if (!r) return;
  i.insertAdjacentHTML('afterend', glassSVG(r.glass, okColor(r.color), r.garn, r.rim)); i.remove();
}, true);

/* ---------- disponibilité, substitutions, dosage ---------- */
// Un remplaçant est soit un identifiant (même dosage), soit { id, qty, unit } (autre dosage).
const altId = a => typeof a === 'string' ? a : a.id;
const altTxt = (a, k) => typeof a === 'string' || !a.qty ? ingName(altId(a)) : `${fmtQty(a, k)} ${ingName(a.id)}`;
function rowStatusBase(row, owned) {
  if (owned.has(row.id)) return { st: 'ok' };
  for (const a of (row.alts || [])) if (owned.has(altId(a))) return { st: 'sub', by: altId(a) };
  if (row.sub) { const cat = S.ings[row.id] && S.ings[row.id].cat; for (const o of owned) if (o !== row.id && S.ings[o] && S.ings[o].cat === cat) return { st: 'sub', by: o }; }
  return { st: row.opt ? 'opt' : 'miss' };
}
/* Préparations maison réalisables avec le bar : un ingrédient manquant qu'une préparation sait produire
   (« Ingrédient obtenu ») n'est plus manquant, il est à faire maison. */
const _homeCache = new WeakMap();
function homeMap(owned) {
  let m = _homeCache.get(owned); if (m) return m;
  m = new Map();
  (S.preps || []).forEach(p => { if (p.makes && !m.has(p.makes) && p.ings.length && p.ings.every(row => rowStatusBase(row, owned).st !== 'miss')) m.set(p.makes, p); });
  _homeCache.set(owned, m); return m;
}
function homeFor(row, owned) {
  const m = homeMap(owned); if (!m.size) return null;
  const ids = [row.id, ...(row.alts || []).map(altId)];
  for (const id of ids) if (m.has(id)) return m.get(id);
  if (row.sub) { const cat = S.ings[row.id] && S.ings[row.id].cat; for (const [id, p] of m) if (S.ings[id] && S.ings[id].cat === cat) return p; }
  return null;
}
function rowStatus(row, owned) {
  const b = rowStatusBase(row, owned);
  if (b.st === 'miss') { const h = homeFor(row, owned); if (h) return { st: 'home', prep: h.id }; }
  return b;
}
function analyze(r, owned) {
  const miss = [], home = []; let subs = 0;
  const rows = r.ings.map(row => { const s = rowStatus(row, owned); if (s.st === 'miss') miss.push(row.id); if (s.st === 'sub') subs++; if (s.st === 'home' && !home.includes(s.prep)) home.push(s.prep); return s; });
  return { rows, miss, subs, home };
}
const prepName = id => { const p = S.preps.find(x => x.id === id); return p ? p.name : id; }
/* Recherche par ingrédient : l'ingrédient lui-même, un équivalent du même groupe, ou un remplaçant prévu. */
function ingMatch(r, id) {
  const cat = norm(S.ings[id] && S.ings[id].cat);
  const near = c => { c = norm(c); return !!cat && !!c && (c.startsWith(cat) || cat.startsWith(c)); };
  return r.ings.some(x => x.id === id || (S.ings[x.id] && near(S.ings[x.id].cat)) || (x.alts || []).some(a => altId(a) === id));
}
function resolveIng(txt) {
  const k = norm(txt); if (!k) return null;
  const exact = findIng(txt); if (exact) return exact;
  const ids = Object.keys(S.ings).filter(id => norm(S.ings[id].name).includes(k));
  return ids.length === 1 ? ids[0] : (ids.find(id => norm(S.ings[id].name).startsWith(k)) || ids[0] || null);
}
function addFilterIng() {
  const inp = $('#f-ing-i'); if (!inp) return;
  const id = resolveIng(inp.value);
  if (!id) { toast('Ingrédient introuvable : choisir un nom dans la liste.'); return; }
  if (!UI.f.ings.includes(id)) UI.f.ings.push(id);
  renderCatalogue($('#view')); const n = $('#f-ing-i'); if (n) n.focus({ preventScroll: true });
}
/* Sans alcool : aucun ingrédient alcoolisé. */
const isNA = r => r.ings.every(i => !(S.ings[i.id] && +S.ings[i.id].abv));
/* Facile : peu d'ingrédients, pas de blanc d'œuf ni de blender. */
/* Niveau « Facile » : réglé dans la recette (r.easy, vrai ou faux) ; sans réglage, il se déduit des ingrédients.
   Automatique : jamais facile avec un blender ou un œuf ; sinon 4 ingrédients au plus quand tout se fait dans le verre, le pichet
   ou la casserole (sans shaker ni verre à mélange), 3 au plus pour les autres méthodes. L'eau et les ingrédients facultatifs ne comptent pas. */
const DIRECT = ['Dans le verre', 'Dans un pichet', 'À la casserole'];
function isEasy(r) {
  if (typeof r.easy === 'boolean') return r.easy;
  const main = r.ings.filter(i => !i.opt && !STAPLES.includes(i.id));
  if (r.method === 'Blender' || main.some(i => ['blanc-oeuf', 'jaune-oeuf'].includes(i.id))) return false;
  return DIRECT.includes(r.method) ? main.length <= 4 : main.length <= 3;
}
function origLabel(r) {
  if (isZeste(r)) return 'Cocktail Zeste';
  if (r.origin === 'Original') return 'Original · ' + (r.by === 'other' ? (r.author || 'Autre barman') : 'Ma création');
  return r.source ? 'Classique · ' + r.source : 'Classique';
}
function statusPill(a) {
  if (!a.miss.length) return a.home.length ? ['sub', 'Avec préparation maison'] : a.subs ? ['sub', 'Avec substitut'] : ['ok', 'Réalisable'];
  return a.miss.length === 1 ? ['one', 'Manque 1'] : ['many', `Manque ${a.miss.length}`];
}
function estAbv(r) {
  let alc = 0, vol = 0;
  r.ings.forEach(row => { const f = ML[row.unit]; if (f == null) return; const ml = row.unit === 'à compléter' ? f : qMid(row) * f; const i = S.ings[row.id]; vol += ml; alc += ml * ((i && +i.abv) || 0) / 100; });
  if (!vol) return null;
  const d = DIL[r.method] != null ? DIL[r.method] : .15;
  return Math.round(alc / (vol * (1 + d)) * 100);
}
// Unités américaines saisies dans le formulaire : converties en ml à l'enregistrement (1 oz = 30 ml, 1 cup = 240 ml, arrondi à 5 ml).
function usToMl(q, unit) { const ml = q * (unit === 'cup' ? 240 : 30); return ml >= 20 ? Math.round(ml / 5) * 5 : Math.round(ml); }
// Fractions usuelles des recettes américaines : ⅛ ¼ ⅓ ½ ⅔ ¾ (à la plus proche).
const FRACS = [[0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, '']];
function fmtFrac(x) {
  let w = Math.floor(x); const f = x - w;
  const best = FRACS.reduce((m, c) => Math.abs(c[0] - f) < Math.abs(m[0] - f) ? c : m);
  if (best[0] === 1) w += 1;
  return w ? (best[1] && best[0] < 1 ? `${w} ${best[1]}` : `${w}`) : (best[1] && best[0] < 1 ? best[1] : '0');
}
const fmtCup = fmtFrac, fmtOz = fmtFrac;
/* Fourchette : row.qty2 (> qty) donne la quantité maximale, ex. « 3 à 6 dashs ». */
const hasRange = row => row.unit !== 'à compléter' && +row.qty2 > +row.qty && +row.qty > 0;
const qMid = row => hasRange(row) ? (+row.qty + +row.qty2) / 2 : (+row.qty || 0);
const qMax = row => hasRange(row) ? +row.qty2 : (+row.qty || 0);
function fmtQty(row, k) {
  if (hasRange(row)) {
    const a = fmtQty({ ...row, qty2: 0 }, k), b = fmtQty({ ...row, qty: row.qty2, qty2: 0 }, k);
    const sp = t => { const i = t.search(/[A-Za-zÀ-ÿ]/); return i < 0 ? [t, ''] : [t.slice(0, i).trim(), t.slice(i)]; };
    const [na, ua] = sp(a), [nb, ub] = sp(b), base = u => u.replace(/(es|s)$/, '');
    return base(ua) === base(ub) ? `${na} à ${nb} ${ub}`.trim() : `${a} à ${b}`;
  }
  const q = (+row.qty || 0) * (k || 1);
  if (row.unit === 'à compléter') return 'Compléter';
  if (row.unit === 'ml' || row.unit === 'cl') {
    const ml = row.unit === 'cl' ? q * 10 : q;
    if (S.unit === 'cl') return ml >= 1000 ? fr(ml / 1000) + ' L' : fr(ml / 10) + ' cl';
    if (S.unit === 'oz') { const oz = ml / 29.574; if (oz >= 8) { const c = oz / 8; return fmtCup(c) + (c >= 1.0625 ? ' cups' : ' cup'); } return fmtOz(oz) + ' oz'; }
    return ml >= 1000 ? fr(ml / 1000) + ' L' : fr(ml) + ' ml';
  }
  if (!row.unit) return fr(q); // sans unité : « 2 » concombre, « 1 » citron
  return fr(q) + ' ' + (PLURAL_UNITS.includes(row.unit) ? plural(q, row.unit) : row.unit);
}
const starsHTML = n => `<span class="stars" aria-label="${fmtRating(n)} sur 5"><span class="s-bg">★★★★★</span><span class="s-fg" style="width:${n / 5 * 100}%">★★★★★</span></span>`;
const tfActive = ([a, b]) => a > 0 || b < 5;
const tfText = ([a, b]) => a === 0 && b === 5 ? 'Tous' : a === b ? `= ${a}` : a === 0 ? `≤ ${b}` : b === 5 ? `≥ ${a}` : `${a} à ${b}`;
const filterCount = () => ['method', 'glass', 'tag', 'origin', 'level', 'base', 'alc'].filter(k => UI.f[k]).length + (UI.f.ings.length ? 1 : 0) + TASTE.filter(([k]) => tfActive(UI.f.tf[k])).length;

let toastT, noteT = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }
function noteHint(n) { const d = n && n.at && n.text ? ' · Modifié le ' + new Date(n.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; return (n && n.pub ? "Public : partagé avec la communauté quand le site communautaire existera. Pour l'instant, tout reste sur cet appareil." : 'Privé : visible uniquement sur cet appareil.') + d; }
function autosize(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
function flushNote() { if (noteT) { clearTimeout(noteT); noteT = null; save(); } }
function lockScroll() { document.body.classList.add('locked'); }
function unlockScroll() { if (!sheetState && $('#crop').hidden && $('#pick').hidden) document.body.classList.remove('locked'); }

/* ---------- vues ---------- */
/* Mention de santé publique et accès aux crédits, en bas de chaque écran. */
const legalHTML = () => `<p class="legal">L'abus d'alcool est dangereux pour la santé. À consommer avec modération. <button type="button" class="btn link small" data-act="view" data-v="about">Crédits et mentions</button></p>`;
function render() {
  const cur = UI.view === 'about' ? 'data' : UI.view;
  document.querySelectorAll('[data-act="view"][data-v]').forEach(b => { const on = b.dataset.v === cur; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const m = $('#view');
  // Les rangées horizontales de l'accueil gardent leur position de défilement d'un affichage à l'autre.
  const rows = {}; m.querySelectorAll('.hrow[data-row]').forEach(el => rows[el.dataset.row] = el.scrollLeft);
  if (UI.view === 'home') { renderHome(m); m.querySelectorAll('.hrow[data-row]').forEach(el => { if (rows[el.dataset.row]) el.scrollLeft = rows[el.dataset.row]; }); }
  else if (UI.view === 'catalogue') renderCatalogue(m);
  else if (UI.view === 'bar') renderBar(m);
  else if (UI.view === 'lists') renderLists(m);
  else if (UI.view === 'shop') renderShop(m);
  else if (UI.view === 'about') renderAbout(m);
  else renderData(m);
  if (UI.view !== 'about') m.insertAdjacentHTML('beforeend', legalHTML());
  updateShopBadge();
}

const SEARCH_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
function renderCatalogue(m) {
  const own = ownedSet(), all = S.recipes.map(r => analyze(r, own));
  const nOk = all.filter(a => !a.miss.length).length, nOne = all.filter(a => a.miss.length === 1).length;
  const tags = [...new Set(S.recipes.flatMap(r => r.tags))].sort((a, b) => a.localeCompare(b, 'fr'));
  const nf = filterCount();
  m.innerHTML = `
  ${S.example ? `<div class="note-banner"><p><b>Données d'exemple.</b> Le bar, les notes et les listes sont pré-remplis pour la découverte. Tout reste modifiable.</p><button class="btn small" data-act="dismiss-example">Compris</button></div>` : ''}
  ${deferredInstall && !S.installDismissed && !isStandalone() && !isSamsung() ? `<div class="note-banner install"><p><b>Installer Zeste</b> pour l'ouvrir comme une appli, même hors ligne.</p><div class="row-btns"><button class="btn small ghost" data-act="install-later">Plus tard</button><button class="btn small primary" data-act="install">Installer</button></div></div>` : ''}
  <h1 class="view">Catalogue</h1>
  <div class="cat-layout">
    <aside class="filters${UI.filtersOpen ? '' : ' closed'}" aria-label="Filtres">
      <div class="fhead"><h2>Filtres</h2><div class="row-btns"><button class="btn small ghost" data-act="clear-filters" id="f-clear" style="visibility:${nf ? 'visible' : 'hidden'}">Effacer</button><button class="btn small ghost fclose" data-act="toggle-filters">Fermer</button></div></div>
      <div class="field"><span>Ingrédients</span>
        <div class="ed-chips">${UI.f.ings.map(id => `<span class="ed-chip">${esc(ingName(id))}<button type="button" data-act="f-ing-rm" data-id="${esc(id)}" aria-label="Retirer ${esc(ingName(id))}">×</button></span>`).join('')}</div>
        <div class="ed-add"><input type="text" id="f-ing-i" aria-label="Ajouter un ingrédient au filtre" list="dl-fing" placeholder="ex. Gin, citron vert…" autocomplete="off"><button type="button" class="btn small" data-act="f-ing-add">Ajouter</button></div>
        <datalist id="dl-fing">${[...new Set(S.recipes.flatMap(r => r.ings.map(i => i.id)))].filter(id => S.ings[id]).map(ingName).sort((a, b) => a.localeCompare(b, 'fr')).map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist>
        ${UI.f.ings.length > 1 ? `<div class="seg mini" role="group" aria-label="Combinaison" style="align-self:flex-start">${[['all', 'Tous ces ingrédients'], ['any', 'Au moins un']].map(([v, l]) => `<button type="button" data-act="f-ing-mode" data-v="${v}" class="${UI.f.ingMode === v ? 'on' : ''}" aria-pressed="${UI.f.ingMode === v}">${l}</button>`).join('')}</div>` : ''}
        <p class="hint">Les équivalents comptent aussi : chercher le Cointreau trouve les recettes au triple sec.</p>
      </div>
      <div class="tf"><h3 class="lbl">Profil de goût</h3>
        <p class="hint">Chaque cocktail est noté de 0 à 5 sur chaque goût. Il suffit de régler l'intervalle voulu, par exemple Force de 0 à 2 et Astringent de 4 à 5.</p>
        ${TASTE.map(([k, l]) => { const [a, b] = UI.f.tf[k]; return `<div class="tf-row${tfActive([a, b]) ? ' active' : ''}" data-k="${k}"><span>${l}</span><div class="dual" style="--a:${a};--b:${b}"><span class="fill"></span><input type="range" class="dr" data-k="${k}" data-e="0" min="0" max="5" step="1" value="${a}" aria-label="${l} minimum"><input type="range" class="dr" data-k="${k}" data-e="1" min="0" max="5" step="1" value="${b}" aria-label="${l} maximum"></div><span class="tv">${tfText([a, b])}</span></div>`; }).join('')}
      </div>
      <label class="field" for="cf-alc"><span>Alcool</span><select id="cf-alc">${opts([['', 'Avec et sans alcool'], ['na', 'Sans alcool'], ['alc', 'Avec alcool']], UI.f.alc)}</select></label>
      <label class="field" for="cf-base"><span>Alcool de base</span><select id="cf-base">${opts([['', 'Tous'], ...FAMILIES[0].subs.map(x => [x, x])], UI.f.base)}</select></label>
      <label class="field" for="cf-level"><span>Niveau</span><select id="cf-level">${opts([['', 'Tous'], ['easy', 'Facile : peu d’ingrédients, sans technique']], UI.f.level)}</select></label>
      <label class="field" for="cf-origin"><span>Origine</span><select id="cf-origin">${opts(ORIGIN_F, UI.f.origin)}</select></label>
      <label class="field" for="cf-method"><span>Méthode</span><select id="cf-method">${opts([['', 'Toutes'], ...METHODS.map(x => [x, x])], UI.f.method)}</select></label>
      <label class="field" for="cf-glass"><span>Verre</span><select id="cf-glass">${opts([['', 'Tous'], ...GLASSES.map(x => [x, x])], UI.f.glass)}</select></label>
      <label class="field" for="cf-tag"><span>Mood / tag</span><select id="cf-tag">${opts([['', 'Tous'], ...tags.map(x => [x, x])], UI.f.tag)}</select></label>
    </aside>
    <div class="cat-main">
      <label class="search" for="cf-q">${SEARCH_ICON}<input id="cf-q" type="search" placeholder="Nom, ingrédient, tag, barman…" value="${esc(UI.q)}" autocomplete="off"></label>
      <div class="seg" role="group" aria-label="Disponibilité">${[['all', 'Tous', all.length], ['ok', 'Réalisables', nOk], ['one', 'Manque 1', nOne]].map(([v, l, n]) => `<button data-act="avail" data-v="${v}" class="${UI.avail === v ? 'on' : ''}" aria-pressed="${UI.avail === v}">${l}<span class="n">${n}</span></button>`).join('')}</div>
      <div class="ctl-row">
        <button class="btn small btn-filters" data-act="toggle-filters" aria-expanded="${UI.filtersOpen}">Filtres<span id="nf-badge">${nf ? ` · ${nf}` : ''}</span></button>
        <label class="sort" for="cf-sort">Trier par <select id="cf-sort">${opts([['name', 'Nom'], ['rating', 'Ma note'], ['ready', 'Le plus faisable'], ['recent', 'Ajout récent']], UI.sort)}</select></label>
      </div>
      ${UI.f.ings.length ? `<div class="chips f-active"><span class="hint">${UI.f.ings.length > 1 ? (UI.f.ingMode === 'all' ? 'Avec tous ces ingrédients :' : 'Avec au moins un de :') : 'Avec :'}</span>${UI.f.ings.map(id => `<button class="chip on" data-act="f-ing-rm" data-id="${esc(id)}" aria-label="Retirer ${esc(ingName(id))}">${esc(ingName(id))} ×</button>`).join('')}</div>` : ''}
      <div id="results" class="grid"></div>
    </div>
  </div>`;
  renderResults();
}
function refreshFilterBadge() {
  const nf = filterCount(), b = $('#nf-badge'), c = $('#f-clear');
  if (b) b.textContent = nf ? ` · ${nf}` : ''; if (c) c.style.visibility = nf ? 'visible' : 'hidden';
}
function renderResults() {
  const el = $('#results'); if (!el) return;
  const own = ownedSet(), words = norm(UI.q).split(/\s+/).filter(Boolean), F = UI.f;
  let list = S.recipes.map(r => ({ r, a: analyze(r, own) })).filter(({ r, a }) => {
    if (UI.avail === 'ok' && a.miss.length) return false;
    if (UI.avail === 'one' && a.miss.length !== 1) return false;
    if (F.method && r.method !== F.method) return false;
    if (F.glass && r.glass !== F.glass) return false;
    if (F.tag && !r.tags.includes(F.tag)) return false;
    if (F.origin === 'classic' && r.origin !== 'Classique') return false;
    if (F.origin === 'mine' && !(r.origin === 'Original' && r.by !== 'other')) return false;
    if (F.origin === 'zeste' && !isZeste(r)) return false;
    if (F.origin === 'other' && !(r.origin === 'Original' && r.by === 'other' && !isZeste(r))) return false;
    if (F.level === 'easy' && !isEasy(r)) return false;
    if (F.alc === 'na' && !isNA(r)) return false;
    if (F.ings.length) { const hits = F.ings.map(id => ingMatch(r, id)); if (F.ingMode === 'any' ? !hits.some(Boolean) : !hits.every(Boolean)) return false; }
    if (F.alc === 'alc' && isNA(r)) return false;
    if (F.base && !r.ings.some(i => S.ings[i.id] && S.ings[i.id].fam === 'Spiritueux' && S.ings[i.id].sub === F.base)) return false;
    for (const [k] of TASTE) { if (!tfActive(F.tf[k])) continue; const v = r.flavor[k], [lo, hi] = F.tf[k]; if (v == null || v < lo || v > hi) return false; }
    if (words.length) {
      /* Recherche par début de mot (« co » ne trouve plus « cocktail » ni un « co » au milieu d'un mot), sans le nom du verre.
         Chaque mot cherché a un rang : 0 = dans le nom, 1 = dans un ingrédient, 2 = ailleurs (tags, auteur, notes…). Le rang de la recette est le pire de ses mots. */
      const toks = s => norm(s).split(/[^a-z0-9]+/).filter(Boolean);
      const nameT = toks(r.name + ' ' + (r.subtitle || '')), ingT = toks(r.ings.map(i => ingName(i.id)).join(' '));
      const otherT = toks([r.author, r.source || '', isNA(r) ? 'sans alcool mocktail' : '', garnLabel(r), origLabel(r), r.method, ...r.tags, S.notes[r.id] ? S.notes[r.id].text : '', (parentOf(r) || {}).name || ''].join(' '));
      let tier = 0;
      for (const w of words) {
        const has = t => t.some(x => x.startsWith(w));
        const k = has(nameT) ? 0 : has(ingT) ? 1 : has(otherT) ? 2 : -1;
        if (k < 0) return false;
        tier = Math.max(tier, k);
      }
      a._tier = tier;
    } else a._tier = 0;
    return true;
  });
  const byName = (x, y) => x.r.name.localeCompare(y.r.name, 'fr');
  if (words.length) { const by = list.slice().sort(UI.sort === 'rating' ? (x, y) => (S.ratings[y.r.id] || 0) - (S.ratings[x.r.id] || 0) || byName(x, y) : UI.sort === 'ready' ? (x, y) => x.a.miss.length - y.a.miss.length || byName(x, y) : UI.sort === 'recent' ? (x, y) => (y.r.created || 0) - (x.r.created || 0) || byName(x, y) : byName); list = by.sort((x, y) => x.a._tier - y.a._tier); }
  else if (UI.sort === 'rating') list.sort((x, y) => (S.ratings[y.r.id] || 0) - (S.ratings[x.r.id] || 0) || byName(x, y));
  else if (UI.sort === 'ready') list.sort((x, y) => x.a.miss.length - y.a.miss.length || byName(x, y));
  else if (UI.sort === 'recent') list.sort((x, y) => (y.r.created || 0) - (x.r.created || 0) || byName(x, y));
  else list.sort(byName);
  el.innerHTML = list.length ? list.map(({ r, a }) => {
    const [cls, txt] = statusPill(a), rt = S.ratings[r.id] || 0;
    return `<button class="card" data-act="open" data-id="${esc(r.id)}" style="--c:${okColor(r.color)}">
      <span class="cv">${visual(r)}<span class="pill ${cls}">${txt}</span></span>
      <span class="cb"><span class="cname">${esc(r.name)}</span>${r.subtitle ? `<span class="csub">${esc(r.subtitle)}</span>` : ''}<span class="cmeta">${esc(r.method)} · ${esc(r.glass)}</span>${parentOf(r) ? `<span class="cvar">Variante de ${esc(parentOf(r).name)}</span>` : ''}
      <span class="crow">${rt ? starsHTML(rt) : '<span class="unrated">Pas encore noté</span>'}${isNA(r) ? '<span class="otag">Sans alcool</span>' : r.origin === 'Original' ? `<span class="otag">${isZeste(r) ? 'Zeste' : r.by === 'other' ? 'Original' : 'Ma création'}</span>` : ''}</span></span></button>`;
  }).join('') : `<div class="empty"><p>Aucun cocktail ne correspond.</p><button class="btn small" data-act="clear-all">Tout réafficher</button></div>`;
}

/* ---------- accueil ---------- */
const fmtHour = d => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');
/* L'heure affichée suit l'horloge ; au changement de moment de la journée, l'accueil se recompose. */
function tickClock() {
  if (UI.view !== 'home' || document.visibilityState !== 'visible') return;
  const now = new Date(), key = moment(now.getHours()).key + (now.getHours() < 6 && !UI.lateOk ? '-late' : '');
  if (key !== UI.homeKey && !sheetState) { render(); return; }
  document.querySelectorAll('.now-h').forEach(el => el.textContent = fmtHour(now));
}
setInterval(tickClock, 10000);
document.addEventListener('visibilitychange', tickClock);
const SPIRITS = ['Gin', 'Rhum & cachaça', 'Whisky', 'Tequila & mezcal', 'Vodka', 'Brandy & cognac'];
const SPIRIT_LABEL = { 'Gin': 'Gin', 'Rhum & cachaça': 'Rhum', 'Whisky': 'Whisky', 'Tequila & mezcal': 'Tequila', 'Vodka': 'Vodka', 'Brandy & cognac': 'Cognac' };
function daySeed(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffled(arr, seed) { const a = [...arr]; let x = seed || 1; for (let i = a.length - 1; i > 0; i--) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; const j = x % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function moment(h) {
  const hasTag = (r, t) => t.some(x => r.tags.includes(x));
  const light = r => r.flavor.fo == null || r.flavor.fo <= 2;
  if (h >= 6 && h < 11) return { key: 'matin', title: 'Ce matin', lead: 'Des recettes de brunch, légères et fruitées.', pick: r => hasTag(r, ['Brunch']) || (hasTag(r, ['Fruité']) && light(r)) };
  if (h >= 11 && h < 17) return { key: 'aprem', title: 'Cet après-midi', lead: 'Des verres frais et peu alcoolisés pour la journée.', pick: r => hasTag(r, ['Rafraîchissant', 'Estival', 'Pétillant']) && light(r) };
  if (h >= 17 && h < 21) return { key: 'apero', title: 'L’heure de l’apéro', lead: 'Amers, bulles et spritz pour ouvrir l’appétit.', pick: r => hasTag(r, ['Apéritif']) };
  if (h >= 21 && h < 24) return { key: 'soiree', title: 'Ce soir', lead: 'Des classiques pour la soirée et la fin de repas.', pick: r => hasTag(r, ['Festif', 'Digestif', 'Tiki', 'Fin de soirée']) };
  return { key: 'nuit', title: 'Fin de soirée', lead: 'À cette heure, plutôt sans alcool.', pick: r => isNA(r) };
}
function hcard(r, sub) {
  return `<button class="hcard" data-act="open" data-id="${esc(r.id)}" style="--c:${okColor(r.color)}"><span class="cv">${visual(r)}${isNA(r) ? '<span class="na-pill">Sans alcool</span>' : ''}</span><span class="hname">${esc(r.name)}</span>${sub ? `<span class="hsub">${esc(sub)}</span>` : ''}</button>`;
}
const hrow = (title, items, more) => items.length ? `<section class="hsec"><div class="shead"><h2>${title}</h2>${more || ''}</div><div class="hrow" data-row="${esc(title)}">${items.join('')}</div></section>` : '';
function renderHome(m) {
  const now = new Date(), h = now.getHours(), M = moment(h), own = ownedSet(), seed = daySeed(now.toDateString() + M.key);
  const an = new Map(S.recipes.map(r => [r.id, analyze(r, own)]));
  const ok = r => !an.get(r.id).miss.length;
  const pool = S.recipes.filter(M.pick);
  const picks = [...shuffled(pool.filter(ok), seed), ...shuffled(pool.filter(r => !ok(r)), seed)];
  const feat = picks[0];
  const late = (h < 6) && !UI.lateOk;
  const ready = shuffled(S.recipes.filter(ok), seed).sort((a, b) => (S.ratings[b.id] || 0) - (S.ratings[a.id] || 0));
  const naList = shuffled(S.recipes.filter(isNA), seed);
  const near = shuffled(S.recipes.filter(r => an.get(r.id).miss.length === 1), seed);
  const bc = findColl('grandes-quantites'), batch = bc ? collRecipes(bc) : [];
  const seen = Object.entries(S.views || {}).sort((a, b) => b[1].t - a[1].t).map(([id]) => S.recipes.find(r => r.id === id)).filter(Boolean);
  const top = S.recipes.filter(r => S.ratings[r.id]).sort((a, b) => S.ratings[b.id] - S.ratings[a.id] || a.name.localeCompare(b.name, 'fr'));
  const tags = Object.entries(S.recipes.reduce((o, r) => { r.tags.forEach(t => o[t] = (o[t] || 0) + 1); return o; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 12).map(x => x[0]);
  const hour = fmtHour(now);
  UI.homeKey = M.key + (late ? '-late' : '');
  const abv = feat ? estAbv(feat) : null;
  m.innerHTML = `
  ${late ? `<div class="late" role="note"><div><b>Il est <span class="now-h">${esc(hour)}</span>.</b> Un verre d’eau entre deux cocktails, et pas de volant ce soir. Besoin d’en parler ? Alcool Info Service répond au <b>0 980 980 930</b> de 8 h à 23 h, tous les jours (appel anonyme et non surtaxé). En dehors de ces horaires, leur site propose questions-réponses et forums : <a href="https://www.alcool-info-service.fr" target="_blank" rel="noopener">alcool-info-service.fr</a>, rubrique « En parler ».</div><button class="btn small" data-act="late-ok">Compris</button></div>` : ''}
  ${S.example ? `<div class="note-banner"><p><b>Données d'exemple.</b> Le bar, les notes et les listes sont pré-remplis pour la découverte. Tout reste modifiable.</p><button class="btn small" data-act="dismiss-example">Compris</button></div>` : ''}
  ${deferredInstall && !S.installDismissed && !isStandalone() && !isSamsung() ? `<div class="note-banner install"><p><b>Installer Zeste</b> pour l'ouvrir comme une appli, même hors ligne.</p><div class="row-btns"><button class="btn small ghost" data-act="install-later">Plus tard</button><button class="btn small primary" data-act="install">Installer</button></div></div>` : ''}
  ${feat ? `<section class="moment" style="--c:${okColor(feat.color)}">
    <button class="moment-v" data-act="open" data-id="${esc(feat.id)}" aria-label="${esc(feat.name)}">${visual(feat)}</button>
    <div class="moment-t" data-act="open" data-id="${esc(feat.id)}"><p class="eyebrow">${esc(M.title)} · <span class="now-h">${esc(hour)}</span></p><h1>${esc(feat.name)}</h1><p class="lead">${esc(M.lead)}</p>
      <p class="hint">${esc(feat.method)} · ${esc(feat.glass)}${abv != null ? ` · ≈ ${abv} % vol.` : ''} · ${ok(feat) ? 'réalisable avec le bar' : 'manquant : ' + esc(an.get(feat.id).miss.map(ingName).join(', '))}</p></div>
  </section>` : ''}
  ${hrow(`Aussi pour ${M.key === 'apero' ? 'l’apéro' : M.key === 'matin' ? 'ce matin' : M.key === 'aprem' ? 'cet après-midi' : M.key === 'soiree' ? 'ce soir' : 'la fin de soirée'}`, picks.slice(1, 13).map(r => hcard(r, ok(r) ? 'Réalisable' : 'Manque ' + an.get(r.id).miss.length)))}
  ${hrow('Réalisables avec le bar', ready.slice(0, 14).map(r => hcard(r, S.ratings[r.id] ? fmtRating(S.ratings[r.id]) + ' ★' : r.method)), `<button class="btn small ghost" data-act="go-cat" data-v="ok">Tout voir</button>`)}
  ${hrow('À un ingrédient près', near.slice(0, 14).map(r => hcard(r, 'Manque : ' + ingName(an.get(r.id).miss[0]))), `<button class="btn small ghost" data-act="go-cat" data-v="one">Tout voir</button>`)}
  ${hrow('Sans alcool', naList.slice(0, 14).map(r => hcard(r, r.source || r.author || r.method)), `<button class="btn small ghost" data-act="go-na">Tout voir</button>`)}
  ${hrow('Pour la tablée', batch.slice(0, 14).map(r => hcard(r, r.tags.includes('Chaud') ? 'Chaud' : 'À partager')), `<button class="btn small ghost" data-act="open-coll" data-id="grandes-quantites">Tout voir</button>`)}
  ${hrow('Consultés récemment', seen.slice(0, 14).map(r => hcard(r, r.method)))}
  <section class="hsec"><div class="shead"><h2>Explorer</h2></div>
    <div class="explore"><div class="chips"><button class="chip big" data-act="go-ing">Chercher par ingrédients</button></div><h3 class="lbl">Par alcool</h3><div class="chips">${SPIRITS.map(s => `<button class="chip big" data-act="go-base" data-v="${esc(s)}">${esc(SPIRIT_LABEL[s])}</button>`).join('')}</div>
    <h3 class="lbl">Par mood</h3><div class="chips">${tags.map(t => `<button class="chip" data-act="go-tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <h3 class="lbl">Par niveau</h3><div class="chips"><button class="chip" data-act="go-easy">Facile : peu d’ingrédients, sans technique</button><button class="chip" data-act="go-na">Sans alcool</button></div></div>
  </section>
  ${hrow('Collections', allColls().map(c => { const it = collRecipes(c); return `<button class="hcard coll-mini" data-act="open-coll" data-id="${esc(c.id)}"><span class="mosaic">${it.slice(0, 4).map(r => `<span style="--c:${okColor(r.color)}">${visual(r)}</span>`).join('')}</span><span class="hname">${esc(c.name)}</span><span class="hsub">${esc(c.curator || '')}</span></button>`; }), `<button class="btn small ghost" data-act="go-colls">Tout voir</button>`)}
  ${hrow('Mieux notés', top.slice(0, 14).map(r => hcard(r, fmtRating(S.ratings[r.id]) + ' ★')))}
  <p class="pro-note">Bientôt, avec le site communautaire : les recettes les plus consultées, les plus ajoutées et les mieux notées par l’ensemble des utilisateurs.</p>`;
}

/* ---------- mon bar ---------- */
const CHEV_R = '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
function renderBar(m) {
  const tabs = `<div class="seg tabs" role="tablist" aria-label="Mon bar">${[['ings', 'Ingrédients'], ['preps', 'Préparations maison']].map(([v, l]) => `<button role="tab" data-act="bar-tab" data-v="${v}" class="${UI.barTab === v ? 'on' : ''}" aria-selected="${UI.barTab === v}">${l}</button>`).join('')}</div>`;
  if (UI.barTab === 'preps') { m.innerHTML = `<h1 class="view">Mon bar</h1>${tabs}${renderPrepsTab()}`; return; }
  const cats = [...new Set(Object.values(S.ings).map(i => i.cat))].sort((a, b) => a.localeCompare(b, 'fr'));
  m.innerHTML = `<h1 class="view">Mon bar</h1>${tabs}
  <div class="bar-layout">
    <div class="bar-side">
      <div id="bartop" class="bar-top"></div>
      <details class="addbox"><summary>Ajouter un ingrédient</summary>
        <div class="fgrid">
          <label class="field" for="ni-name"><span>Nom</span><input id="ni-name" type="text" placeholder="ex. Sirop de cannelle maison"></label>
          <label class="field" for="ni-cat"><span>Groupe de substitution</span><input id="ni-cat" type="text" list="dl-cats2" placeholder="ex. Sirop de cannelle"></label>
          <label class="field ofield" for="ni-place"><span>Rangement</span><select id="ni-place">${opts(PLACES, 'Mes ingrédients|')}</select></label>
          <label class="field" for="ni-abv"><span>% vol.</span><input id="ni-abv" type="number" min="0" max="100" step="any" value="0"></label>
        </div>
        <datalist id="dl-cats2">${cats.map(c => `<option value="${esc(c)}"></option>`).join('')}</datalist>
        <p class="err" id="ni-err" hidden></p>
        <button class="btn primary small" data-act="add-ing">Ajouter et cocher « je l'ai »</button>
        <p class="hint" style="margin-top:8px">Deux ingrédients du même groupe de substitution peuvent se remplacer quand la recette le permet.</p>
      </details>
    </div>
    <div class="bar-main">
      <label class="search" for="bar-q">${SEARCH_ICON}<input id="bar-q" type="search" placeholder="Chercher un ingrédient" value="${esc(UI.barQ)}" autocomplete="off"></label>
      <div id="barlist" class="bar-main"></div>
    </div>
  </div>`;
  renderBarTop(); renderBarList();
}
function renderBarTop() {
  const el = $('#bartop'); if (!el) return;
  const own = ownedSet(), cur = S.recipes.map(r => analyze(r, own).miss.length);
  const nOk = cur.filter(n => !n).length, nOne = cur.filter(n => n === 1).length;
  const used = new Set(S.recipes.flatMap(r => r.ings.map(i => i.id)));
  const gains = [...used].filter(id => !own.has(id) && S.ings[id]).map(id => {
    const o2 = new Set(own); o2.add(id);
    return { id, won: S.recipes.filter((r, i) => cur[i] > 0 && !analyze(r, o2).miss.length) };
  }).filter(g => g.won.length).sort((a, b) => b.won.length - a.won.length || ingName(a.id).localeCompare(ingName(b.id), 'fr')).slice(0, 6);
  el.innerHTML = `<div class="stats"><div><b>${S.owned.length}</b><span>${plural(S.owned.length, 'ingrédient')}</span></div><div><b>${nOk}</b><span>${plural(nOk, 'réalisable')}</span></div><div><b>${nOne}</b><span>à 1 ingrédient près</span></div></div>
  ${gains.length ? `<section class="sec unlock"><h2>À acheter en priorité</h2><p class="hint">Les ingrédients qui débloquent le plus de recettes.</p><ol>${gains.map(g => `<li><span class="gain">+${g.won.length}</span><span>${esc(ingName(g.id))}<small>${esc(g.won.slice(0, 4).map(r => r.name).join(', '))}${g.won.length > 4 ? '…' : ''}</small></span><button class="btn small" data-act="own-add" data-id="${esc(g.id)}">Je l'ai</button></li>`).join('')}</ol></section>` : ''}`;
}
function ownRow(id, own) {
  const i = S.ings[id], extra = [i.cat !== i.name ? i.cat : '', +i.abv ? fr(+i.abv) + ' %' : ''].filter(Boolean).join(' · ');
  return `<div class="own"><label class="own-chk" for="own-${esc(id)}"><input type="checkbox" id="own-${esc(id)}" data-own="${esc(id)}"${own.has(id) ? ' checked' : ''}><span class="sr">Dans mon bar : ${esc(i.name)}</span></label><button type="button" class="own-i" data-act="ing-info" data-id="${esc(id)}" title="Voir la fiche de cet ingrédient"><span class="nm">${esc(i.name)}${i.custom ? '<span class="perso">perso</span>' : ''}</span><small>${esc(extra)}</small>${CHEV_R}</button></div>`;
}
function accHTML(key, title, ids, own, body, cls) {
  const n = ids.filter(id => own.has(id)).length, open = UI.barQ ? true : UI.open.has(key);
  return `<details class="acc${cls ? ' ' + cls : ''}" data-acc="${esc(key)}"${open ? ' open' : ''}><summary>${CHEV_R}<span class="grow">${esc(title)}</span><span class="cnt"><b>${n}</b> / ${ids.length}</span></summary><div class="acc-body">${body}</div></details>`;
}
function renderBarList() {
  const el = $('#barlist'); if (!el) return;
  const own = ownedSet(), q = norm(UI.barQ);
  const ids = Object.keys(S.ings).filter(id => !STAPLES.includes(id)).filter(id => !q || norm(S.ings[id].name + ' ' + S.ings[id].cat).includes(q));
  const byName = (a, b) => S.ings[a].name.localeCompare(S.ings[b].name, 'fr');
  const fams = [...FAM_IDS, ...new Set(ids.map(id => S.ings[id].fam).filter(f => !FAM_IDS.includes(f)))];
  const html = fams.map(fid => {
    const items = ids.filter(id => S.ings[id].fam === fid).sort(byName); if (!items.length) return '';
    const F = FAMILIES.find(f => f.id === fid);
    let body;
    if (F && F.subs) {
      const groups = [...F.subs, 'Autres'];
      body = groups.map(sub => {
        const sids = items.filter(id => sub === 'Autres' ? !F.subs.includes(S.ings[id].sub) : S.ings[id].sub === sub);
        return sids.length ? accHTML('s:' + fid + '|' + sub, sub, sids, own, sids.map(id => ownRow(id, own)).join(''), 'sub') : '';
      }).join('');
    } else body = items.map(id => ownRow(id, own)).join('');
    return accHTML('f:' + fid, fid, items, own, body);
  }).join('');
  el.innerHTML = html || `<p class="muted">Aucun ingrédient trouvé. Il peut être créé avec « Ajouter un ingrédient ».</p>`;
}
function updateAccCounts(input) {
  let d = input.closest('details.acc');
  while (d) {
    const boxes = d.querySelectorAll('input[data-own]'), c = d.querySelector(':scope>summary .cnt');
    if (c) c.innerHTML = `<b>${[...boxes].filter(x => x.checked).length}</b> / ${boxes.length}`;
    d = d.parentElement && d.parentElement.closest('details.acc');
  }
}


/* ---------- fiche d'un ingrédient ---------- */
function openIngInfo(id, keep) {
  const i = S.ings[id], sh = $('#sheet'); if (!i) { closeSheet(); return; }
  if (!keep) keepSheetScroll();
  sheetState = { type: 'ing', id };
  const inf = INFOS[id], have = ownedSet().has(id), abv = +i.abv || 0, st = keep ? sh.scrollTop : 0;
  const same = Object.keys(S.ings).filter(x => x !== id && !STAPLES.includes(x) && S.ings[x].cat === i.cat).sort((a, b) => S.ings[a].name.localeCompare(S.ings[b].name, 'fr'));
  const mine = S.preps.filter(p => p.makes === id), nR = S.recipes.filter(r => ingMatch(r, id)).length;
  const place = [i.fam, i.sub].filter(Boolean).join(' › ');
  const block = (t, txt) => txt ? `<section class="sec"><h2>${t}</h2><p class="ing-txt">${esc(txt)}</p></section>` : '';
  sh.innerHTML = `
  <div class="sheet-bar"><div class="sheet-bar-in"><button class="btn ghost" data-act="back">‹ Retour</button><span class="grow"></span><button class="btn small${have ? '' : ' primary'}" data-act="own-tog" data-id="${esc(id)}" aria-pressed="${have}">${have ? '✓ Dans mon bar' : "Je l'ai"}</button></div></div>
  <div class="sheet-body"><article class="inner detail ing-page" style="--c:var(--accent)">
    <header class="dhead"><p class="eyebrow"><span class="orig">${esc(place || 'Ingrédient')}</span></p><h1>${esc(i.name)}</h1></header>
    <dl class="facts"><div><dt>Degré d'alcool</dt><dd class="mono">${abv ? esc(fr(abv)) + ' % vol.' : 'Sans alcool'}</dd></div><div><dt>Groupe de substitution</dt><dd>${esc(i.cat)}</dd></div></dl>
    ${inf ? block('Origine', inf[0]) + block('Conservation', inf[1]) + block('Dans un cocktail', inf[2]) : `${block('Dans un cocktail', INFO_FAMILY[i.fam] || '')}<p class="hint">Pas de fiche détaillée : cet ingrédient a été ajouté à la main.</p>`}
    ${mine.length ? `<section class="sec"><h2>Recette maison</h2><div class="lrows">${mine.map(prepRow).join('')}</div></section>` : ''}
    ${same.length ? `<section class="sec"><h2>Peut se remplacer par</h2><p class="hint">Les ingrédients du même groupe de substitution, quand la recette l'accepte.</p><div class="chips">${same.map(x => `<button class="chip" data-act="ing-info" data-id="${esc(x)}">${esc(S.ings[x].name)}</button>`).join('')}</div></section>` : ''}
    ${nR ? `<div class="row-btns"><button class="btn" data-act="ing-search" data-id="${esc(id)}">${nR === 1 ? 'Voir la recette' : `Voir les ${nR} recettes`}</button></div>` : ''}
  </article></div>`;
  showSheet(); sh.scrollTop = st;
  if (!keep) pushNav();
}

/* ---------- préparations maison : sirops, liqueurs, spiritueux infusés ---------- */
const PREP_COL = { 'Sirops & cordials': '#FFE14D', 'Liqueurs': '#FF9A1F', 'Spiritueux infusés': '#C8E04A', 'Autres': '#E8F1F2' };
const PREP_COL_ID = { 'prep-sirop-sucre': '#E8F1F2', 'prep-sirop-sucre-riche': '#F6EBC8', 'prep-sirop-miel': '#D98A2B', 'prep-sirop-rose': '#FF8FB8', 'prep-sirop-gingembre': '#FFE14D', 'prep-sirop-cannelle': '#9A4A1E', 'prep-sirop-vanille': '#F6EBC8', 'prep-grenadine': '#E2232E', 'prep-shrub-framboise': '#F04E7A', 'prep-limoncello': '#FFE14D', 'prep-vodka-vanille': '#F6EBC8', 'prep-vodka-citron': '#F6EBC8', 'prep-orgeat': '#F6EBC8' };
const prepColor = p => okColor(p.color || PREP_COL_ID[p.id] || PREP_COL[p.kind] || PREP_COL.Autres);
const jarSVG = c => `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.4 12h9.2V20a1 1 0 0 1-1 1H8.4a1 1 0 0 1-1-1z" fill="${c}" stroke="none"/><path d="M9 3h6v3l1.6 2.4V20a1 1 0 0 1-1 1H8.4a1 1 0 0 1-1-1V8.4L9 6z"/><path d="M7.4 12h9.2"/></svg>`;
const mlTxt = ml => fmtQty({ qty: ml, unit: 'ml' });
function prepRow(p) {
  const sub = [p.makes && S.ings[p.makes] ? 'Pour ' + S.ings[p.makes].name : '', p.batch ? '≈ ' + mlTxt(p.batch.ml) : ''].filter(Boolean).join(' · ');
  return `<button class="lrow prow" data-act="open-prep" data-id="${esc(p.id)}"><span class="lthumb prep-ico" style="--c:${prepColor(p)}" aria-hidden="true">${jarSVG(prepColor(p))}</span><span class="lname">${esc(p.name)}<small>${esc(sub)}</small></span><span></span></button>`;
}
function renderPrepsTab() {
  const kinds = [...PREP_KINDS]; S.preps.forEach(p => { const k = p.kind || 'Autres'; if (!kinds.includes(k)) kinds.push(k); });
  const body = kinds.map(k => { const ps = S.preps.filter(p => (p.kind || 'Autres') === k).sort(byRecName); return ps.length ? `<section class="sec"><div class="shead"><h2>${esc(k)}</h2><span class="count">${ps.length}</span></div><div class="lrows">${ps.map(prepRow).join('')}</div></section>` : ''; }).join('');
  return `<div class="ctl-row preps-top"><p class="pro-note grow">Sirops, liqueurs et spiritueux infusés à faire soi-même, avec le volume obtenu et la conservation.</p><button class="btn primary" data-act="prep-new">Ajouter une préparation</button></div>
  <div class="preps-grid">${body || '<p class="muted">Aucune préparation pour l\'instant.</p>'}</div>`;
}
function openPrep(id, keep) {
  const sh = $('#sheet'), st = keep ? sh.scrollTop : 0, p = S.preps.find(x => x.id === id);
  if (!p) { closeSheet(); return; }
  if (!keep) keepSheetScroll();
  sheetState = { type: 'prep', id };
  const a = analyze(p, ownedSet()), k = servK(p), c = servCfg(p), amt = servAmt(p), del = UI.confirm === 'pdel:' + id;
  const rowsHTML = p.ings.map((row, i) => {
    const s2 = a.rows[i], info = [], ing = S.ings[row.id];
    if (s2.st === 'sub') info.push(`Substitut disponible : ${esc(ingName(s2.by))}`);
    if (s2.st === 'home') info.push(`À faire maison : ${esc(prepName(s2.prep))}`);
    if (row.opt) info.push('Facultatif');
    if (row.sub && ing) info.push(`Tout « ${esc(ing.cat)} » convient`);
    if (row.alts && row.alts.length) info.push(`Ou : ${esc(row.alts.map(x => altTxt(x, k)).join(' ; '))}`);
    return `<li><span class="dot ${s2.st === 'ok' ? '' : s2.st}" aria-label="${{ ok: 'Dans le bar', sub: 'Substitut disponible', home: 'À faire maison', miss: 'Manquant', opt: 'Facultatif, absent' }[s2.st]}"></span><span class="q">${esc(fmtQty(row, k))}</span><span class="nm"><button class="ing-link" data-act="ing-info" data-id="${esc(row.id)}" title="Voir la fiche de cet ingrédient">${esc(ingName(row.id))}</button>${row.tip ? `<small class="tip">Conseil : ${esc(row.tip)}</small>` : ''}${info.length ? `<small>${info.join(' · ')}</small>` : ''}</span></li>`;
  }).join('');
  const mk = p.makes && S.ings[p.makes];
  sh.innerHTML = `
  <div class="sheet-bar"><div class="sheet-bar-in"><button class="btn ghost" data-act="back">‹ Retour</button><span class="grow"></span><button class="btn small" data-act="prep-edit" data-id="${esc(id)}">Modifier</button><button class="btn small ghost danger" data-act="prep-del" data-id="${esc(id)}">${del ? 'Confirmer' : 'Supprimer'}</button></div></div>
  <div class="sheet-body"><article class="inner wide detail prep-page" style="--c:${prepColor(p)}">
    <div class="d-left cols dz">
      <header class="dhead o1"><span class="pbar" aria-hidden="true"></span><p class="eyebrow"><span class="orig">Préparation maison · ${esc(p.kind || 'Autres')}</span></p><h1>${esc(p.name)}</h1></header>
      <dl class="facts o2"><div><dt>Volume obtenu</dt><dd class="mono">≈ ${esc(mlTxt(amt))}</dd></div><div><dt>Ingrédient obtenu</dt><dd>${mk ? `<button class="ing-link" data-act="ing-info" data-id="${esc(p.makes)}">${esc(mk.name)}</button>` : '—'}</dd></div>${p.keep ? `<div class="wide"><dt>Conservation</dt><dd>${esc(p.keep)}</dd></div>` : ''}${p.source ? `<div class="wide"><dt>Source</dt><dd>${esc(p.source)}</dd></div>` : ''}</dl>
      ${p.note ? `<section class="sec o5"><h2>Notes</h2><ul class="notes">${String(p.note).split('\n').map(x => x.trim()).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
    </div>
    <div class="d-right cols dz">
      <section class="sec ings-sec o3"><div class="shead"><h2>Ingrédients</h2><div class="seg mini" role="group" aria-label="Unité">${['ml', 'cl', 'oz'].map(u => `<button data-act="unit" data-v="${u}" class="${S.unit === u ? 'on' : ''}" aria-pressed="${S.unit === u}">${u}</button>`).join('')}</div></div>
        ${servRow(p, 'pserv', 'pserv-set')}
        <ul class="ings">${rowsHTML}</ul>
        <p class="legend"><span><i class="dot"></i>Dans le bar</span><span><i class="dot sub"></i>Substitut dispo</span><span><i class="dot home"></i>À faire maison</span><span><i class="dot miss"></i>Manquant</span><span><i class="dot opt"></i>Facultatif</span></p></section>
      ${p.steps.length ? `<section class="sec o4"><h2>Préparation</h2><ol class="steps">${p.steps.map(x => `<li><span>${esc(x)}</span></li>`).join('')}</ol></section>` : ''}
    </div>
  </article></div>`;
  showSheet(); sh.scrollTop = st;
  if (!keep) pushNav();
}
function openPrepForm(id) {
  const src = id ? S.preps.find(x => x.id === id) : null;
  const p = src ? clone(src) : { name: '', kind: PREP_KINDS[0], makes: '', batch: null, ings: [], steps: [], keep: '', note: '', source: '' };
  sheetState = { type: 'pform', id: id || null }; rowN = 0; UI.confirm = null;
  const rows = p.ings.length ? p.ings : [null, null, null], ml = p.batch ? p.batch.ml : 0, big = ml >= 1000;
  const cats = [...new Set(Object.values(S.ings).map(i => i.cat))].sort((x, y) => x.localeCompare(y, 'fr'));
  const kind = PREP_KINDS.includes(p.kind) ? p.kind : (p.kind || PREP_KINDS[0]), kinds = PREP_KINDS.includes(kind) ? PREP_KINDS : [...PREP_KINDS, kind];
  const sh = $('#sheet');
  sh.innerHTML = `
  <div class="sheet-bar"><div class="sheet-bar-in"><button class="btn ghost" data-act="${id ? 'back-detail' : 'close'}">Annuler</button><span class="grow sheet-title">${id ? 'Modifier la préparation' : 'Nouvelle préparation'}</span><button class="btn primary small" data-act="prep-save">Enregistrer</button></div></div>
  <div class="sheet-body"><form class="inner form" id="pform" novalidate>
    <datalist id="dl-ings">${Object.values(S.ings).map(i => i.name).sort((x, y) => x.localeCompare(y, 'fr')).map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist>
    <datalist id="dl-cats">${cats.map(c => `<option value="${esc(c)}"></option>`).join('')}</datalist>
    <section class="sec"><h2>L'essentiel</h2>
      <label class="field" for="pf-name"><span>Nom</span><input type="text" id="pf-name" value="${esc(p.name)}" placeholder="ex. Sirop de gingembre" autocomplete="off"></label>
      <div class="field"><span>Type</span><input type="hidden" id="pf-kind" value="${esc(kind)}"><div class="chips">${kinds.map(k => `<button type="button" class="chip${k === kind ? ' on' : ''}" data-act="pick-chip" data-for="pf-kind" data-v="${esc(k)}" aria-pressed="${k === kind}">${esc(k)}</button>`).join('')}</div></div>
      <label class="field" for="pf-makes"><span>Ingrédient obtenu (facultatif)</span><input type="text" id="pf-makes" list="dl-ings" value="${esc(p.makes && S.ings[p.makes] ? S.ings[p.makes].name : '')}" placeholder="ex. Sirop de gingembre" autocomplete="off"><small class="hint">Celui que cette préparation remplace dans les recettes : sa fiche renvoie alors vers cette recette.</small></label>
      <div class="field"><span>Volume obtenu</span><div class="batch-vol"><input type="text" inputmode="decimal" id="pf-vol" aria-label="Volume obtenu" value="${ml ? esc(big ? fr(ml / 1000) : ml) : ''}" placeholder="ex. 500"><select id="pf-vol-u" aria-label="Unité du volume">${opts(['L', 'cl', 'ml'], big ? 'L' : 'ml')}</select></div><small class="hint">Les quantités ci-dessous sont celles de ce volume ; sur la fiche, le volume se règle ensuite.</small></div>
      <div class="field"><span>Couleur</span>
        <input type="hidden" id="rf-color" value="${prepColor(p)}">
        <div class="swatches" role="group" aria-label="Couleur de la préparation">${SWATCHES.map(([c, n]) => `<button type="button" class="sw${c.toLowerCase() === prepColor(p).toLowerCase() ? ' on' : ''}" data-act="swatch" data-v="${c}" style="--sw:${c}" title="${n}" aria-label="${n}"></button>`).join('')}</div>
        <details class="custom-c"${SWATCHES.some(([c]) => c.toLowerCase() === prepColor(p).toLowerCase()) ? '' : ' open'}><summary>Couleur personnalisée</summary>
          <div class="hsl">${[['h', 'Teinte', 0, 360], ['s', 'Intensité', 0, 100], ['l', 'Clarté', 10, 90]].map(([k, l, mn, mx]) => `<label class="slider" for="cc-${k}"><span>${l}</span><input type="range" class="cr" id="cc-${k}" min="${mn}" max="${mx}" step="1"><span></span></label>`).join('')}</div>
        </details>
      </div>
    </section>
    <section class="sec"><h2>Ingrédients</h2>
      <p class="hint">Un nom inconnu crée un nouvel ingrédient. Pour une infusion, indiquer le spiritueux et la plante comme n'importe quel ingrédient.</p>
      <div id="frows" class="frows">${rows.map(rowHTML).join('')}</div>
      <div><button type="button" class="btn small" data-act="row-add">+ Ajouter un ingrédient</button></div>
    </section>
    <section class="sec"><h2>Préparation</h2>
      <label class="field" for="pf-steps"><span>Une étape par ligne</span><textarea id="pf-steps" rows="5">${esc(p.steps.join('\n'))}</textarea></label>
      <label class="field" for="pf-keep"><span>Conservation</span><input type="text" id="pf-keep" value="${esc(p.keep || '')}" placeholder="ex. Au réfrigérateur : 2 semaines" autocomplete="off"></label>
      <label class="field" for="pf-note"><span>Notes (une par ligne)</span><textarea id="pf-note" rows="3" placeholder="Variantes, astuces…">${esc(p.note || '')}</textarea></label>
      <label class="field" for="pf-source"><span>Source (facultatif)</span><input type="text" id="pf-source" value="${esc(p.source || '')}" placeholder="Auteur, livre, site…" autocomplete="off"></label>
    </section>
    <p class="err" id="pf-err" hidden></p>
    <div><button type="button" class="btn primary" data-act="prep-save">Enregistrer la préparation</button></div>
  </form></div>`;
  sh.querySelectorAll('.frow').forEach(checkNew);
  syncHSL(); showSheet(); sh.scrollTop = 0; pushNav();
}
function savePrep() {
  const sh = $('#sheet'), g = x => sh.querySelector('#' + x), errs = [];
  const name = g('pf-name').value.trim(); if (!name) errs.push('Le nom est requis.');
  const R = readIngRows(sh); errs.push(...R.errs);
  const q = parseFloat(String(g('pf-vol').value).replace(',', '.')), ml = q * ({ L: 1000, cl: 10, ml: 1 }[g('pf-vol-u').value] || 1);
  if (!(ml >= 10)) errs.push('Indiquer le volume obtenu, par exemple 500 ml.');
  const mkTxt = g('pf-makes').value.trim(); let makes = '';
  if (mkTxt) { makes = findIng(mkTxt) || (R.newIngs[norm(mkTxt)] && R.newIngs[norm(mkTxt)].id) || ''; if (!makes) errs.push("L'ingrédient obtenu doit être choisi dans la liste des ingrédients."); }
  const e = g('pf-err');
  if (errs.length) { e.textContent = errs.join('\n'); e.hidden = false; e.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  Object.values(R.newIngs).forEach(({ id, data }) => S.ings[id] = data);
  const old = sheetState.id && S.preps.find(x => x.id === sheetState.id);
  const rec = Object.assign({}, old || {}, {
    id: old ? old.id : 'p-' + Date.now().toString(36), name, kind: g('pf-kind').value, color: okColor(g('rf-color').value), makes, batch: { ml: Math.round(ml) }, ings: R.ings,
    steps: g('pf-steps').value.split('\n').map(x => x.trim()).filter(Boolean), keep: g('pf-keep').value.trim(), note: g('pf-note').value.trim(), source: g('pf-source').value.trim(), created: old ? old.created : Date.now()
  });
  if (old && old.src === 'builtin') { rec.src = 'builtin'; rec.edited = true; }
  if (old) S.preps[S.preps.indexOf(old)] = rec; else S.preps.push(rec);
  save(); toast(old ? 'Préparation mise à jour' : 'Préparation ajoutée');
  if (old) history.back(); else { render(); restoring = true; openPrep(rec.id); restoring = false; replaceNav(); }
}

/* ---------- listes et collections ---------- */
function lrowHTML(r, own) {
  const a = analyze(r, own), rt = S.ratings[r.id] || 0, nt = S.notes[r.id] && String(S.notes[r.id].text || '').trim();
  return `<button class="lrow" data-act="open" data-id="${esc(r.id)}"><span class="lthumb" style="--c:${okColor(r.color)}">${visual(r)}</span><span class="lname">${esc(r.name)}<small>${esc(r.method)} · ${statusPill(a)[1]}</small>${nt ? `<span class="lnote">${esc(nt)}</span>` : ''}</span>${rt ? starsHTML(rt) : '<span></span>'}</button>`;
}
function renderLists(m) {
  const own = ownedSet();
  const tabs = `<div class="seg tabs" role="tablist" aria-label="Listes">${[['mine', 'Mes listes'], ['coll', 'Collections']].map(([v, l]) => `<button role="tab" data-act="list-tab" data-v="${v}" class="${UI.listTab === v ? 'on' : ''}" aria-selected="${UI.listTab === v}">${l}</button>`).join('')}</div>`;
  if (UI.listTab === 'coll') { m.innerHTML = `<h1 class="view">Listes</h1>${tabs}${renderCollTab()}`; return; }
  const rated = S.recipes.filter(r => S.ratings[r.id]).sort((a, b) => S.ratings[b.id] - S.ratings[a.id] || a.name.localeCompare(b.name, 'fr'));
  m.innerHTML = `<h1 class="view">Listes</h1>${tabs}
  <div class="lists-grid">
  ${S.lists.map(l => {
    const items = l.items.map(id => S.recipes.find(r => r.id === id)).filter(Boolean), del = UI.confirm === 'list:' + l.id;
    return `<section class="sec"><div class="shead"><h2>${esc(l.name)}</h2><span class="count">${items.length}</span>${items.length ? `<button class="btn small ghost" data-act="shop-list" data-list="${esc(l.id)}">Ajouter aux courses</button>` : ''}${l.fixed ? '' : `<button class="btn small ghost danger" data-act="del-list" data-list="${esc(l.id)}">${del ? 'Confirmer la suppression' : 'Supprimer'}</button>`}</div>
    ${items.length ? `<div class="lrows">${items.map(r => lrowHTML(r, own)).join('')}</div>` : `<p class="muted">Liste vide. Les recettes s'ajoutent depuis leur fiche.</p>`}</section>`;
  }).join('')}
  <section class="sec"><div class="shead"><h2>Mieux notés</h2><span class="count">${rated.length}</span></div>
  ${rated.length ? `<div class="lrows">${rated.map(r => lrowHTML(r, own)).join('')}</div>` : `<p class="muted">Les recettes notées apparaissent ici.</p>`}</section>
  <section class="sec"><h2>Nouvelle liste</h2><div class="inline-form"><input id="nl-name" type="text" aria-label="Nom de la nouvelle liste" placeholder="ex. Soirée ciné, Hiver, Pour les potes"><button class="btn primary small" data-act="add-list">Créer</button></div></section>
  </div>`;
}
/* collections : intégrées (data.js) et créées sur l'appareil */
const allColls = () => [...COLLECTIONS, ...(S.collections || [])];
const findColl = cid => allColls().find(c => c.id === cid);
const byRecName = (a, b) => a.name.localeCompare(b.name, 'fr');
/* Variantes : `parent` est l'id de la recette de base. Un lien vers une recette supprimée est ignoré. */
const parentOf = r => (r && r.parent && r.parent !== r.id && S.recipes.find(x => x.id === r.parent)) || null;
const variantsOf = r => S.recipes.filter(x => x.parent === r.id && x.id !== r.id).sort(byRecName);
function descendantIds(id) {
  const out = new Set(), todo = [id];
  while (todo.length) { const c = todo.pop(); S.recipes.forEach(x => { if (x.parent === c && !out.has(x.id)) { out.add(x.id); todo.push(x.id); } }); }
  return out;
}
function collBlocks(c) {
  if (c.blocks && c.blocks.length) return c.blocks;
  const ids = c.ids || S.recipes.filter(c.filter).sort(byRecName).map(r => r.id);
  return [{ type: 'recipes', title: '', ids, cols: 3 }];
}
function collRecipes(c) {
  const seen = new Set(), out = [];
  collBlocks(c).forEach(b => { if (b.type === 'recipes') (b.ids || []).forEach(id => { const r = S.recipes.find(x => x.id === id); if (r && !seen.has(id)) { seen.add(id); out.push(r); } }); });
  return out;
}
const paras = t => String(t || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
function collCard(c) {
  const it = collRecipes(c);
  return `<button class="coll" data-act="open-coll" data-id="${esc(c.id)}"><span class="mosaic">${it.slice(0, 4).map(r => `<span style="--c:${okColor(r.color)}">${visual(r)}</span>`).join('')}</span><span class="coll-b"><span class="curator">${esc(c.curator || '')}</span><strong>${esc(c.name)}</strong><p>${esc(c.desc || '')}</p><span class="coll-meta">${it.length} ${plural(it.length, 'recette')}</span></span></button>`;
}
function renderCollTab() {
  const groups = [...COLL_GROUPS];
  allColls().forEach(c => { const g = c.group || 'Mes collections'; if (!groups.includes(g)) groups.push(g); });
  return `<div class="ctl-row"><p class="pro-note grow">Collections proposées par Zeste. Bientôt, des bars et des créateurs de contenu pourront publier les leurs ici.</p><button class="btn primary desk-only" data-act="coll-new">Créer une collection</button></div>
  <div class="coll-groups">${groups.map(g => { const cs = allColls().filter(c => (c.group || 'Mes collections') === g); return cs.length ? `<section class="coll-group"><div class="shead"><h2>${esc(g)}</h2><span class="count">${cs.length}</span></div><div class="coll-grid">${cs.map(collCard).join('')}</div></section>` : ''; }).join('')}</div>`;
}
function rcardHTML(r, own) {
  const a = analyze(r, own), [cls, txt] = statusPill(a);
  const mi = r.ings.map((row, i) => { const st = a.rows[i].st; return `<span class="mi ${st}"><i class="dot ${st === 'ok' ? '' : st}"></i><span>${esc(ingName(row.id))}${st === 'sub' ? ' → ' + esc(ingName(a.rows[i].by)) : st === 'home' ? ' (maison)' : ''}</span></span>`; }).join('');
  return `<button class="rcard" data-act="open" data-id="${esc(r.id)}" style="--c:${okColor(r.color)}"><span class="cv">${visual(r)}<span class="pill ${cls}">${txt}</span></span><span class="rcard-b"><span class="cname">${esc(r.name)}</span><span class="cmeta">${esc(r.method)} · ${esc(r.glass)}</span><span class="mini-ings">${mi}</span></span></button>`;
}
function openCollection(cid, keep) {
  const c = findColl(cid); if (!c) return closeSheet();
  const own = ownedSet(), recs = collRecipes(c), saved = S.lists.find(l => l.from === cid), sh = $('#sheet'), mine = !COLLECTIONS.includes(c);
  const an = recs.map(r => analyze(r, own)), nOk = an.filter(x => !x.miss.length).length, nOne = an.filter(x => x.miss.length === 1).length;
  const need = new Map();
  recs.forEach((r, k) => r.ings.forEach((row, i) => {
    if (row.opt || STAPLES.includes(row.id)) return;
    const st = an[k].rows[i].st, e = need.get(row.id) || { st: 'ok', recs: [] };
    if (st === 'miss') e.st = 'miss'; else if ((st === 'sub' || st === 'home') && e.st !== 'miss') e.st = 'sub';
    e.recs.push(r.name); need.set(row.id, e);
  }));
  const list = st => [...need].filter(([, e]) => e.st === st).sort((x, y) => y[1].recs.length - x[1].recs.length || ingName(x[0]).localeCompare(ingName(y[0]), 'fr'));
  const shopUl = (arr, cls) => `<ul>${arr.map(([id, e]) => `<li><i class="dot ${cls}"></i><span>${esc(ingName(id))}<small>${e.recs.length} ${plural(e.recs.length, 'recette')} : ${esc(e.recs.slice(0, 3).join(', '))}${e.recs.length > 3 ? '…' : ''}</small></span></li>`).join('')}</ul>`;
  const miss = list('miss'), sub = list('sub'), ok = list('ok');
  sheetState = { type: 'coll', id: cid };
  const blocks = collBlocks(c).map(b => {
    if (b.type === 'text') return `<section class="blk-text">${b.title ? `<h2>${esc(b.title)}</h2>` : ''}${paras(b.text)}</section>`;
    if (b.type === 'tip') return `<aside class="blk-tip"><h3 class="lbl">Astuce</h3>${paras(b.text)}</aside>`;
    const rs = (b.ids || []).map(id => S.recipes.find(r => r.id === id)).filter(Boolean);
    return `<section class="sec">${b.title ? `<h2>${esc(b.title)}</h2>` : ''}<div class="rgrid c${b.cols || 3}">${rs.map(r => rcardHTML(r, own)).join('')}</div></section>`;
  }).join('');
  const del = UI.confirm === 'cdel:' + cid;
  sh.innerHTML = `
  <div class="sheet-bar"><div class="sheet-bar-in"><button class="btn ghost" data-act="close">‹ Retour</button><span class="grow"></span>${mine ? `<button class="btn small desk-only" data-act="coll-edit" data-id="${esc(cid)}">Modifier</button><button class="btn small ghost danger" data-act="coll-del" data-id="${esc(cid)}">${del ? 'Confirmer' : 'Supprimer'}</button>` : ''}<button class="btn small${saved ? '' : ' primary'}" data-act="save-coll" data-id="${esc(cid)}">${saved ? 'Mettre à jour la copie' : 'Enregistrer dans mes listes'}</button></div></div>
  <div class="sheet-body"><div class="coll-page">
    <header class="coll-hero"><span class="curator">${esc(c.curator || '')}</span><h1>${esc(c.name)}</h1>${c.desc ? `<p class="lead">${esc(c.desc)}</p>` : ''}
      <div class="coll-sum"><span><b>${recs.length}</b> ${plural(recs.length, 'recette')}</span><span><b>${nOk}</b> ${plural(nOk, 'réalisable')} avec le bar</span><span><b>${nOne}</b> à 1 ingrédient près</span><span><b>${miss.length}</b> ${plural(miss.length, 'ingrédient')} ${plural(miss.length, 'manquant')}</span></div></header>
    <div class="coll-body">
      <div class="blocks">${blocks}</div>
      <aside class="coll-side panel shop"><h2>Ingrédients</h2><p class="hint">Tout ce qu'il faut pour cette collection, du plus utile au moins utile.</p>
        <button class="btn small" data-act="shop-coll" data-id="${esc(cid)}">Ajouter aux courses</button>
        ${miss.length ? `<h3 class="lbl">Manquants (${miss.length})</h3>${shopUl(miss, 'miss')}` : '<p class="avail ok">Rien ne manque : tout est dans le bar.</p>'}
        ${sub.length ? `<h3 class="lbl">Remplaçables (${sub.length})</h3>${shopUl(sub, 'sub')}` : ''}
        ${ok.length ? `<details><summary class="lbl" style="cursor:pointer">Dans le bar (${ok.length})</summary>${shopUl(ok, '')}</details>` : ''}
      </aside>
    </div>
  </div></div>`;
  showSheet(); if (!keep) { sh.scrollTop = 0; pushNav(); }
}

/* ---------- éditeur de collection (sur ordinateur) ---------- */
function openCollEditor(cid) {
  const src = cid && (S.collections || []).find(c => c.id === cid);
  const draft = src ? clone(src) : { id: 'c-' + Date.now().toString(36), name: '', curator: 'Moi', group: 'Mes collections', desc: '', blocks: [{ type: 'recipes', title: '', ids: [], cols: 3 }] };
  sheetState = { type: 'colled', id: cid || null, draft };
  renderCollEditor(true); pushNav();
}
function renderCollEditor(top) {
  const d = sheetState.draft, sh = $('#sheet'), st = sh.scrollTop;
  const groups = [...new Set([...COLL_GROUPS, 'Mes collections', ...allColls().map(c => c.group).filter(Boolean)])];
  const tools = i => `<span class="row-btns"><button type="button" class="btn small ghost" data-act="ed-up" data-bk="${i}" aria-label="Monter le bloc"${i ? '' : ' disabled'}>↑</button><button type="button" class="btn small ghost" data-act="ed-down" data-bk="${i}" aria-label="Descendre le bloc"${i < d.blocks.length - 1 ? '' : ' disabled'}>↓</button><button type="button" class="btn small ghost danger" data-act="ed-del" data-bk="${i}">Retirer</button></span>`;
  const blk = (b, i) => {
    if (b.type === 'text') return `<div class="ed-blk"><div class="ed-blk-h"><span class="lbl">Bloc de texte</span>${tools(i)}</div>
      <label class="field" for="ed-t${i}"><span>Titre</span><input type="text" id="ed-t${i}" data-bk="${i}" data-f="title" value="${esc(b.title)}" placeholder="ex. Un peu d'histoire"></label>
      <label class="field" for="ed-x${i}"><span>Texte (une ligne vide sépare les paragraphes)</span><textarea id="ed-x${i}" data-bk="${i}" data-f="text" rows="5">${esc(b.text)}</textarea></label></div>`;
    if (b.type === 'tip') return `<div class="ed-blk"><div class="ed-blk-h"><span class="lbl">Astuce</span>${tools(i)}</div>
      <label class="field" for="ed-x${i}"><span>Texte de l'astuce</span><textarea id="ed-x${i}" data-bk="${i}" data-f="text" rows="3">${esc(b.text)}</textarea></label></div>`;
    return `<div class="ed-blk"><div class="ed-blk-h"><span class="lbl">Bloc de recettes</span>${tools(i)}</div>
      <label class="field" for="ed-t${i}"><span>Titre (facultatif)</span><input type="text" id="ed-t${i}" data-bk="${i}" data-f="title" value="${esc(b.title)}" placeholder="ex. Les incontournables"></label>
      <div class="field"><span>Recettes par ligne sur grand écran</span><div class="seg mini" role="group" aria-label="Recettes par ligne" style="align-self:flex-start">${[2, 3, 4].map(n => `<button type="button" data-act="ed-cols" data-bk="${i}" data-v="${n}" class="${(b.cols || 3) === n ? 'on' : ''}" aria-pressed="${(b.cols || 3) === n}">${n}</button>`).join('')}</div></div>
      <div class="ed-chips">${(b.ids || []).map((id, k) => `<span class="ed-chip">${esc((S.recipes.find(r => r.id === id) || { name: id }).name)}<button type="button" data-act="ed-rm" data-bk="${i}" data-k="${k}" aria-label="Retirer">×</button></span>`).join('') || '<span class="hint">Aucune recette pour l\'instant.</span>'}</div>
      <div class="ed-add"><input type="text" id="ed-a${i}" class="ed-add-i" data-bk="${i}" list="dl-recs" placeholder="Nom d'une recette" autocomplete="off"><button type="button" class="btn small" data-act="ed-add" data-bk="${i}">Ajouter</button></div></div>`;
  };
  sh.innerHTML = `
  <div class="sheet-bar"><div class="sheet-bar-in"><button class="btn ghost" data-act="${sheetState.id ? 'ed-cancel' : 'close'}">Annuler</button><span class="grow sheet-title">${sheetState.id ? 'Modifier la collection' : 'Nouvelle collection'}</span><button class="btn primary small" data-act="ed-save">Enregistrer</button></div></div>
  <div class="sheet-body"><div class="inner wide form">
    <datalist id="dl-recs">${[...S.recipes].sort(byRecName).map(r => `<option value="${esc(r.name)}"></option>`).join('')}</datalist>
    <datalist id="dl-groups">${groups.map(g => `<option value="${esc(g)}"></option>`).join('')}</datalist>
    <div class="cols col-a">
      <section class="sec"><h2>La collection</h2>
        <label class="field" for="ed-name"><span>Nom</span><input type="text" id="ed-name" data-f="name" value="${esc(d.name)}" placeholder="ex. Cocktails d'hiver"></label>
        <label class="field" for="ed-cur"><span>Proposée par</span><input type="text" id="ed-cur" data-f="curator" value="${esc(d.curator)}" placeholder="ex. Bar Le Zinc"></label>
        <label class="field" for="ed-grp"><span>Catégorie</span><input type="text" id="ed-grp" data-f="group" list="dl-groups" value="${esc(d.group)}"></label>
        <label class="field" for="ed-desc"><span>Présentation courte</span><textarea id="ed-desc" data-f="desc" rows="3">${esc(d.desc)}</textarea></label>
      </section>
      <section class="panel"><h2>Publier pour tous</h2><p class="hint">La collection est enregistrée sur cet appareil. Pour la rendre visible par tous les utilisateurs, son code doit être ajouté au site.</p><div><button type="button" class="btn small" data-act="ed-export">Copier le code de la collection</button></div></section>
      <p class="err" id="ed-err" hidden></p>
    </div>
    <div class="cols col-b">
      <section class="sec"><h2>Contenu</h2><p class="hint">La page se lit de haut en bas, bloc par bloc. Elle s'adapte seule au téléphone : les recettes passent alors sur une colonne.</p>
        <div class="ed-blocks">${d.blocks.map(blk).join('') || '<p class="hint">Aucun bloc.</p>'}</div>
        <div class="ed-tools"><button type="button" class="btn small" data-act="ed-new" data-v="recipes">+ Bloc de recettes</button><button type="button" class="btn small" data-act="ed-new" data-v="text">+ Bloc de texte</button><button type="button" class="btn small" data-act="ed-new" data-v="tip">+ Astuce</button></div>
      </section>
    </div>
  </div></div>`;
  showSheet(); sh.scrollTop = top ? 0 : st;
}
function edAddRecipe(i) {
  const inp = $('#ed-a' + i); if (!inp) return;
  const k = norm(inp.value), r = S.recipes.find(x => norm(x.name) === k);
  if (!r) { toast('Recette introuvable : choisir un nom dans la liste.'); return; }
  const b = sheetState.draft.blocks[i]; b.ids = b.ids || [];
  if (!b.ids.includes(r.id)) b.ids.push(r.id);
  renderCollEditor(); const n = $('#ed-a' + i); if (n) n.focus();
}
function saveCollEditor() {
  const d = sheetState.draft, err = $('#ed-err');
  const errs = [];
  if (!d.name.trim()) errs.push('Le nom de la collection est requis.');
  if (!d.blocks.some(b => b.type === 'recipes' && (b.ids || []).length)) errs.push('Au moins une recette est requise.');
  if (errs.length) { err.textContent = errs.join('\n'); err.hidden = false; err.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  d.name = d.name.trim(); d.group = (d.group || '').trim() || 'Mes collections';
  S.collections = S.collections || [];
  const k = S.collections.findIndex(c => c.id === d.id);
  if (k >= 0) S.collections[k] = d; else S.collections.push(d);
  save(); toast(k >= 0 ? 'Collection mise à jour' : 'Collection créée');
  if (k >= 0) history.back(); else { restoring = true; openCollection(d.id); restoring = false; replaceNav(); }
}

/* ---------- données ---------- */
function renderData(m) {
  m.innerHTML = `<h1 class="view">Données</h1>
  <div class="data-grid">
  <section class="panel"><h2>Sur cet appareil</h2>
    <p>Les recettes, le bar, les notes et les listes sont enregistrés sur cet appareil, dans ce navigateur. Rien n'est envoyé en ligne.</p>
    <p class="hint" id="st-size">Calcul de l'espace utilisé…</p>
    ${storageOK ? '' : `<p class="warn">Ce navigateur bloque l'enregistrement : les modifications seront perdues à la fermeture. Penser à télécharger une sauvegarde ci-dessous.</p>`}
  </section>
  <section class="panel"><h2>Appli</h2>${installBlock()}<p class="hint">Version ${APP_VERSION} · ${S.recipes.length} recettes, ${Object.keys(S.ings).length} ingrédients</p></section>
  <section class="panel"><h2>À propos</h2><p class="hint">Sources des recettes, crédits des photos, polices et mentions.</p><div class="row-btns"><button class="btn small" data-act="view" data-v="about">Crédits et mentions</button></div></section>
  ${photoReviewPanel()}
  <section class="panel"><h2>Sauvegarder</h2>
    <p class="hint">Un fichier de sauvegarde permet de ne rien perdre, ou de passer sur un autre appareil. Les photos sont incluses.</p>
    <div class="row-btns"><button class="btn primary small" data-act="dl-exp">Télécharger une sauvegarde</button><button class="btn small" data-act="copy-exp">Copier en texte</button></div>
  </section>
  <section class="panel"><h2>Restaurer</h2>
    <p class="hint">Remplace toutes les données actuelles par une sauvegarde : un fichier téléchargé ici, ou le texte copié depuis l'ancienne version de Zeste.</p>
    <div><button type="button" class="btn small" data-act="imp-pick">Choisir un fichier de sauvegarde</button><input type="file" id="imp-file" class="file-hidden" tabindex="-1" aria-hidden="true" accept=".json,application/json,text/plain"></div>
    <p class="hint" id="imp-name">${UI.impName ? esc('Fichier prêt : ' + UI.impName) : ''}</p>
    <label class="field" for="imp-text"><span>Ou coller le texte d'une sauvegarde</span><textarea id="imp-text" rows="4"></textarea></label>
    <p class="err" id="imp-err" hidden></p>
    <div class="row-btns"><button class="btn small danger" data-act="import">${UI.confirm === 'import' ? 'Confirmer : remplacer les données' : 'Restaurer'}</button></div>
  </section>
  <section class="panel"><h2>Repartir de l'exemple</h2>
    <p class="hint">Efface les recettes, le bar et les listes, et recharge le catalogue de départ.</p>
    <div class="row-btns"><button class="btn small danger" data-act="reset">${UI.confirm === 'reset' ? 'Confirmer la réinitialisation' : 'Réinitialiser'}</button></div>
  </section>
  </div>`;
  const el = $('#st-size');
  if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { if (el) el.textContent = `Espace utilisé : ${fr((e.usage || 0) / 1048576)} Mo.`; }).catch(() => { if (el) el.textContent = ''; });
  else if (el) el.textContent = '';
}

/* Suivi des licences de photos, visible seulement pendant le développement (voir PHOTO_STATUS dans data.js). */
function photoReviewPanel() {
  if (PUBLIC_RELEASE) return '';
  const g = { ok: [], test: [], unverified: [] };
  Object.keys(PHOTOS).forEach(id => { const r = BUILTIN.get(id); if (r) g[photoState(id)].push(r); });
  const line = r => { const c = r.photoCredit; return `<li><b>${esc(r.name)}</b> · ${c && c.by ? esc(c.by) + (c.lic ? ' (' + esc(c.lic) + ')' : '') : 'sans crédit'}</li>`; };
  const n = g.ok.length;
  return `<section class="panel"><h2>Photos avant la 1.0</h2>
    <p class="hint">${n} validée${n > 1 ? 's' : ''}, ${g.test.length} pour les essais seulement, ${g.unverified.length} à vérifier. Seules les photos validées seront dans la version publique : les autres reviendront à l'illustration du verre.</p>
    ${g.test.length ? `<h3 class="lbl">Pour les essais seulement</h3><ul class="pstat">${g.test.map(line).join('')}</ul>` : ''}
    ${g.unverified.length ? `<h3 class="lbl">À vérifier</h3><ul class="pstat">${g.unverified.map(line).join('')}</ul>` : ''}
  </section>`;
}

/* ---------- à propos et crédits ---------- */
function renderAbout(m) {
  const cred = RECIPES.filter(r => okPhoto(r.photo) && r.photoCredit && r.photoCredit.by).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const photos = cred.length ? `<section class="panel"><h2>Photos</h2>
    ${PUBLIC_RELEASE ? '<p class="hint">Les photos sans mention ont été réalisées pour Zeste.</p>' : '<p class="hint">Version de développement : certaines photos n\'ont pas encore de licence validée.</p>'}
    <ul class="pstat">${cred.map(r => `<li><b>${esc(r.name)}</b> · ${creditWho(r.photoCredit)}${r.photoCredit.lic ? ' · ' + esc(r.photoCredit.lic) : ''}</li>`).join('')}</ul></section>` : '';
  m.innerHTML = `<h1 class="view">Crédits et mentions</h1>
  <div class="about">
  <p class="legal-big">L'abus d'alcool est dangereux pour la santé. À consommer avec modération.</p>
  <section class="panel"><h2>Recettes</h2>
    <p>La source de chaque recette (auteur, bar, ouvrage) figure en haut de sa fiche, avec un lien quand il existe. Les recettes classiques appartiennent à la tradition des bars.</p>
    <p class="hint">Les marques citées appartiennent à leurs propriétaires. Zeste n'est lié à aucune d'elles.</p>
  </section>
  ${photos}
  <section class="panel"><h2>Polices</h2><p>Big Shoulders Display, Figtree et IBM Plex Mono, sous licence SIL Open Font License.</p></section>
  <section class="panel"><h2>Appli</h2><p class="hint">Zeste, version ${APP_VERSION}. Les données restent sur l'appareil : rien n'est envoyé en ligne.</p>
    <div class="row-btns"><button class="btn small" data-act="view" data-v="data">← Données</button></div></section>
  </div>`;
}

/* ---------- feuilles ---------- */
function showSheet() { $('#sheet').hidden = false; lockScroll(); }
function closeSheetRaw() { flushNote(); const sh = $('#sheet'); sh.hidden = true; sh.innerHTML = ''; sheetState = null; UI.confirm = null; unlockScroll(); render(); }

/* ---------- navigation et bouton « retour » du téléphone ----------
   L'accueil est la racine : un onglet se place juste au-dessus, chaque fiche ouverte s'empile.
   Le retour revient donc à l'écran précédent, puis à l'accueil, et ne quitte l'appli que depuis l'accueil. */
let restoring = false;
const navDepth = () => (history.state && history.state.z && history.state.i) || 0;
function navState(inc) { return { z: 1, i: navDepth() + (inc || 0), view: UI.view, sheet: sheetState ? { type: sheetState.type, id: sheetState.id || null, back: sheetState.back || null } : null }; }
function pushNav() { if (!restoring) history.pushState(navState(1), ''); }
/* replaceNav garde le marqueur « ing » (entrée créée par un clic sur un ingrédient : l'accueil ne doit pas faire « retour » vers la fiche)
   et, sur les autres entrées (fiches), les filtres à restaurer. L'entrée « ing » perd les siens : elle n'en a plus besoin une fois remplacée. */
function replaceNav() { const s = history.state || {}, x = navState(); if (s.ing) x.ing = true; else if (s.filt) { x.filt = s.filt; if (s.filtFirst) x.filtFirst = true; } if (s.scroll) x.scroll = s.scroll; history.replaceState(x, ''); }
function applyFilt(b) { UI.f = structuredClone(b.f); UI.q = b.q; UI.avail = b.avail; }
/* On quitte une feuille (collection, par exemple) pour une autre : sa position est gardée dans l'entrée d'historique, le retour la remet. */
function keepSheetScroll() { if (!restoring && sheetState && history.state && history.state.z) history.replaceState({ ...history.state, scroll: $('#sheet').scrollTop }, ''); }
function closeSheet() { if (history.state && history.state.z && history.state.sheet) history.back(); else closeSheetRaw(); }
function goBack() { closeSheet(); }
function navView(v) {
  /* Réappuyer sur l'onglet courant remonte en haut de la page, sans toucher aux filtres. */
  if (v === UI.view && !sheetState) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const fromHome = UI.view === 'home';
  UI.view = v; window.scrollTo(0, 0); render();
  if (v === 'home') { const d = navDepth(); if (!fromHome && d > 0) { if (UI.filtBase) { applyFilt(UI.filtBase); UI.filtBase = null; } history.go(-d); } else replaceNav(); }
  else if (fromHome) pushNav(); else replaceNav();
}
window.addEventListener('popstate', e => {
  const st = e.state; if (!st || !st.z) return;
  if (st.filt) { applyFilt(st.filt); if (st.filtFirst) UI.filtBase = null; }
  if (!$('#pick').hidden) closePick();
  if (!$('#crop').hidden) closeCrop();
  restoring = true;
  try {
    UI.view = st.view || 'home';
    const sh = st.sheet;
    if (!sh) { if (sheetState) closeSheetRaw(); else render(); }
    else {
      render();
      if (sh.type === 'detail') openDetail(sh.id, false, sh.back);
      else if (sh.type === 'coll') openCollection(sh.id);
      else if (sh.type === 'form') openForm(sh.id);
      else if (sh.type === 'colled') openCollEditor(sh.id);
      else if (sh.type === 'prep') openPrep(sh.id);
      else if (sh.type === 'pform') openPrepForm(sh.id);
      else if (sh.type === 'ing') openIngInfo(sh.id);
      if (st.scroll) { const box = $('#sheet'), y = st.scroll; box.scrollTop = y; requestAnimationFrame(() => { box.scrollTop = y; }); }
    }
  } finally { restoring = false; }
});

function rateHTML(id, rt) {
  const st = '<span>★</span>'.repeat(5);
  return `<div class="rate"><div class="rate-stars" role="slider" tabindex="0" aria-label="Note" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${rt}" aria-valuetext="${rt ? fmtRating(rt) + ' sur 5' : 'Pas de note'}" data-id="${esc(id)}" data-v="${rt}"><span class="r-bg">${st}</span><span class="r-fg" style="width:${rt / 5 * 100}%">${st}</span></div><span class="rate-l">${rt ? fmtRating(rt) + '/5' : 'Pas encore noté'}</span>${rt ? `<button class="btn link small" data-act="rate-clear" data-id="${esc(id)}">Effacer</button>` : ''}</div>`;
}
/* Source de la recette : le texte (source ou auteur) est dans le bandeau au-dessus du titre, pour toutes les recettes ;
   la ligne « Source » des infos n'apparaît que s'il y a un lien (http ou https). */
function sourceFact(r) {
  const url = /^https?:\/\//i.test(r.url || '') ? r.url : '';
  if (!url) return '';
  return `<div class="wide"><dt>Source</dt><dd><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">voir la source</a></dd></div>`;
}
/* Crédit d'une photo sous licence libre ; le lien n'est affiché que s'il commence par http(s). */
const creditWho = c => /^https?:\/\//.test(c.url || '') ? `<a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${esc(c.by)}</a>` : esc(c.by);
function creditHTML(r) {
  const c = r.photoCredit; if (!c || !c.by || !okPhoto(r.photo)) return photoFlagHTML(r);
  return `<p class="photo-credit">Photo : ${creditWho(c)}${c.lic ? ' · ' + esc(c.lic) : ''}</p>` + photoFlagHTML(r);
}
/* En développement seulement : rappelle le statut de licence d'une photo du dossier photos/ (PHOTO_STATUS dans data.js). */
function photoFlagHTML(r) {
  if (PUBLIC_RELEASE || r.src !== 'builtin' || !/^photos\//.test(r.photo || '')) return '';
  const s = photoState(r.id); if (s === 'ok') return '';
  return `<p class="photo-credit photo-flag">${s === 'test' ? 'Photo pour les essais seulement : elle sera retirée de la version publique.' : 'Licence de la photo à vérifier : elle ne sera pas dans la version publique tant qu\'elle n\'est pas validée.'}</p>`;
}
const SERV_PRESETS = [1, 2, 4, 8, 12];
/* Une recette est donnée pour un verre, ou pour un volume (pichet, carafe) quand r.batch = { ml }.
   Le réglage de la fiche et de la liste de courses porte sur des verres, ou sur un volume en ml. */
const batchBase = r => (r && r.batch && +r.batch.ml > 0) ? +r.batch.ml : 0;
const fmtVol = ml => fr(ml / 1000) + ' L';
function servCfg(r) {
  const b = batchBase(r);
  if (!b) return { vol: false, base: 1, step: 1, min: 1, max: 60, presets: SERV_PRESETS, fmt: n => `${n} ${plural(n, 'verre')}` };
  const step = b <= 1000 ? 250 : b <= 5000 ? 500 : 1000;
  return { vol: true, base: b, step, min: step, max: 50000, fmt: fmtVol, presets: [...new Set([b / 2, b, b * 2, b * 5].map(v => Math.round(v / 10) * 10))].filter(v => v >= step) };
}
const servAmt = r => { const a = UI.serv[r.id]; return a > 0 ? a : servCfg(r).base; };
const servK = r => servAmt(r) / servCfg(r).base;
const clampServ = (c, v) => Math.max(c.min, Math.min(c.max, v));
const stepperHTML = (act, r, amt, label) => { const c = servCfg(r); return `<span class="stepper" role="group" aria-label="${esc(label)}"><button data-act="${act}" data-id="${esc(r.id)}" data-v="-1" aria-label="${c.vol ? 'Moins' : 'Un verre de moins'}"${amt <= c.min ? ' disabled' : ''}>−</button><span class="stepper-v">${c.vol ? `<b>${esc(c.fmt(amt))}</b>` : `<b>${amt}</b> ${plural(amt, 'verre')}`}</span><button data-act="${act}" data-id="${esc(r.id)}" data-v="1" aria-label="${c.vol ? 'Plus' : 'Un verre de plus'}"${amt >= c.max ? ' disabled' : ''}>+</button></span>`; };
const presetsHTML = (act, c, amt) => `<span class="seg mini" role="group" aria-label="${c.vol ? 'Choisir un volume' : 'Choisir un nombre de verres'}">${c.presets.map(n => `<button data-act="${act}" data-v="${n}" class="${n === c.base ? 'base ' : ''}${amt === n ? 'on' : ''}" aria-pressed="${amt === n}"${n === c.base ? ' title="Quantité de la recette"' : ''}>${c.vol ? esc(fmtVol(n)) : n}</button>`).join('')}</span>`;
function servRow(r, a1 = 'serv', a2 = 'serv-set') {
  const c = servCfg(r), amt = servAmt(r);
  return `<div class="serv-row">${stepperHTML(a1, r, amt, c.vol ? 'Volume' : 'Nombre de verres')}${presetsHTML(a2, c, amt)}</div>`;
}

/* ---------- liste de courses : une seule liste, globale, gardée sur l'appareil ---------- */
/* Cumule les quantités par ingrédient (en ml pour les liquides), selon les verres choisis pour chaque recette. */
function shopTotals(recs, kOf) {
  const own = ownedSet(), tot = new Map();
  recs.forEach(r => {
    const a = analyze(r, own), k = kOf(r);
    r.ings.forEach((row, i) => {
      if (row.opt || STAPLES.includes(row.id)) return;
      const st = a.rows[i].st, e = tot.get(row.id) || { st: 'ok', qty: {}, recs: [] };
      if (st === 'miss') e.st = 'miss'; else if (st === 'home' && e.st !== 'miss') { e.st = 'home'; e.prep = a.rows[i].prep; } else if (st === 'sub' && e.st !== 'miss' && e.st !== 'home') e.st = 'sub';
      if (row.unit === 'à compléter') e.fill = true;
      else { const u = row.unit === 'cl' ? 'ml' : row.unit; e.qty[u] = (e.qty[u] || 0) + qMax(row) * (row.unit === 'cl' ? 10 : 1) * k; }
      if (!e.recs.includes(r.name)) e.recs.push(r.name);
      tot.set(row.id, e);
    });
  });
  return tot;
}
const shopQty = e => [...Object.entries(e.qty).map(([u, q]) => fmtQty({ qty: q, unit: u })), ...(e.fill ? ['à compléter'] : [])].join(' + ');
const shopRecs = () => S.shop.recs.map(x => ({ x, r: S.recipes.find(r => r.id === x.id) })).filter(o => o.r);
const shopIn = id => S.shop.recs.find(x => x.id === id);
const shopDefault = r => batchBase(r) || 1;
function shopSet(r, amt) { const v = clampServ(servCfg(r), amt), e = shopIn(r.id); if (e) e.amt = v; else S.shop.recs.push({ id: r.id, amt: v }); }
function shopAddMany(recs) { let n = 0; recs.forEach(r => { if (!shopIn(r.id)) { shopSet(r, shopDefault(r)); n++; } }); save(); return n; }
function shopRemove(id) { S.shop.recs = S.shop.recs.filter(x => x.id !== id); save(); }
const shopAmtTxt = (r, a) => servCfg(r).vol ? `${fmtVol(a)} ${r.name}` : `${a} × ${r.name}`;
function updateShopBadge() {
  const n = S && S.shop ? shopRecs().length : 0;
  document.querySelectorAll('.shop-badge').forEach(b => { b.textContent = n; b.hidden = !n; });
}
/* Ouvre la liste de courses, y compris depuis une feuille (fiche, collection) qu'on referme au passage. */
function goShop() {
  if (sheetState) { closeSheetRaw(); UI.view = 'shop'; render(); window.scrollTo(0, 0); replaceNav(); }
  else navView('shop');
}
function refreshShop() { const y = window.scrollY; renderShop($('#view')); window.scrollTo(0, y); updateShopBadge(); }
function shopAddByName() {
  const inp = $('#shop-add-i'); if (!inp) return; const k = norm(inp.value); if (!k) return;
  const part = S.recipes.filter(r => norm(r.name).includes(k));
  const r = S.recipes.find(x => norm(x.name) === k) || (part.length === 1 ? part[0] : null);
  if (!r) { toast('Recette introuvable : choisir un nom dans la liste.'); return; }
  if (shopIn(r.id)) { toast('Déjà dans la liste de courses'); return; }
  shopSet(r, shopDefault(r)); save(); refreshShop(); const n = $('#shop-add-i'); if (n) n.focus({ preventScroll: true });
}
function renderShop(m) {
  const items = shopRecs(), recs = items.map(o => o.r);
  const tot = shopTotals(recs, r => shopIn(r.id).amt / servCfg(r).base);
  const group = g => [...tot].filter(([, e]) => e.st === g).sort((x, y) => ingName(x[0]).localeCompare(ingName(y[0]), 'fr'));
  const li = (arr, cls) => `<ul>${arr.map(([id, e]) => `<li><i class="dot ${cls}"></i><span>${esc(ingName(id))} <b class="qty">${esc(shopQty(e))}</b><small>${esc(e.recs.slice(0, 3).join(', '))}${e.recs.length > 3 ? '…' : ''}</small></span></li>`).join('')}</ul>`;
  const miss = group('miss'), home = group('home'), sub = group('sub'), ok = group('ok');
  const glass = items.filter(o => !batchBase(o.r)).map(o => o.x.amt), common = glass.length && glass.every(a => a === glass[0]) ? glass[0] : 0;
  const rows = items.map(({ x, r }) => `<div class="srec"><span class="lthumb" style="--c:${okColor(r.color)}">${visual(r)}</span><button class="lname srec-n" data-act="open" data-id="${esc(r.id)}">${esc(r.name)}</button>${stepperHTML('shop-serv', r, x.amt, (servCfg(r).vol ? 'Volume pour ' : 'Verres pour ') + r.name)}<button class="icon-btn srm" data-act="shop-rm" data-id="${esc(r.id)}" aria-label="Retirer ${esc(r.name)} de la liste">×</button></div>`).join('');
  const addable = S.recipes.filter(r => !shopIn(r.id)).sort(byRecName);
  m.innerHTML = `<h1 class="view">Liste de courses</h1>
  <div class="coll-page"><div class="coll-body">
    <div class="blocks"><section class="sec">
      <p class="hint">Une seule liste pour tout l'appareil : les recettes ajoutées s'y cumulent, avec les quantités à acheter. Ce qui est déjà dans le bar est mis de côté.</p>
      ${items.length ? `<div class="shead"><h2>Combien de verres ?</h2>${glass.length ? presetsHTML('shop-all', servCfg({}), common) : ''}</div>
        ${glass.length ? '<p class="hint">Le choix du haut s\'applique à toutes les recettes servies au verre ; chaque recette se règle ensuite séparément.</p>' : ''}
        <div class="srecs">${rows}</div>` : `<p class="muted">La liste est vide. Une recette s'ajoute depuis sa fiche ; toutes celles d'une liste ou d'une collection s'ajoutent d'un seul geste depuis la page Listes.</p>`}
      <div class="inline-form"><input id="shop-add-i" type="text" list="dl-shop" placeholder="Ajouter une recette du catalogue" aria-label="Ajouter une recette à la liste de courses" autocomplete="off"><button class="btn small" data-act="shop-add-name">Ajouter</button></div>
      <datalist id="dl-shop">${addable.map(r => `<option value="${esc(r.name)}"></option>`).join('')}</datalist>
    </section></div>
    <aside class="coll-side panel shop"><div class="row-btns"><button class="btn small" data-act="shop-copy">Copier la liste</button>${items.length ? `<button class="btn small ghost danger" data-act="shop-clear">${UI.confirm === 'shop-clear' ? 'Confirmer : tout retirer' : 'Vider la liste'}</button>` : ''}</div>
      <h2>Ingrédients</h2>
      ${miss.length ? `<h3 class="lbl">À acheter (${miss.length})</h3>${li(miss, 'miss')}` : (items.length ? '<p class="avail ok">Rien à acheter : tout est dans le bar.</p>' : '<p class="muted">Rien pour l\'instant.</p>')}
      ${home.length ? `<h3 class="lbl">À faire maison (${home.length})</h3><ul>${home.map(([id, e]) => `<li><i class="dot home"></i><span>${esc(ingName(id))} <b class="qty">${esc(shopQty(e))}</b><small><button type="button" class="ing-link" data-act="open-prep" data-id="${esc(e.prep)}">${esc(prepName(e.prep))}</button> · ${esc(e.recs.slice(0, 3).join(', '))}${e.recs.length > 3 ? '…' : ''}</small></span></li>`).join('')}</ul>` : ''}
      ${sub.length ? `<h3 class="lbl">Remplaçables (${sub.length})</h3>${li(sub, 'sub')}` : ''}
      ${ok.length ? `<details data-keep="shop-ok"${UI.keep.has('shop-ok') ? ' open' : ''}><summary class="lbl" style="cursor:pointer">Dans le bar (${ok.length})</summary>${li(ok, '')}</details>` : ''}
    </aside>
  </div></div>`;
}
function openDetail(id, keep, back) {
  const sh = $('#sheet'), st = keep ? sh.scrollTop : 0, r = S.recipes.find(x => x.id === id);
  if (!r) { closeSheet(); return; }
  if (!keep) { keepSheetScroll(); UI.newList = null; }
  if (back === undefined && keep && sheetState) back = sheetState.back;
  sheetState = { type: 'detail', id, back: back || null };
  if (!keep) { S.views = S.views || {}; const v = S.views[id] || { n: 0 }; v.n++; v.t = Date.now(); S.views[id] = v; save(); }
  const a = analyze(r, ownedSet()), abv = estAbv(r), rt = S.ratings[r.id] || 0, del = UI.confirm === 'del:' + r.id, nt = S.notes[r.id] || { text: '', pub: false }, pv = nt.pub ? '1' : '0';
  const top = !!String(nt.text || '').trim(), gl = garnLabel(r), par = parentOf(r), vars = variantsOf(r);
  const avis = cls => `<section class="sec mynote${top ? ' top' : ''} ${cls}"><div class="shead"><h2>Mon avis</h2><div class="seg mini" role="group" aria-label="Visibilité de l'avis">${[['0', 'Privé'], ['1', 'Public']].map(([v, l]) => `<button data-act="note-vis" data-id="${esc(r.id)}" data-v="${v}" class="${pv === v ? 'on' : ''}" aria-pressed="${pv === v}">${l}</button>`).join('')}</div></div>
      <label class="sr" for="my-note">Mon avis sur ce cocktail</label><textarea id="my-note" data-id="${esc(r.id)}" rows="${top ? 2 : 4}" placeholder="Ressenti, ajustements, accords…">${esc(nt.text)}</textarea>
      <p class="hint" id="note-st">${esc(noteHint(S.notes[r.id]))}</p></section>`;
  const homeTxt = a.home.length ? ` ${a.home.length > 1 ? 'Préparations' : 'Une préparation'} à faire maison : ${a.home.map(prepName).join(', ')}.` : '';
  const availTxt = !a.miss.length ? (a.subs ? `Réalisable avec le bar, avec ${a.subs} ${plural(a.subs, 'substitution')}.` : 'Réalisable avec le bar.') + homeTxt : `Manquant : ${a.miss.map(ingName).join(', ')}.` + homeTxt;
  const kServ = servK(r);
  const sx = shopIn(r.id), amtNow = servAmt(r), cfgNow = servCfg(r);
  const shopHTML = `<div class="shop-add">${sx ? `<span class="hint">Dans la liste de courses : <b>${esc(cfgNow.fmt(sx.amt))}</b></span>${sx.amt !== amtNow ? `<button class="btn small" data-act="shop-add" data-id="${esc(r.id)}">Passer à ${esc(cfgNow.fmt(amtNow))}</button>` : ''}<button class="btn small ghost" data-act="shop-rm" data-id="${esc(r.id)}">Retirer</button><button class="btn small ghost" data-act="go-shop">Voir la liste</button>` : `<button class="btn small" data-act="shop-add" data-id="${esc(r.id)}">Ajouter aux courses (${esc(cfgNow.fmt(amtNow))})</button>`}</div>`;
  const rowsHTML = r.ings.map((row, i) => {
    const s = a.rows[i], info = [], ing = S.ings[row.id];
    if (s.st === 'sub') info.push(`Substitut disponible : ${esc(ingName(s.by))}`);
    if (s.st === 'home') info.push(`À faire maison : <button type="button" class="ing-link" data-act="open-prep" data-id="${esc(s.prep)}">${esc(prepName(s.prep))}</button>`);
    if (row.opt) info.push('Facultatif');
    if (row.sub && ing) info.push(`Tout « ${esc(ing.cat)} » convient`);
    if (row.alts && row.alts.length) info.push(`Ou : ${esc(row.alts.map(a => altTxt(a, kServ)).join(' ; '))}`);
    return `<li><span class="dot ${s.st === 'ok' ? '' : s.st}" aria-label="${{ ok: 'Dans le bar', sub: 'Substitut disponible', home: 'À faire maison', miss: 'Manquant', opt: 'Facultatif, absent' }[s.st]}"></span><span class="q">${esc(fmtQty(row, kServ))}</span><span class="nm"><button class="ing-link" data-act="ing-info" data-id="${esc(row.id)}" title="Voir la fiche de cet ingrédient">${esc(ingName(row.id))}</button>${row.tip ? `<small class="tip">Conseil : ${esc(row.tip)}</small>` : ''}${info.length ? `<small>${info.join(' · ')}</small>` : ''}</span></li>`;
  }).join('');
  sh.innerHTML = `
  <div class="sheet-bar"><div class="sheet-bar-in"><button class="btn ghost" data-act="back">‹ ${back ? 'Collection' : 'Retour'}</button><span class="grow"></span><button class="btn small" data-act="edit" data-id="${esc(r.id)}">Modifier</button><button class="btn small ghost danger" data-act="del" data-id="${esc(r.id)}">${del ? 'Confirmer' : 'Supprimer'}</button></div></div>
  <div class="sheet-body"><article class="inner wide detail" style="--c:${okColor(r.color)}">
    <div class="d-left cols dz">
      <div class="d-hero dhero o1">${visual(r)}</div>${creditHTML(r)}
      <section class="sec o6"><h2>Profil de goût</h2>${TASTE.every(([k]) => r.flavor[k] == null) ? '<p class="hint">Profil de goût non renseigné.</p>' : `<div class="taste">${TASTE.map(([k, l]) => { const v = r.flavor[k]; return `<div class="taste-row"><span>${l}</span><span class="pips${v == null ? ' unk' : ''}">${[1, 2, 3, 4, 5].map(n => `<i class="${v != null && n <= v ? 'on' : ''}"></i>`).join('')}</span><span class="tv">${v == null ? '—' : v}</span></div>`; }).join('')}</div>`}</section>
      ${top ? '' : avis('o8')}
      ${r.tags.length ? `<section class="sec o9"><h2>Mood</h2><div class="chips">${r.tags.map(t => `<button class="chip" data-act="by-tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div></section>` : ''}
    </div>
    <div class="d-right cols dz">
      <div class="d-head dz">
      <header class="dhead o2"><p class="eyebrow"><span class="orig">${esc(origLabel(r))}</span></p><h1>${esc(r.name)}</h1>${r.subtitle ? `<p class="subtitle">${esc(r.subtitle)}</p>` : ''}${par ? `<p class="variant-of">Variante de <button type="button" class="variant-link" data-act="open" data-id="${esc(par.id)}">${esc(par.name)}</button></p>` : ''}${rateHTML(r.id, rt)}${top ? avis('') : ''}</header>
      <dl class="facts o3"><div><dt>Méthode</dt><dd>${esc(r.method)}${isEasy(r) ? ' · Facile' : ''}</dd></div><div><dt>Verre</dt><dd>${esc(r.glass)}</dd></div><div class="wide"><dt>Garniture</dt><dd>${esc(gl || 'Aucune')}</dd></div>${r.rim ? `<div><dt>Bord du verre</dt><dd>${esc(rimLabel(r.rim))}</dd></div>` : ''}<div title="Estimation après dilution par la glace"${r.rim ? '' : ' class="wide"'}><dt>Degré estimé</dt><dd class="mono">${isNA(r) ? 'Sans alcool' : abv == null ? '—' : `≈ ${abv} % vol.`}</dd></div>${sourceFact(r)}</dl>
      <div class="o4 lists-pick"><div class="chips" aria-label="Listes">${S.lists.map(l => { const on = l.items.includes(r.id); return `<button class="chip ${on ? 'on' : ''}" data-act="tog-list" data-list="${esc(l.id)}" data-id="${esc(r.id)}" aria-pressed="${on}">${on ? '✓ ' : '+ '}${esc(l.name)}</button>`; }).join('')}<button class="chip chip-new" data-act="new-list-open" data-id="${esc(r.id)}" aria-expanded="${UI.newList === r.id}">+ Nouvelle liste</button></div>
        ${UI.newList === r.id ? `<div class="inline-form"><input id="nl-detail" type="text" aria-label="Nom de la nouvelle liste" placeholder="Nom de la liste" maxlength="40" autocomplete="off"><button class="btn primary small" data-act="new-list-ok" data-id="${esc(r.id)}">Créer et ajouter</button><button class="btn small ghost" data-act="new-list-cancel" data-id="${esc(r.id)}">Annuler</button></div>` : ''}</div>
    </div>
      <section class="sec ings-sec o5"><div class="shead"><h2>Ingrédients</h2><div class="seg mini" role="group" aria-label="Unité">${['ml', 'cl', 'oz'].map(u => `<button data-act="unit" data-v="${u}" class="${S.unit === u ? 'on' : ''}" aria-pressed="${S.unit === u}">${u}</button>`).join('')}</div></div>
        ${servRow(r)}
        ${shopHTML}
        <p class="avail ${a.miss.length ? 'miss' : 'ok'}">${esc(availTxt)}</p>
        <ul class="ings">${rowsHTML}</ul>
        <p class="legend"><span><i class="dot"></i>Dans le bar</span><span><i class="dot sub"></i>Substitut dispo</span><span><i class="dot home"></i>À faire maison</span><span><i class="dot miss"></i>Manquant</span><span><i class="dot opt"></i>Facultatif</span></p></section>
      ${r.steps.length ? `<section class="sec o7"><h2>Préparation</h2><ol class="steps">${r.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol></section>` : ''}
      ${r.note ? `<section class="sec o10"><h2>Notes de la recette</h2><ul class="notes">${String(r.note).split('\n').map(x => x.trim()).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
      ${vars.length ? `<section class="sec o11"><div class="shead"><h2>Variantes</h2><span class="count">${vars.length}</span></div><p class="hint">Recettes dérivées de celle-ci : un autre alcool, un ingrédient en moins ou en plus. Utile pour trouver une alternative.</p><div class="rgrid">${vars.map(v => rcardHTML(v, ownedSet())).join('')}</div></section>` : ''}
    </div>
  </article></div>`;
  showSheet(); const nta = $('#my-note'); if (nta) autosize(nta); sh.scrollTop = st;
  if (UI.newList === id) { const nl = $('#nl-detail'); if (nl) nl.focus({ preventScroll: true }); }
  if (!keep) pushNav();
}

/* ---------- formulaire ---------- */
function altRowHTML(a) {
  const o = typeof a === 'string' || !a ? { id: a && a } : a, ing = o.id && S.ings[o.id];
  return `<div class="alt-row"><input type="text" class="f-aid" list="dl-ings" placeholder="Remplaçant (choisir dans la liste)" aria-label="Ingrédient de remplacement" value="${esc(ing ? ing.name : '')}" autocomplete="off">
    <input type="number" class="f-aq" inputmode="decimal" step="any" min="0" placeholder="Idem" aria-label="Dose du remplaçant (vide : même dose)" value="${o.qty ? esc(o.qty) : ''}">
    <select class="f-au" aria-label="Unité du remplaçant">${opts(UNITS.filter(u => u !== 'à compléter'), o.unit == null ? 'ml' : o.unit)}</select>
    <button type="button" class="icon-btn" data-act="alt-del" aria-label="Retirer ce remplaçant">×</button></div>`;
}
function rowHTML(row) {
  const n = ++rowN, ing = row && S.ings[row.id];
  return `<div class="frow">
    <div class="frow-main">
      <input type="text" class="f-ing" id="ri-n${n}" list="dl-ings" placeholder="Ingrédient" aria-label="Ingrédient" value="${esc(ing ? ing.name : '')}" autocomplete="off">
      <input type="number" class="f-qty" id="ri-q${n}" inputmode="decimal" step="any" min="0" placeholder="Qté" aria-label="Quantité" value="${row && row.unit !== 'à compléter' ? esc(row.qty) : ''}">
      <select class="f-unit" id="ri-u${n}" aria-label="Unité">${opts(UNITS, row ? row.unit : 'ml')}</select>
      <button type="button" class="icon-btn" data-act="row-del" aria-label="Retirer cet ingrédient">×</button>
    </div>
    <div class="frow-range"><label for="ri-q2${n}">Fourchette : jusqu'à</label><input type="number" class="f-qty2" id="ri-q2${n}" inputmode="decimal" step="any" min="0" placeholder="Qté max" aria-label="Quantité maximale (facultatif), pour indiquer par exemple 3 à 6" value="${row && hasRange(row) ? esc(row.qty2) : ''}"><span class="hint">facultatif, ex. 3 à 6 dashs</span></div>
    <div class="frow-new" hidden><span class="hint-new">Nouvel ingrédient : à préciser</span>
      <input type="text" class="f-cat" id="ri-c${n}" list="dl-cats" placeholder="Groupe de substitution" aria-label="Groupe de substitution">
      <select class="f-fam" id="ri-f${n}" aria-label="Rangement dans le bar">${opts(PLACES, 'Mes ingrédients|')}</select>
      <input type="number" class="f-abv" id="ri-a${n}" min="0" max="100" step="any" placeholder="% vol." aria-label="Degré d'alcool">
    </div>
    <div class="frow-tip"><input type="text" class="f-tip" id="ri-t${n}" maxlength="120" placeholder="Marque ou profil conseillé (facultatif), ex. gin herbacé, Henri Bardouin" aria-label="Marque ou profil conseillé pour cet ingrédient" value="${esc(row && row.tip || '')}" autocomplete="off"></div>
    <div class="frow-opts">
      <label for="ri-s${n}"><input type="checkbox" class="f-sub" id="ri-s${n}"${row && row.sub ? ' checked' : ''}> Tout son groupe convient</label>
      <label for="ri-o${n}"><input type="checkbox" class="f-opt" id="ri-o${n}"${row && row.opt ? ' checked' : ''}> Facultatif</label>
    </div>
    <div class="frow-alts"><div class="alt-list">${(row && row.alts || []).map(altRowHTML).join('')}</div><button type="button" class="btn small ghost" data-act="alt-add">+ Remplaçant</button></div>
  </div>`;
}
function checkNew(fr) { const v = fr.querySelector('.f-ing').value.trim(); fr.querySelector('.frow-new').hidden = !v || !!findIng(v); }
const CUT_KEYS = GARNISH_CUTS.map(c => c[0]);
function openForm(id) {
  const src = id ? S.recipes.find(r => r.id === id) : null;
  const r = src ? clone(src) : { name: '', origin: 'Original', by: 'me', author: '', method: 'Shaker', glass: 'Coupe', garn: '', garnish: '', rim: '', color: '#FFC21A', photo: '', flavor: { su: null, ac: null, am: null, as: null, fo: null }, tags: [], ings: [], steps: [], note: '' };
  /* Recette de base possible : toutes, sauf elle-même et ses propres variantes (pas de boucle). Un nom porté par deux recettes est précisé par l'id. */
  const noParent = new Set(id ? [id, ...descendantIds(id)] : []);
  const pCand = S.recipes.filter(x => !noParent.has(x.id)).sort(byRecName), pCount = {};
  pCand.forEach(x => pCount[norm(x.name)] = (pCount[norm(x.name)] || 0) + 1);
  const pLabel = x => pCount[norm(x.name)] > 1 ? `${x.name} (${x.id})` : x.name, pmap = new Map(pCand.map(x => [norm(pLabel(x)), x.id]));
  const pCur = r.parent && pCand.find(x => x.id === r.parent);
  sheetState = { type: 'form', id: id || null, photo: okPhoto(r.photo), pmap }; rowN = 0; UI.confirm = null;
  const rows = r.ings.length ? r.ings : [null, null, null], bm = batchBase(r);
  const cats = [...new Set(Object.values(S.ings).map(i => i.cat))].sort((a, b) => a.localeCompare(b, 'fr'));
  const tagsAll = [...new Set([...TAG_SUGG, ...S.recipes.flatMap(x => x.tags)])];
  const [gcut, gfruit] = (r.garn || '').split('-'), cut = r.garn ? gcut : 'none', fruit = CUT_KEYS.includes(gcut) ? gfruit : 'lime';
  const gTiles = [['none', 'Aucune'], ...GARNISH_CUTS, ...GARNISH_OTHERS];
  const sh = $('#sheet');
  sh.innerHTML = `
  <div class="sheet-bar"><div class="sheet-bar-in"><button class="btn ghost" data-act="${id ? 'back-detail' : 'close'}" data-id="${esc(id || '')}">Annuler</button><span class="grow sheet-title">${id ? 'Modifier la recette' : 'Nouvelle recette'}</span><button class="btn primary small" data-act="form-save">Enregistrer</button></div></div>
  <div class="sheet-body"><form class="inner wide form" id="rform" novalidate>
    <datalist id="dl-ings">${Object.values(S.ings).map(i => i.name).sort((a, b) => a.localeCompare(b, 'fr')).map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist>
    <datalist id="dl-cats">${cats.map(c => `<option value="${esc(c)}"></option>`).join('')}</datalist>
    <datalist id="dl-recipes">${pCand.map(x => `<option value="${esc(pLabel(x))}"></option>`).join('')}</datalist>
    <div class="cols col-a">
    <section class="sec"><h2>L'essentiel</h2>
      <label class="field" for="rf-name"><span>Nom</span><input type="text" id="rf-name" value="${esc(r.name)}" placeholder="ex. Hugo Spritz" autocomplete="off"></label>
      <label class="field" for="rf-sub"><span>Sous-titre ou autre nom (facultatif)</span><input type="text" id="rf-sub" value="${esc(r.subtitle || '')}" placeholder="ex. Cucumber agua fresca" autocomplete="off"><small class="hint">Affiché sous le nom, et retrouvé par la recherche.</small></label>
      <label class="field" for="rf-parent"><span>Variante de (facultatif)</span><input type="text" id="rf-parent" list="dl-recipes" value="${esc(pCur ? pLabel(pCur) : '')}" placeholder="ex. Margarita" autocomplete="off"><small class="hint">Choisir la recette de base dans la liste : la fiche affichera « Variante de … » avec un lien vers elle, et la recette de base listera ses variantes. Effacer le champ pour retirer le lien.</small></label>
      <div class="photo-box" id="photo-box">
        <div class="photo-prev" id="photo-prev" style="--c:${okColor(r.color)}"></div>
        <div class="photo-ctrl">
          <button type="button" class="btn small" data-act="photo-pick">Choisir une photo</button><input type="file" id="rf-photo" accept="image/*" class="file-hidden" tabindex="-1" aria-hidden="true">
          <button type="button" class="btn small" data-act="photo-crop" id="photo-crop" hidden>Recadrer</button>
          <button type="button" class="btn small ghost danger" data-act="photo-del" id="photo-del" hidden>Retirer la photo</button>
          <p class="hint">Une image peut aussi être glissée sur cette zone. Sans photo, l'illustration reprend la couleur, le verre, la garniture et le bord choisis.</p>
        </div>
      </div>
      <div class="field"><span>Couleur</span>
        <input type="hidden" id="rf-color" value="${okColor(r.color)}">
        <div class="swatches" role="group" aria-label="Couleur du cocktail">${SWATCHES.map(([c, n]) => `<button type="button" class="sw${c.toLowerCase() === okColor(r.color).toLowerCase() ? ' on' : ''}" data-act="swatch" data-v="${c}" style="--sw:${c}" title="${n}" aria-label="${n}"></button>`).join('')}</div>
        <details class="custom-c"${SWATCHES.some(([c]) => c.toLowerCase() === okColor(r.color).toLowerCase()) ? '' : ' open'}><summary>Couleur personnalisée</summary>
          <div class="hsl">${[['h', 'Teinte', 0, 360], ['s', 'Intensité', 0, 100], ['l', 'Clarté', 10, 90]].map(([k, l, mn, mx]) => `<label class="slider" for="cc-${k}"><span>${l}</span><input type="range" class="cr" id="cc-${k}" min="${mn}" max="${mx}" step="1"><span></span></label>`).join('')}</div>
        </details>
      </div>
      <div class="field"><span>Origine</span>
        <input type="hidden" id="rf-origin" value="${r.origin === 'Classique' ? 'Classique' : 'Original'}">
        <div class="seg" role="group" aria-label="Origine" style="max-width:320px">${['Classique', 'Original'].map(v => { const on = (r.origin === 'Classique' ? 'Classique' : 'Original') === v; return `<button type="button" data-act="orig" data-v="${v}" class="${on ? 'on' : ''}" aria-pressed="${on}">${v}</button>`; }).join('')}</div>
        <div class="obys" id="orig-by" ${r.origin === 'Classique' ? 'hidden' : ''}>
          <label for="rf-by-me"><input type="radio" name="rf-by" id="rf-by-me" value="me"${r.by !== 'other' ? ' checked' : ''}> Par moi</label>
          <label for="rf-by-other"><input type="radio" name="rf-by" id="rf-by-other" value="other"${r.by === 'other' ? ' checked' : ''}> Par quelqu'un d'autre</label>
        </div>
        <label class="field" for="rf-author" id="orig-src" ${r.origin === 'Original' && r.by !== 'other' ? 'hidden' : ''}><span>Source</span><input type="text" id="rf-author" value="${esc(r.origin === 'Original' ? r.author : r.source || '')}" placeholder="Barman, bar, livre, site…"></label>
        <label class="field" for="rf-url"><span>Lien (facultatif)</span><input type="url" id="rf-url" inputmode="url" autocomplete="off" value="${esc(r.url || '')}" placeholder="https://…"></label>
      </div>
    </section>
    <section class="sec"><h2>Le service</h2>
      <div class="field"><span>Méthode</span><input type="hidden" id="rf-method" value="${esc(r.method)}">
        <div class="chips">${METHODS.map(m => `<button type="button" class="chip${m === r.method ? ' on' : ''}" data-act="pick-chip" data-for="rf-method" data-v="${esc(m)}" aria-pressed="${m === r.method}">${esc(m)}</button>`).join('')}</div></div>
      <div class="field"><span>Niveau</span><input type="hidden" id="rf-level" value="${typeof r.easy === 'boolean' ? (r.easy ? 'easy' : 'hard') : 'auto'}">
        <div class="seg" role="group" aria-label="Niveau" style="max-width:420px">${[['auto', 'Automatique'], ['easy', 'Facile'], ['hard', 'Pas facile']].map(([v, l]) => { const on = (typeof r.easy === 'boolean' ? (r.easy ? 'easy' : 'hard') : 'auto') === v; return `<button type="button" data-act="level-set" data-v="${v}" class="${on ? 'on' : ''}" aria-pressed="${on}">${l}</button>`; }).join('')}</div>
        <p class="hint">Automatique : facile si la recette compte peu d'ingrédients (4 au plus dans le verre, le pichet ou la casserole, 3 au plus pour les autres méthodes), sans blender ni œuf.</p></div>
      <div class="field"><span>Verre</span><input type="hidden" id="rf-glass" value="${esc(r.glass)}">
        <div class="gtiles">${GLASSES.map(gl => `<button type="button" class="gt${gl === r.glass ? ' on' : ''}" data-act="pick-glass" data-v="${esc(gl)}" aria-pressed="${gl === r.glass}"><span class="gt-v"></span><span class="gt-l">${esc(gl)}</span></button>`).join('')}</div></div>
      <div class="field"><span>Garniture</span><input type="hidden" id="rf-gcut" value="${esc(cut)}"><input type="hidden" id="rf-gfruit" value="${esc(fruit)}">
        <div class="gtiles small" id="gtiles">${gTiles.map(([k, l]) => `<button type="button" class="gt${k === cut ? ' on' : ''}" data-act="pick-garn" data-v="${k}" aria-pressed="${k === cut}"><span class="gt-v"></span><span class="gt-l">${esc(l)}</span></button>`).join('')}</div>
        <div class="chips" id="gfruits"${CUT_KEYS.includes(cut) ? '' : ' hidden'}>${GARNISH_FRUITS.map(([k, l]) => `<button type="button" class="chip${k === fruit ? ' on' : ''}" data-act="pick-gfruit" data-v="${k}" aria-pressed="${k === fruit}">${l.charAt(0).toUpperCase() + l.slice(1)}</button>`).join('')}</div>
        <label class="field" for="rf-garnish"><span>Autre garniture, non dessinée</span><input type="text" id="rf-garnish" value="${esc(r.garnish)}" placeholder="ex. muscade râpée, fleur comestible"></label>
      </div>
      <div class="field"><span>Bord du verre</span><input type="hidden" id="rf-rim" value="${esc(r.rim || '')}">
        <div class="chips">${RIMS.map(([k, l]) => `<button type="button" class="chip${k === (r.rim || '') ? ' on' : ''}" data-act="pick-chip" data-for="rf-rim" data-v="${k}" aria-pressed="${k === (r.rim || '')}">${l}</button>`).join('')}</div></div>
    </section>
    </div>
    <div class="cols col-b">
    <section class="sec"><h2>Ingrédients</h2>
      <div class="field"><span>Quantités données pour</span>
        <input type="hidden" id="rf-batch" value="${bm ? 'volume' : 'verre'}">
        <div class="seg" role="group" aria-label="Quantités données pour" style="max-width:320px">${[['verre', 'Un verre'], ['volume', 'Un volume']].map(([v, l]) => { const on = (bm ? 'volume' : 'verre') === v; return `<button type="button" data-act="batch-mode" data-v="${v}" class="${on ? 'on' : ''}" aria-pressed="${on}">${l}</button>`; }).join('')}</div>
        <div class="batch-vol" id="batch-vol"${bm ? '' : ' hidden'}><input type="text" inputmode="decimal" id="rf-batch-qty" aria-label="Volume obtenu" value="${bm ? esc(fr(bm / 1000)) : ''}" placeholder="ex. 2"><select id="rf-batch-unit" aria-label="Unité du volume">${opts(['L', 'cl', 'ml'], 'L')}</select></div>
        <p class="hint">« Un volume » sert aux boissons préparées en pichet ou en carafe : on indique le volume obtenu (par exemple 2 L d'agua de Jamaica) et les quantités ci-dessous sont celles de ce volume, sans calcul pour un verre. Sur la fiche, le volume se règle ensuite.</p>
      </div>
      <p class="hint">Un nom inconnu crée un nouvel ingrédient. La case « tout son groupe convient » accepte n'importe quelle référence équivalente, par exemple une autre liqueur d'orange. Pour un soda qui allonge le verre, utiliser l'unité « à compléter ».</p>
      <div id="frows" class="frows">${rows.map(rowHTML).join('')}</div>
      <div><button type="button" class="btn small" data-act="row-add">+ Ajouter un ingrédient</button></div>
    </section>
    <section class="sec"><h2>Profil de goût</h2><p class="hint">De 0 à 5, pour les filtres du catalogue. Un goût difficile à évaluer peut rester « non renseigné ».</p><div class="sliders">${TASTE.map(([k, l]) => { const v = r.flavor[k], u = v == null; return `<div class="slider${u ? ' unk' : ''}" id="sl-${k}"><label for="rf-${k}">${l}</label><input type="range" id="rf-${k}" min="0" max="5" step="1" value="${u ? 0 : v}"><output id="ro-${k}" for="rf-${k}">${u ? '—' : v}</output><label class="unk-l" for="uk-${k}"><input type="checkbox" id="uk-${k}" class="uk" data-k="${k}"${u ? ' checked' : ''}> Non renseigné</label></div>`; }).join('')}</div></section>
    <section class="sec"><h2>Mood et tags</h2>
      <label class="field" for="rf-tags"><span>Tags, séparés par des virgules</span><input type="text" id="rf-tags" value="${esc(r.tags.join(', '))}" autocomplete="off"></label>
      <div class="chips">${tagsAll.map(t => `<button type="button" class="chip ${r.tags.includes(t) ? 'on' : ''}" data-act="tag-sugg" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    </section>
    <section class="sec"><h2>Préparation</h2>
      <label class="field" for="rf-steps"><span>Une étape par ligne</span><textarea id="rf-steps" rows="5">${esc(r.steps.join('\n'))}</textarea></label>
      <label class="field" for="rf-note"><span>Notes (une par ligne)</span><textarea id="rf-note" rows="3" placeholder="Variantes, astuces, origine de l'idée…">${esc(r.note)}</textarea></label>
    </section>
    <p class="err" id="rf-err" hidden></p>
    <div><button type="button" class="btn primary" data-act="form-save">Enregistrer la recette</button></div>
    </div>
  </form></div>`;
  sh.querySelectorAll('.frow').forEach(checkNew);
  updatePrev(); syncHSL(); showSheet(); sh.scrollTop = 0; pushNav();
}
function currentGarn() {
  const c = $('#rf-gcut') ? $('#rf-gcut').value : 'none';
  if (c === 'none' || !c) return '';
  return CUT_KEYS.includes(c) ? c + '-' + ($('#rf-gfruit').value || 'lime') : c;
}
function syncOrig() { const o = $('#rf-origin').value === 'Original', other = $('#rf-by-other').checked; $('#orig-by').hidden = !o; $('#orig-src').hidden = o && !other; }
function updatePrev() {
  const p = $('#photo-prev'); if (!p) return;
  const c = okColor($('#rf-color').value), g = $('#rf-glass').value, garn = currentGarn(), rim = $('#rf-rim').value;
  p.style.setProperty('--c', c);
  p.innerHTML = sheetState.photo ? `<img src="${sheetState.photo}" alt="Photo du cocktail">` : glassSVG(g, c, garn, rim);
  $('#photo-del').hidden = !sheetState.photo;
  $('#photo-crop').hidden = !sheetState.photo;
  document.querySelectorAll('[data-act="pick-glass"]').forEach(t => t.querySelector('.gt-v').innerHTML = glassSVG(t.dataset.v, c));
  const fruit = $('#rf-gfruit').value || 'lime';
  document.querySelectorAll('[data-act="pick-garn"]').forEach(t => { const k = t.dataset.v; t.querySelector('.gt-v').innerHTML = garnIcon(k === 'none' ? '' : CUT_KEYS.includes(k) ? k + '-' + fruit : k); });
}
function hexToHsl(h) { const r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let H = 0, Sa = 0; const L = (mx + mn) / 2; if (d) { Sa = d / (1 - Math.abs(2 * L - 1)); H = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; H *= 60; if (H < 0) H += 360; } return [Math.round(H), Math.round(Sa * 100), Math.round(L * 100)]; }
function hslToHex(h, s, l) { s /= 100; l /= 100; const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); }
function paintHSL() { const w = document.querySelector('.hsl'); if (!w) return; w.style.setProperty('--h', $('#cc-h').value); w.style.setProperty('--s', $('#cc-s').value + '%'); w.style.setProperty('--l', $('#cc-l').value + '%'); }
function syncHSL() { if (!$('#cc-h')) return; const [h, s, l] = hexToHsl(okColor($('#rf-color').value)); $('#cc-h').value = h; $('#cc-s').value = s; $('#cc-l').value = Math.min(90, Math.max(10, l)); paintHSL(); }
function setColor(c, fromSwatch) { $('#rf-color').value = c; document.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x.dataset.v.toLowerCase() === c.toLowerCase())); if (fromSwatch) syncHSL(); updatePrev(); }
function pickIn(container, b, sel) { container.querySelectorAll(sel).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); }

/* ---------- listes déroulantes maison ---------- */
const CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
function selTitle(sel) { const a = sel.getAttribute('aria-label'); if (a) return a; const lb = sel.closest('label'); if (!lb) return ''; const s = lb.querySelector(':scope>span'); return (s ? s.textContent : (lb.firstChild && lb.firstChild.textContent) || '').trim(); }
function syncCsel(b) { const sel = b.previousElementSibling, o = sel.options[sel.selectedIndex]; b.innerHTML = `<span>${esc(o ? o.textContent : '')}</span>${CHEV}`; }
function enhanceSelects() { document.querySelectorAll('select:not([data-enh])').forEach(sel => { sel.dataset.enh = '1'; sel.classList.add('sr'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true'); const b = document.createElement('button'); b.type = 'button'; b.className = 'csel'; b.dataset.act = 'csel'; b.setAttribute('aria-haspopup', 'listbox'); b.setAttribute('aria-label', selTitle(sel)); sel.after(b); syncCsel(b); }); }
const PICK = {};
function openPick(b) {
  const sel = b.previousElementSibling, p = $('#pick'); PICK.b = b;
  p.querySelector('.pick-in').innerHTML = `<p class="pick-t">${esc(b.getAttribute('aria-label'))}</p>` + [...sel.options].map((o, i) => `<button type="button" class="pick-o${i === sel.selectedIndex ? ' on' : ''}" role="option" aria-selected="${i === sel.selectedIndex}" data-act="pick-opt" data-i="${i}">${esc(o.textContent)}</button>`).join('');
  p.hidden = false; lockScroll();
  const on = p.querySelector('.pick-o.on') || p.querySelector('.pick-o'); if (on) { on.focus({ preventScroll: true }); on.scrollIntoView({ block: 'nearest' }); }
}
function closePick() { $('#pick').hidden = true; unlockScroll(); const b = PICK.b; PICK.b = null; if (b && b.isConnected) b.focus({ preventScroll: true }); }

/* ---------- photo : recadrage 4:3 et glisser-déposer ---------- */
const CROP = {};
function openCrop(src) {
  const img = new Image();
  img.onload = () => {
    CROP.img = img; CROP.zoom = 1; $('#crop-zoom').value = 1; $('#crop-img').src = src; $('#crop').hidden = false; lockScroll();
    requestAnimationFrame(() => { const f = $('#crop-frame'); CROP.W = f.clientWidth; CROP.H = f.clientHeight; CROP.s0 = Math.max(CROP.W / img.naturalWidth, CROP.H / img.naturalHeight); CROP.s = CROP.s0; CROP.x = (CROP.W - img.naturalWidth * CROP.s) / 2; CROP.y = (CROP.H - img.naturalHeight * CROP.s) / 2; drawCrop(); });
  };
  img.onerror = () => toast('Image illisible. Formats conseillés : JPEG ou PNG.');
  img.src = src;
}
function drawCrop() {
  const i = CROP.img; if (!i) return; const w = i.naturalWidth * CROP.s, h = i.naturalHeight * CROP.s;
  CROP.x = Math.min(0, Math.max(CROP.W - w, CROP.x)); CROP.y = Math.min(0, Math.max(CROP.H - h, CROP.y));
  const el = $('#crop-img'); el.style.width = w + 'px'; el.style.height = h + 'px'; el.style.transform = `translate(${CROP.x}px,${CROP.y}px)`;
}
function zoomCrop(z) { if (!CROP.img) return; const cx = (CROP.W / 2 - CROP.x) / CROP.s, cy = (CROP.H / 2 - CROP.y) / CROP.s; CROP.zoom = z; CROP.s = CROP.s0 * z; CROP.x = CROP.W / 2 - cx * CROP.s; CROP.y = CROP.H / 2 - cy * CROP.s; drawCrop(); }
function closeCrop() { $('#crop').hidden = true; $('#crop-img').removeAttribute('src'); CROP.img = null; CROP.drag = null; unlockScroll(); }
function finishCrop() {
  if (!CROP.img) return; const c = document.createElement('canvas'); c.width = 800; c.height = 600;
  c.getContext('2d').drawImage(CROP.img, -CROP.x / CROP.s, -CROP.y / CROP.s, CROP.W / CROP.s, CROP.H / CROP.s, 0, 0, 800, 600);
  sheetState.photo = c.toDataURL('image/jpeg', .8); closeCrop(); updatePrev();
}
function readImageFile(f) {
  if (!f || !/^image\//.test(f.type)) { toast("Ce fichier n'est pas une image."); return; }
  const rd = new FileReader(); rd.onload = () => openCrop(rd.result); rd.onerror = () => toast('Image illisible. Formats conseillés : JPEG ou PNG.'); rd.readAsDataURL(f);
}
(() => {
  const fr = document.getElementById('crop-frame');
  fr.addEventListener('pointerdown', e => { if (!CROP.img) return; fr.setPointerCapture(e.pointerId); CROP.drag = { px: e.clientX, py: e.clientY, x: CROP.x, y: CROP.y }; });
  fr.addEventListener('pointermove', e => { if (!CROP.drag) return; CROP.x = CROP.drag.x + e.clientX - CROP.drag.px; CROP.y = CROP.drag.y + e.clientY - CROP.drag.py; drawCrop(); });
  ['pointerup', 'pointercancel'].forEach(t => fr.addEventListener(t, () => CROP.drag = null));
  fr.addEventListener('wheel', e => { if (!CROP.img) return; e.preventDefault(); const z = Math.min(3, Math.max(1, CROP.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))); $('#crop-zoom').value = z; zoomCrop(z); }, { passive: false });
  const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  const formOpen = () => sheetState && sheetState.type === 'form';
  let depth = 0;
  document.addEventListener('dragenter', e => { if (!hasFiles(e)) return; depth++; if (formOpen()) { const b = $('#photo-box'); if (b) b.classList.add('drag'); } });
  document.addEventListener('dragleave', e => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) { const b = $('#photo-box'); if (b) b.classList.remove('drag'); } });
  document.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
  document.addEventListener('drop', e => {
    if (!hasFiles(e)) return; e.preventDefault(); depth = 0;
    const b = $('#photo-box'); if (b) b.classList.remove('drag');
    if (formOpen()) readImageFile([...e.dataTransfer.files].find(f => /^image\//.test(f.type)) || e.dataTransfer.files[0]);
  });
})();

/* ---------- note en demi-étoiles, au glisser ---------- */
const RATE = { el: null, hover: null };
function rateVal(el, x) { const r = el.getBoundingClientRect(); const p = Math.min(Math.max(x - r.left, 0), r.width) / r.width; return Math.max(.5, Math.ceil(p * 10) / 2); }
function paintRate(el, v) {
  el.querySelector('.r-fg').style.width = (v / 5 * 100) + '%';
  const l = el.parentElement.querySelector('.rate-l'); if (l) l.textContent = v ? fmtRating(v) + '/5' : 'Pas encore noté';
}
function commitRate(id, v) {
  if (v) S.ratings[id] = v; else delete S.ratings[id];
  save(); openDetail(id, true);
}
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.rate-stars'); if (!el || e.button > 0) return;
  e.preventDefault(); el.setPointerCapture(e.pointerId); el.focus({ preventScroll: true });
  RATE.el = el; RATE.v = rateVal(el, e.clientX); paintRate(el, RATE.v);
});
document.addEventListener('pointermove', e => {
  if (RATE.el) { RATE.v = rateVal(RATE.el, e.clientX); paintRate(RATE.el, RATE.v); return; }
  if (e.pointerType !== 'mouse') return;
  const el = e.target.closest('.rate-stars');
  if (el) { RATE.hover = el; paintRate(el, rateVal(el, e.clientX)); }
  else if (RATE.hover) { paintRate(RATE.hover, +RATE.hover.dataset.v || 0); RATE.hover = null; }
});
document.addEventListener('pointerup', () => { if (!RATE.el) return; const el = RATE.el, v = RATE.v; RATE.el = null; RATE.hover = null; commitRate(el.dataset.id, v); });
document.addEventListener('pointercancel', () => { if (RATE.el) { paintRate(RATE.el, +RATE.el.dataset.v || 0); RATE.el = null; } });

/* ---------- enregistrement d'une recette ---------- */
function makeId(name, taken) { const base = norm(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ing'; let id = base, i = 2; while (taken[id]) id = base + '-' + (i++); return id; }
function parsePlace(v) { const [fam, sub] = String(v || 'Mes ingrédients|').split('|'); return { fam: FAM_IDS.includes(fam) ? fam : 'Mes ingrédients', sub: sub || '' }; }
/* Lit les lignes d'ingrédients d'un formulaire (recette ou préparation) : renvoie les ingrédients, les nouveaux ingrédients à créer et les erreurs. */
function readIngRows(sh) {
  const errs = [];
  const newIngs = {}, taken = Object.assign({}, S.ings), rows = [], unknown = [];
  const resolve = n => { const id = findIng(n); if (id) return id; const k = norm(n); return newIngs[k] ? newIngs[k].id : null; };
  sh.querySelectorAll('.frow').forEach(frw => {
    const n = frw.querySelector('.f-ing').value.trim(); if (!n) return;
    let id = resolve(n);
    if (!id) {
      id = makeId(n, taken); taken[id] = 1;
      const abv = parseFloat(String(frw.querySelector('.f-abv').value).replace(',', '.'));
      newIngs[norm(n)] = { id, data: Object.assign({ name: n, cat: frw.querySelector('.f-cat').value.trim() || n, abv: isFinite(abv) ? Math.min(100, Math.max(0, abv)) : 0, custom: true }, parsePlace(frw.querySelector('.f-fam').value)) };
    }
    rows.push({ frw, id });
  });
  const ings = rows.map(({ frw, id }) => {
    const alts = [...frw.querySelectorAll('.alt-row')].map(ar => {
      const nm = ar.querySelector('.f-aid').value.trim(); if (!nm) return null;
      const aid = findIng(nm); if (!aid) { unknown.push(nm); return null; } if (aid === id) return null;
      const aq = parseFloat(String(ar.querySelector('.f-aq').value).replace(',', '.')), au = ar.querySelector('.f-au').value;
      if (!(aq > 0)) return aid;
      const aus = au === 'oz' || au === 'cup';
      return { id: aid, qty: aus ? usToMl(aq, au) : aq, unit: aus ? 'ml' : au };
    }).filter(Boolean);
    const q = parseFloat(String(frw.querySelector('.f-qty').value).replace(',', '.')), unit = frw.querySelector('.f-unit').value;
    const us = unit === 'oz' || unit === 'cup', okq = isFinite(q) && q > 0;
    const q2 = parseFloat(String(frw.querySelector('.f-qty2').value).replace(',', '.')), q2ok = okq && unit !== 'à compléter' && isFinite(q2) && q2 > q;
    if (frw.querySelector('.f-qty2').value.trim() && !q2ok && okq && unit !== 'à compléter') errs.push(`« ${frw.querySelector('.f-ing').value.trim()} » : la quantité maximale doit être supérieure à la quantité.`);
    const tip = frw.querySelector('.f-tip').value.trim().replace(/\s+/g, ' ');
    return Object.assign({ id, qty: unit === 'à compléter' ? 0 : (okq ? (us ? usToMl(q, unit) : q) : 0), unit: us ? 'ml' : unit, sub: frw.querySelector('.f-sub').checked, opt: frw.querySelector('.f-opt').checked, alts: alts.filter((a, i) => alts.findIndex(b => altId(b) === altId(a)) === i) }, q2ok ? { qty2: us ? usToMl(q2, unit) : q2 } : {}, tip ? { tip } : {});
  });
  if (!ings.length) errs.push('Au moins un ingrédient est requis.');
  if (ings.some(i => !i.qty && i.unit !== 'à compléter')) errs.push('Chaque ingrédient doit avoir une quantité, ou l’unité « à compléter ».');
  if (unknown.length) errs.push(`Remplaçants inconnus : ${unknown.join(', ')}. Ils doivent être choisis dans la liste des ingrédients (ou créés d'abord comme ingrédient de la recette ou dans Mon bar).`);
  return { ings, newIngs, errs };
}
function saveForm() {
  const sh = $('#sheet'), g = x => sh.querySelector('#' + x), errs = [];
  const name = g('rf-name').value.trim(); if (!name) errs.push('Le nom du cocktail est requis.');
  const R = readIngRows(sh); errs.push(...R.errs); const ings = R.ings, newIngs = R.newIngs;
  const url = g('rf-url').value.trim();
  if (url && !/^https?:\/\//i.test(url)) errs.push('Le lien doit commencer par http:// ou https://.');
  let parent = ''; const pTxt = g('rf-parent').value.trim();
  if (pTxt) { parent = (sheetState.pmap && sheetState.pmap.get(norm(pTxt))) || ''; if (!parent) errs.push('« Variante de » : aucune recette de l\'appli ne porte ce nom. Choisir une recette dans la liste, ou effacer le champ.'); }
  let batch = null;
  if (g('rf-batch').value === 'volume') {
    const q = parseFloat(String(g('rf-batch-qty').value).replace(',', '.')), ml = q * ({ L: 1000, cl: 10, ml: 1 }[g('rf-batch-unit').value] || 1);
    if (!(ml >= 10)) errs.push('Indiquer le volume obtenu, par exemple 2 L.'); else batch = { ml: Math.round(ml) };
  }
  const e = g('rf-err');
  if (errs.length) { e.textContent = errs.join('\n'); e.hidden = false; e.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  Object.values(newIngs).forEach(({ id, data }) => S.ings[id] = data);
  const tags = [...new Set(g('rf-tags').value.split(',').map(s => s.trim()).filter(Boolean))];
  const flavor = {}; TASTE.forEach(([k]) => flavor[k] = g('uk-' + k).checked ? null : +g('rf-' + k).value);
  const old = sheetState.id && S.recipes.find(r => r.id === sheetState.id);
  const orig = g('rf-origin').value === 'Classique' ? 'Classique' : 'Original', by = orig === 'Original' ? ((sh.querySelector('input[name=rf-by]:checked') || {}).value || 'me') : '';
  const srcTxt = g('rf-author').value.trim();
  const rec = Object.assign({}, old || {}, {
    id: old ? old.id : 'r-' + Date.now().toString(36), name, origin: orig, by, author: by === 'other' ? srcTxt : '', source: orig === 'Classique' ? srcTxt : '', url,
    method: g('rf-method').value, glass: g('rf-glass').value, garn: currentGarn(), garnish: g('rf-garnish').value.trim(), rim: g('rf-rim').value,
    color: okColor(g('rf-color').value), photo: sheetState.photo || '', flavor, tags, ings, parent,
    steps: g('rf-steps').value.split('\n').map(s => s.trim()).filter(Boolean), note: g('rf-note').value.trim(), created: old ? old.created : Date.now()
  });
  if (batch) rec.batch = batch; else delete rec.batch;
  { const sub = g('rf-sub').value.trim(); if (sub) rec.subtitle = sub; else delete rec.subtitle; }
  { const lv = g('rf-level').value; if (lv === 'easy') rec.easy = true; else if (lv === 'hard') rec.easy = false; else delete rec.easy; }
  if (old && old.photo !== rec.photo) delete rec.photoCredit; // le crédit appartient à l'ancienne photo
  if (old && old.src === 'builtin') { rec.src = 'builtin'; rec.edited = true; }
  if (old) S.recipes[S.recipes.indexOf(old)] = rec; else S.recipes.push(rec);
  save(); toast(old ? 'Recette mise à jour' : 'Recette ajoutée au catalogue');
  if (old) history.back(); else { render(); restoring = true; openDetail(rec.id); restoring = false; replaceNav(); }
}

/* ---------- nouvelle liste créée depuis une fiche recette ---------- */
function newListFromRecipe(id) {
  const inp = $('#nl-detail'), n = inp ? inp.value.trim().replace(/\s+/g, ' ') : '';
  if (!n) { if (inp) inp.focus(); return; }
  let l = S.lists.find(x => norm(x.name) === norm(n)), created = false;
  if (!l) { l = { id: 'l-' + Date.now().toString(36), name: n, fixed: false, items: [] }; S.lists.push(l); created = true; }
  if (!l.items.includes(id)) l.items.push(id);
  UI.newList = null; save(); toast(created ? `Liste « ${l.name} » créée, recette ajoutée` : `Ajoutée à « ${l.name} »`); openDetail(id, true);
}

/* ---------- événements ---------- */
document.addEventListener('click', async e => {
  if (e.target.id === 'pick') { closePick(); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, id = b.dataset.id;
  if (!['del', 'del-list', 'import', 'reset', 'coll-del', 'prep-del', 'shop-clear'].includes(a)) UI.confirm = null;
  switch (a) {
    case 'view': navView(b.dataset.v); break;
    case 'new': openForm(null); break;
    case 'open': openDetail(id, false, sheetState && sheetState.type === 'coll' ? sheetState.id : null); break;
    case 'close': closeSheet(); break;
    case 'back': goBack(); break;
    case 'back-detail': history.back(); break;
    case 'edit': openForm(id); break;
    case 'avail': UI.avail = b.dataset.v; renderCatalogue($('#view')); break;
    case 'toggle-filters': UI.filtersOpen = !UI.filtersOpen; { const f = $('.filters'); if (f) f.classList.toggle('closed', !UI.filtersOpen); const t = $('.btn-filters'); if (t) t.setAttribute('aria-expanded', UI.filtersOpen); } break;
    case 'clear-filters': UI.f = F_DEFAULT(); renderCatalogue($('#view')); break;
    case 'clear-all': UI.f = F_DEFAULT(); UI.q = ''; UI.avail = 'all'; renderCatalogue($('#view')); break;
    case 'late-ok': UI.lateOk = true; render(); break;
    case 'go-cat': UI.f = F_DEFAULT(); UI.q = ''; UI.avail = b.dataset.v; navView('catalogue'); break;
    case 'go-base': UI.f = F_DEFAULT(); UI.f.base = b.dataset.v; UI.q = ''; UI.avail = 'all'; navView('catalogue'); break;
    case 'go-tag': UI.f = F_DEFAULT(); UI.f.tag = b.dataset.v; UI.q = ''; UI.avail = 'all'; navView('catalogue'); break;
    case 'f-ing-add': addFilterIng(); break;
    case 'f-ing-rm': UI.f.ings = UI.f.ings.filter(x => x !== id); renderCatalogue($('#view')); break;
    case 'f-ing-mode': UI.f.ingMode = b.dataset.v; renderCatalogue($('#view')); break;
    case 'go-ing': UI.f = F_DEFAULT(); UI.q = ''; UI.avail = 'all'; UI.filtersOpen = true; navView('catalogue'); setTimeout(() => { const i = $('#f-ing-i'); if (i) { i.scrollIntoView({ block: 'center' }); i.focus(); } }, 50); break;
    case 'ing-search': { /* on empile une entrée d'historique : « retour » ramène à la fiche d'où l'on vient */
      /* La fiche garde en mémoire les filtres d'avant ; l'entrée ajoutée porte ceux de l'ingrédient. Le retour les remet tels quels (cf. popstate). */
      const snap = () => ({ f: structuredClone(UI.f), q: UI.q, avail: UI.avail });
      if (history.state && history.state.z) { const first = !UI.filtBase; if (first) UI.filtBase = snap(); history.replaceState({ ...history.state, filt: snap(), ...(first ? { filtFirst: true } : {}) }, ''); }
      UI.f = F_DEFAULT(); UI.f.ings = [id]; UI.q = ''; UI.avail = 'all'; closeSheetRaw(); UI.view = 'catalogue'; render(); window.scrollTo(0, 0);
      history.pushState({ ...navState(1), ing: true, filt: snap() }, ''); break; }
    case 'go-na': UI.f = F_DEFAULT(); UI.f.alc = 'na'; UI.q = ''; UI.avail = 'all'; navView('catalogue'); break;
    case 'go-easy': UI.f = F_DEFAULT(); UI.f.level = 'easy'; UI.q = ''; UI.avail = 'all'; navView('catalogue'); break;
    case 'go-colls': UI.listTab = 'coll'; navView('lists'); break;
    case 'by-tag': UI.f = F_DEFAULT(); UI.f.tag = b.dataset.v; UI.filtersOpen = true; UI.q = ''; UI.avail = 'all'; closeSheetRaw(); { const fromHome = !history.state || history.state.view === 'home'; UI.view = 'catalogue'; render(); if (fromHome) replaceNav(); else replaceNav(); } break;
    case 'dismiss-example': S.example = false; save(); render(); break;
    case 'rate-clear': commitRate(id, 0); break;
    case 'tog-list': { const l = S.lists.find(x => x.id === b.dataset.list); if (!l) break; l.items = l.items.includes(id) ? l.items.filter(x => x !== id) : [...l.items, id]; save(); openDetail(id, true); break; }
    case 'note-vis': { flushNote(); const cur = S.notes[id] || { text: '', at: Date.now() }; S.notes[id] = Object.assign({}, cur, { pub: b.dataset.v === '1' }); save(); openDetail(id, true); break; }
    case 'unit': S.unit = b.dataset.v; save(); openDetail(sheetState.id, true); break;
    case 'serv': { const r = S.recipes.find(x => x.id === sheetState.id), c = servCfg(r); UI.serv[r.id] = clampServ(c, servAmt(r) + (+b.dataset.v) * c.step); openDetail(r.id, true); break; }
    case 'serv-set': { const rid = sheetState.id; UI.serv[rid] = +b.dataset.v; openDetail(rid, true); break; }
    case 'pserv': { const p = S.preps.find(x => x.id === sheetState.id), c = servCfg(p); UI.serv[p.id] = clampServ(c, servAmt(p) + (+b.dataset.v) * c.step); openPrep(p.id, true); break; }
    case 'pserv-set': { const pid = sheetState.id; UI.serv[pid] = +b.dataset.v; openPrep(pid, true); break; }
    case 'go-shop': goShop(); break;
    case 'shop-add': {
      const r = S.recipes.find(x => x.id === id); if (!r) break;
      const had = !!shopIn(id); shopSet(r, servAmt(r)); save(); toast(had ? 'Liste de courses mise à jour' : 'Ajouté à la liste de courses'); openDetail(id, true); break;
    }
    case 'shop-rm': { shopRemove(id); if (sheetState && sheetState.type === 'detail') openDetail(sheetState.id, true); else refreshShop(); break; }
    case 'shop-list': {
      const l = S.lists.find(x => x.id === b.dataset.list); if (!l) break;
      const n = shopAddMany(l.items.map(i => S.recipes.find(r => r.id === i)).filter(Boolean));
      toast(n ? `${n} ${plural(n, 'recette')} ${plural(n, 'ajoutée')} à la liste de courses` : 'Déjà dans la liste de courses'); goShop(); break;
    }
    case 'shop-coll': {
      const c = findColl(id); if (!c) break;
      const n = shopAddMany(collRecipes(c));
      toast(n ? `${n} ${plural(n, 'recette')} ${plural(n, 'ajoutée')} à la liste de courses` : 'Déjà dans la liste de courses'); goShop(); break;
    }
    case 'shop-add-name': shopAddByName(); break;
    case 'shop-all': { const n = +b.dataset.v; S.shop.recs.forEach(e => { const r = S.recipes.find(x => x.id === e.id); if (r && !batchBase(r)) e.amt = n; }); save(); refreshShop(); break; }
    case 'shop-serv': { const r = S.recipes.find(x => x.id === id), e = shopIn(id); if (!r || !e) break; const c = servCfg(r); e.amt = clampServ(c, e.amt + (+b.dataset.v) * c.step); save(); refreshShop(); break; }
    case 'shop-clear':
      if (UI.confirm === 'shop-clear') { S.shop.recs = []; UI.confirm = null; save(); toast('Liste de courses vidée'); }
      else UI.confirm = 'shop-clear';
      refreshShop(); break;
    case 'shop-copy': {
      const items = shopRecs(); if (!items.length) { toast('La liste de courses est vide'); break; }
      const tot = shopTotals(items.map(o => o.r), r => shopIn(r.id).amt / servCfg(r).base), need = [...tot].filter(([, e]) => e.st === 'miss').sort((x, y) => ingName(x[0]).localeCompare(ingName(y[0]), 'fr'));
      if (!need.length) { toast('Rien à acheter : tout est dans le bar'); break; }
      const txt = `Liste de courses\nPour : ${items.map(o => shopAmtTxt(o.r, o.x.amt)).join(', ')}\n` + need.map(([iid, e]) => `- ${ingName(iid)} : ${shopQty(e)}`).join('\n');
      try { navigator.clipboard.writeText(txt).then(() => toast('Liste copiée'), () => toast('Copie refusée par le navigateur')); } catch (err) { toast('Copie refusée par le navigateur'); }
      break; }
    case 'new-list-open': UI.newList = id; openDetail(id, true); break;
    case 'new-list-cancel': UI.newList = null; openDetail(id, true); break;
    case 'new-list-ok': newListFromRecipe(id); break;
    case 'bar-tab': UI.barTab = b.dataset.v; renderBar($('#view')); break;
    case 'ing-info': openIngInfo(id); break;
    case 'own-tog': S.owned = S.owned.includes(id) ? S.owned.filter(x => x !== id) : [...S.owned, id]; save(); openIngInfo(id, true); break;
    case 'open-prep': openPrep(id); break;
    case 'prep-new': openPrepForm(null); break;
    case 'prep-edit': openPrepForm(id); break;
    case 'prep-save': savePrep(); break;
    case 'prep-del':
      if (UI.confirm === 'pdel:' + id) {
        const p = S.preps.find(x => x.id === id);
        if (p && (p.src === 'builtin' || PREPS.some(x => x.id === id)) && !S.prepsRemoved.includes(id)) S.prepsRemoved.push(id);
        S.preps = S.preps.filter(x => x.id !== id); delete UI.serv[id];
        save(); closeSheet(); toast('Préparation supprimée');
      } else { UI.confirm = 'pdel:' + id; openPrep(id, true); }
      break;
    case 'del':
      if (UI.confirm === 'del:' + id) {
        const r = S.recipes.find(x => x.id === id);
        if (r && (r.src === 'builtin' || BUILTIN.has(id)) && !S.removed.includes(id)) S.removed.push(id);
        S.recipes = S.recipes.filter(x => x.id !== id); S.recipes.forEach(x => { if (x.parent === id) x.parent = ''; }); S.lists.forEach(l => l.items = l.items.filter(x => x !== id)); delete S.ratings[id]; delete S.notes[id]; S.shop.recs = S.shop.recs.filter(x => x.id !== id);
        save(); closeSheet(); toast('Recette supprimée');
      } else { UI.confirm = 'del:' + id; openDetail(id, true); }
      break;
    case 'row-add': { $('#frows').insertAdjacentHTML('beforeend', rowHTML(null)); $('#frows').lastElementChild.querySelector('.f-ing').focus(); break; }
    case 'alt-add': { const l = b.closest('.frow-alts').querySelector('.alt-list'); l.insertAdjacentHTML('beforeend', altRowHTML(null)); l.lastElementChild.querySelector('.f-aid').focus(); break; }
    case 'alt-del': b.closest('.alt-row').remove(); break;
    case 'row-del': b.closest('.frow').remove(); break;
    case 'tag-sugg': {
      const inp = $('#rf-tags'), t = b.dataset.v; let tags = inp.value.split(',').map(s => s.trim()).filter(Boolean);
      tags = tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]; inp.value = tags.join(', '); b.classList.toggle('on', tags.includes(t)); break;
    }
    case 'photo-pick': $('#rf-photo').click(); break;
    case 'photo-crop': if (sheetState && sheetState.photo) openCrop(sheetState.photo); break;
    case 'photo-del': sheetState.photo = ''; $('#rf-photo').value = ''; updatePrev(); break;
    case 'crop-ok': finishCrop(); break;
    case 'crop-cancel': closeCrop(); break;
    case 'csel': openPick(b); break;
    case 'pick-opt': { const cb = PICK.b; if (!cb) { closePick(); break; } const sel = cb.previousElementSibling; sel.selectedIndex = +b.dataset.i; closePick(); syncCsel(cb); sel.dispatchEvent(new Event('change', { bubbles: true })); break; }
    case 'swatch': setColor(b.dataset.v, true); break;
    case 'pick-chip': $('#' + b.dataset.for).value = b.dataset.v; pickIn(b.parentElement, b, '.chip'); if (b.dataset.for === 'rf-rim') updatePrev(); break;
    case 'pick-glass': $('#rf-glass').value = b.dataset.v; pickIn(b.parentElement, b, '.gt'); updatePrev(); break;
    case 'pick-garn': $('#rf-gcut').value = b.dataset.v; pickIn(b.parentElement, b, '.gt'); $('#gfruits').hidden = !CUT_KEYS.includes(b.dataset.v); updatePrev(); break;
    case 'pick-gfruit': $('#rf-gfruit').value = b.dataset.v; pickIn(b.parentElement, b, '.chip'); updatePrev(); break;
    case 'form-save': saveForm(); break;
    case 'orig': $('#rf-origin').value = b.dataset.v; pickIn(b.parentElement, b, 'button'); syncOrig(); break;
    case 'level-set': $('#rf-level').value = b.dataset.v; pickIn(b.parentElement, b, 'button'); break;
    case 'batch-mode': $('#rf-batch').value = b.dataset.v; pickIn(b.parentElement, b, 'button'); $('#batch-vol').hidden = b.dataset.v !== 'volume'; if (b.dataset.v === 'volume') $('#rf-batch-qty').focus(); break;
    case 'own-add': if (!S.owned.includes(id)) S.owned.push(id); save(); renderBarTop(); renderBarList(); toast(`${ingName(id)} ajouté au bar`); break;
    case 'add-ing': {
      const n = $('#ni-name').value.trim(), err = $('#ni-err');
      if (!n) { err.textContent = 'Le nom de l\'ingrédient est requis.'; err.hidden = false; break; }
      if (findIng(n)) { err.textContent = 'Cet ingrédient existe déjà dans la liste.'; err.hidden = false; break; }
      const abv = parseFloat(String($('#ni-abv').value).replace(',', '.')), place = parsePlace($('#ni-place').value);
      const nid = makeId(n, S.ings); S.ings[nid] = Object.assign({ name: n, cat: $('#ni-cat').value.trim() || n, abv: isFinite(abv) ? Math.min(100, Math.max(0, abv)) : 0, custom: true }, place);
      S.owned.push(nid); UI.open.add('f:' + place.fam); if (place.sub) UI.open.add('s:' + place.fam + '|' + place.sub);
      save(); renderBar($('#view')); toast(`${n} ajouté et coché`); break;
    }
    case 'list-tab': UI.listTab = b.dataset.v; renderLists($('#view')); break;
    case 'open-coll': openCollection(id); break;
    case 'coll-new': openCollEditor(null); break;
    case 'coll-edit': openCollEditor(id); break;
    case 'coll-del':
      if (UI.confirm === 'cdel:' + id) { S.collections = S.collections.filter(c => c.id !== id); UI.confirm = null; save(); closeSheet(); toast('Collection supprimée'); }
      else { UI.confirm = 'cdel:' + id; openCollection(id, true); }
      break;
    case 'ed-cancel': history.back(); break;
    case 'ed-save': saveCollEditor(); break;
    case 'ed-new': sheetState.draft.blocks.push(b.dataset.v === 'recipes' ? { type: 'recipes', title: '', ids: [], cols: 3 } : { type: b.dataset.v, title: '', text: '' }); renderCollEditor(); break;
    case 'ed-del': sheetState.draft.blocks.splice(+b.dataset.bk, 1); renderCollEditor(); break;
    case 'ed-up': case 'ed-down': { const bl = sheetState.draft.blocks, i = +b.dataset.bk, j = a === 'ed-up' ? i - 1 : i + 1; if (j < 0 || j >= bl.length) break; [bl[i], bl[j]] = [bl[j], bl[i]]; renderCollEditor(); break; }
    case 'ed-cols': sheetState.draft.blocks[+b.dataset.bk].cols = +b.dataset.v; renderCollEditor(); break;
    case 'ed-rm': sheetState.draft.blocks[+b.dataset.bk].ids.splice(+b.dataset.k, 1); renderCollEditor(); break;
    case 'ed-add': edAddRecipe(+b.dataset.bk); break;
    case 'ed-export': {
      const txt = JSON.stringify(sheetState.draft, null, 2);
      try { navigator.clipboard.writeText(txt).then(() => toast('Code de la collection copié'), () => toast('Copie refusée par le navigateur')); } catch (err) { toast('Copie refusée par le navigateur'); }
      break;
    }
    case 'save-coll': {
      const c = findColl(id); if (!c) break;
      const items = collRecipes(c).map(r => r.id), ex = S.lists.find(l => l.from === id);
      if (ex) ex.items = items; else S.lists.push({ id: 'l-' + Date.now().toString(36), name: c.name, fixed: false, from: id, items });
      save(); toast(ex ? 'Copie mise à jour' : `« ${c.name} » ajoutée aux listes`); openCollection(id, true); break;
    }
    case 'add-list': {
      const n = $('#nl-name').value.trim(); if (!n) { $('#nl-name').focus(); break; }
      S.lists.push({ id: 'l-' + Date.now().toString(36), name: n, fixed: false, items: [] }); save(); renderLists($('#view')); toast(`Liste « ${n} » créée`); break;
    }
    case 'del-list': {
      const lid = b.dataset.list;
      if (UI.confirm === 'list:' + lid) { S.lists = S.lists.filter(l => l.id !== lid); UI.confirm = null; save(); toast('Liste supprimée'); }
      else UI.confirm = 'list:' + lid;
      renderLists($('#view')); break;
    }
    case 'dl-exp': {
      const blob = new Blob([JSON.stringify(S)], { type: 'application/json' }), l = document.createElement('a');
      l.href = URL.createObjectURL(blob); l.download = `zeste-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(l); l.click(); setTimeout(() => { URL.revokeObjectURL(l.href); l.remove(); }, 2000);
      toast('Sauvegarde téléchargée'); break;
    }
    case 'copy-exp': {
      try { navigator.clipboard.writeText(JSON.stringify(S)).then(() => toast('Sauvegarde copiée en texte'), () => toast('Copie refusée par le navigateur : utilise plutôt le téléchargement')); }
      catch (err) { toast('Copie refusée par le navigateur : utilise plutôt le téléchargement'); }
      break;
    }
    case 'imp-pick': $('#imp-file').click(); break;
    case 'install': { if (!deferredInstall) break; const ev = deferredInstall; deferredInstall = null; ev.prompt(); try { await ev.userChoice; } catch (err) { } render(); break; }
    case 'install-later': S.installDismissed = true; save(); render(); break;
    case 'apply-update': if (swReg && swReg.waiting) swReg.waiting.postMessage({ type: 'SKIP_WAITING' }); else location.reload(); break;
    case 'import': {
      const txt = ($('#imp-text').value.trim() || UI.impText || '').trim(), er = $('#imp-err');
      if (!txt) { er.textContent = 'Aucune sauvegarde : choisir un fichier ou coller un texte.'; er.hidden = false; UI.confirm = null; break; }
      let d; try { d = JSON.parse(txt); } catch (x) { er.textContent = 'Ce texte n\'est pas une sauvegarde lisible (JSON invalide).'; er.hidden = false; UI.confirm = null; break; }
      if (!validData(d)) { er.textContent = 'Format non reconnu : il faut une sauvegarde de Zeste.'; er.hidden = false; UI.confirm = null; break; }
      if (UI.confirm !== 'import') { UI.confirm = 'import'; b.textContent = 'Confirmer : remplacer les données'; break; }
      S = upgrade(Object.assign({ unit: 'ml', ratings: {}, notes: {}, owned: [], lists: [{ id: 'fav', name: 'Favoris', fixed: true, items: [] }, { id: 'try', name: 'À essayer', fixed: true, items: [] }] }, d, { example: false }));
      UI.confirm = null; UI.impText = ''; UI.impName = ''; flushSave(); render(); toast(`${S.recipes.length} recettes restaurées`); break;
    }
    case 'reset':
      if (UI.confirm === 'reset') { S = seed(); UI.confirm = null; save(); UI.view = 'catalogue'; render(); toast('Exemple rechargé'); }
      else { UI.confirm = 'reset'; renderData($('#view')); }
      break;
  }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'my-note') { autosize(t); const id = t.dataset.id, cur = S.notes[id] || { pub: false }; S.notes[id] = { text: t.value, pub: !!cur.pub, at: Date.now() }; if (!t.value.trim() && !cur.pub) delete S.notes[id]; clearTimeout(noteT); noteT = setTimeout(() => { noteT = null; save(); const h = $('#note-st'); if (h) h.textContent = noteHint(S.notes[id]); }, 500); return; }
  if (t.dataset.f && sheetState && sheetState.type === 'colled') { const d = sheetState.draft; if (t.dataset.bk != null) d.blocks[+t.dataset.bk][t.dataset.f] = t.value; else d[t.dataset.f] = t.value; return; }
  if (t.id === 'crop-zoom') { zoomCrop(+t.value); return; }
  if (t.classList.contains('cr')) { paintHSL(); setColor(hslToHex(+$('#cc-h').value, +$('#cc-s').value, +$('#cc-l').value), false); return; }
  if (t.classList.contains('dr')) {
    const k = t.dataset.k, row = t.closest('.tf-row'), [lo, hi] = row.querySelectorAll('.dr');
    let a = +lo.value, b = +hi.value;
    if (a > b) { if (t.dataset.e === '0') { b = a; hi.value = b; } else { a = b; lo.value = a; } }
    UI.f.tf[k] = [a, b];
    row.querySelector('.dual').style.setProperty('--a', a); row.querySelector('.dual').style.setProperty('--b', b);
    row.querySelector('.tv').textContent = tfText([a, b]); row.classList.toggle('active', tfActive([a, b]));
    refreshFilterBadge(); renderResults(); return;
  }
  if (t.id === 'cf-q') { UI.q = t.value; renderResults(); return; }
  if (t.id === 'bar-q') { UI.barQ = t.value; renderBarList(); return; }
  if (t.classList.contains('f-ing')) { checkNew(t.closest('.frow')); return; }
  if (t.id && t.id.startsWith('rf-') && t.type === 'range') { const k = t.id.slice(3); $('#ro-' + k).textContent = t.value; const u = $('#uk-' + k); if (u && u.checked) { u.checked = false; $('#sl-' + k).classList.remove('unk'); } }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.name === 'rf-by') { syncOrig(); return; }
  if (t.classList.contains('uk')) { const k = t.dataset.k; $('#sl-' + k).classList.toggle('unk', t.checked); $('#ro-' + k).textContent = t.checked ? '—' : $('#rf-' + k).value; return; }
  if (t.dataset.own) { const id = t.dataset.own; S.owned = t.checked ? [...new Set([...S.owned, id])] : S.owned.filter(x => x !== id); save(); renderBarTop(); updateAccCounts(t); return; }
  switch (t.id) {
    case 'cf-method': UI.f.method = t.value; refreshFilterBadge(); renderResults(); break;
    case 'cf-glass': UI.f.glass = t.value; refreshFilterBadge(); renderResults(); break;
    case 'cf-tag': UI.f.tag = t.value; refreshFilterBadge(); renderResults(); break;
    case 'cf-origin': UI.f.origin = t.value; refreshFilterBadge(); renderResults(); break;
    case 'cf-alc': UI.f.alc = t.value; refreshFilterBadge(); renderResults(); break;
    case 'cf-base': UI.f.base = t.value; refreshFilterBadge(); renderResults(); break;
    case 'cf-level': UI.f.level = t.value; refreshFilterBadge(); renderResults(); break;
    case 'cf-sort': UI.sort = t.value; renderResults(); break;
    case 'rf-photo': { const f = t.files && t.files[0]; if (f) readImageFile(f); t.value = ''; break; }
    case 'imp-file': {
      const f = t.files && t.files[0]; if (!f) break;
      const rd = new FileReader(); rd.onload = () => { UI.impText = rd.result; UI.impName = f.name; const n = $('#imp-name'); if (n) n.textContent = 'Fichier prêt : ' + f.name; toast('Fichier chargé, prêt à restaurer'); }; rd.readAsText(f); t.value = ''; break;
    }
  }
});
document.addEventListener('toggle', e => { const d = e.target; if (!d.dataset) return; if (d.dataset.keep) { if (d.open) UI.keep.add(d.dataset.keep); else UI.keep.delete(d.dataset.keep); return; } if (!d.dataset.acc || UI.barQ) return; if (d.open) UI.open.add(d.dataset.acc); else UI.open.delete(d.dataset.acc); }, true);
document.addEventListener('submit', e => e.preventDefault());
document.addEventListener('keydown', e => {
  const rs = e.target.closest && e.target.closest('.rate-stars');
  if (rs) {
    const v = +rs.dataset.v || 0, m = { ArrowRight: .5, ArrowUp: .5, ArrowLeft: -.5, ArrowDown: -.5 }[e.key];
    if (m != null) { e.preventDefault(); commitRate(rs.dataset.id, Math.min(5, Math.max(0, v + m))); setTimeout(() => { const n = $('.rate-stars'); if (n) n.focus(); }, 0); return; }
    if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '0') { e.preventDefault(); commitRate(rs.dataset.id, 0); return; }
  }
  if (e.key === 'Enter' && e.target.id === 'f-ing-i') { e.preventDefault(); addFilterIng(); return; }
  if (e.key === 'Enter' && e.target.id === 'shop-add-i') { e.preventDefault(); shopAddByName(); return; }
  if (e.target.id === 'nl-detail') {
    if (e.key === 'Enter') { e.preventDefault(); newListFromRecipe(sheetState.id); return; }
    if (e.key === 'Escape') { e.preventDefault(); UI.newList = null; openDetail(sheetState.id, true); return; }
  }
  if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('ed-add-i')) { e.preventDefault(); edAddRecipe(+e.target.dataset.bk); return; }
  if (e.key === 'Escape') { if (!$('#pick').hidden) closePick(); else if (!$('#crop').hidden) closeCrop(); else if (sheetState) closeSheet(); }
});

new MutationObserver(enhanceSelects).observe(document.body, { childList: true, subtree: true });
(async () => {
  S = await load(); render(); enhanceSelects(); replaceNav();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
})();
