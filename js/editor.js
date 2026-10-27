/* Editor de código ligero: textarea + capa resaltada */
(function (global) {
  'use strict';
  const LH = 21, PAD = 12;

  function createEditor(opts) {
    const o = Object.assign({ value: '', lang: 'jsx', minH: 84, maxH: 460, fill: false, readOnly: false, onChange: null, onRun: null }, opts);
    const root = document.createElement('div');
    root.className = 'editor' + (o.fill ? ' fill' : '');
    const gutter = document.createElement('div'); gutter.className = 'ed-gutter';
    const gin = document.createElement('pre'); gutter.appendChild(gin);
    const body = document.createElement('div'); body.className = 'ed-body';
    const hl = document.createElement('pre'); hl.className = 'ed-hl'; hl.setAttribute('aria-hidden', 'true');
    const code = document.createElement('code'); hl.appendChild(code);
    const ta = document.createElement('textarea');
    ta.className = 'ed-ta'; ta.spellcheck = false; ta.wrap = 'off';
    ta.setAttribute('autocapitalize', 'off'); ta.setAttribute('autocomplete', 'off'); ta.setAttribute('autocorrect', 'off');
    ta.setAttribute('aria-label', 'Editor de código'); ta.readOnly = o.readOnly;
    body.append(hl, ta); root.append(gutter, body);

    function refresh() {
      const v = ta.value;
      code.innerHTML = global.Highlight.highlight(v, o.lang) + '\n';
      const n = v.split('\n').length;
      let g = ''; for (let i = 1; i <= n; i++) g += i + '\n';
      gin.textContent = g;
      if (!o.fill) root.style.height = Math.min(o.maxH, Math.max(o.minH, n * LH + PAD * 2 + 6)) + 'px';
    }
    function syncScroll() {
      code.style.transform = 'translate(' + -ta.scrollLeft + 'px,' + -ta.scrollTop + 'px)';
      gin.style.transform = 'translateY(' + -ta.scrollTop + 'px)';
    }
    ta.addEventListener('scroll', syncScroll);
    ta.addEventListener('input', () => { refresh(); if (o.onChange) o.onChange(ta.value); });
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (o.onRun) o.onRun(); return; }
      const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
      const apply = (nv, ns, ne) => { ta.value = nv; ta.selectionStart = ns; ta.selectionEnd = ne; refresh(); if (o.onChange) o.onChange(nv); };
      if (e.key === 'Tab') {
        e.preventDefault();
        const ls = v.lastIndexOf('\n', s - 1) + 1;
        if (s !== en || e.shiftKey) {
          const blockEnd = en;
          const seg = v.slice(ls, blockEnd);
          if (e.shiftKey) {
            const out = seg.replace(/^ {1,2}/gm, '');
            apply(v.slice(0, ls) + out + v.slice(blockEnd), Math.max(ls, s - Math.min(2, (seg.match(/^ {1,2}/) || [''])[0].length)), ls + out.length);
          } else {
            const out = seg.replace(/^/gm, '  ');
            apply(v.slice(0, ls) + out + v.slice(blockEnd), s + 2, ls + out.length);
          }
        } else apply(v.slice(0, s) + '  ' + v.slice(en), s + 2, s + 2);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const ls = v.lastIndexOf('\n', s - 1) + 1;
        const line = v.slice(ls, s);
        let ind = (line.match(/^\s*/) || [''])[0];
        const prev = v[s - 1], next = v[en];
        let extra = '';
        if (/[{(\[]/.test(prev || '') ) extra = '  ';
        if (extra && /[})\]]/.test(next || '')) {
          const ins = '\n' + ind + extra + '\n' + ind;
          apply(v.slice(0, s) + ins + v.slice(en), s + 1 + ind.length + extra.length, s + 1 + ind.length + extra.length);
        } else {
          const ins = '\n' + ind + extra;
          apply(v.slice(0, s) + ins + v.slice(en), s + ins.length, s + ins.length);
        }
      }
    });
    ta.value = o.value;
    refresh();
    return {
      el: root, ta,
      getValue: () => ta.value,
      setValue: (v) => { ta.value = v; refresh(); syncScroll(); },
      focus: () => ta.focus(),
      refresh,
    };
  }
  global.CodeEditor = { create: createEditor };
})(window);
