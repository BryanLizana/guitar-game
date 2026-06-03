// ── DOM references ─────────────────────────────────────────────────────
const $cv  = document.getElementById('cv');
const $pb  = document.getElementById('pb');
const $ssel = document.getElementById('sb-sel');
const $sn  = document.getElementById('sb-n');
const $sr  = document.getElementById('sel-rect');

// ── Component factory ──────────────────────────────────────────────────
function mk(type, x, y) {
  const d = JSON.parse(JSON.stringify(D[type] || {}));
  const maxZ = cc().length ? Math.max(...cc().map(c => c.z || 1)) : 0;
  return {id:S.nid++, type, x:Math.round(x), y:Math.round(y), width:d.w||160, height:d.h||32, z:maxZ+1, ...d};
}

// ── HTML generators ────────────────────────────────────────────────────
function html(c) {
  switch (c.type) {
    case 'lbl':
      return `<div class="wf-lbl" style="color:${c.tc};font-size:${c.fs}px;">${c.label}</div>`;
    case 'h1':
      return `<div class="wf-h1" style="color:${c.tc};font-size:${c.fs}px;font-weight:${c.fw||700};">${c.label}</div>`;
    case 'inp':
    case 'num':
      return `<div class="wf-inp" style="background:${c.bg};color:${c.tc};">${c.ph||''}</div>`;
    case 'ta':
      return `<div class="wf-ta" style="background:${c.bg};color:${c.tc};">${c.ph||''}</div>`;
    case 'date':
      return `<div class="wf-date" style="background:${c.bg};">📅<span style="color:${c.tc};margin-left:6px;">${c.ph||'dd/mm/aaaa'}</span></div>`;
    case 'sel': {
      const opts = (c.opts || '').split('\n');
      const shown = (opts[Math.min(c.si||0, opts.length-1)] || 'Opción').trim();
      return `<div class="wf-sel"><div class="wf-sel-val" style="background:${c.bg};color:${c.tc};">${shown}</div><div class="wf-sel-arr" style="background:${c.arrbg||'#e8eaee'};">▼</div></div>`;
    }
    case 'search':
      return `<div class="wf-search"><div class="wf-search-ico">🔍</div><div class="wf-search-ph" style="background:${c.bg};color:${c.tc};">${c.ph||'Buscar...'}</div><div class="wf-search-btn" style="background:${c.btnbg};color:${c.btnc};">${c.btnlabel||'Buscar'}</div></div>`;
    case 'chk':
      return `<div class="wf-chk" style="color:${c.tc};"><div class="wf-chkbox ${c.checked?'on':''}">${c.checked?'✓':''}</div><span>${c.label}</span></div>`;
    case 'rad': {
      const rows = (c.opts||'').split('\n').map((o,i) =>
        `<div class="wf-ri"><div class="wf-rdot ${i===c.si?'on':''}"></div><span style="color:${c.tc};">${o.trim()}</span></div>`
      ).join('');
      return `<div class="wf-radio">${rows}</div>`;
    }
    case 'slide': {
      const pct = Math.round(((c.val - c.min) / Math.max(1, c.max - c.min)) * 100);
      return `<div class="wf-slide" style="background:${c.bg};">
        ${c.label ? `<div class="wf-slide-lbl" style="color:${c.tc};">${c.label}</div>` : ''}
        <div class="wf-slide-row">
          <div class="wf-slide-track" style="background:${c.trackbg||'#e0e0e0'};">
            <div class="wf-slide-fill" style="width:${pct}%;background:${c.ac};"></div>
            <div class="wf-slide-thumb" style="left:${pct}%;background:${c.ac};"></div>
          </div>
          <span class="wf-slide-val" style="color:${c.ac};">${c.val}</span>
        </div>
        ${c.showlimits!==false ? `<div class="wf-slide-limits"><span>${c.min}</span><span>${c.max}</span></div>` : ''}
      </div>`;
    }
    case 'btn':
      return `<div class="wf-btn" style="background:${c.bg};color:${c.tc};font-size:${c.fs}px;border-radius:${c.br||4}px;">${c.label}</div>`;
    case 'badge':
      return `<div style="height:100%;display:flex;align-items:center;"><div class="wf-badge" style="background:${c.bg};color:${c.tc};font-size:${c.fs}px;">${c.label}</div></div>`;
    case 'alert': {
      const VS = {
        info:    {bg:'#eff6ff', bc:'#93c5fd', ic:'ℹ', tc:'#1e40af'},
        success: {bg:'#f0fdf4', bc:'#86efac', ic:'✓', tc:'#166534'},
        warning: {bg:'#fffbeb', bc:'#fcd34d', ic:'⚠', tc:'#92400e'},
        error:   {bg:'#fef2f2', bc:'#fca5a5', ic:'✕', tc:'#991b1b'},
      };
      const v = VS[c.variant || 'info'];
      return `<div class="wf-alert" style="background:${c.bg||v.bg};border:1.5px solid ${c.bc||v.bc};"><span class="wf-alert-ico" style="color:${c.tc||v.tc};">${v.ic}</span><span class="wf-alert-msg" style="color:${c.tc||v.tc};">${c.label}</span></div>`;
    }
    case 'tbl': {
      const cols = c.cols || 3, rows = c.rows || 4;
      const hdrs = (c.hdrs || '').split('\n').slice(0, cols);
      while (hdrs.length < cols) hdrs.push(`Col ${hdrs.length + 1}`);
      const pad = {compact:'3px 8px', normal:'8px 10px', spacious:'12px 14px'}[c.density || 'spacious'];
      const fs = c.fsize || 12, bc = c.bcolor || '#cccccc';
      const thS = `padding:${pad};border:1px solid ${bc};text-align:${c.balign||'left'};font-size:${fs}px;font-weight:600;white-space:nowrap;`;
      const tdS = `padding:${pad};border:1px solid ${bc};text-align:${c.balign||'left'};font-size:${fs}px;white-space:nowrap;`;
      const numTh = c.shownums ? `<th style="${thS}background:${c.hbg};color:#aaa;font-size:${Math.max(9,fs-2)}px;">#</th>` : '';
      const ths = hdrs.map(h => `<th style="${thS}background:${c.hbg};color:${c.hc||c.tc};">${h.trim()}</th>`).join('');
      let trs = '';
      for (let r = 0; r < rows; r++) {
        const rbg = (c.striped && r % 2 === 1) ? c.sbg : c.bg;
        const numTd = c.shownums ? `<td style="${tdS}background:${rbg};color:#ccc;">${r+1}</td>` : '';
        trs += `<tr>${numTd}${Array(cols).fill(0).map(() => `<td style="${tdS}background:${rbg};color:#ccc;">───────</td>`).join('')}</tr>`;
      }
      let totalTr = '';
      if (c.showtotal) {
        const nT = c.shownums ? `<td style="${tdS}background:${c.totalbg||'#fffbe6'};font-weight:700;color:#888;">Σ</td>` : '';
        totalTr = `<tr>${nT}${Array(cols).fill(0).map((_,ci) => `<td style="${tdS}background:${c.totalbg||'#fffbe6'};font-weight:700;color:${c.tc};">${ci===0?(c.totalrow||'Total'):'──'}</td>`).join('')}</tr>`;
      }
      return `<div class="wf-tbl"><table style="color:${c.tc};"><thead><tr>${numTh}${ths}</tr></thead><tbody>${trs}${totalTr}</tbody></table></div>`;
    }
    case 'prog': {
      const pct = Math.min(100, Math.max(0, c.val || 0));
      return `<div class="wf-prog" style="background:${c.bg};">
        <div class="wf-prog-top">
          <span class="wf-prog-lbl" style="color:${c.tc};">${c.label||''}</span>
          ${c.showval!==false ? `<span class="wf-prog-pct" style="color:${c.ac};">${pct}%</span>` : ''}
        </div>
        <div class="wf-prog-wrap" style="background:${c.trackbg||'#e5e7eb'};">
          <div class="wf-prog-fill" style="width:${pct}%;background:${c.ac};"></div>
        </div>
      </div>`;
    }
    case 'pgn': {
      const total = c.total || 5, cur = c.si || 2;
      let btns = `<div class="wf-pg" style="color:${c.tc};">◀</div>`;
      for (let i = 1; i <= total; i++)
        btns += `<div class="wf-pg ${i===cur?'on':''}" style="${i===cur?`background:${c.ac};color:#fff;border-color:${c.ac};`:`color:${c.tc};`}">${i}</div>`;
      btns += `<div class="wf-pg" style="color:${c.tc};">▶</div>`;
      return `<div class="wf-pgn">${btns}</div>`;
    }
    case 'card':
      return `<div class="wf-card" style="background:${c.bg};"><div class="wf-card-hdr" style="background:${c.hbg};color:${c.tc};">${c.label}</div><div class="wf-card-body">${c.body||''}</div></div>`;
    case 'arr': {
      const pts = {right:[4,50,96,50],left:[96,50,4,50],down:[50,4,50,96],up:[50,96,50,4],se:[4,4,96,96],ne:[4,96,96,4],sw:[96,4,4,96],nw:[96,96,4,4]};
      const [x1,y1,x2,y2] = pts[c.dir||'right'] || pts.right;
      const col = c.ac||'#e94560', lw = c.lw||2, mid = `m${c.id}`;
      const ap = `<path d="M0,0 L10,5 L0,10 z" fill="${col}"/>`;
      const mEnd = `<marker id="${mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">${ap}</marker>`;
      const mSt = c.bidir ? `<marker id="${mid}s" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">${ap}</marker>` : '';
      const lbl = c.label ? `<div class="wf-arr-lbl"><span style="font-size:${c.fs||11}px;color:${c.tc};font-weight:600;background:rgba(255,255,255,.85);padding:1px 6px;border-radius:3px;">${c.label}</span></div>` : '';
      return `<div class="wf-arr"><svg viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible"><defs>${mEnd}${mSt}</defs><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${lw}" ${c.dashed?'stroke-dasharray="8 5"':''} marker-end="url(#${mid})" ${c.bidir?`marker-start="url(#${mid}s)"`:''}/></svg>${lbl}</div>`;
    }
    case 'nav': {
      const items = (c.items||'').split('\n').filter(x => x.trim());
      return `<div class="wf-nav" style="background:${c.bg};border-bottom:1px solid #e5e7eb;">
        <div class="wf-nav-logo" style="color:${c.lc||'#1a1a2e'};">${c.logo||'Logo'}</div>
        <div class="wf-nav-items">${items.map((it,i) => `<div class="wf-nav-item ${i===c.si?'on':''}" style="color:${i===c.si?(c.ac||'#4a7af7'):(c.tc||'#555')};${i===c.si?`border-bottom:2px solid ${c.ac||'#4a7af7'};`:''}">${it.trim()}</div>`).join('')}</div>
      </div>`;
    }
    case 'imgph':
      return `<div class="wf-imgph" style="background:${c.bg||'#f0f0f0'};border:1.5px solid ${c.bc||'#cccccc'};">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="0" y1="0" x2="100" y2="100" stroke="${c.lc||'#cccccc'}" stroke-width="1.5"/><line x1="100" y1="0" x2="0" y2="100" stroke="${c.lc||'#cccccc'}" stroke-width="1.5"/></svg>
        ${c.label ? `<div class="wf-imgph-lbl" style="color:${c.tc||'#888'};">${c.label}</div>` : ''}
      </div>`;
    case 'box':
      return `<div class="wf-box" style="background:${c.bg};color:${c.tc};border:${c.bw||2}px ${c.bs||'dashed'} ${c.bc||'#ccc'};">${c.label}</div>`;
    case 'sep':
      return `<div class="wf-sep"><hr style="border:none;border-top:${c.lw||2}px ${c.ls||'solid'} ${c.lc||'#ddd'};width:100%;"></div>`;
    case 'icon':
      return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${c.fs||24}px;color:${c.tc};background:${c.bg};">${c.icon||'⭐'}</div>`;
    default: return '';
  }
}

