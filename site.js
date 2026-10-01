// FISCHXR site scripts
(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const body = document.body;

  // the phone menu: opens and closes, and closes on a tap or Escape
  const mb = document.querySelector('.menu-btn'), mnav = document.getElementById('mnav');
  if (mb && mnav) {
    const setOpen = (on) => { body.classList.toggle('menu-open', on); mb.setAttribute('aria-expanded', on ? 'true' : 'false'); };
    mb.addEventListener('click', () => setOpen(!body.classList.contains('menu-open')));
    mnav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) setOpen(false); });
  }

  // how far down the page you are
  const bar = document.querySelector('.progress');
  if (bar) {
    const upd = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    };
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  // things ease in as they come into view; numbers count up; grids fill in
  const countUp = (el) => {
    const to = +el.dataset.to, pre = el.dataset.pre || '';
    if (still || to === 0) { el.textContent = pre + to.toLocaleString(); return; }
    const t0 = performance.now(), ms = 1100;
    (function f(now) {
      const k = Math.min(1, (now - t0) / ms);
      el.textContent = pre + Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString();
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  };
  document.querySelectorAll('.stagger').forEach((g) => [...g.children].forEach((c, i) => { c.style.transitionDelay = (i * 55) + 'ms'; }));
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    e.target.querySelectorAll('b[data-to]').forEach(countUp);
  }), { threshold: 0.12 }) : null;
  document.querySelectorAll('.reveal, .stagger').forEach((el) => {
    if (still || !io) { el.classList.add('in'); el.querySelectorAll('b[data-to]').forEach(countUp); }
    else io.observe(el);
  });

  // live numbers from the FISCHXR service (a dash if it can't be reached)
  const FX = window.FX || {};
  const liveEls = document.querySelectorAll('b[data-live]');
  if (liveEls.length && FX.service && window.fetch) {
    const pick = (o, path) => path.split('.').reduce((v, k) => (v && v[k] !== undefined ? v[k] : undefined), o);
    const pull = () => fetch(FX.service + '/stats', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((st) => {
        if (!st) return;
        liveEls.forEach((el) => {
          const v = pick(st, el.dataset.live);
          if (v === undefined || v === null) return;
          if (el.dataset.to === String(v)) return;
          el.dataset.to = Number(v) || 0; countUp(el);
        });
      })
      .catch(() => {});
    pull(); setInterval(pull, 60000);
  }

  // point at a rod: the page takes on a little of its color
  const amb = document.createElement('div'); amb.className = 'ambient'; body.prepend(amb);
  const rgba = (hex, a) => { const n = parseInt(hex.replace('#', ''), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  let off = 0;
  document.querySelectorAll('[data-c]').forEach((el) => {
    el.style.setProperty('--c', el.dataset.c);
    el.addEventListener('pointerenter', () => {
      clearTimeout(off);
      const r = el.getBoundingClientRect();
      body.style.setProperty('--glowa', rgba(el.dataset.c, .08));
      body.style.setProperty('--gx', ((r.left + r.width / 2) / window.innerWidth * 100) + '%');
      body.style.setProperty('--gy', ((r.top + r.height / 2) / window.innerHeight * 100) + '%');
      body.classList.add('lit');
    });
    el.addEventListener('pointerleave', () => { off = setTimeout(() => body.classList.remove('lit'), 120); });
  });

  // renders tilt a little toward the cursor
  if (!still && fine) document.querySelectorAll('.tilt').forEach((img) => {
    const host = img.closest('[data-c]') || img;
    host.addEventListener('pointermove', (e) => {
      const r = img.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      img.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 8}deg) scale(1.03)`;
    });
    host.addEventListener('pointerleave', () => { img.style.transform = ''; });
  });

  // a faint light that follows the mouse
  if (!still && fine) {
    const spot = document.createElement('div'); spot.className = 'spot'; body.prepend(spot);
    let mx = -999, my = -999, sx = -999, sy = -999, on = false;
    const follow = () => { sx += (mx - sx) * .12; sy += (my - sy) * .12; spot.style.transform = `translate3d(${sx}px, ${sy}px, 0)`; requestAnimationFrame(follow); };
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; if (!on) { on = true; sx = mx; sy = my; requestAnimationFrame(follow); } }, { passive: true });
  }

  // motes drifting behind the opening
  const mc = document.getElementById('motes');
  if (mc && !still) {
    const ctx = mc.getContext('2d'); let W = 0, H = 0;
    const dots = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.6, v: .004 + Math.random() * .011, p: Math.random() * 6.28 }));
    const size = () => { const d = Math.min(2, window.devicePixelRatio || 1); W = mc.clientWidth; H = mc.clientHeight; mc.width = W * d; mc.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); window.addEventListener('resize', size);
    (function f(t) {
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) {
        d.y -= d.v / 60; if (d.y < -.02) { d.y = 1.02; d.x = Math.random(); }
        ctx.beginPath(); ctx.arc(d.x * W + Math.sin(t / 1400 + d.p) * 12, d.y * H, d.r, 0, 6.283);
        ctx.fillStyle = `rgba(160,240,230,${.14 + .18 * Math.sin(t / 900 + d.p)})`; ctx.fill();
      }
      requestAnimationFrame(f);
    })(0);
  }

  // the reel: Fisch's own look, a new rod after every catch
  const cv = document.getElementById('reel');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const rodOut = document.getElementById('rodnow'), caughtOut = document.getElementById('caught');
  let W = 0, H = 0, caught = 0, flash = 0;
  const size = () => {
    const d = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  // the rods' own art, from the game
  const fx = {};
  [['emblem', 'noiseform-emblem'], ['slashR', 'ruinous-slash'], ['slashB', 'luminescent-slash'], ['note', 'aria-note']].forEach(([k, f]) => {
    const im = new Image(); im.src = 'assets/fx/' + f + '.png'; fx[k] = im;
  });
  const ready = (im) => im && im.complete && im.naturalWidth > 0;
  const lerp = (a, b, k) => a + (b - a) * k;
  const mix = (c1, c2, k) => `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], k))).join(',')})`;
  const rr = (x, y, w, h, r) => {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  // the rods, in the order they come round
  const RODS = [
    { name: 'Standard rod', bw: .28 },
    { name: 'Noiseform', bw: .30, look: 'noise' },
    { name: 'Verdant Oath', bw: .42, look: 'verdant' },
    { name: 'Ruinous Oath', bw: .40, look: 'shrink', to: [255, 32, 16] },
    { name: 'Luminescent Oath', bw: .40, look: 'shrink', to: [0, 16, 248] },
    { name: "Poseidon's Lance", bw: .30, look: 'poseidon' },
    { name: "Bellona's Waraxe", bw: .30, look: 'dual' },
    { name: "Apollo's Sunshot", bw: .30, look: 'apollo' },
    { name: 'Cinder Block Rod', bw: 1, look: 'cinder' },
    { name: "Pinion's Aria", bw: .28, look: 'pinion' },
  ];
  let ri = 0, rod = RODS[0];
  const reel = () => ({ fx: .5, ft: .5, fv: 0, bc: .5, bv: 0, next: 0 });
  let A = reel(), B = reel(), prog = .25, t = 0, notes = [], noteT = 0, hurt = 0, slashes = [], slashT = 0;
  const newRod = () => {
    ri = (ri + 1) % RODS.length; rod = RODS[ri]; A = reel(); B = reel(); prog = .25; notes = []; hurt = 0; flash = 1; slashes = []; slashT = 0;
    if (rodOut) rodOut.textContent = rod.name;
  };
  const barW = () => rod.look === 'shrink' ? lerp(rod.bw, .16, prog) : rod.look === 'verdant' ? lerp(.42, .30, prog) : rod.bw;
  const zoneW = () => lerp(.46, .16, prog);                     // Verdant's green, as a share of the bar
  function steer(s, dt, bw) {
    if (t > s.next) { s.ft = .06 + Math.random() * .88; s.next = t + .8 + Math.random() * 2.1; }
    s.fv += ((s.ft - s.fx) * 5 - s.fv * 3.2) * dt;
    s.fx = Math.min(.98, Math.max(.02, s.fx + s.fv * dt));
    if (bw >= 1) { s.bc = .5; return; }
    const hold = s.fx > s.bc + s.bv * .28;                    
    s.bv += (hold ? 1.9 : -1.9) * dt - s.bv * 1.1 * dt;
    s.bc += s.bv * dt;
    const hw = bw / 2;
    if (s.bc < hw) { s.bc = hw; s.bv = Math.max(0, s.bv); }
    if (s.bc > 1 - hw) { s.bc = 1 - hw; s.bv = Math.min(0, s.bv); }
  }
  function step(dt) {
    t += dt; flash = Math.max(0, flash - dt * 2); hurt = Math.max(0, hurt - dt * 1.6);
    const bw = barW();
    steer(A, dt, bw);
    let gain = Math.abs(A.fx - A.bc) <= bw / 2 ? .2 : -.1;
    if (rod.look === 'dual') { steer(B, dt, bw); gain = (Math.abs(A.fx - A.bc) <= bw / 2 ? .11 : -.05) + (Math.abs(B.fx - B.bc) <= bw / 2 ? .11 : -.05); }
    if (rod.look === 'poseidon' && Math.abs(A.fx - A.bc) <= bw * .21) gain = .32;        // the blue pays more
    if (rod.look === 'verdant') {
      const d = Math.abs(A.fx - A.bc), zh = bw * zoneW() / 2;
      if (d <= zh) gain = .26; else if (d <= bw / 2) { gain = -.16; hurt = 1; }                // the wood hurts
    }
    if (rod.look === 'cinder') gain = .14;
    if (rod.look === 'shrink') {                                         // Ruinous and Luminescent: slashes
      slashT += dt;
      while (slashT >= 1) {
        slashT -= 1;
        if (Math.random() < 1 / 3) { slashes.push({ t: .5, at: A.bc + (Math.random() - .5) * bw * .5 }); prog += .07; }
      }
      slashes.forEach((sl) => { sl.t -= dt; });
      slashes = slashes.filter((sl) => sl.t > 0);
    }
    if (rod.look === 'pinion') {
      noteT -= dt;
      if (noteT <= 0) { notes.push({ x: .08 + Math.random() * .84, y: 0 }); noteT = .9 + Math.random() * .8; }
      for (const n of notes) n.y += dt * .55;
      notes = notes.filter((n) => {
        if (n.y < 1) return true;
        if (Math.abs(n.x - A.bc) <= bw / 2) { gain += 3; return false; }                     // caught a note
        return false;
      });
    }
    prog = Math.min(1, Math.max(0, prog + gain * dt));
    if (prog >= 1) { caught++; if (caughtOut) caughtOut.textContent = caught + ' caught'; newRod(); }
  }
  // drawing, in Fisch's style
  function track(x, y, w, h) {
    rr(x, y, w, h, 2); ctx.fillStyle = rod.look === 'noise' ? 'rgba(14,30,28,.62)' : 'rgba(14,30,28,.92)'; ctx.fill();
    ctx.strokeStyle = 'rgba(120,160,150,.18)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function caps(x, y, w, h) {
    ctx.fillStyle = rod.look === 'verdant' ? '#5FC23A' : '#7A4A33';
    const m = y + h / 2, s = h * .28;
    ctx.beginPath(); ctx.moveTo(x - 16, m - s); ctx.lineTo(x - 16 + s * 1.3, m); ctx.lineTo(x - 16, m + s); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + w + 16, m - s); ctx.lineTo(x + w + 16 - s * 1.3, m); ctx.lineTo(x + w + 16, m + s); ctx.fill();
  }
  function arrows(x, y, w, h, col) {
    ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const m = y + h / 2, a = h * .22;
    if (w < 70) return;
    ctx.beginPath();
    ctx.moveTo(x + 14 + a, m - a); ctx.lineTo(x + 14, m); ctx.lineTo(x + 14 + a, m + a); ctx.moveTo(x + 14, m); ctx.lineTo(x + 14 + a * 2.2, m);
    ctx.moveTo(x + w - 14 - a, m - a); ctx.lineTo(x + w - 14, m); ctx.lineTo(x + w - 14 - a, m + a); ctx.moveTo(x + w - 14, m); ctx.lineTo(x + w - 14 - a * 2.2, m);
    ctx.stroke();
  }
  function fish(fx, y, h) {
    rr(fx - 4, y - 7, 8, h + 14, 4); ctx.fillStyle = '#434B5B'; ctx.fill();
    ctx.fillStyle = 'rgba(160,172,190,.55)';                          // the little fish above it
    ctx.beginPath(); ctx.ellipse(fx + 2, y - 19, 11, 5.5, -.45, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.moveTo(fx - 7, y - 14); ctx.lineTo(fx - 14, y - 10); ctx.lineTo(fx - 12, y - 19); ctx.closePath(); ctx.fill();
  }
  function drawBar(s, x, y, w, h, bw) {
    const bx = x + (s.bc - bw / 2) * w, bwp = bw * w, inside = Math.abs(s.fx - s.bc) <= bw / 2;
    switch (rod.look) {
      case 'noise': {
        if (inside) { const g = ctx.createLinearGradient(bx, 0, bx + bwp, 0); g.addColorStop(0, '#9CF7C9'); g.addColorStop(.5, '#E8FFF3'); g.addColorStop(1, '#9CF7C9'); ctx.fillStyle = g; }
        else ctx.fillStyle = 'rgba(70,90,80,.85)';
        rr(bx, y, bwp, h, 2); ctx.fill(); ctx.strokeStyle = '#050505'; ctx.lineWidth = 2; ctx.stroke();
        arrows(bx, y, bwp, h, '#060606'); break;
      }
      case 'verdant': {
        const zw = bwp * zoneW(), zx = bx + (bwp - zw) / 2;
        ctx.fillStyle = hurt > 0 ? mix([107, 81, 44], [150, 14, 6], hurt) : '#6B512C';
        rr(bx, y, bwp, h, 1); ctx.fill();
        const g = ctx.createLinearGradient(zx, 0, zx + zw, 0);
        g.addColorStop(0, '#B6FF7A'); g.addColorStop(.12, '#3FA92A'); g.addColorStop(.5, '#0F2A0A'); g.addColorStop(.88, '#3FA92A'); g.addColorStop(1, '#B6FF7A');
        ctx.fillStyle = g; ctx.fillRect(zx, y, zw, h);
        ctx.shadowColor = 'rgba(120,255,80,.6)'; ctx.shadowBlur = 16; ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(zx, y, zw, h); ctx.shadowBlur = 0;
        break;
      }
      case 'shrink': {
        ctx.fillStyle = mix([241, 241, 241], rod.to, Math.min(1, prog * 1.25));
        rr(bx, y, bwp, h, 2); ctx.fill(); arrows(bx, y, bwp, h, 'rgba(120,120,120,.8)');
        for (const sl of slashes) {                                 // the slashes: in fast, out fast
          const im = rod.to[2] > 200 ? fx.slashB : fx.slashR, cx = x + sl.at * w;
          ctx.globalAlpha = Math.min(1, (.5 - sl.t) / .08, sl.t / .15);
          if (ready(im)) {
            const sh = h * 3.4, sw = sh * im.naturalWidth / im.naturalHeight;
            ctx.drawImage(im, cx - sw / 2, y + h / 2 - sh / 2, sw, sh);
          } else {
            ctx.strokeStyle = 'rgba(20,0,0,.8)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(cx - h * .5, y - 10); ctx.lineTo(cx + h * .5, y + h + 10); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        break;
      }
      case 'poseidon': {
        rr(bx, y, bwp, h, 2); ctx.fillStyle = '#F1F1F1'; ctx.fill();
        const sw = bwp * .42, sx = bx + (bwp - sw) / 2, g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, '#8CCBFF'); g.addColorStop(1, '#2F8EF0');
        rr(sx, y + 3, sw, h - 6, 6); ctx.fillStyle = g; ctx.fill();
        arrows(bx, y, bwp, h, '#8A8A8A'); break;
      }
      case 'apollo': {
        rr(bx, y, bwp, h, 1); ctx.fillStyle = inside ? '#4A2A1E' : '#15110D'; ctx.fill();
        ctx.strokeStyle = '#E8A04A'; ctx.lineWidth = 1.6; ctx.stroke();
        arrows(bx, y, bwp, h, '#F08A3A');
        rr(bx, y - 14, bwp, 5, 2); ctx.fillStyle = '#F5D86A'; ctx.fill();          // the sun bar above
        break;
      }
      case 'cinder': {
        rr(x, y, w, h, 2); ctx.fillStyle = '#F1F1F1'; ctx.fill(); arrows(x, y, w, h, '#8A8A8A');
        break;
      }
      default: {
        rr(bx, y, bwp, h, 2); ctx.fillStyle = '#F1F1F1'; ctx.fill(); arrows(bx, y, bwp, h, '#8A8A8A');
      }
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const pad = 30, ty = H * .40, th = Math.max(26, H * .2);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '600 11px Geist, "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Click & Hold Anywhere!', W / 2, ty - 34);
    if (rod.look === 'noise') {                                       // the emblem behind
      if (ready(fx.emblem)) {
        const eh = th * 4.2, ew = eh * fx.emblem.naturalWidth / fx.emblem.naturalHeight;
        ctx.globalAlpha = .85; ctx.drawImage(fx.emblem, W / 2 - ew / 2, ty + th / 2 - eh * .55, ew, eh); ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = 'rgba(80,240,160,.28)'; ctx.lineWidth = 7;
        for (const k of [-1, 1]) for (const r of [60, 95]) { ctx.beginPath(); ctx.arc(W / 2 + k * r * .55, ty + th * 1.4, r, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      }
    }
    const bw = barW();
    if (rod.look === 'dual') {
      const w2 = (W - pad * 2 - 60) / 2;
      [[A, pad], [B, pad + w2 + 60]].forEach(([s, x]) => { track(x, ty, w2, th); drawBar(s, x, ty, w2, th, bw); fish(x + s.fx * w2, ty, th); });
      caps(pad, ty, W - pad * 2, th);
    } else {
      const x = pad, w = W - pad * 2;
      track(x, ty, w, th); caps(x, ty, w, th); drawBar(A, x, ty, w, th, bw); fish(x + A.fx * w, ty, th);
      if (rod.look === 'pinion') for (const n of notes) {
        const ny = lerp(4, ty - 10, n.y);
        if (ready(fx.note)) {
          const nh = 24, nw = nh * fx.note.naturalWidth / fx.note.naturalHeight;
          ctx.drawImage(fx.note, x + n.x * w - nw / 2, ny - nh / 2, nw, nh);
        } else { rr(x + n.x * w - 7, ny - 6, 14, 12, 4); ctx.fillStyle = 'rgba(190,170,255,.95)'; ctx.fill(); }
      }
    }
    // progress, under the reel
    const pw = W * .5, px = (W - pw) / 2, py = ty + th + 20;
    rr(px, py, pw, 6, 1); ctx.fillStyle = 'rgba(20,30,30,.95)'; ctx.fill();
    ctx.fillStyle = rod.look === 'apollo' ? '#F2A33A' : rod.look === 'verdant' ? '#7BE04A' : '#F1F1F1';
    rr(px, py, Math.max(6, pw * prog), 6, 1); ctx.fill();
    if (rod.look === 'cinder') { ctx.fillStyle = 'rgba(210,220,220,.7)'; ctx.font = 'italic 13px Geist, "Segoe UI", sans-serif'; ctx.fillText('So heavy...', W / 2, py + 26); }
    if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * .35})`; ctx.fillRect(0, 0, W, H); }     // the catch
  }
  let last = 0;
  const frame = (ts) => { const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts; step(dt); draw(); requestAnimationFrame(frame); };
  size(); draw();
  window.addEventListener('resize', () => { size(); draw(); });
  if (rodOut) rodOut.textContent = rod.name;
  if (!still) requestAnimationFrame(frame);
})();

