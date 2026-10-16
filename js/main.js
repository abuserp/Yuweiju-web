if (typeof Sfx === 'undefined') {
  window.Sfx = {
    SFX: {}, play() {}, loop() {}, stopAll() {}, unlock() {},
    mute() { return true; }, isMuted() { return true; }, todo() { return []; }
  };
  console.warn('[余味居] 没找到 js/audio.js，本局静音运行。检查 index.html 里的 script 顺序。');
}
if (typeof Bgm === 'undefined') {
  window.Bgm = { TRACKS: {}, play() {}, stop() {}, duck() {}, current() { return null; }, todo() { return []; } };
}

function fatal(msg, detail) {
  try {
    let bar = document.getElementById('fatal-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'fatal-bar';
      bar.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:9999;' +
        'background:#7a1f14;color:#ffe6df;font:13px/1.6 system-ui,sans-serif;' +
        'padding:10px 14px;white-space:pre-wrap;';
      document.body.insertBefore(bar, document.body.firstChild);
    }
    bar.textContent = msg + (detail ? '\n' + detail : '');
  } catch (e) {}
  console.error('[余味居]', msg, detail || '');
}

window.addEventListener('error', e => {
  if (!e.message || e.message.indexOf('Script error') >= 0) {
    fatal('有脚本报错，但 file:// 下浏览器不给细节。',
          '按 F12 打开控制台看那行红字；或者用本地服务器打开（见下面说明）。');
    return;
  }
  fatal('出错了：' + e.message,
        (e.filename || '').split('/').pop() + ' 第 ' + e.lineno + ' 行');
});

function safe(label, fn) {
  return function () {
    try { return fn.apply(this, arguments); }
    catch (err) {
      fatal('［' + label + '］' + (err && err.message ? err.message : err),
            err && err.stack ? String(err.stack).split('\n').slice(0, 3).join('\n') : '');
      throw err;
    }
  };
}

function checkDeps() {
  const need = [
    ['GameData.TALK',       () => !!GameData.TALK,                          'js/data.js'],
    ['GameData.pickCravings', () => typeof GameData.pickCravings === 'function', 'js/data.js'],
    ['State.availableAttrs',() => typeof State.availableAttrs === 'function','js/state.js'],
    ['Assets.portraitUrl',  () => typeof Assets.portraitUrl === 'function',  'js/assets.js'],
    ['Render.setPaused',    () => typeof Render.setPaused === 'function',    'js/render.js'],
    ['Day.hitCount',        () => typeof Day.hitCount === 'function',        'js/day.js'],
    ['Night.open',          () => typeof Night.open === 'function',          'js/night.js']
  ];
  const bad = [];
  need.forEach(x => { try { if (!x[1]()) bad.push(x); } catch (e) { bad.push(x); } });
  if (!bad.length) return true;
  const files = Array.from(new Set(bad.map(x => x[2])));
  fatal('这几个文件还是旧版本，换成最新的再刷新：\n  ' + files.join('\n  '),
        '（缺少：' + bad.map(x => x[0]).join('、') + '）');
  return false;
}

