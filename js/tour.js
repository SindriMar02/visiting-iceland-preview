/* Product + booking page. Every number here is live Bókun data via /api/*.
   Carries the customer all the way to the cart; payment is Bókun's. */
(async function () {
  const id = +(location.pathname.match(/\/tour\/(\d+)/) || [])[1] ||
             +new URLSearchParams(location.search).get('id');
  const root = document.getElementById('tour');
  if (!id) { root.innerHTML = '<p class="tour__loading mono">No experience selected.</p>'; return; }

  const isk = n => n == null ? '—' : n.toLocaleString('en-US').replace(/,/g, '.') + ' ISK';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // session id persists so the cart survives a reload (the cart lives on Bókun)
  let session = localStorage.getItem('vi_session');
  if (!session) { session = 'vi-' + Math.random().toString(36).slice(2, 11); localStorage.setItem('vi_session', session); }

  const today = new Date();
  const iso = d => d.toISOString().slice(0, 10);
  const start = iso(today), end = iso(new Date(Date.now() + 60 * 864e5));

  // Server build talks to Bókun live. The hosted preview has no server, so it
  // falls back to a snapshot captured from the same API, and says so on the page.
  let isSnapshot = false;
  const grab = async (live, snap) => {
    try {
      const r = await fetch(live);
      if (r.ok) return await r.json();
    } catch (e) { /* no server here */ }
    isSnapshot = true;
    const r = await fetch(snap);
    if (!r.ok) throw new Error("not available");
    return await r.json();
  };
  let product, avail;
  try {
    [product, avail] = await Promise.all([
      grab(`/api/product/${id}`, `_data/preview/product-${id}.json`),
      grab(`/api/availability/${id}?start=${start}&end=${end}`, `_data/preview/availability-${id}.json`),
    ]);
  } catch (e) {
    root.innerHTML = '<p class="tour__loading mono">This experience is not part of the preview. <a href="/visiting-iceland-preview/">Back to the guide</a></p>';
    return;
  }
  if (product.error) { root.innerHTML = '<p class="tour__loading mono">This experience could not be loaded.</p>'; return; }

  const departures = (avail.departures || []).filter(d => !d.soldOut);
  const byDate = {};
  departures.forEach(d => (byDate[d.isoDate] = byDate[d.isoDate] || []).push(d));
  const dates = Object.keys(byDate).sort();

  // ---- state ----
  const state = {
    date: dates[0] || null,
    departure: (byDate[dates[0]] || [])[0] || null,
    pax: {},                       // categoryId -> qty
  };
  const cats = product.pricingCategories.length ? product.pricingCategories
    : [{ id: 0, title: 'Participants', fullTitle: 'Participants', isDefault: true }];
  const defaultCat = cats.find(c => c.isDefault) || cats[0];
  state.pax[defaultCat.id] = 1;

  const priceFor = catId => {
    const p = (state.departure && state.departure.prices || []).find(x => x.categoryId === catId);
    return p ? p.amount : (catId === defaultCat.id ? product.price : 0);
  };
  const paxTotal = () => Object.values(state.pax).reduce((a, b) => a + b, 0);
  const total = () => Object.entries(state.pax)
    .reduce((sum, [catId, qty]) => sum + qty * (priceFor(+catId) || 0), 0);

  // ---- render ----
  const cancelLine = c => {
    if (!c || !c.rules || !c.rules.length) return 'Cancellation terms are set by the operator.';
    const r = c.rules[0];
    const h = r.cutoffHours;
    const when = h >= 48 ? `${Math.round(h / 24)} days` : `${h} hours`;
    return `Free cancellation up to ${when} before departure. After that the operator charges ${r.charge}${r.type === 'percentage' ? '%' : ' ISK'}.`;
  };

  root.removeAttribute('aria-busy');
  root.innerHTML = `
    <p class="tour__crumb"><a href="/visiting-iceland-preview/">Visiting Iceland</a> <span>/</span> <span>${esc(product.vendor)}</span></p>
    <h1 class="tour__title">${esc(product.title)}</h1>
    <div class="tour__meta">
      ${product.durationText ? `<span class="mono">${esc(product.durationText)}</span>` : ''}
      <span class="mono">Operated by ${esc(product.vendor)}</span>
      ${product.minAge ? `<span class="mono">Minimum age ${product.minAge}</span>` : ''}
    </div>

    ${product.photos.length ? `
    <div class="tour__gallery">
      <figure class="g-main"><img src="${product.photos[0]}" alt="${esc(product.title)}" width="1200" height="800"></figure>
      ${product.photos.length > 1 ? `<div class="g-side">
        ${product.photos.slice(1, 3).map(p => `<figure><img src="${p}" alt="" loading="lazy" width="600" height="400"></figure>`).join('')}
      </div>` : ''}
    </div>` : ''}

    <div class="tour__body">
      <div class="tour__main">
        <section class="tour__section">
          <h2>About this experience</h2>
          <p>${esc(product.excerpt || 'Details are supplied by the operator.')}</p>
        </section>
        <section class="tour__section">
          <h2>Good to know</h2>
          <ul class="tour__facts">
            <li><span class="k">Operator</span><span class="v">${esc(product.vendor)}</span></li>
            ${product.durationText ? `<li><span class="k">Duration</span><span class="v">${esc(product.durationText)}</span></li>` : ''}
            ${product.minAge ? `<li><span class="k">Minimum age</span><span class="v">${product.minAge}</span></li>` : ''}
            <li><span class="k">Departures listed</span><span class="v">${departures.length}</span></li>
            <li><span class="k">Passenger types</span><span class="v">${cats.length}</span></li>
            <li><span class="k">Taxes</span><span class="v">included</span></li>
          </ul>
        </section>
        <section class="tour__section">
          <h2>Cancellation</h2>
          <p>${esc(cancelLine(product.cancellation))}</p>
        </section>
      </div>

      <aside class="book" id="book">
        <div class="book__from"><span class="lbl">from</span> <span class="amt">${isk(product.price)}</span></div>

        <div class="book__step">
          <h3>Choose a date</h3>
          <div class="dates" id="dates"></div>
        </div>
        <div class="book__step">
          <h3>Departure</h3>
          <div class="times" id="times"></div>
        </div>
        <div class="book__step">
          <h3>${cats.some(c => c.ageQualified) ? 'Travellers' : 'Options'}</h3>
          <div class="pax" id="pax"></div>
        </div>

        <div class="book__total"><span class="lbl">Total</span> <span class="amt" id="total">—</span></div>
        <button class="btn btn--ink book__cta" id="cta">Continue to checkout <span class="arr">→</span></button>
        <p class="book__err" id="err" hidden></p>
        <p class="book__note">${esc(cancelLine(product.cancellation))}</p>
        <div class="book__hand">
          <b>Payment is handled by Bókun.</b> We hold your selection in a secure
          cart, then hand you to Bókun's checkout to pay. We never see your card.
        </div>
        ${isSnapshot ? `<div class="book__hand book__hand--note">
          <b>Preview note.</b> These dates, times, seat counts and prices are real,
          read from your Bókun account. This hosted preview shows a snapshot; the
          live site queries Bókun on every page load.
        </div>` : ""}
      </aside>
    </div>`;

  const $ = s => document.querySelector(s);
  const datesEl = $('#dates'), timesEl = $('#times'), paxEl = $('#pax'),
        totalEl = $('#total'), cta = $('#cta'), errEl = $('#err');

  function drawDates() {
    if (!dates.length) { datesEl.innerHTML = '<p class="mono">No departures published for the next 60 days.</p>'; return; }
    datesEl.innerHTML = dates.map(d => {
      const dt = new Date(d + 'T00:00:00');
      return `<button class="date${d === state.date ? ' is-on' : ''}" data-date="${d}">
        <span class="dow">${DOW[dt.getDay()]}</span>
        <span class="dnum">${dt.getDate()}/${dt.getMonth() + 1}</span>
      </button>`;
    }).join('');
  }
  function drawTimes() {
    const list = byDate[state.date] || [];
    timesEl.innerHTML = list.map(d => {
      const low = d.seatsLeft != null && d.seatsLeft <= 8;
      return `<button class="time${d.id === (state.departure && state.departure.id) ? ' is-on' : ''}${low ? ' is-low' : ''}" data-id="${d.id}">
        ${esc(d.startTime || 'Any time')}
        <span class="seats">${d.unlimited ? 'available' : d.seatsLeft + ' left'}</span>
      </button>`;
    }).join('') || '<p class="mono">No departures on this date.</p>';
  }
  function drawPax() {
    const seats = state.departure && !state.departure.unlimited ? state.departure.seatsLeft : Infinity;
    paxEl.innerHTML = cats.map(c => {
      const qty = state.pax[c.id] || 0;
      const price = priceFor(c.id);
      return `<div class="pax__row">
        <span class="t">${esc(c.title)}
          <span class="sub">${c.ageQualified && c.minAge != null ? `Age ${c.minAge}–${c.maxAge}` : ''}${price ? (c.ageQualified && c.minAge != null ? ' · ' : '') + isk(price) : ''}</span>
        </span>
        <span class="stepper">
          <button data-cat="${c.id}" data-d="-1" ${qty <= 0 ? 'disabled' : ''} aria-label="Fewer ${esc(c.title)}">−</button>
          <span class="n">${qty}</span>
          <button data-cat="${c.id}" data-d="1" ${paxTotal() >= seats ? 'disabled' : ''} aria-label="More ${esc(c.title)}">+</button>
        </span>
      </div>`;
    }).join('');
  }
  function drawTotal() {
    const n = paxTotal();
    totalEl.textContent = n ? isk(total()) : '—';
    const min = state.departure ? state.departure.minParticipants : 1;
    const ok = state.departure && n >= Math.max(1, min);
    cta.disabled = !ok;
    errEl.hidden = true;
    if (state.departure && n > 0 && n < min) {
      errEl.hidden = false;
      errEl.textContent = `This departure takes a minimum of ${min} travellers.`;
    }
  }
  const draw = () => { drawDates(); drawTimes(); drawPax(); drawTotal(); };
  draw();

  datesEl.addEventListener('click', e => {
    const b = e.target.closest('[data-date]'); if (!b) return;
    state.date = b.dataset.date;
    state.departure = (byDate[state.date] || [])[0] || null;
    draw();
  });
  timesEl.addEventListener('click', e => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    state.departure = departures.find(d => d.id === b.dataset.id) || null;
    draw();
  });
  paxEl.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    const cat = +b.dataset.cat, d = +b.dataset.d;
    state.pax[cat] = Math.max(0, (state.pax[cat] || 0) + d);
    draw();
  });

  // ---- the handoff: fill the real Bókun cart, then pass to Bókun to pay ----
  cta.addEventListener('click', async () => {
    if (cta.disabled) return;
    if (isSnapshot) {
      errEl.hidden = false; errEl.style.color = 'var(--muted)';
      errEl.textContent = 'Booking runs on the server build, which signs Bókun requests. In this hosted preview the panel is read-only.';
      return;
    }
    const label = cta.innerHTML;
    cta.disabled = true; cta.textContent = 'Holding your seats…';
    errEl.hidden = true;
    try {
      const body = {
        activityId: id,
        rateId: state.departure.rateId,
        startTimeId: state.departure.startTimeId,
        date: state.departure.isoDate,
        categories: state.pax,
      };
      const r = await fetch(`/api/cart/${session}/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await r.json();
      if (!r.ok) throw new Error((data.detail && data.detail.fields && data.detail.fields.errorResponse) || data.error || 'Could not hold these seats.');
      cta.innerHTML = 'In your cart ✓';
      errEl.hidden = false;
      errEl.style.color = 'var(--muted)';
      errEl.textContent = `Held in cart ${data.sessionId} · ${data.lineCount} item(s) · ${isk(data.totalPrice)}. Bókun checkout is the next step.`;
      setTimeout(() => { cta.innerHTML = label; cta.disabled = false; }, 2600);
    } catch (err) {
      errEl.hidden = false; errEl.style.color = '#9A3412';
      errEl.textContent = String(err.message || err);
      cta.innerHTML = label; cta.disabled = false;
    }
  });
})();