// accounts: sign in with Discord, the header, leaderboards, the profile
// User-supplied text is always inserted with textContent, never as HTML.
(() => {
  const FX = window.FX || {};
  const API = 'https://discord.com/api/v10';
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* private mode */ } },
  };
  const auth = () => { const a = store.get('fx_auth'); return a && a.exp > Date.now() ? a : null; };
  const signOut = () => { store.del('fx_auth'); store.del('fx_me'); };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const avatarOf = (u) => u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`;

  // OAuth redirect: store the token only if the state matches our request
  if (location.hash.includes('access_token=')) {
    const h = new URLSearchParams(location.hash.slice(1));
    let want = null;
    try { want = sessionStorage.getItem('fx_state'); sessionStorage.removeItem('fx_state'); } catch (e) { /* private mode */ }
    if (want && h.get('state') === want) store.set('fx_auth', { token: h.get('access_token'), exp: Date.now() + (Number(h.get('expires_in')) || 3600) * 1000 - 60000 });
    history.replaceState(null, '', location.pathname);
  }
  const signIn = () => {
    const bytes = new Uint8Array(16); crypto.getRandomValues(bytes);
    const state = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    try { sessionStorage.setItem('fx_state', state); } catch (e) { /* private mode */ }
    const back = location.origin + location.pathname.replace(/[^/]*$/, '') + 'profile.html';
    location.href = 'https://discord.com/oauth2/authorize?' + new URLSearchParams({
      client_id: FX.client, response_type: 'token', redirect_uri: back, scope: 'identify guilds.members.read', state,
    });
  };

  // the header: your picture and name once you're signed in
  const hdr = document.getElementById('signin'), me = store.get('fx_me');
  if (hdr && auth() && me) {
    hdr.textContent = '';
    const img = el('img'); img.src = me.avatar; img.alt = '';
    hdr.append(img, el('span', '', me.name));
    hdr.classList.add('in');
  }

  // leaderboards (the page's board and the home page's top 5)
  const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const linkRow = (li, id) => { const a = el('a', 'rowlink'); a.href = 'u.html?id=' + id; while (li.firstChild) a.append(li.firstChild); li.append(a); };
  // the rarest catches (by their 1-in-N odds)
  function renderRare(list, period) {
    list.textContent = ''; list.append(el('li', 'empty', 'Loading…'));
    fetch(`${FX.service}/catches?period=${period}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((b) => {
        list.textContent = '';
        const rows = b.entries || [], mine = (store.get('fx_me') || {}).id;
        if (!rows.length) { list.append(el('li', 'empty', 'No rare catches yet' + (period === 'week' ? ' this week.' : '.') + ' They show up once FISCHXR reads a catch of 1 in 100 or rarer.')); return; }
        for (const r of rows) {
          const li = el('li', r.id === mine ? 'you' : '');
          li.append(el('span', 'rank', MEDALS[r.rank] || '#' + r.rank));
          const img = el('img'); img.src = `${FX.service}/avatar/${r.id}`; img.alt = ''; img.loading = 'lazy'; img.onerror = () => img.remove();
          const who = el('span', 'who');
          who.append(el('b', '', r.fish), el('small', '', r.name + (r.rod ? ', ' + r.rod : '')));
          li.append(img, who);
          if (r.id === mine) li.append(el('span', 'tag', 'You'));
          const right = el('span', 'count');
          right.append(el('b', 'odds', '1 in ' + Number(r.odds).toLocaleString()), el('small', '', Number(r.kg).toLocaleString() + ' kg'));
          li.append(right);
          linkRow(li, r.id);
          list.append(li);
        }
      })
      .catch(() => { list.textContent = ''; list.append(el('li', 'empty', "The rarest catches couldn't be loaded right now.")); });
  }
  function renderBoard(list, period) {
    if (period.startsWith('rare-')) return renderRare(list, period.slice(5));
    const limit = Number(list.dataset.limit) || 25;
    list.textContent = ''; list.append(el('li', 'empty', 'Loading…'));
    fetch(`${FX.service}/leaderboard?period=${period}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((b) => {
        list.textContent = '';
        const rows = (b.entries || []).slice(0, limit), mine = (store.get('fx_me') || {}).id;
        if (!rows.length) { list.append(el('li', 'empty', period === 'week' ? 'Nobody on the board yet this week. Start fishing!' : 'Nobody on the board yet. Start fishing!')); return; }
        for (const r of rows) {
          const li = el('li', r.id === mine ? 'you' : '');
          li.append(el('span', 'rank', MEDALS[r.rank] || '#' + r.rank));
          const img = el('img'); img.src = `${FX.service}/avatar/${r.id}`; img.alt = ''; img.loading = 'lazy'; img.onerror = () => img.remove();
          li.append(img, el('span', 'who', r.name));
          if (r.id === mine) li.append(el('span', 'tag', 'You'));
          li.append(el('span', 'count', Number(r.reels).toLocaleString() + ' reels'));
          linkRow(li, r.id);
          list.append(li);
        }
      })
      .catch(() => { list.textContent = ''; list.append(el('li', 'empty', "The leaderboard couldn't be loaded right now.")); });
  }
  document.querySelectorAll('ol.board[data-period]').forEach((l) => renderBoard(l, l.dataset.period));
  document.querySelectorAll('.tabs button[data-period]').forEach((b, _, all) => b.addEventListener('click', () => {
    all.forEach((x) => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
    const list = document.getElementById('board');
    if (list) renderBoard(list, b.dataset.period);
  }));

  // the profile page
  const pin = document.getElementById('profile-in'), pout = document.getElementById('profile-out');
  if (!pin || !pout) return;
  const btn = document.getElementById('pf-signin');
  if (btn) btn.addEventListener('click', () => {
    if (location.protocol === 'file:') { document.getElementById('pf-msg').textContent = 'Signing in works on the website itself, not on a copy opened from your computer.'; return; }
    signIn();
  });
  const a = auth();
  if (!a) return;
  const bearer = { headers: { Authorization: 'Bearer ' + a.token } };
  const get = (url) => fetch(url, bearer).then((r) => (r.status === 200 ? r.json() : r.status === 401 ? Promise.reject('auth') : null)).catch((e) => (e === 'auth' ? Promise.reject(e) : null));
  Promise.all([get(API + '/users/@me'), get(`${API}/users/@me/guilds/${FX.server}/member`), get(FX.service + '/me?profile=1')])
    .then(([user, member, svc]) => {
      if (!user) return Promise.reject('auth');
      pout.hidden = true; pin.hidden = false;
      const name = user.global_name || user.username;
      store.set('fx_me', { id: user.id, name, avatar: avatarOf(user) });
      // who you are
      const banner = document.getElementById('pf-banner');
      if (user.banner) banner.style.backgroundImage = `url("https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner.startsWith('a_') ? 'gif' : 'png'}?size=600")`;
      else if (user.accent_color) banner.style.background = `linear-gradient(135deg, #${user.accent_color.toString(16).padStart(6, '0')}, #0B0B0B)`;
      const av = document.getElementById('pf-avatar'); av.src = avatarOf(user);
      document.getElementById('pf-name').textContent = name;
      document.getElementById('pf-user').textContent = '@' + user.username;
      const plus = svc && (svc.access === 'grant' || (svc.access !== 'revoke' && member && member.premium_since));
      const badges = document.getElementById('pf-badges');
      if (plus) badges.append(el('span', 'badge plus', 'FISCHXR Plus'));
      if (member && member.premium_since) badges.append(el('span', 'badge boost', 'Boosting'));
      const roles = document.getElementById('pf-roles');
      (FX.roles || []).forEach(([id, rname, col]) => {
        if (member && (member.roles || []).includes(id)) { const c = el('span', 'chip', rname); c.style.setProperty('--c', col); roles.append(c); }
      });
      const warn = document.getElementById('pf-warn');
      if (svc && svc.blacklisted) { warn.hidden = false; warn.textContent = "Your account can't sign in to FISCHXR" + (svc.reason ? ': ' + svc.reason : '.'); }
      else if (!member) { warn.hidden = false; warn.classList.add('soft'); warn.textContent = "You're not in the FISCHXR Discord server, so your roles and boost don't show here. Join it from the menu."; }
      // your macro
      const dl = document.getElementById('pf-macro');
      const row = (k, v) => dl.append(el('dt', '', k), el('dd', '', v));
      const st = svc && svc.state;
      if (!svc) row('Status', "Couldn't reach the FISCHXR service. Try again in a minute.");
      else if (!st) row('Status', "Your macro hasn't reported in yet. Sign in to FISCHXR with Discord in the app.");
      else {
        const fresh = st.fishing && Date.now() - (st.at || 0) < 15 * 60000;
        row('Status', fresh ? 'Fishing now' : 'Not fishing');
        if (st.rod) row('Rod', st.rod);
        const newer = (x, y) => { const p = String(x).split('.').map(Number), q = String(y).split('.').map(Number); for (let i = 0; i < 3; i++) if ((p[i] || 0) !== (q[i] || 0)) return (p[i] || 0) > (q[i] || 0); return false; };
        row('Version', st.version + (newer(FX.version, st.version) ? ` (${FX.version} is out)` : ''));
        const mins = Math.round((Date.now() - (st.at || 0)) / 60000);
        row('Last heard from', mins < 1 ? 'just now' : mins < 60 ? mins + ' min ago' : mins < 2880 ? Math.round(mins / 60) + ' h ago' : Math.round(mins / 1440) + ' days ago');
      }
      // your reels
      const lb = (svc && svc.lb) || null;
      if (lb) {
        document.getElementById('pf-week').textContent = lb.week.toLocaleString();
        document.getElementById('pf-all').textContent = lb.total.toLocaleString();
        document.getElementById('pf-hours').textContent = (lb.secs / 3600).toFixed(lb.secs < 36000 ? 1 : 0);
        if (lb.hidden) { document.getElementById('pf-week-rank').textContent = 'this week (hidden)'; document.getElementById('pf-all-rank').textContent = 'all time (hidden)'; }
        else {
          if (lb.rankWeek) document.getElementById('pf-week-rank').textContent = `this week, #${lb.rankWeek} of ${lb.peopleWeek}`;
          if (lb.rankAll) document.getElementById('pf-all-rank').textContent = `all time, #${lb.rankAll} of ${lb.peopleAll}`;
        }
        // milestones: lifetime reels and hours fished
        const TIER = ['#CD7F32', '#C9CCD6', '#FFC940', '#3FE08A', '#4F8BFF', '#A970FF', '#FF4FD8'];
        const REELS = [100, 1000, 5000, 10000, 25000, 50000, 100000], HOURS = [10, 50, 100, 250, 500, 1000];
        const life = lb.lifetime || 0, hrs = (lb.secs || 0) / 3600;
        const msBox = document.getElementById('pf-ms'), nextBox = document.getElementById('pf-ms-next');
        const badge = (label, sub, got, i) => {
          const b = el('div', 'ms' + (got ? ' got' : ''));
          b.style.setProperty('--t', TIER[i]);
          b.append(el('b', '', label), el('span', '', sub));
          b.title = got ? 'Earned' : 'Not yet';
          return b;
        };
        REELS.forEach((m, i) => msBox.append(badge(m >= 1000 ? m / 1000 + 'k' : String(m), 'reels', life >= m, i)));
        HOURS.forEach((m, i) => msBox.append(badge(m >= 1000 ? m / 1000 + 'k' : String(m), 'hours', hrs >= m, i)));
        const next = (val, list, unit) => {
          const m = list.find((x) => val < x);
          if (!m) return;
          const row = el('div', 'ms-row');
          row.append(el('span', '', `Next: ${m.toLocaleString()} ${unit}`));
          const track = el('div', 'ms-bar'), fill = el('i');
          fill.style.width = Math.min(100, (val / m) * 100).toFixed(1) + '%';
          track.append(fill);
          row.append(track, el('span', 'ms-of', `${Math.floor(val).toLocaleString()} / ${m.toLocaleString()}`));
          nextBox.append(row);
        };
        next(life, REELS, 'reels'); next(hrs, HOURS, 'hours');
        const show = document.getElementById('pf-show');
        show.checked = !lb.hidden;
        show.addEventListener('change', () => {
          show.disabled = true;
          fetch(FX.service + '/me/leaderboard', { method: 'PUT', headers: { Authorization: 'Bearer ' + a.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ hide: !show.checked }) })
            .then((r) => { if (!r.ok) show.checked = !show.checked; })
            .catch(() => { show.checked = !show.checked; })
            .finally(() => { show.disabled = false; });
        });
      } else document.getElementById('pf-show').disabled = true;
      // best catches, and whether catch DMs are on
      const best = document.getElementById('pf-best'), bests = (svc && svc.best) || [];
      if (!bests.length) best.append(el('li', 'empty', 'No rare catches yet. They show up once FISCHXR 5.7.0 or later reads a catch of 1 in 100 or rarer.'));
      bests.forEach((c, i) => {
        const li = el('li');
        li.append(el('span', 'rank', MEDALS[i + 1] || '#' + (i + 1)));
        const what = el('span', 'who'); what.append(el('b', '', c.fish), el('small', '', new Date(c.at).toLocaleDateString() + (c.rod ? ', ' + c.rod : '')));
        const right = el('span', 'count'); right.append(el('b', 'odds', '1 in ' + Number(c.odds).toLocaleString()), el('small', '', Number(c.kg).toLocaleString() + ' kg'));
        li.append(what, right);
        best.append(li);
      });
      if (svc) document.getElementById('pf-alerts').textContent = svc.alertMin
        ? `Catch DMs: on, for 1 in ${Number(svc.alertMin).toLocaleString()} or rarer. Change it with /catch-alerts in Discord.`
        : 'Catch DMs: off. Turn them on with /catch-alerts in Discord.';
      document.getElementById('pf-signout').addEventListener('click', () => { signOut(); location.reload(); });
      if (svc) document.dispatchEvent(new CustomEvent('fx:own', { detail: { id: user.id, user, svc, token: a.token } }));
    })
    .catch(() => { signOut(); pout.hidden = false; pin.hidden = true; const m = document.getElementById('pf-msg'); if (m) m.textContent = 'Your sign-in ran out. Sign in again.'; });
})();

