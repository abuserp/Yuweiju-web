const Day = (function () {
  const C = GameData.CONFIG;
  const T = C.tile;

  const d = {
    running: false,
    timeLeft: 0,
    player: null,
    yu: null,
    tables: [],
    guests: [],
    queue: [],
    ready: [],
    delivery: [],
    hatch: [],
    window: null,
    panel: null,
    floats: [],
    parties: {},
    announce: null,
    combo: 0,
    comboBest: 0,
    comboPulse: 0,
    hint: '',
    stats: null,
    event: null,
    special: null,
    returning: null,
    nextId: 1,
    nextParty: 1,
    spawnTimer: 0
  };

  function corridorRow() { return State.map.h - 2; }

  function start() {
    const door = State.doorTile();
    d.running = true;
    d.timeLeft = C.dayLength;
    d.tables = State.tables();
    Sfx.loopDropAll('step.guest');
    d.guests = [];
    d.queue = [];
    d.ready = [];
    d.delivery = [];
    d.hatch = [];
    d.window = State.findTile('O');
    d.panel = null;
    d.floats = [];
    d.parties = {};
    d.announce = null;
    d.combo = 0; d.comboBest = 0; d.comboPulse = 0;
    d.stepCool = 0;
    d.hint = '';
    d.nextId = 1;
    d.nextParty = 1;
    d.spawnTimer = 1.5;
    d.event = null;
    d.stats = { served: 0, angry: 0, income: 0, aff: 0, matched: 0, takeout: 0, ignored: null };
    const def = Mods.pickSpecialForToday();
    d.special = def ? { def: def, spawned: false, at: C.dayLength * C.specialAt } : null;
    const back = Mods.pickReturning();
    d.returning = back ? { def: back, spawned: false, at: C.dayLength * 0.78 } : null;
    d.player = { x: door.x, y: (State.map.h - 2.5) * T, r: 15, carry: null, face: 'down', still: 0 };
    const kx = State.kitchenCenter();
    d.yu = { x: kx, y: 1.5 * T, cooking: null, progress: 0, home: kx, slot: 0 };
    const story = def && Mods.stageFor(def);
    if (story && story.lines.length) Assets.prefetchStory(story.lines).catch(() => {});
  }

  function update(dt, vec) {
    if (!d.running) return;
    d.timeLeft = Math.max(0, d.timeLeft - dt);
    movePlayer(dt, vec || { x: 0, y: 0 });
    spawn(dt);
    d.guests.forEach(g => updateGuest(g, dt));

    d.guests.forEach(g => { if (g.dead) Sfx.loopDrop('step.guest', g.id); });
    d.guests = d.guests.filter(g => !g.dead);
    updateYu(dt);
    updateDelivery(dt);
    if (d.announce) { d.announce.t -= dt; if (d.announce.t <= 0) d.announce = null; }
    if (d.comboPulse > 0) d.comboPulse -= dt;
    if (d.stepCool > 0) d.stepCool -= dt;

    d.player.still = d.player.moving ? 0 : d.player.still + dt;
    if (d.player.still > 8) {
      d.player.still = -(2 + Math.random() * 6);
      say('jiang', 'idle', d.player.x, d.player.y - 44);
    }
    d.floats.forEach(f => { f.life -= dt; f.y -= 22 * dt; });
    d.floats = d.floats.filter(f => f.life > 0);
    updateHint();
    if (d.timeLeft <= 0 && d.guests.length === 0) end();
  }

  function movePlayer(dt, vec) {
    let dx = vec.x, dy = vec.y;
    const len = Math.hypot(dx, dy);
    const wasMoving = d.player.moving;
    d.player.moving = len >= 0.05;
    if (len < 0.05) {
      if (wasMoving) {

        if (C.stepLoop) Sfx.loop('step.jiang', false);
        else { Sfx.cut('step.jiang'); d.player.stepAcc = 0; }
      }
      return;
    }
    const p = d.player;

    if (Math.abs(dx) >= Math.abs(dy)) p.face = dx >= 0 ? 'right' : 'left';
    else p.face = dy >= 0 ? 'down' : 'up';
    const k = Math.min(1, len) / len * C.playerSpeed * comboMove() * dt;
    dx *= k; dy *= k;
    const x0 = p.x, y0 = p.y;
    if (free(p.x + dx, p.y, p.r)) p.x += dx;
    if (free(p.x, p.y + dy, p.r)) p.y += dy;
    const moved = Math.hypot(p.x - x0, p.y - y0);
    if (C.stepLoop) {

      if (moved > 0.3) Sfx.loop('step.jiang', true, comboMove());
      else Sfx.loop('step.jiang', false);
    } else {
      step(p, moved, 'step.jiang');
    }
  }
  function free(x, y, r) {
    const pts = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]];
    if (!pts.every(pt => State.walkable(Math.floor(pt[0] / T), Math.floor(pt[1] / T), 'player'))) return false;

    return (C.blockers || []).every(b =>
      !(x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h));
  }

  function emptySeats() {
    const out = [];
    d.tables.forEach(t => t.seats.forEach(st => { if (!st.guest) out.push({ table: t, seat: st }); }));
    return out;
  }
  function tablesWithPair() {
    return d.tables.filter(t => t.seats.filter(st => !st.guest).length >= 2);
  }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function spawn(dt) {

    if (d.special && !d.special.spawned && d.timeLeft <= d.special.at && d.timeLeft > 14) {
      if (spawnSpecial(d.special.def)) {
        d.special.spawned = true;
        d.announce = { text: '有客到 · ' + d.special.def.name, sub: '伺候到位，打烊后有下文', t: 5 };
      }
    }

    if (d.returning && !d.returning.spawned && d.timeLeft <= d.returning.at && d.timeLeft > 14) {
      if (spawnSpecial(d.returning.def)) {
        d.returning.spawned = true;
        const dm = Mods.demandFor(d.returning.def);
        d.announce = { text: '故人又来 · ' + d.returning.def.name,
          sub: dm ? '这回指名要 ' + GameData.dish(dm).name : '', t: 5 };
      }
    }
    if (d.timeLeft <= 8) return;
    d.spawnTimer -= dt;
    if (d.spawnTimer > 0) return;
    const interval = Math.max(C.spawnMin, C.spawnBase - (State.s.day - 1) * C.spawnDayStep) * Mods.spawnRateMult() * comboFlow();
    d.spawnTimer = interval * (0.75 + Math.random() * 0.5);
    if (d.guests.length >= C.maxConcurrent) return;

    const pairTables = tablesWithPair();
    if (pairTables.length && d.guests.length + 1 < C.maxConcurrent && Math.random() < C.pairChance) {
      const t = pick(pairTables);
      const free2 = t.seats.filter(st => !st.guest).slice(0, 2);
      const pid = d.nextParty++;
      d.parties[pid] = { size: 2, served: 0, special: null };
      free2.forEach((st, i) => makeGuest(t, st, null, pid, i));
      return;
    }
    const spots = emptySeats();
    if (!spots.length) return;
    const spot = pick(spots);
    makeGuest(spot.table, spot.seat, null, null);
  }

  function spawnSpecial(def) {
    const size = def.party || 1;
    if (size > 1) {
      const ts = d.tables.filter(t => t.seats.filter(st => !st.guest).length >= size);
      if (!ts.length) return false;
      const t = pick(ts);
      const seats = t.seats.filter(st => !st.guest).slice(0, size);
      const pid = d.nextParty++;
      d.parties[pid] = { size: size, served: 0, special: def };
      seats.forEach((st, i) => makeGuest(t, st, def, pid, i));
      return true;
    }
    const spots = emptySeats();
    if (!spots.length) return false;
    const spot = pick(spots);
    const pid = d.nextParty++;
    d.parties[pid] = { size: 1, served: 0, special: def };
    makeGuest(spot.table, spot.seat, def, pid, 0);
    return true;
  }

  function approachFor(table, seat, cRow) {
    const busy = table.seats.filter(st => st !== seat).map(st => st.col);
    const away = busy.length ? (busy[0] < seat.col ? 1 : -1) : 1;
    const cands = [seat.col, seat.col + away, seat.col + away * 2, seat.col - away];
    for (const c of cands) {
      if (c < 1 || c >= State.map.w - 1) continue;
      if (busy.indexOf(c) >= 0) continue;
      let ok = true;
      const lo = Math.min(seat.row, cRow), hi = Math.max(seat.row, cRow);
      for (let r = lo; r <= hi && ok; r++) if (!State.walkable(c, r, 'guest')) ok = false;
      const a = Math.min(c, seat.col), b = Math.max(c, seat.col);
      for (let x = a; x <= b && ok; x++) {
        if (busy.indexOf(x) >= 0) ok = false;
        if (!State.walkable(x, seat.row, 'guest')) ok = false;
      }
      if (ok) return c;
    }
    return State.approachColumn(seat.col, seat.row, cRow);
  }

  function splitPartyId(id, idx) {
    const parts = id.split('-');
    return parts[idx] || id;
  }

  function makeGuest(table, seat, special, partyId, idx) {
    const follow = idx || 0;
    const demand = special ? Mods.demandFor(special) : null;
    const names = special && special.members && special.members.length ? special.members : null;
    const type = special
      ? {
          id: special.id,
          name: names ? (names[idx || 0] || special.name) : special.name,
          color: (names && special.colors && special.colors[idx || 0]) || special.color,
          patience: special.patience,
          pay: special.pay
        }
      : Mods.pickRegular();
    let cravePool = special ? special.crave : type.cravePool;
    if (cravePool && cravePool.length) {
      const live = GameData.menuAttrs(State.s.menu.slice(0, State.menuSlots()));
      const hit = cravePool.filter(a => live.indexOf(a) >= 0);
      if (hit.length) cravePool = hit;
    }

    const door = State.doorTile();
    const cRow = corridorRow();
    const corridorY = (cRow + 0.5) * T;
    const appCol = approachFor(table, seat, cRow);
    const appX = (appCol + 0.5) * T;

    const g = {
      id: d.nextId++,
      type: type,
      x: door.x, y: door.y + follow * 34,
      face: 'up',
      delay: follow * 0.75,
      table: table, seat: seat,
      party: partyId,
      path: [
        { x: door.x, y: corridorY },
        { x: appX, y: corridorY },
        { x: appX, y: seat.y },
        { x: seat.x, y: seat.y }
      ],
      state: 'enter',
      demand: demand,

      cravings: demand
        ? GameData.dish(demand).attrs.slice(0, 2)
        : (cravePool && cravePool.length
            ? cravePool.slice(0, 2)
            : GameData.pickCravings(State.s.menu.slice(0, State.menuSlots()), State.availableAttrs())),
      order: null,
      maxPatience: type.patience,
      patience: type.patience,
      eat: 0,
      talk: 2 + Math.random() * 4,
      growled: false,
      rounds: 0,
      dead: false,
      special: special || null,
      spriteId: special
        ? ((special.sprites && special.sprites[idx || 0]) || splitPartyId(special.id, idx || 0))
        : type.id,
      mark: special ? type.name.charAt(0) : null,
      label: special ? type.name : null
    };
    g.craving = g.cravings[0];
    Sfx.play(special ? 'guest.special' : 'guest.enter');
    seat.guest = g;
    d.guests.push(g);
    return g;
  }

  function updateGuest(g, dt) {
    if (g.state === 'enter' || g.state === 'leave') {
      if (g.delay > 0) {
        g.delay -= dt;
        if (C.stepLoopGuest) Sfx.loopFor('step.guest', g.id, false);
        return;
      }
      const wp = g.path[0];
      if (!wp) {
        if (g.state === 'leave') { g.dead = true; return; }
        g.state = 'seated';
        g.stepAcc = 0;
        if (!C.stepLoopGuest) Sfx.cut('step.guest');
        Sfx.play('guest.bell');
        return;
      }
      const dx = wp.x - g.x, dy = wp.y - g.y;
      const dist = Math.hypot(dx, dy);
      const move = C.customerSpeed * dt;

      if (C.stepLoopGuest) Sfx.loopFor('step.guest', g.id, true);
      else step(g, Math.min(move, dist), 'step.guest');
      if (dist <= move) { g.x = wp.x; g.y = wp.y; g.path.shift(); }
      else {
        g.x += dx / dist * move; g.y += dy / dist * move;

        if (Math.abs(dx) >= Math.abs(dy)) g.face = dx >= 0 ? 'right' : 'left';
        else g.face = dy >= 0 ? 'down' : 'up';
      }
      return;
    }
    if (g.state === 'seated' || g.state === 'waiting') {
      if (C.stepLoopGuest) Sfx.loopFor('step.guest', g.id, false);
      g.patience -= dt * (g.state === 'seated' ? 1.35 : 1);
      const ratio = g.patience / g.maxPatience;

      if (ratio < C.talkAfter) {
        g.talk -= dt;
        if (g.talk <= 0) { g.talk = 9 + Math.random() * 6; say('guest', 'waiting', g.x, g.y - 44); }
      }

      if (ratio < C.growlAt && !g.growled) { g.growled = true; Sfx.play('guest.hungry'); }
      if (g.patience <= 0) leaveAngry(g);
      return;
    }
    if (g.state === 'eating') {
      if (C.stepLoopGuest) Sfx.loopFor('step.guest', g.id, false);
      g.eat -= dt;
      if (g.eat <= 0) {

        if (g.perfect && !g.special && g.rounds < C.reorderMax && Math.random() < C.reorderChance) {
          g.rounds++;
          g.state = 'seated';
          g.order = null;
          g.patience = g.maxPatience;
          g.growled = false;
          g.talk = 2 + Math.random() * 4;
          g.cravings = GameData.pickCravings(State.s.menu.slice(0, State.menuSlots()), State.availableAttrs());
          g.craving = g.cravings[0];
          say('guest', 'again', g.x, g.y - 44);
          Sfx.play('guest.bell');

          if (g.rounds >= 2 && Math.random() < 0.5) say('jiang', 'stuffed', d.player.x, d.player.y - 44);
          return;
        }

        Sfx.play('guest.pay');
        say('guest', 'leave' + (g.satis || 'One'), g.x, g.y - 40);
        g.state = 'leave';
        g.path = leavePath(g);
        release(g);
      }
    }
  }

  function release(g) {
    if (g.seat) { g.seat.guest = null; g.seat = null; }
    g.table = null;
  }

  function leavePath(g) {
    const door = State.doorTile();
    const cRow = corridorRow();
    const corridorY = (cRow + 0.5) * T;
    const col = Math.floor(g.x / T);
    const appCol = State.approachColumn(col, Math.floor(g.y / T), cRow);
    const appX = (appCol + 0.5) * T;
    return [
      { x: appX, y: g.y },
      { x: appX, y: corridorY },
      { x: door.x, y: corridorY },
      { x: door.x, y: door.y + T }
    ];
  }

  function leaveAngry(g) {
    if (g.special && !g.order) d.stats.ignored = g.special.name;
    g.state = 'leave';
    d.stats.angry++;
    breakCombo();
    State.addAffection(C.aff.angry);
    d.stats.aff += C.aff.angry;
    say('guest', 'angry', g.x, g.y - 40);
    Sfx.play('guest.leave');
    orphan(g.id);
    g.path = leavePath(g);
    release(g);
  }

  function comboRatio() { return Math.min(d.combo, C.comboMax) / C.comboMax; }
  function comboMult() { return 1 + comboRatio() * C.comboSpeed; }
  function comboMove() { return 1 + comboRatio() * C.comboMove; }
  function comboFlow() { return 1 - comboRatio() * C.comboFlow; }
  function breakCombo() { d.combo = 0; }

  function yuStations() {
    const st = C.yuStation;
    if (!st) return [{ x: d.yu.home - 0.5 * T, y: 2.3 * T }];
    return Array.isArray(st) ? st : [st];
  }

  function updateYu(dt) {
    const y = d.yu;
    const posts = yuStations();
    const station = posts[y.slot % posts.length];
    const idle = C.yuIdle || { x: y.home + 0.6 * T, y: 1.4 * T };
    const tgt = y.cooking ? station : idle;
    y.x += (tgt.x - y.x) * Math.min(1, dt * 4);
    y.y += (tgt.y - y.y) * Math.min(1, dt * 4);

    if (d.ready.length >= C.counterCap && (y.cooking || d.queue.length)) {
      y.jamTalk = (y.jamTalk || 0) - dt;
      if (y.jamTalk <= 0) { y.jamTalk = 7; say('yu', 'jam', y.x, y.y - 34); Sfx.play('kitchen.jam'); }
    }

    y.talk = (y.talk == null ? 6 + Math.random() * 8 : y.talk) - dt;
    if (y.talk <= 0) {
      y.talk = 14 + Math.random() * 16;
      if (Math.random() < 0.6) say('yu', y.cooking ? 'cooking' : 'idle', y.x, y.y - 34);
    }
    if (!y.cooking && d.queue.length && d.ready.length < C.counterCap) {
      y.cooking = d.queue.shift();
      y.progress = 0;

      y.slot = C.yuStationPick === 'random'
        ? Math.floor(Math.random() * posts.length)
        : (y.slot + 1) % posts.length;
    }
    Sfx.loop('kitchen.wok', !!y.cooking);
    if (y.cooking) {
      const dish = GameData.dish(y.cooking.dishId);
      y.progress += dt * State.cookSpeed() * comboMult();
      if (y.progress >= dish.cook && d.ready.length < C.counterCap) {
        const got = State.recordCooked(y.cooking.dishId);
        if (got.length) Sfx.play('dish.unlock');
        got.forEach(id => float(y.x, y.y - 46, '琢磨出了 ' + GameData.dish(id).name, '#f0b24a'));
        Sfx.play('kitchen.done');
        d.ready.push(y.cooking);
        y.cooking = null;
      }
    }
  }

  function updateDelivery(dt) {
    if (!d.delivery.length) return;
    d.delivery.forEach(o => { o.t -= dt; });
    for (let i = d.delivery.length - 1; i >= 0; i--) {
      if (d.delivery[i].t <= 0 && d.hatch.length < C.hatchCap) {
        d.hatch.push(d.delivery.splice(i, 1)[0]);
        Sfx.play('takeout.arrive');
        if (d.window) float(d.window.x, d.window.y - 24, '外卖到了', '#c3cc4a');
      }
    }
  }
  function openTakeout(g) {
    const busy = d.delivery.length + d.hatch.length;
    const full = busy >= C.hatchCap;
    d.panel = {
      kind: 'takeout',
      guest: g,
      note: full ? `外卖口满了（${busy}/${C.hatchCap}），先去取餐` : null,
      options: GameData.TAKEOUT.map(dish => ({
        id: dish.id, ok: !full && State.s.money >= dish.cost, price: dish.cost
      }))
    };
  }
  function orderTakeout(opt, g) {
    if (d.delivery.length + d.hatch.length >= C.hatchCap) {
      float(d.player.x, d.player.y - 30, '外卖口满了，先取餐', '#c8452f');
      return;
    }
    const dish = GameData.dish(opt.id);
    if (!State.orderTakeout(dish)) {
      float(d.player.x, d.player.y - 30, '钱不够', '#c8452f');
      return;
    }
    Sfx.play('takeout.order');
    d.stats.takeout++;
    if (g && g.order) releaseOrder(g.id);
    d.delivery.push({ dishId: opt.id, guestId: g ? g.id : null, t: C.takeoutWait });
    if (g) { g.order = opt.id; g.state = 'waiting'; g.patience = g.maxPatience; }
    float(d.player.x, d.player.y - 30, '鼎丰楼 −' + opt.price, '#c3cc4a');
    d.panel = null;
  }
  function hatchSlotPos(i) {
    if (!d.window) return { x: 0, y: 0 };
    return { x: d.window.x - 40 + i * 36, y: d.window.y + 8 };
  }
  function nearHatch() {
    return d.window && d.hatch.length &&
      Math.hypot(d.window.x - d.player.x, d.window.y - d.player.y) < C.reach;
  }

  function interact() {
    if (!d.running || d.panel) return;
    const p = d.player;
    if (p.carry) {

      const g = bestTarget(p.carry);
      if (g) { serve(g, p.carry.dishId); return; }
      float(p.x, p.y - 30, '端着 ' + GameData.dish(p.carry.dishId).name, '#e0d6c0');
      return;
    }
    if (nearHatch()) { p.carry = d.hatch.shift(); Sfx.play('plate.pick'); return; }
    const slot = nearestReady(p);
    if (slot >= 0) { p.carry = d.ready.splice(slot, 1)[0]; Sfx.play('plate.pick'); return; }

    const g = nearestAtTable(d.guests.filter(x => x.state === 'seated'))
           || nearestAtTable(d.guests.filter(x => x.state === 'waiting'));
    if (g) openPanel(g);
  }

  function hitCount(dishId, g) {
    const attrs = GameData.dish(dishId).attrs;
    return (g.cravings || [g.craving]).filter(a => attrs.indexOf(a) >= 0).length;
  }

  function acceptable(dishId, g) { return hitCount(dishId, g) >= 1; }

  function discard() {
    const p = d.player;
    if (!d.running || d.panel || !p.carry) return;
    Sfx.play('plate.toss');
    float(p.x, p.y - 30, '倒了', '#8c9bb0');
    freeGuest(p.carry.guestId);
    p.carry = null;
  }

  function releaseOrder(guestId) {
    if (guestId == null) return;
    orphan(guestId);
    freeGuest(guestId);
  }

  function orphan(guestId) {
    if (guestId == null) return;
    d.queue.forEach(o => { if (o.guestId === guestId) o.guestId = null; });
    d.ready.forEach(o => { if (o.guestId === guestId) o.guestId = null; });
    d.delivery.forEach(o => { if (o.guestId === guestId) o.guestId = null; });
  }

  function freeGuest(guestId) {
    const g = d.guests.find(x => x.id === guestId);
    if (!g) return;
    if (g.state === 'waiting') {
      g.order = null;
      g.state = 'seated';
      float(g.x, g.y - 46, '重新点单', '#c3cc4a');
    }
  }

  function reachable() {
    const p = d.player;
    return d.guests.filter(g => {
      if (g.state !== 'waiting' && g.state !== 'seated') return false;
      const dg = Math.hypot(g.x - p.x, g.y - p.y);
      const dtb = g.table ? Math.hypot(g.table.x - p.x, g.table.y - p.y) : dg;
      return Math.min(dg, dtb) <= C.tableReach;
    });
  }

  function bestTarget(carry) {
    const p = d.player;
    const dishId = carry.dishId;
    const dish = GameData.dish(dishId);
    const list = reachable();
    if (!list.length) return null;

    const sorted = list.slice().sort((a, b) =>
      Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const d0 = Math.hypot(sorted[0].x - p.x, sorted[0].y - p.y);
    const tie = sorted.filter(g => Math.hypot(g.x - p.x, g.y - p.y) - d0 < 12);
    if (tie.length === 1) return tie[0];

    let best = null, bestScore = -1;
    tie.forEach(g => {
      let score = 0;
      if (carry.guestId === g.id) score = 5;
      else if (g.order === dishId) score = 4;
      else if (hitCount(dishId, g) >= 1) score = g.order ? 2 : 3;
      else if (!g.order) score = 1;
      if (score > bestScore) { best = g; bestScore = score; }
    });
    return best || sorted[0];
  }

  function nearestAtTable(list) {
    const p = d.player;
    let best = null, bd = C.tableReach;
    list.forEach(g => {
      const dg = Math.hypot(g.x - p.x, g.y - p.y);
      const dtb = g.table ? Math.hypot(g.table.x - p.x, g.table.y - p.y) : dg;
      const dist = Math.min(dg, dtb);
      if (dist < bd) { bd = dist; best = g; }
    });
    return best;
  }
  function readySlotPos(i) {
    if (C.readySlots && C.readySlots.length) {
      return C.readySlots[i % C.readySlots.length];
    }
    const span = State.counterSpan();
    const w = (span.end - span.start + 1) * T / C.counterCap;
    return { x: span.start * T + w * (i + 0.5), y: (State.counterRow() + 0.5) * T };
  }
  function nearestReady(p) {
    let best = -1, bd = C.reach;
    d.ready.forEach((o, i) => {
      const pos = readySlotPos(i);
      const dist = Math.hypot(pos.x - p.x, pos.y - p.y);
      if (dist < bd) { bd = dist; best = i; }
    });
    return best;
  }

  function openPanel(g) {
    d.panel = {
      kind: 'order',
      guest: g,

      reorder: !!g.order,
      line: g.order
        ? GameData.talk('order', 'again')
        : GameData.talk('order', (g.cravings || [g.craving]).length > 1 ? 'two' : 'one'),
      rescue: true,
      dismiss: true,
      options: (function () {
        const ids = State.s.menu.slice(0, State.menuSlots());
        if (g.demand && ids.indexOf(g.demand) < 0) ids.unshift(g.demand);
        return ids.map(id => {
          const dish = GameData.dish(id);
          return {
            id: id,
            ok: State.hasIngredients(dish.cost),
            demand: id === g.demand,
            hits: hitCount(id, g)
          };
        });
      })()
    };
  }
  function closePanel() { d.panel = null; }

  function choose(index) {
    if (!d.panel) return;
    if (d.panel.kind === 'takeout') {
      const o = d.panel.options[index];
      if (!o) { d.panel = null; return; }
      if (!o.ok) { float(d.player.x, d.player.y - 30, '钱不够', '#c8452f'); return; }
      orderTakeout(o, d.panel.guest);
      return;
    }
    const g = d.panel.guest;
    if (!g || (g.state !== 'seated' && g.state !== 'waiting')) { d.panel = null; return; }
    const n = d.panel.options.length;
    if (d.panel.rescue && index === n) { openTakeout(g); return; }
    if (d.panel.dismiss && index === n + 1) { dismiss(g); return; }
    const opt = d.panel.options[index];
    if (!opt) return;
    const dish = GameData.dish(opt.id);
    if (!opt.ok) { float(g.x, g.y - 30, '缺料，试试外卖救场', '#c8452f'); return; }
    if (g.order) releaseOrder(g.id);
    Sfx.play('ui.pick');
    Sfx.play('guest.order');
    State.consumeIngredients(dish.cost);
    g.order = opt.id;
    g.state = 'waiting';
    g.patience = g.maxPatience;
    g.growled = false;
    g.talk = 2 + Math.random() * 4;
    d.queue.push({ dishId: opt.id, guestId: g.id });
    d.panel = null;
  }

  function dismiss(g) {
    Sfx.play('ui.cancel');
    d.panel = null;
    breakCombo();
    State.addAffection(C.aff.dismiss);
    d.stats.aff += C.aff.dismiss;
    float(g.x, g.y - 30, '改日再来', '#8c9bb0');
    g.state = 'leave';
    g.path = leavePath(g);
    release(g);
  }

  function serve(g, dishId) {
    const dish = GameData.dish(dishId);
    const hits = hitCount(dishId, g);
    const both = hits >= 2;
    const matched = hits >= 1;

    const mult = both ? C.bothPay : (matched ? 1 : C.wrongPay);
    let pay = Math.round(dish.price * g.type.pay * mult);

    State.s.money += pay;
    d.stats.income += pay;
    d.stats.served++;
    const aff = matched
      ? (C.aff.served + C.aff.matched + (hits >= (g.cravings || [g.craving]).length ? C.aff.both : 0))
      : C.aff.wrong;

    if (matched) {
      d.combo++; d.comboBest = Math.max(d.comboBest, d.combo); d.comboPulse = 0.5;
      if (d.combo === 4 || d.combo === C.comboMax) {
        say('jiang', 'combo', d.player.x, d.player.y - 44);
        Sfx.play('combo.up');
      }
    }
    else breakCombo();
    State.addAffection(aff);
    d.stats.aff += aff;
    if (matched) d.stats.matched++;

    if (g.party && d.parties[g.party]) {
      const pt = d.parties[g.party];
      pt.served++;
      if (pt.special && pt.served >= pt.size && !d.event) {
        const stage = Mods.stageFor(pt.special);
        if (stage && stage.lines.length) {
          d.event = { defId: pt.special.id, stage: stage, lines: stage.lines, count: true };
        }
      }
    }

    Sfx.play('plate.put');
    Sfx.play('guest.eat');
    if (both) Sfx.play('guest.happy');
    else if (!matched) Sfx.play('guest.miss');
    d.player.carry = null;
    g.state = 'eating';
    g.eat = C.eatTime;

    g.perfect = hits >= (g.cravings || [g.craving]).length;
    g.satis = g.perfect ? 'Both' : (matched ? 'One' : 'Miss');
    say('guest', 'eat' + g.satis, g.x, g.y - 44);
    float(g.x, g.y - 30, '+' + pay + (both ? ' 全中!' : (matched ? ' 对味' : ' 不合口味')),
      both ? '#f0b24a' : (matched ? '#e0d6c0' : '#c8452f'));
  }

  function float(x, y, text, color, life, small) {
    d.floats.push({ x: x, y: y, text: text, color: color, life: life || 1.5, small: !!small });
  }

  function step(ent, dist, id) {
    ent.stepAcc = (ent.stepAcc || 0) + dist;
    const gap = id === 'step.jiang' ? C.stepDist : C.stepDistGuest;
    if (ent.stepAcc < gap) return;
    ent.stepAcc -= gap;

    if (id !== 'step.jiang') {
      if (d.stepCool > 0) return;
      d.stepCool = C.stepGuestGap;
    }
    Sfx.play(id);
  }

  function say(who, key, x, y) {
    const line = GameData.talk(who, key);
    if (!line) return;
    float(x, y, line, '#e0d6c0', 2.6, true);
  }

  function updateHint() {
    const p = d.player;
    if (d.panel) { d.hint = '按数字键或直接点，Esc 取消'; return; }
    if (p.carry) {
      const g = bestTarget(p.carry);
      const dish = GameData.dish(p.carry.dishId);
      if (g) {
        const h = hitCount(p.carry.dishId, g);
        d.hint = h >= 2 ? '上菜（全中，1.2 倍）' : (h === 1 ? '上菜' : '上菜（不合口味，只给一半）');
      }
      else d.hint = '端着' + dish.name + '，找想吃' + dish.attrs.map(GameData.attrName).join('或') + '的客人';
      return;
    }
    if (nearHatch()) { d.hint = '取外卖'; return; }
    if (nearestReady(p) >= 0) { d.hint = '取餐'; return; }
    const g = nearestAtTable(d.guests.filter(x => x.state === 'seated'))
           || nearestAtTable(d.guests.filter(x => x.state === 'waiting'));
    d.hint = g ? (g.order ? '改单（他已经点过 ' + GameData.dish(g.order).name + '）' : '点单') : '';
  }

  function end() {
    d.running = false;
    Sfx.stopAll();
    State.s.history.push({
      day: State.s.day, income: d.stats.income, served: d.stats.served,
      angry: d.stats.angry, aff: d.stats.aff, matched: d.stats.matched
    });
    d.stats.event = d.event;
    Game.toNight(d.stats);
  }

  return { d: d, start, update, interact, discard, choose, closePanel, readySlotPos, hatchSlotPos, acceptable, hitCount, comboMult, comboRatio };
})();