const Game = (function () {
  let phase = 'title';
  let last = 0;
  const keys = { up: false, down: false, left: false, right: false };
  let stick = null;
  let paused = false;

  const el = {};

  function boot() {
    if (!checkDeps()) return;
    el.canvas = document.getElementById('stage');
    el.night = document.getElementById('night');
    el.title = document.getElementById('title');
    el.hud = document.getElementById('hud');
    el.pad = document.getElementById('pad');
    el.adv = document.getElementById('adv');
    el.modList = document.getElementById('mod-list');
    el.modMsg = document.getElementById('mod-msg');
    el.recall = document.getElementById('recall');
    el.day = document.getElementById('hud-day');
    el.clock = document.getElementById('hud-clock');
    el.money = document.getElementById('hud-money');
    el.aff = document.getElementById('hud-aff');
    el.queue = document.getElementById('hud-queue');

    Sfx.preload();
    ['pointerdown', 'keydown'].forEach(ev =>
      window.addEventListener(ev, () => {
        Sfx.unlock();
        if (Bgm.current()) Bgm.play(Bgm.current());
      }, { once: true }));

    Render.init(el.canvas);
    Night.init(el.night);
    ADV.init(el.adv);
    Mods.init(renderMods);
    if (el.recall) Recall.init(el.recall);
    bindKeys();
    bindTouch();
    bindMods();

    document.getElementById('btn-new').onclick =
      safe('新开一家', () => { State.reset(); State.save(); toNight(null); });
    const cont = document.getElementById('btn-continue');
    if (State.load()) { cont.disabled = false; cont.onclick = safe('接着上次', () => toNight(null)); }
    else { cont.disabled = true; }
    document.getElementById('btn-wipe').onclick = () => { State.clear(); location.reload(); };
    const recallBtn = document.getElementById('btn-recall');
    if (recallBtn) recallBtn.onclick = () => Recall.open();
    el.pause = document.getElementById('btn-pause') || makePauseBtn();
    if (el.pause) el.pause.onclick = safe('暂停', () => togglePause());

    document.getElementById('btn-act').onclick = safe('交互', () => { if (!paused) Day.interact(); });
    document.getElementById('btn-toss').onclick = safe('倒掉', () => { if (!paused) Day.discard(); });

    show('title');
    requestAnimationFrame(loop);
  }

  function makePauseBtn() {
    if (!el.pad) return null;
    const b = document.createElement('button');
    b.id = 'btn-pause';
    b.textContent = '暂停';
    const tip = el.pad.querySelector('.pad-tip');
    if (tip) el.pad.insertBefore(b, tip); else el.pad.appendChild(b);
    return b;
  }
  function togglePause(on) {
    if (phase !== 'day') return;
    paused = on == null ? !paused : !!on;
    Sfx.play(paused ? 'ui.pause' : 'ui.resume');
    if (paused) Sfx.stopAll();
    Bgm.duck(paused);
    Render.setPaused(paused);
    if (el.pause) el.pause.textContent = paused ? '继续' : '暂停';
  }

  function show(p) {
    phase = p;

    if (p !== 'adv') Bgm.play(p);
    el.title.hidden = p !== 'title';
    el.night.hidden = p !== 'night';
    el.adv.hidden = p !== 'adv';
    el.canvas.hidden = p !== 'day';
    el.hud.hidden = p !== 'day';
    el.pad.hidden = p !== 'day';
  }
  function toNight(stats) {

    if (stats && stats.event) {
      const ev = stats.event;
      stats.event = null;
      show('adv');

      ADV.play(ev.lines, () => {
        if (ev.count) Mods.completeVisit(ev.defId, ev.stage);
        toNight(stats);
      });
      return;
    }
    if (stats) {
      Sfx.play('shop.close');
      const C = GameData.CONFIG;
      const rent = C.rentBase + (State.s.day - 1) * C.rentGrow;
      const staple = State.stapleBill();
      stats.rent = rent;
      stats.staple = staple;
      State.s.money = Math.max(0, State.s.money - rent - staple.total);
      State.clearStaples();
      State.s.day += 1;
    }
    State.save();
    show('night');
    Night.open(stats);
  }

  function playPreview(lines) {
    show('adv');
    ADV.play(lines, () => show('title'), { preview: true });
  }

  const toDay = safe('开门营业', function () {
    Sfx.play('shop.open');
    paused = false;
    Render.setPaused(false);
    if (el.pause) el.pause.textContent = '暂停';
    Day.start();
    show('day');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function bindKeys() {
    const map = {
      KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
      KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right'
    };
    window.addEventListener('keydown', e => {
      if (map[e.code]) { keys[map[e.code]] = true; e.preventDefault(); }
      if (e.code === 'KeyM') Sfx.mute();
      if (e.code === 'KeyP') { togglePause(); e.preventDefault(); }
      if (phase === 'adv') {
        if (e.code === 'Space' || e.code === 'Enter') { ADV.advance(); e.preventDefault(); }
        return;
      }
      if (phase !== 'day') return;
      if (paused) return;
      if (e.code === 'Space' || e.code === 'KeyE') { Day.interact(); e.preventDefault(); }
      if (e.code === 'KeyQ') Day.discard();
      if (e.code === 'Escape') Day.closePanel();
      if (e.code.indexOf('Digit') === 0) {
        const n = parseInt(e.code.slice(5), 10);
        if (n >= 1 && n <= 9) Day.choose(n - 1);
      }
    });
    window.addEventListener('keyup', e => { if (map[e.code]) keys[map[e.code]] = false; });
    window.addEventListener('blur', () => {
      Object.keys(keys).forEach(k => keys[k] = false);
      stick = null;
    });
  }

  function bindTouch() {
    const cv = el.canvas;
    const toCanvas = e => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height };
    };

    cv.addEventListener('pointerdown', e => {
      if (phase !== 'day' || paused) return;
      const p = toCanvas(e);
      if (Day.d.panel) {
        const i = Render.hitPanel(p.x, p.y);
        if (i >= 0) Day.choose(i); else { Day.closePanel(); Sfx.play('ui.cancel'); }
        return;
      }
      cv.setPointerCapture(e.pointerId);
      stick = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y };
      e.preventDefault();
    });
    cv.addEventListener('pointermove', e => {
      if (!stick || e.pointerId !== stick.id) return;
      const p = toCanvas(e);
      stick.x = p.x; stick.y = p.y;
      e.preventDefault();
    });
    const drop = e => { if (stick && e.pointerId === stick.id) stick = null; };
    cv.addEventListener('pointerup', drop);
    cv.addEventListener('pointercancel', drop);
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }

  function renderMods() {
    if (!el.modList) return;
    const packs = Mods.list();
    el.modList.innerHTML = packs.map(p => {
      const tag = { builtin: '内置', fetched: '目录', user: '上传' }[p.source] || p.source;
      const n = p.specials.length + ' 位特殊客人 · ' + p.regulars.length + ' 类常客';
      const del = p.source === 'user' ? '<button data-rm="' + p.id + '" class="ghost tiny">移除</button>' : '';
      return '<li><b>' + p.name + '</b><span class="src">' + tag + '</span><span class="meta">' + n + '</span>' + del + '</li>';
    }).join('');
    el.modList.querySelectorAll('[data-rm]').forEach(b => {
      b.onclick = () => { Mods.removePack(b.dataset.rm); renderMods(); };
    });
  }

  function bindMods() {
    const input = document.getElementById('mod-file');
    if (!input) return;
    input.onchange = () => {
      const files = Array.from(input.files || []);
      let ok = 0, err = [];
      let left = files.length;
      if (!left) return;
      files.forEach(f => {
        const fr = new FileReader();
        fr.onload = () => {
          try { Mods.addFromText(fr.result); ok++; }
          catch (e) { err.push(f.name + '：' + e.message); }
          if (--left === 0) finishLoad(ok, err);
        };
        fr.onerror = () => { err.push(f.name + '：读不出来'); if (--left === 0) finishLoad(ok, err); };
        fr.readAsText(f);
      });
      input.value = '';
    };
  }
  function finishLoad(ok, err) {
    renderMods();
    el.modMsg.textContent = err.length
      ? '载入 ' + ok + ' 个，失败：' + err.join('；')
      : '载入 ' + ok + ' 个数据包。下一局开始生效。';
  }

  function inputVector() {
    if (stick) {
      const dx = stick.x - stick.ox, dy = stick.y - stick.oy;
      const len = Math.hypot(dx, dy);
      if (len < 8) return { x: 0, y: 0 };
      const mag = Math.min(len, 46) / 46;
      return { x: dx / len * mag, y: dy / len * mag };
    }
    let x = 0, y = 0;
    if (keys.left) x -= 1;
    if (keys.right) x += 1;
    if (keys.up) y -= 1;
    if (keys.down) y += 1;
    return { x: x, y: y };
  }

  let loopDead = false;
  function loop(ts) {
    if (loopDead) return;
    try { tick(ts); } catch (err) {
      loopDead = true;
      fatal('［主循环］' + (err && err.message ? err.message : err),
            err && err.stack ? String(err.stack).split('\n').slice(0, 3).join('\n') : '');
      return;
    }
    requestAnimationFrame(loop);
  }
  function tick(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    if (phase === 'day') {
      Render.setStick(paused ? null : stick);
      if (!paused) Day.update(dt, inputVector());
      Render.frame();
      hud();
    }
  }

  function hud() {
    const d = Day.d, s = State.s;
    el.day.textContent = '第 ' + s.day + ' 天';
    el.clock.textContent = (d.timeLeft > 0 ? Math.ceil(d.timeLeft) + ' 秒' : '打烊中');
    el.money.textContent = s.money;
    el.aff.textContent = State.affLevel().level.title + ' · ' + s.affection;
    el.queue.textContent = '后厨 ' + (d.queue.length + (d.yu.cooking ? 1 : 0)) + ' / 传菜口 ' + d.ready.length;
  }

  return { boot, toDay, toNight, playPreview };
})();

window.addEventListener('DOMContentLoaded', () => {
  try { Game.boot(); }
  catch (err) {
    fatal('［启动］' + (err && err.message ? err.message : err),
          err && err.stack ? String(err.stack).split('\n').slice(0, 3).join('\n') : '');
  }
});
