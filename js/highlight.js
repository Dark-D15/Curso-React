/* Resaltador de sintaxis ligero (JS/JSX/TS/TSX, CSS, HTML, JSON, bash) */
(function (global) {
  'use strict';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const KW = new Set(('const let var function return if else for while do switch case break continue new class extends import export from default async await try catch finally throw typeof instanceof in of delete void yield static get set super this interface type enum implements readonly as satisfies keyof namespace declare abstract public private protected').split(' '));
  const LIT = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);
  const JS_RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\[\s\S]|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")|((?<![\w$)\]])<\/?[A-Za-z][\w.]*)|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b)|([A-Za-z_$][\w$]*)(\s*\()?|(=>|[{}()\[\];,]|[=+\-*\/%!<>&|?:.]+)/g;

  function hlJS(code) {
    let out = '', last = 0, m;
    JS_RE.lastIndex = 0;
    while ((m = JS_RE.exec(code))) {
      out += esc(code.slice(last, m.index));
      last = JS_RE.lastIndex;
      const t = m[0];
      if (m[1]) out += '<span class="tk-c">' + esc(t) + '</span>';
      else if (m[2]) out += '<span class="tk-s">' + esc(t) + '</span>';
      else if (m[3]) out += '<span class="tk-t">' + esc(t) + '</span>';
      else if (m[4]) out += '<span class="tk-n">' + esc(t) + '</span>';
      else if (m[5]) {
        const id = m[5];
        let cls = '';
        if (KW.has(id)) cls = 'tk-k';
        else if (LIT.has(id)) cls = 'tk-l';
        else if (m[6]) cls = /^[A-Z]/.test(id) ? 'tk-ty' : 'tk-f';
        else if (/^[A-Z]/.test(id)) cls = 'tk-ty';
        out += cls ? '<span class="' + cls + '">' + esc(id) + '</span>' + esc(m[6] || '') : esc(t);
      } else if (m[7]) out += '<span class="tk-p">' + esc(t) + '</span>';
      else out += esc(t);
    }
    return out + esc(code.slice(last));
  }

  function generic(code, re, classify) {
    let out = '', last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      last = re.lastIndex;
      const cls = classify(m);
      out += cls ? '<span class="' + cls + '">' + esc(m[0]) + '</span>' : esc(m[0]);
      if (m[0] === '') re.lastIndex++;
    }
    return out + esc(code.slice(last));
  }

  const CSS_RE = /(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(#[0-9a-fA-F]{3,8}\b)|(-?\d*\.?\d+(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?\b)|([\w-]+)(?=\s*:)|([.#]?[\w-]+(?=[^{};]*\{))/g;
  const HTML_RE = /(<!--[\s\S]*?-->)|("(?:[^"]*)"|'(?:[^']*)')|(<\/?[\w-]+)|([\w-:]+)(?==)/g;
  const BASH_RE = /(#[^\n]*)|("(?:\\.|[^"\\])*"|'[^']*')|(\s--?[\w-]+)|\b(npm|npx|pnpm|yarn|cd|git|node|mkdir|code|bun|cp|mv|rm|ls)\b/g;
  const JSON_RE = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+\.?\d*(?:e[+-]?\d+)?)|\b(true|false|null)\b/g;

  function highlight(code, lang) {
    lang = (lang || '').toLowerCase();
    switch (lang) {
      case 'js': case 'jsx': case 'ts': case 'tsx': case 'javascript': case 'typescript': case 'starter': case 'solution': case 'mjs':
        return hlJS(code);
      case 'css':
        return generic(code, CSS_RE, (m) => (m[1] ? 'tk-c' : m[2] ? 'tk-s' : m[3] || m[4] ? 'tk-n' : m[5] ? 'tk-f' : m[6] ? 'tk-ty' : ''));
      case 'html': case 'xml':
        return generic(code, HTML_RE, (m) => (m[1] ? 'tk-c' : m[2] ? 'tk-s' : m[3] ? 'tk-t' : m[4] ? 'tk-f' : ''));
      case 'bash': case 'sh': case 'shell': case 'cmd': case 'powershell':
        return generic(code, BASH_RE, (m) => (m[1] ? 'tk-c' : m[2] ? 'tk-s' : m[3] ? 'tk-l' : m[4] ? 'tk-k' : ''));
      case 'json':
        return generic(code, JSON_RE, (m) => (m[1] ? (m[2] ? 'tk-ty' : 'tk-s') : m[3] ? 'tk-n' : m[4] ? 'tk-l' : ''));
      default:
        return esc(code);
    }
  }
  global.Highlight = { highlight, esc };
})(window);
