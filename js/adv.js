const ADV = (function () {
  const SPEED = 22;
  const FADE = 200;
  const BG_DELAY = 500;
  const BG_FADE = 900;

  const OFFSETS = {
    fade:       { x: '0',    y: '6px' },
    slideLeft:  { x: '-140%', y: '0' },
    slideRight: { x: '140%',  y: '0' }
  };
  let el = {};
  let lines = [], idx = 0, done = null, preview = false;
  let typing = false, timer = null, shown = 0;
  let lastKey = null, lastLine = null, fadeTimer = null;
  let bgTimer = null;
  let bgReady = false;
  let holding = false, holdTimer = null;

  function init(root) {
    el.root = root;
    root.innerHTML = `
      <div class="adv-bg" id="adv-bg"></div>
      <div class="adv-stage">
        <div class="adv-portrait" id="adv-portrait"><div class="adv-portrait-inner"></div></div>
      </div>
      <div class="adv-box" id="adv-box">
        <div class="adv-name" id="adv-name"></div>
        <p class="adv-text" id="adv-text"></p>
        <div class="adv-choices" id="adv-choices"></div>
        <span class="adv-next" id="adv-next">▼</span>
      </div>`;
    el.bg = root.querySelector('#adv-bg');
    el.portrait = root.querySelector('#adv-portrait');
    el.portraitInner = root.querySelector('.adv-portrait-inner');
    el.name = root.querySelector('#adv-name');
    el.text = root.querySelector('#adv-text');
    el.choices = root.querySelector('#adv-choices');
    el.next = root.querySelector('#adv-next');
    root.addEventListener('click', e => {
      if (e.target.closest('.adv-choices')) return;
      advance();
    });
  }

  function play(script, onDone, opts) {
    lines = script || [];
    idx = 0;
    done = onDone || function () {};
    preview = !!(opts && opts.preview);
    lastKey = null;
    lastLine = null;
    showPortrait();
    clearTimeout(fadeTimer);

    Bgm.stop();
    holding = false;
    clearTimeout(holdTimer);
    Sfx.stopAll();

    if (!lines.length) { done(); return; }

    el.text.textContent = '';
    el.name.textContent = ''; el.name.style.display = 'none';
    el.choices.innerHTML = ''; el.choices.hidden = true;
    el.next.hidden = true;
    el.portraitInner.innerHTML = '';
    el.portraitInner.style.background = 'transparent';

    bgReady = false;
    const startTalking = () => { bgReady = true; render(); };
    if (el.bg) {
      el.bg.classList.remove('in');
      clearTimeout(bgTimer);
      bgTimer = setTimeout(() => {
        if (el.bg) el.bg.classList.add('in');
        bgTimer = setTimeout(startTalking, BG_FADE);
      }, BG_DELAY);
    } else {
      startTalking();
    }
  }

  function keyFor(l) {
    if (!l.who) return '__narration__';
    if (l.portrait) return 'p:' + l.portrait;
    if (l.char && Assets.hasPortrait(l.char)) return 'c:' + l.char + '/' + (l.look || '');
    return 'block:' + (l.color || '') + '/' + l.who;
  }

  function paintPortrait(l) {
    el.portrait.className = 'adv-portrait ' + (l.side === 'right' ? 'right' : 'left');
    if (!l.who || l.noPortrait) {
      el.portraitInner.style.background = 'transparent';
      el.portraitInner.innerHTML = '';
    } else if (l.portrait || (l.char && Assets.hasPortrait(l.char))) {
      const src = l.portrait || Assets.portraitUrl(l.char, l.look);
      el.portraitInner.style.background = 'transparent';

      const fbColor = l.color || '#3a3f4a', fbName = (l.who || '').replace(/'/g, "\\'");
      el.portraitInner.innerHTML = '<img src="' + src + '" alt="" onerror="' +
        "this.parentNode.style.background='" + fbColor + "';" +
        "this.parentNode.innerHTML='<span>" + fbName + "</span>';" +
        '">';
    } else {

      el.portraitInner.style.background = l.color || '#3a3f4a';
      el.portraitInner.innerHTML = '<span>' + (l.who || '') + '</span>';
    }
  }

  function styleName(v) {
    if (v === true) return 'fade';
    if (typeof v === 'string' && OFFSETS[v]) return v;
    return null;
  }

  function hidePortrait(name) {
    const o = OFFSETS[name] || OFFSETS.fade;
    el.portraitInner.style.opacity = '0';
    el.portraitInner.style.transform = 'translate(' + o.x + ', ' + o.y + ')';
  }

  function showPortrait() {
    el.portraitInner.style.opacity = '';
    el.portraitInner.style.transform = '';
  }

  function snapStyle(fn) {
    const t = el.portraitInner.style.transition;
    el.portraitInner.style.transition = 'none';
    fn();
    void el.portraitInner.offsetHeight;
    el.portraitInner.style.transition = t;
  }

  function swapPortrait(l) {
    const key = keyFor(l);
    if (key === lastKey) { lastLine = l; return; }
    clearTimeout(fadeTimer);

    const exitStyle = lastKey === null ? null : styleName(lastLine && lastLine.exit);
    const enterStyle = styleName(l.fx);

    const doEnter = () => {
      paintPortrait(l);
      if (enterStyle) {

        snapStyle(() => hidePortrait(enterStyle));
        requestAnimationFrame(() => requestAnimationFrame(showPortrait));
      } else {
        snapStyle(showPortrait);
      }
    };

    if (exitStyle) {
      hidePortrait(exitStyle);
      fadeTimer = setTimeout(doEnter, FADE);
    } else {
      doEnter();
    }
    lastKey = key;
    lastLine = l;
  }

  function render() {
    const l = lines[idx];
    if (!l) { finish(); return; }

    if (l.sfx) (Array.isArray(l.sfx) ? l.sfx : [l.sfx]).forEach(id => Sfx.play(id));
    if (l.bgm) Bgm.play(l.bgm);
    if (l.bgmStop) Bgm.stop();
    if (l.loopStart) {
      const spec = typeof l.loopStart === 'string' ? { id: l.loopStart } : l.loopStart;
      Sfx.loop(spec.id, true, null, false, spec.vol);
    }
    if (l.loopStop) Sfx.loop(l.loopStop, false);

    el.name.textContent = l.who || '';
    el.name.style.display = l.who ? '' : 'none';
    swapPortrait(l);

    el.choices.innerHTML = '';
    el.choices.hidden = true;
    el.next.hidden = true;

    shown = 0;
    typing = true;
    el.text.className = 'adv-text' + (l.who ? '' : ' narration');
    el.text.textContent = '';
    clearInterval(timer);
    timer = setInterval(() => {
      shown++;
      el.text.textContent = l.text.slice(0, shown);
      if (shown >= l.text.length) { clearInterval(timer); typing = false; afterType(l); }
    }, SPEED);
  }

  function afterType(l) {
    if (l.choices && l.choices.length) {
      el.choices.hidden = false;
      l.choices.forEach(c => {
        const b = document.createElement('button');
        b.textContent = c.text;
        b.onclick = ev => { ev.stopPropagation(); choose(c); };
        el.choices.appendChild(b);
      });
    } else if (l.hold) {

      holding = true;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => { holding = false; el.next.hidden = false; }, l.hold);
    } else {
      el.next.hidden = false;
    }
  }

  function choose(c) {
    if (!preview) {
      if (c.affection) State.addAffection(c.affection);
      if (c.flag) State.s.flags[c.flag] = true;
    }
    if (typeof c.goto === 'number') idx = c.goto; else idx++;
    render();
  }

  function advance() {
    const l = lines[idx];
    if (!l) { finish(); return; }
    if (!bgReady) return;
    if (holding) return;
    Sfx.play('ui.talk');
    if (typing) {
      clearInterval(timer);
      typing = false;
      el.text.textContent = l.text;
      afterType(l);
      return;
    }
    if (l.choices && l.choices.length) return;
    idx++;
    if (idx >= lines.length) finish(); else render();
  }

  function finish() {
    clearInterval(timer);
    clearTimeout(fadeTimer);
    clearTimeout(holdTimer);
    clearTimeout(bgTimer);
    holding = false;
    Sfx.stopAll();
    const cb = done;
    done = null;
    lines = [];
    if (cb) cb();
  }

  return { init, play, advance };
})();
