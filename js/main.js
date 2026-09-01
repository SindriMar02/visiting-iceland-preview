/* VISITING ICELAND - lakeview composition, vita-travel motion system (verbatim values,
   see _docs/vita-travel-teardown.md). All numbers computed from _data/*.json. */
(async function () {
  // The catalogue is fetched now but awaited LATER: the opening reveal must
  // start on the first frame, not after two JSON files land.
  const dataReady = Promise.all([
    fetch("_data/catalogue.json").then(r => r.json()),
    fetch("_data/places.json").then(r => r.json()),
  ]);

  // the film autoplays from the markup (src is declared there); the reveal only
  // nudges it back to the top so the hero starts on frame 0 = the loader's photo
  const heroVideo = document.getElementById("heroVideo");
  heroVideo.play().catch(() => {});
  const releaseVideo = () => {
    try { heroVideo.currentTime = 0; } catch (e) {}
    heroVideo.play().catch(() => {});
  };

  // ================= THE VITA MOTION SYSTEM (values verbatim) =================
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 767px)").matches;
  const motionOn = !reduced && !!window.gsap;
  if (!motionOn) {
    document.body.classList.remove("is-loading");
    const ld = document.getElementById("loader");
    if (ld) ld.classList.add("is-done");
  }

  const D = { dur: 0.8, dist: 40, ease: "power3.out", start: "top 88%" }; // vita defaults

  function st(el) {
    const s = new SplitText(el, { type: "lines", linesClass: "split-line" });
    s.lines.forEach(line => {
      const wrap = document.createElement("div");
      wrap.style.overflow = "hidden";
      line.parentNode.insertBefore(wrap, line);
      wrap.appendChild(line);
    });
    gsap.set(s.lines, { yPercent: 100 });
    return s;
  }
  const maskIn = (tl, split, at, d = 0.7, stag = 0.08) =>
    tl.to(split.lines, { yPercent: 0, duration: d, ease: D.ease, stagger: stag }, at);

  function typewriter(el) {
    const s = new SplitText(el, { type: "chars", charsClass: "tw-char" });
    gsap.set(s.chars, { opacity: 0 });
    return s;
  }
  const twIn = (tl, split, at) => {
    tl.to(split.chars, {
      keyframes: [
        { opacity: 0.4, duration: 0.06, ease: "none" },
        { opacity: 1, duration: 0.18, ease: "power1.out" },
      ],
      stagger: 0.03,
    }, at);
    return at + split.chars.length * 0.03 * 0.5;
  };

  const fadeUp = (tl, el, at, dist = 30, d = 0.8) => el && tl.fromTo(el, { opacity: 0, y: dist }, { opacity: 1, y: 0, duration: d, ease: D.ease }, at);
  const slideIn = (tl, el, at) => el && tl.fromTo(el, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.8, ease: D.ease }, at);
  const pop = (tl, el, at) => {
    if (!el) return;
    el.style.transition = "none"; // vita: kill CSS transition before GSAP touches a button
    tl.fromTo(el, { scale: 0, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 0.5, ease: "power2.out",
      clearProps: "transform,opacity",
      onComplete: () => { el.style.transition = ""; },
    }, at);
  };

  const claimed = new Set();
  function autoWire() {
    document.querySelectorAll("[data-lines], [data-fade-up], [data-tw], [data-pop]").forEach(el => {
      if (claimed.has(el)) return;
      claimed.add(el);
      if (el.hasAttribute("data-pop")) {
        gsap.set(el, { scale: 0, opacity: 0 });
        ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => { const tl = gsap.timeline(); pop(tl, el, 0); } });
        return;
      }
      if (mobile || el.hasAttribute("data-fade-up")) {
        gsap.set(el, { opacity: 0, y: 30 });
        ScrollTrigger.create({ trigger: el, start: D.start, once: true, onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: D.dur, ease: D.ease }) });
        return;
      }
      if (el.hasAttribute("data-tw")) {
        const s = typewriter(el);
        ScrollTrigger.create({ trigger: el, start: D.start, once: true, onEnter: () => { const tl = gsap.timeline(); twIn(tl, s, 0); } });
      } else {
        const s = st(el);
        ScrollTrigger.create({ trigger: el, start: D.start, once: true, onEnter: () => { const tl = gsap.timeline(); maskIn(tl, s, 0); } });
      }
    });
  }

  if (motionOn) {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  if (!mobile && matchMedia("(pointer: fine)").matches && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.11 }); // stands in for vita ScrollSmoother smooth:1.2
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ---------------- opening reveal: birtingaholt loader, values lifted verbatim ----------------
  // words rise 1.25/expo.inOut stagger .12 → box opens → frame grows to swallow → hero type rises
  const heroTl = gsap.timeline({ paused: true });
  heroTl.fromTo(".hero__nav > *", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: D.ease, stagger: 0.06 }, 0);
  fadeUp(heroTl, document.getElementById("heroChip"), 0.1, -40);
  const heroTitle = document.getElementById("heroTitle");
  if (!mobile) {
    const s = st(heroTitle);
    maskIn(heroTl, s, 0.25, 0.8);
  } else fadeUp(heroTl, heroTitle, 0.25);
  fadeUp(heroTl, document.getElementById("heroPara"), 0.75);
  pop(heroTl, document.getElementById("heroCta"), 0.9);

  (async function loader() {
    // wait for the loader's own face so the wordmark cannot swap from the
    // fallback serif in the middle of the reveal (capped, never blocks forever)
    try {
      await Promise.race([
        document.fonts && document.fonts.load('500 4rem "Newsreader"'),
        new Promise(r => setTimeout(r, 700)),
      ]);
    } catch (e) { /* proceed regardless */ }
    const el = document.getElementById("loader");
    if (!el) { document.body.classList.remove("is-loading"); heroTl.play(); return; }
    // the loader's photo layer is sized to the HERO FRAME's exact rect from the
    // start, so the box clips a crop identical to the hero video's object-fit
    // cover. The grow lands on that rect + radius, and the swap is a hard cut
    // between identical pixels: no fade, no size jump, no frame jump.
    const frameEl = document.querySelector(".hero.frame");
    const growEl = document.getElementById("loaderGrow");
    const boxEl = document.getElementById("loaderBox");
    const scrim = document.querySelector(".hero__scrim");

    // Phase 1 (the wordmark moment) happens on the loader's little photo window:
    // it never changes size, it OPENS by clip-path, and its image is positioned
    // to show the exact centre crop the hero shows - so it reads as a peephole
    // onto the page that is already behind it.
    const sizeWindow = () => {
      const fr = frameEl.getBoundingClientRect();
      const b = boxEl.getBoundingClientRect();
      gsap.set(".loader_frame", { width: fr.width, height: fr.height, x: -(fr.width - b.width) / 2, y: -(fr.height - b.height) / 2 });
    };
    sizeWindow();

    // Phase 2: the loader hands over BEFORE anything grows, and the expansion is
    // then performed on the REAL hero via clip-path - the pixels under the window
    // are the live film the whole way, so there is nothing to "snap" between.
    // Scrim, nav, chip, headline, paragraph and button ride the same timeline.
    // two-stage handoff: at `handoff` the loader's ground and window disappear
    // onto identical pixels, but the wordmark lives on and dissolves across the
    // expansion; `finish` removes the (empty, transparent) loader afterwards.
    const handoff = () => {
      document.body.classList.remove("is-loading");
      el.classList.add("is-handoff");
      releaseVideo();
      ScrollTrigger.refresh();
    };
    const finish = () => el.classList.add("is-done");

    const b0 = boxEl.getBoundingClientRect();
    const f0 = frameEl.getBoundingClientRect();
    // the window's rect expressed as an inset on the hero frame
    const insetStart = `inset(${((b0.top - f0.top) / f0.height * 100).toFixed(2)}% ${((f0.right - b0.right) / f0.width * 100).toFixed(2)}% ${((f0.bottom - b0.bottom) / f0.height * 100).toFixed(2)}% ${((b0.left - f0.left) / f0.width * 100).toFixed(2)}% round 8px)`;
    const insetEnd = `inset(0% 0% 0% 0% round ${getComputedStyle(frameEl).borderRadius})`;

    gsap.set(frameEl, { clipPath: insetStart });
    gsap.set(scrim, { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: "expo.inOut" } });
    tl.fromTo(".loader_word i", { yPercent: 100, y: 0 }, { yPercent: 0, duration: 1.25, stagger: 0.12 })  // y:0 is load-bearing: without it GSAP parses the CSS park as a base offset and doubles it
      .fromTo(growEl, { clipPath: "inset(0% 50% 0% 50% round 8px)" },
                      { clipPath: "inset(0% 0% 0% 0% round 8px)", duration: 1.25 }, "<1.05")
      .fromTo(".loader_word--a", { x: "0em" }, { x: "-0.6em", duration: 1.25 }, "<")
      .fromTo(".loader_word--b", { x: "0em" }, { x: "0.6em", duration: 1.25 }, "<")
      // hand over: loader disappears onto pixels that are already identical
      // the rise is done, so release the masks - the words must dissolve in the
      // open, not slide out of the clip that made the rise possible
      .set(".loader_word", { overflow: "visible" })
      .addLabel("open", ">0.12")                      // a beat on the composed wordmark
      .call(handoff, [], "open")
      // the hero itself opens; scrim, wordmark and type all ride this expansion
      .to(frameEl, { clipPath: insetEnd, duration: 1.8 }, "open")
      .to(scrim, { opacity: 1, duration: 1.4, ease: "power2.out" }, "open+=0.2")
      .to(".loader_word", { autoAlpha: 0, duration: 1.15, ease: "power1.inOut" }, "open-=0.3")
      .to(".loader_word--a", { x: "-1.05em", duration: 1.6, ease: "power2.inOut" }, "open")
      .to(".loader_word--b", { x: "1.05em", duration: 1.6, ease: "power2.inOut" }, "open")
      .call(() => heroTl.play(), [], "open+=0.55")
      .call(finish, [], "open+=1.2");
    // never let the curtain hold the page hostage (birtingaholt failsafe)
    gsap.delayedCall(9, () => { if (document.body.classList.contains("is-loading")) { tl.progress(1, false); } });
  })();
  }

  // ---- the catalogue: everything below needs data ----
  const [catalogue, places] = await dataReady;

  // ---------------- data prep ----------------
  const seen = new Set();
  const products = catalogue.filter(p => !seen.has(p.id) && seen.add(p.id));

  const VENDOR_SHORT = {
    "Icelimo Luxury Travel": "Icelimo",
    "Norðurflug Helicopter Tours": "Norðurflug",
    "Reykjavik Sailors": "Reykjavik Sailors",
    "IceTransfer.is": "IceTransfer",
    "Skemmtigarðurinn Grafarvogi": "Skemmtigarðurinn",
    "Action Adventures": "Action Adventures",
  };
  const isk = n => n.toLocaleString("en-US").replace(/,/g, ".") + " ISK";
  const dur = s => {
    if (!s) return null;
    const d = /(\d+)\s*day/i.exec(s), h = /(\d+(?:\.\d+)?)\s*hour/i.exec(s), m = /(\d+)\s*min/i.exec(s);
    const parts = [];
    if (d) parts.push(d[1] + (d[1] === "1" ? " day" : " days"));
    if (h) parts.push(h[1] + " h");
    if (m) parts.push(m[1] + " min");
    return parts.join(" ") || s;
  };
  const photo = (p, w) => p.keyPhoto ? p.keyPhoto.replace(/\?.*/, `?w=${w}`) : null;
  const meta = id => places.products[id] || { departure: null, destinations: [] };
  const depLabel = id => { const d = meta(id).departure; return d ? places.departures[d].label : null; };
  // Supplier photos with a visible watermark or photographer credit burned into
  // the frame. Verified by eye; never surface these. Ómar should ask the
  // operators for clean files (see _docs/visiting-iceland-booking-scope.md).
  const WATERMARKED = new Set([
    4772,    // Glacier Lagoon Expedition , "NORÐURFLUG" + Islandsmyndir.is
    2905,    // Essential Iceland , "© Rafn S…" lower right
    6979,    // Northern Lights ATV , ATV operator mark
    1391,    // Reykjavik Summit , NORÐURFLUG + Islandsmyndir.is
    4770,    // Fire & Ice , NORÐURFLUG + Islandsmyndir.is
    336790,  // Hunting Film Locations , "NEW TOUR" banner + NORÐURFLUG
  ]);       // clean Norðurflug frames verified by eye: 1406, 2930, 1407
  const used = new Set(WATERMARKED);
  const claim = p => { used.add(p.id); return p; };

  // ---------------- media assignments (all real supplier photos, no repeats) ----------------
  const byId = id => products.find(p => p.id === id);
  const heroPick = claim(byId(1035949));                    // Kirkjufell sunset , the film's still
  const ctaPick = claim(byId(880412));                      // humpbacks off Reykjavík
  const aboutTall = claim(byId(679628));                    // Golden Circle luxury
  const aboutPair = [claim(byId(853811)), claim(byId(1035331))]; // Akureyri whales · Silver Circle
  const whyPicks = [claim(byId(6937)), claim(byId(1030324))];    // Superview ATV · Glacier lagoon

  document.getElementById("aboutTall").innerHTML = `<img src="${photo(aboutTall, 1200)}" alt="${aboutTall.title.trim()}, by ${aboutTall.vendor}" loading="lazy" width="900" height="1000">`;
  document.getElementById("aboutPair").innerHTML = aboutPair.map(p =>
    `<figure><img src="${photo(p, 800)}" alt="${p.title.trim()}, by ${p.vendor}" loading="lazy" width="600" height="490"></figure>`).join("");
  document.getElementById("whyPhotos").innerHTML = whyPicks.map(p =>
    `<figure><img src="${photo(p, 800)}" alt="${p.title.trim()}, by ${p.vendor}" loading="lazy" width="600" height="500"></figure>`).join("");
  document.getElementById("ctaMedia").innerHTML = `<img src="${photo(ctaPick, 2400)}" alt="${ctaPick.title.trim()}, by ${ctaPick.vendor}" loading="lazy" width="2400" height="1600">`;

  // ---------------- destinations: honest region tiles in lakeview's asymmetric rows ----------------
  const REGIONS = [
    { id: "capital", label: "Reykjavík & the Capital" },
    { id: "golden-circle", label: "Golden Circle" },
    { id: "south", label: "South Coast" },
    { id: "reykjanes", label: "Reykjanes & Blue Lagoon" },
    { id: "west", label: "Snæfellsnes & the West" },
    { id: "north", label: "Akureyri & the North" },
    { id: "westfjords", label: "Westfjords" },
    { id: "east", label: "East Iceland" },
  ];
  const destRegion = d => places.destinations[d].region;
  const regionProducts = {};
  for (const r of REGIONS) regionProducts[r.id] = [];
  for (const p of products) {
    const regs = new Set(meta(p.id).destinations.map(destRegion));
    for (const r of regs) if (regionProducts[r]) regionProducts[r].push(p);
  }
  const usedCovers = new Set();
  const cover = rid => {
    const pool = regionProducts[rid].filter(p => p.keyPhoto && !used.has(p.id));
    pool.sort((a, b) => (a.categories || []).includes("TRANSFERS_AND_GROUND_TRANSPORT") - (b.categories || []).includes("TRANSFERS_AND_GROUND_TRANSPORT"));
    const pick = pool.find(p => !usedCovers.has(p.keyPhoto)) || pool[0];
    if (!pick) return null;
    usedCovers.add(pick.keyPhoto);
    return photo(pick, 1100);
  };
  // Tiles are ordered by catalogue size (the wide slot goes to the biggest
  // region, so the asymmetry carries information). A region only earns a tile
  // if its operators have published a photograph - Westfjords' single tour has
  // none, so it lives in the catalogue rather than as a blank hero tile.
  const regions = REGIONS
    .filter(r => regionProducts[r.id].length > 0)
    .sort((a, b) => regionProducts[b.id].length - regionProducts[a.id].length)
    .map(r => ({ ...r, cov: cover(r.id) }))
    .filter(r => r.cov);
  const tileHTML = r => {
    const n = regionProducts[r.id].length;
    return `<a class="tile" href="#catalogue" aria-label="${r.label}">
      <img src="${r.cov}" alt="" loading="lazy" width="800" height="600">
      <span class="tile__label"><b>${r.label}</b><span>${n} ${n === 1 ? "experience" : "experiences"}</span></span>
      <span class="tile__go" aria-hidden="true">→</span>
    </a>`;
  };
  // Row A takes the three biggest regions (wide slot first); everything left
  // shares one row, so a remainder can never be orphaned in a row of its own.
  const rows = regions.length <= 4 ? [regions] : [regions.slice(0, 3), regions.slice(3)];
  document.getElementById("tiles").innerHTML = rows.map((row, i) =>
    row.length
      ? `<div class="tiles__row tiles__row--${i === 0 ? "a" : "b"}" style="--cols:${row.length}">${row.map(tileHTML).join("")}</div>`
      : "").join("");

  // ---------------- counters (real, lakeview "N +" grammar) ----------------
  const operators = [...new Set(products.map(p => p.vendor))];
  const depSet = new Set(Object.values(places.products).map(x => x.departure).filter(Boolean));
  document.getElementById("counters").innerHTML = [
    [products.length, true, "experiences you can book"],
    [operators.length, false, "Icelandic operators"],
    [depSet.size, false, "departure points"],
  ].map(([n, plus, label]) => `<div><dd data-count="${n}">0${plus ? ' <span class="plus">+</span>' : ""}</dd><dt>${label}</dt></div>`).join("");

  // ---------------- experience cards: lakeview grid × vita featured internals ----------------
  const ICONS = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M12 21s-6.5-5.4-6.5-10.2a6.5 6.5 0 1 1 13 0C18.5 15.6 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 6a3 3 0 1 1 0 6M16 13.6a5.5 5.5 0 0 1 4.5 5.4"/></svg>',
  };
  const pool = products.filter(p => p.keyPhoto && !used.has(p.id));
  const byVendor = {};
  pool.forEach(p => (byVendor[p.vendor] = byVendor[p.vendor] || []).push(p));
  Object.values(byVendor).forEach(l => l.sort((a, b) => b.photos - a.photos));
  const featured = [];
  let added = true;
  while (featured.length < 7 && added) {
    added = false;
    for (const v of Object.keys(byVendor)) {
      const next = byVendor[v].shift();
      if (next && featured.length < 7) { featured.push(claim(next)); added = true; }
    }
  }
  const cardHTML = p => {
    const props = [
      [ICONS.pin, depLabel(p.id)],
      [ICONS.clock, dur(p.durationText)],
      [ICONS.users, VENDOR_SHORT[p.vendor] || p.vendor],
    ].filter(x => x[1]);
    return `<a class="card" href="tour/${p.id}/">
      <div class="card__photo"><img src="${photo(p, 900)}" alt="${p.title.trim()}" loading="lazy" width="600" height="450"></div>
      <div class="card__body">
        <h3 class="card__title" data-card-title>${p.title.trim()}</h3>
        <p class="card__cost" data-card-cost><span class="from">from</span> <span class="price">${isk(p.price)}</span></p>
        <div class="card__props">
          ${props.map(([ic, t]) => `<span class="card__prop" data-card-prop><span class="t">${t}</span>${ic}</span>`).join("")}
        </div>
        <span class="card__btn" data-card-btn><span class="card__btn-label">Explore<span class="btn-word"> experience</span></span><span class="arr">→</span></span>
      </div>
    </a>`;
  };
  document.getElementById("cards").innerHTML = featured.map(cardHTML).join("") +
    `<div class="card card--all" data-card-all>
      <div>
        <p class="eyebrow-plain">The full guide</p>
        <h3>All ${products.length} experiences</h3>
        <p>Every region, every operator, in one catalogue.</p>
      </div>
      <a class="btn btn--ink" href="#top">Open the catalogue <span class="arr">→</span></a>
    </div>`;

  // ---------------- "or start with what": real category routes, real counts ----------------
  const KINDS = [
    { label: "Whale watching", ids: ["DOLPHIN_OR_WHALEWATCHING"] },
    { label: "Helicopter tours", ids: ["AIR_OR_HELICOPTER_TOUR"] },
    { label: "Day trips", ids: ["DAY_TRIPS_AND_EXCURSIONS"] },
    { label: "Airport transfers", ids: ["TRANSFERS_AND_GROUND_TRANSPORT"] },
  ];
  const inKind = (p, k) => (p.categories || []).some(c => k.ids.includes(c));
  document.getElementById("kinds").innerHTML = KINDS.map(k => {
    const list = products.filter(p => inKind(p, k));
    if (!list.length) return "";
    const withPhoto = list.filter(p => p.keyPhoto).sort((a, b) => b.photos - a.photos);
    const thumb = withPhoto[0] ? photo(withPhoto[0], 200) : null;
    return `<a class="kind" href="#catalogue" data-kind>
      ${thumb ? `<img src="${thumb}" alt="" loading="lazy" width="72" height="72">` : ""}
      <span class="kind__t">${k.label}</span>
      <span class="kind__n">${list.length}</span>
    </a>`;
  }).join("");

  // ---------------- operators: photographed cards, not a ledger ----------------
  const opRows = operators.map(v => {
    const list = products.filter(p => p.vendor === v);
    const freq = {};
    list.map(p => depLabel(p.id)).filter(Boolean).forEach(d => freq[d] = (freq[d] || 0) + 1);
    // what this operator is actually for, from their own catalogue
    const catFreq = {};
    list.forEach(p => (p.categories || []).forEach(c => { if (typeof c === "string") catFreq[c] = (catFreq[c] || 0) + 1; }));
    // Specific beats generic: "Whale watching" is the truth about Reykjavik
    // Sailors, even though the generic DAY_TRIPS bucket counts one higher.
    const NICE = {
      DOLPHIN_OR_WHALEWATCHING: ["Whale watching", 3],
      AIR_OR_HELICOPTER_TOUR: ["Helicopter tours", 3],
      ATV_OR_QUAD_TOUR: ["ATV adventures", 3],
      BIRDWATCHING: ["Puffins & birds", 3],
      SAILING_OR_BOAT_TOUR: ["Boat tours", 2],
      TRANSFERS_AND_GROUND_TRANSPORT: ["Airport transfers", 2],
      PRIVATE_CAR_TOUR: ["Private tours", 2],
      DAY_TRIPS_AND_EXCURSIONS: ["Day trips", 1],
      ADVENTURE: ["Adventure", 1], NATURE: ["Nature", 1],
    };
    // A tag only describes the operator if it covers most of their catalogue.
    // Icelimo carries a stray helicopter tag on 2 of 41 products; without this
    // share test a luxury car company gets labelled "Helicopter tours".
    const major = Object.entries(catFreq)
      .filter(([c, n]) => NICE[c] && n / list.length >= 0.5);
    const speciality = (major.length ? major : Object.entries(catFreq).filter(([c]) => NICE[c]))
      .sort((a, b) => (NICE[b[0]][1] - NICE[a[0]][1]) || (b[1] - a[1]))[0];
    const pool = list.filter(p => p.keyPhoto && !WATERMARKED.has(p.id)).sort((a, b) => b.photos - a.photos);
    const pic = pool.find(p => !usedCovers.has(p.keyPhoto)) || pool[0];
    if (pic) usedCovers.add(pic.keyPhoto);
    return {
      v, n: list.length,
      from: Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "",
      speciality: speciality ? NICE[speciality[0]][0] : null,
      photo: pic ? photo(pic, 700) : null,
    };
  }).sort((a, b) => b.n - a.n);

  document.getElementById("operatorsList").innerHTML = opRows.map(r =>
    `<li class="op">
      <div class="op__photo">${r.photo
        ? `<img src="${r.photo}" alt="A ${r.v} experience" loading="lazy" width="600" height="420">`
        : `<span class="op__nophoto">${r.v}</span>`}</div>
      <div class="op__body">
        <b data-lines>${r.v}</b>
        <p class="op__meta">
          <span class="mono">${r.n} ${r.n === 1 ? "experience" : "experiences"}</span>
          ${r.speciality ? `<span class="mono">${r.speciality}</span>` : ""}
          ${r.from ? `<span class="mono">${r.from}</span>` : ""}
        </p>
      </div>
    </li>`).join("");

  // ---------------- gallery: moving parallax columns (21st.dev 1224 behaviour) ----------------
  const galleryPicks = products
    .filter(p => p.keyPhoto && p.photos >= 3 && !used.has(p.id) && !usedCovers.has(p.keyPhoto))
    .sort((a, b) => b.photos - a.photos);
  // TWELVE: divisible by 2 for the mobile row grid (6 full rows) and by 3 for
  // the desktop parallax columns (4 each), so neither layout strands a photo.
  const GAL_N = 12;
  const byV = {}; const gal = [];
  for (const p of galleryPicks) {
    byV[p.vendor] = (byV[p.vendor] || 0) + 1;
    if (byV[p.vendor] <= 3 && gal.length < GAL_N) gal.push(p);
  }
  const galFig = (p, tall) =>
    `<figure class="gallery__item"><img src="${photo(p, 900)}" alt="${p.title.trim()}, by ${p.vendor}" loading="lazy" width="600" height="${tall ? 760 : 440}"></figure>`;
  // Every column gets the SAME tall/short rhythm, so the three desktop columns
  // are equal height by construction rather than by luck. Balancing them by a
  // greedy fill did not converge and left dead space under the short columns.
  const cols = [[], [], []];
  gal.forEach((p, i) => cols[i % 3].push(p));
  document.getElementById("galleryGrid").innerHTML = cols.map((col, c) =>
    `<div class="gallery__col" data-col="${c}">${col.map((p, r) => galFig(p, r % 2 === 1)).join("")}</div>`).join("");

  // ---------------- chrome ----------------
  const burger = document.getElementById("burger");
  const menu = document.getElementById("mobileMenu");
  const setMenu = open => {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  menu.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false); });

  // page nav slides in past the hero (IO sentinel, no scroll listener)
  const pageNav = document.getElementById("pageNav");
  const hero = document.querySelector(".hero");
  new IntersectionObserver(([en]) => {
    pageNav.classList.toggle("is-visible", !en.isIntersecting);
    pageNav.setAttribute("aria-hidden", String(en.isIntersecting));
  }, { rootMargin: "-80px 0px 0px 0px" }).observe(hero);

  if (!motionOn) {
    document.querySelectorAll("[data-count]").forEach(el => {
      el.innerHTML = el.innerHTML.replace(/^0/, el.dataset.count);
    });
    return;
  }

  // ---------------- the flow layer: everything drifts with scroll (no pinning) ----------------
  // hero headline rises and thins as the hero leaves; media breathes behind it
  const heroScrub = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
  gsap.to(".hero__center", { yPercent: -36, opacity: 0.25, ease: "none", scrollTrigger: heroScrub });
  gsap.to(".hero__foot", { yPercent: -60, opacity: 0, ease: "none", scrollTrigger: heroScrub });
  gsap.fromTo(".hero__media", { yPercent: 0 }, { yPercent: 10, ease: "none", scrollTrigger: heroScrub });
  if (!mobile) {
    const drift = (sel, from, to, trig) => document.querySelector(sel) && gsap.fromTo(sel, { y: from }, {
      y: to, ease: "none",
      scrollTrigger: { trigger: trig || sel, start: "top bottom", end: "bottom top", scrub: true },
    });
    drift("#aboutTall", 50, -50);
    drift("#aboutPair", -30, 30, ".about");
    drift(".why__photos", 40, -40, ".why");
    gsap.fromTo(".cta__media", { yPercent: -8 }, { yPercent: 8, ease: "none",
      scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo("#footerGiant", { yPercent: 24 }, { yPercent: 0, ease: "none",
      scrollTrigger: { trigger: "#footer", start: "top bottom", end: "bottom bottom", scrub: true } });
  }

  // footer statement: the giant wordmark is lit by the pointer (Cocoon lineage)
  if (matchMedia("(pointer: fine)").matches) {
    const foot = document.getElementById("footer");
    const giant = document.getElementById("footerGiant");
    foot.addEventListener("pointermove", e => {
      const r = giant.getBoundingClientRect();
      giant.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      giant.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    });
  }

  // ---------------- destinations: section timeline, tiles as vita items ----------------
  {
    const sec = document.getElementById("destinations");
    const h2 = sec.querySelector("[data-tw]");
    const sub = sec.querySelector(".head-sub");
    const tiles = [...sec.querySelectorAll(".tile")];
    claimed.add(h2); claimed.add(sub);
    const tw = mobile ? null : typewriter(h2);
    if (mobile) gsap.set(h2, { opacity: 0, y: 30 });
    gsap.set(sub, { opacity: 0, y: 30 });
    gsap.set(tiles, { opacity: 0, y: 40 });
    tiles.forEach(t => { const img = t.querySelector("img"); img && gsap.set(img, { scale: 1.1 }); });
    ScrollTrigger.create({
      trigger: sec, start: D.start, once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        let at = 0;
        if (tw) at = twIn(tl, tw, 0); else { fadeUp(tl, h2, 0); at = 0.3; }
        fadeUp(tl, sub, at);
        tiles.forEach((t, i) => {
          tl.to(t, { opacity: 1, y: 0, duration: D.dur, ease: D.ease }, at + 0.15 + 0.1 * i);
          const img = t.querySelector("img");
          img && tl.to(img, { scale: 1, duration: 1.1, ease: D.ease }, at + 0.15 + 0.1 * i);
        });
      },
    });
  }

  // ---------------- about: masks + visuals x:-40 + counters count-up ----------------
  {
    const sec = document.querySelector(".about");
    const h2 = sec.querySelector("h2[data-lines]");
    claimed.add(h2);
    const h2s = mobile ? null : st(h2);
    if (mobile) gsap.set(h2, { opacity: 0, y: 30 });
    const tall = document.getElementById("aboutTall");
    const pair = [...document.querySelectorAll("#aboutPair figure")];
    const para = document.getElementById("aboutLede");
    const cta = sec.querySelector(".btn");
    const items = [...sec.querySelectorAll(".counters div")];
    gsap.set([tall, ...pair], { opacity: 0, x: -40 });
    gsap.set(para, { opacity: 0, y: 30 });
    gsap.set(items, { opacity: 0, y: 30 });
    claimed.add(cta);
    ScrollTrigger.create({
      trigger: sec, start: D.start, once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        h2s ? maskIn(tl, h2s, 0, 0.8) : fadeUp(tl, h2, 0);
        pair.forEach((f, i) => slideIn(tl, f, 0.15 + 0.15 * i));
        slideIn(tl, tall, 0.3);
        fadeUp(tl, para, 0.45);
        pop(tl, cta, 0.6);
        items.forEach((it, i) => {
          tl.to(it, { opacity: 1, y: 0, duration: 0.6, ease: D.ease }, 0.7 + 0.3 * i);
          const dd = it.querySelector("[data-count]");
          const target = +dd.dataset.count;
          tl.call(() => gsap.to({ v: 0 }, {
            v: target, duration: 1.2, ease: "power3.out",
            onUpdate() { dd.firstChild.textContent = Math.round(this.targets()[0].v); },
          }), [], 0.7 + 0.3 * i);
        });
      },
    });
  }

  // ---------------- experience cards: vita featured mt() recipe, verbatim offsets ----------------
  {
    const sec = document.getElementById("catalogue");
    const cards = [...sec.querySelectorAll(".card:not(.card--all)")];
    const allCell = sec.querySelector("[data-card-all]");
    const parts = cards.map(c => {
      const photoEl = c.querySelector(".card__photo");
      const img = c.querySelector(".card__photo img");
      const title = c.querySelector("[data-card-title]");
      const cost = c.querySelector("[data-card-cost]");
      const props = [...c.querySelectorAll("[data-card-prop]")];
      const btn = c.querySelector("[data-card-btn]");
      gsap.set(photoEl, { opacity: 0, x: -40 });
      img && gsap.set(img, { scale: 1.08 });
      gsap.set(cost, { opacity: 0, y: 20 });
      gsap.set(props, { opacity: 0, y: 20 });
      btn.style.transition = "none";
      gsap.set(btn, { scale: 0, opacity: 0, transformOrigin: "center center" });
      const titleSplit = mobile ? null : st(title);
      if (mobile) gsap.set(title, { opacity: 0, y: 20 });
      return { photoEl, img, title, titleSplit, cost, props, btn };
    });
    if (allCell) gsap.set(allCell, { opacity: 0, y: 40 });
    // vita mt(): head at t, cost t+0.1, illustration t+0.1, props t+0.2 stagger .08, button after props
    const run = (p, tl, at) => {
      p.titleSplit ? maskIn(tl, p.titleSplit, at, 0.7) : fadeUp(tl, p.title, at, 20, 0.6);
      tl.to(p.cost, { opacity: 1, y: 0, duration: 0.6, ease: D.ease }, at + 0.1);
      tl.to(p.photoEl, { opacity: 1, x: 0, duration: 0.8, ease: D.ease }, at + 0.1);
      p.img && tl.to(p.img, { scale: 1, duration: 1.1, ease: D.ease }, at + 0.1);
      tl.to(p.props, { opacity: 1, y: 0, duration: 0.6, ease: D.ease, stagger: 0.08 }, at + 0.2);
      tl.to(p.btn, { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out", onComplete: () => { p.btn.style.transition = ""; } }, at + 0.2 + 0.08 * p.props.length);
    };
    if (mobile) {
      parts.forEach((p, i) => ScrollTrigger.create({
        trigger: cards[i], start: "top 90%", once: true,
        onEnter: () => { const tl = gsap.timeline(); run(p, tl, 0); },
      }));
      allCell && ScrollTrigger.create({ trigger: allCell, start: "top 90%", once: true, onEnter: () => gsap.to(allCell, { opacity: 1, y: 0, duration: D.dur, ease: D.ease }) });
    } else {
      ScrollTrigger.create({
        trigger: sec.querySelector(".cards"), start: D.start, once: true,
        onEnter: () => {
          const tl = gsap.timeline();
          parts.forEach((p, i) => run(p, tl, 0.15 * i)); // vita: items staggered 0.15
          allCell && tl.to(allCell, { opacity: 1, y: 0, duration: D.dur, ease: D.ease }, 0.15 * parts.length);
        },
      });
    }
  }

  // ---------------- why: photos x:-40, cards rise staggered ----------------
  {
    const sec = document.querySelector(".why");
    const photos = [...sec.querySelectorAll(".why__photos figure")];
    const cards = [...sec.querySelectorAll("[data-reveal-card]")];
    gsap.set(photos, { opacity: 0, x: -40 });
    gsap.set(cards, { opacity: 0, y: 30 });
    ScrollTrigger.create({
      trigger: sec, start: D.start, once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        photos.forEach((f, i) => slideIn(tl, f, 0.15 * i));
        cards.forEach((c, i) => tl.to(c, { opacity: 1, y: 0, duration: 0.7, ease: D.ease }, 0.4 + 0.2 * i));
      },
    });
  }

  // ---------------- operators: vita practitioners order ----------------
  {
    const sec = document.getElementById("operators");
    const h2 = sec.querySelector("[data-tw]");
    const sub = sec.querySelector(".head-sub");
    claimed.add(h2); claimed.add(sub);
    const tw = mobile ? null : typewriter(h2);
    if (mobile) gsap.set(h2, { opacity: 0, y: 30 });
    gsap.set(sub, { opacity: 0, y: 30 });
    const rowEls = [...sec.querySelectorAll(".operators__row")].map(row => {
      const rule = row.querySelector(".row-rule");
      const name = row.querySelector("b[data-lines]");
      const monos = [...row.querySelectorAll(".mono[data-fade-up]")];
      claimed.add(name); monos.forEach(m => claimed.add(m));
      gsap.set(rule, { scaleX: 0 });
      gsap.set(monos, { opacity: 0, y: 20 });
      const nameSplit = mobile ? null : st(name);
      if (mobile) gsap.set(name, { opacity: 0, y: 20 });
      return { rule, name, nameSplit, monos };
    });
    ScrollTrigger.create({
      trigger: sec, start: D.start, once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        let at = 0;
        if (tw) at = twIn(tl, tw, 0); else { fadeUp(tl, h2, 0); at = 0.3; }
        fadeUp(tl, sub, at);
        rowEls.forEach((r, i) => {
          const o = at + 0.2 + 0.2 * i;
          tl.to(r.rule, { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, o);
          r.nameSplit ? maskIn(tl, r.nameSplit, o + 0.1, 0.7, 0.06) : fadeUp(tl, r.name, o + 0.1, 20, 0.7);
          tl.to(r.monos, { opacity: 1, y: 0, duration: 0.6, ease: D.ease, stagger: 0.08 }, o + 0.2);
        });
      },
    });
  }

  // ---------------- gallery: entrance (vita presets) + moving parallax columns ----------------
  [...document.querySelectorAll(".gallery__item")].forEach((el, i) => {
    // a 200px offset leaves visible holes in the mobile masonry while items wait
    // their turn, so phones get a gentler rise
    const big = i % 2 === 0;
    gsap.set(el, mobile ? { opacity: 0, y: 24 }
                        : (big ? { opacity: 0, y: 200 } : { opacity: 0, scale: 0.85 }));
    ScrollTrigger.create({
      trigger: el, start: "top 92%", once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: D.dur, ease: D.ease }),
    });
  });
  // columns drift in opposite directions with scroll (scrubbed transform, no pin)
  if (!mobile) {
    const grid = document.getElementById("galleryGrid");
    [...grid.querySelectorAll(".gallery__col")].forEach((col, c) => {
      const dir = c === 1 ? 1 : -1; // outer columns rise, middle sinks
      gsap.fromTo(col, { y: 100 * dir * -1 }, {
        y: 100 * dir, ease: "none",
        scrollTrigger: { trigger: grid, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }

  // ---------------- everything else + anchors ----------------
  autoWire();

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    });
  });
})();
