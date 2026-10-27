/* Mini parser de Markdown extendido para las lecciones del curso */
(function (global) {
  'use strict';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function inline(src) {
    const codes = [];
    src = src.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    src = esc(src);
    src = src
      .replace(/\[\[([^\]]+)\]\]/g, '<kbd>$1</kbd>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![\w*])/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) =>
        u.startsWith('#') ? '<a href="' + u + '">' + t + '</a>' : '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + t + ' <span class="ext">↗</span></a>');
    return src.replace(/\u0000(\d+)\u0000/g, (_, i) => '<code>' + esc(codes[i]) + '</code>');
  }

  function parseInfo(info) {
    const o = { lang: 'text', run: false, h: null, title: '', err: false };
    const t = info.match(/title="([^"]*)"/);
    if (t) { o.title = t[1]; info = info.replace(t[0], ''); }
    const parts = info.trim().split(/\s+/).filter(Boolean);
    if (parts.length) o.lang = parts.shift().toLowerCase();
    parts.forEach((p) => {
      if (p === 'run') o.run = true;
      else if (p === 'err') o.err = true;
      else if (/^h=\d+$/.test(p)) o.h = +p.slice(2);
    });
    return o;
  }

  const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
  function renderItems(items) {
    let idx = 0;
    function rec(base) {
      const tag = items[idx].ordered ? 'ol' : 'ul';
      let out = '<' + tag + '>';
      while (idx < items.length && items[idx].indent >= base) {
        out += '<li>' + inline(items[idx].text);
        idx++;
        while (idx < items.length && items[idx].indent > base) out += rec(items[idx].indent);
        out += '</li>';
      }
      return out + '</' + tag + '>';
    }
    return rec(items[0].indent);
  }

  function splitRow(r) {
    r = r.trim().replace(/^\|/, '').replace(/\|$/, '');
    return r.replace(/\\\|/g, '\u0001').split('|').map((c) => c.trim().replace(/\u0001/g, '|'));
  }

  const FENCE_RE = /^(`{3,})(.*)$/;

  function findContainerEnd(lines, start) {
    let fence = null;
    for (let j = start + 1; j < lines.length; j++) {
      const l = lines[j];
      const fm = l.match(FENCE_RE);
      if (fence) { if (l.trim() === fence) fence = null; continue; }
      if (fm) { fence = fm[1]; continue; }
      if (l.trim() === ':::') return j;
    }
    return lines.length;
  }

  function parseExercise(kind, title, inner) {
    const ex = { type: 'exercise', kind, title: title || 'Ejercicio', lang: kind === 'exercisejs' ? 'js' : kind === 'exercisets' ? 'tsx' : 'jsx', intro: [], starter: '', solution: '', checks: '', hints: [] };
    const introLines = [];
    for (let i = 0; i < inner.length; i++) {
      const fm = inner[i].match(FENCE_RE);
      if (fm) {
        const info = parseInfo(fm[2]);
        const body = [];
        i++;
        while (i < inner.length && inner[i].trim() !== fm[1]) body.push(inner[i++]);
        const txt = body.join('\n');
        if (info.lang === 'starter') ex.starter = txt;
        else if (info.lang === 'solution') ex.solution = txt;
        else if (info.lang === 'checks') ex.checks = txt;
        else if (info.lang === 'hint') ex.hints.push(txt);
        else if (info.lang === 'css') ex.css = txt;
        else introLines.push(fm[0], ...body, fm[1]);
      } else introLines.push(inner[i]);
    }
    ex.intro = parseBlocks(introLines);
    return ex;
  }

  function parseQuiz(inner) {
    const qs = [];
    let cur = null;
    inner.forEach((l) => {
      if (/^\?\s/.test(l)) { cur = { q: l.slice(2).trim(), opts: [], answer: -1, why: '' }; qs.push(cur); }
      else if (cur && /^[-+]\s/.test(l)) { cur.opts.push(l.slice(2).trim()); if (l[0] === '+') cur.answer = cur.opts.length - 1; }
      else if (cur && /^>\s?/.test(l)) cur.why += (cur.why ? ' ' : '') + l.replace(/^>\s?/, '').trim();
    });
    return { type: 'quiz', questions: qs };
  }

  const CALLOUT_DEFAULT = { tip: 'Consejo', info: 'Dato', warn: 'Cuidado', danger: 'Error común', idea: 'Piensa en esto', goal: 'Objetivos', summary: 'Resumen' };

  function parseBlocks(lines) {
    const blocks = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }

      let m = line.match(FENCE_RE);
      if (m) {
        const info = parseInfo(m[2]);
        const body = [];
        i++;
        while (i < lines.length && lines[i].trim() !== m[1]) body.push(lines[i++]);
        i++;
        blocks.push(Object.assign({ type: 'code', code: body.join('\n') }, info));
        continue;
      }

      m = line.match(/^:::([a-z]+)\s*(.*)$/);
      if (m) {
        const end = findContainerEnd(lines, i);
        const inner = lines.slice(i + 1, end);
        const kind = m[1];
        if (kind === 'exercise' || kind === 'exercisejs' || kind === 'exercisets') blocks.push(parseExercise(kind, m[2].trim(), inner));
        else if (kind === 'quiz') blocks.push(parseQuiz(inner));
        else blocks.push({ type: 'callout', kind, title: m[2].trim() || CALLOUT_DEFAULT[kind] || '', blocks: parseBlocks(inner) });
        i = end + 1;
        continue;
      }

      m = line.match(/^(#{1,4})\s+(.*)$/);
      if (m) {
        const level = m[1].length;
        const text = m[2].trim();
        blocks.push({ type: 'html', html: '<h' + level + ' id="' + slug(text) + '">' + inline(text) + '</h' + level + '>', heading: { level, text, id: slug(text) } });
        i++;
        continue;
      }

      if (/^(-{3,}|\*{3,})\s*$/.test(line)) { blocks.push({ type: 'html', html: '<hr>' }); i++; continue; }

      if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        const head = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]));
        let html = '<div class="table-wrap"><table><thead><tr>' + head.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>';
        rows.forEach((r) => { html += '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>'; });
        blocks.push({ type: 'html', html: html + '</tbody></table></div>' });
        continue;
      }

      if (/^>\s?/.test(line)) {
        const q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
        blocks.push({ type: 'html', html: '<blockquote>' + inline(q.join(' ')) + '</blockquote>' });
        continue;
      }

      if (LIST_RE.test(line)) {
        const items = [];
        while (i < lines.length) {
          const lm = lines[i].match(LIST_RE);
          if (lm) { items.push({ indent: lm[1].length, ordered: /\d/.test(lm[2]), text: lm[3] }); i++; }
          else if (lines[i].trim() !== '' && /^\s+\S/.test(lines[i]) && items.length) { items[items.length - 1].text += ' ' + lines[i].trim(); i++; }
          else if (lines[i].trim() === '' && i + 1 < lines.length && LIST_RE.test(lines[i + 1])) i++;
          else break;
        }
        blocks.push({ type: 'html', html: renderItems(items) });
        continue;
      }

      const p = [];
      while (i < lines.length && lines[i].trim() && !FENCE_RE.test(lines[i]) && !/^:::/.test(lines[i]) && !/^#{1,4}\s/.test(lines[i]) && !LIST_RE.test(lines[i]) && !/^>\s?/.test(lines[i]) && !lines[i].trim().startsWith('|')) p.push(lines[i++].trim());
      if (p.length) blocks.push({ type: 'html', html: '<p>' + inline(p.join(' ')) + '</p>' });
      else i++;
    }
    return blocks;
  }

  function parse(text) {
    text = text.replace(/\r\n/g, '\n');
    const meta = {};
    const fm = text.match(/^---\n([\s\S]*?)\n---\n?/);
    if (fm) {
      fm[1].split('\n').forEach((l) => { const k = l.match(/^(\w+):\s*(.*)$/); if (k) meta[k[1]] = k[2].trim(); });
      text = text.slice(fm[0].length);
    }
    const blocks = parseBlocks(text.split('\n'));
    const headings = blocks.filter((b) => b.heading && b.heading.level === 2).map((b) => b.heading);
    return { meta, blocks, headings };
  }

  function plainText(blocks) {
    let t = '';
    blocks.forEach((b) => {
      if (b.type === 'html') t += ' ' + b.html.replace(/<[^>]+>/g, ' ');
      else if (b.type === 'callout') t += ' ' + plainText(b.blocks);
      else if (b.type === 'code') t += ' ' + b.code;
      else if (b.type === 'exercise') t += ' ' + b.title + ' ' + plainText(b.intro);
    });
    return t.replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  }

  global.Markdown = { parse, inline, plainText, slug, esc };
})(window);
