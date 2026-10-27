/* Sandbox: compila JSX en el navegador y lo ejecuta en un <iframe> aislado con React 19 */
(function (global) {
  'use strict';
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const REACT_URL = new URL('vendor/react.dev.js', document.baseURI).href;

  const PREVIEW_CSS = `
*{box-sizing:border-box}html{color-scheme:light}
body{margin:0;padding:16px;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0f172a;background:#fff;display:flow-root}
button{font:inherit;padding:6px 14px;border-radius:8px;border:1px solid #cbd5e1;background:#f8fafc;cursor:pointer;color:#0f172a;transition:.15s}
button:hover:not(:disabled){background:#eef2ff;border-color:#818cf8}button:disabled{opacity:.5;cursor:not-allowed}
input,select,textarea{font:inherit;padding:6px 10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;max-width:100%}
input:focus,select:focus,textarea:focus{outline:2px solid #818cf8;outline-offset:1px}
input[type=checkbox],input[type=radio]{padding:0;width:auto}
h1,h2,h3,h4{margin:.2em 0 .45em;line-height:1.2}h1{font-size:1.6em}h2{font-size:1.3em}h3{font-size:1.1em}p{margin:.4em 0}
ul,ol{padding-left:22px;margin:.4em 0}table{border-collapse:collapse}td,th{border:1px solid #e2e8f0;padding:4px 10px}
.card{border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.08)}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.col{display:flex;flex-direction:column;gap:8px}
.badge{display:inline-block;padding:2px 10px;border-radius:999px;background:#e0e7ff;color:#3730a3;font-size:.8em}
.muted{color:#64748b}.ok{color:#15803d}.bad{color:#b91c1c}
.__err{color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;padding:10px;border-radius:8px;white-space:pre-wrap;font:13px ui-monospace,Consolas,monospace}`;

  /* Quita imports/exports para que el código funcione como "script" con React en el ámbito */
  function stripModules(code) {
    code = code.replace(/^[ \t]*import\b[\s\S]*?\bfrom\s+['"][^'"]+['"];?[ \t]*$/gm, (m) => m.replace(/[^\n]/g, ''));
    code = code.replace(/^[ \t]*import\s+['"][^'"]+['"];?[ \t]*$/gm, '');
    code = code.replace(/^([ \t]*)export\s+default\s+(?=(async\s+)?function|class)/gm, '$1');
    code = code.replace(/^([ \t]*)export\s+default\s+/gm, '$1__default = ');
    code = code.replace(/^([ \t]*)export\s+\{[^}]*\};?[ \t]*$/gm, '');
    code = code.replace(/^([ \t]*)export\s+(?=const|let|var|function|class|async|type|interface)/gm, '$1');
    return code;
  }

  function compile(code, lang, mode) {
    const src = stripModules(code);
    if (mode === 'js' && !/^(ts|tsx|typescript)$/.test(lang)) return src;
    const ts = /^(ts|tsx|typescript)$/.test(lang);
    return global.sucrase.transform(src, { transforms: ts ? ['typescript', 'jsx'] : ['jsx'], jsxRuntime: 'classic', production: true, disableESTransforms: true }).code;
  }

  const HARNESS = `
(function(){
  var ID = __ID__, MODE = __MODE__, CODE = __CODE__;
  function post(m){ m.__rr = ID; try { parent.postMessage(m, '*'); } catch(e){} }
  function fmt(v, d){
    d = d || 0;
    if (v === null) return 'null'; if (v === undefined) return 'undefined';
    var t = typeof v;
    if (t === 'string') return d ? JSON.stringify(v) : v;
    if (t === 'number' || t === 'boolean' || t === 'bigint') return String(v);
    if (t === 'function') return 'ƒ ' + (v.name || 'anónima') + '()';
    if (t === 'symbol') return v.toString();
    if (v instanceof Error) return v.name + ': ' + v.message;
    if (typeof Element !== 'undefined' && v instanceof Element) return '<' + v.tagName.toLowerCase() + '>';
    if (v instanceof Date) return v.toISOString();
    if (d > 3) return Array.isArray(v) ? '[…]' : '{…}';
    if (v instanceof Map) { var a = []; v.forEach(function(x, k){ a.push(fmt(k, d+1) + ' => ' + fmt(x, d+1)); }); return 'Map(' + v.size + ') { ' + a.join(', ') + ' }'; }
    if (v instanceof Set) { var b = []; v.forEach(function(x){ b.push(fmt(x, d+1)); }); return 'Set(' + v.size + ') { ' + b.join(', ') + ' }'; }
    if (Array.isArray(v)) return '[' + v.map(function(x){ return fmt(x, d+1); }).join(', ') + ']';
    if (v && v.$$typeof) return '<ReactElement>';
    try { var ks = Object.keys(v); return '{ ' + ks.map(function(k){ return k + ': ' + fmt(v[k], d+1); }).join(', ') + ' }'; } catch(e){ return String(v); }
  }
  function format(args){
    var a = [].slice.call(args);
    if (typeof a[0] === 'string' && /%[sdifoOjc]/.test(a[0])) {
      var i = 1;
      var s = a[0].replace(/%[sdifoOjc%]/g, function(m){ if (m === '%%') return '%'; if (i >= a.length) return m; var v = a[i++]; return m === '%c' ? '' : fmt(v, 0); });
      return [s].concat(a.slice(i).map(function(x){ return fmt(x, 0); })).join(' ');
    }
    return a.map(function(x){ return fmt(x, 0); }).join(' ');
  }
  ['log','info','warn','error','debug'].forEach(function(k){
    var orig = console[k];
    console[k] = function(){
      var text = ''; try { text = format(arguments); } catch(e){ text = '[no se pudo mostrar]'; }
      if (/Download the React DevTools/.test(text)) return;
      post({ type: 'log', level: k, text: text });
      try { orig.apply(console, arguments); } catch(e){}
    };
  });
  window.addEventListener('error', function(e){ post({ type: 'error', message: (e.error && e.error.message) || e.message }); });
  window.addEventListener('unhandledrejection', function(e){ post({ type: 'error', message: 'Promesa rechazada: ' + ((e.reason && e.reason.message) || e.reason) }); });
  try {
    new ResizeObserver(function(){ post({ type: 'size', h: Math.ceil(document.body.getBoundingClientRect().height) }); }).observe(document.body);
  } catch(e){}

  if (MODE === 'js') {
    var AF = Object.getPrototypeOf(async function(){}).constructor;
    (async function(){
      try { await (new AF('"use strict";\\n' + CODE))(); }
      catch(e){ post({ type: 'error', message: (e && e.message) || String(e) }); }
      setTimeout(function(){ post({ type: 'ready' }); }, 30);
    })();
    return;
  }

  var React = window.React, ReactDOM = window.ReactDOM;
  var names = Object.keys(React).filter(function(k){ return /^[A-Za-z_$][\\w$]*$/.test(k) && k !== 'default' && k !== 'version'; });
  var extra = ['useFormStatus','createPortal','flushSync','createRoot'].filter(function(k){ return ReactDOM[k] && names.indexOf(k) < 0; });
  var all = names.concat(extra);
  var vals = all.map(function(k){ return names.indexOf(k) >= 0 ? React[k] : ReactDOM[k]; });

  class Boundary extends React.Component {
    constructor(p){ super(p); this.state = { e: null }; }
    static getDerivedStateFromError(e){ return { e: e }; }
    componentDidCatch(e){ post({ type: 'error', message: (e && e.message) || String(e) }); }
    render(){ return this.state.e ? React.createElement('pre', { className: '__err' }, 'Error: ' + (this.state.e.message || this.state.e)) : this.props.children; }
  }

  try {
    var fn = Function.apply(null, ['React', 'ReactDOM'].concat(all, ['"use strict"; return (function(){ var __default;\\n' + CODE + '\\n;return typeof App !== "undefined" ? App : __default; })();']));
    var App = fn.apply(null, [React, ReactDOM].concat(vals));
    if (App && !/createRoot\\(/.test(CODE)) {
      var root = ReactDOM.createRoot(document.getElementById('root'));
      ReactDOM.flushSync(function(){ root.render(React.createElement(Boundary, null, React.createElement(App))); });
    } else if (!App && !/createRoot\\(/.test(CODE)) {
      post({ type: 'error', message: 'No encontré un componente llamado App. Define function App() { ... }' });
    }
  } catch(e){
    post({ type: 'error', message: (e && e.message) || String(e) });
  }
  setTimeout(function(){ post({ type: 'ready' }); }, 80);
})();`;

  function buildDoc(compiled, mode, id, extraCss) {
    const harness = HARNESS.replace('__ID__', JSON.stringify(id)).replace('__MODE__', JSON.stringify(mode)).replace('__CODE__', () => JSON.stringify(compiled).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'));
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><style>' + PREVIEW_CSS + (extraCss || '') + '</style>' +
      (mode === 'react' ? '<script src="' + REACT_URL + '"><\/script>' : '') +
      '</head><body><div id="root"></div><script>' + harness.replace(/<\/script/gi, '<\\/script') + '<\/script></body></html>';
  }

  let seq = 0;
  const runners = new Set();

  class Runner {
    constructor(opts) {
      this.opts = Object.assign({ mode: 'react', minH: 70, maxH: 560, fixedH: null, host: null, onUpdate: null }, opts);
      this.id = 'rr' + (++seq) + '_' + Math.random().toString(36).slice(2, 6);
      this.logs = []; this.errors = []; this.iframe = null; this.running = false;
      this._h = (e) => this.onMsg(e);
      window.addEventListener('message', this._h);
      runners.add(this);
    }
    get doc() { return this.iframe ? this.iframe.contentDocument : null; }
    get win() { return this.iframe ? this.iframe.contentWindow : null; }
    dispose() { window.removeEventListener('message', this._h); runners.delete(this); if (this.iframe) this.iframe.remove(); }
    update() { if (this.opts.onUpdate) this.opts.onUpdate(this); }
    onMsg(e) {
      const d = e.data;
      if (!d || d.__rr !== this.id || !this.iframe || e.source !== this.iframe.contentWindow) return;
      if (d.type === 'log') { this.logs.push({ level: d.level, text: d.text }); if (this.logs.length > 300) this.logs.shift(); this.update(); }
      else if (d.type === 'error') { this.errors.push(d.message); this.update(); }
      else if (d.type === 'size' && this.opts.mode === 'react') {
        const h = this.opts.fixedH || Math.min(this.opts.maxH, Math.max(this.opts.minH, d.h + 2));
        this.iframe.style.height = h + 'px';
      } else if (d.type === 'ready' && this._resolve) { const r = this._resolve; this._resolve = null; r(); }
    }
    run(code, lang, extraCss) {
      this.logs = []; this.errors = []; this.compileError = null; this.lastCode = code;
      if (this.iframe) { this.iframe.remove(); this.iframe = null; }
      const host = this.opts.host;
      let compiled;
      try { compiled = compile(code, lang || 'jsx', this.opts.mode); }
      catch (err) {
        this.compileError = String(err.message || err);
        this.errors.push(this.compileError);
        this.update();
        return Promise.resolve({ ok: false });
      }
      const iframe = document.createElement('iframe');
      iframe.className = 'preview-frame';
      iframe.title = 'Vista previa';
      if (this.opts.mode === 'react') iframe.style.height = (this.opts.fixedH || this.opts.minH) + 'px';
      iframe.srcdoc = buildDoc(compiled, this.opts.mode, this.id, extraCss);
      host.replaceChildren(iframe);
      this.iframe = iframe;
      this.update();
      return new Promise((resolve) => {
        const t = setTimeout(() => { this._resolve = null; resolve({ ok: !this.errors.length, timeout: true }); }, 6000);
        this._resolve = () => { clearTimeout(t); resolve({ ok: !this.errors.length }); };
      });
    }
  }

  /* ---------- Comprobación de ejercicios ---------- */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function runChecks(runner, checksCode) {
    const results = [];
    const doc = runner.doc;
    const win = runner.win;
    const $ = (s) => doc.querySelector(s);
    const $$ = (s) => Array.from(doc.querySelectorAll(s));
    const text = (s) => (($(s) || {}).textContent || '').trim();
    const byText = (t, sel) => {
      const lower = String(t).toLowerCase();
      const cands = $$(sel || 'button,a,label,p,span,h1,h2,h3,h4,li,div,td,th,strong,em,summary');
      const hits = cands.filter((el) => (el.textContent || '').trim().toLowerCase().includes(lower));
      return hits.find((el) => !hits.some((o) => o !== el && el.contains(o))) || null;
    };
    const btn = (t) => byText(t, 'button,[role=button],input[type=button],input[type=submit]');
    const click = async (el) => {
      if (!el) throw new Error('No encontré el elemento sobre el que hacer clic.');
      el.click();
      await wait(40);
    };
    const type = async (el, value) => {
      if (!el) throw new Error('No encontré el campo de texto.');
      const proto = el.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? win.HTMLSelectElement.prototype : win.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
      el.dispatchEvent(new win.Event('input', { bubbles: true }));
      el.dispatchEvent(new win.Event('change', { bubbles: true }));
      await wait(40);
    };
    const waitFor = async (fn, ms) => {
      const end = Date.now() + (ms || 3000);
      while (Date.now() < end) { try { if (fn()) return true; } catch (e) {} await wait(40); }
      return false;
    };
    const check = async (desc, cond) => {
      let ok = false;
      try { ok = typeof cond === 'function' ? await cond() : cond; } catch (e) { ok = false; }
      results.push({ desc, ok: !!ok });
    };
    const logs = () => runner.logs.map((l) => l.text);
    try {
      const fn = new AsyncFunction('check', '$', '$$', 'text', 'byText', 'btn', 'click', 'type', 'wait', 'waitFor', 'logs', 'doc', 'win', 'code', checksCode);
      await fn(check, $, $$, text, byText, btn, click, type, wait, waitFor, logs, doc, win, runner.lastCode || '');
    } catch (e) {
      results.push({ desc: 'La comprobación no pudo completarse: ' + (e.message || e), ok: false });
    }
    if (runner.errors.length) results.unshift({ desc: 'Tu código se ejecuta sin errores', ok: false });
    return results;
  }

  function disposeAll() { Array.from(runners).forEach((r) => r.dispose()); }

  /* Utilidad para pruebas automáticas: ejecuta código fuera de pantalla */
  async function runOffscreen(code, lang, mode, extraCss) {
    let host = document.getElementById('__offscreen');
    if (!host) { host = document.createElement('div'); host.id = '__offscreen'; host.style.cssText = 'position:fixed;left:-9999px;top:0;width:700px;height:600px;overflow:hidden'; document.body.appendChild(host); }
    const holder = document.createElement('div');
    host.appendChild(holder);
    const r = new Runner({ mode: mode || 'react', host: holder });
    await r.run(code, lang, extraCss);
    return r;
  }

  global.Sandbox = { _runners: runners, Runner, compile, runChecks, disposeAll, runOffscreen, wait };
})(window);
