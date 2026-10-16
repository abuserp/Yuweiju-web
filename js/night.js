const Night = (function () {
  let root = null;
  let lastStats = null;
  let line = '';
  let firstPaint = true;
  let cart = {};
  let view = 'settle';
  const lastPress = new Map();

  function init(el) { root = el; }

  function open(stats) {
    firstPaint = true;
    view = 'settle';
    cart = {};
    lastPress.clear();
    lastStats = stats;
    line = openingLine();
    State.spoil();
    render();
  }

  function openingLine() {
    const stock = GameData.STOCK_KEYS;
    const ing = GameData.ING[stock[Math.floor(Math.random() * stock.length)]].name;
    const lines = [
      '再凑出三千块，我们这小店这个月就还不至于倒闭。',
      '不让讨账就得挣钱，苦也。',
      '今日早市的' + ing + '挺新鲜，大厨，怎么说？',
      '大厨，买多了我再给那边送去嘛。',
      '王叔，你这鳞看着不错啊。'
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  function attrTags(dish) {
    return dish.attrs.map(a =>
      `<i class="tag" style="background:${GameData.ATTR[a].color}">${GameData.ATTR[a].name}</i>`).join('');
  }

  function render() {
    if (view === 'settle') renderSettle(); else renderMarket();
  }

  function renderSettle() {
    const s = State.s;
    const aff = State.affLevel();
    const slots = State.menuSlots();
    const nextAff = aff.next;
    let html = '';

    if (lastStats) {
      html += `
      <section class="ledger">
        <h2>第 ${s.day - 1} 天 打烊</h2>
        <div class="ledger-grid">
          <div><span class="num">${lastStats.income}</span><label>进账</label></div>
          <div><span class="num">${lastStats.served}</span><label>招待</label></div>
          <div><span class="num">${lastStats.matched}</span><label>对味</label></div>
          <div><span class="num ${lastStats.angry ? 'bad' : ''}">${lastStats.angry}</span><label>拂袖而去</label></div>
          <div><span class="num ${lastStats.aff < 0 ? 'bad' : 'good'}">${lastStats.aff > 0 ? '+' : ''}${lastStats.aff}</span><label>余的默契</label></div>
          <div><span class="num bad">−${lastStats.rent || 0}</span><label>灯油房租</label></div>
          <div><span class="num bad">−${(lastStats.staple && lastStats.staple.total) || 0}</span><label>米面香料</label></div>
        </div>
        <p class="hint">今夜净收 ${lastStats.income - (lastStats.rent || 0) - ((lastStats.staple && lastStats.staple.total) || 0)}。${s.money <= 0 ? '钱箱空了，明天得省着卖。' : ''}</p>
        ${lastStats.ignored ? `<p class="hint bad-note">${lastStats.ignored} 进了门，一直没人招呼，坐了坐就走了。</p>` : ''}
        <p class="lede">“${line}”</p>
      </section>`;
    } else {
      html += `<section class="ledger"><h2>开张</h2>
        <p class="lede">“${line}”</p></section>`;
    }

    if (s.spoiled && s.spoiled.length) {
      html += `<section class="spoil"><h3>临期食品处置</h3><p>` +
        s.spoiled.map(x => `${GameData.ING[x.id].name} ×${x.n}`).join('　') +
        `</p><p class="hint">再放就要坏了，趁还能吃做成菜送到福利院吧。</p></section>`;
    }

    if (s.newDishes && s.newDishes.length) {
      html += `<section class="newdish"><h3>新菜</h3>` + s.newDishes.map(n => {
        const dd = GameData.dish(n.id);
        if (!dd) return '';
        const why = n.why === 'mastery'
          ? `${GameData.dish(n.from) ? GameData.dish(n.from).name : ''} 做得多了，余顺手琢磨出来的`
          : `${n.who || '客人'} 传的方子`;
        return `<p><b>${dd.name}</b> ${attrTags(dd)} <span class="hint">${why}</span></p>`;
      }).join('') + `</section>`;
      s.newDishes = [];
    }

    html += `
    <section class="yu">
      <h3>余 · ${aff.level.title}</h3>
      <div class="yu-meta">
        <span>出菜速度 ×${aff.level.cookSpeed.toFixed(2)}</span>
        <span>菜牌 ${slots}/${GameData.SLOTS.length} 格</span>
        <span>默契 ${s.affection}</span>
      </div>
      ${nextAff ? `<div class="progress"><i style="width:${Math.min(100, Math.max(0, (s.affection - aff.level.at) / (nextAff.at - aff.level.at) * 100))}%"></i></div>
      <p class="hint">再攒 ${Math.max(0, nextAff.at - s.affection)} 点默契，大厨就肯多信你几分（${nextAff.title}）。</p>` :
      `<p class="hint">你报菜名，他手已经动了。</p>`}
    </section>`;

    html += `
    <div class="night-foot">
      <span class="foot-note"></span>
      <button id="to-market">去早市</button>
    </div>`;

    const keepScroll = root.scrollTop;
    const list = root.querySelector('.menu-list');
    const keepList = list ? list.scrollTop : 0;
    root.innerHTML = html;
    root.scrollTop = firstPaint ? 0 : keepScroll;
    const list2 = root.querySelector('.menu-list');
    if (list2 && !firstPaint) list2.scrollTop = keepList;
    firstPaint = false;
    bind();
  }

  function renderMarket() {
    const s = State.s;
    const aff = State.affLevel();
    const slots = State.menuSlots();
    let html = '';

    const live = State.availableAttrs();
    html += `<section><h3>九味 <em>${live.length}/9</em></h3><div class="attr-key">`;
    Object.keys(GameData.ATTR).forEach(k => {
      const on = live.indexOf(k) >= 0;
      html += `<i class="tag ${on ? '' : 'off'}" style="${on ? 'background:' + GameData.ATTR[k].color : ''}">${GameData.ATTR[k].name}</i>`;
    });
    html += `</div><p class="hint">学会新菜，新的味道才会被客人考虑。</p></section>`;

    html += `<div class="purse-bar"><span class="purse">${s.money}</span><span class="unit">龙门币</span></div>`;

    const cartCost = Object.keys(cart).reduce((a, k) => a + cart[k] * GameData.ING[k].price, 0);
    const cartCount = Object.keys(cart).reduce((a, k) => a + cart[k], 0);
    html += `<section><h3>进货</h3><div class="stock">`;
    GameData.STOCK_KEYS.forEach(k => {
      const ing = GameData.ING[k];
      const gone = State.expiringToday(k);
      const want = cart[k] || 0;
      const shelfTag = gone
        ? `<span class="shelf warn">${gone} 份撑不过明晚</span>`
        : `<span class="shelf">保鲜 ${ing.shelf} 天</span>`;
      html += `
      <div class="stock-row">
        <div class="stock-info">
        <i class="swatch" style="background:${ing.color}"></i>
        <span class="nm">${ing.name}</span>
        <span class="pc">${ing.price} / 份</span>
        <span class="have">现有 ${State.count(k)}</span>
        ${shelfTag}
        </div>
        <div class="stock-controls">
        <button data-cart="${k}" data-n="-1" aria-label="减少${ing.name}一份" ${want ? '' : 'disabled'}>−</button>
        <span class="qty ${want ? 'want' : ''}">${want}</span>
        <button data-cart="${k}" data-n="1" aria-label="增加${ing.name}一份">+</button>
        <button data-cart="${k}" data-n="5" class="wide" aria-label="增加${ing.name}五份">+5</button>
        </div>
      </div>`;
    });
    const afford = cartCost <= s.money;
    const bill = State.stapleBill();
    html += `</div>
      <div class="cart-foot">
        <span class="cart-sum ${afford ? '' : 'bad'}">${cartCount ? `要买 ${cartCount} 份，计 ${cartCost}` : '还没点要买什么'}</span>
        <button id="cart-clear" class="ghost" ${cartCount ? '' : 'disabled'}>清空</button>
        <button id="cart-buy" ${cartCount && afford ? '' : 'disabled'}>购买</button>
      </div>
      <p class="hint">${afford ? '' : '钱不够，先减几份。'}食材只进不出，点了「购买」才扣钱。米面和香料常备不断，用多少当天一并结账${bill.total ? `（昨日 ${bill.total}）` : ''}。</p></section>`;

    const nx = State.nextSlot();
    html += `<section><h3>菜牌格子 <em>${slots}/${GameData.SLOTS.length}</em></h3>`;
    if (!nx) {
      html += `<p class="hint">十格全盘下来了，想上什么就上什么。</p>`;
    } else {
      const why = !nx.affOk
        ? `大厨嫌你还接不住，默契到 ${nx.need} 再说（现在 ${s.affection}）`
        : (!nx.moneyOk ? `钱不够，还差 ${nx.price - s.money}` : '');
      html += `
      <div class="slot-buy">
        <span class="slot-info">第 ${nx.index} 格 · <b>${nx.price}</b> 龙门币${nx.need ? `，默契 ${nx.need}` : ''}</span>
        <button id="buy-slot" ${nx.affOk && nx.moneyOk ? '' : 'disabled'}>盘下来</button>
      </div>
      <p class="hint">${why || '多一格就多一道菜，能接住的口味也多一种。'}</p>`;
    }
    html += `</section>`;

    html += `<section><h3>今日菜牌 <em>${s.menu.length}/${slots}</em></h3><div class="menu-list">`;

    const ordered = GameData.DISHES.slice().sort((a, b) =>
      (s.menu.indexOf(b.id) >= 0 ? 1 : 0) - (s.menu.indexOf(a.id) >= 0 ? 1 : 0));
    ordered.forEach(dish => {
      const open = State.isUnlocked(dish);
      if (!open && GameData.hiddenUntilUnlocked(dish)) return;
      const on = s.menu.indexOf(dish.id) >= 0;
      const cost = Object.keys(dish.cost).map(k => `${GameData.ING[k].name}×${dish.cost[k]}`).join(' ');
      let note;
      if (open) note = cost;
      else note = GameData.unlockText(dish);
      html += `
      <button class="dish ${on ? 'on' : ''} ${open ? '' : 'locked'}" ${open ? `data-dish="${dish.id}"` : 'disabled'}>
        <span class="dish-name">${dish.name}</span>
        <span class="dish-attrs">${attrTags(dish)}</span>
        <span class="dish-cost">${note}</span>
        <span class="dish-price">${dish.price}</span>
      </button>`;
    });
    html += `</div></section>`;

    html += `
    <div class="night-foot">
      <span class="foot-note">${s.menu.length ? '' : '菜牌是空的，至少上一道菜。'}</span>
      <button id="open-shop" ${s.menu.length ? '' : 'disabled'}>开门营业</button>
    </div>`;

    const keepScroll = root.scrollTop;
    const list = root.querySelector('.menu-list');
    const keepList = list ? list.scrollTop : 0;
    root.innerHTML = html;
    root.scrollTop = firstPaint ? 0 : keepScroll;
    const list2 = root.querySelector('.menu-list');
    if (list2 && !firstPaint) list2.scrollTop = keepList;
    firstPaint = false;
    bind();
  }

  function pressAction(btn, key, fn) {
    btn.onkeydown = e => {
      if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
    };
    btn.onclick = () => {
      if (btn.disabled) return;
      const now = performance.now();
      if (now - (lastPress.get(key) ?? -Infinity) < 300) return;
      lastPress.set(key, now);
      fn();
    };
  }

  function bind() {

    root.querySelectorAll('[data-cart]').forEach(b => {
      pressAction(b, 'cart:' + b.dataset.cart + ':' + b.dataset.n, () => {
        const k = b.dataset.cart;
        const n = parseInt(b.dataset.n, 10);
        cart[k] = Math.max(0, (cart[k] || 0) + n);
        if (!cart[k]) delete cart[k];
        Sfx.play('ui.buy');
        render();
      });
    });
    const clear = root.querySelector('#cart-clear');
    if (clear) clear.onclick = () => { cart = {}; Sfx.play('ui.cancel'); render(); };
    const buy = root.querySelector('#cart-buy');
    if (buy) pressAction(buy, 'buy', () => {
      const items = Object.keys(cart);
      const cost = items.reduce((sum, k) => sum + cart[k] * GameData.ING[k].price, 0);
      if (!items.length || cost > State.s.money) return;
      buy.disabled = true;
      items.forEach(k => State.buy(k, cart[k]));
      cart = {};
      Sfx.play('shop.buy');
      State.save();
      render();
    });
    root.querySelectorAll('[data-dish]').forEach(b => {
      b.onclick = () => {
        const id = b.dataset.dish;
        const i = State.s.menu.indexOf(id);
        if (i >= 0) State.s.menu.splice(i, 1);
        else if (State.s.menu.length < State.menuSlots()) State.s.menu.push(id);
        Sfx.play('ui.pick');
        State.save();
        render();
      };
    });
    const toMarket = root.querySelector('#to-market');
    if (toMarket) toMarket.onclick = () => {
      view = 'market';
      firstPaint = true;
      Sfx.play('ui.pick');
      render();
    };
    const slotBtn = root.querySelector('#buy-slot');
    if (slotBtn) pressAction(slotBtn, 'slot', () => {
      if (State.buySlot()) { Sfx.play('shop.buy'); State.save(); render(); }
    });
    const go = root.querySelector('#open-shop');
    if (go) go.onclick = () => { Game.toDay(); };
  }

  function goMarket() { view = 'market'; firstPaint = true; render(); }

  return { init, open, goMarket };
})();
