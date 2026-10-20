const Assets = (function () {
  const DIR = 'art/';
  const ADV_DIR = 'avg/';
  const PRELOAD_WORKERS = 24;

  const MANIFEST = {

    scene: 'bg.jpeg',

    dishes: [
      'yangchunmian', 'jiachangdoufu', 'danchaofan', 'youpochemian',
      'culiubaicai', 'shaoyushou', 'zhengbaozi', 'suanlatang',
      'qingzhenglin', 'guihuagao', 'lvdoutang', 'shuanglingeng',
      'baizhuolin', 'liangbansansi', 'tangguazhan', 'maladoufu',
      'weilizi', 'shizibing', 'wuxianghui', 'banlinanrou',
      'maoxuewang', 'diaolanyuqi',
      'huntun', 'hongyufuru', 'youmensun', 'zhaqiehe',
      'congyoutui', 'wushengpan', 'xuwentang', 'sanxianguo',
      'changshoumian', 'lanroumian', 'malalinwan', 'juhongsu',
      'yiqingerbai', 'fenzhengrou', 'shengrouhuo',
      'jinyucangxin', 'wensiqiuju',
      'to_suanlafen', 'to_malaban', 'to_xueer', 'to_lingeng', 'to_tangou'
    ],

    laojiang: {
      walk: {
        up: seq('up', 6, 10),
        down: seq('down', 6, 10),
        left: seq('left', 6, 10),
        right: seq('right', 6, 10)
      },
      idle: seq('idle', 6, 6),
      eat: seq('eat', 6, 6)
    },

    dalisi: {
      walk: {
        up: seq('up', 6, 10),
        down: seq('down', 6, 10),
        left: seq('left', 6, 10),
        right: seq('right', 6, 10)
      },
      idle: seq('idle', 6, 6),
      eat: seq('eat', 6, 6)
    },

    jiefang: {
      walk: {
        up: seq('up', 6, 10),
        down: seq('down', 6, 10),
        left: seq('left', 6, 10),
        right: seq('right', 6, 10)
      },
      idle: seq('idle', 6, 6),
      eat: seq('eat', 6, 6)
    },

    xuesheng: walkIdleEat(),
    xunwei:   walkIdleEat(),
    tianshi:  walkIdleEat(),
    youke:    walkIdleEat(),

    yu: {
      walk: {
        up: seq('up', 6, 10), down: seq('down', 6, 10),
        left: seq('left', 6, 10), right: seq('right', 6, 10)
      },
      idle: seq('idle', 6, 6),
      cook: seq('cook', 6, 6)
    },

    wang:    walkIdleEat(),
    jie:     walkIdleEat(),
    huaihu:  walkIdleEat(),
    duyaoye: walkIdleEat(),
    laoli:   walkIdleEat(),

    Duyaoye: {

      portraits: [
        'Avg_avg_npc_296_1-1$1',
        'Avg_avg_npc_296_1$2',
        'Avg_avg_npc_296_1-2$1',
        'Avg_avg_npc_296_1-3$1',
        'Avg_avg_npc_296_1-4$1',
        'Avg_avg_npc_296_1-5$1',
        'Avg_avg_npc_296_1-7$1'
      ]
    },

    Laojiang: {
      portraits: [
        'Avg_avg_npc_1621_1-1$1',
        'Avg_avg_npc_1621_1-2$1',
        'Avg_avg_npc_1621_1-3$1',
        'Avg_avg_npc_1621_1-4$1',
        'Avg_avg_npc_1621_1-5$1',
        'Avg_avg_npc_1621_1-6$1',
        'Avg_avg_npc_1621_1-7$1',
        'Avg_avg_npc_1621_1-8$1',
        'Avg_avg_npc_1621_1-9$1',
        'Avg_avg_npc_1621_1-10$1'
      ]
    },

    Laolee: {
      portraits: [
        'Avg_avg_322_lmlee_1-1$1',
        'Avg_avg_322_lmlee_1-2$1',
        'Avg_avg_322_lmlee_1-9$1',
        'Avg_avg_322_lmlee_1-10$1'
      ]
    },

    Yu: {
      portraits: [
        'Avg_avg_2026_yu_1-1$1', 'Avg_avg_2026_yu_1-10$1', 'Avg_avg_2026_yu_1-11$1',
        'Avg_avg_2026_yu_1-13$1', 'Avg_avg_2026_yu_1-14$1',
        'Avg_avg_2026_yu_1-2$1', 'Avg_avg_2026_yu_1-20$1', 'Avg_avg_2026_yu_1-21$1',
        'Avg_avg_2026_yu_1-3$1', 'Avg_avg_2026_yu_1-4$1',
        'Avg_avg_2026_yu_1-6$1', 'Avg_avg_2026_yu_1-8$1'
      ]
    },

    Wang: {
      portraits: [
        'Avg_avg_2027_wang_1-10$1',
        'Avg_avg_2027_wang_1-11$1',
        'Avg_avg_2027_wang_1-2$1',
        'Avg_avg_2027_wang_1-3$1',
        'Avg_avg_2027_wang_1-4$1',
        'Avg_avg_2027_wang_1-5$1',
        'Avg_avg_2027_wang_1-9$1'
      ]
    },

    Chyue: {
      portraits: [
        'Avg_avg_2024_chyue_1-11$1',
        'Avg_avg_2024_chyue_1-6$1',
        'Avg_avg_2024_chyue_1-8$1'
      ]
    },

    Jie: { portraits: ['Avg_avg_npc_2125_1-6$1'] },

    Waaifu: {
      portraits: [
        'Avg_avg_243_waaifu_1-3$1',
        'Avg_avg_243_waaifu_1-4$1',
        'Avg_avg_243_waaifu_1-9$1'
      ]
    },

    Strong: {
      portraits: [
        'Avg_avg_272_strong_1-1$1', 'Avg_avg_272_strong_1-2$1',
        'Avg_avg_272_strong_1-3$1', 'Avg_avg_272_strong_1-4$1'
      ]
    },

    Npc: {
      portraits: ['熟客1']
    }
  };

  const cache = {};
  const imgCache = {};
  const imageLoads = new Map();
  const decodedImages = new Set();

  function seq(dir, count, fps) {
    const frames = [];
    for (let i = 0; i < count; i++) frames.push(dir + '_' + i + '.png');
    return { frames: frames, fps: fps || 8 };
  }

  function walkIdleEat() {
    return {
      walk: {
        up: seq('up', 6, 10), down: seq('down', 6, 10),
        left: seq('left', 6, 10), right: seq('right', 6, 10)
      },
      idle: seq('idle', 6, 6),
      eat: seq('eat', 6, 6)
    };
  }

  function has(id, action) {
    const m = MANIFEST[id];
    return !!(m && m.sprite && m.sprite.indexOf(action) >= 0);
  }
  function looksOf(id) {
    const m = MANIFEST[id];
    return (m && (m.portraits || m.faces)) || null;
  }
  function hasPortrait(id) {
    const m = MANIFEST[id];
    const ls = looksOf(id);
    return !!(m && (m.portrait || (ls && ls.length)));
  }

  function hasLook(id, look) {
    const ls = looksOf(id);
    return !!(look && ls && ls.indexOf(look) >= 0);
  }

  function defaultLook(id) {
    const ls = looksOf(id);
    return (ls && ls[0]) || 'normal';
  }

  function portraitUrl(id, look) {
    const file = hasLook(id, look) ? look : defaultLook(id);
    return ADV_DIR + id + '/' + encodeURIComponent(file) + '.webp';
  }
  function spriteUrl(id, action) { return DIR + id + '/' + action + '.webm'; }

  function sprite(id, action) {
    if (!id || !has(id, action)) return null;
    const key = id + '/' + action;
    if (cache[key]) return cache[key];
    if (typeof document === 'undefined') return null;
    const v = document.createElement('video');
    v.src = spriteUrl(id, action);
    v.loop = true;
    v.muted = true;
    v.autoplay = true;
    v.playsInline = true;
    v.play().catch(() => {});
    cache[key] = v;
    return v;
  }

  function ready(v) { return v && v.readyState >= 2 && v.videoWidth > 0; }

  function image(id, file) {
    return imageUrl(DIR + id + '/' + file);
  }

  function imageUrl(url) {
    if (imgCache[url]) return imgCache[url];
    if (typeof Image === 'undefined') return null;
    const im = new Image();
    imgCache[url] = im;
    im.src = url;
    return im;
  }
  function imgReady(im) { return !!(im && im.complete && im.naturalWidth > 0); }

  function loadImage(url) {
    if (decodedImages.has(url)) return Promise.resolve(true);
    if (imageLoads.has(url)) return imageLoads.get(url);
    const task = new Promise(resolve => {
      const im = imageUrl(url);
      if (!im) { resolve(false); return; }
      let settled = false, decoding = false;
      const finish = ok => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        im.removeEventListener('load', loaded);
        im.removeEventListener('error', failed);
        if (ok) decodedImages.add(url);
        else if (imgCache[url] === im) delete imgCache[url];
        resolve(ok);
      };
      const loaded = () => {
        if (decoding || settled) return;
        decoding = true;
        if (!imgReady(im)) { finish(false); return; }
        if (typeof im.decode === 'function') im.decode().then(() => finish(true), () => finish(false));
        else finish(true);
      };
      const failed = () => finish(false);
      const timeout = setTimeout(failed, 20000);
      im.addEventListener('load', loaded);
      im.addEventListener('error', failed);
      if (im.complete) loaded();
    });
    imageLoads.set(url, task);
    task.then(() => imageLoads.delete(url));
    return task;
  }

  function gameImages() {
    const urls = [DIR + 'scene/' + (typeof MANIFEST.scene === 'string' ? MANIFEST.scene : MANIFEST.scene.file)];
    MANIFEST.dishes.forEach(id => urls.push(DIR + 'dish/' + id + '.png'));
    Object.keys(MANIFEST).forEach(id => {
      const m = MANIFEST[id];
      if (!m || !m.walk) return;
      const entries = Object.values(m.walk).concat([m.idle, m.eat, m.cook]);
      entries.filter(Boolean).forEach(entry => {
        const files = typeof entry === 'string' ? [entry] : (entry.frames || []);
        files.forEach(file => urls.push(DIR + id + '/' + file));
      });
    });
    return Array.from(new Set(urls));
  }

  function storyImages(lines) {
    const urls = [DIR + 'scene/58_g1_yusrestaurant.png'];
    (lines || []).forEach(l => {
      if (l.noPortrait || !l.who) return;
      if (l.portrait) urls.push(l.portrait);
      else if (l.char && hasPortrait(l.char)) urls.push(portraitUrl(l.char, l.look));
    });
    return Array.from(new Set(urls));
  }

  async function preload(urls, onProgress, workers = PRELOAD_WORKERS) {
    let completed = 0, next = 0, consecutiveFailures = 0;
    const failed = [];
    if (onProgress) onProgress(0, urls.length);
    async function worker() {
      while (next < urls.length && consecutiveFailures < 8) {
        const url = urls[next++];
        if (await loadImage(url)) consecutiveFailures = 0;
        else { failed.push(url); consecutiveFailures++; }
        completed++;
        if (onProgress) onProgress(completed, urls.length);
      }
    }
    await Promise.all(Array.from({ length: Math.min(workers, urls.length) }, worker));
    failed.push(...urls.slice(next));
    return { failed, total: urls.length };
  }

  function gameReady() { return gameImages().every(url => decodedImages.has(url)); }
  function storyReady(lines) { return storyImages(lines).every(url => decodedImages.has(url)); }
  function preloadGame(onProgress) { return preload(gameImages(), onProgress); }
  function preloadStory(lines, onProgress) { return preload(storyImages(lines), onProgress); }
  function prefetchStory(lines) { return preload(storyImages(lines), null, 4); }

  function entryFrames(id, entry) {
    const files = (typeof entry === 'string') ? [entry] : (entry && entry.frames || []);
    if (!files.length) return null;
    return {
      imgs: files.map(f => image(id, f)),
      fps: (entry && entry.fps) || 8,
      flip: false
    };
  }

  function anim(id, name) {
    const m = MANIFEST[id];
    return (m && m[name]) ? entryFrames(id, m[name]) : null;
  }

  function walk(id, dir) {
    const m = MANIFEST[id];
    if (!m || !m.walk) return null;
    let flip = false;
    let entry = m.walk[dir];
    if (!entry) {
      const opp = { left: 'right', right: 'left', up: 'down', down: 'up' }[dir];
      entry = m.walk[opp];
      if (!entry) return null;
      flip = dir === 'left' || dir === 'right';
    }
    const r = entryFrames(id, entry);
    return r && { imgs: r.imgs, fps: r.fps, flip: flip };
  }

  function scene() {
    const m = MANIFEST.scene;
    if (!m) return null;
    return image('scene', (typeof m === 'string') ? m : m.file);
  }
  function sceneRect() {
    const full = {
      w: GameData.MAP[0].length * GameData.CONFIG.tile,
      h: GameData.MAP.length * GameData.CONFIG.tile
    };
    const m = MANIFEST.scene;
    if (!m || typeof m === 'string') return { x: 0, y: 0, w: full.w, h: full.h };
    return { x: m.x || 0, y: m.y || 0, w: m.w || full.w, h: m.h || full.h };
  }

  function dishImg(id) {
    return (MANIFEST.dishes && MANIFEST.dishes.indexOf(id) >= 0) ? image('dish', id + '.png') : null;
  }

  return { DIR, ADV_DIR, MANIFEST, has, hasPortrait, hasLook, portraitUrl, spriteUrl, sprite, ready, image, imgReady, anim, walk, scene, sceneRect, dishImg,
    gameReady, storyReady, preloadGame, preloadStory, prefetchStory };
})();