// Profiles: themes and effects, the public profile page, player search, and
// the customize panel. Text from Discord or other players goes in with
// textContent, never as HTML.
(() => {
  const FX = window.FX || {};
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The macro's own theme colors (background, panels, lines, text, dim text).
  const THEMES = {
    'Black': ['#000000', '#161616', '#303030', '#FFFFFF', '#8C8C8C'],
    'Dark': ['#272727', '#2F2F2F', '#3B3B3B', '#F2F2F2', '#A8A8A8'],
    'Light': ['#FFFFFF', '#EEEEEE', '#D4D4D4', '#1A1A1A', '#5C5C5C'],
    'High contrast': ['#000000', '#1C1C1C', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    'Sakura': ['#1B0E18', '#2D1829', '#3A2235', '#FFEAF7', '#CFA7C3'],
    'Midnight': ['#0C1324', '#18233C', '#22304A', '#E8EEFF', '#9FB0D6'],
    'Emerald': ['#0B1A13', '#15291F', '#1E3629', '#E6FFF1', '#9CCBB0'],
    'Sunset': ['#1E100A', '#301B11', '#3D2317', '#FFF0E6', '#D6AE96'],
    'Aurora': ['#09141B', '#132631', '#1B3240', '#E6FBFF', '#9CC6CF'],
    'Abyss': ['#060E1C', '#0F1C33', '#162745', '#E3F0FF', '#93AED6'],
  };
  const FREE = ['Black', 'Dark', 'Light', 'High contrast'];
  const PLUS = ['Sakura', 'Midnight', 'Emerald', 'Sunset', 'Aurora', 'Abyss'];
  const ACCENTS = ['#FFFFFF', '#3FE0C8', '#4F8BFF', '#A970FF', '#FF4FD8', '#FFC940', '#FF6A3A', '#3FE08A'];
  const DEF = { theme: 'Black', accent: '#3FE0C8', bio: '', featured: -1, banner: 'discord', nameFx: false, border: false, effects: false };
  // Same rules as the service: Plus options only show while someone has Plus.
  const effective = (p, plus) => {
    const q = { ...DEF, ...(p || {}) };
    if (plus) return q;
    return { theme: FREE.includes(q.theme) ? q.theme : 'Black', accent: ACCENTS.includes(q.accent) ? q.accent : '#3FE0C8',
      bio: String(q.bio || '').slice(0, 80), featured: q.featured, banner: q.banner === 'scene' ? 'discord' : q.banner,
      nameFx: false, border: false, effects: false };
  };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const num = (n) => Number(n || 0).toLocaleString();
  const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

  // The living effects drawn over a banner, one kind per theme.
  function startFx(canvas, theme, accent) {
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return () => {};
    let W = 0, H = 0, raf = 0, t0 = 0;
    const size = () => { const d = Math.min(2, window.devicePixelRatio || 1); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); window.addEventListener('resize', size);
    const R = Math.random, n = theme === 'Midnight' ? 70 : theme === 'Aurora' ? 3 : 34;
    const parts = Array.from({ length: n }, () => ({ x: R(), y: R(), s: 0.5 + R(), p: R() * 6.28, v: 0.3 + R() * 0.7, r: R() * 6.28 }));
    const draw = (ts) => {
      const t = (ts - (t0 || (t0 = ts))) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (const q of parts) {
        if (theme === 'Sakura') {                                    // petals drifting down
          q.y += 0.0012 * q.v; q.x += Math.sin(t + q.p) * 0.0006; q.r += 0.02 * q.v;
          if (q.y > 1.05) { q.y = -0.05; q.x = R(); }
          ctx.save(); ctx.translate(q.x * W, q.y * H); ctx.rotate(q.r);
          ctx.fillStyle = 'rgba(255,183,230,.75)'; ctx.beginPath(); ctx.ellipse(0, 0, 5 * q.s, 2.6 * q.s, 0, 0, 6.283); ctx.fill(); ctx.restore();
        } else if (theme === 'Midnight') {                           // stars twinkling
          ctx.fillStyle = `rgba(232,238,255,${0.15 + 0.75 * Math.abs(Math.sin(t * q.v + q.p))})`;
          ctx.fillRect(q.x * W, q.y * H * 0.8, 1.6 * q.s, 1.6 * q.s);
        } else if (theme === 'Emerald') {                            // fireflies wandering
          q.x += Math.sin(t * 0.7 + q.p) * 0.0008; q.y += Math.cos(t * 0.5 + q.r) * 0.0008;
          const a = 0.25 + 0.6 * Math.abs(Math.sin(t * 1.4 + q.p)), g = ctx.createRadialGradient(q.x * W, q.y * H, 0, q.x * W, q.y * H, 7 * q.s);
          g.addColorStop(0, `rgba(123,242,186,${a})`); g.addColorStop(1, 'rgba(123,242,186,0)');
          ctx.fillStyle = g; ctx.fillRect(q.x * W - 8 * q.s, q.y * H - 8 * q.s, 16 * q.s, 16 * q.s);
        } else if (theme === 'Sunset') {                             // embers rising
          q.y -= 0.0016 * q.v; q.x += Math.sin(t * 2 + q.p) * 0.0005;
          if (q.y < -0.05) { q.y = 1.05; q.x = R(); }
          ctx.fillStyle = `rgba(255,${150 + Math.round(60 * Math.sin(t * 6 + q.p))},90,${0.4 + 0.4 * Math.abs(Math.sin(t * 3 + q.p))})`;
          ctx.beginPath(); ctx.arc(q.x * W, q.y * H, 1.6 * q.s, 0, 6.283); ctx.fill();
        } else if (theme === 'Aurora') {                             // ribbons of light
          const cols = ['63,224,200', '123,242,186', '169,112,255'], i = parts.indexOf(q);
          ctx.beginPath();
          for (let x = 0; x <= W; x += 12) ctx.lineTo(x, H * (0.25 + i * 0.12) + Math.sin(x / 90 + t * 0.6 + q.p) * 14);
          ctx.strokeStyle = `rgba(${cols[i]},.28)`; ctx.lineWidth = 16; ctx.stroke();
        } else if (theme === 'Abyss') {                              // bubbles rising
          q.y -= 0.0013 * q.v; q.x += Math.sin(t + q.p) * 0.0004;
          if (q.y < -0.05) { q.y = 1.05; q.x = R(); }
          ctx.strokeStyle = 'rgba(140,196,255,.55)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(q.x * W, q.y * H, 3 * q.s, 0, 6.283); ctx.stroke();
        } else {                                                     // the regular themes: sparkles
          ctx.globalAlpha = 0.15 + 0.7 * Math.abs(Math.sin(t * q.v + q.p));
          ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(q.x * W, q.y * H, 1.4 * q.s, 0, 6.283); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); ctx.clearRect(0, 0, W, H); };
  }

  // Applies a profile's look to a profile area (root): theme colors, banner,
  // name, bio, featured catch, border and effects.
  function paint(root, d) {
    const p = d.profile, t = THEMES[p.theme] || THEMES.Black;
    root.dataset.theme = p.theme;
    [['--pf-bg', t[0]], ['--pf-panel', t[1]], ['--pf-line', t[2]], ['--pf-text', t[3]], ['--pf-dim', t[4]], ['--pf-accent', p.accent]]
      .forEach(([k, v]) => root.style.setProperty(k, v));
    const q = (k) => root.querySelector(`[data-pf="${k}"]`);
    const card = q('card'), banner = q('banner'), name = q('name'), bio = q('bio'), feat = q('featured'), fx = q('fx');
    if (card) card.classList.toggle('border', !!p.border);
    if (name) name.classList.toggle('fx', !!p.nameFx);
    if (banner) {
      banner.style.background = ''; banner.style.backgroundImage = '';
      if (p.banner === 'scene' && PLUS.includes(p.theme)) banner.style.backgroundImage = `url("assets/themes/${p.theme.toLowerCase()}.png")`;
      else if (p.banner === 'discord' && d.banner) banner.style.backgroundImage = `url("${d.banner}")`;
      else if (p.banner === 'discord' && Number.isInteger(d.discordColor)) banner.style.background = `linear-gradient(135deg, #${d.discordColor.toString(16).padStart(6, '0')}, ${t[0]} 85%)`;
      else banner.style.background = `linear-gradient(135deg, ${p.accent}, ${t[0]} 85%)`;
    }
    if (bio) { bio.textContent = p.bio || ''; bio.hidden = !p.bio; }
    if (feat) {
      const best = d.best || [], f = p.featured >= 0 && p.featured < best.length ? best[p.featured] : null;
      feat.textContent = ''; feat.hidden = !f;
      if (f) feat.append(el('span', 'fl', 'Featured catch'), el('b', '', f.fish), el('span', 'fo', `1 in ${num(f.odds)}, ${num(f.kg)} kg`));
    }
    if (fx) {
      if (fx._stop) { fx._stop(); fx._stop = null; }
      if (p.effects && !still) fx._stop = startFx(fx, p.theme, p.accent);
    }
  }

  const rolesInto = (box, ids) => (FX.roles || []).forEach(([id, rname, col]) => {
    if ((ids || []).includes(id)) { const c = el('span', 'chip', rname); c.style.setProperty('--c', col); box.append(c); }
  });
  const bestInto = (list, best) => {
    if (!(best || []).length) { list.append(el('li', 'empty', 'No rare catches yet.')); return; }
    best.forEach((c, i) => {
      const li = el('li'); li.append(el('span', 'rank', MEDALS[i + 1] || '#' + (i + 1)));
      const w = el('span', 'who'); w.append(el('b', '', c.fish), el('small', '', c.rod || ''));
      const r = el('span', 'count'); r.append(el('b', 'odds', '1 in ' + num(c.odds)), el('small', '', num(c.kg) + ' kg'));
      li.append(w, r); list.append(li);
    });
  };
  const milestonesInto = (box, reels, hours) => {
    const TIER = ['#CD7F32', '#C9CCD6', '#FFC940', '#3FE08A', '#4F8BFF', '#A970FF', '#FF4FD8'];
    const one = (label, sub, got, i) => { const b = el('div', 'ms' + (got ? ' got' : '')); b.style.setProperty('--t', TIER[i]); b.append(el('b', '', label), el('span', '', sub)); return b; };
    [100, 1000, 5000, 10000, 25000, 50000, 100000].forEach((m, i) => box.append(one(m >= 1000 ? m / 1000 + 'k' : String(m), 'reels', reels >= m, i)));
    [10, 50, 100, 250, 500, 1000].forEach((m, i) => box.append(one(m >= 1000 ? m / 1000 + 'k' : String(m), 'hours', hours >= m, i)));
  };

  // ---- the public profile page (u.html?id=...)
  const pu = document.getElementById('pu');
  if (pu) {
    const msg = document.getElementById('pu-msg'), id = new URLSearchParams(location.search).get('id') || '';
    const say = (h, sub) => { msg.textContent = ''; msg.append(el('h1', '', h)); if (sub) msg.append(el('p', 'lede', sub)); };
    if (!/^\d{15,21}$/.test(id)) say('No such profile', 'Find people on the Players page.');
    else fetch(`${FX.service}/profile/${id}`, { cache: 'no-store' })
      .then((r) => r.json().then((j) => ({ status: r.status, j })))
      .then(({ status, j }) => {
        if (status === 404 && j.error === 'private') return say('This profile is private', 'They\'ve chosen not to show up in search or on the leaderboards.');
        if (status !== 200) return say('No FISCHXR profile', 'That person hasn\'t used FISCHXR yet.');
        msg.hidden = true; pu.hidden = false;
        document.title = j.name + ' | FISCHXR';
        document.getElementById('pu-avatar').src = j.avatar;
        document.getElementById('pu-name').textContent = j.name;
        document.getElementById('pu-status').textContent = j.fishing ? 'Fishing now' + (j.rod ? ' with ' + j.rod : '') : 'Not fishing right now';
        if (j.plus) document.getElementById('pu-badges').append(el('span', 'badge plus', 'FISCHXR Plus'));
        rolesInto(document.getElementById('pu-roles'), j.roles);
        const lb = j.lb || {};
        document.getElementById('pu-week').textContent = num(lb.week);
        document.getElementById('pu-all').textContent = num(lb.total);
        document.getElementById('pu-hours').textContent = ((lb.secs || 0) / 3600).toFixed((lb.secs || 0) < 36000 ? 1 : 0);
        if (lb.rankWeek) document.getElementById('pu-week-rank').textContent = `this week, #${lb.rankWeek} of ${lb.peopleWeek}`;
        if (lb.rankAll) document.getElementById('pu-all-rank').textContent = `since launch, #${lb.rankAll} of ${lb.peopleAll}`;
        bestInto(document.getElementById('pu-best'), j.best);
        milestonesInto(document.getElementById('pu-ms'), lb.lifetime || 0, (lb.secs || 0) / 3600);
        paint(pu, { profile: effective(j.profile, j.plus), banner: j.banner, discordColor: j.accentColor, best: j.best });
      })
      .catch(() => say('Couldn\'t load this profile', 'Try again in a minute.'));
  }

  // ---- the players page: search, or the top players
  const box = document.getElementById('psearch');
  if (box) {
    const list = document.getElementById('presults'), title = document.getElementById('ptitle');
    const show = (rows, empty) => {
      list.textContent = '';
      if (!rows.length) { list.append(el('li', 'empty', empty)); return; }
      rows.forEach((r, i) => {
        const li = el('li'), a = el('a', 'rowlink'); a.href = 'u.html?id=' + r.id;
        a.append(el('span', 'rank', r.rank ? MEDALS[r.rank] || '#' + r.rank : String(i + 1)));
        const img = el('img'); img.src = `${FX.service}/avatar/${r.id}`; img.alt = ''; img.loading = 'lazy'; img.onerror = () => img.remove();
        a.append(img, el('span', 'who', r.name), el('span', 'count', num(r.reels) + ' reels'));
        li.append(a); list.append(li);
      });
    };
    const top = () => {
      title.textContent = 'Top players';
      fetch(`${FX.service}/leaderboard?period=all`, { cache: 'no-store' }).then((r) => r.json())
        .then((b) => show(b.entries || [], 'Nobody on the board yet.')).catch(() => show([], "Players couldn't be loaded right now."));
    };
    let timer = 0;
    box.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const q = box.value.trim();
        if (q.length < 2) return top();
        title.textContent = `Results for "${q}"`;
        fetch(`${FX.service}/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' }).then((r) => r.json())
          .then((b) => show(b.results || [], 'No players found. Hidden profiles don\'t show up in search.'))
          .catch(() => show([], "Search isn't available right now."));
      }, 300);
    });
    top();
  }

  // ---- your own profile: paint it and build the customize panel
  document.addEventListener('fx:own', (e) => {
    const { id, user, svc, token } = e.detail, root = document.getElementById('profile-in'), edit = document.getElementById('pf-edit');
    if (!root || !edit) return;
    const plus = !!svc.plus, best = svc.best || [];
    const dBanner = user.banner ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner.startsWith('a_') ? 'gif' : 'png'}?size=600` : null;
    let draft = { ...DEF, ...(svc.profileSaved || {}) };
    const dColor = Number.isInteger(user.accent_color) ? user.accent_color : null;
    const repaint = () => paint(root, { profile: effective(draft, plus), banner: dBanner, discordColor: dColor, best });
    repaint();
    const pub = document.getElementById('pf-public'); if (pub) pub.href = 'u.html?id=' + id;
    edit.textContent = '';
    edit.append(el('h3', '', 'Customize your profile'));
    if (!plus) edit.append(el('p', 'ed-note', 'Options marked Plus come with boosting the FISCHXR Discord: the Plus themes with their scenes, any color, a longer bio, an animated border, a gradient name and living effects.'));
    const row = (label) => { const r = el('div', 'ed-row'); r.append(el('span', 'ed-label', label)); const c = el('div', 'ed-ctl'); r.append(c); edit.append(r); return c; };
    const lockTag = (b) => { b.append(el('span', 'ed-plus', 'Plus')); if (!plus) { b.disabled = true; b.classList.add('locked'); } };
    // theme
    const themes = row('Theme');
    [...FREE, ...PLUS].forEach((name) => {
      const b = el('button', 'ed-theme'); b.type = 'button'; b.dataset.theme = name;
      const sw = el('span', 'sw'); sw.style.background = `linear-gradient(135deg, ${THEMES[name][0]} 50%, ${THEMES[name][1]} 50%)`;
      b.append(sw, el('span', '', name));
      if (PLUS.includes(name)) lockTag(b);
      b.setAttribute('aria-pressed', draft.theme === name ? 'true' : 'false');
      b.addEventListener('click', () => { draft.theme = name; themes.querySelectorAll('.ed-theme').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); repaint(); });
      themes.append(b);
    });
    // accent color
    const acc = row('Accent color');
    ACCENTS.forEach((c) => {
      const b = el('button', 'ed-swatch'); b.type = 'button'; b.style.background = c; b.setAttribute('aria-label', c); b.dataset.color = c;
      b.setAttribute('aria-pressed', draft.accent === c ? 'true' : 'false');
      b.addEventListener('click', () => { draft.accent = c; acc.querySelectorAll('.ed-swatch').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); repaint(); });
      acc.append(b);
    });
    const pick = el('input'); pick.type = 'color'; pick.className = 'ed-pick'; pick.value = /^#[0-9A-F]{6}$/i.test(draft.accent) ? draft.accent : '#3FE0C8';
    pick.disabled = !plus; pick.title = plus ? 'Any color' : 'Any color comes with Plus';
    pick.addEventListener('input', () => { draft.accent = pick.value.toUpperCase(); acc.querySelectorAll('.ed-swatch').forEach((x) => x.setAttribute('aria-pressed', 'false')); repaint(); });
    const pl = el('label', 'ed-pickwrap'); pl.append(pick, el('span', 'ed-plus', 'Plus')); acc.append(pl);
    // banner
    const ban = row('Banner');
    [['discord', 'Discord banner'], ['color', 'Color'], ['scene', 'Theme scene']].forEach(([v, label]) => {
      const b = el('button', 'ed-opt', label); b.type = 'button'; b.dataset.banner = v;
      if (v === 'scene') lockTag(b);
      b.setAttribute('aria-pressed', draft.banner === v ? 'true' : 'false');
      b.addEventListener('click', () => { draft.banner = v; ban.querySelectorAll('.ed-opt').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); repaint(); });
      ban.append(b);
    });
    // bio
    const bioC = row('Bio'), max = plus ? 200 : 80;
    const ta = el('textarea', 'ed-bio'); ta.maxLength = max; ta.rows = 3; ta.value = String(draft.bio || '').slice(0, max); ta.placeholder = 'A line about you';
    const cnt = el('span', 'ed-count', `${ta.value.length} / ${max}`);
    ta.addEventListener('input', () => { draft.bio = ta.value; cnt.textContent = `${ta.value.length} / ${max}`; repaint(); });
    bioC.append(ta, cnt);
    // featured catch
    const featC = row('Featured catch'), sel = el('select', 'ed-sel');
    sel.append(new Option('None', '-1'));
    best.forEach((c, i) => sel.append(new Option(`${c.fish} (1 in ${num(c.odds)})`, String(i))));
    sel.value = String(draft.featured); sel.disabled = !best.length;
    sel.addEventListener('change', () => { draft.featured = Number(sel.value); repaint(); });
    featC.append(sel);
    // Plus effects
    const fxC = row('Plus effects');
    [['nameFx', 'Gradient name'], ['border', 'Animated border'], ['effects', 'Living effects']].forEach(([k, label]) => {
      const l = el('label', 'switch' + (plus ? '' : ' locked')), i = el('input'); i.type = 'checkbox'; i.checked = !!draft[k]; i.disabled = !plus; i.dataset.key = k;
      i.addEventListener('change', () => { draft[k] = i.checked; repaint(); });
      l.append(i, el('span'), document.createTextNode(' ' + label + ' ')); l.append(el('span', 'ed-plus', 'Plus'));
      fxC.append(l);
    });
    // save
    const foot = el('div', 'ed-foot'), save = el('button', 'btn white', 'Save'), status = el('span', 'ed-status');
    save.type = 'button';
    save.addEventListener('click', () => {
      save.disabled = true; status.textContent = 'Saving…';
      fetch(FX.service + '/me/profile', { method: 'PUT', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => { paint(root, { profile: j.profile, banner: dBanner, discordColor: dColor, best }); status.textContent = 'Saved.'; })
        .catch(() => { status.textContent = "Couldn't save. Try again in a minute."; })
        .finally(() => { save.disabled = false; });
    });
    foot.append(save, status); edit.append(foot);
  });
  window.FXProfiles = { effective, paint, THEMES };
})();
