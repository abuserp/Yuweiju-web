const Render = (function () {
  const C = GameData.CONFIG;
  const T = C.tile;

  const PAL = {
    wall:    '#1d1815',
    floor:   '#3a2f28',
    floorAlt:'#413630',
    kitchen: '#2a2521',
    counter: '#6d5136',
    counterTop: '#87673f',
    table:   '#7a5a3c',
    tableTop:'#8d6a46',
    door:    '#141d26',
    phone:   '#4a5d6b',
    hatch:   '#5a6b4a',
    jiang:   '#f0b24a',
    yu:      '#5f9e8c',
    ink:     '#0f1216',
    paper:   '#e6dcc6'
  };

  const SERIF = '"Songti SC","SimSun","Noto Serif CJK SC",serif';

  let ctx = null, canvas = null;
  let panelHits = [];
  let paused = false;
  let stick = null;

  function init(cv) {
    canvas = cv;
    canvas.width = State.map.w * T;
    canvas.height = State.map.h * T;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  function drawActor(id, action, cx, footY, w, h) {
    const v = Assets.sprite(id, action);
    if (!Assets.ready(v)) return false;
    ctx.drawImage(v, cx - w / 2, footY - h, w, h);
    return true;
  }

  function drawFlip(im, cx, footY, w, h, flip) {
    if (!flip) { ctx.drawImage(im, cx - w / 2, footY - h, w, h); return; }
    ctx.save();
    ctx.translate(cx, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(im, -w / 2, footY - h, w, h);
    ctx.restore();
  }

  function drawDishImg(dishId, cx, cy, size) {
    const im = Assets.dishImg(dishId);
    if (!Assets.imgReady(im)) return false;
    ctx.drawImage(im, cx - size / 2, cy - size / 2, size, size);
    return true;
  }
  function guestAction(g) {
    if (g.state === 'enter' || g.state === 'leave') return 'move';
    if (g.state === 'eating') return 'eat';
    return 'wait';
  }

  function frame() {
    const d = Day.d;
    panelHits = [];
    drawMap();
    drawCounterItems(d);
    drawHatch(d);
    drawTables(d);
    drawYu(d);
    drawGuests(d);
    drawPlayer(d);
    drawInteraction();
    drawFloats(d);
    if (window.__yu) debugYu();
    if (window.__ready) debugReady();
    drawCombo(d);
    drawAnnounce(d);
    if (d.panel) drawPanel(d);
    drawHint(d);
    if (paused) drawPaused();
    drawStick();
  }

  let bgCache = null;
  function drawMap() {
    const bg = Assets.scene();
    if (bg && Assets.imgReady(bg)) {
      const r = Assets.sceneRect();
      if (!bgCache || bgCache._src !== bg.src + JSON.stringify(r)) {
        bgCache = document.createElement('canvas');
        bgCache.width = canvas.width;
        bgCache.height = canvas.height;
        const b = bgCache.getContext('2d');
        b.imageSmoothingEnabled = true;
        b.drawImage(bg, r.x, r.y, r.w, r.h);
        bgCache._src = bg.src + JSON.stringify(r);
      }
      ctx.drawImage(bgCache, 0, 0);
      label(State.findTile('O'), '外卖口');
      if (window.__grid) debugGrid();
      return;
    }
    drawMapTiles();
  }

  function debugReady() {
    for (let i = 0; i < C.counterCap; i++) {
      const p = Day.readySlotPos(i);
      ctx.strokeStyle = '#c3cc4a'; ctx.lineWidth = 1;
      ctx.strokeRect(p.x - 16, p.y - 13, 32, 26);
      ctx.beginPath(); ctx.arc(p.x, p.y, C.reach, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#c3cc4a';
      ctx.font = '11px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i + ' · ' + p.x + ',' + p.y, p.x, p.y - 18);
    }
  }

  function debugYu() {
    const st = C.yuStation;
    const posts = !st ? [] : (Array.isArray(st) ? st : [st]);
    const pts = posts.map((p, i) => [p, '#f0b24a', 'yuStation[' + i + ']'])
      .concat([[C.yuIdle, '#5f9e8c', 'yuIdle 闲着']]);
    pts.forEach(([pt, col, name]) => {
      if (!pt) return;
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pt.x - 12, pt.y); ctx.lineTo(pt.x + 12, pt.y);
      ctx.moveTo(pt.x, pt.y - 12); ctx.lineTo(pt.x, pt.y + 12);
      ctx.stroke();
      ctx.strokeRect(pt.x - 20, pt.y - 26, 40, 52);
      ctx.fillStyle = col;
      ctx.font = '11px system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(name + ' ' + pt.x + ',' + pt.y, pt.x + 14, pt.y - 14);
    });
  }

  function debugGrid() {

    for (let r = 0; r < State.map.h; r++) {
      for (let c = 0; c < State.map.w; c++) {
        if (!State.walkable(c, r, 'player')) {
          ctx.fillStyle = 'rgba(255, 30, 30, 0.28)';
          ctx.fillRect(c * T, r * T, T, T);
        }
      }
    }

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.95)';
    ctx.lineWidth = 2;
    (C.blockers || []).forEach(b => ctx.strokeRect(b.x, b.y, b.w, b.h));
    ctx.strokeStyle = 'rgba(255,0,0,0.5)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= State.map.w; c++) { ctx.beginPath(); ctx.moveTo(c * T, 0); ctx.lineTo(c * T, canvas.height); ctx.stroke(); }
    for (let r = 0; r <= State.map.h; r++) { ctx.beginPath(); ctx.moveTo(0, r * T); ctx.lineTo(canvas.width, r * T); ctx.stroke(); }

    ctx.strokeStyle = 'rgba(0,255,255,0.9)';
    for (let i = 0; i < 4; i++) { const p = Day.readySlotPos(i); ctx.strokeRect(p.x - 16, p.y - 13, 32, 26); }
    Day.d.tables.forEach(t => t.seats.forEach(s => ctx.strokeRect(s.x - 14, s.y - 30, 28, 34)));
    ctx.strokeStyle = 'rgba(0,255,0,0.9)';
    const st = C.yuStation || { x: Day.d.yu.home - 0.5 * T, y: 2.3 * T };
    ctx.strokeRect(st.x - 30, st.y - 20, 60, 40);
    const o = State.findTile('O');
    if (o) ctx.strokeRect(o.x - 20, o.y - 20, 40, 40);
  }
  function drawMapTiles() {
    for (let r = 0; r < State.map.h; r++) {
      for (let c = 0; c < State.map.w; c++) {
        const t = State.tileAt(c, r);
        let col = PAL.floor;
        if (t === '#') col = PAL.wall;
        else if (t === 'K') col = PAL.kitchen;
        else if (t === 'D') col = PAL.door;
        else if (t === 'C') col = PAL.counter;
        else if (t === 'P') col = PAL.phone;
        else if (t === 'O') col = PAL.hatch;
        else if ((r + c) % 2 === 0) col = PAL.floorAlt;
        ctx.fillStyle = col;
        ctx.fillRect(c * T, r * T, T, T);
        if (t === 'C') { ctx.fillStyle = PAL.counterTop; ctx.fillRect(c * T, r * T, T, 9); }
      }
    }
    const span = State.counterSpan();
    ctx.fillStyle = 'rgba(230,220,198,0.22)';
    ctx.font = '15px ' + SERIF;
    ctx.textAlign = 'center';
    ctx.fillText('后厨', (span.start + (span.end - span.start + 1) / 2) * T, T * 0.78);
    label(State.findTile('O'), '外卖口');
  }
  function label(pos, text) {
    if (!pos) return;
    ctx.fillStyle = 'rgba(230,220,198,0.85)';
    ctx.font = '11px ' + SERIF;
    ctx.textAlign = 'center';
    ctx.fillText(text, pos.x, pos.y + 4);
  }

  function drawTables(d) {

    const bg = Assets.scene();
    if (bg && Assets.imgReady(bg)) return;

    d.tables.forEach(t => {
      const x = t.cols[0] * T, w = t.cols.length * T;
      ctx.fillStyle = PAL.table;
      ctx.fillRect(x + 2, t.row * T + 2, w - 4, T - 4);
      ctx.fillStyle = PAL.tableTop;
      ctx.fillRect(x + 7, t.row * T + 7, w - 14, T - 14);
      if (t.cols.length > 1) {
        ctx.fillStyle = PAL.table;
        ctx.fillRect(t.cols[0] * T + T - 1, t.row * T + 7, 2, T - 14);
      }
    });
  }

  function ownerTag(d, guestId, cx, cy) {
    if (guestId == null) return;
    const g = d.guests.find(x => x.id === guestId);
    if (!g) return;
    const a = GameData.ATTR[(g.cravings && g.cravings[0]) || g.craving];
    ctx.fillStyle = a.color;
    ctx.fillRect(cx - 8, cy - 8, 16, 16);
    ctx.fillStyle = '#14100c';
    ctx.font = 'bold 11px ' + SERIF;
    ctx.textAlign = 'center';
    ctx.fillText(g.mark || (g.type.name || '客').charAt(0), cx, cy + 4);
  }

  function drawCounterItems(d) {
    d.ready.forEach((o, i) => {
      const pos = Day.readySlotPos(i);
      const dish = GameData.dish(o.dishId);
      const dx = 8, dy = 8;

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(pos.x + dx, pos.y + 3 + dy, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      if (!drawDishImg(o.dishId, pos.x + dx, pos.y - 2 + dy, 30)) {
        ctx.fillStyle = PAL.paper;
        ctx.fillRect(pos.x - 10 + dx, pos.y - 8 + dy, 20, 16);
        ctx.fillStyle = GameData.dishColor(dish);
        ctx.fillRect(pos.x - 6 + dx, pos.y - 5 + dy, 12, 10);
      }
      ctx.fillStyle = PAL.paper;
      ctx.font = '11px ' + SERIF;
      ctx.textAlign = 'center';
      ctx.fillText(dish.name, pos.x + dx, pos.y + 22 + dy);
      ownerTag(d, o.guestId, pos.x + dx + 11, pos.y + dy - 10);
    });
  }

  function drawHatch(d) {
    d.hatch.forEach((o, i) => {
      const pos = Day.hatchSlotPos(i);
      const dish = GameData.dish(o.dishId);
      if (!drawDishImg(o.dishId, pos.x, pos.y, 32)) {
        ctx.fillStyle = PAL.paper;
        ctx.fillRect(pos.x - 14, pos.y - 10, 28, 20);
        ctx.fillStyle = GameData.dishColor(dish);
        ctx.fillRect(pos.x - 10, pos.y - 6, 20, 12);
      }
    });
    if (d.delivery.length) {
      const w = State.findTile('O');
      if (w) {
        ctx.fillStyle = '#c3cc4a';
        ctx.font = '11px ' + SERIF;
        ctx.textAlign = 'center';
        ctx.fillText('在路上 ' + Math.ceil(d.delivery[0].t) + 's', w.x, w.y - 34);
      }
    }
  }

  function drawYu(d) {
    const y = d.yu;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(y.x, y.y + 17, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
    const cands = [
      y.cooking ? Assets.anim('yu', 'cook') : Assets.anim('yu', 'idle'),
      Assets.anim('yu', 'idle'),
      Assets.walk('yu', 'down')
    ];
    const wk = cands.find(c => c && c.imgs.every(Assets.imgReady));
    if (wk) {
      const f = Math.floor(performance.now() / 1000 * wk.fps) % wk.imgs.length;
      drawFlip(wk.imgs[f], y.x, y.y + 17, 40, 52, wk.flip);
    } else if (!drawActor('yu', y.cooking ? 'cook' : 'move', y.x, y.y + 17, 40, 52)) {
      ctx.fillStyle = PAL.yu;
      ctx.fillRect(y.x - 14, y.y - 19, 28, 36);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(y.x - 14, y.y - 19, 28, 10);
      ctx.fillStyle = PAL.paper;
      ctx.font = '13px ' + SERIF;
      ctx.textAlign = 'center';
      ctx.fillText('余', y.x, y.y + 6);
    }

    if (y.cooking) {
      const dish = GameData.dish(y.cooking.dishId);
      const p = Math.min(1, y.progress / dish.cook);
      bar(y.x - 24, y.y - 30, 48, 6, p, '#f0b24a');
      ctx.fillStyle = PAL.paper;
      ctx.font = '12px ' + SERIF;
      ctx.fillText(dish.name, y.x, y.y - 36);
    }
  }

  function drawGuest(g) {
    const cands = [
      (g.state === 'enter' || g.state === 'leave')
        ? Assets.walk(g.spriteId, g.face || 'down')
        : Assets.anim(g.spriteId, g.state === 'eating' ? 'eat' : 'idle'),
      Assets.anim(g.spriteId, 'idle'),
      Assets.walk(g.spriteId, 'down')
    ];
    const wk = cands.find(c => c && c.imgs.every(Assets.imgReady));
    if (wk) {
      const f = Math.floor(performance.now() / 1000 * wk.fps) % wk.imgs.length;
      drawFlip(wk.imgs[f], g.x, g.y + 18, 40, 52, wk.flip);
      return true;
    }
    return drawActor(g.spriteId, guestAction(g), g.x, g.y + 18, 40, 52);
  }

  function drawGuests(d) {
    d.guests.forEach(g => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(g.x, g.y + 17, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
      if (!drawGuest(g)) {
        ctx.fillStyle = g.type.color;
        ctx.fillRect(g.x - 14, g.y - 18, 28, 35);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(g.x - 14, g.y + 7, 28, 10);
      }
      if (g.special) {

        ctx.fillStyle = '#14100c';
        ctx.font = 'bold 16px ' + SERIF;
        ctx.textAlign = 'center';
        ctx.fillText(g.mark, g.x, g.y + 2);
        ctx.fillStyle = PAL.jiang;
        ctx.font = '12px ' + SERIF;
        ctx.fillText(g.label, g.x, g.y + 32);
      }

      if (g.state === 'seated' || g.state === 'waiting') {

        const ratio = Math.max(0, g.patience / g.maxPatience);
        const barY = g.state === 'waiting' ? g.y - 66 : g.y - 34;
        bar(g.x - 18, barY, 36, 5, ratio, ratio > 0.4 ? '#5f9e6e' : '#c8452f');
        if (g.state === 'waiting') thoughtBubble(g);
      }
      if (g.state === 'eating') {
        ctx.fillStyle = PAL.paper;
        ctx.font = '14px ' + SERIF;
        ctx.textAlign = 'center';
        ctx.fillText('用膳中', g.x, g.y - 26);
      }
    });
  }

  function thoughtBubble(g) {
    const dish = GameData.dish(g.order);
    if (!dish) return;
    ctx.font = '12px ' + SERIF;
    const w = Math.max(52, ctx.measureText(dish.name).width + 26);
    const h = 30;
    const bx = g.x - w / 2, by = g.y - 60;

    ctx.fillStyle = 'rgba(238,232,214,0.94)';
    roundRect(bx, by, w, h, 12);
    ctx.fill();

    ctx.beginPath(); ctx.arc(g.x - 6, by + h + 5, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(g.x - 11, by + h + 12, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = GameData.dishColor(dish);
    ctx.fillRect(bx + 7, by + 9, 12, 12);
    ctx.fillStyle = '#14100c';
    ctx.textAlign = 'left';
    ctx.fillText(dish.name, bx + 24, by + 19);
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPlayer(d) {
    const p = d.player;
    const grad = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 100);
    grad.addColorStop(0, 'rgba(240,178,74,0.20)');
    grad.addColorStop(1, 'rgba(240,178,74,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(p.x - 100, p.y - 100, 200, 200);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 19, 17, 6, 0, 0, Math.PI * 2); ctx.fill();

    const cands = [
      p.moving ? Assets.walk('laojiang', p.face || 'down')
               : Assets.anim('laojiang', 'idle'),
      Assets.anim('laojiang', 'idle'),
      Assets.walk('laojiang', 'down')
    ];
    const wk = cands.find(c => c && c.imgs.every(Assets.imgReady));
    if (wk) {
      const f = Math.floor(performance.now() / 1000 * wk.fps) % wk.imgs.length;
      drawFlip(wk.imgs[f], p.x, p.y + 19, 44, 56, wk.flip);
    } else if (!drawActor('laojiang', p.moving ? 'move' : 'wait', p.x, p.y + 19, 44, 56)) {
      ctx.fillStyle = PAL.jiang;
      ctx.fillRect(p.x - 15, p.y - 20, 30, 39);
      ctx.fillStyle = '#c8452f';
      ctx.fillRect(p.x - 15, p.y - 20, 30, 9);
      ctx.fillStyle = '#14100c';
      ctx.font = '14px ' + SERIF;
      ctx.textAlign = 'center';
      ctx.fillText('姜', p.x, p.y + 8);
    }

    if (p.carry) {
      const dish = GameData.dish(p.carry.dishId);
      if (!drawDishImg(p.carry.dishId, p.x, p.y - 36, 34)) {
        ctx.fillStyle = PAL.paper;
        ctx.fillRect(p.x - 15, p.y - 43, 30, 20);
        ctx.fillStyle = GameData.dishColor(dish);
        ctx.fillRect(p.x - 10, p.y - 39, 20, 12);
      }
      ownerTag(Day.d, p.carry.guestId, p.x + 16, p.y - 44);
    }
  }

  function drawInteraction() {
    const action = !paused && Day.interaction();
    if (!action) return;
    ctx.save();
    ctx.strokeStyle = PAL.jiang;
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(240,178,74,0.18)';
    ctx.beginPath();
    ctx.ellipse(action.x, action.y, 23, action.guest ? 9 : 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawFloats(d) {
    d.floats.forEach(f => {
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.font = (f.small ? '12px ' : 'bold 16px ') + SERIF;
      ctx.textAlign = 'center';
      const w = ctx.measureText(f.text).width;
      const cx = Math.max(w / 2 + 6, Math.min(canvas.width - w / 2 - 6, f.x));
      if (f.small) {
        ctx.fillStyle = 'rgba(15,18,22,0.72)';
        ctx.fillRect(cx - w / 2 - 6, f.y - 12, w + 12, 17);
      }
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, cx, f.y);
      ctx.globalAlpha = 1;
    });
  }

  function drawCombo(d) {
    if (d.combo < 2) return;
    const x = canvas.width - 18, y = 40;
    const pop = d.comboPulse > 0 ? 1 + d.comboPulse * 0.5 : 1;
    const full = d.combo >= C.comboMax;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pop, pop);
    ctx.textAlign = 'right';
    ctx.fillStyle = full ? PAL.jiang : PAL.paper;
    ctx.font = 'bold 30px ' + SERIF;
    ctx.fillText('×' + d.combo, 0, 0);
    ctx.restore();
    ctx.textAlign = 'right';
    ctx.fillStyle = full ? PAL.jiang : 'rgba(230,220,198,0.7)';
    ctx.font = '12px ' + SERIF;
    ctx.fillText('连击 · 余 ×' + Day.comboMult().toFixed(2) + (full ? ' 满' : ''), x, y + 16);
  }

  function drawAnnounce(d) {
    if (!d.announce) return;
    const a = d.announce;
    const alpha = Math.min(1, a.t / 0.6);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(15,18,22,0.9)';
    ctx.fillRect(0, 12, canvas.width, a.sub ? 52 : 34);
    ctx.fillStyle = PAL.jiang;
    ctx.fillRect(0, 12, canvas.width, 2);
    ctx.font = '17px ' + SERIF;
    ctx.textAlign = 'center';
    ctx.fillText(a.text, canvas.width / 2, 36);
    if (a.sub) {
      ctx.fillStyle = PAL.paper;
      ctx.font = '12px ' + SERIF;
      ctx.fillText(a.sub, canvas.width / 2, 56);
    }
    ctx.globalAlpha = 1;
  }

  function drawHint(d) {
    if (!d.hint) return;
    ctx.font = '15px ' + SERIF;
    const w = ctx.measureText(d.hint).width + 28;
    ctx.fillStyle = 'rgba(15,18,22,0.8)';
    ctx.fillRect(canvas.width / 2 - w / 2, canvas.height - 40, w, 28);
    ctx.fillStyle = PAL.paper;
    ctx.textAlign = 'center';
    ctx.fillText(d.hint, canvas.width / 2, canvas.height - 20);
  }

  function drawPanel(d) {
    const opts = d.panel.options;
    const extra = (d.panel.rescue ? 1 : 0) + (d.panel.dismiss ? 1 : 0);
    const rows = opts.length + extra;
    const rowH = rows > 10 ? 32 : (rows > 7 ? 38 : 44);
    const fs = rowH >= 44 ? 17 : (rowH >= 38 ? 15 : 14);
    const w = Math.min(canvas.width - 20, 420);
    const headH = d.panel.kind === 'takeout' ? 60 : 78;
    const h = headH + 8 + rows * rowH;
    const x = (canvas.width - w) / 2, y = (canvas.height - h) / 2;

    ctx.fillStyle = 'rgba(10,12,15,0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#8d6a46';
    ctx.fillRect(x, y, w, 6);

    ctx.fillStyle = PAL.ink;
    ctx.font = '17px ' + SERIF;
    ctx.textAlign = 'left';
    if (d.panel.kind === 'takeout') {
      ctx.fillText('鼎丰楼 · 叫外卖（三倍价）', x + 16, y + 42);
      if (d.panel.note) {
        ctx.font = '12px ' + SERIF;
        ctx.fillStyle = '#c8452f';
        ctx.fillText(d.panel.note, x + 16, y + 60);
      }
    } else {
      drawOrderHead(d.panel, x, y, w);
    }

    opts.forEach((o, i) => {
      const dish = GameData.dish(o.id);
      const ry = y + headH + 8 + i * rowH;
      const rw = w - 24;
      panelHits.push({ x: x + 12, y: ry, w: rw, h: rowH - 6, index: i });

      ctx.fillStyle = o.ok ? 'rgba(20,16,12,0.06)' : 'rgba(200,69,47,0.13)';
      ctx.fillRect(x + 12, ry, rw, rowH - 6);
      ctx.globalAlpha = o.ok ? 1 : 0.45;

      ctx.fillStyle = o.demand ? '#8a5a12' : PAL.ink;
      ctx.font = (o.demand ? 'bold ' : '') + fs + 'px ' + SERIF;
      ctx.textAlign = 'left';
      ctx.fillText((i + 1) + '　' + dish.name + (o.demand ? '（指名）' : ''), x + 22, ry + (rowH - 6) / 2 + 6);

      let ax = x + (fs >= 17 ? 132 : 118);
      dish.attrs.forEach(k => {
        ctx.fillStyle = GameData.ATTR[k].color;
        ctx.fillRect(ax, ry + (rowH - 6) / 2 - 11, 22, 22);
        ctx.fillStyle = '#14100c';
        ctx.font = '15px ' + SERIF;
        ctx.textAlign = 'center';
        ctx.fillText(GameData.ATTR[k].name, ax + 11, ry + (rowH - 6) / 2 + 6);
        ax += 26;
      });

      if (o.hits) {
        ctx.fillStyle = o.hits >= 2 ? '#c8452f' : '#5c5344';
        ctx.font = 'bold 12px system-ui,sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(o.hits >= 2 ? '●● 全中' : '● 对味', ax + 6, ry + (rowH - 6) / 2 + 5);
      }

      ctx.fillStyle = o.ok ? PAL.ink : '#8a2f22';
      ctx.font = '14px system-ui,sans-serif';
      ctx.textAlign = 'right';
      const right = d.panel.kind === 'takeout'
        ? (o.ok ? '−' + o.price : '钱不够')
        : (o.ok ? String(dish.price) : '缺料');
      ctx.fillText(right, x + w - 22, ry + (rowH - 6) / 2 + 6);
      ctx.globalAlpha = 1;
    });

    let extraRow = opts.length;
    if (d.panel.rescue) {
      drawExtra(extraRow, '外卖救场', '从鼎丰楼叫一道，九味都有', '#3f5a2e', 'rgba(120,160,80,0.16)');
      extraRow++;
    }
    if (d.panel.dismiss) {
      drawExtra(extraRow, '送客', '空出桌子，余会不高兴', '#5c5344', 'rgba(120,120,120,0.14)');
    }

    function drawExtra(i, title, note, color, bg) {
      const ry = y + headH + 8 + i * rowH;
      const rw = w - 24;
      panelHits.push({ x: x + 12, y: ry, w: rw, h: rowH - 6, index: i });
      ctx.fillStyle = bg;
      ctx.fillRect(x + 12, ry, rw, rowH - 6);
      ctx.fillStyle = color;
      ctx.font = fs + 'px ' + SERIF;
      ctx.textAlign = 'left';
      ctx.fillText((i + 1) + '　' + title, x + 22, ry + (rowH - 6) / 2 + 6);
      ctx.font = '12px system-ui,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(note, x + w - 22, ry + (rowH - 6) / 2 + 6);
    }
  }

  function drawOrderHead(panel, x, y, w) {
    const g = panel.guest;
    const cr = g.cravings || [g.craving];
    const tmpl = panel.line || '想吃点 {taste} 的。';
    const parts = tmpl.split('{taste}');
    const pre = parts[0] || '', post = parts[1] || '';

    ctx.fillStyle = '#8a7c66';
    ctx.font = '12px system-ui,sans-serif';
    ctx.textAlign = 'left';
    const who = g.label || g.type.name;
    ctx.fillText(who, x + 16, y + 26);
    if (panel.reorder && g.order) {
      const tagX = x + 16 + ctx.measureText(who).width + 8;
      ctx.fillStyle = '#b8552f';
      ctx.fillRect(tagX, y + 15, 88, 15);
      ctx.fillStyle = '#fff2e8';
      ctx.font = 'bold 11px system-ui,sans-serif';
      ctx.fillText('改单 · 已点' + GameData.dish(g.order).name, tagX + 4, y + 26);
    }

    const chipW = 24, chipGap = 4;
    let fs = 15;
    const joinW = () => {
      ctx.font = fs + 'px ' + SERIF;
      const chips = cr.length * chipW + (cr.length - 1) * (ctx.measureText(' 和 ').width + chipGap * 2);
      return ctx.measureText(pre).width + chips + ctx.measureText(post).width + cr.length * chipGap * 2;
    };
    while (fs > 11 && joinW() > w - 32) fs--;

    const base = y + 60;
    let cx = x + 16;
    ctx.font = fs + 'px ' + SERIF;
    ctx.fillStyle = PAL.ink;
    ctx.textAlign = 'left';
    ctx.fillText(pre, cx, base);
    cx += ctx.measureText(pre).width + chipGap;

    cr.forEach((k, i) => {
      if (i > 0) {
        ctx.font = fs + 'px ' + SERIF;
        ctx.fillStyle = PAL.ink;
        ctx.textAlign = 'left';
        ctx.fillText('和', cx + chipGap, base);
        cx += ctx.measureText('和').width + chipGap * 2;
      }
      const a = GameData.ATTR[k];
      ctx.fillStyle = a.color;
      ctx.fillRect(cx, base - 18, chipW, chipW);
      ctx.fillStyle = '#14100c';
      ctx.font = 'bold 16px ' + SERIF;
      ctx.textAlign = 'center';
      ctx.fillText(a.name, cx + chipW / 2, base - 1);
      cx += chipW + chipGap;
    });

    ctx.font = fs + 'px ' + SERIF;
    ctx.fillStyle = PAL.ink;
    ctx.textAlign = 'left';
    ctx.fillText(post, cx, base);
  }

  function setPaused(v) { paused = !!v; }
  function drawPaused() {
    ctx.fillStyle = 'rgba(10,12,15,0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = PAL.jiang;
    ctx.font = '30px ' + SERIF;
    ctx.textAlign = 'center';
    ctx.fillText('暂 停', canvas.width / 2, canvas.height / 2 - 6);
    ctx.fillStyle = PAL.paper;
    ctx.font = '13px ' + SERIF;
    ctx.fillText('按 P 或点下面的按钮继续', canvas.width / 2, canvas.height / 2 + 24);
  }

  function bar(x, y, w, h, ratio, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * ratio), h - 2);
  }

  function setStick(s) { stick = s; }
  function drawStick() {
    if (!stick) return;
    ctx.strokeStyle = 'rgba(240,178,74,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(stick.ox, stick.oy, 46, 0, Math.PI * 2); ctx.stroke();
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy;
    const len = Math.hypot(dx, dy) || 1;
    const k = Math.min(46, len) / len;
    ctx.fillStyle = 'rgba(240,178,74,0.6)';
    ctx.beginPath(); ctx.arc(stick.ox + dx * k, stick.oy + dy * k, 19, 0, Math.PI * 2); ctx.fill();
  }

  function hitPanel(cx, cy) {
    for (let i = 0; i < panelHits.length; i++) {
      const r = panelHits[i];
      if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return r.index;
    }
    return -1;
  }

  return { init, frame, hitPanel, setStick, setPaused };
})();
