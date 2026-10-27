/* Aprende React — aplicación principal (router, vistas, progreso, búsqueda) */
(function () {
  'use strict';
  const { Markdown, Highlight, CodeEditor, Sandbox } = window;

  /* ------------------------------------------------------------------ utilidades */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    kids.flat(Infinity).forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  }
  const $ = (s, r) => (r || document).querySelector(s);
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  async function copyText(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const t = h('textarea', { style: 'position:fixed;opacity:0' }); t.value = text; document.body.append(t); t.select();
      try { document.execCommand('copy'); } catch (e2) {} t.remove();
    }
    if (btn) { const o = btn.textContent; btn.textContent = '✓ Copiado'; setTimeout(() => (btn.textContent = o), 1400); }
  }

  /* ------------------------------------------------------------------ datos */
  const LEVELS = [
    { id: '0', name: 'Preparación', icon: '🧭', desc: 'Qué es React, JavaScript moderno y tu entorno de trabajo.', cls: 'lv0' },
    { id: '1', name: 'Fundamentos', icon: '🌱', desc: 'JSX, componentes, props, estado, eventos, listas y formularios.', cls: 'lv1' },
    { id: '2', name: 'Intermedio', icon: '🚀', desc: 'Efectos, refs, reducers, contexto, hooks propios, rendimiento y enrutado.', cls: 'lv2' },
    { id: '3', name: 'Avanzado', icon: '🧠', desc: 'Patrones, estado global, React 19, Server Components, testing y arquitectura.', cls: 'lv3' },
    { id: 'ref', name: 'Referencia', icon: '📚', desc: 'Chuletas, errores comunes, glosario y siguientes pasos.', cls: 'lvr' },
  ];
  const levelOf = (id) => LEVELS.find((l) => l.id === String(id)) || LEVELS[0];

  const lessons = (window.__LESSONS_MD || []).map((f, i) => {
    const p = Markdown.parse(f.md);
    const m = p.meta;
    const blocks = p.blocks;
    const ex = [], qz = [];
    (function walk(bs) { bs.forEach((b) => { if (b.type === 'exercise') ex.push(b); if (b.type === 'quiz') qz.push(b); if (b.blocks) walk(b.blocks); }); })(blocks);
    const text = Markdown.plainText(blocks);
    return {
      i, id: m.id || f.file.replace(/^\d+-/, '').replace(/\.md$/, ''), nivel: String(m.nivel || '1'), titulo: m.titulo || f.file, icono: m.icono || '📘',
      tiempo: m.tiempo || '15 min', resumen: m.resumen || '', blocks, headings: p.headings, exercises: ex, quizzes: qz,
      nText: norm(m.titulo + ' ' + p.headings.map((x) => x.text).join(' ') + ' ' + text),
      nTitle: norm(m.titulo), text,
    };
  });
  const byId = Object.fromEntries(lessons.map((l) => [l.id, l]));
  const courseLessons = lessons.filter((l) => l.nivel !== 'ref');

  /* ------------------------------------------------------------------ progreso */
  const KEY = 'aprende-react:v1';
  let store = { done: {}, ex: {}, quiz: {}, last: null, theme: null };
  try { Object.assign(store, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) {} };

  function stats() {
    const total = courseLessons.length;
    const done = courseLessons.filter((l) => store.done[l.id]).length;
    const exTotal = courseLessons.reduce((a, l) => a + l.exercises.length, 0);
    const exDone = Object.keys(store.ex).filter((k) => store.ex[k]).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0, exTotal, exDone };
  }

  /* ------------------------------------------------------------------ tema */
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    const b = $('#themeBtn'); if (b) b.textContent = t === 'dark' ? '☀️' : '🌙';
  }
  const theme0 = store.theme || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  /* ------------------------------------------------------------------ consola */
  function consolePanel(opts) {
    opts = opts || {};
    const body = h('div', { class: 'console-body' });
    const clear = h('button', { class: 'mini', type: 'button', title: 'Limpiar consola' }, 'Limpiar');
    const el = h('div', { class: 'console' + (opts.alwaysVisible ? '' : ' empty') }, h('div', { class: 'console-head' }, h('span', null, '⌨ Consola'), clear), body);
    function render(r) {
      body.replaceChildren();
      r.logs.forEach((l) => body.append(h('div', { class: 'cl cl-' + l.level }, l.text)));
      r.errors.forEach((e) => body.append(h('div', { class: 'cl cl-fatal' }, '✖ ' + e)));
      const has = r.logs.length || r.errors.length;
      if (!has && opts.placeholder) body.append(h('div', { class: 'cl cl-hint' }, opts.placeholder));
      el.classList.toggle('empty', !has && !opts.alwaysVisible);
      body.scrollTop = body.scrollHeight;
    }
    return { el, render, clearBtn: clear };
  }

  /* ------------------------------------------------------------------ bloques de código */
  function staticCode(b) {
    const copy = h('button', { class: 'mini', type: 'button' }, 'Copiar');
    copy.addEventListener('click', () => copyText(b.code, copy));
    const label = b.title || (b.lang === 'text' ? '' : b.lang);
    const fig = h('figure', { class: 'code' + (b.lang === 'text' ? ' diagram' : '') });
    if (b.lang !== 'text') fig.append(h('div', { class: 'code-head' }, h('span', { class: 'dots' }, h('i'), h('i'), h('i')), h('span', { class: 'code-title' }, label), copy));
    fig.append(h('pre', null, h('code', { html: Highlight.highlight(b.code, b.lang) })));
    return fig;
  }

  /* Editor + vista previa reutilizable (ejemplos, ejercicios y playground) */
  function buildWorkbench(cfg) {
    const mode = cfg.lang === 'js' || cfg.lang === 'ts' ? 'js' : 'react';
    const host = h('div', { class: 'preview-host' });
    const cons = consolePanel(mode === 'js' ? { alwaysVisible: true, placeholder: 'Ejecuta el código para ver la salida…' } : {});
    const runner = new Sandbox.Runner({
      mode, host, fixedH: cfg.h || null, minH: cfg.minH || 70, maxH: cfg.maxH || 520,
      onUpdate: (r) => {
        cons.render(r);
        if (r.compileError) host.replaceChildren(h('div', { class: 'compile-error' }, h('strong', null, 'Error de sintaxis'), h('pre', null, r.compileError)));
      },
    });
    let editor;
    let timer = null;
    const doRun = () => runner.run(editor.getValue(), cfg.lang, cfg.css);
    editor = CodeEditor.create({
      value: cfg.value, lang: cfg.lang, fill: cfg.fill, minH: cfg.edMinH || 84, maxH: cfg.edMaxH || 460,
      onRun: doRun,
      onChange: (v) => { if (cfg.onChange) cfg.onChange(v); if (cfg.autoRun !== false) { clearTimeout(timer); timer = setTimeout(doRun, 750); } },
    });
    cons.clearBtn.addEventListener('click', () => { runner.logs = []; runner.errors = []; cons.render(runner); });
    const side = h('div', { class: 'wb-side' + (mode === 'js' ? ' js' : '') }, mode === 'js' ? null : h('div', { class: 'preview-label' }, 'Resultado'), mode === 'js' ? null : host, cons.el);
    if (mode === 'js') side.append(h('div', { style: 'display:none' }, host));
    const grid = h('div', { class: 'wb-grid' + (mode === 'js' ? ' js' : '') }, editor.el, side);
    return { grid, editor, runner, run: doRun, mode, cons };
  }

  function liveBlock(b, ctx) {
    const initial = b.code;
    const wb = buildWorkbench({ value: initial, lang: b.lang, h: b.h });
    const copy = h('button', { class: 'mini', type: 'button' }, 'Copiar');
    const reset = h('button', { class: 'mini', type: 'button' }, '↺ Restaurar');
    const play = h('button', { class: 'mini primary', type: 'button' }, '▶ Ejecutar');
    copy.addEventListener('click', () => copyText(wb.editor.getValue(), copy));
    reset.addEventListener('click', () => { wb.editor.setValue(initial); wb.run(); });
    play.addEventListener('click', wb.run);
    const sec = h('section', { class: 'live' },
      h('div', { class: 'code-head' }, h('span', { class: 'dots' }, h('i'), h('i'), h('i')), h('span', { class: 'code-title' }, b.title || (wb.mode === 'js' ? 'JavaScript · editable' : 'Ejemplo interactivo · editable')), h('span', { class: 'spacer' }), copy, reset, play),
      wb.grid);
    let started = false;
    const start = () => { if (!started) { started = true; wb.run(); } };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '200px' });
      io.observe(sec);
    } else start();
    sec._start = start;
    return sec;
  }

  /* ------------------------------------------------------------------ ejercicios */
  function exerciseBlock(b, ctx) {
    const idx = ctx.ex++;
    const exKey = ctx.lesson.id + '#' + idx;
    const codeKey = 'code:' + exKey;
    const saved = lsGet(codeKey);
    const wb = buildWorkbench({
      value: saved != null ? saved : b.starter, lang: b.lang, css: b.css, h: b.h || null, autoRun: true, edMinH: 130,
      onChange: (v) => lsSet(codeKey, v),
    });
    const status = h('span', { class: 'badge-status' + (store.ex[exKey] ? ' ok' : '') }, store.ex[exKey] ? '✓ Completado' : 'Pendiente');
    const results = h('ul', { class: 'ex-results' });
    const hintBox = h('div', { class: 'ex-hints' });
    const solBox = h('div', { class: 'ex-solution', hidden: true });
    let hintN = 0;

    const run = h('button', { class: 'btn', type: 'button' }, '▶ Ejecutar');
    const check = h('button', { class: 'btn primary', type: 'button' }, '✔ Comprobar');
    const hint = h('button', { class: 'btn ghost', type: 'button' }, b.hints.length ? '💡 Pista' : '💡 Pista');
    const sol = h('button', { class: 'btn ghost', type: 'button' }, '👁 Ver solución');
    const reset = h('button', { class: 'btn ghost', type: 'button' }, '↺ Reiniciar');
    if (!b.hints.length) hint.hidden = true;

    run.addEventListener('click', wb.run);
    check.addEventListener('click', async () => {
      check.disabled = true; check.textContent = 'Comprobando…';
      results.replaceChildren();
      await wb.run();
      await Sandbox.wait(120);
      const res = await Sandbox.runChecks(wb.runner, b.checks || '');
      res.forEach((r) => results.append(h('li', { class: r.ok ? 'pass' : 'fail' }, h('span', { class: 'mark' }, r.ok ? '✓' : '✗'), r.desc)));
      const all = res.length && res.every((r) => r.ok);
      if (all) {
        results.append(h('li', { class: 'celebrate' }, '🎉 ¡Excelente! Ejercicio resuelto.'));
        if (!store.ex[exKey]) { store.ex[exKey] = true; save(); refreshNav(); }
        status.textContent = '✓ Completado'; status.classList.add('ok');
      } else if (!res.length) results.append(h('li', { class: 'fail' }, 'Este ejercicio no tiene comprobaciones automáticas.'));
      check.disabled = false; check.textContent = '✔ Comprobar';
    });
    hint.addEventListener('click', () => {
      if (hintN < b.hints.length) {
        hintBox.append(h('div', { class: 'hint' }, h('strong', null, 'Pista ' + (hintN + 1) + ': '), h('span', { html: Markdown.inline(b.hints[hintN]) })));
        hintN++;
      }
      if (hintN >= b.hints.length) hint.disabled = true;
    });
    sol.addEventListener('click', () => {
      if (!solBox.hidden) { solBox.hidden = true; sol.textContent = '👁 Ver solución'; return; }
      solBox.replaceChildren(
        h('div', { class: 'sol-head' }, h('strong', null, 'Solución propuesta'),
          h('button', { class: 'mini', type: 'button', onclick: () => { wb.editor.setValue(b.solution); lsSet(codeKey, b.solution); wb.run(); } }, 'Usar en mi editor')),
        staticCode({ code: b.solution, lang: b.lang }),
        h('p', { class: 'muted small' }, 'Intenta entender cada línea antes de copiarla: hay muchas formas válidas de resolverlo.'));
      solBox.hidden = false; sol.textContent = '🙈 Ocultar solución';
    });
    reset.addEventListener('click', () => { wb.editor.setValue(b.starter); lsDel(codeKey); results.replaceChildren(); wb.run(); });

    const intro = h('div', { class: 'ex-intro' });
    renderBlocks(b.intro, intro, ctx);
    const sec = h('section', { class: 'exercise' },
      h('header', { class: 'ex-head' }, h('span', { class: 'ex-ico' }, '🏋️'), h('div', null, h('div', { class: 'ex-kicker' }, 'Práctica ' + (idx + 1)), h('h4', null, b.title)), status),
      intro, wb.grid, h('div', { class: 'ex-actions' }, run, check, hint, sol, reset), results, hintBox, solBox);
    let started = false;
    const start = () => { if (!started) { started = true; wb.run(); } };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '200px' });
      io.observe(sec);
    } else start();
    sec._wb = wb; sec._ex = b;
    return sec;
  }

  /* ------------------------------------------------------------------ quiz */
  function quizBlock(b, ctx) {
    const idx = ctx.qz++;
    const key = ctx.lesson.id + '#' + idx;
    const total = b.questions.length;
    let answered = 0, correct = 0;
    const summary = h('div', { class: 'quiz-summary', hidden: true });
    const wrap = h('section', { class: 'quiz' }, h('header', { class: 'quiz-head' }, h('span', null, '🧪'), h('div', null, h('div', { class: 'ex-kicker' }, 'Comprueba lo aprendido'), h('h4', null, 'Quiz rápido'))));
    const cards = [];
    b.questions.forEach((q, qi) => {
      const fb = h('div', { class: 'q-feedback', hidden: true });
      const opts = q.opts.map((o, oi) => h('button', { class: 'q-opt', type: 'button' }, h('span', { class: 'q-letter' }, String.fromCharCode(65 + oi)), h('span', { html: Markdown.inline(o) })));
      const card = h('div', { class: 'q-card' }, h('div', { class: 'q-text' }, h('span', { class: 'q-num' }, qi + 1), h('span', { html: Markdown.inline(q.q) })), h('div', { class: 'q-opts' }, opts), fb);
      opts.forEach((btn, oi) => btn.addEventListener('click', () => {
        if (card.dataset.done) return;
        card.dataset.done = '1';
        answered++;
        const ok = oi === q.answer;
        if (ok) correct++;
        opts.forEach((x, xi) => { x.disabled = true; if (xi === q.answer) x.classList.add('right'); });
        if (!ok) btn.classList.add('wrong');
        fb.hidden = false; fb.className = 'q-feedback ' + (ok ? 'good' : 'bad');
        fb.innerHTML = '<strong>' + (ok ? '¡Correcto! ' : 'No exactamente. ') + '</strong>' + Markdown.inline(q.why || '');
        if (answered === total) {
          summary.hidden = false;
          summary.innerHTML = '<strong>Resultado: ' + correct + ' / ' + total + '</strong> ' + (correct === total ? '🎯 ¡Perfecto!' : correct >= total / 2 ? '👍 Vas bien, repasa lo que fallaste.' : '📖 Relee la lección y vuelve a intentarlo.');
          const retry = h('button', { class: 'mini', type: 'button', onclick: () => { const n = quizBlock(b, Object.assign({}, ctx, { qz: idx })); wrap.replaceWith(n); } }, '↺ Reintentar');
          summary.append(' ', retry);
          store.quiz[key] = { correct, total }; save(); refreshNav();
        }
      }));
      cards.push(card);
    });
    wrap.append(...cards, summary);
    return wrap;
  }

  /* ------------------------------------------------------------------ render genérico de bloques */
  const CALLOUT_ICON = { tip: '💡', info: 'ℹ️', warn: '⚠️', danger: '🚫', idea: '🤔', goal: '🎯', summary: '📝' };
  function renderBlocks(blocks, parent, ctx) {
    blocks.forEach((b) => {
      if (b.type === 'html') parent.insertAdjacentHTML('beforeend', b.html);
      else if (b.type === 'code') parent.append(b.run ? liveBlock(b, ctx) : staticCode(b));
      else if (b.type === 'callout') {
        const body = h('div', { class: 'callout-body' });
        renderBlocks(b.blocks, body, ctx);
        parent.append(h('aside', { class: 'callout callout-' + b.kind }, h('div', { class: 'callout-title' }, h('span', null, CALLOUT_ICON[b.kind] || '📌'), b.title), body));
      } else if (b.type === 'exercise') parent.append(exerciseBlock(b, ctx));
      else if (b.type === 'quiz') parent.append(quizBlock(b, ctx));
    });
  }

  /* ------------------------------------------------------------------ vistas */
  const view = () => $('#view');
  let tocObserver = null;

  function setView(node, title) {
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    view().replaceChildren(node);
    document.title = (title ? title + ' · ' : '') + 'Aprende React';
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.body.classList.remove('nav-open');
  }

  function progressBar(pct) { return h('div', { class: 'bar' }, h('i', { style: 'width:' + pct + '%' })); }

  function lessonStatusIcon(l) { return store.done[l.id] ? '✓' : ''; }

  function homeView() {
    const s = stats();
    const last = store.last && byId[store.last];
    const first = courseLessons[0];
    const next = courseLessons.find((l) => !store.done[l.id]) || first;
    const atom = '<svg class="atom" viewBox="-11.5 -10.23174 23 20.46348" aria-hidden="true"><circle r="2.05" fill="currentColor"/><g stroke="currentColor" stroke-width="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>';
    const hero = h('section', { class: 'hero' },
      h('div', { class: 'hero-text' },
        h('span', { class: 'pill' }, '⚛️ Curso interactivo · React 19'),
        h('h1', null, 'Aprende React ', h('span', { class: 'grad' }, 'de cero a avanzado')),
        h('p', { class: 'lead' }, 'Lecciones explicadas paso a paso, ejemplos que puedes editar y ejecutar en vivo, ejercicios con corrección automática y quizzes. Todo funciona en tu navegador, sin instalar nada.'),
        h('div', { class: 'hero-cta' },
          h('a', { class: 'btn primary lg', href: '#/leccion/' + (last && !store.done[last.id] ? last.id : next.id) }, s.done ? '▶ Continuar el curso' : '🚀 Empezar el curso'),
          h('a', { class: 'btn lg', href: '#/playground' }, '🧪 Abrir el Playground')),
        h('div', { class: 'hero-stats' },
          h('div', null, h('b', null, courseLessons.length), h('span', null, 'lecciones')),
          h('div', null, h('b', null, s.exTotal), h('span', null, 'ejercicios')),
          h('div', null, h('b', null, courseLessons.reduce((a, l) => a + l.quizzes.reduce((x, q) => x + q.questions.length, 0), 0)), h('span', null, 'preguntas de quiz')),
          h('div', null, h('b', null, s.pct + '%'), h('span', null, 'tu progreso')))),
      h('div', { class: 'hero-art', html: atom }));

    const how = h('section', { class: 'features' },
      feature('📖', 'Aprende', 'Cada lección explica el porqué, no solo el cómo, con analogías, diagramas y errores típicos.'),
      feature('⚡', 'Experimenta', 'Edita el código de los ejemplos y mira el resultado al instante con React 19 real.'),
      feature('🏋️', 'Practica', 'Ejercicios con comprobación automática, pistas progresivas y solución comentada.'),
      feature('🧪', 'Evalúa', 'Quizzes al final de cada tema y un proyecto final que integra todo lo aprendido.'));

    const path = h('section', { class: 'path' }, h('h2', null, 'Ruta de aprendizaje'),
      h('p', { class: 'muted' }, 'Sigue el orden: cada nivel se apoya en el anterior. Si ya sabes algo, salta directo a lo que te interese.'));
    LEVELS.forEach((lv) => {
      const ls = lessons.filter((l) => l.nivel === lv.id);
      if (!ls.length) return;
      const done = ls.filter((l) => store.done[l.id]).length;
      path.append(h('div', { class: 'level-card ' + lv.cls },
        h('div', { class: 'level-head' }, h('span', { class: 'level-ico' }, lv.icon), h('div', null, h('h3', null, lv.name), h('p', null, lv.desc)), lv.id !== 'ref' ? h('span', { class: 'level-count' }, done + '/' + ls.length) : null),
        lv.id !== 'ref' ? progressBar(Math.round((done / ls.length) * 100)) : null,
        h('div', { class: 'level-lessons' }, ls.map((l) => h('a', { href: '#/leccion/' + l.id, class: store.done[l.id] ? 'done' : '' }, h('span', { class: 'ico' }, l.icono), h('span', null, l.titulo), h('small', null, l.tiempo), store.done[l.id] ? h('i', { class: 'tick' }, '✓') : null)))));
    });
    return h('div', { class: 'home' }, hero, how, path);
  }
  function feature(i, t, d) { return h('div', { class: 'feature' }, h('div', { class: 'f-ico' }, i), h('h3', null, t), h('p', null, d)); }

  function lessonView(l) {
    store.last = l.id; save();
    const lv = levelOf(l.nivel);
    const idx = lessons.indexOf(l);
    const prev = lessons[idx - 1], next = lessons[idx + 1];
    const ctx = { lesson: l, ex: 0, qz: 0 };
    const body = h('div', { class: 'prose' });
    renderBlocks(l.blocks, body, ctx);

    const doneBtn = h('button', { class: 'btn ' + (store.done[l.id] ? 'success' : 'primary'), type: 'button' }, store.done[l.id] ? '✓ Lección completada' : '✓ Marcar como completada');
    doneBtn.addEventListener('click', () => {
      store.done[l.id] = !store.done[l.id]; save();
      doneBtn.className = 'btn ' + (store.done[l.id] ? 'success' : 'primary');
      doneBtn.textContent = store.done[l.id] ? '✓ Lección completada' : '✓ Marcar como completada';
      refreshNav();
    });
    const navCard = (lab, x, dir) => x ? h('a', { class: 'nav-card ' + dir, href: '#/leccion/' + x.id }, h('small', null, lab), h('strong', null, x.icono + ' ' + x.titulo)) : h('span');

    const toc = h('nav', { class: 'toc', 'aria-label': 'En esta página' }, h('div', { class: 'toc-title' }, 'En esta lección'),
      l.headings.map((x) => h('a', { href: '#', 'data-id': x.id, onclick: (e) => { e.preventDefault(); const t = document.getElementById(x.id); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, x.text.replace(/[`*]/g, ''))));

    const exInfo = l.exercises.length ? h('span', null, '🏋️ ' + l.exercises.length + ' ejercicio' + (l.exercises.length > 1 ? 's' : '')) : null;
    const article = h('article', { class: 'lesson' },
      h('header', { class: 'lesson-head ' + lv.cls },
        h('div', { class: 'crumbs' }, h('a', { href: '#/' }, 'Inicio'), ' / ', lv.icon + ' ' + lv.name),
        h('h1', null, h('span', { class: 'l-ico' }, l.icono), l.titulo),
        l.resumen ? h('p', { class: 'lead' }, l.resumen) : null,
        h('div', { class: 'meta' }, h('span', null, '⏱ ' + l.tiempo), exInfo, l.quizzes.length ? h('span', null, '🧪 Quiz') : null)),
      body,
      h('footer', { class: 'lesson-foot' }, h('div', { class: 'foot-done' }, doneBtn), h('div', { class: 'foot-nav' }, navCard('← Anterior', prev, 'prev'), navCard('Siguiente →', next, 'next'))));
    const wrap = h('div', { class: 'lesson-layout' }, article, l.headings.length > 1 ? toc : null);
    setView(wrap, l.titulo);

    if ('IntersectionObserver' in window && l.headings.length > 1) {
      const links = Array.from(toc.querySelectorAll('a'));
      tocObserver = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { links.forEach((a) => a.classList.toggle('active', a.dataset.id === e.target.id)); } });
      }, { rootMargin: '-80px 0px -70% 0px' });
      l.headings.forEach((x) => { const t = document.getElementById(x.id); if (t) tocObserver.observe(t); });
    }
    markNav(l.id);
  }

  /* ---- Playground ---- */
  const PG = [
    ['Hola mundo', `function App() {
  const nombre = 'React';
  return (
    <div className="card">
      <h1>¡Hola, {nombre}! 👋</h1>
      <p className="muted">Edita este código y mira el resultado.</p>
    </div>
  );
}`],
    ['Contador', `function App() {
  const [n, setN] = useState(0);
  return (
    <div className="card col">
      <h2>Contador: {n}</h2>
      <div className="row">
        <button onClick={() => setN(n - 1)}>−</button>
        <button onClick={() => setN(0)}>Reiniciar</button>
        <button onClick={() => setN(n + 1)}>+</button>
      </div>
    </div>
  );
}`],
    ['Lista de tareas', `function App() {
  const [texto, setTexto] = useState('');
  const [tareas, setTareas] = useState([
    { id: 1, titulo: 'Aprender JSX', hecha: true },
    { id: 2, titulo: 'Dominar useState', hecha: false },
  ]);

  function agregar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setTareas([...tareas, { id: Date.now(), titulo: texto.trim(), hecha: false }]);
    setTexto('');
  }
  const alternar = (id) => setTareas(tareas.map(t => t.id === id ? { ...t, hecha: !t.hecha } : t));
  const quitar = (id) => setTareas(tareas.filter(t => t.id !== id));

  return (
    <div className="card col">
      <h2>Mis tareas ({tareas.filter(t => !t.hecha).length} pendientes)</h2>
      <form className="row" onSubmit={agregar}>
        <input value={texto} onChange={e => setTexto(e.target.value)} placeholder="Nueva tarea…" />
        <button>Agregar</button>
      </form>
      <ul>
        {tareas.map(t => (
          <li key={t.id}>
            <label>
              <input type="checkbox" checked={t.hecha} onChange={() => alternar(t.id)} />{' '}
              <span style={{ textDecoration: t.hecha ? 'line-through' : 'none' }}>{t.titulo}</span>
            </label>{' '}
            <button onClick={() => quitar(t.id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`],
    ['Temporizador (useEffect)', `function App() {
  const [seg, setSeg] = useState(0);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (!activo) return;
    const id = setInterval(() => setSeg(s => s + 1), 1000);
    return () => clearInterval(id); // limpieza
  }, [activo]);

  return (
    <div className="card col">
      <h2>⏱ {seg}s</h2>
      <button onClick={() => setActivo(a => !a)}>{activo ? 'Pausar' : 'Reanudar'}</button>
    </div>
  );
}`],
    ['Carga de datos simulada', `const pedirUsuarios = () =>
  new Promise((ok) => setTimeout(() => ok([
    { id: 1, nombre: 'Ana' }, { id: 2, nombre: 'Luis' }, { id: 3, nombre: 'Marta' },
  ]), 800));

function App() {
  const [usuarios, setUsuarios] = useState(null);
  useEffect(() => {
    let cancelado = false;
    pedirUsuarios().then(d => { if (!cancelado) setUsuarios(d); });
    return () => { cancelado = true; };
  }, []);

  if (!usuarios) return <p className="muted">Cargando…</p>;
  return <ul>{usuarios.map(u => <li key={u.id}>{u.nombre}</li>)}</ul>;
}`],
    ['Contexto de tema', `const TemaContext = createContext('claro');

function Boton() {
  const tema = useContext(TemaContext);
  return <button style={{ background: tema === 'oscuro' ? '#1e293b' : '#fff', color: tema === 'oscuro' ? '#fff' : '#000' }}>Botón ({tema})</button>;
}

function App() {
  const [tema, setTema] = useState('claro');
  return (
    <TemaContext.Provider value={tema}>
      <div className="card col">
        <Boton />
        <button onClick={() => setTema(tema === 'claro' ? 'oscuro' : 'claro')}>Cambiar tema</button>
      </div>
    </TemaContext.Provider>
  );
}`],
    ['Carrito con useReducer', `function reducer(state, action) {
  switch (action.type) {
    case 'add': return { ...state, items: [...state.items, action.item] };
    case 'clear': return { ...state, items: [] };
    default: throw new Error('Acción desconocida');
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const total = state.items.reduce((a, i) => a + i.precio, 0);
  return (
    <div className="card col">
      <div className="row">
        <button onClick={() => dispatch({ type: 'add', item: { nombre: 'Café', precio: 3 } })}>+ Café (3)</button>
        <button onClick={() => dispatch({ type: 'add', item: { nombre: 'Pan', precio: 2 } })}>+ Pan (2)</button>
        <button onClick={() => dispatch({ type: 'clear' })}>Vaciar</button>
      </div>
      <p>{state.items.length} artículos · Total: <b>{total}</b></p>
    </div>
  );
}`],
    ['JavaScript puro (consola)', `// Escribe JavaScript normal: console.log muestra la salida
const nums = [1, 2, 3, 4, 5];
console.log(nums.map(n => n * 2));
console.log(nums.filter(n => n % 2 === 0));
console.log(nums.reduce((a, b) => a + b, 0));`, 'js'],
  ];

  function playgroundView() {
    const KEYP = 'pg:code', KEYL = 'pg:lang';
    let lang = lsGet(KEYL) || 'jsx';
    const startCode = lsGet(KEYP) || PG[1][1];
    const wb = buildWorkbench({ value: startCode, lang, fill: true, autoRun: true, minH: 120, maxH: 700, onChange: (v) => lsSet(KEYP, v) });
    const sel = h('select', { class: 'select', 'aria-label': 'Plantillas' }, h('option', { value: '' }, '📂 Cargar plantilla…'), PG.map((p, i) => h('option', { value: i }, p[0])));
    sel.addEventListener('change', () => {
      if (sel.value === '') return;
      const p = PG[+sel.value];
      lang = p[2] || 'jsx'; lsSet(KEYL, lang);
      wb.editor.setValue(p[1]); lsSet(KEYP, p[1]);
      // recrear si cambia el modo
      if ((lang === 'js') !== (wb.mode === 'js')) { playgroundMount(); return; }
      wb.run(); sel.value = '';
    });
    function playgroundMount() { Sandbox.disposeAll(); setView(playgroundView(), 'Playground'); }
    const bar = h('div', { class: 'pg-bar' }, h('div', { class: 'pg-title' }, h('h1', null, '🧪 Playground'), h('p', { class: 'muted' }, 'Escribe tu propio código React. Disponibles sin importar: ', h('code', null, 'useState, useEffect, useRef, useReducer, useContext, useMemo, useCallback, memo…'), ' Define un componente ', h('code', null, 'App'), '. Atajo: ', h('kbd', null, 'Ctrl'), '+', h('kbd', null, 'Enter'), '.')),
      h('div', { class: 'pg-actions' }, sel,
        h('button', { class: 'btn primary', type: 'button', onclick: wb.run }, '▶ Ejecutar'),
        h('button', { class: 'btn', type: 'button', onclick: (e) => copyText(wb.editor.getValue(), e.target) }, 'Copiar código')));
    const box = h('div', { class: 'pg-box' }, wb.grid);
    const root = h('div', { class: 'playground' }, bar, box);
    setTimeout(() => wb.run(), 50);
    return root;
  }

  /* ---- Progreso ---- */
  function progressView() {
    const s = stats();
    const quizzes = Object.values(store.quiz);
    const qOk = quizzes.reduce((a, q) => a + q.correct, 0), qTot = quizzes.reduce((a, q) => a + q.total, 0);
    const root = h('div', { class: 'progress-view' }, h('h1', null, '📈 Tu progreso'),
      h('div', { class: 'stat-grid' },
        stat('Lecciones', s.done + ' / ' + s.total, s.pct), stat('Ejercicios', s.exDone + ' / ' + s.exTotal, s.exTotal ? Math.round((s.exDone / s.exTotal) * 100) : 0),
        stat('Aciertos en quizzes', qTot ? qOk + ' / ' + qTot : '—', qTot ? Math.round((qOk / qTot) * 100) : 0)));
    if (s.pct === 100) root.append(h('div', { class: 'callout callout-tip' }, h('div', { class: 'callout-title' }, '🎓 ¡Completaste el curso!'), h('div', { class: 'callout-body' }, h('p', null, 'Has recorrido todas las lecciones. El siguiente paso es construir proyectos propios y leer el código de otros. ¡Mucho éxito!'))));
    LEVELS.filter((l) => l.id !== 'ref').forEach((lv) => {
      const ls = lessons.filter((l) => l.nivel === lv.id);
      if (!ls.length) return;
      const done = ls.filter((l) => store.done[l.id]).length;
      root.append(h('div', { class: 'level-card ' + lv.cls }, h('div', { class: 'level-head' }, h('span', { class: 'level-ico' }, lv.icon), h('div', null, h('h3', null, lv.name)), h('span', { class: 'level-count' }, done + '/' + ls.length)), progressBar(Math.round((done / ls.length) * 100)),
        h('div', { class: 'level-lessons' }, ls.map((l) => {
          const exd = l.exercises.filter((_, i) => store.ex[l.id + '#' + i]).length;
          return h('a', { href: '#/leccion/' + l.id, class: store.done[l.id] ? 'done' : '' }, h('span', { class: 'ico' }, l.icono), h('span', null, l.titulo), h('small', null, l.exercises.length ? exd + '/' + l.exercises.length + ' ejercicios' : ''), store.done[l.id] ? h('i', { class: 'tick' }, '✓') : null);
        }))));
    });
    root.append(h('div', { class: 'danger-zone' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      if (!confirm('¿Seguro? Se borrará tu progreso, ejercicios guardados y el código del playground.')) return;
      Object.keys(localStorage).filter((k) => k.startsWith('code:') || k.startsWith('pg:') || k === KEY).forEach((k) => lsDel(k));
      store = { done: {}, ex: {}, quiz: {}, last: null, theme: store.theme };
      save(); refreshNav(); route();
    } }, '🗑 Reiniciar todo mi progreso')));
    return root;
  }
  function stat(label, val, pct) { return h('div', { class: 'stat' }, h('small', null, label), h('b', null, val), progressBar(pct)); }

  function notFound() { return h('div', { class: 'empty-state' }, h('h1', null, 'Página no encontrada'), h('p', null, 'Esa ruta no existe.'), h('a', { class: 'btn primary', href: '#/' }, 'Volver al inicio')); }

  /* ------------------------------------------------------------------ router */
  function route() {
    Sandbox.disposeAll();
    const hash = location.hash.replace(/^#\/?/, '');
    const [seg, arg] = hash.split('/');
    if (!seg) { setView(homeView(), ''); markNav(null); }
    else if (seg === 'leccion' && byId[arg]) lessonView(byId[arg]);
    else if (seg === 'playground') { setView(playgroundView(), 'Playground'); markNav('__pg'); }
    else if (seg === 'progreso') { setView(progressView(), 'Progreso'); markNav('__prog'); }
    else { setView(notFound(), 'No encontrada'); markNav(null); }
    // arrancar bloques visibles cuando el scroll ya está en su sitio
    requestAnimationFrame(() => window.dispatchEvent(new Event('scroll')));
  }

  /* ------------------------------------------------------------------ navegación lateral */
  function buildNav() {
    const nav = $('#nav');
    nav.replaceChildren();
    nav.append(h('a', { href: '#/', class: 'nav-top', 'data-id': '__home' }, '🏠 Inicio'), h('a', { href: '#/playground', class: 'nav-top', 'data-id': '__pg' }, '🧪 Playground'), h('a', { href: '#/progreso', class: 'nav-top', 'data-id': '__prog' }, '📈 Mi progreso'));
    LEVELS.forEach((lv) => {
      const ls = lessons.filter((l) => l.nivel === lv.id);
      if (!ls.length) return;
      const det = h('details', { class: 'nav-group ' + lv.cls, open: true, 'data-level': lv.id },
        h('summary', null, h('span', null, lv.icon + ' ' + lv.name), h('em', { class: 'cnt' })),
        ls.map((l, i) => h('a', { href: '#/leccion/' + l.id, 'data-id': l.id, class: 'nav-item' }, h('span', { class: 'n' }, lv.id === 'ref' ? '•' : String(l.i + 1 - (lessons.findIndex((x) => x.nivel !== 'ref') || 0)).padStart(2, '0')), h('span', { class: 't' }, l.titulo), h('i', { class: 'chk' }))));
      nav.append(det);
    });
    refreshNav();
  }
  function refreshNav() {
    document.querySelectorAll('.nav-item').forEach((a) => { const d = !!store.done[a.dataset.id]; a.classList.toggle('done', d); a.querySelector('.chk').textContent = d ? '✓' : ''; });
    document.querySelectorAll('.nav-group').forEach((g) => {
      const ls = lessons.filter((l) => l.nivel === g.dataset.level);
      if (g.dataset.level === 'ref') return;
      g.querySelector('.cnt').textContent = ls.filter((l) => store.done[l.id]).length + '/' + ls.length;
    });
    const s = stats();
    const pb = $('#topProgress'); if (pb) { pb.style.width = s.pct + '%'; }
    const pl = $('#topPct'); if (pl) pl.textContent = s.pct + '%';
  }
  function markNav(id) {
    document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.id === (id || '__home')));
    const act = $('#nav a.active.nav-item');
    if (act) { const g = act.closest('details'); if (g) g.open = true; act.scrollIntoView({ block: 'nearest' }); }
  }

  /* ------------------------------------------------------------------ búsqueda */
  function openSearch() {
    const modal = $('#search'); modal.hidden = false;
    const input = $('#searchInput'); input.value = ''; input.focus(); renderResults('');
  }
  function closeSearch() { $('#search').hidden = true; }
  let sel = 0;
  function renderResults(q) {
    const box = $('#searchResults'); box.replaceChildren();
    const terms = norm(q).split(/\s+/).filter(Boolean);
    let res = lessons;
    if (terms.length) {
      res = lessons.map((l) => {
        let score = 0;
        terms.forEach((t) => { if (l.nTitle.includes(t)) score += 10; if (l.nText.includes(t)) score += 2 + Math.min(8, (l.nText.split(t).length - 1) / 3); else score -= 100; });
        return { l, score };
      }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.l);
    }
    res = res.slice(0, 9);
    if (!res.length) { box.append(h('div', { class: 'sr-empty' }, 'Sin resultados para “' + q + '”.')); return; }
    res.forEach((l, i) => {
      let snip = l.resumen || '';
      if (terms.length) {
        const nt = norm(l.text); const pos = nt.indexOf(terms[0]);
        if (pos >= 0) snip = '…' + l.text.slice(Math.max(0, pos - 50), pos + 110) + '…';
      }
      box.append(h('a', { href: '#/leccion/' + l.id, class: 'sr-item' + (i === 0 ? ' sel' : ''), onclick: closeSearch }, h('span', { class: 'sr-ico' }, l.icono), h('div', null, h('strong', null, l.titulo), h('small', null, levelOf(l.nivel).name), h('p', null, snip))));
    });
    sel = 0;
  }
  function initSearch() {
    $('#searchBtn').addEventListener('click', openSearch);
    $('#search').addEventListener('click', (e) => { if (e.target.id === 'search') closeSearch(); });
    $('#searchInput').addEventListener('input', (e) => renderResults(e.target.value));
    document.addEventListener('keydown', (e) => {
      const modal = $('#search');
      const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing && modal.hidden)) { e.preventDefault(); openSearch(); return; }
      if (modal.hidden) return;
      const items = Array.from(modal.querySelectorAll('.sr-item'));
      if (e.key === 'Escape') closeSearch();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); sel = clamp(sel + (e.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1);
        items.forEach((x, i) => x.classList.toggle('sel', i === sel)); if (items[sel]) items[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && items[sel]) { e.preventDefault(); items[sel].click(); location.hash = items[sel].getAttribute('href'); }
    });
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    applyTheme(theme0);
    $('#themeBtn').addEventListener('click', () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; store.theme = t; save(); applyTheme(t); });
    $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    $('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
    buildNav(); initSearch();
    window.addEventListener('hashchange', route);
    route();
  }
  window.RR = { lessons, byId, Sandbox, store, h };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
