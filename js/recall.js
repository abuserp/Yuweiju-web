const Recall = (function () {
  let root = null;
  let browseId = null, browseIdx = 0;

  function init(el) { root = el; }

  function open() {
    browseId = null; browseIdx = 0;
    root.hidden = false;
    render();
  }
  function close() { root.hidden = true; }

  function sceneList() {
    const out = [];
    Mods.specials().forEach(def => {
      def.stages.forEach((st, i) => {
        out.push({ label: def.name + ' · 第 ' + (i + 1) + ' 次到访', lines: st.lines });
      });
    });
    return out;
  }

  function portraitChars() {
    return Object.keys(Assets.MANIFEST).filter(id => Assets.hasPortrait(id));
  }
  function portraitLooks(id) {
    const m = Assets.MANIFEST[id];
    if (m && m.portraits && m.portraits.length) return m.portraits;
    return ['normal'];
  }

  function render() {
    const scenes = sceneList();
    let html = '<h2>剧情回想</h2><p class="hint">重温来客故事，播放结束后返回标题。回想不会影响游戏进度。</p>';
    html += scenes.length
      ? '<div class="recall-list">' + scenes.map((s, i) =>
          `<button data-scene="${i}">${s.label}</button>`).join('') + '</div>'
      : '<p class="hint">还没有任何特殊客人剧情。</p>';

    html += '<h2>立绘浏览</h2><p class="hint">选择角色，欣赏不同的表情与姿态。</p>';
    const chars = portraitChars();
    html += chars.length
      ? '<div class="recall-chars">' + chars.map(id =>
          `<button data-char="${id}" class="${id === browseId ? 'on' : ''}">${id}</button>`).join('') + '</div>'
      : '<p class="hint">暂无角色立绘。</p>';

    if (browseId) {
      const looks = portraitLooks(browseId);
      const look = looks[Math.min(browseIdx, looks.length - 1)];
      html += `
      <div class="recall-browse">
        <div class="recall-portrait-box" id="recall-portrait"></div>
        <div class="recall-browse-bar">
          <button id="browse-prev" ${looks.length <= 1 ? 'disabled' : ''}>‹</button>
          <span class="recall-file">${browseIdx + 1}/${looks.length} · ${look}</span>
          <button id="browse-next" ${looks.length <= 1 ? 'disabled' : ''}>›</button>
        </div>
      </div>`;
    }

    html += '<div class="title-actions"><button id="recall-close" class="ghost">关闭</button></div>';
    root.innerHTML = html;
    bind(scenes);

    if (browseId) {
      const looks = portraitLooks(browseId);
      const look = looks[Math.min(browseIdx, looks.length - 1)];
      const box = root.querySelector('#recall-portrait');
      Assets.paintPortrait(box, { char: browseId, look });
    }
  }

  function bind(scenes) {
    root.querySelectorAll('[data-scene]').forEach(b => {
      b.onclick = () => { close(); Game.playPreview(scenes[+b.dataset.scene].lines); };
    });
    root.querySelectorAll('[data-char]').forEach(b => {
      b.onclick = () => { browseId = b.dataset.char; browseIdx = 0; render(); };
    });
    const prev = root.querySelector('#browse-prev');
    if (prev) prev.onclick = () => {
      const n = portraitLooks(browseId).length;
      browseIdx = (browseIdx - 1 + n) % n; render();
    };
    const next = root.querySelector('#browse-next');
    if (next) next.onclick = () => {
      const n = portraitLooks(browseId).length;
      browseIdx = (browseIdx + 1) % n; render();
    };
    const closeBtn = root.querySelector('#recall-close');
    if (closeBtn) closeBtn.onclick = close;
  }

  return { init, open, close };
})();