// ── DOM rendering ──────────────────────────────────────────────────────
function renderAll() {
  const rect = document.getElementById('sel-rect');
  $cv.innerHTML = '';
  $cv.appendChild(rect);
  cc().forEach(c => $cv.appendChild(mkEl(c)));
  $cv.classList.toggle('multi', S.multiSel.size > 1);
  status();
}

function mkEl(c) {
  const el = document.createElement('div');
  el.className = 'comp' + (S.multiSel.has(c.id) ? ' sel' : '');
  el.dataset.id = c.id;
  el.style.cssText = `left:${c.x}px;top:${c.y}px;width:${c.width}px;height:${c.height}px;z-index:${c.z||1};`;
  el.innerHTML = html(c) + '<div class="rh"></div>';
  el.addEventListener('mousedown', onCompDown);
  el.addEventListener('dblclick', e => { e.stopPropagation(); startInlineEdit(el, c); });
  el.querySelector('.rh').addEventListener('mousedown', e => onResDown(e, c.id));
  return el;
}

function patch(c) {
  const el = $cv.querySelector(`[data-id="${c.id}"]`); if (!el) return;
  el.style.left = c.x + 'px'; el.style.top = c.y + 'px';
  el.style.width = c.width + 'px'; el.style.height = c.height + 'px';
  el.style.zIndex = c.z || 1;
  el.className = 'comp' + (S.multiSel.has(c.id) ? ' sel' : '');
  el.innerHTML = html(c) + '<div class="rh"></div>';
  el.querySelector('.rh').addEventListener('mousedown', e => onResDown(e, c.id));
}

function updVis() {
  $cv.querySelectorAll('.comp').forEach(el => {
    el.classList.toggle('sel', S.multiSel.has(parseInt(el.dataset.id)));
  });
  $cv.classList.toggle('multi', S.multiSel.size > 1);
}
